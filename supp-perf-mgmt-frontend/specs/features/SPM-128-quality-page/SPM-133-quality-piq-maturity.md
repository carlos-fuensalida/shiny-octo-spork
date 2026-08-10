# SPM-133 — Quality: PIQ Maturity (NPI Projects)

**Branch:** `feature/SPM-133-quality-piq-maturity`
**Status:** Refined at pickup — ready to build
**Epic:** [Quality Page](./README.md) — read for shared context
**Figma:** section `804:26192`; table `804:26198`; DEEP DIVE button `804:56708`

---

## Scope

One full-width table: PIQ maturity by region, with a 12M sparkline and a
latest-month indicator. Introduced by a `SectionHeader` with a DEEP DIVE action.

Columns: *(unlabeled)* · `2025 FY` · `2026 Plan` · `2026 YTD` · `Rolling` ·
`12M Trend` · `May'26`. Rows: **Global / NAR / LAR**, flat.

## Pickup findings (corrects the original draft)

`get_metadata` + `get_design_context` on `804:26192` contradict the stub's central
premise. Three corrections, all of which shrink the ticket:

- **There are no expandable rows.** The stub called this "the heaviest table",
  built around the T2 `DataTable` expandable-row extension. Figma shows **three
  flat rows** and no toggle column. The `ExpandMoreFilled` instances
  (`804:26231`, `804:26247`, `804:26263`) sit *inside the May'26 cell paired with
  its value* — they are the month-over-month trend arrow, exactly the pattern T3
  already identified for PPM/CAL. `renderExpanded` is **not** used here.
  The epic README's note that T6 "genuinely expands; this table doesn't" was
  backwards; **neither** table expands. Corrected in the README in this PR.
- **It is a copy of the PPM table.** The Figma frame is still *named* `"Incoming
  Material PPM table"` (`804:26198`, `804:26200`). Same seven columns, same 56px
  rows, same `#f5f6f7` header fill, same `#d1d3d4` row rules, same 114×24
  sparkline, same bold first-column label over an `opacity-0` header. So this
  section is the **lightest** remaining on the page, not the heaviest — the T3
  table already renders it.
- **No `ContentCard`.** The table sits in a bare panel — `bg-white`, `1px
  #dee0e3`, `8px` radius — which is precisely what `DataTable`'s own
  `TableContainer` already draws. There is no card title, no divider, and **no
  "As of …" footer**, and no narrow companion card. This is the one section on
  the page that isn't a `ContentCard`; the epic's blanket "every section card is
  a `ContentCard`" is corrected to note the exception. It is also *not*
  `CardSurface` — that is 12px radius (`borderRadius={3}`), the frame is 8px.

Also present in Figma but absent from the stub: **status highlighting** on the
`2026 YTD` and `Rolling` cells, and the **DEEP DIVE** section action.

## Component strategy — generalize, don't duplicate

`PpmCalTrendTable` renders this table as-is. Per CLAUDE.md's anti-duplication
rule, it is **generalized rather than copied** (agreed at pickup):

- **Rename `PpmCalTrendTable` → `KpiTrendTable`**, still in
  `src/components/quality/`. The name no longer claims a scope it doesn't have,
  now that a third section renders through it. `TrendRow` and the `.Skeleton`
  variant move with it.
- **New `unit?: KpiUnit` prop** (default `'PPM'`, i.e. today's plain
  `toLocaleString('en-US')`). PIQ passes `'PERCENT'`, which appends `%` to the
  `2025 FY` / `2026 Plan` / `2026 YTD` / `Rolling` / latest-month values — Figma
  shows `88%`, `91% (R3)`, `90%`. Formatting lives in one place rather than
  being re-derived per caller.
- Update the three existing call sites (`QualityTrendSection`, and through it
  `PpmSection` / `CalSection`) plus their tests, and the
  `COMPONENT_INVENTORY.md` entry. Touching them **is** the work — see the rule.

**`QualityTrendSection` is not reused.** It hardcodes the two-`ContentCard` row
(wide table + Top Offenders list) that PIQ doesn't have. PIQ gets its own thin
`PiqMaturitySection` — `SectionHeader` + `KpiTrendTable` + the four §14 states.
No new *reusable* (`ui/`) component is introduced by this ticket.

## Data model changes (ship in this PR)

`PiqMaturityKpi` / `PiqMaturityRegionRow` lack the fields the table needs. Extend
both `DATA_MODEL_SPEC.md` and `src/types/index.ts`, mirroring exactly what T3 did
to `PpmKpiDetail` / `PpmBreakdownRow`:

- Add `monthly: number[]` to **both** — the 12M sparkline *and* the latest-month
  arrow read from it, and each region row carries its own trend independent of
  the aggregate. Last entry is the latest month.
- Add `ytd2026Status?: KpiStatus` and `rollingR3Status?: KpiStatus` to both —
  the RAG assessment for the two highlighted cells. Optional while the Backend A
  contract is open, same as `PpmKpiDetail`.

**Row mapping (agreed at pickup):** the **Global** row is `PiqMaturityKpi`'s own
top-level `fy2025/plan2026/ytd2026/rollingR3`; `byRegion` carries **only `NAR`
and `LAR`**. This mirrors PPM/CAL's aggregate-plus-breakdown shape and avoids the
top-level fields duplicating a `byRegion` `GLOBAL` entry.

## Row highlighting — reinforces the open contract question

Status travels as data (`ytd2026Status` / `rollingR3Status`), not derived in the
UI. PIQ makes the case harder than T3 did:

Here **green means ≥ plan** — Global `91` vs plan `90` → green, NAR `90` vs `89`
→ green, LAR `82` vs `85` → red. That is the **opposite direction** from PPM,
where lower is better. The shared `getPlanVarianceStatus` placeholder (green
`<= plan`) would paint **all three PIQ rows green**, which is wrong for LAR.

So: the placeholder stays as the documented fallback for payloads that omit the
fields, but the PIQ mock states every status explicitly, and the rendering never
depends on the placeholder. This is a second concrete data point for the epic's
open item — **RAG status and its per-KPI target direction must come from Backend
A.** Noted in the README's blockers.

**Latest-month indicator:** unchanged — `getMonthOverMonthTrend`, direction only.
Figma draws a red ▼ on all three rows even where the sparkline visibly rises;
that is one component instance reused three times (PPM does the same), not a
rule. The computed direction is correct behaviour and is what ships.

## Review fix — sparkline alignment (affects PPM/CAL too)

`Sparkline` rendered as a fixed-width **block** `div`. `DataTable` centres cell
content with `text-align: center` (from `Column.align`), which moves inline
content only — so the line ignored it and sat flush left, with all the slack on
the right. Invisible at laptop width, where the column is barely wider than the
114px line; obvious on a wide monitor or with the chatbot collapsed.

Fixed in `Sparkline` rather than in this ticket's column definition: the defect
is intrinsic to the component and silently breaks `Column.align` for any future
caller. Now `inline-block` (`inline-flex` for the short-data placeholder), both
`vertical-align: middle` so the inline box doesn't pick up a baseline descender
gap. **This also fixes the same latent mis-centring in the PPM and CAL tables.**

## Rolling-period semantics (OQ-MAP-3) — already resolved

`rollingR3` is provided by the mock/backend directly, as settled at T3. No
frontend date math. The stub's "confirm at pickup" item is closed.

## Data layer

- `getPiqMaturityDetail` already exists in `src/services/kpi.service.ts` (T1) —
  no service change, so no new service test.
- New hook `usePiqMaturity` in `src/hooks/`, added to the barrel — mirrors
  `usePpmDetail`.
- `DEEP_DIVE` extracted to `src/components/quality/deepDive.ts`. It was already
  copy-pasted into `QualityTrendSection` and `ExhibitsSection`; a third copy
  would have compounded it, so the three now share one const (anti-duplication
  rule).
- New mock route `src/app/api/mock/api/v1/kpis/kpi-piq-maturity/route.ts` —
  session-cookie guard → `401`, `_state=empty|error|slow`, standard
  `{ data, meta }` envelope with `meta.reportingPeriod`. Mock values match the
  frame: Global `88/90/91/91`, NAR `86/89/90/90`, LAR `84/85/82/81`, with
  explicit statuses (green/green/red).

## Page composition

`QualitySections.tsx` drops `piq-maturity` from `PLACEHOLDER_AFTER_POH` and
renders `<PiqMaturitySection filters={filters} />` in its place — between
Products on Hold and Exhibits, per the page map.

## States (§14)

- **Loading** — `SectionHeader.Skeleton` + `KpiTrendTable.Skeleton` (3 rows;
  headers rendered, no reflow).
- **Empty** — `data: null` with HTTP 200 → inline `EmptyState`, never an error.
- **Error** — `ErrorState` + retry.
- **Success** — the table.

## Responsiveness

Seven equal-flex columns in one full-width table. Chat-open narrows the column;
`DataTable`'s `TableContainer` scrolls horizontally rather than crushing cells.
Verified against the chat-open frame `772:22768`.

## Tests (same PR)

- Mock route test in `src/test/api/…` with `// @vitest-environment node`.
- **No standalone hook test.** The draft called for one "mirroring `usePpmDetail`",
  but that test doesn't exist — the repo has no hook tests at all
  (`usePpmDetail`, `useCalDetail`, `useExhibits`, `useProductsOnHold` are none of
  them covered directly). Every section test mocks `@/hooks` instead, and the
  hook itself is a three-line `useQuery` wrapper whose behaviour is pinned by the
  route test either side of it. Following the established convention rather than
  introducing a one-off; SPM-130's spec overstated this and is left as-is.
- `KpiTrendTable` — existing tests renamed/retargeted, **plus** a new percent
  case: `unit="PERCENT"` renders `91%` and `91% (R3)`. Existing PPM/CAL
  assertions must still pass unchanged (proves the rename is behaviour-neutral).
- `PiqMaturitySection` smoke test across all four §14 states, plus the DEEP DIVE
  action and the absence of card chrome (no `ContentCard` title/footer).
- Existing `QualitySections` test updated — `PIQ Maturity (NPI Projects)` is no
  longer a placeholder.

## Acceptance criteria

- [x] `PpmCalTrendTable` renamed to `KpiTrendTable` with a `unit` prop; PPM, CAL
      and PIQ all render through it; no duplicate table component added
- [x] PIQ table renders Global / NAR / LAR from mock data with sparkline,
      latest-month indicator, and green/red YTD + Rolling highlighting
- [x] Percent values render as `91%` / `91% (R3)`
- [x] Section renders as `SectionHeader` + bare table — no `ContentCard`, no
      "As of …" footer — matching the frame
- [x] `PiqMaturityKpi` / `PiqMaturityRegionRow` extended with `monthly` and the
      two status fields, in both `DATA_MODEL_SPEC.md` and `src/types/index.ts`
- [x] `usePiqMaturity` hook + `kpi-piq-maturity` mock route (route tested; see
      §Tests for why the hook has no standalone test)
- [x] Section composed into `QualitySections`, placeholder removed
- [x] All four §14 states; responsive (chat open/closed)
- [x] Validated against `get_design_context` on `804:26192` — all eight colours
      in the frame (`#0d436b`, `#dee0e3`, `#f5f6f7`, `#d1d3d4`, `#edf7ed`,
      `#2e7d32`, `#fdeded`, `#d32f2f`) already existed as named tokens from T3's
      correction pass, so no new tokens were needed and no hex reached a
      component. 8px panel radius and 56px rows come from `DataTable`'s own
      container and `size="medium"`.
- [x] Tests committed; `COMPONENT_INVENTORY.md` and the epic README updated
