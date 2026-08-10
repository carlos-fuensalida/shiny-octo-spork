# Data Model Specification

**Version:** 0.3
**Status:** In Progress
**Last Updated:** 2026-07-15
**Supersedes:** DATA_MODEL.md (draft 0.1)

---

## Purpose

This document defines the domain entities, TypeScript interfaces, and relationships used by the Supplier Performance Management System (SPMS) frontend.

Goals:

- Provide a shared, authoritative data contract for frontend developers and AI-assisted tooling.
- Establish the shape of data consumed from Backend A (Nest.js/BigQuery layer) and Backend B (FastAPI Chat Service).
- Support implementation of KPI dashboards, supplier views, and filter persistence.
- Identify open contracts requiring backend or business clarification.

This document covers **domain entities and API response shapes**. Visualization-specific payload formats (charts, tables) are deferred to:

- `CHART_SPEC.md` — chart dataset definitions
- `TABLE_SPEC.md` — table/grid definitions
- `KPI_DEFINITION_SPEC.md` — per-KPI calculation rules and field semantics
- `FILTER_SPEC.md` — filter schemas and URL encoding
- `API_SPEC.md` — Backend A endpoint contracts (KPI data, auth, suppliers, filters)
- `CHAT_API_SPEC.md` — Backend B endpoint contracts (chat proxy and session management)

---

## Domain Overview

```
User
 └── SavedFilterPreference[]

Region (GLOBAL | LAR | NAR)
 ├── KpiCard[]
 │    ├── DeliveryKpiCard
 │    ├── QualityKpiCard
 │    └── KpiDetailCard (extended — see KPI Detail Interfaces)
 ├── Supplier[]
 │    └── SupplierKpiResult[]
 ├── Plant[]
 └── GlobalSpend
```

**Regions:**

| Value    | Description                                  |
|----------|----------------------------------------------|
| `GLOBAL` | Aggregates LAR and NAR; available to all users |
| `LAR`    | Latin America Region                          |
| `NAR`    | North America Region                          |

---

## Conventions

- All `id` fields are strings (UUIDs or opaque backend identifiers).
- All `datetime` fields are ISO 8601 strings (`"2026-07-15T10:00:00Z"`).
- All `date` fields are ISO 8601 date strings (`"2026-07"`).
- `null` indicates a value is unknown or not yet available.
- Fields marked **TBD** require backend or business clarification before implementation.
- Fields marked **OPTIONAL** may be absent in API responses; handle defensively.

---

## Entities

---

### User

**Status:** Defined
**Source:** Google Workspace SSO (confirmed). Okta planned as second provider in a later phase.

Represents an authenticated internal dashboard user. Supplier access uses signed URLs and does not produce a `User` record — see PRD-backend-a.md.

```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  firstName?: string;    // optional — from Google Workspace SSO profile
  lastName?: string;     // optional — from Google Workspace SSO profile
  createdAt?: string;    // datetime — optional profile metadata
  lastLoginAt?: string;  // datetime — optional profile metadata
}

type Region = 'GLOBAL' | 'LAR' | 'NAR';
```

**Example:**

```json
{
  "id": "usr-123",
  "email": "j.smith@whirlpool.com",
  "displayName": "John Smith",
  "firstName": "John",
  "lastName": "Smith"
}
```

**Notes:**

- User provisioning and management are out of scope for this application.
- The frontend derives display state from `displayName`. `firstName` and `lastName` are used for avatar initials when present; the component falls back to `displayName.slice(0, 2)`.
- **No roles (v1).** All authenticated internal users have the same access. No role field, no UI gating. This is a confirmed decision — do not add role checks.
- **Region enforcement (OQ-USR-2 resolved).** Region-based data isolation is enforced at the API layer (Backend A), not the frontend. The frontend does not gate views or data by region.

~~OQ-USR-1~~ **Resolved** — `firstName` and `lastName` are included as optional fields; components fall back to `displayName` when absent.
~~OQ-USR-2~~ **Resolved** — Region enforcement is at the API layer.
~~OQ-USR-3~~ **Resolved** — No roles in v1; all authenticated users have equivalent access.

---

### SavedFilterPreference

**Status:** Partially Defined
**Source:** Cloud SQL (persisted via Data API)

Allows users to store and reload named dashboard filter configurations.

```typescript
interface SavedFilterPreference {
  id: string;
  userId: string;
  name: string;
  region: Region;
  supplierIds: string[];
  createdAt: string;            // datetime
  updatedAt: string;            // datetime

  // Potential future fields — do not implement until confirmed
  businessUnit?: string;        // TBD
  commodity?: string;           // TBD
  subcommodity?: string;        // TBD — sub-level commodity classification
  category?: string;            // TBD
  dateRange?: DateRange;        // TBD — see FILTER_SPEC.md
  month?: number;               // TBD — 1–12; month-level period filter (see OQ-FLT-5)
  plantId?: string;             // TBD — manufacturing plant filter (see OQ-MAP-1)
  supplierLocation?: string;    // TBD — supplier geographic location
  isFocusSupplier?: boolean;    // TBD — focus supplier flag filter
  scorecardType?: string;       // TBD
  isDefault?: boolean;          // TBD — default filter support
  isShared?: boolean;           // TBD — shared filter support
}

interface DateRange {
  from: string;                 // date string, e.g. "2026-01"
  to: string;                   // date string, e.g. "2026-06"
}
```

**Example:**

```json
{
  "id": "svf-001",
  "userId": "usr-123",
  "name": "Top LATAM Suppliers",
  "region": "LAR",
  "supplierIds": ["sup-001", "sup-002"],
  "createdAt": "2026-06-01T08:00:00Z",
  "updatedAt": "2026-07-01T09:30:00Z"
}
```

**Open Questions:**

| ID | Question | Owner |
|----|----------|-------|
| OQ-FLT-1 | Maximum saved filters per user? | Business |
| OQ-FLT-2 | Can filters be shared between users? | Business |
| OQ-FLT-3 | Will a "default filter" concept exist? | Business |
| OQ-FLT-4 | Which filter dimensions will be persisted (commodity, category, etc.)? | Business |
| OQ-FLT-5 | Will month-level period granularity be supported, or only fiscal quarters? | Backend A |

---

### Supplier

**Status:** Partially Defined
**Source:** BigQuery / Backend Data API

Represents a supplier entity being evaluated in the dashboard.

```typescript
interface Supplier {
  supplierId: string;
  supplierName: string;
  region: Region;
  supplierCode?: string;        // TBD — internal code format unknown
  supplierStatus?: SupplierStatus; // TBD
  category?: string;            // TBD
  commodity?: string;           // TBD
  subcommodity?: string;        // TBD — sub-level commodity classification
  supplierLocation?: string;    // TBD — geographic location of supplier facility
  isFocusSupplier?: boolean;    // TBD — supplier is on the focus watch list
  parentSupplierId?: string;    // TBD — hierarchy support unknown
}

type SupplierStatus = 'ACTIVE' | 'INACTIVE' | 'WATCH'; // TBD — values subject to change
```

**Example:**

```json
{
  "supplierId": "sup-001",
  "supplierName": "Acme Components SA",
  "region": "LAR"
}
```

**Open Questions:**

| ID | Question | Owner |
|----|----------|-------|
| OQ-SUP-1 | Does the supplier data model include a parent/child hierarchy? | Backend / Business |
| OQ-SUP-2 | What are valid supplier status values? | Business |
| OQ-SUP-3 | How are `category` and `commodity` defined and sourced? | Backend |
| OQ-SUP-4 | What determines whether a supplier is a "Focus Supplier"? Is `isFocusSupplier` a static flag or computed? | Business |

---

### Plant

**Status:** Partially Defined — discovered in Figma design review
**Source:** BigQuery / Backend A (filter metadata or dedicated endpoint — OQ-MAP-1)

Represents a manufacturing plant where supplier parts are received and inspected. Plant is a major breakdown dimension for PPM and CAL KPIs, and appears as a filter in the global filter bar.

```typescript
interface Plant {
  plantId: string;
  plantName: string;
  region: Region;
  country?: string;             // TBD
}
```

**Known plants (from design):**

| Plant Name | Region |
|------------|--------|
| Greenville | NAR |
| Findlay | NAR |
| Cleveland | NAR |
| Tulsa | NAR |
| Horizon | NAR |
| Clyde | NAR |
| Fall River | NAR |
| Ottawa | NAR |
| Marion | NAR |
| Amana | NAR |
| Sapse | LAR |
| Aroma | LAR |
| Ramos | LAR |
| Manen | LAR |
| Supsa | LAR |
| Joinsville | LAR |
| Celaya | LAR |
| Manaus | LAR |

**Open Questions:**

| ID | Question | Owner |
|----|----------|-------|
| OQ-MAP-1 | Is `Plant` served as a dedicated `GET /plants` endpoint, or returned inside `GET /kpis/filters/metadata`? | Backend A |
| OQ-PLT-1 | Are plant-to-region assignments static config or data? | Backend A |
| OQ-PLT-2 | Can a plant belong to more than one region? | Business |

---

### ProductSegment

**Status:** Partially Defined — discovered in Figma design review (GSIR KPI)
**Source:** GSIR data from BigQuery

Represents product-type breakdowns used in the GSIR KPI. Not a standalone entity — used as a dimension within GSIR detail responses.

```typescript
type ProductSegment = 'MDA' | 'SDA' | 'FPS';

// MDA = Major Domestic Appliance
// SDA = Small Domestic Appliance
// FPS = Finished Product Segment

type ProductRegionSegment =
  | 'GLOBAL_OVERALL'
  | 'NAR_MDA'
  | 'LAR_MDA'
  | 'SDA'
  | 'FPS';
```

---

### GlobalSpend

**Status:** Partially Defined
**Source:** BigQuery

Represents aggregated spend data surfaced across dashboard views.

```typescript
interface GlobalSpend {
  totalSpend: number;
  region: Region;
  fiscalYear: number;           // e.g. 2026
  fiscalQuarter: FiscalQuarter;
  currency: string;             // ISO 4217, e.g. "USD"

  // Potential future fields
  spendBySupplier?: SpendBreakdown[]; // TBD
  spendByCommodity?: SpendBreakdown[]; // TBD
  spendTrend?: SpendTrendPoint[];      // TBD
}

type FiscalQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

interface SpendBreakdown {
  label: string;
  value: number;
  currency: string;
}

interface SpendTrendPoint {
  period: string;               // e.g. "2026-Q1"
  value: number;
  currency: string;
}
```

**Example:**

```json
{
  "totalSpend": 42500000,
  "region": "GLOBAL",
  "fiscalYear": 2026,
  "fiscalQuarter": "Q2",
  "currency": "USD"
}
```

**Open Questions:**

| ID | Question | Owner |
|----|----------|-------|
| OQ-SPD-1 | What is the data granularity? (supplier, commodity, category) | Backend |
| OQ-SPD-2 | Will multi-currency normalization happen at the API layer? | Backend |
| OQ-SPD-3 | How is Whirlpool's fiscal calendar defined? (fiscal year start month) | Business |

---

## KPI Entities

KPIs are organized into two categories: **Delivery** and **Quality**. All KPIs share a common card interface. Category-specific enumerations document which KPIs belong to each region.

---

### KpiCard (Shared Interface)

**Status:** Defined (High-Level)

The canonical shape for a KPI card rendered on the dashboard. All KPI API responses conform to this interface, with `value` typed broadly to accommodate numeric, percentage, and text-only KPIs.

```typescript
interface KpiCard {
  kpiId: string;
  kpiName: string;
  category: KpiCategory;
  region: Region;
  value: number | string | null;
  unit?: KpiUnit;
  target?: number | null;       // TBD — target logic not yet defined
  status?: KpiStatus | null;    // TBD — threshold/status logic not yet defined
  trendDirection?: TrendDirection | null; // TBD
  reportingPeriod: string;      // e.g. "2026-Q2" or "2026-06"
  lastUpdated: string;          // datetime
}

type KpiCategory = 'DELIVERY' | 'QUALITY';

type KpiUnit = 'PPM' | 'PERCENT' | 'COUNT' | 'DAYS' | 'USD' | 'INDEX'; // TBD — extend as KPIs are defined

type KpiStatus = 'GREEN' | 'YELLOW' | 'RED' | 'NEUTRAL'; // TBD — threshold logic not yet defined

type TrendDirection = 'UP' | 'DOWN' | 'FLAT';
```

**Example:**

```json
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
```

**Open Questions:**

| ID | Question | Owner |
|----|----------|-------|
| OQ-KPI-1 | Will all KPIs share this structure, or do some require custom fields? | Business / Backend |
| OQ-KPI-2 | Do any KPIs produce multiple simultaneous values? | Business |
| OQ-KPI-3 | Who owns target values and status thresholds? | Business |
| OQ-KPI-4 | What is the KPI data refresh frequency? | Backend |
| OQ-KPI-5 | What is the historical data retention window? | Backend |

---

### KpiHistoricalPoint

**Status:** TBD
**Purpose:** Supports trend charts for KPI cards. Shape pending confirmation of data granularity.

```typescript
interface KpiHistoricalPoint {
  kpiId: string;
  period: string;               // "2026-06" (monthly) or "2026-Q2" (quarterly) — see OQ-HIST-1
  value: number | string | null;
  region: Region;
}
```

> **Design finding:** The PPM and CAL detail pages in Figma show month-level periods (Apr/May/Jun '26) and a Rolling 3-Month aggregate. If Backend A supports month-level grain, `period` will use `"YYYY-MM"` format. See OQ-HIST-1 and OQ-FLT-5.

**Open Questions:**

| ID | Question | Owner |
|----|----------|-------|
| OQ-HIST-1 | Is historical data monthly, quarterly, or both? Design shows monthly (Apr/May/Jun '26). | Backend A |
| OQ-HIST-2 | How many historical periods are returned per KPI? | Backend A |
| OQ-HIST-3 | Is "Rolling 3-Month" derived on the frontend (last 3 complete months) or a backend parameter? | Backend A / Frontend |

---

### SupplierKpiResult

**Status:** Partially Defined
**Purpose:** Associates a KPI value with a specific supplier. Used in Supplier and Supplier Comparison views.

```typescript
interface SupplierKpiResult {
  supplierId: string;
  kpiId: string;
  kpiName: string;
  category: KpiCategory;
  region: Region;
  value: number | string | null;
  unit?: KpiUnit;
  status?: KpiStatus | null;    // TBD
  reportingPeriod: string;
  lastUpdated: string;          // datetime
}
```

---

### KPI Detail Interfaces

**Status:** Partially Defined — derived from Figma design review (see `VIEW_DATA_MAP_SPEC.md`)

Several KPIs surface multiple named values in their detail views and cannot be represented by the base `KpiCard` single-value shape. These extended interfaces inherit `KpiCard` and add KPI-specific fields. All are subject to revision pending `KPI_DEFINITION_SPEC.md`.

```typescript
// --- Open Actions (8D / CAPA) ---
//
// Exhibits was originally specced to share this shape. It does not — see
// QualityExhibitsKpi below (SPM-132). This covers the 8Ds table only.

interface OpenActionsKpi extends KpiCard {
  totalOpen2026: number;
  openOver90Days: number;
  openOver45Days: number;
}

// --- Quality Exhibits ---
//
// One donut card per region (Figma 804:26272-804:26274). KpiCard.region carries
// the card's scope (GLOBAL / NAR / LAR), so no separate scope field is needed.
// The donut's center total is the sum of the five counts and is DERIVED in the
// UI rather than carried as a field, so the label can never disagree with the
// arcs — unlike the RAG statuses below, which are a business judgement and must
// travel as data.

interface QualityExhibitsKpi extends KpiCard {
  completed: number;
  ongoing: number;
  delayed: number;
  disposition: number;
  notStarted: number;
}

// --- Risk Rating Components ---

interface RiskRatingComponentsKpi extends KpiCard {
  qtyPreferred: number;
  qtyNotPreferred: number;
  qtyNewBusinessOnHold: number;
}

// --- Risk Rating FPS ---

interface RiskRatingFpsKpi extends KpiCard {
  qtyOnQuality: number;
  qtyNotOnQuality: number;
}

// --- Focus Supplier ---

interface FocusSupplierKpi extends KpiCard {
  countGlobal: number;
  countNar: number;
  countLar: number;
}

// --- Cost Recovery ---
//
// SPM-135: the three highlight cards in Figma 1365:14366. Amounts are RAW USD —
// 15_000, not "US$15K" — and the frontend formats them, matching every other KPI
// value. NOTE for Backend A: the transport is still open (raw number vs.
// {value, magnitude} vs. a pre-composed string), as is whether globalConversion
// is a count or a percentage; the frame draws `24` with no unit, while the
// Summary tile shows "Conversion: 68%". See OQ-Q-1 / OQ-Q-2 in
// specs/features/SPM-128-quality-page/SPM-135-quality-cost-focus.md.

interface CostRecoveryKpi extends KpiCard {
  globalConversion: number;     // count, as drawn
  totalRecovered: number;       // USD
  ongoing: number;              // USD
}

// --- PIQ Maturity ---

// SPM-133: added `monthly` (the 12M Trend sparkline and the latest-month arrow
// both read from it) and the two `*Status` fields (the highlighted YTD/Rolling
// cells), mirroring the SPM-130 extension to PpmKpiDetail. The top-level values
// are the **Global** row; byRegion carries only NAR and LAR.
//
// NOTE for Backend A: PIQ colours green for `>= plan2026` — the OPPOSITE
// direction from PPM, where lower is better. The two cannot share one frontend
// threshold rule, so the payload must own the status (and, ideally, each KPI's
// target direction). See specs/features/SPM-128-quality-page/README.md blockers.

interface PiqMaturityKpi extends KpiCard {
  fy2025: number;               // %
  plan2026: number;             // %
  ytd2026: number;              // %
  ytd2026Status?: KpiStatus;
  rollingR3: number;            // %
  rollingR3Status?: KpiStatus;
  monthly: number[];            // 12 chronological %, last = latest month
  byRegion: PiqMaturityRegionRow[];
}

interface PiqMaturityRegionRow {
  region: Region;
  fy2025: number;
  plan2026: number;
  ytd2026: number;
  ytd2026Status?: KpiStatus;
  rollingR3: number;
  rollingR3Status?: KpiStatus;
  monthly: number[];
}

// --- PPM Detail ---

// SPM-130: added fy2025/plan2026/ytd2026/rollingR3 (mirrors PiqMaturityRegionRow)
// plus `offenders` — the wide card turned out to be a table (2025 FY / 2026 Plan /
// 2026 YTD / Rolling / 12M Trend / latest month), not a chart, and the narrow card
// is a per-section Top Offenders list, not a generic stat card. See
// specs/features/SPM-128-quality-page/SPM-130-quality-ppm-cal.md.
interface PpmKpiDetail extends KpiCard {
  totalRejections: number;
  totalUnitsInspected: number;
  // Aggregate ("Whirlpool") row shown at the top of the PPM table.
  fy2025: number;
  plan2026: number;
  ytd2026: number;
  ytd2026Status?: KpiStatus;     // RAG for the cell — backend-owned, see note below
  rollingR3: number;
  rollingR3Status?: KpiStatus;
  monthly: PpmMonthlyRow[];      // aggregate row's 12M trend; last entry is the latest month
  byPlant: PpmBreakdownRow[];
  byCommodity: PpmBreakdownRow[]; // expandable detail rows under the aggregate, this section's table
  byRegion: PpmBreakdownRow[];
  offenders: TopOffenderBar[];    // narrow card's ranked supplier list
}

interface PpmBreakdownRow {
  dimension: string;            // plant name, commodity name, or region label
  ppm: number;
  rejections: number;
  totalUnits: number;
  fy2025: number;
  plan2026: number;
  ytd2026: number;
  ytd2026Status?: KpiStatus;
  rollingR3: number;
  rollingR3Status?: KpiStatus;
  monthly: PpmMonthlyRow[];      // this row's own 12M trend; last entry is the latest month
}

interface PpmMonthlyRow {
  period: string;               // "2026-04"
  ppm: number;
  rejections: number;
}

// --- CAL Detail ---

// SPM-130: same table/list extension as PpmKpiDetail above, mirrored for CAL.
// byRegion is this section's table breakdown (Whirlpool aggregate -> NAR/LAR).
interface CalKpiDetail extends KpiCard {
  fy2025: number;
  plan2026: number;
  ytd2026: number;
  ytd2026Status?: KpiStatus;
  rollingR3: number;
  rollingR3Status?: KpiStatus;
  monthly: CalMonthlyRow[];
  byRegion: CalBreakdownRow[];
  byPlant: CalBreakdownRow[];
  byCommodity: CalBreakdownRow[];
  offenders: TopOffenderBar[];
}

interface CalBreakdownRow {
  dimension: string;            // region, plant name, or commodity
  calCount: number;
  statusCounts: Record<string, number>; // TBD — status bucket keys not yet defined
  fy2025: number;
  plan2026: number;
  ytd2026: number;
  ytd2026Status?: KpiStatus;
  rollingR3: number;
  rollingR3Status?: KpiStatus;
  monthly: CalMonthlyRow[];
}

interface CalMonthlyRow {
  period: string;               // "2026-04"
  calCount: number;
}
```

> **Cell RAG status is backend-owned (SPM-130).** `ytd2026Status` / `rollingR3Status`
> carry the red/amber/green assessment for the highlighted PPM/CAL table cells, the same
> way `KpiCard.status` already does for KPI cards. It is deliberately **not** derived on
> the frontend: thresholds vary per KPI and reset yearly, and the same judgement feeds
> the chatbot, alerts, and exports — deriving it in the UI would let the Summary card and
> this table disagree about the same supplier. The frontend keeps a documented fallback
> (`getPlanVarianceStatus`, `src/lib/kpiTrend.ts`) only while the Backend A contract is
> open, which is why both fields are optional. **Confirm these with Backend A** alongside
> the wider `GET /kpis/quality` contract reconciliation.

```ts

// --- Products on Hold ---
//
// One grouped-bar card per segment scope (Figma 804:26188-804:26191), so
// GET /kpis/kpi-products-on-hold returns a LIST of these. `carryOver2025` is a
// single 2025 scalar, not a monthly series: the frame draws it as a bar in the
// first month group only (SPM-132).

interface ProductsOnHoldKpi extends KpiCard {
  carryOver2025: number;        // k units
  segmentScope: 'GLOBAL' | 'NAR' | 'LAR' | 'FPS_ONLY';
  byMonth: ProductsOnHoldMonthRow[];
}

interface ProductsOnHoldMonthRow {
  period: string;               // "2026-01"
  fullMonth: number;            // k units
  eom: number;                  // end-of-month inventory, k units
}

// --- GSIR Detail ---

interface GsirKpiDetail extends KpiCard {
  volumeKUnits: number;
  exitRateR18: number;
  exitRateDec25: number;
  baseline2025: number;
  ytdTarget: number;
  currentResult: number;
  currentVsPriorPeriod: number;
  yeTarget: number;
  levelOfService: number;       // TBD — definition of LOS (OQ-MAP-10)
  bySegment?: GsirSegmentRow[];
  tcq?: GsirTcqRow[];
  byCommodity?: GsirCommodityRow[];
}

interface GsirSegmentRow {
  segment: ProductRegionSegment;
  volumeKUnits: number;
  currentResult: number;
  ytdTarget: number;
  baseline2025: number;
}

interface GsirTcqRow {
  segment: ProductRegionSegment;
  ytd2025: number;              // $M financial impact
  ytdPlan: number;
  ytd2026: number;
  bwVsPlan: number;             // Better/(Worse) vs Plan
  bwVsPY: number;               // Better/(Worse) vs Prior Year
}

interface GsirCommodityRow {
  commodity: string;
  volumeKUnits: number;
  currentResult: number;
}
```

> All interfaces above are **proposed shapes** from design review. Exact field names, types, and nesting will be confirmed in `KPI_DEFINITION_SPEC.md` and `API_SPEC.md`.

**Open Questions:**

| ID | Question | Owner |
|----|----------|-------|
| OQ-KPI-6 | Does each GSIR sub-view (R12, 5 Stars, TCQ, FPS, MVT) map to a separate endpoint or one endpoint with multiple data blocks? | Backend A |
| OQ-KPI-7 | Is the Products on Hold monthly pivot assembled on the frontend from `KpiHistoricalPoint[]`, or does the backend return the full pivot? | Backend A |
| OQ-KPI-8 | What are the CAL status bucket keys (the columns in the status breakdown table)? | Business |
| OQ-KPI-9 | What is LOS (Level of Service) in the GSIR context — computed or raw data field? | Business |

---

## KPI Catalog

Per-KPI field semantics and calculation rules are deferred to `KPI_DEFINITION_SPEC.md`. This section establishes the enumeration and regional availability of all KPIs.

### Delivery KPIs

| KPI Name | Region Availability | Notes |
|----------|--------------------|----|
| Production Loss | GLOBAL, LAR, NAR | TBD — reporting structure |
| DTC (Delivery To Commitment) | GLOBAL, LAR, NAR | |
| OTIF (On Time In Full) | LAR only | |
| Expedite | GLOBAL, LAR, NAR | |
| VMI Compliance | NAR only | |

### Quality KPIs

| KPI Name | Region Availability | Notes |
|----------|--------------------|----|
| CAL PPM | GLOBAL, LAR, NAR | Metric definition TBD |
| Cal Audits Occurrence | GLOBAL, LAR, NAR | |
| 8D - CAPA | GLOBAL, LAR, NAR | |
| Incoming Rejection PPM | NAR only | |
| Database Cost Recovery | LAR only | |
| Risk Rating Components | GLOBAL, LAR, NAR | |
| GSIR | GLOBAL, LAR, NAR | |
| Database Recovery - Control Tower | LAR only | |
| Supplier Quality Audit Data | GLOBAL, LAR, NAR | |
| Products On Hold | GLOBAL, LAR, NAR | |
| Exhibits | GLOBAL, LAR, NAR | |
| Contracts | GLOBAL, LAR, NAR | |
| Risk Rating FPS | GLOBAL, LAR, NAR | |
| PIQ Maturity & Project Data | GLOBAL, LAR, NAR | |
| Focus Supplier | GLOBAL, LAR, NAR | |

> All KPI metric definitions, calculation rules, and field semantics are **TBD** pending `KPI_DEFINITION_SPEC.md`.

---

## API Response Envelopes

The Data API wraps all responses in a standard envelope. These shapes apply to all entity endpoints.

```typescript
interface ApiResponse<T> {
  data: T;
  meta: ResponseMeta;
}

interface ApiListResponse<T> {
  data: T[];
  meta: ResponseMeta;
  pagination?: Pagination;
}

interface ResponseMeta {
  requestId: string;
  reportingPeriod?: string;
  region?: Region;
  lastUpdated?: string;          // datetime
}

interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

interface ApiError {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: unknown;
  };
}
```

---

## Security Classification

| Data Class | Entities | Access Control |
|------------|----------|----------------|
| User Data | `User`, `SavedFilterPreference` | Authenticated SSO session required |
| Business Data | `KpiCard`, `SupplierKpiResult`, `GlobalSpend`, `Supplier` | Authenticated SSO session required |
| Supplier-Facing Data | Subset of KPI / Supplier data | Signed URL required; no SSO session |

**Notes:**

- Region-based data isolation is enforced at the API layer (OQ-USR-2 resolved).
- No role-based field visibility in v1 (OQ-USR-3 resolved).
- Supplier signed URL scope: see PRD-backend-a.md.

---

## Open Questions Summary

| ID | Area | Question | Owner | Blocking |
|----|------|----------|-------|----------|
| ~~OQ-USR-1~~ | User | ~~Which SSO claims are available?~~ | **Resolved** | Model kept minimal (`id`, `email`, `displayName`); no additional claims assumed. |
| ~~OQ-USR-2~~ | User | ~~Is region access enforced at the API or frontend layer?~~ | **Resolved** | API layer (Backend A). Frontend is region-agnostic. |
| ~~OQ-USR-3~~ | User | ~~What roles exist and what permissions do they grant?~~ | **Resolved** | No roles in v1. All authenticated internal users have equivalent access. |
| OQ-FLT-1 | Filters | Maximum saved filters per user? | Business | Filter UX |
| OQ-FLT-2 | Filters | Can filters be shared between users? | Business | Filter UX |
| OQ-FLT-3 | Filters | Default filter concept? | Business | Filter UX |
| OQ-FLT-4 | Filters | Which filter dimensions get persisted? | Business | Filter data shape |
| OQ-FLT-5 | Filters | Will month-level period granularity be supported, or only fiscal quarters? | Backend A | All KPI detail pages |
| OQ-SUP-1 | Supplier | Parent/child supplier hierarchy? | Backend / Business | Supplier view |
| OQ-SUP-2 | Supplier | Valid supplier status values? | Business | Supplier model |
| OQ-SUP-3 | Supplier | How are category and commodity sourced? | Backend A | Supplier model |
| OQ-SUP-4 | Supplier | What determines a "Focus Supplier"? Static flag or computed? | Business | Focus Supplier KPI, filter |
| OQ-SPD-1 | Spend | Data granularity? | Backend A | Spend view |
| OQ-SPD-2 | Spend | Multi-currency normalization at API layer? | Backend A | Spend display |
| OQ-SPD-3 | Spend | Fiscal calendar definition? | Business | Period labels |
| OQ-KPI-1 | KPI | Do any KPIs require fields beyond `KpiCard`? | Business / Backend A | KPI components |
| OQ-KPI-2 | KPI | Do any KPIs produce multiple simultaneous values? | Business | KPI card design |
| OQ-KPI-3 | KPI | Who owns target values and status thresholds? | Business | Status chips |
| OQ-KPI-4 | KPI | Data refresh frequency? | Backend A | Cache strategy |
| OQ-KPI-5 | KPI | Historical data retention window? | Backend A | Trend charts |
| OQ-KPI-6 | KPI | Does each GSIR sub-view map to a separate endpoint or one multi-block response? | Backend A | GSIR detail page |
| OQ-KPI-7 | KPI | Is Products on Hold monthly pivot assembled frontend or backend? | Backend A | Products on Hold table |
| OQ-KPI-8 | KPI | What are the CAL status bucket keys? | Business | CAL detail page |
| OQ-KPI-9 | KPI | What is LOS (Level of Service) in GSIR? | Business | GSIR detail page |
| OQ-HIST-1 | Historical | Monthly or quarterly granularity? Design shows monthly. | Backend A | KPI detail pages |
| OQ-HIST-2 | Historical | How many periods returned per KPI? | Backend A | Trend charts |
| OQ-HIST-3 | Historical | Is Rolling 3-Month derived frontend or a backend parameter? | Backend A / Frontend | Filter bar |
| OQ-MAP-1 | Plant | Is Plant a dedicated endpoint or part of filter metadata? | Backend A | Plant filter, PPM/CAL detail |
| OQ-PLT-1 | Plant | Are plant-to-region assignments static config or data? | Backend A | Plant filter |
| OQ-MAP-6 | Summary | Is "Suppliers Needing Attention" count a dedicated endpoint or derived from summary KPIs? | Backend A | Summary view |
| OQ-MAP-7 | Summary | What determines "Top Offenders"? (worst status, largest deviation from target, etc.) | Business | Summary view |
| OQ-MAP-9 | Supplier View | What subset of KPIs is shown in the supplier signed-URL view? | Business | Supplier limited view |

---

## Related Specifications

| Document | Status | Purpose |
|----------|--------|---------|
| `PRD.md` | Published | Master product requirements |
| `PRD-frontend.md` | Published | Frontend architecture and component model |
| `PRD-backend-a.md` | Published | Backend A (Nest.js): Data API responsibilities and constraints |
| `PRD-backend-b.md` | Published | Backend B (FastAPI): Chat Service responsibilities and constraints |
| `PRD-backend.md` | Archived | Superseded by PRD-backend-a.md and PRD-backend-b.md |
| `PRD-ai-agent.md` | Published | AI agent scope and guardrails |
| `API_SPEC.md` | Draft | Backend A endpoint contracts (KPI data, auth, suppliers, filters) |
| `CHAT_API_SPEC.md` | Draft | Backend B endpoint contracts (chat proxy and session management) |
| `VIEW_DATA_MAP_SPEC.md` | Draft | View-to-data mapping derived from Figma design |
| `KPI_DEFINITION_SPEC.md` | Pending | Per-KPI calculation rules and field semantics |
| `CHART_SPEC.md` | Pending | Chart dataset and visualization definitions |
| `TABLE_SPEC.md` | Pending | Table/grid column and pagination definitions |
| `FILTER_SPEC.md` | Pending | Filter schema and URL encoding spec |
