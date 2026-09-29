---
name: GitHub push transport
description: A GitHub connector can write through the REST API while Git CLI still lacks credentials.
---

An authorized GitHub connector does not necessarily authenticate `git push` or `git ls-remote` in the shell. Do not treat an `origin/main` local tracking ref as proof that GitHub received commits; check the remote ref with the authorized connector.

**Why:** The shell Git transport could not authenticate even though the GitHub API connection had organization-admin access. A newly created empty GitHub repository also rejected Git Data API tree creation until an initial branch existed.

**How to apply:** Prefer normal Git push when it authenticates. If Git transport remains unavailable but the user authorized GitHub, the Git Data API can recreate blobs, trees and commits while verifying their SHA values, then update and verify the remote ref. For an empty repo, initialize the branch first, and replace only that agent-created initialization commit after checking nobody else changed the branch. Future shell pushes may still require Git-pane authorization.