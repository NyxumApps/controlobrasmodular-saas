import test from "node:test";
import assert from "node:assert/strict";
import { emailMatchesInvitation, hashInvitationToken, invitationOrigin, normalizeEmail } from "./invitation-security";

test("normalizes invitation email consistently", () => {
  assert.equal(normalizeEmail("  Jefe@Example.COM "), "jefe@example.com");
});

test("matches only the intended account email", () => {
  assert.equal(emailMatchesInvitation("jefe@example.com", ["JEFE@example.com"]), true);
  assert.equal(emailMatchesInvitation("jefe@example.com", ["otra@example.com"]), false);
});

test("hashes tokens deterministically without storing the token", () => {
  const hash = hashInvitationToken("a".repeat(32));
  assert.equal(hash, hashInvitationToken("a".repeat(32)));
  assert.notEqual(hash, "a".repeat(32));
});

test("uses HTTPS for public invitation links and HTTP only locally", () => {
  assert.equal(invitationOrigin("obra-control.example"), "https://obra-control.example");
  assert.equal(invitationOrigin("localhost:80"), "http://localhost:80");
});