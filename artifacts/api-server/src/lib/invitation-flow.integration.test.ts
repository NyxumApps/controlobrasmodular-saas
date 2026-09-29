import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import { and, eq, inArray } from "drizzle-orm";
import {
  companiesTable,
  companyInvitationsTable,
  db,
  membershipsTable,
} from "@workspace/db";
import { hashInvitationToken } from "./invitation-security";
import { createInvitationsRouter } from "../routes/invitations";

test("invitation acceptance covers signed-in, wrong-account, expiry, and replay safely", async () => {
  const suffix = randomUUID();
  const companyId = `invite-company-${suffix}`;
  const intendedUser = `invite-user-${suffix}`;
  const wrongUser = `wrong-user-${suffix}`;
  const signedOutUser = `signed-out-${suffix}`;
  const intendedEmail = `invite-${suffix}@example.com`;
  const validToken = `valid-${suffix}`;
  const expiredToken = `expired-${suffix}`;
  const invitationIds = [`valid-invite-${suffix}`, `expired-invite-${suffix}`];
  const userEmails = new Map([
    [intendedUser, [intendedEmail]],
    [wrongUser, [`wrong-${suffix}@example.com`]],
    [signedOutUser, [intendedEmail]],
  ]);

  await db.insert(companiesTable).values({ id: companyId, name: "Empresa invitada" });
  await db.insert(companyInvitationsTable).values([
    {
      id: invitationIds[0],
      companyId,
      email: intendedEmail,
      role: "office",
      tokenHash: hashInvitationToken(validToken),
      invitedByClerkUserId: `owner-${suffix}`,
      expiresAt: new Date(Date.now() + 60_000),
    },
    {
      id: invitationIds[1],
      companyId,
      email: intendedEmail,
      role: "site_manager",
      tokenHash: hashInvitationToken(expiredToken),
      invitedByClerkUserId: `owner-${suffix}`,
      expiresAt: new Date(Date.now() - 60_000),
    },
  ]);

  const app = express();
  app.use(express.json());
  app.use("/api", createInvitationsRouter({
    getUserId: req => req.header("x-test-user-id") ?? null,
    getVerifiedEmails: async userId => userEmails.get(userId) ?? [],
    seedCompany: async () => {},
    authenticate: (_req, _res, next) => next(),
    sendInvitationEmail: async () => {},
  }));
  const server = app.listen(0);
  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const address = server.address();
  assert(address && typeof address === "object");

  const accept = async (token: string, userId?: string) => {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/invitations/accept`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(userId ? { "x-test-user-id": userId } : {}),
      },
      body: JSON.stringify({ token }),
    });
    return { status: response.status, body: await response.json() as Record<string, string> };
  };
  const membershipCount = async () =>
    (await db.select().from(membershipsTable).where(eq(membershipsTable.companyId, companyId))).length;

  try {
    assert.equal((await accept(validToken)).status, 401, "new or existing signed-out users must authenticate first");
    assert.equal(await membershipCount(), 0);

    assert.equal((await accept(validToken, wrongUser)).status, 409, "wrong-email accounts are rejected");
    assert.equal(await membershipCount(), 0);

    assert.equal((await accept(expiredToken, signedOutUser)).status, 409, "expired invitations are rejected");
    assert.equal(await membershipCount(), 0);

    const accepted = await accept(validToken, intendedUser);
    assert.equal(accepted.status, 200, "an already signed-in intended user can accept");
    assert.equal(accepted.body.companyId, companyId, "the intended company drives dashboard bootstrap");
    assert.equal(await membershipCount(), 1);

    assert.equal((await accept(validToken, intendedUser)).status, 409, "an invitation cannot be replayed");
    assert.equal(await membershipCount(), 1, "replay never creates another membership");
  } finally {
    server.close();
    await db.delete(membershipsTable).where(eq(membershipsTable.companyId, companyId));
    await db.delete(companyInvitationsTable).where(inArray(companyInvitationsTable.id, invitationIds));
    await db.delete(companiesTable).where(eq(companiesTable.id, companyId));
  }
});

test("invitation cancellation and resend enforce roles, isolation, terminal tokens, and compensation", async () => {
  const suffix = randomUUID();
  const companyA = `invite-a-${suffix}`;
  const companyB = `invite-b-${suffix}`;
  const users = {
    owner: `owner-${suffix}`,
    office: `office-${suffix}`,
    site: `site-${suffix}`,
    invitee: `invitee-${suffix}`,
  };
  const revokedToken = `revoked-token-${suffix}`;
  const expiredToken = `expired-token-${suffix}`;
  const foreignToken = `foreign-token-${suffix}`;
  const revokeId = `revoke-${suffix}`;
  const successfulRevokeId = `successful-revoke-${suffix}`;
  const expiredId = `expired-${suffix}`;
  const syncFailureId = `sync-failure-${suffix}`;
  const foreignId = `foreign-${suffix}`;
  const invitationIds = [revokeId, successfulRevokeId, expiredId, syncFailureId, foreignId];
  const createdRedirects: string[] = [];
  let failCreation = false;
  let deleteReplacementBeforeSync = false;

  await db.insert(companiesTable).values([
    { id: companyA, name: "Empresa A" },
    { id: companyB, name: "Empresa B" },
  ]);
  await db.insert(membershipsTable).values([
    { id: `owner-member-${suffix}`, companyId: companyA, clerkUserId: users.owner, role: "owner_manager" },
    { id: `office-member-${suffix}`, companyId: companyA, clerkUserId: users.office, role: "office" },
    { id: `site-member-${suffix}`, companyId: companyA, clerkUserId: users.site, role: "site_manager" },
  ]);
  await db.insert(companyInvitationsTable).values([
    {
      id: revokeId, companyId: companyA, email: `revoke-${suffix}@example.com`, role: "office",
      tokenHash: hashInvitationToken(revokedToken), clerkInvitationId: `clerk-${revokeId}`,
      invitedByClerkUserId: users.owner, expiresAt: new Date(Date.now() + 60_000),
    },
    {
      id: successfulRevokeId, companyId: companyA, email: `successful-revoke-${suffix}@example.com`, role: "office",
      tokenHash: hashInvitationToken(`successful-revoke-token-${suffix}`), clerkInvitationId: `clerk-${successfulRevokeId}`,
      invitedByClerkUserId: users.owner, expiresAt: new Date(Date.now() + 60_000),
    },
    {
      id: expiredId, companyId: companyA, email: `expired-${suffix}@example.com`, role: "site_manager",
      tokenHash: hashInvitationToken(expiredToken), clerkInvitationId: `clerk-${expiredId}`,
      invitedByClerkUserId: users.owner, expiresAt: new Date(Date.now() - 60_000),
    },
    {
      id: syncFailureId, companyId: companyA, email: `sync-${suffix}@example.com`, role: "office",
      tokenHash: hashInvitationToken(`sync-source-token-${suffix}`), status: "revoked",
      clerkInvitationId: `clerk-${syncFailureId}`, invitedByClerkUserId: users.owner,
      expiresAt: new Date(Date.now() + 60_000),
    },
    {
      id: foreignId, companyId: companyB, email: `foreign-${suffix}@example.com`, role: "office",
      tokenHash: hashInvitationToken(foreignToken), clerkInvitationId: `clerk-${foreignId}`,
      invitedByClerkUserId: `foreign-owner-${suffix}`, expiresAt: new Date(Date.now() + 60_000),
    },
  ]);

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    const userId = req.header("x-test-user-id");
    const role = userId === users.owner ? "owner_manager" : userId === users.office ? "office" : "site_manager";
    req.userId = userId;
    req.authorization = { companyId: companyA, role };
    req.log = { error: () => {} } as unknown as typeof req.log;
    next();
  });
  app.use("/api", createInvitationsRouter({
    getUserId: req => req.header("x-test-user-id") ?? null,
    getVerifiedEmails: async () => [
      `revoke-${suffix}@example.com`,
      `expired-${suffix}@example.com`,
    ],
    seedCompany: async () => {},
    authenticate: (_req, _res, next) => next(),
    sendInvitationEmail: async input => {
      if (failCreation) throw new Error("Invitation email failed");
      createdRedirects.push(input.redirectUrl);
      if (deleteReplacementBeforeSync) {
        const token = input.redirectUrl.split("/").at(-1)!;
        await db.delete(companyInvitationsTable).where(eq(companyInvitationsTable.tokenHash, hashInvitationToken(token)));
      }
    },
  }));
  const server = app.listen(0);
  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const address = server.address();
  assert(address && typeof address === "object");
  const request = async (userId: string, method: "POST" | "DELETE", path: string, body?: unknown) => {
    const response = await fetch(`http://127.0.0.1:${address.port}/api${path}`, {
      method,
      headers: { "content-type": "application/json", "x-test-user-id": userId },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() as Record<string, string> };
  };

  try {
    assert.equal((await request(users.office, "DELETE", `/invitations/${revokeId}`)).status, 403);
    assert.equal((await request(users.site, "DELETE", `/invitations/${revokeId}`)).status, 403);
    assert.equal((await request(users.owner, "DELETE", `/invitations/${foreignId}`)).status, 404);
    assert.equal((await request(users.owner, "POST", `/invitations/${foreignId}/resend`)).status, 404);

    assert.equal((await request(users.owner, "DELETE", `/invitations/${successfulRevokeId}`)).status, 200);

    assert.equal((await request(users.owner, "DELETE", `/invitations/${revokeId}`)).status, 200);
    const [locallyRevoked] = await db.select().from(companyInvitationsTable).where(eq(companyInvitationsTable.id, revokeId));
    assert.equal(locallyRevoked.status, "revoked", "cancellation is terminal");
    assert.equal((await request(users.owner, "POST", "/invitations/accept", { token: revokedToken })).status, 409);
    assert.equal((await request(users.owner, "DELETE", `/invitations/${revokeId}`)).status, 409, "a cancelled invitation cannot be cancelled again");

    const resendResults = await Promise.all([
      request(users.owner, "POST", `/invitations/${revokeId}/resend`),
      request(users.owner, "POST", `/invitations/${revokeId}/resend`),
    ]);
    assert.deepEqual(
      resendResults.map(result => result.status).sort(),
      [201, 409],
      "concurrent resends create one replacement and reject the duplicate",
    );
    const conflict = resendResults.find(result => result.status === 409);
    assert.equal(conflict?.body.error, "Ya existe una invitación de reemplazo vigente para este correo");
    const [oldRecord] = await db.select().from(companyInvitationsTable).where(eq(companyInvitationsTable.id, revokeId));
    const pendingReplacements = await db.select().from(companyInvitationsTable).where(and(
      eq(companyInvitationsTable.companyId, companyA),
      eq(companyInvitationsTable.email, oldRecord.email),
      eq(companyInvitationsTable.status, "pending"),
    ));
    assert.equal(pendingReplacements.length, 1, "only one pending replacement token remains valid");
    const [newRecord] = pendingReplacements;
    assert.equal(oldRecord.status, "revoked");
    assert.notEqual(newRecord.tokenHash, oldRecord.tokenHash, "resend creates a distinct one-time token");
    invitationIds.push(newRecord.id);
    assert.equal(createdRedirects.length, 1, "only one replacement invitation is sent by email");
    const newToken = createdRedirects.at(-1)!.split("/").at(-1)!;
    assert.equal(hashInvitationToken(newToken), newRecord.tokenHash);
    assert.equal((await request(users.owner, "POST", "/invitations/accept", { token: revokedToken })).status, 409);
    assert.equal((await request(users.invitee, "POST", "/invitations/accept", { token: newToken })).status, 200);
    assert.equal((await request(users.invitee, "POST", "/invitations/accept", { token: newToken })).status, 409);

    failCreation = true;
    const failedCreateEmail = `failed-create-${suffix}@example.com`;
    assert.equal((await request(users.owner, "POST", "/invitations", {
      email: failedCreateEmail,
      role: "office",
    })).status, 502);
    assert.equal(
      (await db.select().from(companyInvitationsTable).where(eq(companyInvitationsTable.email, failedCreateEmail))).length,
      0,
      "failed initial email removes the local reservation",
    );
    assert.equal((await request(users.owner, "POST", `/invitations/${expiredId}/resend`)).status, 502);
    const expiredRows = await db.select().from(companyInvitationsTable).where(eq(companyInvitationsTable.email, `expired-${suffix}@example.com`));
    assert.equal(expiredRows.length, 1, "failed email removes the replacement reservation");
    assert.equal(expiredRows[0].status, "revoked", "expired source remains terminal after failed resend");
    assert.equal((await request(users.owner, "POST", "/invitations/accept", { token: expiredToken })).status, 409);

    failCreation = false;
    deleteReplacementBeforeSync = true;
    const syncFailure = await request(users.owner, "POST", `/invitations/${syncFailureId}/resend`);
    assert.equal(syncFailure.status, 502);
    const [syncSource] = await db.select().from(companyInvitationsTable).where(eq(companyInvitationsTable.id, syncFailureId));
    assert.equal(syncSource.status, "revoked");
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await db.delete(membershipsTable).where(inArray(membershipsTable.clerkUserId, Object.values(users)));
    await db.delete(companyInvitationsTable).where(inArray(companyInvitationsTable.id, invitationIds));
    await db.delete(companiesTable).where(inArray(companiesTable.id, [companyA, companyB]));
  }
});