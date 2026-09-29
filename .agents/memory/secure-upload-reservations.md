---
name: Secure upload reservations
description: Security invariants for accepting user files into App Storage.
---

User file uploads must be authorized before bytes enter storage, tied to the requesting company and user, bounded by declared and measured size, quota-limited, expiring, and claimable exactly once. Never delete an object from an unverified client-supplied path.

**Why:** An unconstrained signed PUT lets authenticated users create oversized or abandoned objects outside application limits, while cleanup based on an arbitrary path can delete an already-persisted attachment.

**How to apply:** Any future file category or uploader must reuse the pending-upload reservation lifecycle and preserve its ownership, expiry, quota, byte-counting, and single-claim checks.