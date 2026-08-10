# SPM-132 — Quality: Products on Hold + Quality Exhibits

**Branch:** `feature/SPM-132-quality-cards-poh-exhibits`
**Status:** Implemented
**Epic:** [Quality Page](./README.md) — read for shared context
**Figma:** Products on Hold `804:26181` (cards `804:26188`–`804:26191`); Exhibits `804:26265` (cards `804:26272`–`804:26274`)

---

## Scope

The page's two card-row sections — Products on Hold (4 cards) and Quality Exhibits
(3 cards). One PR: they share a card surface and a row-of-cards layout, and both are
thin once their chart is built.

**Built after T4 (GSIR / SPM-131) was deliberately skipped** — its design is being
reworked. T5 depends only on T1 + T2, so nothing is blocked; `/quality` keeps rendering
GSIR's `SectionPlaceholder` until SPM-131 lands.

## Pickup findings (corrects the original draft)

`get_design_context` on both sections showed the draft's central assumption — "two small
**stat**-card grids, same pattern → maybe one parameterized stat card" — is wrong. Neither
section has a stat card in it. They are **two different chart types**, and they share no
content component at all.

**Products on Hold (`804:26181`) — 4 grouped bar charts.** Each card is one segment scope
over 5 months (`Jan'26`–`May'26`) with three series:

| Series | Colour (Figma) | Maps to |
|---|---|---|
| 2025 Carry Over | `brand/accent-yellow-mid` `#f3d04f` | `carryOver2025` |
| Full Month | `semantic/primary` `#0d436b` | `byMonth[].fullMonth` |
| EOM | `semantic/secondary` `#00a0dd` | `byMonth[].eom` |

Card scopes, left → right: `Global (FPS & Components)` · `NAR (FPS & Components)` ·
`LAR (FPS & Components)` · `FPS`. The **carry-over bar renders only in the first month
group** — in `Feb'26`–`May'26` that `BarBlock` is present but empty (no `BarStrip`),
which is consistent with `carryOver2025` being a single scalar rather than a monthly
series. Y axis `0 / 50 / 100`, dotted gridlines, legend centered under the plot.

This section's header has **no action button** (`804:26182` contains only divider–title–divider).

**Quality Exhibits (`804:26265`) — 3 donut charts.** Each card: a full-bleed
`secondary.main` header band with the region in white 16px regular, then a donut with the
total in its center and a 5-status legend to its right.

| Card | Total | Completed | On going | Delayed | Disposition | Not started |
|---|---|---|---|---|---|---|
| GLOBAL | 54 | 11 | 18 | 8 | 3 | 14 |
| NAR | 36 | 8 | 9 | 7 | 0 | 12 |
| LAR | 18 | 3 | 9 | 1 | 3 | 2 |

**The center total is exactly the sum of the five segments in all three cards**, so it is
**derived in the UI**, not carried as a field — that makes it impossible for the label and
the arcs to disagree. (Contrast SPM-130's `ytd2026Status`, which *is* carried as data:
that's a business judgement Backend A owns, whereas this is arithmetic.)

Status colours all already exist in the palette — no new tokens needed here:
`success.main` · `secondary.main` · `error.main` · `warning.main` · `divider` (Not started).

This section's header **does** have the `DEEP DIVE ›` action (`804:56849`), same as PPM/CAL.

## Data model changes (ship in this PR)

Backend A is built by the same team **after** this frontend, so where the frame and the
spec disagree the frame wins and the contract is updated to match (confirmed at pickup).

**Products on Hold — shape already correct, cardinality wrong.** `ProductsOnHoldKpi`
(`carryOver2025`, `segmentScope: 'GLOBAL' | 'NAR' | 'LAR' | 'FPS_ONLY'`,
`byMonth: { period, fullMonth, eom }[]`) maps to the chart field-for-field — T1 got this
right. The only change is that the section needs **four** of them (one per scope), so
`getProductsOnHoldDetail` returns `ApiListResponse<ProductsOnHoldKpi>` rather than
`ApiResponse<ProductsOnHoldKpi>`.

**Exhibits — `OpenActionsKpi` does not fit.** `VIEW_DATA_MAP_SPEC.md` §"Exhibits & 8D /
CAPA" claims the two use an identical `Total Open 2026 / Open >90 Days / Open >45 Days`
shape. That shape is the **8Ds table** (`804:26275`, T7) and stays valid there; the
Exhibits *section* is a status breakdown and shares nothing with it. New interface:

```ts
interface QualityExhibitsKpi extends KpiCard {
  completed: number;
  ongoing: number;
  delayed: number;
  disposition: number;
  notStarted: number;
}
```

Named fields rather than a `segments[]` array — matches every sibling extended interface
(`OpenActionsKpi`, `RiskRatingComponentsKpi`, `FocusSupplierKpi`) and lines up 1:1 with the
donut's fixed 5-colour map, which has to be exhaustive either way. **No `scope` field**:
`KpiCard.region` is already `'GLOBAL' | 'LAR' | 'NAR'`, exactly the card scopes, so the
header band reads `region`. `getExhibitsDetail` returns `ApiListResponse<QualityExhibitsKpi>`
(three, one per region).

**Card titles stay out of the payload.** `Global (FPS & Components)` etc. are derived from
`segmentScope` via a label map in the component, following the precedent set in
`QualitySections.tsx` — section titles and order are a layout concern, not API data.

## OQ-MAP-5 — resolved

*"Is the Products-on-Hold monthly column pivot produced by the backend or assembled on the
frontend?"* → **Backend.** `byMonth` arrives as month rows and the chart renders them
directly; no frontend pivot or date math. Same resolution shape as T3's OQ-MAP-3.

## New token

`--color-yellow-mid` / `tokens.accentYellowMid` = `#f3d04f` (Figma `brand/accent-yellow-mid`),
the carry-over series colour. Not in the ramp today, and the nearest existing value
(`--color-amber` `#eeb111`) is a visibly different yellow, so it's a real addition rather
than a reuse. Added to `theme.ts`, `globals.css`, and `UI_REQUIREMENTS_SPEC.md` §1.1 Tier 2
— the T3 precedent for tokens discovered mid-section.

## Components

**New, reusable (`src/components/ui/`):**

- **`CardSurface`** — the bare panel every Quality card sits on: `background.paper`,
  1px `divider` border, `borderRadius={3}` (12px). Nothing else — no title, no padding
  opinion. Extracted because this PR adds the third and fourth card shells on the page and
  the three headers genuinely diverge (`ContentCard`'s h2-over-a-divider, POH's plain 14px
  title, Exhibits' full-bleed colour band). Folding those into `ContentCard` variants would
  be prop soup over three layouts that share no internals; extracting the one thing they
  *do* share removes the duplication the anti-duplication rule targets.
  **`ContentCard` is refactored to compose it** — its rendered output is unchanged, so the
  shipped PPM/CAL section is unaffected (its tests pin this).
- **`DonutChart`** — generic Recharts donut: `segments: { label, value, color }[]`, total in
  the center, legend list beside it. Chrome-free; the card supplies the surface. `.Skeleton`.
  Generic because the segment set is a prop, not baked in — the Exhibits status→colour map
  lives in the caller.

**New, feature-scoped (`src/components/quality/`):**

- **`ProductsOnHoldChart`** — the grouped bar chart. Deliberately *not* generic: the three
  series are fixed and named, and the carry-over-only-in-the-first-group rule is
  POH-specific. A generic `GroupedBarChart` here would be a wrapper over Recharts with a
  quirk bolted on. `.Skeleton`.
- **`ProductsOnHoldCard`** / **`ExhibitsCard`** — `CardSurface` + the section's header
  treatment + its chart. `.Skeleton` each.
- **`ProductsOnHoldSection`** / **`ExhibitsSection`** — `SectionHeader` + responsive card
  row + all four §14 states. Unlike T3's `QualityTrendSection`, these two are **not** merged
  into a shared section component: they share only "a row of cards", and their headers,
  card contents, column counts, and actions all differ. Extracting a shared shell would
  abstract over a coincidence.

**Reused as-is:** `SectionHeader` (with and without action), `EmptyState`, `ErrorState`.

Barrel (`src/components/ui/index.ts`) + `specs/COMPONENT_INVENTORY.md` updated in this PR.

## Data layer

- `getProductsOnHoldDetail` / `getExhibitsDetail` exist (T1) — retyped to list responses.
- New hooks `useProductsOnHold`, `useExhibits` in `src/hooks/`, added to the barrel,
  mirroring `usePpmDetail`.
- New mock routes `src/app/api/mock/api/v1/kpis/kpi-products-on-hold/route.ts` and
  `.../kpi-exhibits/route.ts` — session-cookie guard → `401`, `_state=empty|error|slow`,
  `{ data, meta }` envelope with `meta.reportingPeriod`. Figures copied from the frames
  (the Exhibits table above; POH bar heights read off `804:26188`–`804:26191`).
  `_state=empty` returns `data: []` (list semantics), not `data: null` as in PPM/CAL.

## Layout & responsiveness

Both rows use the container-query technique from `QualityTrendSection`/`TopOffendersSection`
— it's the chatbot panel toggling that changes the column width, not the viewport:

- Products on Hold: 4 → 2 → 1 columns (thresholds 1000px / 560px).
- Exhibits: 3 → 1 columns (threshold 800px).

**Thresholds are derived from the real content width**, not guessed. The main column is the
viewport less the chat panel (360px, 440px at xl) and the page padding (12px a side, 32px
at xl ≥1536):

| Viewport | Content width | POH | Exhibits |
|---|---|---|---|
| 1920 (xl) | 1920 − 440 − 64 = **1416** | 4 across | 3 across |
| 1440 | 1440 − 360 − 24 = **1056** | 4 across | 3 across |
| 1280 | 1280 − 360 − 24 = **896** | 2 × 2 | 3 across |

## Post-review corrections (from the first real render)

Four issues that no automated gate could catch — the same class of drift T3 hit:

1. **Products on Hold wrapped to 2 × 2 on a laptop.** The first pass used a 1100px
   four-column threshold, which a 1920px monitor clears (1416px) but a 1440px laptop does
   not (1056px). Lowered to 1000px and documented against the table above, so the next
   change to this row reasons from real widths instead of round numbers.
2. **Bars were ~4× too wide.** Recharts spreads bars to fill their category unless capped,
   so they rendered ~36px against the frame's ~9.5px — and got worse the wider the card.
   Measured off `804:26188`: the 334px card leaves a ~251px plot ÷ 5 month groups = ~50px,
   less 9px padding a side = ~32px for 3 bars and their 2px gaps. Fixed with
   `maxBarSize={10}`; a regression test asserts every rendered bar stays within it.
   The y-axis also got an explicit 32px width (Figma's gutter is ~29px), replacing a
   negative left margin used to claw back Recharts' 60px default.
3. **Clicking an Exhibits donut painted a black box.** Recharts marks each sector
   focusable (`tabindex="-1"`), so a click drew the browser's default focus ring. The donut
   carries no interaction, so suppressing the outline removes no keyboard affordance.
4. **Exhibits card contents sat left-aligned.** `DonutChart`'s root was a shrink-to-fit
   flex row, so `justifyContent: center` had nothing to centre within. Fixed with
   `width="100%"` on the chart (and its `.Skeleton`, so the loading state doesn't shift)
   plus `justifyContent="center"` on the card's content box.

## States (§14)

Per section: loading (`SectionHeader.Skeleton` + a full row of card skeletons, so the row's
footprint doesn't shift) / empty (`data: []` + 200 → inline `EmptyState`) / error
(`ErrorState` + retry) / success. Both replace their `SectionPlaceholder` entries in
`QualitySections.tsx`.

## Spec updates shipping with this PR

| File | Change |
|---|---|
| `DATA_MODEL_SPEC.md` | Add `QualityExhibitsKpi`; note Exhibits no longer shares `OpenActionsKpi` (8Ds still does) |
| `VIEW_DATA_MAP_SPEC.md` | Correct the "Exhibits and 8Ds use identical shape" claim + the Exhibits row; mark the three `ProductsOnHold` **GAP**s resolved |
| `UI_REQUIREMENTS_SPEC.md` | New `--color-yellow-mid` token (§1.1 Tier 2); correct §5.8's Exhibits row (it lists the 8Ds columns) |
| `API_SPEC.md` | Document `GET /kpis/{kpiId}`'s per-`kpiId` extended response variants — adding `kpi-products-on-hold` / `kpi-exhibits` **and back-filling `kpi-ppm` / `kpi-cal`**, which T1/T3 shipped undocumented. Backend A is built from this file, so leaving it describing one generic detail shape would contradict the mocks |
| `README.md` (epic) | Page map rows (charts, not "small cards"), component-inventory delta, OQ-MAP-5 resolved, T4-skipped note |
| `COMPONENT_INVENTORY.md` | `CardSurface`, `DonutChart`, the four feature components; `ContentCard` entry notes it composes `CardSurface` |

## Tests (same PR)

Note on the hook layer: the repo has **no hook-test convention** — `usePpmDetail` and the
rest have none. Coverage sits either side of them, in `kpi.service.test.ts` and in section
tests that mock `@/hooks`. This ticket follows that rather than inventing a third pattern.

- `getProductsOnHoldDetail` / `getExhibitsDetail` service tests, including that both now
  return **list** envelopes.
- Mock route tests, `src/test/api/...`, `// @vitest-environment node` — 200 shape, `401`
  without the session cookie, `_state=empty|error`.
- `CardSurface` smoke test **plus a `ContentCard` regression test** proving the refactor
  left its rendered structure (title, dividers, footer) intact.
- `DonutChart` + `.Skeleton`: renders one arc per segment, centers the derived total,
  legend labels/values. Plus an empty-segments case.
- `ProductsOnHoldChart` + `.Skeleton`: 3 series, month labels, and a regression test that
  the carry-over value appears **only** in the first month group.
- Section tests across all four §14 states (mirror `PpmSection`/`CalSection`), including
  "Products on Hold renders no action button" and "Exhibits renders DEEP DIVE". These
  cover the cards and their `.Skeleton`s through the sections that own them — the scope
  label map, the region bands, and the per-card totals — rather than duplicating the same
  assertions at the card level.

**Note on the per-card region label.** `ExhibitsCard` renders as
`<section aria-label="{REGION} exhibits">`. Asserting the LAR card's total (18) page-wide
would have passed for the wrong reason — 18 is also GLOBAL's "On going" count — so the
test scopes to the card. The label is real accessibility value for a three-card row, not
test-only markup.

## Acceptance criteria

- [x] Products on Hold renders 4 grouped-bar cards from mock data, carry-over in the first
      month group only, legend + axes from theme colours, with `.Skeleton`
- [x] Exhibits renders 3 donut cards from mock data, region band, derived center total,
      5-status legend, with `.Skeleton`
- [x] `CardSurface` extracted and composed by `ContentCard` (output unchanged) and both new cards
- [x] Section headers correct: no action on Products on Hold, `DEEP DIVE` on Exhibits
- [x] All four §14 states per section; responsive card rows (chat open/closed)
- [x] `QualityExhibitsKpi` added; both detail services return list responses
- [x] OQ-MAP-5 resolved and recorded; `--color-yellow-mid` traced to the Figma token
- [x] Tests committed; the six spec files above updated
