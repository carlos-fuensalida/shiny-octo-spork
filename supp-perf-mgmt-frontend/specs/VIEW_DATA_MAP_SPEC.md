# View–Data Mapping Specification

**Version:** 0.1  
**Status:** Draft — Design in Progress  
**Last Updated:** 2026-07-15  
**Figma Source:** [Supplier Performance Management Dashboard](https://www.figma.com/design/XDBgP7IlEw9d9xvIEinGxM/Supplier-Performance-Management-Dashboard?node-id=508-9818)

---

## Purpose

This document maps each dashboard view to the data entities, fields, and API endpoints that feed it.

Goals:

- Give frontend developers a clear picture of what data each view requires.
- Surface data model gaps discovered during design review.
- Document filter dimensions, drill-down links, and KPI structure per view.
- Serve as the handoff between design (Figma) and implementation.

**Design status note:** The design is in progress. Some views are marked "Work in progress" in Figma. Deeper KPI detail pages are not yet fully designed; their data requirements are inferred from visible KPI cards and the two available inner-page examples (PPM, CAL).

Related specifications:

- `DATA_MODEL_SPEC.md` — entity interfaces and TypeScript types
- `API_SPEC.md` — Backend A endpoint contracts
- `CHAT_API_SPEC.md` — Backend B chat endpoint contracts
- `KPI_DEFINITION_SPEC.md` — per-KPI calculation rules *(pending)*
- `FILTER_SPEC.md` — filter schema and URL encoding *(pending)*

---

## Views Inventory

| View | Design Status | Route (proposed) | Backend Endpoints |
|------|--------------|-----------------|-------------------|
| Summary | Work in progress | `/` | `GET /kpis/summary` |
| Quality | Work in progress | `/quality` | `GET /kpis/quality` |
| Delivery | Partially designed | `/delivery` | `GET /kpis/delivery` |
| Suppliers | Designed | `/suppliers` | `GET /suppliers`, `GET /kpis/supplier/{id}` |
| Supplier Comparison | Designed | `/suppliers/compare` | `GET /kpis/comparison` |
| KPI Detail — PPM | Designed (inner page) | `/quality/ppm` | `GET /kpis/{kpiId}` |
| KPI Detail — CAL | Designed (inner page) | `/quality/cal` | `GET /kpis/{kpiId}` |
| KPI Detail — (others) | Not yet designed | `/quality/{kpiId}`, `/delivery/{kpiId}` | `GET /kpis/{kpiId}` |
| Supplier Limited View | Designed (signed URL) | `/supplier-view` | `GET /supplier-links/{id}/data` |

---

## Global Filter Dimensions

These filters appear across all internal views via the global filter bar and Filters Drawer.

| Filter | Design Label | Maps To | Status |
|--------|-------------|---------|--------|
| Region | Filter - Region | `KpiCard.region: Region` | In model |
| Year | Filter - Year | `fiscalYear: number` | In model |
| Month | Filter - Month | `month: number` (1–12) | **GAP — month-level not in model** |
| Supplier | Filter - Supplier | `supplierIds: string[]` | In model |
| Supplier Code | Filter - Supplier Code | `supplierCode: string` | In model (TBD field) |
| Commodity | Filter - Commodity | `commodity: string` | In model (TBD field) |
| Subcommodity | Filter - Subcommodity | `subcommodity: string` | **GAP — not in model** |
| Category | Filter - Category | `category: string` | In model (TBD field) |
| Plant | Filter - Plant | `plantId: string` | **GAP — Plant entity not in model** |
| Supplier Location | Filter - Supplier Loc. | `supplierLocation: string` | **GAP — not in model** |
| Focus Supplier | Filter - Focus Supplier | `isFocusSupplier: boolean` | **GAP — not in model** |

> **Rolling period:** The design shows a "Rolling 3-Month" option under Month filters. This is a derived filter, not a static month selection. Needs definition in `FILTER_SPEC.md`.

---

## View Definitions

---

### Summary View

**Route:** `/`  
**Design status:** Work in progress  
**Purpose:** Leadership-level snapshot of overall quality and delivery health plus supplier attention signals.

#### Sections

| Section | Design Label | Data Source | Fields Displayed |
|---------|-------------|-------------|-----------------|
| Quality snapshot | "Quality Performance" | `GET /kpis/summary` → `KpiCard[]` where `category = QUALITY` | `kpiName`, `value`, `unit`, `status`, `trendDirection` |
| Delivery snapshot | "Delivery Performance" | `GET /kpis/summary` → `KpiCard[]` where `category = DELIVERY` | `kpiName`, `value`, `unit`, `status`, `trendDirection` |
| Portfolio context | "Portfolio Snapshot" / "Steel Forgings · All regions" | `GET /kpis/filters/metadata` | `commodity`, `region` (active filter context label) |
| Supplier attention | "Suppliers Needing Attention (6 of 6)" | `GET /kpis/summary` or dedicated endpoint | count of suppliers at risk — **GAP: no endpoint for this yet** |
| Top offenders | "Top Offenders" | `GET /kpis/supplier/{id}` or summary variant | supplier name, KPI name, value, status |

#### Status Indicators

The design uses three status badges per KPI card:

| Badge | Maps To |
|-------|---------|
| On Track | `KpiStatus = 'GREEN'` |
| Watch | `KpiStatus = 'YELLOW'` |
| At Risk | `KpiStatus = 'RED'` |

#### Filters Active

Global filter bar: Region, Year, Month (Rolling 3-Month supported).

#### Drill-Down Links

Each KPI card links to its dedicated detail view (e.g. PPM card → `/quality/ppm`).

---

### Quality View

**Route:** `/quality`  
**Design status:** Work in progress  
**Purpose:** Full quality KPI dashboard with per-KPI cards and summary tables.

#### KPIs Displayed

Each KPI is rendered as a card. Cards with a drill-down link surface a navigation action to the KPI detail page.

| KPI | Design Label | Card Fields | Has Detail Page |
|-----|-------------|-------------|-----------------|
| CAL PPM | "PPM" | value (PPM), trend | Yes — `/quality/ppm` |
| Cal Audits Occurrence | "CAL" | value (count), status | Yes — `/quality/cal` |
| Products on Hold | "Products on Hold" | value (k units), region | Yes — detail TBD |
| PIQ Maturity | "PIQ Maturity" | value (%), region | Yes — detail TBD |
| Exhibits | "Exhibits" | open count by status (Completed / On going / Delayed / Disposition / Not started), per region | Yes — detail TBD |
| 8D - CAPA | "8Ds" | open count | Yes — detail TBD |
| Risk Rating Components | "Risk Rating Components" | qty preferred / not preferred | Yes — detail TBD |
| Risk Rating FPS | "Risk Rating FPS" | qty on quality | Yes — detail TBD |
| GSIR | "GSIR" | star rating, volume | Yes — detail TBD |
| Focus Supplier | "Focus Supplier" | qty global / NAR / LAR | Yes — detail TBD |

#### Data Source

```
GET /kpis/quality
→ ApiListResponse<KpiCard>
```

All KPI cards in the quality view conform to `KpiCard` from `DATA_MODEL_SPEC.md`. Fields with multi-value structures (e.g. Exhibits, 8Ds, Risk Rating) may require an extended interface — see [Data Model Gaps](#data-model-gaps).

#### Filters Active

Global filter bar + view-specific filters: Plant, Commodity, Subcommodity, Focus Supplier toggle.

---

### Delivery View

**Route:** `/delivery`  
**Design status:** Partially designed — KPI cards visible, tables not yet detailed  
**Purpose:** Full delivery KPI dashboard.

#### KPIs Expected (from KPI catalog)

| KPI | Card Fields (inferred) | Has Detail Page |
|-----|----------------------|-----------------|
| Production Loss | value, status, trend | Yes — detail TBD |
| DTC (Delivery To Commitment) | value (%), status | Yes — detail TBD |
| OTIF (On Time In Full) | value (%), region = LAR only | Yes — detail TBD |
| Expedite | value, status | Yes — detail TBD |
| VMI Compliance | value (%), region = NAR only | Yes — detail TBD |

#### Data Source

```
GET /kpis/delivery
→ ApiListResponse<KpiCard>
```

#### Filters Active

Global filter bar + view-specific filters TBD (design not yet complete).

---

### Suppliers View

**Route:** `/suppliers`  
**Design status:** Designed  
**Purpose:** Browse and select suppliers; entry point to individual supplier KPI performance and comparison.

#### Sections

| Section | Data Source | Fields Displayed |
|---------|-------------|-----------------|
| Supplier list / search | `GET /suppliers` | `supplierName`, `supplierCode`, `region`, `supplierStatus` |
| Per-supplier KPI summary | `GET /kpis/supplier/{supplierId}` | `kpiName`, `value`, `unit`, `status` per KPI |
| Status indicators | — | On Track / Watch / At Risk badges |

#### Filters Active

Region, Commodity, Plant, Supplier search/name, Supplier Code, Focus Supplier toggle.

#### Drill-Down Links

- Selecting a supplier → Supplier Detail (route TBD, may be `/suppliers/{supplierId}`)
- "Compare" action → Supplier Comparison view (`/suppliers/compare`)

---

### Supplier Comparison View

**Route:** `/suppliers/compare`  
**Design status:** Designed  
**Purpose:** Side-by-side KPI comparison of two or more selected suppliers.

#### Data Source

```
GET /kpis/comparison?supplierIds=sup-001,sup-002
→ ApiListResponse<SupplierComparisonRow>
```

#### Fields Displayed

| Column | Maps To |
|--------|---------|
| Supplier Name 1 / 2 | `Supplier.supplierName` |
| KPI Name | `SupplierKpiResult.kpiName` |
| Value (Supplier 1) | `SupplierKpiResult.value` |
| Value (Supplier 2) | `SupplierKpiResult.value` |
| Status (each) | `SupplierKpiResult.status` (On Track / Watch / At Risk) |

#### Empty State

Design shows: "Select two suppliers to compare their performance across key metrics."

#### Filters Active

Region, Commodity, KPI Category (Quality / Delivery toggle).

---

### KPI Detail — PPM

**Route:** `/quality/ppm`  
**Design status:** Designed (inner KPI page)  
**Purpose:** Deep-dive into CAL PPM metric with breakdowns by plant, commodity, and region.

#### Header Card

| Field | Maps To |
|-------|---------|
| PPM value | `KpiCard.value` |
| Reporting period | `KpiCard.reportingPeriod` (e.g. "Apr '26", "May '26", "Jun '26") |
| Total rejections (REJ) | `PpmDetail.totalRejections` — **GAP: new field** |
| Total units inspected | `PpmDetail.totalUnitsInspected` — **GAP: new field** |

> **Period note:** The design shows month-level periods (Apr/May/Jun '26) and a Rolling 3-Month aggregate. Our current model uses fiscal quarters. Month-level granularity is a data model gap.

#### Tables

**PPM Monthly Report** — Rolling 3-month summary

| Column | Maps To |
|--------|---------|
| Month | `period: string` (e.g. "2026-04") |
| PPM | `value` |
| REJ | `rejections: number` — **GAP** |

---

**PPM by Plant**

| Column | Maps To |
|--------|---------|
| Plant Name | `Plant.plantName` — **GAP: Plant entity not in model** |
| PPM | `value` |
| REJ / Total Units | `rejections`, `totalUnits` — **GAP** |

Sample data: Greenville (1,436 PPM / 237,793 units), Findlay (1,314 / 413,013), etc.

---

**PPM by Commodity**

| Column | Maps To |
|--------|---------|
| Commodity Name | `commodity: string` |
| PPM | `value` |
| REJ / Total Units | `rejections`, `totalUnits` — **GAP** |

Sample data: Metal Components, Steel, Glass, Stamping & Die Cast, etc.

---

**PPM by Region**

| Column | Maps To |
|--------|---------|
| Region | `region: Region` |
| PPM | `value` |
| REJ | `rejections: number` — **GAP** |
| Total REJ | 997,562 (aggregate footer) |

#### Data Source

```
GET /kpis/kpi-ppm?region=...&year=...&month=...
→ ApiResponse<PpmKpiDetail>   // extended shape — see Gaps
```

---

### KPI Detail — CAL

**Route:** `/quality/cal`  
**Design status:** Designed (inner KPI page)  
**Purpose:** Deep-dive into Cal Audits Occurrence with breakdowns by region and plant.

#### Header Card

| Field | Maps To |
|-------|---------|
| CAL value | `KpiCard.value` |
| Reporting period | `KpiCard.reportingPeriod` |
| Status breakdown counts | `CalDetail.statusCounts` — **GAP: multi-value** |

#### Tables

**CAL by Region** — Global, NAR, LAR

| Column | Maps To |
|--------|---------|
| Region | `region: Region` |
| CAL count | `value` |
| Status columns (multiple) | `statusCounts: Record<string, number>` — **GAP** |

**CAL by Plant (within region)**

| Column | Maps To |
|--------|---------|
| Plant Name | `Plant.plantName` — **GAP** |
| CAL count | `value` |
| Status breakdown | — |

Sample plants: Marion, Amana, Supsa, Joinsville, Celaya, Manaus (LAR plants).

**CAL by Commodity**

| Column | Maps To |
|--------|---------|
| Commodity | `commodity: string` |
| CAL count | `value` |

Sample: Rubber & Misc. Plastics, Package/Literature/Insulation.

---

### KPI Detail — GSIR

**Route:** `/quality/gsir`  
**Design status:** Partially designed — multiple sub-views visible  
**Purpose:** Global Supplier Intelligence Rating with multiple lenses.

The GSIR detail page has multiple tabs/sub-views, each with a distinct data shape:

#### Sub-view: 12 MIS R12 (Latest Rate Run)

| Field | Maps To |
|-------|---------|
| Volume (k units) | `GsirDetail.volumeKUnits` — **GAP** |
| Exit Rate R18 | `GsirDetail.exitRateR18` — **GAP** |
| Exit Rate Dec '25 | `GsirDetail.exitRateDec25` — **GAP** |
| 2025 Baseline | `GsirDetail.baseline2025` — **GAP** |
| YTD Target | `GsirDetail.ytdTarget` — **GAP** |
| Current Result | `GsirDetail.currentResult` — **GAP** |
| Current vs PP | `GsirDetail.currentVsPriorPeriod` — **GAP** |
| YE Target | `GsirDetail.yeTarget` — **GAP** |
| LOS | `GsirDetail.levelOfService` — **GAP** |

Dimensions: GLOBAL OVERALL, TYPE OF DOMESTIC APPLIANCE (Whirlpool MDA, Whirlpool SDA), REGIONAL MDA (NAR MDA, LAR MDA).

#### Sub-view: 5 Stars

Star rating (1–5) breakdown per dimension. Shape TBD.

#### Sub-view: TCQ (YTD Results, $M)

Financial impact table:

| Column | Maps To |
|--------|---------|
| YTD 2025 | `GsirTcq.ytd2025: number` — **GAP** |
| YTD Plan | `GsirTcq.ytdPlan: number` — **GAP** |
| YTD 2026 | `GsirTcq.ytd2026: number` — **GAP** |
| B/(W) vs Plan | `GsirTcq.bwVsPlan: number` — **GAP** |
| B/(W) vs PY | `GsirTcq.bwVsPY: number` — **GAP** |

#### Sub-view: FPS (Finished Product Segment)

Segments: FPS, NAR MDA, LAR MDA, SDA. Shape mirrors 12 MIS R12.

#### Sub-view: MVT (by Commodity)

| Commodity Rows | Notes |
|----------------|-------|
| MVT Overall | 30,176 volume, 1.8 metric |
| Cooling Systems | |
| Motors & Pumps | |
| Gas Systems | |
| Electronics | |
| Wire Harnesses | |
| Electro-Mechanical | |

> **Open question:** Does each GSIR sub-view map to a separate API endpoint, or is it one endpoint returning all data? (OQ-GSIR-1)

---

### KPI Detail — Products on Hold

**Route:** `/quality/products-on-hold`  
**Design status:** Tables visible, pivot structure clear  
**Purpose:** Monthly inventory hold volumes across regions.

#### Structure — RESOLVED (SPM-132)

The `/quality` page section (Figma `804:26181`) is **not a pivot table**: it is four cards, each a grouped bar chart of one segment scope over the reported months, with three series.

| Series | Maps To |
|--------|---------|
| 2025 Carry Over | `ProductsOnHoldKpi.carryOver2025: number` — a **single scalar**, drawn in the first month group only |
| Full Month (per month) | `ProductsOnHoldMonthRow.fullMonth: number` |
| EOM (End of Month) | `ProductsOnHoldMonthRow.eom: number` |

Months shown: Jan–May 2026. Segment scopes (one card each): `GLOBAL`, `NAR`, `LAR`, `FPS_ONLY`.

> **OQ-MAP-5 resolved — the monthly breakdown is backend-assembled.** `byMonth` arrives as month rows and the chart renders them directly; there is no frontend pivot or date math. `GET /kpis/kpi-products-on-hold` returns an `ApiListResponse<ProductsOnHoldKpi>` — one entry per segment scope. See `DATA_MODEL_SPEC.md` and `specs/features/SPM-128-quality-page/SPM-132-quality-cards-poh-exhibits.md`.

---

### KPI Detail — PIQ Maturity

**Route:** `/quality/piq-maturity`  
**Design status:** Table visible  
**Purpose:** New Product Introduction project maturity tracking.

#### Table

| Column | Maps To |
|--------|---------|
| Dimension (Global / NAR / LAR) | `region: Region` |
| 2025 FY | `PiqMaturity.fy2025: number` (%) — **GAP** |
| 2026 Plan | `PiqMaturity.plan2026: number` (%) — **GAP** |
| 2026 YTD | `PiqMaturity.ytd2026: number` (%) — **GAP** |
| Rolling (R3) | `PiqMaturity.rollingR3: number` (%) — **GAP** |
| 12M Trend | `KpiHistoricalPoint[]` |

---

### KPI Detail — Exhibits & 8D / CAPA

**Routes:** `/quality/exhibits`, `/quality/8d-capa`  
**Design status:** Tables visible  
**Purpose:** Open action tracking for quality risk items.

> **Correction (SPM-132): Exhibits and 8Ds do *not* share a shape.** This section previously stated they were identical. The Figma frames show otherwise — the `Total Open / >90 Days / >45 Days` structure below is the **8Ds** table (`804:26275`), while the Quality Exhibits section (`804:26265`) is a per-region **status breakdown** rendered as donut cards. `OpenActionsKpi` therefore covers 8Ds only.

#### 8D / CAPA Structure

| Field | Maps To |
|-------|---------|
| Dimension | `region: Region` or `supplier` |
| Total Open 2026 | `OpenActionsKpi.totalOpen2026: number` |
| Open > 90 Days | `OpenActionsKpi.openOver90Days: number` |
| Open > 45 Days | `OpenActionsKpi.openOver45Days: number` |

Sample values (8Ds): Total Open 2026: 22, Open >90 Days: 5, Open >45 Days: 6.

#### Quality Exhibits Structure

One card per region (`GLOBAL`, `NAR`, `LAR`), each a donut of five progress statuses. `KpiCard.region` carries the card's scope, so no separate scope field is needed.

| Field | Maps To |
|-------|---------|
| Region band | `QualityExhibitsKpi.region: Region` |
| Completed / On going / Delayed / Disposition / Not started | `QualityExhibitsKpi.completed` / `.ongoing` / `.delayed` / `.disposition` / `.notStarted` |
| Center total | **Derived** — the sum of the five counts, so the label can never disagree with the arcs |

Frame values: GLOBAL 11/18/8/3/14 (54) · NAR 8/9/7/0/12 (36) · LAR 3/9/1/3/2 (18).

`GET /kpis/kpi-exhibits` returns an `ApiListResponse<QualityExhibitsKpi>` — one entry per region.

> Both are multi-value KPIs that do not fit the single-value `KpiCard` interface — see [Data Model Gaps](#data-model-gaps) and `DATA_MODEL_SPEC.md`.

---

### KPI Detail — Risk Rating Components

**Route:** `/quality/risk-rating-components`  
**Design status:** Table visible

| Field | Maps To |
|-------|---------|
| Qty Preferred | `RiskRating.qtyPreferred: number` — **GAP** |
| Qty Not Preferred | `RiskRating.qtyNotPreferred: number` — **GAP** |
| Qty New Business on Hold | `RiskRating.qtyNewBusinessOnHold: number` — **GAP** |

Sample: Preferred: 142 / 86 / 56 (global / NAR / LAR breakdown).

---

### KPI Detail — Focus Supplier

**Route:** `/quality/focus-supplier`  
**Design status:** Summary counts visible

| Field | Maps To |
|-------|---------|
| Qty of Focus (Global) | `FocusSupplier.countGlobal: number` — **GAP** |
| Qty of Focus (NAR) | `FocusSupplier.countNar: number` — **GAP** |
| Qty of Focus (LAR) | `FocusSupplier.countLar: number` — **GAP** |
| Supplier detail table | links to `/suppliers/{supplierId}` |

> `isFocusSupplier` flag is also a filter dimension — see [Global Filter Dimensions](#global-filter-dimensions).

---

### Supplier Limited View

**Route:** `/supplier-view` (accessed via signed URL)  
**Design status:** Not detailed in current design frames  
**Purpose:** Scoped view for external supplier access. No navigation, no chat, no other suppliers' data.

#### Data Source

```
GET /supplier-links/{linkId}/data   // Backend A
→ Subset of SupplierKpiResult[]
```

#### Constraints

- No global filter bar.
- No chatbot panel.
- Expired link → "link expired" state (no error page).
- Data scope enforced server-side — no client parameters can widen it.

---

## Data Model Gaps

The following fields and entities are visible in the Figma design but are **not yet represented** in `DATA_MODEL_SPEC.md`. Each gap should be resolved before the affected view is implemented.

### New Filter Dimensions

| Gap | Description | Blocking |
|-----|-------------|---------|
| `month: number` | Month-level granularity (1–12). Current model only has `fiscalQuarter`. Rolling 3-Month is a derived filter. | All detail pages |
| `subcommodity: string` | Sub-level commodity classification. | Filter bar, PPM/CAL detail |
| `plantId: string` | Manufacturing plant where supplier parts are received. | PPM detail, CAL detail, filter bar |
| `supplierLocation: string` | Geographic location of the supplier facility. | Supplier filters |
| `isFocusSupplier: boolean` | Flag identifying suppliers on the focus watch list. | Focus Supplier view, filter bar |

### New Entity: `Plant`

The design shows PPM and CAL data broken down by plant (Greenville, Findlay, Cleveland, etc.). Plant appears to be a first-class dimension, not just a label.

```typescript
// Proposed — to be added to DATA_MODEL_SPEC.md
interface Plant {
  plantId: string;
  plantName: string;
  region: Region;
  country?: string;             // TBD
}
```

### New Entity: `ProductSegment`

GSIR uses product-type dimensions: MDA (Major Domestic Appliance), SDA (Small Domestic Appliance), FPS (Finished Product Segment). These need a type definition.

```typescript
type ProductSegment = 'MDA' | 'SDA' | 'FPS';
type ProductRegionSegment = 'NAR_MDA' | 'LAR_MDA' | 'GLOBAL_MDA' | 'SDA' | 'FPS';
```

### Multi-Value KPI Interfaces

Several KPIs return multiple named values rather than a single `value: number`. These do not fit the base `KpiCard` interface and need extended types:

```typescript
// Proposed extensions — to be added to DATA_MODEL_SPEC.md

interface OpenActionsKpi extends KpiCard {
  totalOpen2026: number;
  openOver90Days: number;
  openOver45Days: number;
}

interface RiskRatingComponentsKpi extends KpiCard {
  qtyPreferred: number;
  qtyNotPreferred: number;
  qtyNewBusinessOnHold: number;
}

interface RiskRatingFpsKpi extends KpiCard {
  qtyOnQuality: number;
  qtyNotOnQuality: number;
}

interface FocusSupplierKpi extends KpiCard {
  countGlobal: number;
  countNar: number;
  countLar: number;
}

interface PpmKpiDetail extends KpiCard {
  totalRejections: number;
  totalUnitsInspected: number;
  byPlant: PpmBreakdownRow[];
  byCommodity: PpmBreakdownRow[];
  byRegion: PpmBreakdownRow[];
  monthly: PpmMonthlyRow[];
}

interface PpmBreakdownRow {
  dimension: string;            // plant name, commodity name, or region
  ppm: number;
  rejections: number;
  totalUnits: number;
}

interface PpmMonthlyRow {
  period: string;               // "2026-04"
  ppm: number;
  rejections: number;
}

interface ProductsOnHoldKpi extends KpiCard {
  carryOver2025: number;        // k units — a single 2025 figure, not monthly
  segmentScope: 'GLOBAL' | 'NAR' | 'LAR' | 'FPS_ONLY';
  byMonth: ProductsOnHoldMonthRow[];
}

interface ProductsOnHoldMonthRow {
  period: string;               // "2026-01"
  fullMonth: number;            // k units
  eom: number;                  // end of month, k units
}

// Exhibits is a status breakdown, NOT OpenActionsKpi (that shape is 8Ds only).
interface QualityExhibitsKpi extends KpiCard {
  completed: number;
  ongoing: number;
  delayed: number;
  disposition: number;
  notStarted: number;
}

interface PiqMaturityKpi extends KpiCard {
  fy2025: number;               // %
  plan2026: number;             // %
  ytd2026: number;              // %
  rollingR3: number;            // %
  byRegion: PiqMaturityRegionRow[];
}

interface PiqMaturityRegionRow {
  region: Region;
  fy2025: number;
  plan2026: number;
  ytd2026: number;
  rollingR3: number;
}

interface GsirKpiDetail extends KpiCard {
  volumeKUnits: number;
  exitRateR18: number;
  exitRateDec25: number;
  baseline2025: number;
  ytdTarget: number;
  currentResult: number;
  currentVsPriorPeriod: number;
  yeTarget: number;
  levelOfService: number;
  tcq?: GsirTcqRow[];
  bySegment?: GsirSegmentRow[];
  byCommodity?: GsirCommodityRow[];
}

interface GsirTcqRow {
  segment: ProductRegionSegment;
  ytd2025: number;              // $M
  ytdPlan: number;              // $M
  ytd2026: number;              // $M
  bwVsPlan: number;             // B/(W) vs Plan
  bwVsPY: number;               // B/(W) vs Prior Year
}
```

---

## Open Questions

| ID | View | Question | Owner | Blocks |
|----|------|----------|-------|--------|
| OQ-MAP-1 | All | Is "Plant" a first-class entity with its own API endpoint, or a filter value returned by `/kpis/filters/metadata`? | Backend A | Plant filter, PPM/CAL detail |
| OQ-MAP-2 | All | Will month-level period granularity be supported by Backend A, or only fiscal quarters? | Backend A | All detail pages |
| OQ-MAP-3 | Quality | Does the "Rolling 3-Month" filter derive months on the frontend (last 3 complete months) or is it a backend parameter? | Backend A / Frontend | Rolling period filter |
| OQ-MAP-4 | GSIR | Does each GSIR sub-view (R12, 5 Stars, TCQ, FPS, MVT) map to a separate API endpoint or one endpoint with multiple data blocks? | Backend A | GSIR detail implementation |
| OQ-MAP-5 | Products on Hold | Is the monthly column pivot produced by the backend or assembled on the frontend from `KpiHistoricalPoint[]`? | Backend A | Products on Hold table |
| OQ-MAP-6 | Summary | Is "Suppliers Needing Attention" count a dedicated endpoint response or derived from the summary KPI list? | Backend A | Summary view |
| OQ-MAP-7 | Summary | What determines "Top Offenders" — worst status, highest value deviation from target, or another rule? | Business | Summary view |
| OQ-MAP-8 | Delivery | Which filter dimensions apply to each Delivery KPI detail page? (Design not yet available) | Design / Business | Delivery detail pages |
| OQ-MAP-9 | Supplier Limited View | What subset of KPIs is shown in the supplier signed-URL view? | Business | Supplier limited view |
| OQ-MAP-10 | GSIR | What is `LOS` (Level of Service)? Is it a computed field or a direct data value? | Business | GSIR detail |

---

## Changelog

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-07-15 | Initial draft. Mapped from Figma design (node 508-9818) + DATA_MODEL_SPEC.md. Gaps and proposed interfaces documented. |
