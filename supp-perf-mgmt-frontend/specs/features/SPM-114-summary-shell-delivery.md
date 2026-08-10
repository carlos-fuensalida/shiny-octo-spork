# SPM-114 — Summary Page Delivery Performance Section

**Branch:** `feature/SPM-114-summary-shell-delivery`
**Status:** Agreed — in implementation
**Design source:** Figma `get_design_context`, node `772:21458` ("Card Template" instance inside frame `772:21235`), file `XDBgP7IlEw9d9xvIEinGxM`. Pulled directly — no screenshot fallback needed this time.

---

## What this feature delivers

The second of the Summary view's three section cards:

- **Delivery Performance section** — reuses `SectionCard` + embedded `KpiCard`, driven by the same mock `GET /kpis/summary` extended with `category: 'DELIVERY'` entries.
- Unlike Quality's flat 6-column KPI grid, this section groups by **region first** (Global · NAR · LAR), each region column stacking that region's applicable delivery KPIs.

Out of scope: Top Offenders (separate card, blocked on a new Backend A endpoint — see SPM-104 follow-on notes).

---

## Design vs. Quality's layout — what's different

| | Quality (SPM-104) | Delivery (this card) |
|---|---|---|
| Grouping axis | One KPI per tile, 9 tiles in a 6-col grid | One **region** per tile, 3 tiles (Global/NAR/LAR), each listing several KPIs |
| Tile header | KPI name (e.g. "Rejection PPM") | Region name (e.g. "Global") |
| Metrics per tile | Belong to one KPI | Belong to several different KPIs |
| Click-through | Navigates to `detailRoute` (per-KPI page) where one exists | Navigates to `/delivery` (the top-level Delivery view) — no `/delivery/{kpiId}` pages are scaffolded yet (route table marks KPI detail pages "Not yet designed"), so every region tile shares one destination until those pages exist |

Screenshot reference (from `get_design_context`):

Global: Expedite (Supplier Caused) `Qty 145 / $1.2M` · Production Loss `22,500` (Total Units) · DTC `91.2%` (19,800 Units) · VMI `88%` (% Compliant) · OTIF `94.2%`
NAR: Expedite `Qty 62 / $450k` · Production Loss `9,100` (Total Units) · DTC `8,800` (Total Units) · VMI `85%` (% Compliant)
LAR: Expedite `Qty 55 / $380k` · Production Loss `10,200` (Total Units) · DTC `90.1%` (9,400 Units) · OTIF `93.5%`

Region availability (VMI = NAR-only, OTIF = LAR-only, both roll up to Global) matches `DATA_MODEL_SPEC.md`'s Delivery KPI table exactly — no invented data.

---

## Data contract

### No type changes

`SummaryKpiCard` / `SummaryMetric` (added in SPM-104) already cover this shape. No changes to `src/types/index.ts`.

### Mock data — modeled per KPI, not per region

The mock stays **KPI-centric**, mirroring Quality's regional KPIs (Rejection PPM, CAL/PPM): each of the 5 Delivery KPIs is one `SummaryKpiCard` with a `metrics[]` array keyed by region label (`Global` / `NAR` / `LAR`). This is a deliberate choice over modeling 3 region-centric rows, for two reasons:

1. It reuses the existing `applyRegion()` mock helper untouched — it already filters any `SummaryKpiCard[]` by matching `metric.label` against `['Global', 'NAR', 'LAR']`.
2. The region-column layout is then a **pure rendering-layer pivot** (computed in the section component, like Quality's `SPANS` map), keeping the payload shape consistent across both sections rather than bifurcating it.

| `kpiId` | `kpiName` | Metrics (label · value · unit · caption) |
|---|---|---|
| `kpi-expedite` | Expedite (Supplier Caused) | Global · `"Qty 145 / $1.2M"` (raw string) · NAR · `"Qty 62 / $450k"` · LAR · `"Qty 55 / $380k"` |
| `kpi-production-loss` | Production Loss | Global · 22500 · COUNT · "Total Units" · NAR · 9100 · COUNT · "Total Units" · LAR · 10200 · COUNT · "Total Units" |
| `kpi-dtc` | DTC | Global · 91.2 · PERCENT · "19,800 Units" · NAR · 8800 · COUNT · "Total Units" · LAR · 90.1 · PERCENT · "9,400 Units" |
| `kpi-vmi-compliance` | VMI | Global · 88 · PERCENT · "% Compliant" · NAR · 85 · PERCENT · "% Compliant" |
| `kpi-otif` | OTIF | Global · 94.2 · PERCENT · — · LAR · 93.5 · PERCENT · — |

All entries: `category: 'DELIVERY'`, `region: 'GLOBAL'`, `status: null`, `detailRoute: undefined` (no scaffolded page), `reportingPeriod: '2026-01'`.

**No `formatMetricValue` changes.** It already passes strings through untouched (added in SPM-104 specifically so the backend/mock could send pre-composed values like `"Qty 145 / $1.2M"` — see `src/lib/format.ts:20`).

**Mock route:** extends the existing array in `src/app/api/mock/api/v1/kpis/summary/route.ts` — `DELIVERY_KPIS` alongside `QUALITY_KPIS`, both returned from one `GET`. `applyRegion` runs over the combined array unmodified.

### Service / hook

No changes. `getSummaryKpis()` and `useSummaryKpis()` already return the full `SummaryKpiCard[]`; `DeliveryPerformanceSection` filters to `category === 'DELIVERY'` client-side, same pattern as `QualityPerformanceSection`.

---

## Components

### Modified — `KpiCard`

Two new props:

| Prop | Type | Default | Notes |
|---|---|---|---|
| `title` | `string` | — | **New.** Overrides the header text with a group-label style (theme `subtitle2` — Open Sans SemiBold 13px, applied with `color="primary.main"`) instead of the default KPI-name style (`body1`/500). Status chip still only renders from `kpi?.status`, so it stays absent whenever `title` is used without a `kpi`. |
| `metricRows` | `SummaryMetric[][]` | — | **New.** Supersedes `metrics`. Renders explicit stacked rows instead of one flex-wrap row. |

**Why `metricRows` was needed (found during validation, not in the original draft):** the design groups each region's KPIs into two fixed rows — Expedite + Production Loss, then the rest — regardless of available width. Plain `metrics` relies on `flex-wrap` to break a row, which only happens when the row runs out of horizontal space. That reproduces Quality's grouping by accident (its span-1 tiles are always narrow enough to force a wrap), but Delivery's tiles are span-2 — wide enough that all 5 metrics fit on one line with room to spare, so the intended two-row grouping never appeared; the first working build rendered every metric on a single row. `metricRows` makes the grouping explicit instead of width-dependent.

Needed because a Delivery region tile's header is a **region name**, not a KPI name — a different semantic and a different visual treatment than `KpiCard`'s built-in KPI-name header. `title` renders inside the same header row (and the same padded box) rather than being suppressed and re-added externally, so no extra padding/spacing bookkeeping is needed in the consumer.

**New theme token:** `theme.typography.subtitle2` (`src/lib/theme.ts`) — Open Sans SemiBold, 13px, 0.15px tracking — pulled from the real Figma values via `get_design_context` (node `772:21458`), not estimated from a screenshot. `subtitle2` was unused elsewhere in the app, so repurposing it avoids the TypeScript module augmentation a brand-new variant name would need. Color is applied via the `color` prop at each call site (matching the existing `h2` convention), not baked into the variant.

`stackMetrics` is untouched and not used alongside `metricRows` (the latter is already explicit about rows).

**Follow-on, not in this PR:** Quality Performance's tile styling was built from a screenshot (SPM-104) and hasn't been reconciled against real Figma tokens. Once Figma access is available for that section too, a separate PR should re-pull it and replace any estimated values with confirmed tokens — same spirit as the deferred `UI_REQUIREMENTS_SPEC.md` §5 rewrite.

### New — `DeliveryPerformanceSection`

`src/components/summary/DeliveryPerformanceSection.tsx` · `'use client'`.

Composes `SectionCard` with 3 cells (`span={2}` each, filling the existing 6-column grid — no `SectionCard` changes needed since 3×2=6). For each region, a local `groupByRegion` helper:

- Pivots the 5 KPI-centric rows into that region's applicable metrics: for each Delivery KPI, includes a `{label: kpi.kpiName, value, unit, caption}` entry if that KPI has a metric for this region (skips it otherwise — this is how VMI drops out of the LAR tile and OTIF drops out of NAR).
- Splits the pivoted list into two fixed rows — first 2 entries (Expedite, Production Loss), then the rest (DTC, and whichever of VMI/OTIF apply) — and passes them as `KpiCard`'s `metricRows`.
- Renders `<KpiCard variant="embedded" title={region} metricRows={rows} onClick={() => router.push('/delivery')} />`.

Every region tile is clickable and navigates to `/delivery` (the existing top-level Delivery view) — not a KPI-specific route, since none of the 5 Delivery KPIs has a scaffolded `/delivery/{kpiId}` page yet. Revisit per-tile/per-metric routing once those pages exist.

Owns `groupByRegion` as local, feature-scoped logic (not promoted to `ui/`, consistent with `src/components/{feature}/` being non-reusable compositions).

---

## Resolved design decisions

**Region label style — resolved.** Registered as a real theme token (`subtitle2`) using the exact values pulled from Figma via `get_design_context`, rather than approximating an existing style.

**NAR's DTC is a raw count, not a percentage — resolved.** Confirmed intentional: NAR's DTC KPI is defined in raw units while Global/LAR are percentages. Built exactly as shown (`COUNT` unit, "Total Units" caption for NAR vs. `PERCENT` + "N Units" caption for Global/LAR).

**Click-through — resolved.** No `/delivery/{kpiId}` pages are scaffolded yet, so every region tile navigates to `/delivery` (the existing top-level Delivery view) rather than a KPI-specific route.

---

## Post-validation changes (not in the original draft)

Found while reviewing the rendered page:

- **`metricRows` added to `KpiCard`.** The initial build passed a flat `metrics` array, relying on `flex-wrap` to break Expedite/Production Loss onto one row and DTC/VMI/OTIF onto the next. That only reproduces the design by accident on narrow tiles (Quality's span-1 tiles always run out of room); Delivery's span-2 tiles are wide enough to fit all 5 metrics on one line, so the wrap never triggered and everything rendered on a single row. See the `KpiCard` section above.
- **`MetricColumn` font sizes corrected — affects Quality too.** Asked what the exact Figma token was for the metric value text (e.g. `22,500` in Production Loss) — it's 24px, not the `fontSize={28}` SPM-104 shipped with (a screenshot estimate, flagged at the time as needing Figma re-validation). Caption text is 12px, not `{11}`. Both are exact matches for MUI's default `h5` and `caption` variants, so `MetricColumn` now uses those variants instead of hardcoded `fontSize`/`fontWeight`/`lineHeight`. Since `MetricColumn` is shared by both sections, this corrects Quality Performance's tiles as a side effect — see the update note in `specs/features/SPM-104-summary-shell-quality.md`.
- **Row shape made explicit per region, not just per row-group.** Even after splitting into two row-groups (see above), Expedite/Production Loss were still forced onto one line always (the row `Box` had no `flexWrap`). The design actually varies by region: Global stacks them (their combined values are the longest of the three regions — "Qty 145 / $1.2M" plus "22,500"), NAR/LAR keep them side by side. Rather than lean on width-dependent wrapping (fragile — Global's and NAR/LAR's text lengths are close enough that a real browser could go either way depending on the chatbot panel's state), `groupByRegion`'s `ROW_SIZES` now encodes the row shape explicitly per region (`Global: [1, 1, 3]`, `NAR`/`LAR`: `[2, 2]`). `flexWrap` is still on each row `Box` as a responsive safety net for narrow viewports, it just no longer carries the primary grouping responsibility.
- **`SectionCard`'s placeholder filter row removed — affects Quality too.** The current design has no filter row on the section cards at all; the `Filter 1 / Filter 2 / Filter 3` breadcrumb built in SPM-104 (OQ-1) isn't in it. Removed `filterLabels`/`FilterPlaceholder` from `SectionCard` and `SectionCard.Skeleton` entirely (no remaining consumer needed it), and stopped both `QualityPerformanceSection` and `DeliveryPerformanceSection` from passing it. See the update note in `specs/features/SPM-104-summary-shell-quality.md` OQ-1.

---

## States (`UI_REQUIREMENTS_SPEC.md` §14)

Same shape as Quality — filtered to `category === 'DELIVERY'` instead:

| State | Rendering |
|---|---|
| Loading | `SectionCard.Skeleton` with `spans={[2, 2, 2]}`, `metricsPerCell={4}` approximating each region's tile count |
| Empty | `SectionCard` renders title/footer; body replaced by `EmptyState` in a `span={6}` cell |
| Error | `SectionCard` renders title; body replaced by `ErrorState` with `onRetry` → `refetch()` |
| Success | 3 region cells, each with its pivoted metrics, clickable to `/delivery` |

---

## Tests

| File | Covers |
|---|---|
| `src/test/api/mock/api/v1/kpis/summary/route.test.ts` | Extend existing suite — response now includes both `QUALITY` and `DELIVERY` entries; region filtering narrows correctly across the combined set, including a regional KPI with no entry for the requested region (VMI/LAR) narrowing to `[]` instead of falling back to its full unfiltered metrics — a latent bug in `applyRegion` this dataset exposed and fixed |
| `src/test/components/ui/KpiCard.test.tsx` | Extend — `title` overrides the header text, suppresses the status chip when used without a `kpi`, and is used in the clickable tile's `aria-label`; `metricRows` renders every row, supersedes `metrics`, and keeps each row's metrics in a separate container |
| `src/test/components/summary/DeliveryPerformanceSection.test.tsx` | New smoke test across all four states with a mocked `useSummaryKpis`; verifies the region pivot (VMI/OTIF each appear in only 2 of 3 tiles) and that every tile navigates to `/delivery` |

No `kpi.service.test.ts` or `format.test.ts` changes — neither's contract changes.

---

## Files added / modified

| File | Change |
|---|---|
| `src/lib/theme.ts` | Modified — new `typography.subtitle2` variant (Open Sans SemiBold 13px) |
| `src/components/ui/KpiCard.tsx` | Modified — `title` prop, used in header rendering and clickable `aria-label` |
| `src/components/summary/DeliveryPerformanceSection.tsx` | New |
| `src/app/api/mock/api/v1/kpis/summary/route.ts` | Modified — adds `DELIVERY_KPIS`, combines with `QUALITY_KPIS` in the response; fixes an `applyRegion` fallback bug |
| `src/app/(dashboard)/page.tsx` | Modified — composes `DeliveryPerformanceSection` below Quality's |
| `specs/COMPONENT_INVENTORY.md` | Modified — `KpiCard` entry updated, `DeliveryPerformanceSection` added |
| 3 test files | New/modified — see table above |

---

## Acceptance criteria

- [x] Delivery Performance `SectionCard` renders 3 region columns (Global, NAR, LAR)
- [x] Each region shows only the KPIs applicable to it (VMI absent from LAR, OTIF absent from NAR), matching `DATA_MODEL_SPEC.md`'s region-availability table
- [x] Mock `GET /kpis/summary` returns both `QUALITY` and `DELIVERY` entries; region filter works correctly across both
- [x] Loading (skeleton), empty, error, and success states implemented per §14
- [x] Region tiles navigate to `/delivery` on click
- [x] `KpiCard.title` tested; `DeliveryPerformanceSection` smoke-tested across all four states
- [x] `COMPONENT_INVENTORY.md` updated
