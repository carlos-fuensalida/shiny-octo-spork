# Chat API Specification

**Version:** 0.1
**Status:** Draft
**Last Updated:** 2026-07-15
**Backend:** Backend B (Chat Service — FastAPI on Cloud Run)

---

## Purpose

This document defines the HTTP API contract between the SPMS frontend (Next.js) and Backend B, the dedicated Chat Service.

The frontend calls Backend B **directly** for all chat interactions — requests do not route through Backend A. Backend B proxies messages to the AI Agent (Google ADK) and manages chat session state.

**Scope of this document:** Chat endpoints only. All KPI data, auth, supplier, and filter endpoints are in `API_SPEC.md` (Backend A).

Related specifications:

- `PRD-backend-b.md` — Backend B architecture and responsibilities
- `PRD-ai-agent.md` — AI Agent (Google ADK) scope and guardrails
- `API_SPEC.md` — Backend A (Nest.js) data endpoints
- `DATA_MODEL_SPEC.md` — entity shapes and TypeScript interfaces

---

## Conventions

### Base URL

All routes are prefixed with `/api/v1`.

```
https://<chat-service-cloud-run-host>/api/v1
```

Environment-specific base URL is managed via `NEXT_PUBLIC_CHAT_API_BASE_URL` in the frontend environment config. This is a **separate env var** from `NEXT_PUBLIC_API_BASE_URL` (Backend A).

### Authentication

Backend B validates the same bearer token issued by Backend A's SSO flow. Both services trust the same SSO provider.

```
Authorization: Bearer <token>
```

Supplier signed-URL sessions are **not permitted** to call any chat endpoint. Any request without a valid internal bearer token returns `403`.

### Request Format

- All request bodies are **JSON** (`Content-Type: application/json`).

### Response Format

Chat responses follow the same envelope convention as Backend A.

**Single resource:**

```json
{
  "data": { ... },
  "meta": {
    "requestId": "req-abc123"
  }
}
```

### Error Model

Same uniform error shape as Backend A.

```json
{
  "error": {
    "code": "SCOPE_CONTEXT_MISSING",
    "message": "viewContext is required when scope is CURRENT_VIEW.",
    "requestId": "req-abc123",
    "details": {}
  }
}
```

**Standard error codes:**

| HTTP Status | Code | Meaning |
|-------------|------|---------|
| 400 | `VALIDATION_ERROR` | Invalid or malformed request body |
| 400 | `SCOPE_CONTEXT_MISSING` | `scope` is `CURRENT_VIEW` but `viewContext` is absent |
| 401 | `UNAUTHORIZED` | Missing or invalid bearer token |
| 403 | `FORBIDDEN` | Supplier session or cross-user session access attempt |
| 429 | `RATE_LIMITED` | Per-user or per-session chat rate limit exceeded |
| 500 | `INTERNAL_ERROR` | Unexpected server error |
| 502 | `AGENT_UNAVAILABLE` | AI Agent did not respond or returned an error |

### Rate Limiting

Chat endpoints apply **tighter** per-user and per-session rate limits than Backend A to guard AI Agent cost. Exact limits are TBD (OQ-Chat-2). Responses include a standard `Retry-After` header on `429`.

### Versioning

This spec covers `v1`. Breaking changes will increment the version prefix.

---

## Endpoint Reference

### Group 70 — Chat

#### `POST /chat/message`

Sends a user message to the AI Agent via Backend B and returns the agent's response.

**Auth:** Bearer token required. Supplier sessions return `403`.

**Request body:**

```json
{
  "sessionId": "chat-sess-abc",
  "message": "Which supplier had the highest CAL PPM last quarter?",
  "scope": "GLOBAL",
  "viewContext": null
}
```

With `CURRENT_VIEW` scope:

```json
{
  "sessionId": "chat-sess-abc",
  "message": "Which of these suppliers is performing worst?",
  "scope": "CURRENT_VIEW",
  "viewContext": {
    "view": "quality",
    "activeFilters": {
      "region": "LAR",
      "supplierIds": ["sup-001", "sup-002"],
      "fiscalYear": 2026,
      "fiscalQuarter": "Q2"
    }
  }
}
```

**Request fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sessionId` | string | Yes | ADK session identifier. Generate client-side on session start; persist for the conversation lifetime. |
| `message` | string | Yes | The user's natural-language message. |
| `scope` | `GLOBAL \| CURRENT_VIEW` | Yes | `GLOBAL` — agent has access to all data. `CURRENT_VIEW` — agent is scoped to `viewContext`. |
| `viewContext` | object | Required if `scope` is `CURRENT_VIEW` | Active view name and applied filters. |
| `viewContext.view` | string | Yes (if viewContext present) | Current view name, e.g. `"quality"`, `"delivery"`, `"supplier"`. |
| `viewContext.activeFilters` | object | Yes (if viewContext present) | The active filter state from the frontend filter bar. |

**Response `200`:**

```json
{
  "data": {
    "sessionId": "chat-sess-abc",
    "reply": "Supplier Acme Components SA had the highest CAL PPM of 142 in Q2 2026.",
    "sources": [
      {
        "label": "Quality KPI — CAL PPM",
        "sql": "SELECT supplier_name, cal_ppm FROM quality_view WHERE period = '2026-Q2' ORDER BY cal_ppm DESC LIMIT 1",
        "dataAsOf": "2026-07-14T06:00:00Z"
      }
    ],
    "generativeUi": null
  },
  "meta": {
    "requestId": "req-abc123"
  }
}
```

**Response fields:**

| Field | Type | Description |
|-------|------|-------------|
| `sessionId` | string | Echo of the session id for client correlation. |
| `reply` | string | The agent's natural-language answer. |
| `sources` | array | SQL queries and data timestamps backing the answer. Required for traceability (see `PRD-ai-agent.md`). Empty array `[]` if the agent returned no grounded source. |
| `sources[].label` | string | Human-readable label for the data source. |
| `sources[].sql` | string | The SQL generated by the agent to produce the answer. |
| `sources[].dataAsOf` | string | Datetime — freshness timestamp of the underlying data. |
| `generativeUi` | object \| null | CopilotKit Generative UI payload when the agent returns an inline visualization. Shape TBD (OQ-Chat-6). `null` for text-only responses. |

**Response `400`:** Missing required fields or `scope` is `CURRENT_VIEW` without `viewContext`.

**Response `403`:** Supplier session or unauthenticated request.

**Response `429`:** Rate limit exceeded.

**Response `502`:** AI Agent did not respond. Frontend should display a retry prompt.

---

#### `POST /chat/session/new`

Creates a new chat session, clearing prior conversation context in the ADK session layer. The client uses the returned `sessionId` for all subsequent `/chat/message` calls in the new conversation.

**Auth:** Bearer token required.

**Request body:**

```json
{
  "previousSessionId": "chat-sess-abc"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `previousSessionId` | string | No | The session being replaced. Passed so Backend B can clean up ADK state. Omit on the very first session. |

**Response `200`:**

```json
{
  "data": {
    "sessionId": "chat-sess-xyz"
  },
  "meta": {
    "requestId": "req-abc123"
  }
}
```

**Response `403`:** `previousSessionId` belongs to a different user.

---

## Open Questions

| ID | Area | Question | Owner | Blocks |
|----|------|----------|-------|--------|
| OQ-Chat-1 | Streaming | Does the AI Agent support streaming responses? If so, should Backend B stream to the frontend? | Backend B / AI | Chat UX (typing indicator) |
| OQ-Chat-2 | Rate Limiting | What are the per-user and per-session chat rate limits? | Backend B | `429` handling UX |
| OQ-Chat-3 | Sessions | How long are ADK sessions retained before expiry? | Backend B / AI | Session expiry handling |
| OQ-Chat-4 | Limits | Is there a maximum message length or turn limit per session? | Business / Backend B | Chat input validation |
| OQ-Chat-5 | Sessions | Does Backend B persist session history independently of ADK, or is ADK the source of truth for history? | Backend B | Session architecture |
| OQ-Chat-6 | Generative UI | What is the CopilotKit Generative UI payload shape returned in `generativeUi`? | Backend B / Frontend | Chat panel visualization rendering |

---

## Changelog

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-07-15 | Initial draft. Split from API_SPEC.md (v0.1) following Backend A / Backend B architecture clarification. |
