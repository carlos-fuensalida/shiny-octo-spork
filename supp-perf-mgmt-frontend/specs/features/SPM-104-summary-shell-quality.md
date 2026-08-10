# SPM-104 — Summary Page Shell and Quality Performance Section

**Branch:** `feature/SPM-104-summary-shell-quality`
**Status:** Agreed — in implementation
**Design source:** Screenshot provided 2026-07-29 (Figma MCP unavailable). Figma node `55:8385` not re-verified.

---

## What this feature delivers

The Summary view (`/`) page shell plus the first of its three section cards:

- **Page header** — "Portfolio Snapshot" title, commodity/region subtitle, and three right-aligned action buttons rendered as disabled stubs.
- **`SectionCard`** — new reusable container for the three Summary sections (title, placeholder filter row, body, "As of …" footer).
- **`KpiCard` `variant="embedded"`** — new variant that drops the MUI `Card` chrome so KPI tiles sit inside `SectionCard`'s divider grid.
- **Quality Performance section** — all 9 KPI tiles, driven by a mock `GET /kpis/summary`.
- **Mock API layer** — Next.js route handler simulating the real endpoint, so Backend A integration is a one-line env change.

Out of scope for this card: the Delivery Performance and Top Offenders sections, functional filters and action buttons.

---

## Design divergences resolved before drafting

The screenshot supersedes `UI_REQUIREMENTS_SPEC.md` §5, which described a different page. Confirmed with the user 2026-07-29:

| Spec §5 said | Screenshot shows | Resolution |
|---|---|---|
| Two Highlight Cards (Quality, Suppliers) | Absent | **Removed from §5.** Not built. |
| "Suppliers Needing Attention (N of N)" table | Absent | **Removed from §5.** Closes `OQ-API-17` — no endpoint existed. |
| 2-column grid of 9 individual bordered `KpiCard`s | One bordered section card containing a 6-column divider grid of tiles | Drives the `variant="embedded"` decision below. |
| Three vertical bar charts (Top Offenders) | Five horizontal bar charts | Deferred to the Top Offenders card. |

**§5 is not rewritten in this PR.** A full rewrite from a screenshot would bake in estimated measurements. Instead this PR adds a short "superseded — pending Figma re-validation" callout at the head of §5 listing the four divergences above, so nobody implements from stale content. The rewrite happens once Figma MCP is available and exact values can be pulled.

---

## Data contract

### New types (`src/types/index.ts`)

`GET /kpis/summary` currently returns a flat `KpiCard[]` with a single scalar `value`. That cannot express 4 of the 9 Quality tiles — 8Ds needs three custom-labelled counts, Cost Recovery needs a currency plus a percentage, and both Risk Rating cards need non-regional labels. The payload gains a `metrics[]` array:

```ts
export interface SummaryMetric {
  label: string;                     // "Global", "NAR", "Total Open 2026", "Global YTD"
  value: number | string | null;     // null renders as "—"
  unit?: KpiUnit;
  caption?: string;                  // sub-label under the value, e.g. "Total Units"
}

export interface SummaryKpiCard extends KpiCard {
  metrics: SummaryMetric[];
  detailRoute?: string;              // e.g. "/quality/ppm" — drives tile click-through
}
```

`caption` is unused by Quality but required by the Delivery section, where DTC renders `91.2%` above `19,800 Units`. Defining it now avoids a second contract change.

> **Backend A action required.** This extends the `GET /kpis/summary` response documented in `API_SPEC.md` §Group 20. The `metrics[]` shape needs sign-off before the real endpoint is built. Until then it exists only in the mock.

### Service

`getSummaryKpis()` already exists at [kpi.service.ts:24](../../src/services/kpi.service.ts#L24) and already targets `/kpis/summary`. Only its return type changes:

```ts
export async function getSummaryKpis(
  filters: FilterParams = {},
): Promise<ApiListResponse<SummaryKpiCard>>
```

No new service function. No validation layer added — `kpi.service.ts` currently does no zod parsing and this card does not change that convention.

### Hook

New `useSummaryKpis(filters)` in `src/hooks/useSummaryKpis.ts`, wrapping `useQuery`. Returns `{ data, isLoading, isError, refetch }`. `QueryClient` is already configured in [Providers.tsx](../../src/components/providers/Providers.tsx) with `staleTime: 5min, retry: 1`.

Query key: `['kpis', 'summary', filters]`.

---

## Mock API

Extends the pattern established in SPM-92.

**Handler:** `src/app/api/mock/api/v1/kpis/summary/route.ts`

| Behaviour | Detail |
|---|---|
| Auth | Returns `401` when the `session` cookie is absent, matching the real contract and the existing mock auth handlers. |
| Filters | Honours `region`, `month`, `year`. `region=NAR` / `region=LAR` filters each KPI's `metrics[]` down to that region's entries so filter changes are visibly reflected. |
| Envelope | Real `{ data, meta }` shape. `meta.reportingPeriod: "2026-01"`, `meta.lastUpdated`, `meta.requestId`. |
| State override | `?_state=empty` → `{ data: [] }` 200 · `?_state=error` → 500 · `?_state=slow` → 2s delay before 200. Lets all four §14 states be reviewed in the browser without code changes. |

**Enabling mock mode:** `.env.local` currently reads `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001`. It must become:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/mock
```

Swapping to the real Backend A later is that line and nothing else.

### Mock dataset — Quality Performance (9 KPIs)

| # | `kpiId` | `kpiName` | Span | Metrics (label · value) | `detailRoute` |
|---|---|---|---|---|---|
| 1 | `kpi-rejection-ppm` | Rejection PPM | 1 | Global · 850 · NAR · 620 · LAR · 910 | `/quality/ppm` |
| 2 | `kpi-cal-ppm` | CAL/PPM | 1 | Global · 410 · NAR · 350 · LAR · 480 | `/quality/cal` |
| 3 | `kpi-gsir` | GSIR | 1 | Global · 42 | `/quality/gsir` |
| 4 | `kpi-products-on-hold` | Products on Hold | 1 | Global · 17 | `/quality/products-on-hold` |
| 5 | `kpi-cost-recovery` | Cost Recovery | 1 | Global YTD · 340000 (USD) · Global Conversion · 68 (PERCENT) | — |
| 6 | `kpi-piq-maturity` | PIQ Maturity | 1 | Global · 74 (PERCENT) | `/quality/piq-maturity` |
| 7 | `kpi-8d-capa` | 8Ds | 2 | Total Open 2026 · 38 · Open > 90 Days · 9 · Open > 45 Days · 15 | `/quality/8d-capa` |
| 8 | `kpi-risk-rating-components` | Risk Rating Components (most updated) | 2 | Preferred · 10 · Not Preferred · 6 · New Business on Hold · 3 | `/quality/risk-rating-components` |
| 9 | `kpi-risk-rating-fps` | Risk Rating FPS (most updated) | 2 | On Quality · 4 · Not on Quality · 4 | — |

All entries: `category: 'QUALITY'`, `region: 'GLOBAL'`, `status: null`, `reportingPeriod: '2026-01'`.

Two notes on the source design:

- **KPI 9** shows the label "Not on Quality" twice in the screenshot, both valued `4`. Read as a design typo; built as `On Quality` / `Not on Quality`. See OQ-3.
- Cost Recovery and Risk Rating FPS have no scaffolded detail route under [src/app/(dashboard)/quality/](<../../src/app/(dashboard)/quality/>), so their tiles are non-clickable until those pages exist.

`status` is `null` on every card, so no `StatusChip` renders — consistent with `API_SPEC.md`'s note that thresholds are unresolved (`OQ-KPI-3`). The `KpiCard` chip path stays exercised by other views.

---

## Components

Checked against `specs/COMPONENT_INVENTORY.md` before drafting.

### Modified — `KpiCard`

Gains a `variant` prop and metric-array support. Existing call sites are unaffected: both new props are optional and `variant` defaults to today's behaviour.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | `'card' \| 'embedded'` | `'card'` | **New.** `'embedded'` renders without the MUI `Card` wrapper. |
| `metrics` | `SummaryMetric[]` | — | **New.** When provided, supersedes `tiles` / `values`. |
| `kpi`, `values`, `tiles`, `subtitle`, `loading`, `error`, `onClick` | unchanged | | |

- `variant="embedded"` renders a bare `Box` — no border, no radius, no shadow. The parent grid owns the dividers.
- With `onClick`, the embedded variant uses a `ButtonBase` (not `CardActionArea`, which assumes card chrome) and a subtle `action.hover` background on hover/focus-visible.
- `metrics` renders as a wrapping flex row: each metric `flex="1 1 0"`, `minWidth={72}`, labels wrap to two lines. This reproduces every arrangement in the screenshot without per-KPI layout code — 3 metrics wrap 2-then-1 in a span-1 tile, sit on one line in a span-2 tile, and Cost Recovery's long labels stack naturally.
- **New:** `KpiCard.Skeleton` static, per the "no component without its Skeleton" rule. The existing `loading` prop delegates to it.

Value formatting comes from a new `src/lib/format.ts` (below), not from the component.

### New — `SectionCard`

`src/components/ui/SectionCard.tsx` · barrel-exported.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `title` | `string` | — | Rendered `variant="h2"`, `color="primary.main"` |
| `filters` | `React.ReactNode` | — | Placeholder filter row slot |
| `footer` | `string` | — | e.g. "As of January, 2026" |
| `columns` | `number` | `6` | Grid column count for the body |
| `children` | `React.ReactNode` | — | Grid cells |

Structure: title → filter row → `Divider` → grid body → `Divider` → footer. Grid cells get 1px `divider` borders on their right and bottom edges; edge cells suppress theirs.

**New:** `SectionCard.Skeleton` — accepts `cells` and `columns`, preserves the full grid shape with the title still rendered, per §14.

### New — `SummaryHeader`

`src/components/summary/SummaryHeader.tsx`.

| Prop | Type |
|---|---|
| `commodity` | `string` |
| `regionLabel` | `string` |

"Portfolio Snapshot" (`variant="h1"`, `primary.main`) with subtitle `{commodity} · {regionLabel}` at `fontSize={16}`, `secondary.main`. Right-aligned: CUSTOMIZE KPI'S (`DragIndicator`), FILTERS (`FilterList`), EXPORT (`SaveAlt`) — all `Button size="small" variant="text" disabled` with `endIcon`, matching the screenshot's icon-right placement.

Subtitle values are hardcoded to `"Steel Forgings"` / `"All regions"` this card; they bind to real filter state when the filter bar is wired.

### New — `QualityPerformanceSection`

`src/components/summary/QualityPerformanceSection.tsx` · `'use client'`.

Composes `SectionCard` + 9 embedded `KpiCard`s. Owns the span map (`span: 1` for KPIs 1–6, `span: 2` for 7–9) — a layout concern, deliberately kept out of the payload. Calls `useSummaryKpis()`, filters to `category === 'QUALITY'`, and routes on tile click via `useRouter`.

> **New directory — agreed 2026-07-29.** `src/components/summary/` holds feature-scoped compositions that are not reusable and therefore do not belong in `ui/`. No barrel — same rationale as `layout/`. A `src/components/{feature}/` row is added to `CLAUDE.md`'s File Locations table in this PR.

### New — `src/lib/format.ts`

`formatMetricValue(value: number | string | null, unit?: KpiUnit): string`

| Unit | Input | Output |
|---|---|---|
| `USD` | `340000` / `1200000` | `$340k` / `$1.2M` |
| `PERCENT` | `74` / `91.2` | `74%` / `91.2%` |
| `PPM`, `COUNT`, `DAYS`, `INDEX` | `22500` | `22,500` |
| any | `null` | `—` |

Pure function, unit-tested. Reused by the Delivery section.

---

## States (`UI_REQUIREMENTS_SPEC.md` §14)

| State | Trigger | Rendering |
|---|---|---|
| Loading | `isLoading` | `SectionCard.Skeleton` — section title and 6-column grid shape preserved, 9 shimmer cells. Page header renders immediately (static). |
| Empty | `data: []`, HTTP 200 | `SectionCard` renders with title, filter row and footer intact; body replaced by `EmptyState` (title "No KPI data", description referencing the active filters). Never treated as an error. |
| Error | non-2xx or network failure | `SectionCard` renders with title intact; body replaced by `ErrorState` with `onRetry` wired to `refetch()`. |
| Success | `data.length > 0` | 9 tiles in the divider grid. |

No blank screens in any path. `EmptyState` and `ErrorState` are reused as-is from `src/components/ui/`.

---

## Layout and tokens

All values below are design tokens or theme multipliers — no hex, no px string literals.

| Element | Token |
|---|---|
| Page background | `background.default` (already set by the dashboard layout) |
| Section card | MUI `Card` — border and 8px radius come from the `MuiCard` theme override |
| Section title | `variant="h2"` (20px / 500 / 0.15px) · `color="primary.main"` |
| Page title | `variant="h1"` (24px / 400) · `color="primary.main"` |
| Page subtitle | `fontSize={16}` · `color="secondary.main"` |
| Metric label | `variant="caption"` (12px) · `color="secondary.main"` |
| Metric value | `variant="h5"` (24px / 400) |
| Metric caption | `variant="caption"` (12px) · `color="text.secondary"` |
| Section footer | `variant="body2"` · `color="text.secondary"` |
| Grid dividers | `1px solid` · `divider` |
| Gaps | `gap={4}` (16px) between sections · `p={4}` inside tiles |
| Action buttons | `variant="text"` `size="small"` · theme `button` typography (13px / 500 / uppercase) |

**Update (SPM-114, 2026-07-31):** the metric value/label/caption sizes above were originally `fontSize={28}` / `variant="body2"` / `fontSize={11}` — estimated from the SPM-104 screenshot, as flagged at the time. Real Figma values (pulled via `get_design_context` while building the Delivery Performance section, which shares this same `MetricColumn`) turned out to be 24px for the value and 12px for label/caption — both exact matches for MUI's own default `h5` and `caption` variants, so no new theme tokens were needed, just switching to those variants. Since `MetricColumn` is shared by both sections, this table and the component now reflect the corrected values for Quality too.

---

## Tests

| File | Covers |
|---|---|
| `src/test/services/kpi.service.test.ts` | `getSummaryKpis` — URL construction, query-param encoding via `buildQuery`, envelope passthrough, `HttpError` propagation on non-2xx |
| `src/test/api/mock/api/v1/kpis/summary/route.test.ts` | Mock handler — 401 without cookie, 200 shape with cookie, region filtering, `_state=empty`/`error` overrides. `// @vitest-environment node` at top. |
| `src/test/lib/format.test.ts` | `formatMetricValue` across every unit, plus `null` |
| `src/test/components/ui/SectionCard.test.tsx` | Renders title/footer/children; `SectionCard.Skeleton` preserves title and cell count |
| `src/test/components/ui/KpiCard.test.tsx` | `variant="embedded"` renders no `Card`; `metrics[]` renders all labels and values; `onClick` fires; `null` value renders `—` |
| `src/test/components/summary/QualityPerformanceSection.test.tsx` | Smoke test across all four states with a mocked `useSummaryKpis` |

---

## Files added / modified

| File | Change |
|---|---|
| `src/types/index.ts` | Modified — `SummaryMetric`, `SummaryKpiCard` |
| `src/lib/format.ts` | New — `formatMetricValue` |
| `src/services/kpi.service.ts` | Modified — `getSummaryKpis` return type |
| `src/hooks/useSummaryKpis.ts` | New |
| `src/hooks/index.ts` | Modified — barrel export |
| `src/components/ui/KpiCard.tsx` | Modified — `variant`, `metrics`, `.Skeleton` |
| `src/components/ui/SectionCard.tsx` | New |
| `src/components/ui/index.ts` | Modified — barrel export |
| `src/components/summary/SummaryHeader.tsx` | New |
| `src/components/summary/QualityPerformanceSection.tsx` | New |
| `src/app/(dashboard)/page.tsx` | Modified — composes header + section |
| `src/app/api/mock/api/v1/kpis/summary/route.ts` | New — mock handler |
| `.env.local` | Modified — base URL points at `/api/mock` |
| `specs/UI_REQUIREMENTS_SPEC.md` | Modified — "superseded" callout added to §5; full rewrite deferred to Figma |
| `specs/COMPONENT_INVENTORY.md` | Modified — `SectionCard` added, `KpiCard` entry updated |
| `CLAUDE.md` | Modified — File Locations row for `src/components/{feature}/` |
| 6 test files | New — see table above |

---

## Acceptance criteria

From the Jira card, with the resolutions above folded in:

- [x] Page renders "Portfolio Snapshot" title + commodity/region subtitle
- [x] Quality Performance section renders all 9 KPI tiles via `KpiCard variant="embedded"` inside one `SectionCard`, driven by mock `GET /kpis/summary`
- [x] Loading (skeleton), empty (`data: []`), error, and success states implemented per §14
- [x] CUSTOMIZE KPI'S / FILTERS / EXPORT rendered as disabled stubs
- [x] Per-section filter row rendered with placeholder labels (see OQ-1)
- [x] Service, mock route, formatter, and component tests committed
- [x] `COMPONENT_INVENTORY.md` updated; §5 marked superseded

---

## Validation against the design (2026-07-29)

Rendered in the browser and compared to the source screenshot. Structure matches: 6-column grid, three span-2 tiles on row 2, divider placement, all 9 KPIs with correct values and unit formatting (`$340k`, `68%`, `74%`), placeholder filter row, and the "As of January, 2026" footer.

**Automated checks:** 84 tests pass (56 new) · production build passes · lint clean on all files this branch touches (5 remaining errors are pre-existing on `dev`: `src/app/layout.tsx`, three auth route tests, `vitest.config.ts`).

### Outstanding visual gaps

| # | Gap | Severity | Status |
|---|---|---|---|
| V-1 | **Tile content does not share a baseline.** The design top-aligns every row-1 tile, so all titles sit on one line and `850 / 42 / 17 / $340k / 74%` share a value baseline. In the build, single-metric tiles (GSIR, Products on Hold, PIQ Maturity) render ~30px lower than multi-metric ones. | Defect | **Resolved.** Root cause: MUI `ButtonBase`'s default `display: inline-flex; align-items: center; justify-content: center` was only partially overridden (`display: 'block'` only) on the embedded tile's clickable wrapper, so its content was vertically centered in the stretched grid cell instead of top-anchored. Fixed by making both the `ButtonBase` and plain-`Box` embedded branches explicit `flexDirection: 'column'` with top alignment ([KpiCard.tsx](../../src/components/ui/KpiCard.tsx)). |
| V-2 | **Section header block is tighter than the design** — ~88px from card top to first divider vs ~114px in the design. Title→filter-row→divider gaps are all slightly compressed. Paddings were estimated from a screenshot; resolve against Figma rather than guessing twice. | Cosmetic | **Open.** Deferred pending real Figma access — see follow-on card for the §5 rewrite. |
| V-3 | **Cost Recovery renders side-by-side, not stacked.** The design stacks `Global YTD / $340k` above `Global Conversion / 68%`; the build fits both on one line at viewports wider than the 1440px design frame. | Needs design input | **Resolved for Cost Recovery** — confirmed intentional (design-mandated, not a frame-width artifact). Added a `stackMetrics` prop to `KpiCard` that forces its `metrics` into a fixed vertical column regardless of width; wired for `kpi-cost-recovery` in `QualityPerformanceSection`. **Not yet applied to 8Ds** — the same wrapping mechanism affects its labels at narrower widths; left as-is pending a decision on whether 8Ds should also stack. |
| V-4 | **Chatbot subtitle** reads "across all suppliers"; the design reads "across your **Steel Forgings** portfolio" — it should reflect the active commodity filter. Belongs to `ChatSuggestions` (SPM-91), not this card. | Separate ticket | Out of scope for `SPM-104`. |

Confirmed-intentional divergences: "Quality Performance" spelling (OQ-6), `On Quality` / `Not on Quality` labels (OQ-3), and the three greyed-out action buttons.

### Post-validation changes (not in the original design divergence list)

- **`SectionCard` divider inset.** The card's 3 horizontal rules (header→grid divider, internal row-1/row-2 grid divider, grid→footer divider) originally ran edge-to-edge, touching the card's left/right border. The grid is now wrapped in a `px={6}` inset and both `Divider`s carry a matching `mx={6}`, so no horizontal rule touches the card border. See `COMPONENT_INVENTORY.md` → `SectionCard`.

---

## Open questions

**OQ-1 — Filter row rendering. RESOLVED 2026-07-29.** The Jira AC said "per-section filter *dropdowns*"; the screenshot shows breadcrumb-style muted text (`Filter 1 / Filter 2 / Filter 3`) with slash separators. Built to match the screenshot — non-interactive muted labels. Swaps to `FilterDropdown` once the real filter dimensions are known.

**Update (SPM-114, 2026-07-31): removed.** The current design has no filter row on the section cards at all. `SectionCard`'s `filterLabels` prop and the `FilterPlaceholder` it rendered were deleted; `QualityPerformanceSection` and `DeliveryPerformanceSection` no longer pass it.

**OQ-2 — Reporting period granularity.** The footer reads "As of January, 2026" (month-level) while `KpiCard.reportingPeriod` and `meta.reportingPeriod` are fiscal quarters (`2026-Q2`). Known gap in `VIEW_DATA_MAP_SPEC.md`. Mock returns `"2026-01"` and the footer formats month-level. Backend A must confirm which granularity `/kpis/summary` will actually return.

**OQ-3 — Risk Rating FPS labels.** Screenshot shows "Not on Quality" twice, both `4`. Built as `On Quality` / `Not on Quality`. Needs design confirmation.

**OQ-4 — `src/components/{feature}/` convention. RESOLVED 2026-07-29.** Agreed. `src/components/summary/` created; `CLAUDE.md` File Locations row added.

**OQ-5 — Tile click-through.** `UI_REQUIREMENTS_SPEC.md` §4.2 requires KPI cards to navigate to their detail page on click. The screenshot shows no hover affordance (static image). Built as clickable where `detailRoute` exists, with a subtle hover background.

**OQ-6 — Section title spelling.** The screenshot reads "Quality Perfomance". Implemented as "Quality Performance".

---

## Follow-on cards

| Card | Scope |
|---|---|
| TBD | Delivery Performance section — 3 region groups, reuses `SectionCard` + embedded `KpiCard` + `formatMetricValue` |
| TBD | Top Offenders section — 5 horizontal Recharts bar charts, requires a new `GET /kpis/top-offenders` contract from Backend A |
| TBD | `UI_REQUIREMENTS_SPEC.md` §5 rewrite, once Figma MCP is available and exact measurements can be pulled |
