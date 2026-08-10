# PRD-backend-a.md — SPMS Data API (Backend A)

Component Requirements Document

---

## 1. Document Control

| Field | Value |
|---|---|
| Component | Data API (Backend A) |
| Tech | Nest.js (TypeScript), Google Cloud Run |
| Version | 0.2 (Draft) |
| Status | Draft for stakeholder review |
| Owner | Full-Stack Developers |
| Parent | `PRD.md` |
| Peers | `PRD.md` |

Requirement IDs in this document are namespaced `BE-A-###`.

---

## 2. Purpose and Responsibilities

Backend A is the primary data API the frontend talks to for all KPI data, authentication, supplier access, and user preferences. It has four responsibilities:

1. Serve aggregated KPI data from the centralized BigQuery layer.
2. Handle SSO and issue backend access tokens.
3. Generate and validate supplier signed URLs and serve the supplier limited view.
4. Persist user preferences and saved filters in Cloud SQL.

**Non-responsibilities:**

- No chat or LLM logic — chat requests from the frontend go directly to Backend B (separate repo).
- No direct raw-source reads outside the centralized BigQuery layer.
- No UI.

---

## 3. Architecture and Constraints

- **BE-A-C1.** The frontend calls Backend A for all data, auth, supplier, and filter operations. Chat requests bypass Backend A and go directly to Backend B.
- **BE-A-C2.** All KPI reads go through the centralized BigQuery layer, never against raw Sheets or raw BQ tables directly.
- **BE-A-C3.** Backend-to-backend and backend-to-GCP auth uses service accounts with least privilege. No long-lived keys; Bitbucket uses Workload Identity Federation.
- **BE-A-C4.** All secrets in Secret Manager.
- **BE-A-C5.** Data isolation for suppliers is enforced here, in the query layer. It is never delegated to the frontend or any LLM.
- **BE-A-C6.** Deployed on Cloud Run with Dev/QA/Prod environments.

---

## 4. Centralized BigQuery Layer

- **BE-A-DR1.** Build a centralized BigQuery layer that joins Google Sheets (~60% of data) and BigQuery (~40%) into one governed query surface. Sheets ingestion into BigQuery uses BigQuery external tables or a scheduled load; the mechanism is a Phase 0 decision recorded here once chosen.
- **BE-A-DR2.** The layer exposes curated views/tables per KPI domain (Quality, Delivery) plus a supplier-scoped view for the supplier limited view.
- **BE-A-DR3.** Each queryable surface exposes a `data_as_of` timestamp so the API can report data currency.
- **BE-A-DR4.** A KPI is added to the layer only when its definition and source are finalized. Undefined KPIs are excluded.
- **BE-A-DR5.** Data grain and history depth are unconfirmed (OQ-Data-1). Query functions must accept a period/date-range parameter rather than assuming a fixed grain.

### KPI definition registry

- **BE-A-FR-001.** Maintain a KPI registry (config or table) with, per KPI: `id`, `name`, `domain` (quality/delivery), `formula_sql`, `unit`, `direction` (higher/lower better), `target`, and `dimensions` (e.g. supplier, category, region, plant, commodity, subcommodity, period). Design review identified Plant and Subcommodity as additional required dimensions — registry must accommodate these.
  - *Acceptance:* Given a finalized KPI, when it is added to the registry, then the API can compute and serve it without code changes to endpoints.
  - *Empty state:* A KPI with missing definition or source is not registered and does not appear in the API surface.

---

## 5. Functional Requirements — Endpoints

All endpoints return JSON. All list endpoints support pagination and filtering. All responses include a `data_as_of` field where data-backed.

See `API_SPEC.md` for the full HTTP contract (request/response shapes, status codes, examples).

### 5.1 Authentication and session

- **BE-A-FR-010. SSO login.** Provide `GET /auth/login` and `GET /auth/callback` endpoints that complete the Google Workspace OAuth flow and deliver a backend-issued session cookie.
  - *Given* a valid Google Workspace identity, *when* the SSO callback completes, *then* the API sets a session cookie (`HttpOnly; Secure; SameSite=Lax; Domain=.<parent-domain>`) and redirects the user to the frontend root (`/`).
  - **Session lifetime:** 60-minute sliding window, automatically rotated (reissued) on every authenticated request. Absolute session cap of 8 hours — after 8 hr of continuous activity the session is invalidated and the user must re-authenticate. No explicit `/auth/refresh` endpoint.
  - **Deployment:** Frontend (`app.<domain>`) and Backend A (`api.<domain>`) are on subdomains of the same parent domain. Cookie `Domain` is set to `.<parent-domain>`. CORS: `Access-Control-Allow-Origin: https://app.<domain>` (exact, not wildcard) + `Access-Control-Allow-Credentials: true`.
  - The frontend never handles the token directly — the browser attaches the cookie automatically. No `Authorization` header.
  - Okta will be added as a second provider in a later phase; the token issuance interface must be IdP-agnostic so the frontend flow does not change.
  - Backend B accepts the same session cookie for chat authentication — both services share the same cookie domain and validate against the same Google Workspace identity.
  - **Stub-first implementation.** Before Google Workspace integration is ready, implement `/auth/login` as a stub: skip the OAuth redirect, immediately set the session cookie with a hardcoded identity, and redirect to `/`. `GET /auth/me` returns a hardcoded `User` object. `POST /auth/logout` clears the cookie. The three-endpoint contract is identical to the production flow — the frontend exercises the real cookie mechanics with no changes needed when the real SSO is wired in. Replace the stub internals only; the external contract must not change.
- **BE-A-FR-011. Token validation.** Validate the session cookie on every protected request and reject expired or tampered sessions with `401`.
- **BE-A-FR-012. Current user.** Return the authenticated user's profile (`id`, `email`, `displayName`) for the frontend to hydrate user context. No role or region fields — all authenticated internal users have equivalent access (v1).

### 5.2 KPI and view data

- **BE-A-FR-020. Summary data.** Return the leadership summary payload: headline quality and delivery KPIs with current value, target, direction, and trend.
- **BE-A-FR-021. Quality view data.** Return all finalized quality KPIs, sliceable by the supported dimensions and global filters.
- **BE-A-FR-022. Delivery view data.** Return all finalized delivery KPIs, same slicing model.
- **BE-A-FR-023. Supplier view data.** Return per-supplier KPI data for internal users (all suppliers).
- **BE-A-FR-024. Supplier comparison data.** Return KPI data for two or more selected suppliers side by side.
- **BE-A-FR-025. Single-KPI detail.** Return detail for one KPI by `id` (values, breakdowns, trend, target) to back a per-KPI view.
  - *Given* a finalized KPI id, *when* requested with filters, *then* the API returns its computed values plus metadata (unit, direction, target, `data_as_of`).
  - *Error state:* Unknown or unfinalized KPI id returns `404`.
- **BE-A-FR-026. Filter metadata.** Return the available filter dimensions and their allowed values so the frontend can build global and per-view filters. Dimensions include: Region, Fiscal Year, Fiscal Quarter, Month (TBD — OQ-FLT-5), Supplier, Supplier Code, Commodity, Subcommodity, Plant, Supplier Location, and Focus Supplier flag. See `VIEW_DATA_MAP_SPEC.md` for the full list discovered from design.

Common contract for data endpoints:
- Query params: `filters` (dimension key/value pairs), `date_from`, `date_to`, `page`, `page_size`.
- Response includes `data`, `data_as_of`, and pagination metadata (`page`, `page_size`, `total`).
- Empty result returns `200` with `data: []`, not an error.

### 5.3 Saved filters and preferences

- **BE-A-FR-030. Save filter set.** Persist a named filter combination for the authenticated user in Cloud SQL, tagged with scope (global or a specific view).
- **BE-A-FR-031. List saved filters.** Return the user's saved filter sets.
- **BE-A-FR-032. Apply / update / delete saved filter.** Support update and delete of a saved filter the user owns.
  - *Given* a saved filter owned by another user, *when* update or delete is attempted, *then* return `403`.
- **BE-A-FR-033. User preferences.** Persist and return user UI preferences (e.g. default view, default filters).

### 5.4 Supplier signed-URL access

- **BE-A-FR-040. Generate signed URL.** Provide a non-public mechanism (called by the provisioning process, not the frontend) that generates a signed URL encoding: scope (supplier limited view), a data-scope selector, an expiry, and a signature.
  - Provisioning trigger is a non-UI mechanism, under stakeholder review (OQ-Prov-1). This endpoint is invoked by that mechanism.
  - Because there is no canonical `supplier_id` (A4), the data-scope selector is a generic scope descriptor defined at provisioning time rather than a clean id reference.
- **BE-A-FR-041. Validate signed URL.** On access, verify signature and expiry. Reject invalid or expired links with a clear expiry page signal (`401`/`410`).
- **BE-A-FR-042. Serve supplier limited view.** Return only the data permitted by the link's scope. Never return other suppliers' data. No chatbot access for this path.
  - *Given* a valid supplier link, *when* the limited view loads, *then* only in-scope data is returned and every response is logged with the link identifier and timestamp.
  - *Security:* Isolation is enforced by server-side query scoping, not by any client-supplied parameter.
- **BE-A-FR-043. Revocation.** Support invalidating a signed URL before its natural expiry (mechanism to confirm, OQ-Sec-2).

---

## 6. API Contract Standards

- **BE-A-STD1.** No existing contract; this team authors an OpenAPI spec as the first API deliverable (Phase 0).
- **BE-A-STD2. Error model.** Uniform error body: `{ "error": { "code", "message", "details" } }`. Standard status codes: `400` validation, `401` auth, `403` forbidden, `404` not found, `410` gone (expired link), `429` rate limit, `500` server.
- **BE-A-STD3. Pagination.** Page/size based, with `total` in responses.
- **BE-A-STD4. Rate limiting.** Apply per-user rate limits on data endpoints.
- **BE-A-STD5. Versioning.** Prefix routes with `/api/v1`.
- **BE-A-STD6. Validation.** Validate all inputs (query params, bodies) and reject malformed requests with `400`.

---

## 7. Non-Functional Requirements

| ID | Area | Target |
|---|---|---|
| BE-A-NFR1 | Latency | Not critical; aggregated KPI responses within a few seconds is acceptable |
| BE-A-NFR2 | Concurrency | ~5 concurrent, up to ~100 users |
| BE-A-NFR3 | Cost | Guard BigQuery scan cost via curated views, partitioning/clustering, and query caching |
| BE-A-NFR4 | Observability | Structured logs, request tracing, and metrics to Cloud Logging/Monitoring |
| BE-A-NFR5 | Security | Least-privilege service accounts, Secret Manager, no keys in code or CI |

---

## 8. Security and Data Isolation

- **BE-A-SEC1.** Enforce supplier isolation in query construction. No client parameter can widen a supplier's scope.
- **BE-A-SEC2.** All authenticated internal users have equivalent access (no roles in v1). Region-based data isolation, if applicable, is enforced here in query construction — not on the frontend and not via a user role field.
- **BE-A-SEC3.** Sign supplier URLs with a key stored in Secret Manager. Verify signature and expiry on every supplier request.
- **BE-A-SEC4.** Audit-log every supplier-link resolution.
- **BE-A-SEC5.** Treat the signed URL as a bearer capability. Keep TTL short and provide revocation.

---

## 9. Testing Strategy

- **BE-A-T1.** Unit tests for KPI computation, filter parsing, token validation, signed-URL signing/verification.
- **BE-A-T2.** Integration tests for each endpoint against a seeded BigQuery layer (or emulator/fixtures) and Cloud SQL.
- **BE-A-T3.** Security tests proving supplier isolation cannot be bypassed by manipulated parameters or forged/expired links.
- **BE-A-T4.** Contract tests validating responses against the OpenAPI spec.

---

## 10. Open Questions

| ID | Question | Status |
|---|---|---|
| OQ-Data-1 | Data grain and history depth | Open |
| ~~OQ-Sec-2~~ | ~~Token refresh mechanism~~ | **Partially resolved** — Refresh mechanism confirmed: automatic sliding-window rotation (60-min window, reissued on every request; 8-hr absolute cap; no `/auth/refresh` endpoint). Signed-URL revocation policy still TBD (OQ-Sec-2b). |
| ~~OQ-USR-1~~ | ~~Which SSO claims are available?~~ | **Resolved** — `User` shape is minimal (`id`, `email`, `displayName`). No additional claims assumed. |
| ~~OQ-USR-2~~ | ~~Is region access enforced at the API or frontend layer?~~ | **Resolved** — API layer. Enforced in query construction (BE-A-SEC2). Frontend is region-agnostic. |
| ~~OQ-USR-3~~ | ~~What roles exist and what permissions do they grant?~~ | **Resolved** — No roles in v1. All authenticated internal users have equivalent access. |
| OQ-Prov-1 | Supplier-link provisioning mechanism (non-UI) | Under review |
| OQ-DB-1 | Sheets-to-BigQuery ingestion method (external tables vs scheduled load) | Phase 0 decision |
| OQ-SUP-1 | Generic supplier scope descriptor format (absent canonical supplier_id) | Open |
| OQ-FLT-5 | Will month-level period granularity be supported in addition to fiscal quarters? | Open |
| OQ-MAP-1 | Is Plant served via a dedicated `GET /plants` endpoint or included in `GET /kpis/filters/metadata`? | Open |
| OQ-API-15 | Does each GSIR sub-view (R12, 5 Stars, TCQ, FPS, MVT) have its own endpoint or one multi-block response? | Open |
| OQ-API-16 | Is the Products on Hold monthly pivot returned by the backend or assembled on the frontend? | Open |
| OQ-API-17 | Is "Suppliers Needing Attention" count a separate endpoint or derived from summary KPI payload? | Open |
