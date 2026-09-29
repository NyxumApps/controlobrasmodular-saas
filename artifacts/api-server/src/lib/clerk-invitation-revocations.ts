import { randomUUID } from "node:crypto";
import { and, asc, eq, lte } from "drizzle-orm";
import { auditEventsTable, companyInvitationsTable, db } from "@workspace/db";
import { logger } from "./logger";

const batchSize = 20;
const leaseMs = 2 * 60 * 1000;
const baseDelayMs = 60 * 1000;
const maxDelayMs = 6 * 60 * 60 * 1000;
const persistentFailureThreshold = 5;

type RevocationCandidate = {
  id: string;
  companyId: string;
  clerkInvitationId: string | null;
  clerkRevocationAttempts: number;
};

type RevocationWorkerDependencies = {
  revokeClerkInvitation: (id: string) => Promise<unknown>;
  now?: () => Date;
};

function retryDelayMs(attempt: number): number {
  return Math.min(baseDelayMs * 2 ** Math.max(0, attempt - 1), maxDelayMs);
}

function clerkConfirmsMissing(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const value = error as { status?: unknown; statusCode?: unknown };
  return value.status === 404 || value.statusCode === 404;
}

function safeErrorSummary(error: unknown): string {
  if (!error || typeof error !== "object") return "Clerk revocation failed";
  const value = error as { status?: unknown; statusCode?: unknown; code?: unknown };
  const status = value.status ?? value.statusCode;
  const parts = [
    typeof status === "number" ? `status=${status}` : null,
    typeof value.code === "string" ? `code=${value.code.slice(0, 80)}` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Clerk revocation failed";
}

async function claimCandidates(now: Date): Promise<RevocationCandidate[]> {
  return db.transaction(async tx => {
    const candidates = await tx.select({
      id: companyInvitationsTable.id,
      companyId: companyInvitationsTable.companyId,
      clerkInvitationId: companyInvitationsTable.clerkInvitationId,
      clerkRevocationAttempts: companyInvitationsTable.clerkRevocationAttempts,
    }).from(companyInvitationsTable).where(and(
      eq(companyInvitationsTable.clerkRevocationPending, true),
      lte(companyInvitationsTable.clerkRevocationNextAttemptAt, now),
    )).orderBy(asc(companyInvitationsTable.clerkRevocationNextAttemptAt)).limit(batchSize).for("update", {
      skipLocked: true,
    });

    if (candidates.length === 0) return [];
    const leaseUntil = new Date(now.getTime() + leaseMs);
    for (const candidate of candidates) {
      await tx.update(companyInvitationsTable).set({
        clerkRevocationNextAttemptAt: leaseUntil,
        clerkRevocationLastAttemptAt: now,
      }).where(and(
        eq(companyInvitationsTable.id, candidate.id),
        eq(companyInvitationsTable.clerkRevocationPending, true),
      ));
    }
    return candidates;
  });
}

export async function processClerkInvitationRevocations(
  dependencies: RevocationWorkerDependencies,
): Promise<{ processed: number; succeeded: number; failed: number }> {
  const now = dependencies.now?.() ?? new Date();
  const candidates = await claimCandidates(now);
  let succeeded = 0;
  let failed = 0;

  for (const candidate of candidates) {
    try {
      if (candidate.clerkInvitationId) {
        await dependencies.revokeClerkInvitation(candidate.clerkInvitationId);
      }
      await db.update(companyInvitationsTable).set({
        clerkRevocationPending: false,
        clerkRevocationNextAttemptAt: null,
        clerkRevocationLastError: null,
      }).where(and(
        eq(companyInvitationsTable.id, candidate.id),
        eq(companyInvitationsTable.clerkRevocationPending, true),
      ));
      succeeded += 1;
    } catch (error) {
      if (clerkConfirmsMissing(error)) {
        await db.update(companyInvitationsTable).set({
          clerkRevocationPending: false,
          clerkRevocationNextAttemptAt: null,
          clerkRevocationLastError: null,
        }).where(eq(companyInvitationsTable.id, candidate.id));
        succeeded += 1;
        continue;
      }

      const attempts = candidate.clerkRevocationAttempts + 1;
      const errorSummary = safeErrorSummary(error);
      const nextAttemptAt = new Date(now.getTime() + retryDelayMs(attempts));
      await db.transaction(async tx => {
        await tx.update(companyInvitationsTable).set({
          clerkRevocationAttempts: attempts,
          clerkRevocationNextAttemptAt: nextAttemptAt,
          clerkRevocationLastError: errorSummary,
        }).where(and(
          eq(companyInvitationsTable.id, candidate.id),
          eq(companyInvitationsTable.clerkRevocationPending, true),
        ));
        if (attempts === persistentFailureThreshold) {
          await tx.insert(auditEventsTable).values({
            id: `audit-${randomUUID()}`,
            companyId: candidate.companyId,
            actorUserId: "system",
            action: "invitation.revocation_retry_failed",
            targetId: candidate.id,
            details: { attempts, error: errorSummary },
          });
        }
      });
      logger.error({
        err: error,
        invitationId: candidate.id,
        attempts,
        nextAttemptAt,
      }, "Clerk invitation revocation retry failed");
      failed += 1;
    }
  }

  return { processed: candidates.length, succeeded, failed };
}