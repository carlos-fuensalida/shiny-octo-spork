# SPM-128 — Quality Page (`/quality`) — Epic Overview

**Status:** Living — planning agreed, not yet started
**Route:** `/quality`
**Design status (per `VIEW_DATA_MAP_SPEC.md`):** Work in progress

This is the shared context for the whole Quality page. It is split into **8 build
tickets** (T1–T8). Every ticket file in this folder is intentionally **thin** and
links back here for anything cross-cutting — so a fresh session can pick up any one
ticket without re-deriving the page.

---

## Jira IDs

| ID | Item |
|---|---|
| SPM-128 | Epic — Quality page (this folder) |
| SPM-124 | Docs — establish epic spec + folder convention (this ticket) |
| SPM-125 | T1 — scaffold, view header, data layer |
| SPM-129 | T2 — shared components (SectionHeader + DataTable expansion) |
| SPM-130 | T3 — PPM + CAL sections |
| SPM-131 | T4 — GSIR section |
| SPM-132 | T5 — Products on Hold + Exhibits |
| SPM-133 | T6 — PIQ Maturity table |
| SPM-134 | T7 — Risk Rating + 8Ds tables |
| SPM-135 | T8 — Cost Recovery + Focus Supplier |

---

## How to use this epic (the discipline)

1. **This README is living.** Edit it as we learn. It captures *architecture and the
   split*, not section behavior.
2. **Stubs are refined at pickup time, not now.** When you start a ticket you still run
   the normal loop — discuss, pull the section's Figma frame, flesh out its states and
   business rules, agree — then build. The stub gives you a head start, not a frozen spec.
3. **Spec changes ship with the code that changes them.** If a requirement turns out
   wrong or shifts, edit the affected ticket file (and this README if it's cross-cutting)
   in the same PR. Never let spec and reality drift.

---

## Design source

- **File key:** `XDBgP7IlEw9d9xvIEinGxM`
- **Chat closed frame:** `804:26132` (primary — full content width)
- **Chat open frame:** `772:22768` (same content, narrower column — responsiveness reference)
- Pulled via Figma MCP `get_metadata`. Per-section node IDs are in each ticket file.

The two frames are the same page, so **responsiveness is a per-section acceptance
criterion, not a separate ticket.** They are not always the same layout at a different
width, though — T8 found the chat-open frame redraws the Cost Recovery / Focus Supplier
card entirely. Check both nodes per section.

---

## Page map (top → bottom)

The hidden "Quality Highlight Cards" row at the top (Figma `804:26148`, `hidden`) is
**out of scope** — dropped by decision.

| Section (Figma name) | Figma node | Content | Ticket |
|---|---|---|---|
| View header | `804:26139` | "Quality" title + "Steel Forgings · All regions" subtitle + 2 action buttons | T1 |
| Incoming Material PPM | `804:26153` | wide card (chart) + narrow stat card | T3 |
| CAL A/AA – PPM | `804:26163` | wide card (chart) + narrow stat card | T3 |
| GSIR | `804:26173` | card with side menu | T4 |
| Products on Hold | `804:26181` | 4 grouped-bar-chart cards (one per segment scope). **No section action button** | T5 |
| PIQ Maturity (NPI Projects) | `804:26192` | table w/ 12M-trend sparkline, 3 flat rows (Global/NAR/LAR). **No card chrome, no "As of …" footer** | T6 |
| Quality Exhibits | `804:26265` | 3 donut cards (one per region) | T5 |
| Risk Rating | `1365:13014` | two side-by-side tables (Components + FPS) w/ footers | T7 |
| 8Ds | `804:26275` | one table (Total Open / >90d / >45d) | T7 |
| Cost Recovery + Focus Supplier | `1377:14559` | two half-width sections, 3 highlight cards each | T8 |

---

## Data strategy — MOCK (decided)

Follow the Summary precedent (SPM-104 / 114 / 126): build against **mock route handlers**
behind the real service/hook layer, then swap to Backend A later. We own the mock shapes.

- Entry endpoint: `GET /kpis/quality` → `ApiListResponse<KpiCard>` (per spec). But this page
  needs far richer data than a flat `KpiCard[]` — charts and multi-column tables. The
  **extended KPI interfaces** (`PiqMaturityKpi`, `RiskRatingComponentsKpi`, `RiskRatingFpsKpi`,
  `FocusSupplierKpi`, `OpenActionsKpi`, `ProductsOnHoldKpi`, `GsirKpiDetail`, `PpmKpiDetail`,
  `CalKpiDetail`) are now **committed** in `DATA_MODEL_SPEC.md` and `src/types/index.ts`, with
  matching detail service functions in `src/services/kpi.service.ts` — so every downstream
  ticket builds on real types. (T1 verified this; the interfaces were already in place.)
- Mock route conventions mirror the summary mocks exactly: session-cookie guard → `401`;
  `_state=empty|error|slow` dev escape hatch; standard `{ data, meta }` envelope with
  `meta.reportingPeriod` driving any "As of …" footer.

---

## Shared architecture decisions

- **`SectionHeader` (new, reusable).** Every section is introduced by the same pattern:
  `divider — centered title — divider — right-aligned action button`. This is **not** the
  existing `SectionCard` (the Summary divider-grid card). Introduced by **T2**, used by all.
- **Four states everywhere** (`UI_REQUIREMENTS_SPEC.md` §14). Each section renders
  loading (skeleton, shape preserved) / empty (`data: []` + 200, never an error) /
  error (non-2xx) / success. No section is done without its `.Skeleton`.
- **Responsiveness** (chat open vs closed): card rows drop columns; side-by-side tables
  stack. A per-section AC. **Corrected at T8:** the two half-width sections do *not*
  stack — the chat-open frame (`1423:14642`) keeps both sections and their card rows on
  one line and absorbs the narrowing *inside* each card, which flips from a horizontal
  to a stacked layout. Pull the section's chat-open node and diff it against the
  chat-closed one before assuming a section stacks; "narrower" and "different layout"
  are not the same thing here.
- **Colour Rules** (CLAUDE.md): palette paths → CSS vars → tokens. No hex in components.
  Charts read colours from the theme via `useTheme()` (Recharts needs strings), same as
  `OffenderBarChart`.
- **Almost every section card is a `ContentCard`** (T3). Figma's "Card Template" — title →
  divider → content → divider → "As of …" footer, 12px radius, white surface. The
  footer belongs to the *card*, not the section. Don't redraw this chrome per section;
  content components (tables, lists, charts) stay chrome-free and the card supplies it.
  **Exception: PIQ Maturity** (T6) has no card at all — the table sits directly in
  `DataTable`'s own 8px-radius bordered container, with no title and no footer. Confirm
  a section's chrome against its frame rather than assuming the card.
- **No table on this page expands.** T3 established that PPM/CAL's `ExpandMoreFilled`
  icons are the month-over-month trend arrow, not a toggle; T6 pickup found the same
  for PIQ Maturity, which this README previously described as the one that "genuinely
  expands." `DataTable`'s `renderExpanded` (T2) currently has no caller on the Quality
  page. Check the frame before assuming expansion in T7/T8.
- **Status highlighting pairs `X.light` (fill) with `X.main` (rule + text)** — the
  design system's alert pairing, now in the palette for all three statuses. Apply it via
  `DataTable`'s `Column.cellSx` so the fill covers the whole cell.
- **Table styling goes on the theme's `MuiTableCell` slots**, never as descendant
  selectors under `MuiTableHead`/`MuiTableBody` — a descendant selector outranks any
  per-cell `sx` and silently kills status colours (cost us a bug in T3).
- **Verify against `get_design_context` before calling a section done.** T3's first pass
  passed every gate while missing the card chrome, the section action button, and four
  token/typography mismatches — none of which lint, types, or tests can catch.

---

## Component inventory deltas

Reuse as-is: `DataTable`, `EmptyState`, `ErrorState`, `StatusChip`, `KpiCard`.

| Component | New / change | Introduced by |
|---|---|---|
| `SectionHeader` | New — divider/title/action pattern | T2 |
| `DataTable` expandable rows + sparkline cell | Extend existing | T2 |
| `ContentCard` | New — the shared "Card Template" chrome (title/divider/content/divider/footer, 12px radius). **Every section card on this page is one**; reuse it in T4–T8 rather than redrawing card chrome | T3 |
| `PpmCalTrendTable` (PPM/CAL wide card) | New — `DataTable` + `Sparkline` composition, **not** a chart (see T3 pickup findings) | T3 |
| → renamed `KpiTrendTable` + `unit` prop | Generalized — PIQ Maturity renders the identical table, so it's shared rather than copied. `unit="PERCENT"` appends `%` | T6 |
| `OffenderList` (PPM/CAL narrow card) | New — ranked supplier list, shares `TopOffenderChart`/`TopOffenderBar` types but not `OffenderBarChart`'s bar layout | T3 |
| `DataTable` `Column.cellSx` + `size` | Extend existing — per-cell styling (status fills that cover the whole cell) and `'medium'` 56px rows | T3 |
| GSIR card (wide/side-menu content) | New — chart assumption still unconfirmed for this section, confirm via `get_design_context` at T4 pickup | T4 |
| `CardSurface` | New — the bare panel (paper / 1px `divider` border / 12px radius) shared by **every** card on this page. `ContentCard` refactored to compose it; the three card headers diverge too much to merge further | T5 |
| `DonutChart` | New, generic — Recharts donut with a derived center total and a legend list. Segments are a prop, so the Exhibits status→colour map lives in the caller | T5 |
| `ProductsOnHoldChart` | New, feature-scoped — grouped bars with three fixed named series. Deliberately not generic (see T5) | T5 |
| `HighlightCard` | **Rewritten** (not extended, not duplicated) — the old title-plus-`Chip` card had no callers and its only planned consumer was dropped, so the name was reclaimed for the `label │ rule │ value` card Figma draws under it. Flips row↔column on its own container width | T8 |
| `MetricCardsSection` | New, feature-scoped — `SectionHeader` + a row of `HighlightCard`s and the four §14 states, shared by Cost Recovery and Focus Supplier the way `QualityTrendSection` is shared by PPM and CAL | T8 |

Update `specs/COMPONENT_INVENTORY.md` in the same PR as each component (existing rule).

---

## Ticket index & build order

| Ticket | Scope | Depends on |
|---|---|---|
| **T1 – Scaffold** | `/quality` route, view header, section stack + spacing, `getQualityKpis()` + `useQualityKpis()` against mocked `GET /kpis/quality`, page-level states (extended interfaces already committed to `DATA_MODEL_SPEC.md`) | — |
| **T2 – Shared components** | `SectionHeader` + `DataTable` expandable-row/sparkline extension, tests | — |
| **T3 – PPM + CAL** | Chart card + narrow stat card, used by both sections | T1, T2 |
| **T4 – GSIR** | Card-with-side-menu section | T1, T2 |
| **T5 – Products on Hold + Exhibits** | Two small-card grids | T1, T2 |
| **T6 – PIQ Maturity** | Flat sparkline table — reuses T3's table via `KpiTrendTable` | T1, T2, T3 |
| **T7 – Risk Rating + 8Ds** | Three plain `DataTable`s + footers | T1, T2 |
| **T8 – Cost Recovery + Focus Supplier** | Highlight-card variant, two half-width sections | T1, T2 |

**Progress:** T1, T2, T3, T5, T6 and T8 shipped. **T4 (GSIR / SPM-131) was skipped** while
its design is reworked — it's a sibling section, not a dependency, so `/quality` simply
keeps rendering its `SectionPlaceholder` between CAL and Products on Hold until it lands.
**T7 (Risk Rating + 8Ds / SPM-134) is the only build ticket left**; its two placeholders
now sit directly above the Cost Recovery / Focus Supplier row.

**Order:** T1 + T2 first (parallel — they unblock everything). Then T3–T8 parallelizable,
except **T6 now depends on T3** — it renders T3's table, so it can't land first. The
unknowns this ordering was meant to surface early are resolved: T3 found the wide cards
are tables, not charts, and T6 found no table on the page expands.

**PR sequence for the whole epic:** `SPM-124` docs PR (this scaffold + CLAUDE.md line) →
T1 → T2 → T3–T8. Nine PRs total.

---

## Blockers / open questions

- **Data-contract mismatch (biggest).** `GET /kpis/quality` is specced as flat `KpiCard[]`
  but the page needs charts + multi-column tables. Resolved *for now* by mocking and by T1
  committing the extended interfaces. Reconcile with Backend A later; update `API_SPEC.md`.
- **Cell RAG status must come from Backend A** (T3). Highlighted table cells carry
  `ytd2026Status` / `rollingR3Status`, matching how `KpiCard.status` already works —
  thresholds vary per KPI, reset yearly, and the same judgement feeds the chatbot and
  alerts, so deriving it in the UI would let views disagree. Confirm these fields when
  reconciling the contract above. Later sections with status-coloured cells should follow
  the same pattern rather than inventing per-view rules.
  **Strengthened at T6:** PIQ Maturity's colours run the *opposite* direction from PPM's —
  green is `>= plan` there, `<= plan` here — so the shared `getPlanVarianceStatus`
  placeholder mis-colours PIQ's LAR row. No single frontend rule serves both; Backend A
  must supply the status **and** each KPI's target direction.
- ~~**OQ-MAP-3** — does "Rolling 3-Month" derive on the frontend (last 3 complete months) or
  is it a backend parameter? Affects PPM/CAL/PIQ.~~ **Resolved at T3, reconfirmed at T6:
  backend.** `rollingR3` arrives as a value; no frontend date math anywhere on this page.
- ~~**OQ-MAP-5** — is the Products-on-Hold monthly column pivot produced by the backend or
  assembled on the frontend?~~ **Resolved at T5: backend.** `byMonth` arrives as month rows
  and the chart renders them directly — no frontend pivot or date math. Same resolution
  shape as OQ-MAP-3.
- **PPM/CAL card contents — resolved at T3 pickup.** Not charts: the wide card is a
  table (2025 FY / 2026 Plan / 2026 YTD / Rolling / 12M Trend / latest month,
  expandable aggregate → breakdown rows) and the narrow card is a ranked "Top
  Offenders" list. See `SPM-130-quality-ppm-cal.md` §Pickup findings. **GSIR's card
  contents are still unconfirmed** — don't assume the same shape; check via
  `get_design_context` at T4 pickup.
- ~~**Highlight card** — extend `HighlightCard` vs. new component: decide at T8.~~
  **Resolved at T8: rewritten in place.** See the inventory delta above.
- **Currency style + amount transport (T8, `OQ-Q-1`).** `formatUsd` now renders one
  style product-wide — `US$340K` / `US$1.2M`, from the Cost Recovery frame — so Summary
  and Top Offenders changed with it; the older Summary frame's `$340k` is a design
  inconsistency, not a second style. Still open with Backend A: whether amounts arrive
  raw (assumed), as `{ value, magnitude }`, or pre-formatted. Formatting deliberately
  stays in the frontend — one amount renders several ways and must stay sortable.
- **`OQ-Q-2` — is Cost Recovery's "Global Conversion" a count or a rate?** The frame
  draws `24` with no unit; Summary's tile shows "Conversion: 68%". Built as a count.
