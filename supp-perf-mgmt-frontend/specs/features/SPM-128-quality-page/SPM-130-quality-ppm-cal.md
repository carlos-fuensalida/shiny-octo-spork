# SPM-130 — Quality: Incoming Material PPM + CAL A/AA PPM

**Branch:** `feature/SPM-130-quality-ppm-cal`
**Status:** Refined at pickup — ready to build
**Epic:** [Quality Page](./README.md) — read for shared context
**Figma:** PPM `804:26153` (wide `804:26162` + narrow `804:26161`); CAL `804:26163` (wide `804:26172` + narrow `804:26171`)

---

## Scope

Two sections that share one layout: a **wide table card + a narrow "Top Offenders" list
card**. Build the pattern once, prove reuse across both sections in this PR.

## Pickup findings (corrects the original draft)

`get_design_context` on the wide/narrow nodes showed both assumptions in the original
draft were wrong:

- **Wide card is a table, not a chart.** Columns: `2025 FY · 2026 Plan · 2026 YTD ·
  Rolling (R3) · 12M Trend (sparkline) · latest month value w/ up/down arrow`. Rows are
  **flat, not expandable** — the screenshot shows an aggregate "Whirlpool" row and its
  breakdown rows (**by commodity** for PPM: Components / Raw Materials / Bulk; **by
  region** for CAL: NAR / LAR) all visible simultaneously, no collapsed state. The
  chevron-shaped icons (`ExpandLessFilled`/`ExpandMoreFilled`) next to each row's
  latest-month value are the **up/down trend arrow**, not `DataTable`'s expand toggle —
  confirmed by the screenshot showing every row's icon+value pair at once, never a
  hidden/collapsed row. Uses plain `DataTable` (no `renderExpanded`) + the standalone
  `Sparkline` cell (T2 convention, `specs/COMPONENT_INVENTORY.md` §DataTable) — not a
  new Recharts chart card, and not T6 PIQ Maturity's expandable-row pattern (that one
  genuinely expands; this table doesn't).
- **Narrow card is a "Top Offenders" ranked list**, not a generic stat card: colored
  dot + supplier name + metric value + region/status caption. Visually unrelated to the
  existing `OffenderBarChart` (horizontal bars) despite similar underlying data
  (worst-performing suppliers for a metric) — built as a new component sharing the
  existing `TopOffenderChart`/`TopOffenderBar` types rather than bending
  `OffenderBarChart` into a list layout or duplicating it.

## Data model changes (ship in this PR)

`PpmBreakdownRow` / `CalBreakdownRow` lacked the FY/Plan/YTD/Rolling fields the table
needs (`PiqMaturityRegionRow` already had this exact shape). `CalKpiDetail` had no
monthly trend at all. Extended both `DATA_MODEL_SPEC.md` and `src/types/index.ts`
(done at pickup, ahead of implementation):

- `PpmKpiDetail` / `CalKpiDetail`: add `fy2025`, `plan2026`, `ytd2026`, `rollingR3` —
  the aggregate ("Whirlpool") row's own table values — plus `monthly` (aggregate row's
  12M trend; last entry is the latest month). Add `offenders: TopOffenderBar[]` for the
  narrow card (scoped to that section's metric — not the Summary page's unrelated
  5-metric `/kpis/top-offenders` dataset).
- `PpmBreakdownRow` / `CalBreakdownRow`: add the same `fy2025/plan2026/ytd2026/
  rollingR3/monthly` fields — each breakdown row (Components, NAR, …) carries its own
  trend, independent of the aggregate row.
- Both levels also gain `ytd2026Status?` / `rollingR3Status?` (`KpiStatus`) — the RAG
  assessment for the two highlighted cells. Optional while the Backend A contract is
  open; see §Row highlighting for why this is data rather than a frontend rule.
- New `CalMonthlyRow { period, calCount }`, mirroring the existing `PpmMonthlyRow`.
- `byPlant`/`byCommodity`/`byRegion` all stay on the interface (committed at T1 for
  other future tickets); this ticket's table only consumes `byCommodity` (PPM) /
  `byRegion` (CAL).

## Row highlighting & trend indicator

**Cell RAG status travels as data** (`ytd2026Status` / `rollingR3Status`), not derived
in the UI. Two reasons:

- *It has to.* The design's colours aren't derivable from its numbers by any threshold
  rule: CAL's LAR row is **33% over** plan and shown green, while NAR is **74% under**
  plan and shown amber. No monotonic function of (value, plan) satisfies both. Carrying
  the status lets the page match the frame's numbers **and** its colours exactly, rather
  than fudging the displayed figures to force a colour.
- *It should.* RAG thresholds vary per KPI and reset yearly, and the same judgement
  feeds the chatbot, alerts, and exports. `KpiCard.status` is already backend-owned;
  deriving this table's status separately would let the Summary card and this table
  disagree about the same supplier. See the note in `DATA_MODEL_SPEC.md` —
  **confirm the two fields with Backend A.**

A **placeholder fallback** remains for payloads that omit the status —
`getPlanVarianceStatus` (3-tier vs. `plan2026`: green `<= plan`, amber `<= 130%`, red
above). It is documented as provisional and is the one place to swap when the real rule
lands. Both mocks state their statuses explicitly, so the rendering never depends on it.

**Latest-month indicator:** direction only — green ▲ if the latest `monthly` value rose
vs. the prior month, red ▼ if it fell (`getMonthOverMonthTrend`). Encodes direction, not
"good vs bad"; that depends on each KPI's target direction, which isn't defined yet.

## Components

- **New, feature-scoped** (`src/components/quality/`, not reusable elsewhere yet):
  - `PpmCalTrendTable` — composes `DataTable` + `Sparkline`; takes the aggregate row +
    breakdown rows + latest-month label as props so PPM and CAL both render through it.
    Chrome-free; the parent `ContentCard` supplies the card surface. `.Skeleton` variant.
  - `QualityTrendSection` — the shared section layout (header + two cards + all four
    §14 states), so `PpmSection`/`CalSection` stay thin data-mapping wrappers.
  - `PpmSection` / `CalSection` — one hook each (`usePpmDetail` / `useCalDetail`).
- **New, reusable** (`src/components/ui/`):
  - `ContentCard` — the Figma "Card Template" chrome (title → divider → content →
    divider → footer, 12px radius/padding, `background.paper`). Both the wide and the
    narrow card are one of these, and later Quality tickets reuse it.
  - `OffenderList` — ranked list (rank dot, name, value, caption), chrome-free like
    `OffenderBarChart`. Takes `TopOffenderBar[]`. `.Skeleton` variant.
- **Extended:** `DataTable` gains `Column.cellSx` (per-row styling on the cell element,
  so a status fill covers the whole cell) and a `size` prop (`'medium'` for Figma's
  56px rows). `Sparkline`, `SectionHeader`, `EmptyState`, `ErrorState` reused as-is.
- Add all new exports to `src/components/ui/index.ts` and update
  `specs/COMPONENT_INVENTORY.md`.

## Design-review corrections (post-first-pass)

A review against the Figma frames caught four classes of drift, all fixed:

1. **Missing card chrome.** The section rendered as a bare table on the page
   background; Figma wraps each of the two cards in the "Card Template" panel. Fixed by
   extracting `ContentCard` and using it for both cards (rather than duplicating the
   chrome in each), and moving the "As of …" footer from the section into each card.
2. **Missing section action.** Figma `804:26159` is a filled navy **DEEP DIVE** button
   in the section header. Now rendered as a disabled stub (`ViewHeader` convention).
3. **Wrong colour + typography tokens.** The highlight tints were guessed from existing
   status vars; Figma uses the alert surface pairing. Added `error.light` (`#fdeded`)
   and `success.light` (`#edf7ed`) to the palette alongside the existing
   `warning.light` (`#fff4e5`), plus the design system's missing neutrals
   `--color-gray` (`#d1d3d4`, row rules) and `--color-gray-lightest` (`#f5f6f7`, header
   fill). Table typography moved to the real `table/header` + body tokens (Roboto 14px),
   replacing SPM-91's Open Sans 12px placeholder — the same correction story as
   `MetricColumn` in SPM-114. `OffenderList`'s rank dots now use the design's actual
   ramp (`--color-red-dark` → `--color-orange` → `secondary.main`).
4. **Highlights not rendering as designed.** Two separate bugs: the tint was painted on
   an inner box (leaving it inset within the cell padding) — fixed with
   `Column.cellSx`; and the highlighted **values** stayed charcoal because the theme's
   descendant selector `& .MuiTableCell-body` (0,2,0) outranked the cell's `sx` (0,1,0)
   — fixed by moving those overrides onto `MuiTableCell`'s own `head`/`body` slots. A
   regression test pins both value colours. The trend icon was also shrunk to 20px; it
   is back to MUI's default 24px, matching Figma's 24px icon frame.

**Known deviation:** Figma draws pure-black rules between offender rows; we use the
standard `Divider` (`#dee0e3`). Black isn't in the design system's named neutral ramp,
so it reads as an unstyled Figma default rather than an intentional token.

## Data layer

- `getPpmDetail` / `getCalDetail` already exist in `src/services/kpi.service.ts`
  (T1) — no service changes needed.
- New hooks `usePpmDetail`, `useCalDetail` in `src/hooks/`, added to the barrel —
  mirror `useQualityKpis`.
- New mock routes `src/app/api/mock/api/v1/kpis/kpi-ppm/route.ts` and
  `.../kpi-cal/route.ts` — session-cookie guard, `_state=empty|error|slow`, standard
  `{ data, meta }` envelope, matching `quality/route.ts` conventions.

## Rolling-period semantics (OQ-MAP-3) — resolved for this ticket

`rollingR3` is a value the mock/backend provides directly (same as
`PiqMaturityRegionRow`), not derived on the frontend. No FE date-math needed here.

## States (§14)

Loading (table skeleton rows + offender-list skeleton, no reflow) / empty (`data: []`
→ inline `EmptyState`) / error (`ErrorState` + retry) / success. Both sections composed
in `QualitySections.tsx` in place of their `SectionPlaceholder` entries.

## Tests (same PR)

- `usePpmDetail`/`useCalDetail` hook tests (mirror `useQualityKpis`/`useTopOffenders`
  test style).
- Mock route tests (`src/test/api/...`, `// @vitest-environment node`).
- `PpmCalTrendTable` + `.Skeleton` smoke test (rows, sparkline, `(R3)` suffix) plus two
  design-regression tests: the highlight lands on the `<td>` (not an inner box), and the
  highlighted values carry their status colour (guards the theme-specificity trap).
- `ContentCard` + `.Skeleton` and `OffenderList` + `.Skeleton` smoke tests.
- `DataTable` `cellSx` test (style applies to the cell element, per row).
- `PpmSection`/`CalSection` smoke tests across all four §14 states (mirror
  `TopOffendersSection.test.tsx`), plus the per-card footers and the DEEP DIVE action.

## Acceptance criteria

- [x] `PpmCalTrendTable` renders aggregate + breakdown rows from mock data, sparkline +
      latest-month indicator, colours from theme, with `.Skeleton`
- [x] `OffenderList` renders ranked suppliers from mock data, with `.Skeleton`
- [x] Both cards wrapped in `ContentCard`, each with its own "As of …" footer
- [x] Section header renders with its DEEP DIVE action
- [x] Both PPM and CAL sections composed with `SectionHeader` + table + offender list
- [x] All four §14 states; responsive (chat open/closed)
- [x] Cell RAG status carried as data so the page matches the frame's numbers *and*
      colours; documented placeholder helper retained as the fallback
- [x] Trend indicator direction behind the same documented placeholder helper
- [x] Colours and typography traced to real Figma tokens; new tokens added to
      `theme.ts`, `globals.css`, and `UI_REQUIREMENTS_SPEC.md` §1.1
- [x] Tests committed; `COMPONENT_INVENTORY.md` updated
