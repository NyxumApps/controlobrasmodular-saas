import { createHash, timingSafeEqual } from "node:crypto";

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();
export const hashInvitationToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

export function emailMatchesInvitation(invitedEmail: string, accountEmails: readonly string[]): boolean {
  const expected = Buffer.from(normalizeEmail(invitedEmail));
  return accountEmails.some(email => {
    const candidate = Buffer.from(normalizeEmail(email));
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  });
}

export function invitationOrigin(host: string): string {
  const isLocal = host === "localhost" || host.startsWith("localhost:") || host === "127.0.0.1" || host.startsWith("127.0.0.1:");
  return `${isLocal ? "http" : "https"}://${host}`;
}