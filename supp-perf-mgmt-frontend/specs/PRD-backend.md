# PRD-backend.md — SUPERSEDED

> **This document has been superseded.**
>
> The backend has been split into two separate services:
>
> - **`PRD-backend-a.md`** — Backend A: Data API (Nest.js). All KPI data, auth, supplier signed URLs, and saved filters.
> - **`PRD-backend-b.md`** — Backend B: Chat Service (FastAPI). Chat proxy and session management.
>
> Do not update this file. Update the appropriate successor document instead.

---

# PRD-backend.md — SPMS Data API (Backend) [ARCHIVED]

Component Requirements Document

---

## 1. Document Control

| Field | Value |
|---|---|
| Component | Data API (Backend) — ARCHIVED |
| Tech | FastAPI (Python), Google Cloud Run |
| Version | 0.1 (Archived) |
| Status | Superseded — see PRD-backend-a.md and PRD-backend-b.md |
| Owner | Full-Stack Developers |
| Parent | `PRD.md` |
| Peers | `PRD-frontend.md`, `PRD-ai-agent.md` |

Requirement IDs in this document are namespaced `BE-###`.

---

## 2. Purpose and Responsibilities

The Data API is the single backend the frontend talks to. It has five responsibilities:

1. Serve aggregated KPI data from the centralized BigQuery layer.
2. Handle SSO and issue backend access tokens.
3. Generate and validate supplier signed URLs and serve the supplier limited view.
4. Persist user preferences and saved filters in Cloud SQL.
5. Proxy chat requests to the AI Agent backend (the frontend never calls the agent directly).

Non-responsibilities: no LLM logic (that lives in the agent), no UI, no direct raw-source reads outside the centralized BigQuery layer.

---

## 3. Architecture and Constraints

- **BE-C1.** The frontend calls only this API. This API is the only caller of the AI Agent backend from the request path.
- **BE-C2.** All KPI reads go through the centralized BigQuery layer, never against raw Sheets or raw BQ tables directly.
- **BE-C3.** Backend-to-backend and backend-to-GCP auth uses service accounts with least privilege. No long-lived keys; Bitbucket uses Workload Identity Federation.
- **BE-C4.** All secrets in Secret Manager.
- **BE-C5.** Data isolation for suppliers is enforced here, in the query layer. It is never delegated to the frontend or the LLM.
- **BE-C6.** Deployed on Cloud Run with Dev/QA/Prod environments.

---

## 4. Centralized BigQuery Layer

- **BE-DR1.** Build a centralized BigQuery layer that joins Google Sheets (~60% of data) and BigQuery (~40%) into one governed query surface. Sheets ingestion into BigQuery uses BigQuery external tables or a scheduled load; the mechanism is a Phase 0 decision recorded here once chosen.
- **BE-DR2.** The layer exposes curated views/tables per KPI domain (Quality, Delivery) plus a supplier-scoped view for the supplier limited view.
- **BE-DR3.** Each queryable surface exposes a `data_as_of` timestamp so the API and agent can report data currency.
- **BE-DR4.** A KPI is added to the layer only when its definition and source are finalized. Undefined KPIs are excluded.
- **BE-DR5.** Data grain and history depth are unconfirmed (OQ-Data-1). Query functions must accept a period/date-range parameter rather than assuming a fixed grain.

### KPI definition registry

- **BE-FR-001.** Maintain a KPI registry (config or table) with, per KPI: `id`, `name`, `domain` (quality/delivery), `formula_sql`, `unit`, `direction` (higher/lower better), `target`, and `dimensions` (e.g. supplier, category, region, period).
  - *Acceptance:* Given a finalized KPI, when it is added to the registry, then the API can compute and serve it without code changes to endpoints.
  - *Empty state:* A KPI with missing definition or source is not registered and does not appear in the API surface.

---

## 5. Functional Requirements — Endpoints

All endpoints return JSON. All list endpoints support pagination and filtering. All responses include a `data_as_of` field where data-backed.

### 5.1 Authentication and session

- **BE-FR-010. SSO login.** Provide an endpoint that completes Google Workspace SSO and returns a backend-issued access token.
  - *Given* a valid Google Workspace identity, *when* the SSO callback completes, *then* the API issues an access token with a defined lifespan and a refresh mechanism.
  - Token lifespan and refresh policy: proposed access token 60 minutes, refresh 8 hours (to confirm, OQ-Sec-2). "Appropriate lifespan" from the spec is quantified here.
  - Okta support is planned later; the token issuance interface must be IdP-agnostic.
- **BE-FR-011. Token validation.** Validate the access token on every protected request and reject expired or tampered tokens with `401`.
- **BE-FR-012. Current user.** Return the authenticated user's profile and role (internal) for the frontend to render persona-appropriate UI.

### 5.2 KPI and view data

- **BE-FR-020. Summary data.** Return the leadership summary payload: headline quality and delivery KPIs with current value, target, direction, and trend.
- **BE-FR-021. Quality view data.** Return all finalized quality KPIs, sliceable by the supported dimensions and global filters.
- **BE-FR-022. Delivery view data.** Return all finalized delivery KPIs, same slicing model.
- **BE-FR-023. Supplier view data.** Return per-supplier KPI data for internal users (all suppliers).
- **BE-FR-024. Supplier comparison data.** Return KPI data for two or more selected suppliers side by side.
- **BE-FR-025. Single-KPI detail.** Return detail for one KPI by `id` (values, breakdowns, trend, target) to back a per-KPI view.
  - *Given* a finalized KPI id, *when* requested with filters, *then* the API returns its computed values plus metadata (unit, direction, target, `data_as_of`).
  - *Error state:* Unknown or unfinalized KPI id returns `404`.
- **BE-FR-026. Filter metadata.** Return the available filter dimensions and their allowed values so the frontend can build global and per-view filters.

Common contract for data endpoints:
- Query params: `filters` (dimension key/value pairs), `date_from`, `date_to`, `page`, `page_size`.
- Response includes `data`, `data_as_of`, and pagination metadata (`page`, `page_size`, `total`).
- Empty result returns `200` with `data: []`, not an error.

### 5.3 Saved filters and preferences

- **BE-FR-030. Save filter set.** Persist a named filter combination for the authenticated user in Cloud SQL, tagged with scope (global or a specific view).
- **BE-FR-031. List saved filters.** Return the user's saved filter sets.
- **BE-FR-032. Apply / update / delete saved filter.** Support update and delete of a saved filter the user owns.
  - *Given* a saved filter owned by another user, *when* update or delete is attempted, *then* return `403`.
- **BE-FR-033. User preferences.** Persist and return user UI preferences (e.g. default view, default filters).

### 5.4 Supplier signed-URL access

- **BE-FR-040. Generate signed URL.** Provide a non-public mechanism (called by the provisioning process, not the frontend) that generates a signed URL encoding: scope (supplier limited view), a data-scope selector, an expiry, and a signature.
  - Provisioning trigger is a non-UI mechanism, under stakeholder review (OQ-Prov-1). This endpoint is invoked by that mechanism.
  - Because there is no canonical `supplier_id` (A4), the data-scope selector is a generic scope descriptor defined at provisioning time rather than a clean id reference.
- **BE-FR-041. Validate signed URL.** On access, verify signature and expiry. Reject invalid or expired links with a clear expiry page signal (`401`/`410`).
- **BE-FR-042. Serve supplier limited view.** Return only the data permitted by the link's scope. Never return other suppliers' data. No chatbot access for this path.
  - *Given* a valid supplier link, *when* the limited view loads, *then* only in-scope data is returned and every response is logged with the link identifier and timestamp.
  - *Security:* Isolation is enforced by server-side query scoping, not by any client-supplied parameter.
- **BE-FR-043. Revocation.** Support invalidating a signed URL before its natural expiry (mechanism to confirm, OQ-Sec-2).

### 5.5 Chat proxy

- **BE-FR-050. Chat proxy.** Accept chat requests from the frontend and forward them to the AI Agent backend, authenticating with a service account.
  - Request carries: user identity/session, scope (`global` or `current_view`), and, for current-view scope, the applied filters plus the current view's dataset/summary context.
  - *Given* an internal authenticated user, *when* they send a chat message, *then* the API forwards it to the agent and streams or returns the agent response.
  - *Given* a supplier session, *when* a chat request is attempted, *then* return `403` (suppliers have no chatbot).
- **BE-FR-051. Session pass-through.** Pass the ADK session identifier so the agent can persist or start conversations (see `PRD-ai-agent.md`).
- **BE-FR-052. Chat logging.** Log every chat request/response with user, scope, latency, and the agent's returned query reference for traceability (SEC5).

---

## 6. API Contract Standards

- **BE-STD1.** No existing contract; this team authors an OpenAPI spec as the first API deliverable (Phase 0).
- **BE-STD2. Error model.** Uniform error body: `{ "error": { "code", "message", "details" } }`. Standard status codes: `400` validation, `401` auth, `403` forbidden, `404` not found, `410` gone (expired link), `429` rate limit, `500` server.
- **BE-STD3. Pagination.** Page/size based, with `total` in responses.
- **BE-STD4. Rate limiting.** Apply per-user and per-session rate limits, tighter on the chat proxy to protect agent cost.
- **BE-STD5. Versioning.** Prefix routes with `/api/v1`.
- **BE-STD6. Validation.** Validate all inputs (query params, bodies) and reject malformed requests with `400`.

---

## 7. Non-Functional Requirements

| ID | Area | Target |
|---|---|---|
| BE-NFR1 | Latency | Not critical; aggregated KPI responses within a few seconds is acceptable |
| BE-NFR2 | Concurrency | ~5 concurrent, up to ~100 users |
| BE-NFR3 | Cost | Guard BigQuery scan cost via curated views, partitioning/clustering, and query caching |
| BE-NFR4 | Observability | Structured logs, request tracing, and metrics to Cloud Logging/Monitoring |
| BE-NFR5 | Security | Least-privilege service accounts, Secret Manager, no keys in code or CI |

---

## 8. Security and Data Isolation

- **BE-SEC1.** Enforce supplier isolation in query construction. No client parameter can widen a supplier's scope.
- **BE-SEC2.** Internal analysts may query all suppliers, including comparison. Enforce role checks from the validated token.
- **BE-SEC3.** Sign supplier URLs with a key stored in Secret Manager. Verify signature and expiry on every supplier request.
- **BE-SEC4.** Audit-log every supplier-link resolution and every chat proxy call.
- **BE-SEC5.** Treat the signed URL as a bearer capability. Keep TTL short and provide revocation.

---

## 9. Testing Strategy

- **BE-T1.** Unit tests for KPI computation, filter parsing, token validation, signed-URL signing/verification.
- **BE-T2.** Integration tests for each endpoint against a seeded BigQuery layer (or emulator/fixtures) and Cloud SQL.
- **BE-T3.** Security tests proving supplier isolation cannot be bypassed by manipulated parameters or forged/expired links.
- **BE-T4.** Contract tests validating responses against the OpenAPI spec.

---

## 10. Open Questions

| ID | Question | Status |
|---|---|---|
| OQ-Data-1 | Data grain and history depth | Open |
| OQ-Sec-2 | Token TTL/refresh and signed-URL revocation policy | Open (proposed values above) |
| OQ-Prov-1 | Supplier-link provisioning mechanism (non-UI) | Under review |
| OQ-DB-1 | Sheets-to-BigQuery ingestion method (external tables vs scheduled load) | Phase 0 decision |
| OQ-SUP-1 | Generic supplier scope descriptor format (absent canonical supplier_id) | Open |
