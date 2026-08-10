# PRD-backend-b.md — SPMS Chat Service (Backend B)

Component Requirements Document

---

## 1. Document Control

| Field | Value |
|---|---|
| Component | Chat Service (Backend B) |
| Tech | FastAPI (Python), Google Cloud Run |
| Version | 0.1 (Draft) |
| Status | Draft for stakeholder review |
| Owner | Full-Stack Developers |
| Parent | `PRD.md` |
| Peers | `PRD-frontend.md`, `PRD-backend-a.md`, `PRD-ai-agent.md` |

Requirement IDs in this document are namespaced `BE-B-###`.

---

## 2. Purpose and Responsibilities

Backend B is the dedicated Chat Service. The frontend calls it **directly** for all chat interactions — it does not route through Backend A. Backend B has two responsibilities:

1. Proxy chat requests from the frontend to the AI Agent (Google ADK), attaching auth context and enforcing scope.
2. Manage chat session state in coordination with the ADK session layer.

**Non-responsibilities:**

- No KPI data serving — all dashboard data comes from Backend A.
- No SSO token issuance — Backend B validates tokens issued by Backend A's SSO flow.
- No supplier signed-URL handling.
- No BigQuery reads — data retrieval is the AI Agent's responsibility via BigQuery MCP.
- No UI.

---

## 3. Architecture and Constraints

- **BE-B-C1.** The frontend calls Backend B directly for chat; it does not route through Backend A.
- **BE-B-C2.** Backend B validates the same bearer token issued by Backend A's SSO flow. Both services trust the same SSO provider.
- **BE-B-C3.** Supplier sessions (signed-URL access) are never permitted to reach Backend B. `403` is returned for any request without a valid internal bearer token.
- **BE-B-C4.** Backend B is the only service that calls the AI Agent. The frontend never calls the AI Agent directly.
- **BE-B-C5.** Backend-to-agent auth uses a service account with least privilege.
- **BE-B-C6.** All secrets in Secret Manager.
- **BE-B-C7.** Deployed on Cloud Run with Dev/QA/Prod environments, independent of Backend A.

---

## 4. Functional Requirements — Endpoints

See `CHAT_API_SPEC.md` for the full HTTP contract (request/response shapes, status codes, examples).

### 4.1 Chat proxy

- **BE-B-FR-010. Chat proxy.** Accept chat requests from the frontend and forward them to the AI Agent, authenticating with a service account.
  - Request carries: user identity, session identifier, scope (`GLOBAL` or `CURRENT_VIEW`), and for `CURRENT_VIEW` scope, the active view name and applied filters as context.
  - *Given* an internal authenticated user, *when* they send a chat message, *then* Backend B forwards it to the AI Agent and returns the agent's response (streamed or batched — OQ-Chat-1).
  - *Given* a supplier session or unauthenticated request, *when* a chat request arrives, *then* return `403`.
- **BE-B-FR-011. Scope enforcement.** Validate the `scope` field. For `CURRENT_VIEW`, ensure `viewContext` is present. Reject malformed scope payloads with `400`.
- **BE-B-FR-012. Chat logging.** Log every request/response pair with: user id, session id, scope, latency, agent query reference, and timestamp. Required for traceability (`PRD-ai-agent.md`).

### 4.2 Session management

- **BE-B-FR-020. Session pass-through.** Accept a client-supplied `sessionId` and pass it to the ADK session layer so the agent can maintain conversation context across messages.
- **BE-B-FR-021. New session.** Accept a request to start a new conversation. Invalidate the previous ADK session (if provided) and return a new `sessionId` for the client to use on subsequent messages.
- **BE-B-FR-022. Session isolation.** A session id is bound to the user who created it. Requests using another user's session id return `403`.

---

## 5. API Contract Standards

- **BE-B-STD1.** Authors an OpenAPI spec as the first deliverable (Phase 0), separate from Backend A's spec.
- **BE-B-STD2. Error model.** Same uniform error body as Backend A: `{ "error": { "code", "message", "details" } }`. Standard status codes: `400` validation, `401` auth, `403` forbidden, `429` rate limit, `500` server.
- **BE-B-STD3. Rate limiting.** Apply tighter per-user and per-session rate limits than Backend A to protect AI Agent cost. Limits TBD (OQ-Chat-2).
- **BE-B-STD4. Versioning.** Prefix routes with `/api/v1`.
- **BE-B-STD5. Validation.** Validate all inputs and reject malformed requests with `400`.

---

## 6. Non-Functional Requirements

| ID | Area | Target |
|---|---|---|
| BE-B-NFR1 | Latency | Agent responses may take several seconds; backend adds minimal overhead |
| BE-B-NFR2 | Streaming | Support streaming responses if the AI Agent supports it (OQ-Chat-1) |
| BE-B-NFR3 | Cost | Rate limiting is the primary cost guard for AI Agent usage |
| BE-B-NFR4 | Observability | Structured logs per request with agent query reference; metrics to Cloud Logging |
| BE-B-NFR5 | Security | Service account auth to AI Agent; no long-lived keys; all secrets in Secret Manager |

---

## 7. Security

- **BE-B-SEC1.** Validate the bearer token on every request. Reject supplier sessions (`403`) and unauthenticated requests (`401`).
- **BE-B-SEC2.** Never expose the AI Agent's internal endpoint URL or service account credentials to the frontend.
- **BE-B-SEC3.** Audit-log every chat proxy call with user, session, scope, and agent query reference.
- **BE-B-SEC4.** Session ids are user-scoped. Cross-user session access returns `403`.

---

## 8. Testing Strategy

- **BE-B-T1.** Unit tests for scope validation, session binding, and token verification.
- **BE-B-T2.** Integration tests for chat proxy against a mocked AI Agent response.
- **BE-B-T3.** Security tests: confirm supplier sessions are blocked; confirm cross-user session access is blocked.
- **BE-B-T4.** Contract tests validating requests/responses against the OpenAPI spec.

---

## 9. Open Questions

| ID | Question | Status |
|---|---|---|
| OQ-Chat-1 | Does the AI Agent support streaming responses? If so, does Backend B stream to the frontend? | Open |
| OQ-Chat-2 | What are the per-user and per-session rate limits for chat? | Open |
| OQ-Chat-3 | How long are ADK sessions retained before expiry? | Open |
| OQ-Chat-4 | Is there a maximum message length or conversation turn limit? | Open |
| OQ-Chat-5 | Does Backend B need to persist session history independently of ADK, or is ADK the source of truth? | Open |
