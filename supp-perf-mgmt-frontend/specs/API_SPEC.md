# API Specification — Backend A (Data API)

**Version:** 0.3  
**Status:** Draft  
**Last Updated:** 2026-07-15  
**Backend:** Backend A (Data API — Nest.js on Cloud Run)

---

## Purpose

This document defines the HTTP API contract between the SPMS frontend (Next.js) and **Backend A**, the primary Data API (Nest.js on Cloud Run).

Backend A serves all KPI data, authentication, supplier access, and saved filters. **Chat endpoints are not here** — they are served by Backend B and documented in `CHAT_API_SPEC.md`.

The frontend **never** calls BigQuery, Google Sheets, or the AI Agent directly.

Related specifications:

- `CHAT_API_SPEC.md` — Backend B (Chat Service) endpoint contract *(chat only)*
- `VIEW_DATA_MAP_SPEC.md` — view-to-data mapping and data model gaps from Figma review
- `DATA_MODEL_SPEC.md` — entity shapes and TypeScript interfaces
- `PRD-backend-a.md` — Backend A architecture and responsibilities
- `PRD-backend-b.md` — Backend B architecture and responsibilities
- `PRD-frontend.md` — frontend service layer constraints
- `FILTER_SPEC.md` — filter schema and URL encoding *(pending)*
- `CHART_SPEC.md` — chart dataset shapes *(pending)*
- `TABLE_SPEC.md` — table/grid shapes *(pending)*
- `KPI_DEFINITION_SPEC.md` — per-KPI calculation rules *(pending)*

---

## Conventions

### Base URL

All routes are prefixed with `/api/v1`.

```
https://<cloud-run-host>/api/v1
```

Environment-specific base URLs are managed via `NEXT_PUBLIC_API_BASE_URL` in the frontend environment config.

> **Chat endpoints** use a separate base URL: `NEXT_PUBLIC_CHAT_API_BASE_URL` (Backend B). See `CHAT_API_SPEC.md`.

### Authentication

**SSO provider:** Google Workspace (confirmed). Okta will be added later as a second provider; the token issuance interface is IdP-agnostic so the frontend flow does not change.

**Deployment topology:** Frontend and Backend A are separate Cloud Run services on subdomains of the same parent domain (e.g. `app.<domain>` and `api.<domain>`). The session cookie is set with `Domain=.<domain>` so the browser sends it to both subdomains automatically.

**Cookie configuration:**
```
HttpOnly; Secure; SameSite=Lax; Domain=.<parent-domain>
```
- `HttpOnly` — not accessible to JavaScript; XSS cannot steal it.
- `Secure` — HTTPS only.
- `SameSite=Lax` — sent on same-site navigations and top-level GET redirects; blocked on cross-site POSTs (CSRF protection).
- `Domain=.<parent-domain>` — shared across all subdomains of the parent domain.

**CORS:** Backend A sets `Access-Control-Allow-Origin: https://app.<parent-domain>` (exact origin, not wildcard) and `Access-Control-Allow-Credentials: true`. All frontend `fetch` calls use `credentials: 'include'`.

**Token delivery:** Backend A sets the session cookie after the OAuth callback completes. The frontend never reads or stores the token — the browser attaches the cookie automatically on every request. No `Authorization` header is sent by the frontend.

**Token lifetime and refresh:** Automatic sliding-window rotation (confirmed).
- Access token: **60-minute sliding window** — Backend A silently reissues the cookie on every authenticated request, resetting the 60-min clock. No explicit refresh call from the frontend.
- Absolute session cap: **8 hours** — after 8 hr of continuous use the session is invalidated and the user must re-authenticate via Google SSO regardless of activity.
- On expiry (either idle 60 min or 8 hr cap): Backend A returns `401`; Next.js middleware redirects to `GET /api/v1/auth/login`.

**Internal user auth flow:**
1. Next.js middleware detects no valid session cookie → redirects to `GET /api/v1/auth/login`
2. Backend A redirects to Google OAuth consent screen
3. User authenticates with Google (Google-managed screen, client's Google Workspace)
4. Google redirects to `GET /api/v1/auth/callback`
5. Backend A validates the Google identity, issues the session cookie (60-min sliding, 8-hr absolute cap), and redirects to the frontend root (`/`)
6. Frontend calls `GET /auth/me` to hydrate the user context

Backend A validates and rotates the session cookie on every protected request; missing or expired sessions return `401 Unauthorized`.

Supplier signed-URL routes do **not** use the session cookie — they authenticate via the signed URL itself (see [Supplier Signed URLs](#supplier-signed-urls)).

### Request Format

- `GET` requests pass filters and pagination as **query parameters**.
- `POST` / `PUT` / `PATCH` request bodies are **JSON** (`Content-Type: application/json`).
- `DELETE` requests have no body.

### Response Format

All responses follow the envelope defined in `DATA_MODEL_SPEC.md`.

**Single resource:**

```json
{
  "data": { ... },
  "meta": {
    "requestId": "req-abc123",
    "reportingPeriod": "2026-Q2",
    "region": "GLOBAL",
    "lastUpdated": "2026-07-14T06:00:00Z"
  }
}
```

**Collection:**

```json
{
  "data": [ ... ],
  "meta": { ... },
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "totalItems": 120,
    "totalPages": 5
  }
}
```

### Pagination

List endpoints accept:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | `1` | Page number (1-indexed) |
| `pageSize` | integer | `25` | Items per page |

### Error Model

All errors return a consistent shape regardless of status code.

```json
{
  "error": {
    "code": "FILTER_NOT_FOUND",
    "message": "No saved filter with id 'svf-999' exists for this user.",
    "requestId": "req-abc123",
    "details": {}
  }
}
```

**Standard error codes:**

| HTTP Status | Code | Meaning |
|-------------|------|---------|
| 400 | `VALIDATION_ERROR` | Invalid query params or request body |
| 401 | `UNAUTHORIZED` | Missing, invalid, or expired session cookie / expired signed URL |
| 403 | `FORBIDDEN` | Token valid but insufficient permissions |
| 404 | `NOT_FOUND` | Resource does not exist |
| 410 | `LINK_EXPIRED` | Supplier signed URL has expired |
| 422 | `UNPROCESSABLE` | Semantically invalid input |
| 429 | `RATE_LIMITED` | Per-user or per-session rate limit exceeded |
| 500 | `INTERNAL_ERROR` | Unexpected server error |
| 503 | `UPSTREAM_UNAVAILABLE` | BigQuery or upstream source unavailable |

### Rate Limiting

Rate limiting is applied per authenticated user and per session. Limits TBD — responses include standard `Retry-After` header when a `429` is returned.

### Versioning

This spec covers `v1`. Breaking changes will increment the version prefix.

---

## Endpoint Reference

### Group 10 — Authentication

#### `GET /auth/login`

Initiates the Google SSO OAuth flow. Called by Next.js middleware when no valid session cookie is present.

**Auth:** None.

**Behaviour:** Redirects to Google OAuth consent screen. After successful authentication Google redirects to `/auth/callback`.

---

#### `GET /auth/callback`

OAuth callback handler. Called by Google after the user authenticates.

**Auth:** None (validated internally via OAuth state parameter).

**Behaviour:** Validates the Google identity, issues a backend access token (60 min TTL) and a refresh token (8 hr TTL), sets both as `HttpOnly` cookies, then redirects the user to the frontend root (`/`).

**Response `302`:** Redirect to `/` with `HttpOnly` session cookies set.
**Response `401`:** OAuth state mismatch or Google identity rejected.

---

#### `POST /auth/logout`

Clears the session cookies and invalidates the server-side session.

**Auth:** Session cookie required.

**Response `204`:** Cookies cleared. Frontend redirects to `/login`.
**Response `401`:** No active session.

---

#### `GET /auth/me`

Returns the profile of the currently authenticated user.

**Auth:** Session cookie required.

**Response `200`:**

```json
{
  "data": {
    "id": "usr-123",
    "email": "j.smith@whirlpool.com",
    "displayName": "John Smith"
  },
  "meta": {
    "requestId": "req-abc123"
  }
}
```

> No `role` or `regionAccess` fields. All authenticated internal users have equivalent access (OQ-USR-3 resolved). Region enforcement happens inside query construction on Backend A, not via a field on the user object (OQ-USR-2 resolved).

**Response `401`:** Session cookie missing or expired.

---

#### `POST /auth/validate`

Validates the session cookie and returns its claims. Used by the frontend on app load to confirm the session is still active before rendering protected routes.

**Auth:** Session cookie required.

**Response `200`:**

```json
{
  "data": {
    "valid": true,
    "expiresAt": "2026-07-15T18:00:00Z"
  },
  "meta": {
    "requestId": "req-abc123"
  }
}
```

**Response `401`:** Token invalid or expired.

---

### Group 20 — KPI Data

All KPI endpoints require a valid session cookie. Region filtering defaults to `GLOBAL` when not specified.

#### Common KPI Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `region` | `GLOBAL \| LAR \| NAR` | No | Defaults to `GLOBAL` |
| `fiscalYear` | integer | No | e.g. `2026`. Defaults to current fiscal year |
| `fiscalQuarter` | `Q1 \| Q2 \| Q3 \| Q4` | No | Defaults to most recent complete quarter |
| `month` | integer (1–12) | No | Month-level filter. Mutually exclusive with `fiscalQuarter`. TBD — OQ-FLT-5 |
| `supplierIds` | comma-separated strings | No | Filter results to specific supplier IDs |
| `plantIds` | comma-separated strings | No | Filter results to specific plant IDs (OQ-MAP-1) |
| `commodity` | string | No | Filter by commodity name |
| `subcommodity` | string | No | Filter by sub-commodity classification |
| `isFocusSupplier` | boolean | No | When `true`, return only focus-watch-list suppliers |

---

#### `GET /kpis/summary`

Returns headline KPI cards for the Summary (Leadership) view. Returns one `KpiCard` per finalized KPI across both Delivery and Quality categories.

**Auth:** Session cookie required.

**Query params:** See [Common KPI Query Parameters](#common-kpi-query-parameters).

**Response `200`:**

```json
{
  "data": [
    {
      "kpiId": "kpi-cal-ppm",
      "kpiName": "CAL PPM",
      "category": "QUALITY",
      "region": "GLOBAL",
      "value": 142,
      "unit": "PPM",
      "target": null,
      "status": null,
      "trendDirection": null,
      "reportingPeriod": "2026-Q2",
      "lastUpdated": "2026-07-14T06:00:00Z"
    }
  ],
  "meta": {
    "requestId": "req-abc123",
    "reportingPeriod": "2026-Q2",
    "region": "GLOBAL",
    "lastUpdated": "2026-07-14T06:00:00Z"
  }
}
```

> `target` and `status` are `null` until threshold definitions are confirmed (OQ-KPI-3).

---

#### `GET /kpis/quality`

Returns all Quality KPI cards, optionally filtered by region and supplier.

**Auth:** Session cookie required.

**Query params:** See [Common KPI Query Parameters](#common-kpi-query-parameters).

**Response `200`:** Same shape as `/kpis/summary`, `category` is always `"QUALITY"`.

---

#### `GET /kpis/delivery`

Returns all Delivery KPI cards, optionally filtered by region and supplier.

**Auth:** Session cookie required.

**Query params:** See [Common KPI Query Parameters](#common-kpi-query-parameters).

**Response `200`:** Same shape as `/kpis/summary`, `category` is always `"DELIVERY"`.

---

#### `GET /kpis/{kpiId}`

Returns a single KPI card with extended detail, including historical trend data.

**Auth:** Session cookie required.

**Path params:**

| Param | Type | Description |
|-------|------|-------------|
| `kpiId` | string | KPI identifier, e.g. `kpi-cal-ppm` |

**Query params:** See [Common KPI Query Parameters](#common-kpi-query-parameters).

**Response `200`:**

```json
{
  "data": {
    "kpiId": "kpi-cal-ppm",
    "kpiName": "CAL PPM",
    "category": "QUALITY",
    "region": "GLOBAL",
    "value": 142,
    "unit": "PPM",
    "target": null,
    "status": null,
    "trendDirection": null,
    "reportingPeriod": "2026-Q2",
    "lastUpdated": "2026-07-14T06:00:00Z",
    "history": [
      { "kpiId": "kpi-cal-ppm", "period": "2026-Q1", "value": 158, "region": "GLOBAL" },
      { "kpiId": "kpi-cal-ppm", "period": "2025-Q4", "value": 175, "region": "GLOBAL" }
    ]
  },
  "meta": { ... }
}
```

> `history` granularity (monthly vs. quarterly) and depth (number of periods) are TBD (OQ-HIST-1, OQ-HIST-2).

**Response `404`:** `kpiId` not found or not yet configured in the KPI registry.

##### Per-`kpiId` extended response variants

The generic shape above is the **default**. Several KPIs surface structures a single-value card cannot carry — charts and multi-column tables — so those `kpiId`s return a KPI-specific extended payload instead. Each corresponds to an interface in `DATA_MODEL_SPEC.md` and is currently served by a mock route handler under `src/app/api/mock/api/v1/kpis/`, which is the reference implementation for Backend A.

| `kpiId` | Envelope | Payload interface | Notes |
|---|---|---|---|
| `kpi-ppm` | `ApiResponse<T>` | `PpmKpiDetail` | Aggregate FY/Plan/YTD/Rolling + `monthly` trend, `byCommodity` breakdown rows (each with its own trend), `offenders`. Carries `ytd2026Status` / `rollingR3Status` — see below (SPM-130) |
| `kpi-cal` | `ApiResponse<T>` | `CalKpiDetail` | Same shape as `kpi-ppm`, broken down `byRegion` (SPM-130) |
| `kpi-products-on-hold` | **`ApiListResponse<T>`** | `ProductsOnHoldKpi` | **One entry per segment scope** (`GLOBAL`, `NAR`, `LAR`, `FPS_ONLY`) — the page renders a chart card per entry. `carryOver2025` is a single 2025 scalar, not a monthly series (SPM-132) |
| `kpi-exhibits` | **`ApiListResponse<T>`** | `QualityExhibitsKpi` | **One entry per region** (`GLOBAL`, `NAR`, `LAR`). A status breakdown — deliberately **not** `OpenActionsKpi`, which remains the `kpi-8d-capa` shape (SPM-132) |

> **RAG cell status is backend-owned.** `ytd2026Status` / `rollingR3Status` on the PPM/CAL payloads carry the red/amber/green assessment for highlighted table cells, exactly as `KpiCard.status` already does. Thresholds vary per KPI and reset yearly, and the same judgement feeds the chatbot, alerts, and exports, so it must not be derived per view. Both are optional while this contract is open.
>
> Purely arithmetic figures are the opposite case and are **derived in the UI** — e.g. the Exhibits donut's center total is the sum of its five counts, so the label can never disagree with the arcs.

Endpoints for the remaining Quality sections (`kpi-gsir`, `kpi-piq-maturity`, `kpi-risk-rating-components`, `kpi-risk-rating-fps`, `kpi-focus-supplier`, `kpi-8d-capa`) exist in the frontend service layer but their payloads are not yet confirmed against a design — they will be added to this table as each section's ticket lands.

---

#### `GET /kpis/supplier/{supplierId}`

Returns all KPI results scoped to a single supplier. Used by the Supplier View.

**Auth:** Session cookie required.

**Path params:**

| Param | Type | Description |
|-------|------|-------------|
| `supplierId` | string | Supplier identifier |

**Query params:** See [Common KPI Query Parameters](#common-kpi-query-parameters).

**Response `200`:**

```json
{
  "data": {
    "supplier": {
      "supplierId": "sup-001",
      "supplierName": "Acme Components SA",
      "region": "LAR"
    },
    "kpis": [
      {
        "supplierId": "sup-001",
        "kpiId": "kpi-cal-ppm",
        "kpiName": "CAL PPM",
        "category": "QUALITY",
        "region": "LAR",
        "value": 98,
        "unit": "PPM",
        "status": null,
        "reportingPeriod": "2026-Q2",
        "lastUpdated": "2026-07-14T06:00:00Z"
      }
    ]
  },
  "meta": { ... }
}
```

**Response `404`:** Supplier not found.

---

#### `GET /kpis/comparison`

Returns KPI results for two or more suppliers side-by-side. Used by the Supplier Comparison view.

**Auth:** Session cookie required.

**Query params:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `supplierIds` | comma-separated strings | **Yes** | Minimum 2, maximum TBD |
| `region` | `GLOBAL \| LAR \| NAR` | No | Defaults to `GLOBAL` |
| `fiscalYear` | integer | No | Defaults to current fiscal year |
| `fiscalQuarter` | `Q1 \| Q2 \| Q3 \| Q4` | No | Defaults to most recent quarter |
| `category` | `QUALITY \| DELIVERY` | No | Filter by KPI category |

**Response `200`:**

```json
{
  "data": [
    {
      "supplierId": "sup-001",
      "supplierName": "Acme Components SA",
      "kpis": [ { ... }, { ... } ]
    },
    {
      "supplierId": "sup-002",
      "supplierName": "Global Parts Ltd",
      "kpis": [ { ... }, { ... } ]
    }
  ],
  "meta": { ... }
}
```

**Response `400`:** Fewer than 2 `supplierIds` provided.

---

#### `GET /kpis/filters/metadata`

Returns available filter options (supplier list, available regions, fiscal periods) for populating filter UI controls.

**Auth:** Session cookie required.

**Response `200`:**

```json
{
  "data": {
    "regions": ["GLOBAL", "LAR", "NAR"],
    "fiscalYears": [2024, 2025, 2026],
    "fiscalQuarters": ["Q1", "Q2", "Q3", "Q4"],
    "months": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    "suppliers": [
      { "supplierId": "sup-001", "supplierName": "Acme Components SA", "region": "LAR" }
    ],
    "plants": [
      { "plantId": "plt-001", "plantName": "Greenville", "region": "NAR" },
      { "plantId": "plt-002", "plantName": "Findlay", "region": "NAR" }
    ],
    "commodities": ["Metal Components", "Steel", "Glass"],
    "subcommodities": []
  },
  "meta": { ... }
}
```

> Supplier list is intentionally lightweight (id + name + region). Full supplier details come from `/suppliers`.  
> `months` and `plants` added based on Figma design filter dimensions. `months` field is TBD pending OQ-FLT-5. `plants` field is TBD pending OQ-MAP-1 (may instead be a dedicated `GET /plants` endpoint).

---

### Group 30 — Saved Filters

#### `GET /filters`

Returns all saved filter preferences for the authenticated user.

**Auth:** Session cookie required.

**Response `200`:**

```json
{
  "data": [
    {
      "id": "svf-001",
      "userId": "usr-123",
      "name": "Top LATAM Suppliers",
      "region": "LAR",
      "supplierIds": ["sup-001", "sup-002"],
      "createdAt": "2026-06-01T08:00:00Z",
      "updatedAt": "2026-07-01T09:30:00Z"
    }
  ],
  "meta": { "requestId": "req-abc123" }
}
```

---

#### `POST /filters`

Saves a new filter preference for the authenticated user.

**Auth:** Session cookie required.

**Request body:**

```json
{
  "name": "Top LATAM Suppliers",
  "region": "LAR",
  "supplierIds": ["sup-001", "sup-002"]
}
```

**Response `201`:** Returns the created `SavedFilterPreference` object.

**Response `400`:** Validation error (e.g. missing `name`, invalid `region`).

**Response `422`:** User has reached the maximum saved filter limit (limit TBD — OQ-FLT-1).

---

#### `PUT /filters/{filterId}`

Updates an existing saved filter. Replaces the full filter definition.

**Auth:** Session cookie required.

**Path params:**

| Param | Type | Description |
|-------|------|-------------|
| `filterId` | string | Saved filter identifier |

**Request body:** Same shape as `POST /filters`.

**Response `200`:** Returns the updated `SavedFilterPreference` object.

**Response `403`:** Filter belongs to a different user.

**Response `404`:** Filter not found.

---

#### `DELETE /filters/{filterId}`

Deletes a saved filter preference.

**Auth:** Session cookie required.

**Path params:**

| Param | Type | Description |
|-------|------|-------------|
| `filterId` | string | Saved filter identifier |

**Response `204`:** No content. Filter deleted.

**Response `403`:** Filter belongs to a different user.

**Response `404`:** Filter not found.

---

### Group 40 — Suppliers & Plants

#### `GET /plants`

Returns the list of manufacturing plants. Used to populate the Plant filter in the global filter bar.

**Auth:** Session cookie required.

**Status:** TBD — may be folded into `GET /kpis/filters/metadata` instead of a dedicated endpoint (OQ-MAP-1).

**Query params:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `region` | `GLOBAL \| LAR \| NAR` | No | Filter plants by region |

**Response `200`:**

```json
{
  "data": [
    { "plantId": "plt-001", "plantName": "Greenville", "region": "NAR" },
    { "plantId": "plt-002", "plantName": "Findlay", "region": "NAR" },
    { "plantId": "plt-009", "plantName": "Sapse", "region": "LAR" }
  ],
  "meta": { "requestId": "req-abc123" }
}
```

---

#### `GET /suppliers`

Returns the list of suppliers available to the authenticated user.

**Auth:** Session cookie required.

**Query params:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `region` | `GLOBAL \| LAR \| NAR` | No | Filter by region |
| `search` | string | No | Fuzzy search on supplier name |
| `commodity` | string | No | Filter by commodity |
| `isFocusSupplier` | boolean | No | When `true`, return only focus-watch-list suppliers |
| `page` | integer | No | Defaults to `1` |
| `pageSize` | integer | No | Defaults to `25` |

**Response `200`:**

```json
{
  "data": [
    {
      "supplierId": "sup-001",
      "supplierName": "Acme Components SA",
      "region": "LAR",
      "supplierCode": null,
      "supplierStatus": null,
      "category": null,
      "commodity": null,
      "subcommodity": null,
      "supplierLocation": null,
      "isFocusSupplier": false
    }
  ],
  "meta": { ... },
  "pagination": { "page": 1, "pageSize": 25, "totalItems": 87, "totalPages": 4 }
}
```

> `supplierCode`, `supplierStatus`, `category`, `commodity` are `null` until sourced (OQ-SUP-2, OQ-SUP-3).  
> `subcommodity`, `supplierLocation` are `null` until confirmed (OQ-SUP-3).  
> `isFocusSupplier` defaults to `false`; definition of focus status TBD (OQ-SUP-4).

---

#### `GET /suppliers/{supplierId}`

Returns full details for a single supplier.

**Auth:** Session cookie required.

**Response `200`:** Returns a single `Supplier` object wrapped in the standard envelope.

**Response `404`:** Supplier not found.

---

### Group 50 — Supplier Signed URLs

These endpoints manage time-limited, scoped links shared with external suppliers. They do **not** use bearer tokens — authentication is the signed URL itself.

#### `POST /supplier-links`

Generates a signed URL for a specific supplier. Internal users only.

**Auth:** Session cookie required.

**Request body:**

```json
{
  "supplierId": "sup-001",
  "expiresInHours": 72
}
```

> `expiresInHours` range and defaults are TBD.

**Response `201`:**

```json
{
  "data": {
    "linkId": "lnk-xyz",
    "supplierId": "sup-001",
    "url": "https://<host>/supplier-view?token=<signed-token>",
    "expiresAt": "2026-07-18T10:00:00Z"
  },
  "meta": { "requestId": "req-abc123" }
}
```

---

#### `GET /supplier-links/{linkId}/validate`

Validates a signed URL token. Called by the frontend on the supplier view page load.

**Auth:** Signed URL token (passed as query param or path; exact mechanism TBD).

**Response `200`:**

```json
{
  "data": {
    "valid": true,
    "supplierId": "sup-001",
    "expiresAt": "2026-07-18T10:00:00Z"
  },
  "meta": { "requestId": "req-abc123" }
}
```

**Response `401`:** Token invalid.

**Response `410`:** Token expired. Frontend should show the "link expired" state.

---

#### `GET /supplier-links/{linkId}/data`

Returns the KPI data the supplier is permitted to see. Data scope is enforced server-side.

**Auth:** Signed URL token.

**Response `200`:** Shape TBD — will be a subset of `SupplierKpiResult[]` constrained to the supplier's own data.

**Response `401`:** Token invalid.

**Response `410`:** Token expired.

---

#### `DELETE /supplier-links/{linkId}`

Revokes a supplier signed URL before its natural expiry. Internal users only.

**Auth:** Session cookie required.

**Response `204`:** No content. Link revoked.

**Response `403`:** Link was not generated by the requesting user. (TBD — admin override?)

**Response `404`:** Link not found.

---

### Group 60 — Global Spend

#### `GET /spend`

Returns aggregated spend data for the active region and period.

**Auth:** Session cookie required.

**Query params:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `region` | `GLOBAL \| LAR \| NAR` | No | Defaults to `GLOBAL` |
| `fiscalYear` | integer | No | Defaults to current fiscal year |
| `fiscalQuarter` | `Q1 \| Q2 \| Q3 \| Q4` | No | Defaults to most recent quarter |

**Response `200`:**

```json
{
  "data": {
    "totalSpend": 42500000,
    "region": "GLOBAL",
    "fiscalYear": 2026,
    "fiscalQuarter": "Q2",
    "currency": "USD",
    "spendBySupplier": null,
    "spendByCommodity": null,
    "spendTrend": null
  },
  "meta": { ... }
}
```

> Breakdown fields are `null` until data granularity is confirmed (OQ-SPD-1).

---

### Chat Endpoints — Backend B

> Chat endpoints are **not** served by Backend A. The frontend calls Backend B (Chat Service) directly using `NEXT_PUBLIC_CHAT_API_BASE_URL`.
>
> See **`CHAT_API_SPEC.md`** for the full chat endpoint contract (`POST /chat/message`, `POST /chat/session/new`).

---

## Open Questions

| ID | Area | Question | Owner | Blocks |
|----|------|----------|-------|--------|
| ~~OQ-API-1~~ | Auth | ~~What is the exact SSO provider and token format (JWT claims)?~~ | **Resolved** | Google Workspace SSO confirmed. Okta planned as second provider later; flow unchanged for frontend. Token delivered as `HttpOnly` cookie (not Authorization header). |
| ~~OQ-API-2~~ | Auth | ~~What is the token refresh mechanism?~~ | **Resolved** | Automatic sliding-window rotation. 60-min access window reset on every request; 8-hr absolute session cap. No `/auth/refresh` endpoint. `401` → redirect to `/auth/login`. |
| OQ-API-3 | Rate Limiting | What are the per-user and per-session rate limits? | Backend | `429` handling UX |
| OQ-API-4 | Signed URLs | What is the valid range for `expiresInHours`? | Business | Supplier link generation UI |
| OQ-API-5 | Signed URLs | How is the signed token passed on supplier view routes (query param, path, cookie)? | Backend | Supplier view implementation |
| OQ-API-6 | Signed URLs | Can admins revoke links generated by other users? | Business | Link revocation permissions |
| OQ-API-7 | Comparison | Maximum number of suppliers in `/kpis/comparison`? | Business / Backend | Comparison view UI |
| OQ-API-8 | Chat | *(Moved to CHAT_API_SPEC.md — OQ-Chat-6)* | — | — |
| OQ-API-9 | Chat | *(Moved to CHAT_API_SPEC.md — OQ-Chat-1)* | — | — |
| OQ-API-10 | KPI Detail | Does `/kpis/{kpiId}` return chart-ready dataset or raw data points? | Backend A | Chart component design |
| OQ-API-11 | Spend | Will `/spend` expose breakdowns by supplier or commodity in v1? | Backend A | Spend view components |
| OQ-API-12 | Filters | Will saved filters persist `commodity`, `category`, `dateRange` in v1? | Business | Filter data shape |
| OQ-API-13 | Filters | Will month-level `month` param be supported alongside `fiscalQuarter`? Are they mutually exclusive? | Backend A | All KPI detail pages |
| OQ-API-14 | Plants | Is `GET /plants` a dedicated endpoint or part of `GET /kpis/filters/metadata`? | Backend A | Plant filter, PPM/CAL detail |
| OQ-API-15 | KPI Detail | Does each GSIR sub-view (R12, 5 Stars, TCQ, FPS, MVT) have its own endpoint, or one endpoint with multiple data blocks? | Backend A | GSIR detail page |
| OQ-API-16 | KPI Detail | Is the Products on Hold monthly column pivot returned by the backend or assembled on the frontend? | Backend A | Products on Hold table |
| OQ-API-17 | Summary | Is "Suppliers Needing Attention" count a separate endpoint or derived from the summary KPI payload? | Backend A | Summary view |

---

## Changelog

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-07-15 | Initial draft. All endpoints stubbed from PRD-backend.md. TBDs marked. |
| 0.2 | 2026-07-15 | Architecture correction: Backend A is Nest.js (not FastAPI). Chat endpoints removed and moved to CHAT_API_SPEC.md (Backend B). |
| 0.3 | 2026-07-15 | Added filter params (month, plantIds, commodity, subcommodity, isFocusSupplier) from Figma design review. Added GET /plants endpoint stub. Updated /kpis/filters/metadata and /suppliers responses with new fields. Added OQ-API-13 through OQ-API-17. |
