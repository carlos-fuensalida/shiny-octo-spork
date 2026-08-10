# SPM-129 — Quality Shared Components

**Branch:** `feature/SPM-129-quality-shared-components`
**Status:** Refined — ready to implement
**Epic:** [Quality Page](./README.md) — read for shared context
**Figma:** section-header pattern `804:26154`; PIQ table `804:26198` (drives the DataTable
extension — structural/visual reference only, pulled via `get_metadata` + screenshot; the
node's internal layer name is a leftover from "Incoming Material PPM table" since it was
duplicated, but its columns match `PiqMaturityRegionRow` exactly: 2025 FY / 2026 Plan /
2026 YTD / Rolling (R3) / 12M Trend / latest-month value)

---

## Scope

The cross-cutting pieces used by 4+ sections. Build once here so later tickets compose them.

- **`SectionHeader`** (new, reusable UI): `divider — centered title — divider — right-aligned
  action button`. Not the same as `SectionCard`. Action button optional.
- **`DataTable` extension:** expandable rows + an inline sparkline cell (both needed by PIQ
  Maturity, T6). Keep backward-compatible with existing `DataTable` usages.
- **`Sparkline`** (new, reusable UI): small standalone line chart, not DataTable-specific —
  reusable anywhere a trend needs an inline mini-chart.

If the DataTable extension turns out large, it's fair to split it into its own ticket at pickup.

## Confirmed at pickup

- **`SectionHeader` action button** — reuses `ViewHeaderAction`'s shape
  (`{ label; icon?; onClick?; disabled? }`), same as `ViewHeader`, but rendered as a single
  `variant="contained"` `Button` (`color="primary"`, `size="small"`, uppercase label,
  `endIcon={<ChevronRightIcon />}`) — not `variant="text"` like `ViewHeader`, per the Figma
  frame (filled navy "DEEP DIVE ›" button). Omit the `action` prop entirely to hide it.
- **Sparkline rendering** — new `Sparkline` component: Recharts `LineChart` in a
  `ResponsiveContainer`, no axes/grid/tooltip, single `<Line>`. Same theme-color convention as
  `OffenderBarChart` (`useTheme()`, no hardcoded hex). Footprint ~114×24px per the Figma cell.
- **Row-expansion API** — **uncontrolled**: `DataTable` owns its own `expandedKeys: Set<string>`
  internal state. Caller passes `renderExpanded?: (row: T) => React.ReactNode`; rows that have
  it get a toggle (chevron, rotates 180° when expanded) and clicking the row (or the chevron)
  toggles an inline expanded content row below it. No controlled variant needed — no current
  consumer requires external control of expansion state.
  - Note: the Figma reference frame (804:26198) doesn't show a distinct expand-toggle
    affordance in its static/collapsed state — the last column's chevron there is a
    month-over-month trend-direction arrow (colored independently of row status), not an
    expand control. The exact placement/trigger for PIQ Maturity's row expansion is T6's call
    at its own pickup; this ticket only builds the generic, reusable mechanism.

## Components

- New: `SectionHeader` (+ `.Skeleton`), `Sparkline`. Extend: `DataTable`.
- Add `SectionHeader` and `Sparkline` to the UI barrel; update `COMPONENT_INVENTORY.md`.

## States (§14)

`SectionHeader` is presentational (no async). `DataTable` already owns loading skeleton;
extension must preserve it (expandable rows still show skeleton rows while loading, no
expand toggle rendered until real data with `renderExpanded` arrives). `Sparkline` renders a
flat/neutral placeholder line when passed no data (defensive — no dedicated loading state of
its own; the owning `DataTable`/section controls loading).

## Tests (same PR)

- `SectionHeader` smoke test (title, optional action, `.Skeleton`).
- `Sparkline` smoke test (renders with data, handles empty data).
- `DataTable` tests for expand/collapse (toggle shows/hides `renderExpanded` content, chevron
  rotates) + sparkline cell rendering, and that existing (non-expandable, non-sparkline) usages
  are unaffected.

## Acceptance criteria

- [ ] `SectionHeader` matches the Figma pattern (divider/title/divider/contained button);
      action button optional; `.Skeleton` present
- [ ] `DataTable` supports expandable rows + sparkline cell without breaking existing usages
- [ ] `SectionHeader` and `Sparkline` in the UI barrel; `COMPONENT_INVENTORY.md` updated
- [ ] Tests committed
