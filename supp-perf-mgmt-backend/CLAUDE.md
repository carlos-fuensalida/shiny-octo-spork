# CLAUDE.md — SPMS Data API (Backend A)

This file is loaded automatically by Claude Code at the start of every session.

---

## Project Overview

Supplier Performance Management System (SPMS). This repo is **Backend A — the Data API** (NestJS, TypeScript, deployed on Google Cloud Run). It is the primary backend the frontend talks to for everything except chat.

The system has three independent backend components. This repo is only one of them:

- **Backend A — Data API (this repo, NestJS).** All KPI data, SSO auth/session issuance, supplier signed-URL generation/validation, saved filters and user preferences (Cloud SQL). Reads KPI data from a centralized BigQuery layer — never raw Sheets or raw BigQuery tables directly.
- **Backend B — Chat Service (separate repo, FastAPI).** The frontend calls it **directly** for all chat — never routed through this repo. Validates the same session cookie this repo issues.
- **AI Agent (separate repo, Google ADK + Gemini + BigQuery MCP).** Only ever called by Backend B. This repo never calls it and is never called by it.

Non-responsibilities of this repo: no chat/LLM logic, no UI, no direct raw-source reads outside the centralized BigQuery layer.

Read the relevant spec before touching an area you haven't worked in yet — don't infer contracts from guesses.

| Topic | File |
|---|---|
| Product goals, personas, scope, phasing | `specs/PRD.md` |
| This service's architecture, responsibilities, constraints | `specs/PRD-backend-a.md` |
| HTTP contract for this service (endpoints, request/response shapes, error codes, auth flow) | `specs/API_SPEC.md` |
| Entity shapes / TypeScript interfaces | `specs/DATA_MODEL_SPEC.md` |
| Per-ticket feature specs (one flat file per Jira ticket, no subfolder) | `specs/features/SPM-<n>-<slug>.md` |

**`PRD-backend.md` no longer exists in this repo.** It described an old single-backend, FastAPI, chat-proxy flow, was marked superseded in its own header (split into Backend A / Backend B), and was removed once its retirement was captured in git history — don't recreate it or treat any lingering mention of it in other specs as current.

---

## Known open contradictions / blockers — do not silently pick one

- ~~**SSO provider.**~~ **Resolved 2026-07-22:** confirmed Google Workspace, cookie-based session (not bearer token). Okta is planned as a second IdP in a later phase — the token issuance interface stays IdP-agnostic internally even though the external contract (session cookie) doesn't change. See "Auth Model" below.
- **Centralized BigQuery layer (DEP2)** is listed as "Pending" in `specs/PRD.md`. Do not assume it exists — build data-access behind a repository/interface so a mock/stub provider can stand in until the real layer is ready.
- Most KPI fields (`target`, `status`, `trendDirection`) and thresholds are explicit `null`/TBD in the specs pending business decisions (`OQ-KPI-3`, etc.) — do not invent values or thresholds; pass them through as `null` until the registry defines them.

When a change touches one of these, flag it in your response rather than guessing.

---

## Auth Model (confirmed 2026-07-22 — read before touching auth)

Cookie-based session auth, **not** a bearer token in an `Authorization` header. Full detail: `specs/API_SPEC.md` §Authentication, `specs/PRD-backend-a.md` BE-A-FR-010.

- **Endpoints:** `GET /auth/login` (redirects to Google OAuth), `GET /auth/callback` (validates identity, sets session cookie, redirects to frontend root), `POST /auth/logout`, `GET /auth/me`, `POST /auth/validate`.
- **Cookie:** `HttpOnly; Secure; SameSite=Lax; Domain=.<parent-domain>`. Frontend and this API live on subdomains of the same parent domain (`app.<domain>`, `api.<domain>`) so the cookie is shared automatically.
- **CORS:** `Access-Control-Allow-Origin` set to the exact frontend origin (not `*`) + `Access-Control-Allow-Credentials: true`.
- **Session lifetime:** 60-minute sliding window, silently reissued on every authenticated request; 8-hour absolute cap regardless of activity. No explicit `/auth/refresh` endpoint — expiry is handled by cookie rotation alone. On expiry, return `401`; the frontend's Next.js middleware redirects to `/auth/login`.
- **User model is minimal:** `{ id, email, displayName }` only. **No roles in v1** (`OQ-USR-3` resolved) — every authenticated internal user has equivalent access, no role field, no permission gating. **No `firstName`/`lastName`/claims beyond email+displayName** (`OQ-USR-1` resolved) — don't assume additional Google claims are available. **Region isolation is enforced in query construction on this API**, not via a user field (`OQ-USR-2` resolved).
- **Stub-first implementation is explicitly required (`BE-A-FR-010`).** Before real Google OAuth is wired in, implement `/auth/login` as a stub: skip the redirect, set the session cookie immediately with a hardcoded identity, redirect to `/`. `/auth/me` returns a hardcoded `User`. `/auth/logout` clears the cookie for real. **The external three-endpoint contract (cookie mechanics, redirect behavior, response shapes) must be identical to the eventual real flow** — only the internal identity source changes later. This means the auth module can and should be built now, without waiting on Google Workspace OAuth app registration.
- Supplier signed-URL routes never use the session cookie — separate token-in-URL auth, see the Supplier Signed URLs section of `API_SPEC.md`.

---

## Stack

- NestJS 11 (TypeScript), Express platform
- Deployed on Google Cloud Run (Dev/QA/Prod)
- BigQuery (centralized layer, once available) for KPI reads
- Cloud SQL for saved filters / user preferences (ORM: TBD)
- Secret Manager for all secrets; no long-lived keys; Workload Identity Federation from Bitbucket Pipelines

---

## Architecture Rules (non-negotiable, from `specs/PRD-backend-a.md`)

- Frontend calls this API for all data, auth, supplier, and filter operations. Chat requests bypass this repo entirely and go directly to Backend B.
- All KPI reads go through the centralized BigQuery layer — never raw Sheets or raw BigQuery tables directly.
- Supplier data isolation is enforced **server-side in query construction**. It is never delegated to the frontend, a client parameter, or any LLM.
- Internal analysts may query all suppliers, including comparisons; supplier signed-URL sessions see only their own scope and never reach chat.
- Signed URLs are bearer capabilities: short TTL, revocable, every resolution audit-logged with the link identifier and timestamp.
- Backend-to-GCP and backend-to-backend auth uses least-privilege service accounts. No long-lived keys.
- Routes are prefixed `/api/v1`. Uniform error envelope: `{ "error": { "code", "message", "requestId", "details" } }` (see `specs/API_SPEC.md` for the full status/code table).
- A KPI is only registered/served once its definition and source are finalized (`BE-A-FR-001`). Undefined KPIs must not appear in the API surface.

---

## Planning & Jira Workflow

This project uses one shared Jira project (`SPM`) across the frontend, this backend (Backend A), and the chat backend (Backend B). Jira assigns ticket numbers sequentially across all three components — a `[BE]` / `[FE]` / `[BC]` prefix on the **card title** (not the ticket key) disambiguates which component a card belongs to. **Provisional — exact prefix formula to be confirmed by the user; update this section once finalized.**

This sits one layer above the Feature Workflow below — it's how a task gets scoped and turned into a ticket/branch, before the Feature Workflow's execution loop starts.

### When this workflow triggers

This is a codified gate, not per-session judgment — check against this list rather than re-deriving it each time:

- **Never triggers it:** questions, discussion, exploratory "what do you think" asks, docs/spec updates, meeting notes, config/tooling chores, trivial fixes (typo, rename, formatting).
- **Always triggers a checkpoint before touching `src/`:** any request that would add or change actual backend functionality — a new endpoint, a new module, new business logic. The checkpoint is not "auto-create a ticket" — it's "pause and ask: is there a ticket for this, or should we draft one first?"
- **Ambiguous:** ask directly rather than infer. Don't silently start drafting tickets or writing code off a comment that could've been rhetorical.

1. Discuss the task/feature with the user until scope is clear.
2. Decide granularity together as an explicit checkpoint: one ticket for the whole task, or split into several (e.g. a page needing 5 endpoints might become 5 tickets, one per endpoint). Don't assume — ask.
3. Draft each candidate ticket in this shape (matches the team's real Jira usage, confirmed 2026-07-24 — no ticket number or type embedded in the summary text, since Jira shows the key separately):
   - **Summary:** `[BE] <descriptive title>` — plain, no dashes, no `SPM-<n>`, no type keyword.
   - **Description:** prose describing what's being built and why, referencing the relevant spec sections.
   - **Acceptance criteria:** a flat bullet checklist of concrete, verifiable outcomes.
4. The user reviews, edits as needed, and creates the ticket(s) manually in Jira (no direct Jira integration in this environment — don't attempt to call a Jira API).
5. The user provides the resulting ticket key(s) (e.g. `SPM-88`).
6. I generate the branch name and hand it to the user, who creates/commits to it manually (no direct git push from here into shared branches without explicit confirmation). Branch format: **`<type>/SPM-<n>-<slug>`**, e.g. `chore/SPM-88-nestjs-scaffold`, `docs/SPM-91-docs-reorg`, `feature/SPM-92-quality-page-filter`.
   - **Type** is one of: `feature` (new functionality), `fix` (bugfix), `hotfix` (urgent production fix), `release` (release prep), `chore` (tooling/build/maintenance, non-functional), `docs` (documentation-only, no code changes).
   - Picking the type is part of drafting the ticket in step 3 — decide it there, not as an afterthought when cutting the branch.
   - No `[BE]`/`[FE]`/`[BC]` component tag in the branch — that's only needed in Jira, where all three components share one project; it's redundant on a branch since the repo itself identifies the component.
7. **Once the branch exists, create `specs/features/SPM-<n>-<slug>.md`** (see `specs/features/README.md`) seeded from the ticket content drafted in step 3, and commit it on that branch. Not optional, not a nice-to-have — this is a required step in the sequence, same as generating the branch name. The ticket number is part of the filename, which is why this comes *after* step 5 (ticket key) and step 6 (branch), not before.
8. Proceed with the Feature Workflow below, scoped to that branch/ticket. Treat the spec file from step 7 as a living doc, not a one-shot artifact — update it as scoping decisions, spec deviations, or findings surface during implementation (e.g. a bug only caught in manual testing, a deferred sub-piece) rather than only backfilling it at the end.
9. When opening the PR, write the description in this shape:
   - **Summary:** what changed and why this branch exists, in a sentence or two, plus a flat bullet list of the actual changes (file/folder level, not a line-by-line diff narration).
   - **Why:** the reasoning/context that isn't obvious from the diff alone — what problem this solves or what it unblocks.
   - **Checklist:** a literal checkbox list mirroring the ticket's acceptance criteria, one-to-one. **Don't improvise a separate checklist** — copy the ticket's ACs so a reviewer can verify the PR against the same list the ticket was scoped with.

---

## Feature Workflow

1. Check `specs/API_SPEC.md` for the endpoint's contract (request/response shape, status codes) and `specs/DATA_MODEL_SPEC.md` for the entity/DTO shape. Note any `OQ-*` gaps that block or constrain the implementation — surface blocking gaps before proceeding rather than guessing a shape.
2. Confirm which fields are genuinely available now vs. `null`/TBD pending a business decision. Never fabricate values for `target`, `status`, thresholds, etc.
3. Define/extend the DTO (class-validator decorated) matching the spec's TypeScript interface.
4. Implement: controller → service → (repository/BigQuery or Cloud SQL access) → tests. Keep data access behind an interface so a mock provider can substitute for BigQuery until the centralized layer is ready.
5. Match the standard response envelope (`data`/`meta`/`pagination`) and error model exactly — don't introduce a one-off shape.
6. Add/update the OpenAPI decorators (`@nestjs/swagger`) so the generated spec stays in sync with `specs/API_SPEC.md`.
7. Write unit tests for the service/controller and, where relevant, security tests proving supplier isolation can't be bypassed by a client parameter.

---

## File Locations

*(To be filled in as the module structure is scaffolded — target layout below.)*

| Purpose | Path |
|---|---|
| Feature modules (auth, kpis, filters, suppliers, plants, supplier-links, spend) | `src/modules/<name>/` |
| Shared/cross-cutting (envelope, exception filter, guards, interceptors) | `src/common/` |
| DTOs / entity interfaces | `src/modules/<name>/dto/` |
| Config | `src/config/` |
| Specs | `specs/` (`API_SPEC.md`, `DATA_MODEL_SPEC.md`, etc.), per-ticket specs as flat files in `specs/features/SPM-<n>-<slug>.md` |

---

## Commands

```
npm run start:dev   # local dev with watch
npm run build        # nest build
npm run test          # unit tests
npm run test:e2e     # e2e tests
npm run lint           # eslint --fix
```

---

## Out of Scope (v1)

No LLM/chat logic, no UI, no direct raw Sheets/BigQuery reads outside the centralized layer, no user administration, no role-based permissions, no real-time streaming data. Do not build toward these.
