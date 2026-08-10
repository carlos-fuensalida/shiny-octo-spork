# SPM-135 — Quality: Cost Recovery + Focus Supplier

**Branch:** `feature/SPM-135-quality-cost-focus`
**Status:** Refined at pickup — ready to build
**Epic:** [Quality Page](./README.md) — read for shared context
**Figma:** row `1377:14559` — Cost Recovery `1365:14366`, Focus Supplier `1365:14287`
**Chat-open frame:** same row at `1423:14642` — a different card layout, not just a narrower one (see §Responsiveness)

---

## Scope

The two half-width sections at the page bottom. Each is a `SectionHeader` (with a
DEEP DIVE action) over a row of three metric cards laid out
`label │ vertical divider │ value`.

- **Cost Recovery** — Global Conversion `24` · Total Recovered `US$15K` · On going `US$24M`
- **Focus Supplier** — Global `24` · NAR `15` · LAR `9`

## Pickup findings (`get_metadata` + `get_design_context` on `1377:14559`)

The stub's structure is correct. Four details it didn't record:

- **The card is 8px radius, not 12px** — `bg-white`, `1px #dee0e3`, `rounded-8`,
  `p-16`, contents centred with an 8px gap. `CardSurface` draws exactly this
  panel at **12px** (`borderRadius={3}`), so it is reused with a
  `borderRadius={2}` override rather than being redrawn — every `Box` prop
  passes through by design. Same 8px-vs-12px split T6 found on the PIQ table.
- **Typography:** label is `subtitle2` (14px, medium, `primary.main` `#0d436b`);
  value is `h5` (24px, regular, `text.primary` `#484948`). Both already exist as
  theme variants — no new tokens, no hex in the component.
- **Both sections carry a DEEP DIVE button.** The shared `DEEP_DIVE` const
  (T6, `./deepDive.ts`) covers both — this makes five call sites.
- **Row geometry:** 24px between the two sections (`gap={6}`), 16px between a
  section's header and its card row (`gap={4}`, matching every other section),
  8px between cards (`gap={2}`).

## Component decision — rewrite `HighlightCard` (agreed at pickup)

The stub left "extend `HighlightCard` vs. new component" open. Resolved:
**rewrite `HighlightCard` in place.**

`HighlightCard` (SPM-91) renders a title plus a status `Chip` and is
**used nowhere in the app** — it sits in the `ui/` barrel with a `variant` prop
the inventory marks *scaffolded, not implemented*, and its only planned consumer
(Summary's two highlight cards, `UI_REQUIREMENTS_SPEC.md` §4.1) is recorded as
**Dropped, not built**. So there is no caller to preserve and no future consumer
to strand.

Rewriting beats adding a second component because the Figma layer is itself named
"Highlight Card", and shipping a near-identical `MetricCard` beside a dead
`HighlightCard` is the duplication CLAUDE.md forbids. A `variant` union over the
two layouts was rejected too: chip-badge and divider-value share no internals, so
it would be a variant matrix over two unrelated trees — the same reasoning that
kept `CardSurface` opinion-free at T5.

New API:

| Prop | Type | Notes |
|---|---|---|
| `label` | `string` | Left cell, `subtitle2`, `primary.main` |
| `value` | `string` | Right cell, `h5`, `text.primary`. Pre-formatted by the caller |
| `HighlightCard.Skeleton` | — | Same 64px panel, two placeholder blocks either side of the divider |

`value` is a `string`, not `number`: the three Cost Recovery figures format
differently from each other (plain count vs. currency), so formatting is the
caller's business and the card stays a pure layout.

## Data model — `CostRecoveryKpi` is new (ships in this PR)

`FocusSupplierKpi` already exists (T1) and matches the frame exactly —
`countGlobal` / `countNar` / `countLar` — so it needs no change. **Cost Recovery
has no detail interface at all**; the only trace of it is a flat
`kpi-cost-recovery` entry in the `/kpis/quality` list. Added to both
`DATA_MODEL_SPEC.md` and `src/types/index.ts`:

```ts
interface CostRecoveryKpi extends KpiCard {
  globalConversion: number;  // count as drawn — see open question below
  totalRecovered: number;    // USD, raw (15_000 → "US$15K")
  ongoing: number;           // USD, raw (24_000_000 → "US$24M")
}
```

Raw numbers formatted in the UI, following the Summary precedent (`340000` →
`$340k`) rather than inventing a pre-formatted string field.

## Value formatting — one currency style product-wide

**Follow Figma, and make it the single rule** (agreed at pickup). Two consequences:

- **`formatUsd` changes for every caller**, rather than gaining a per-section
  option. This frame draws `US$15K` / `US$24M`; the Summary tile's own frame
  draws `$340k`. Since Summary's Cost Recovery figures are the *same metric* as
  this section's, two currency styles would be a defect, not a variation — so
  `formatMetricValue(v, 'USD')` now renders `US$` with an uppercase magnitude
  everywhere: `US$340K`, `US$1.2M`, `US$950`. The Summary KPI tiles and the Top
  Offenders chart adopt it (their tests update with it). Recorded as a
  deliberate deviation from the Summary frame in a comment on `formatUsd`, so
  the next person doesn't "fix" it back.
- **Global Conversion renders as a bare `24`**, no `%`, exactly as drawn.

## Open questions (recorded, not blocking)

- **`OQ-Q-1` — who formats amounts, and how are they transported?** Two linked
  undecideds: whether Backend A sends `24000000`, `{ value: 24, magnitude: 'M' }`,
  or a ready-made `"US$24M"` string. **This PR keeps formatting in the frontend**
  — the same raw number has to render as `US$24M` on a card, `24M` on a chart
  axis, and as a sortable value for the chatbot and exports, so pre-formatting
  server-side needs one field per rendering and turns a rounding-rule change into
  a backend release. The escape hatch already exists if Backend A disagrees:
  `KpiCard.value` is `number | string` and `formatMetricValue` passes strings
  through untouched. If the transport changes, only `formatUsd` and the two field
  types move.
- **`OQ-Q-2` — is Global Conversion a count or a rate?** The frame shows `24`
  with no unit, but Summary's Cost Recovery tile shows "Conversion: 68%"
  (`UI_REQUIREMENTS_SPEC.md` §590). Built as a count per the frame; confirm with
  the business before the real data lands.
- Both are placeholder-data questions, resolved with the Backend A contract
  alongside the epic's existing RAG-status blocker.

## Shared section component — one, not two

`CostRecoverySection` and `FocusSupplierSection` are structurally identical and
differ only in which hook feeds them and how its fields map to three
`{ label, value }` pairs. Following the `QualityTrendSection` precedent (T3,
shared by PPM and CAL), the JSX and all four §14 states live in one
**`MetricCardsSection`** (`src/components/quality/`, feature-scoped, no barrel),
with two thin wrappers owning only their fetch and their mapping.

## Data layer

- **New service** `getCostRecoveryDetail` → `GET /kpis/kpi-cost-recovery`.
  `getFocusSupplierDetail` already exists (T1) — no change.
- **New hooks** `useCostRecovery`, `useFocusSupplier` in `src/hooks/`, both added
  to the barrel; three-line `useQuery` wrappers mirroring `useExhibits`.
- **New mock routes** `kpi-cost-recovery` and `kpi-focus-supplier` — session-cookie
  guard → `401`, `_state=empty|error|slow`, `{ data, meta }` with
  `meta.reportingPeriod`. Values match the frame: `24` / `15000` / `24000000`
  and `24` / `15` / `9`. Both return a single object, so **empty is `data: null`
  with HTTP 200**, matching PPM/CAL/PIQ rather than the list endpoints' `[]`.

## Page composition

`QualitySections.tsx` drops `cost-recovery-focus` from `PLACEHOLDER_AFTER_EXHIBITS`
and renders the two sections in its place, last on the page. Risk Rating and 8Ds
(T7, SPM-134) keep their placeholders above.

## States (§14)

Per section, independently — one section erroring must not blank the other.

- **Loading** — `SectionHeader.Skeleton` + three `HighlightCard.Skeleton`.
- **Empty** — `data: null` with HTTP 200 → inline `EmptyState`, never an error.
- **Error** — `ErrorState` + retry.
- **Success** — the three cards.

## Responsiveness — the card flips, nothing stacks

This is the one section on the page where the epic's blanket "side-by-side
sections stack when narrow" rule is **wrong**, found by comparing the chat-open
frame (`1423:14642`) against the chat-closed one:

| | Chat closed `1377:14559` | Chat open `1423:14642` |
|---|---|---|
| The two sections | side by side, 680.5 each | **side by side**, 470.5 each |
| The three cards | one row, 221.5 wide | **one row**, 151.5 wide |
| Inside a card | `label │ vertical rule │ value`, 64px tall | **label / horizontal rule / value stacked**, 103px tall |

So neither the row nor the card row is a breakpoint. The narrowing is absorbed
**inside the card**, which switches from a row to a column and turns its divider
with it. Implemented as a container query on `HighlightCard` itself, flipping at
a 200px card width — between the two drawn widths, and measured against the box
that actually decides whether "Total Recovered │ US$15K" fits on one line. The
card is three levels of division below the viewport (page column → section →
three cards), so only its own width is a reliable signal.

### Below the frames — the resizable panel

Neither frame is the narrow case. The chatbot panel is user-resizable, so
dragging it past its Figma width (420px of a 1440 viewport) leaves a content
column no frame covers — and on a 1280 laptop with the panel near half the
screen, naively holding both layouts squeezes each card under 100px. Three
container queries hand width back instead of shrinking indefinitely, each
keyed to the narrower frame it degrades from:

| Container | Threshold | Below it |
|---|---|---|
| Page column (`HalfWidthRow`) | **960px** — chat-open row is 965 | The two sections stack; each gets the full column back |
| Section (`MetricCardsSection`) | **460px** — chat-open card row is 470.5 | The three cards go one per line, full width each |
| Card (`HighlightCard`) | **200px** — between the two drawn card widths | Label and value stack, divider turns horizontal |

Each level only narrows until the next one takes over, so the cards never fall
far below their 151.5px chat-open width. Card height is never fixed, so a label
that wraps grows the card instead of clipping.

## Tests (same PR)

- `getCostRecoveryDetail` — service unit test (new service function).
- Both mock routes — `src/test/api/…`, `// @vitest-environment node`.
- `formatMetricValue` — USD assertions updated to the new single style, plus the
  Summary/Top Offenders tests that assert `$340k`. Non-USD units must pass
  unchanged (proves the change is scoped to currency).
- `HighlightCard` — rewritten smoke test for the new API + skeleton.
- `MetricCardsSection` — all four §14 states.
- `CostRecoverySection` / `FocusSupplierSection` — smoke test that each maps its
  payload to the three labelled values (including `US$15K` / `US$24M`).
- Existing `QualitySections` test updated — `Cost Recovery + Focus Supplier` is
  no longer a placeholder.

## Acceptance criteria

- [ ] Both sections render three metric cards each from mock data, with the
      frame's labels and values (`24`, `US$15K`, `US$24M`; `24`, `15`, `9`)
- [ ] `HighlightCard` rewritten to the `label │ divider │ value` card with a
      `.Skeleton`; no second metric-card component added
- [ ] `CostRecoveryKpi` added to `DATA_MODEL_SPEC.md` and `src/types/index.ts`;
      `getCostRecoveryDetail` + `useCostRecovery` + `useFocusSupplier` + both
      mock routes
- [ ] `formatUsd` renders one style product-wide (`US$340K` / `US$1.2M`);
      Summary and Top Offenders adopt it, their tests updated
- [ ] One shared `MetricCardsSection`, two thin wrappers — no duplicate section
- [ ] Sections composed into `QualitySections`, placeholder removed
- [ ] All four §14 states per section
- [ ] Chat-open layout matches `1423:14642`: sections and card row both stay on
      one line, and each card flips to its stacked layout with a horizontal rule
- [ ] Validated against `get_design_context` on `1377:14559`
- [ ] Tests committed; `COMPONENT_INVENTORY.md` and the epic README updated
