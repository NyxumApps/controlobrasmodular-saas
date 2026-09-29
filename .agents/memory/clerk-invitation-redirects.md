---
name: Clerk invitation redirects
description: Authentication routing constraint for application invitations that may target new or existing Clerk users.
---

Application invitation pages must preserve the complete invitation return URL, including Clerk query parameters, through both registration and sign-in.

**Why:** Clerk invitations can target an email that already owns an account. Sending that person to a generic sign-in route loses the application token and leaves the authenticated user unaffiliated.

**How to apply:** Any invitation entry route should provide invitation-aware sign-up and sign-in paths, with both flows returning to the original one-time token route after authentication.

Application revocation must invalidate the local one-time token before asking Clerk to revoke its invitation, and resend must create a fresh local token rather than reactivating the old record.

**Why:** Clerk is an external system and its request can fail ambiguously. The safe failure mode is a Clerk link that reaches an already-invalid local token, never a locally valid token that was assumed to be revoked.

**How to apply:** Keep revoked records terminal. For resend, create a new pending record and compensate a failed local synchronization by revoking any newly created Clerk invitation.