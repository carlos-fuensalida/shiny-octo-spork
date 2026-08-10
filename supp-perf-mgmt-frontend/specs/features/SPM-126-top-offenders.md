# SPM-126 — Summary Page Top Offenders Section

**Branch:** `feature/SPM-126-top-offenders`
**Status:** Agreed — implemented
**Design source:** Figma `get_design_context` + `get_metadata`, node `772:21459` ("Card Template" instance — the Top Offenders card — inside frame `772:21235`), file `XDBgP7IlEw9d9xvIEinGxM`. Pulled directly via MCP (no screenshot fallback); the card's node tree was walked in parts because the full `get_design_context` payload exceeded the context limit.

---

## What this feature delivers

The third and final section card of the Summary (Portfolio Snapshot) view:

- **Top Offenders section** — for each of five delivery/quality metrics, the five worst-performing suppliers rendered as a horizontal bar chart, ranked worst-first.
- Reuses the existing `SectionCard` shell (title + "As of …" footer + card border), consistent with the Quality and Delivery sections.
- Introduces the app's **first chart component**, built on `recharts` (already a dependency, `^2.15.0`, previously unused).

The five charts:

| # | Chart title (exact, from Figma) | Unit |
|---|---|---|
| 1 | Expedites — ($ Value) | USD |
| 2 | Production Lost — Units Lost | COUNT |
| 3 | DTC — Units Lost | COUNT |
| 4 | VMI — % Non-Compliant | PERCENT |
| 5 | OTIF — % of Delivery | PERCENT |

Out of scope (deferred to a future ticket): the header **filter row** and any working filtering. The design frame renders the filter area empty, and `SectionCard` no longer carries a filter row (removed in SPM-114).

---

## Layout (from Figma)

The card body is a grid of five **Bar Chart Cards**, three on the top row and two on the bottom, separated by dividers:

```
┌───────────────┬───────────────┬───────────────┐
│  Expedites    │ Production    │  DTC          │
│  ($ Value)    │ Lost          │  Units Lost   │
├───────────────┴───────────────┴───────────────┤   ← horizontal divider
│  VMI          │  OTIF         │               │
│  % Non-Compl. │  % of Deliv.  │   (empty)     │
└───────────────┴───────────────┘               ┘
```

- Figma composes the separators as explicit `<Divider>` instances — vertical between charts in a row, one horizontal between the two rows. The Figma code-connect hint maps the vertical divider directly to MUI `<Divider orientation="vertical" />`. We follow that composition rather than the grid-gap divider trick `SectionCard` uses internally, because the bottom row is **left-aligned at natural width** (two charts, not stretched to fill), leaving the bottom-right cell empty.
- Each Bar Chart Card: `background.paper` (white), 16px padding, 8px radius (`radius/medium`), 16px internal gap.
- Responsive: the 3-up / 2-up arrangement holds at `lg`; below `lg` the charts collapse to fewer columns and ultimately stack (dividers following suit), consistent with how the other sections step down.

### Each bar chart (from Figma `BarLineChart`)

- Horizontal bars — supplier (offender) labels down the left, value scale along the bottom.
- Five bars, one per offender, **ranked descending** (worst at top).
- Bar fill: `secondary.main` (`#00a0dd`), fully rounded end cap.
- Bar track (the faint full-length background behind each bar): ice-blue `#edf4fc` at ~80% opacity.
- A value label is shown for each bar (Figma `DataLabel`).
- Value axis auto-scales to each chart's own data domain (`[0, max]`). The `0–100` scale in the Figma frame is placeholder data, not a fixed axis — the real metrics ($ / units / %) differ per chart.

---

## Colour mapping (Colour Rules — Tier decision)

| Design token (Figma) | Hex | Tier | Reference |
|---|---|---|---|
| `semantic/primary` (chart + section title) | `#0d436b` | 1 — palette | `primary.main` |
| `semantic/secondary` (bar fill) | `#00a0dd` | 1 — palette | `secondary.main` |
| Ice-blue bar track | `#edf4fc` | 1 — palette | `background.default` (theme `tokens.iceBlue`) |

All three already exist in `src/lib/theme.ts` — no new tokens. `recharts` needs string colour values, so the section/chart reads them from the theme via `useTheme()` (`theme.palette.secondary.main`, etc.) rather than hardcoding hex. `background.default` is `#edf4fc`; if using it as the track reads oddly at review, the fallback is a new `--color-ice-blue` CSS var — flagged as a minor open point, not a blocker.

---

## Data contract

### New endpoint — `GET /kpis/top-offenders`

Not in `API_SPEC.md` yet (SPM-104 follow-on flagged it as blocked on Backend A). This card ships against a **mock route handler** with the shape below, behind the same service/hook layer the real endpoint will later slot into.

**Response `200`:**

```jsonc
{
  "data": [
    {
      "metricId": "expedites",
      "metricName": "Expedites — ($ Value)",
      "unit": "USD",
      "offenders": [
        { "supplierId": "sup-...", "supplierName": "…", "value": 1200000 }
        // …5, ranked descending
      ]
    }
    // …5 charts
  ],
  "meta": {
    "requestId": "mock-req-top-offenders",
    "reportingPeriod": "2026-01",
    "region": "GLOBAL",
    "lastUpdated": "2026-02-02T06:00:00Z"
  }
}
```

Envelope is the standard `ApiListResponse<TopOffenderChart>` (`data` + `meta`), same as every other list endpoint. `meta.reportingPeriod` drives the "As of …" footer via `formatReportingPeriod`.

### New types (`src/types/index.ts`)

```ts
/** One supplier's bar within a Top Offenders chart. */
export interface TopOffenderBar {
  supplierId: string;
  supplierName: string;
  value: number;
}

/** One Top Offenders chart: a metric and its worst-N suppliers, ranked descending. */
export interface TopOffenderChart {
  metricId: string;
  metricName: string;
  unit: KpiUnit;
  offenders: TopOffenderBar[];
}
```

`value` is `number` only (unlike `SummaryKpiCard.value`, which is `number | string`) — bar charts need a plottable number; the pre-composed string values used by Delivery tiles do not apply here.

### Ranking rule (OQ-MAP-7 — officially open)

The business has not defined what makes a "Top Offender". We encode what the design implies and make it explicit in the mock: **per metric, the five suppliers with the highest values, ordered descending** (highest = worst offender, rendered at the top of each chart). Recorded here as an assumption to revisit when the business resolves OQ-MAP-7 and Backend A defines the endpoint. The mock owns the ranking; the component renders `offenders` in received order and does not re-sort.

### Mock route

`src/app/api/mock/api/v1/kpis/top-offenders/route.ts` — mirrors the summary mock's conventions exactly:

- Session-cookie guard → `401` when absent.
- `_state` dev escape hatch: `empty` → `data: []`, `error` → `500`, `slow` → 2s delay.
- Representative supplier names + plausible per-metric values (units matching the table above), each metric's `offenders` pre-sorted descending, five per chart.
- `meta.reportingPeriod = '2026-01'`, `lastUpdated = '2026-02-02T06:00:00Z'` (same constants the summary mock uses, for a consistent "As of January, 2026" footer).

### Service / hook

- `getTopOffenders(filters)` in `src/services/kpi.service.ts` → `dataApi.get<ApiListResponse<TopOffenderChart>>('/kpis/top-offenders' + filtersToQuery(filters))`. Mirrors `getSummaryKpis`. Added to the services barrel (already re-exported via `kpi.service`).
- `useTopOffenders(filters)` in `src/hooks/useTopOffenders.ts`, `queryKey: ['kpis', 'top-offenders', filters]`. Mirrors `useSummaryKpis`. Exported from `src/hooks/index.ts`.

---

## Components

### New — `OffenderBarChart` (UI, reusable)

`src/components/ui/OffenderBarChart.tsx` · `'use client'` (Recharts needs the client).

| Prop | Type | Notes |
|---|---|---|
| `title` | `string` | Chart title — Roboto 14px, `primary.main`. |
| `offenders` | `TopOffenderBar[]` | Rendered in received order (already ranked). |
| `unit` | `KpiUnit` | Formats axis ticks + bar value labels via `formatMetricValue`. |

- Recharts horizontal bar chart (`<BarChart layout="vertical">`, category `YAxis` = supplier names, numeric `XAxis` = value).
- `<Bar fill={secondary.main}>` with a rounded end cap and `background={{ fill: iceBlue }}` for the track; `<LabelList>` for per-bar value labels formatted by unit.
- Wrapped in `<ResponsiveContainer>` so it fills its cell.
- `OffenderBarChart.Skeleton` — same footprint (title bar + 5 shimmer bars) so loading doesn't reflow, per §14 and the "no component without its `.Skeleton`" rule.
- Added to the UI barrel `src/components/ui/index.ts`.

### New — `TopOffendersSection` (feature)

`src/components/summary/TopOffendersSection.tsx` · `'use client'`. Follows the exact structure of `QualityPerformanceSection` / `DeliveryPerformanceSection`:

- Consumes `useTopOffenders(filters)`.
- Reuses `SectionCard` chrome; the five charts live inside a single full-width `SectionCard.Cell span={6}`, arranged 3-up / 2-up with MUI `<Divider>`s (vertical between charts, horizontal between rows) per the design.
- Footer: `As of {formatReportingPeriod(meta.reportingPeriod)}`.
- Feature-scoped, non-reusable (no barrel), same as the sibling sections.

### Modified — `src/app/(dashboard)/page.tsx`

Compose `<TopOffendersSection />` below `<DeliveryPerformanceSection />` inside the existing `Box` stack.

---

## States (`UI_REQUIREMENTS_SPEC.md` §14)

| State | Rendering |
|---|---|
| Loading | `SectionCard` chrome + five `OffenderBarChart.Skeleton` in the 3-up / 2-up layout (no reflow on data arrival) |
| Empty | `data: []` + HTTP 200 → `SectionCard` renders title/footer; body replaced by `EmptyState` in a `span={6}` cell (never treated as an error) |
| Error | non-2xx / failed request → `SectionCard` title; body replaced by `ErrorState` with `onRetry` → `refetch()` |
| Success | Five charts, each with its five ranked bars |

Per-chart empty handling: if a single chart's `offenders` is empty while others have data, that chart renders its own inline empty message (per `UI_REQUIREMENTS_SPEC.md` §14.2, "Top Offenders … chart area replaced by empty state component"); the section-level empty state is only for `data: []`.

---

## Tests (committed in this PR)

| File | Covers |
|---|---|
| `src/test/api/mock/api/v1/kpis/top-offenders/route.test.ts` | New. `// @vitest-environment node`. 401 without session; `200` returns 5 charts each with 5 offenders ranked descending; `_state=empty` → `[]`; `_state=error` → 500; envelope/meta shape |
| `src/test/services/kpi.service.test.ts` | Extend — `getTopOffenders` requests the right path and returns the parsed envelope |
| `src/test/components/ui/OffenderBarChart.test.tsx` | New smoke test — renders title, all five bars in order, and the `.Skeleton` variant |
| `src/test/components/summary/TopOffendersSection.test.tsx` | New smoke test across all four §14 states with a mocked `useTopOffenders` |

---

## Files added / modified

| File | Change |
|---|---|
| `src/types/index.ts` | Modified — add `TopOffenderBar`, `TopOffenderChart` |
| `src/app/api/mock/api/v1/kpis/top-offenders/route.ts` | New — mock endpoint |
| `src/services/kpi.service.ts` | Modified — add `getTopOffenders` |
| `src/hooks/useTopOffenders.ts` | New |
| `src/hooks/index.ts` | Modified — export `useTopOffenders` |
| `src/components/ui/OffenderBarChart.tsx` | New — chart + `.Skeleton` |
| `src/components/ui/index.ts` | Modified — export `OffenderBarChart` |
| `src/components/summary/TopOffendersSection.tsx` | New |
| `src/app/(dashboard)/page.tsx` | Modified — compose the section |
| `specs/COMPONENT_INVENTORY.md` | Modified — add `OffenderBarChart`, `TopOffendersSection` |
| 4 test files | New/modified — see table above |

---

## Open points

- **OQ-MAP-7 (ranking rule)** — still owned by the business. Assumption encoded above (per-metric top 5 by value, descending); the mock owns it, so swapping in the real rule is a mock/endpoint change, not a component change.
- **`GET /kpis/top-offenders` contract** — invented here for the mock; reconcile with Backend A when they define it, then update `API_SPEC.md`.
- **VMI title** — Figma truncates to "% Non-Complian"; implemented as "% Non-Compliant" (confirmed with the requester).
- **Ice-blue track token** — using `background.default`; may promote to a dedicated `--color-ice-blue` var if preferred at review.

---

## Acceptance criteria

- [x] `GET /kpis/top-offenders` mock returns five ranked charts in a `{ data, meta }` envelope, with the `_state=empty|error|slow` escape hatch and session-cookie guard matching the summary mock
- [x] `getTopOffenders` service + `useTopOffenders` hook added, mirroring the summary data-access pattern
- [x] `OffenderBarChart` (Recharts) renders 5 horizontal bars ranked descending — `secondary.main` bars on an ice-blue track — with a matching `.Skeleton`
- [x] `TopOffendersSection` composes the five charts (3-up / 2-up) inside `SectionCard` with an "As of …" footer and all four §14 states
- [x] Section wired into the Summary page below Delivery Performance; no filter row rendered
- [x] Chart titles match the design exactly
- [x] Unit tests committed: route handler (`node` env), service, section + chart smoke tests
- [x] `COMPONENT_INVENTORY.md` updated
