# SPM-106 — Pin Node.js Version via `engines` Field and `.nvmrc`

**Branch:** `chore/SPM-106-pin-node-version`
**Status:** Draft
**Relates to:** `package.json`, `Dockerfile` (SPM-51), `specs/features/SPM-51-dockerization.md` OQ-1

## Summary

Nothing in the repo currently declares which Node.js version this app targets — there's no `engines` field in `package.json` and no `.nvmrc`. The only indirect signal is `@types/node` pinned to `^24.0.0`, which is just type definitions, not an enforced runtime requirement. This isn't causing failures today, but it means there's no single source of truth for local dev, CI, or the Docker image to agree on, and a future dependency bump could silently require a newer Node version with no visible signal.

For SPM-51 (Dockerization), `node:22-alpine` was picked as the Dockerfile's base image and empirically verified (real `docker build` + `docker run`) to build and run the app correctly — that's the candidate pinned here repo-wide, rather than guessing 24 off `@types/node` alone.

## Root Cause

No `engines` field, no `.nvmrc`. `@types/node: ^24.0.0` is the only hint of intended Node version, but type packages don't enforce a runtime version.

## Proposed Fix

Pin to Node 22 (LTS, already verified against this app's actual build/run in SPM-51):

```json
"engines": {
  "node": ">=22.0.0 <23.0.0"
}
```

```
# .nvmrc
22
```

**The upper bound is deliberate, not incidental.** This range blocks Node versions above 22.x as well as below — a future Node upgrade requires deliberately updating this ticket's pin, not an accidental toolchain drift picked up by `nvm use` or a CI runner silently moving to whatever "current" resolves to.

## Files Affected

- `package.json` — add `engines.node`.
- `.nvmrc` — new file, contents: `22`.
- `README.md` — document the pinned version for onboarding (add a prerequisite/setup note).
- `Dockerfile` (SPM-51) — already on `node:22-alpine`; confirmed aligned already, no change needed.

## Functional Requirements

- **FR-01.** `package.json` has an `engines.node` field set to `>=22.0.0 <23.0.0`.
- **FR-02.** `.nvmrc` exists at the repo root with contents `22`, so `nvm use` resolves to the pinned version.
- **FR-03.** `Dockerfile`'s base image tag stays consistent with the pinned version (confirmed already true — `node:22-alpine`).
- **FR-04.** `README.md` reflects the pinned version for new developer setup.

## Verification Plan

1. `nvm use` in the repo root picks up `.nvmrc` and resolves to Node 22.
2. `npm install` on a Node version outside the `engines` range produces a warning (or hard failure if `engine-strict` is also adopted — separate decision, not required by this ticket's ACs).
3. `docker build` still succeeds unchanged, confirming the Dockerfile's base image and the new pin agree.

## Acceptance Criteria

- [ ] **AC-01.** `package.json` has an `engines.node` field set to the confirmed minimum/target version.
- [ ] **AC-02.** A `.nvmrc` exists at the repo root with the same version, so `nvm use` matches.
- [ ] **AC-03.** The Dockerfile's base image tag is updated (if needed) to stay consistent with the pinned version.
- [ ] **AC-04.** `README.md` (or equivalent onboarding doc) reflects the pinned version for new developer setup.

## Open Questions

- **OQ-1 (`engine-strict`).** Should `engine-strict=true` (in `.npmrc`) be added to turn the `engines` mismatch into a hard failure rather than a warning? Not required by this ticket's ACs — flagged for the assignee to decide, since it affects every contributor's local setup, not just this repo's CI/Docker path.

## Dependencies

- `specs/features/SPM-51-dockerization.md` OQ-1 — this ticket resolves that open question.
