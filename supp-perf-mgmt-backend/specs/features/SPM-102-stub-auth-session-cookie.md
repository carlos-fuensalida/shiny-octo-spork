# SPM-102 — Auth module: stub-first session cookie authentication

**Branch:** `feature/SPM-102-stub-auth-session-cookie`
**Status:** Implemented
**Relates to:** `specs/API_SPEC.md` §Group 10 — Authentication, `CLAUDE.md` → Auth Model, `specs/DATA_MODEL_SPEC.md` → `User`

## Summary

Implements the authentication module for Backend A per `API_SPEC.md` Group 10 and the Auth Model confirmed in `CLAUDE.md` (2026-07-22). Per `BE-A-FR-010`, this is stub-first: real Google Workspace OAuth is not wired in yet, so `GET /auth/login` sets the session cookie immediately for a hardcoded identity instead of redirecting to Google. The external contract (cookie mechanics, redirect behavior, response shapes) matches what the real flow will produce.

## Scope

Covers 4 of the 5 endpoints in Group 10:

- `GET /auth/login`
- `GET /auth/me`
- `POST /auth/logout`
- `POST /auth/validate`

**`GET /auth/callback` is deferred to a follow-up ticket.** Nothing calls it yet — the stub `/auth/login` sets the cookie directly and never redirects to Google, so the callback has no caller until real OAuth exists. Decided explicitly during scoping rather than left implicit.

## Session model

A single `HttpOnly; Secure; SameSite=Lax` cookie (`spms_session`, JWT-encoded), not the separate access/refresh-token-cookie pair described in `API_SPEC.md`'s `GET /auth/callback` prose (line ~187 as of spec v0.3). That prose predates the resolved `OQ-API-2` and is inconsistent with the resolved-OQ note in the same file and with `CLAUDE.md`'s Auth Model, both of which describe a single cookie with a sliding window and no refresh endpoint. This implementation follows the resolved version:

- 60-minute sliding window, reissued (re-signed) on every authenticated request via `SessionAuthGuard`.
- 8-hour absolute cap tracked via a `sessionStart` claim independent of the JWT's own `exp`, so a still-sliding-valid token is still rejected once the original login is >8h old.
- No `/auth/refresh` endpoint — expiry is handled by cookie rotation alone, per resolved `OQ-API-2`.

`API_SPEC.md` Group 10 should get a docs-only correction to match; not done as part of this ticket.

## Identity resolution

`IdentityProvider` interface (`src/modules/auth/identity/`) with `StubIdentityProvider` bound via the `IDENTITY_PROVIDER` DI token in `AuthModule`. Swapping in real Google identity resolution later is a matter of binding a different provider — the guard, session service, and controller contract don't change.

## Response envelope / error model

No `data`/`meta`/error envelope infrastructure existed in the repo yet, so this ticket also added the shared pieces under `src/common/`: `ResponseEnvelopeInterceptor`, `HttpExceptionFilter`, `RequestIdMiddleware`, `ApiException`/`UnauthorizedApiException`. Also added at the bootstrap level (`src/main.ts`, `src/app.module.ts`), since nothing had set them up before: the `/api/v1` global prefix, `cookie-parser`, CORS, and Swagger (`@nestjs/swagger`, served at `/api/docs`).

## Local dev defaults

`PORT` defaults to `3001`, `FRONTEND_ORIGIN` defaults to `http://localhost:3000` — matches the actual local frontend/backend port layout in use. Both are overridable via env vars for QA/prod.

## Bug found during manual verification

Manual smoke-testing against a running server (not just unit tests) caught that `POST /auth/validate` returned `201` instead of the spec's `200` — NestJS defaults `POST` handlers to `201` unless overridden. Fixed with `@HttpCode(HttpStatus.OK)`. Unit tests alone didn't catch this since they call controller methods directly rather than going through Nest's HTTP/decorator layer.

## Acceptance criteria

- [x] `GET /auth/login` sets the session cookie for a hardcoded identity and redirects to `/` (no external redirect in this stub).
- [x] `GET /auth/me` returns the hardcoded `User` (`{ id, email, displayName }`) when a valid session cookie is present; `401` when missing/expired.
- [x] `POST /auth/logout` clears the session cookie for real and invalidates the session; `204` on success, `401` if no active session.
- [x] `POST /auth/validate` returns `{ valid, expiresAt }` for a valid session cookie; `401` when invalid/expired.
- [x] Session cookie is `HttpOnly; Secure; SameSite=Lax; Domain=.<parent-domain>` (unset domain in local dev → host-only cookie), reissued with a fresh 60-min sliding expiry on every authenticated request.
- [x] Session is rejected (401) once the 8-hour absolute cap from initial login is reached, even if the sliding window would otherwise still be valid.
- [x] CORS allows the exact frontend origin with `Access-Control-Allow-Credentials: true`.
- [x] Errors follow the standard envelope (`{ error: { code, message, requestId, details } }`) with `UNAUTHORIZED` for missing/expired sessions.
- [x] Auth guard/session logic is implemented behind an interface (`IdentityProvider`) so the hardcoded stub identity can later be swapped for real Google identity resolution without changing the external contract.
- [x] OpenAPI decorators added for all 4 endpoints so generated spec matches `API_SPEC.md` Group 10.
- [x] Unit tests cover: cookie issuance, sliding-window reissue, 8-hr absolute cap expiry, logout clearing, and 401 responses for missing/expired sessions.

## Follow-ups (not this ticket)

- `GET /auth/callback` + real Google Workspace OAuth wiring.
- Docs fix: `API_SPEC.md` Group 10's `/auth/callback` prose still describes the old two-cookie (access + refresh) model.
