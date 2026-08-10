# Component Inventory

**Version:** 1.8
**Status:** Current
**Last Updated:** 2026-08-06

---

## Purpose

Running inventory of all reusable components in this codebase. Updated every time a component is added, changed, or removed.

**Rules:**
1. Check this file before creating any new component. Extend an existing component as a variant rather than duplicating.
2. Update this file in the same commit as any component addition or change, before merging.
3. Reusable components must never call APIs directly — all data access goes through `src/services/`.

---

## Quick Reference

| Component | Path | Type | Status | Added |
|---|---|---|---|---|
| UserContext | `src/context/UserContext.tsx` | Context | Stable | SPM-92 |
| AppHeader | `src/components/layout/AppHeader.tsx` | Layout | Stable | SPM-91 |
| AppNavigation | `src/components/layout/AppNavigation.tsx` | Layout | Stable | SPM-91 |
| ChatbotPanel | `src/components/layout/ChatbotPanel.tsx` | Layout | Stable | SPM-91 |
| AlertBanner | `src/components/ui/AlertBanner.tsx` | UI | Stable | SPM-91 |
| CardSurface | `src/components/ui/CardSurface.tsx` | UI | Stable | SPM-132 |
| ChatSuggestions | `src/components/ui/ChatSuggestions.tsx` | UI | Stable | SPM-91 |
| ContentCard | `src/components/ui/ContentCard.tsx` | UI | Stable | SPM-130 |
| DataTable | `src/components/ui/DataTable.tsx` | UI | Stable | SPM-91 |
| DonutChart | `src/components/ui/DonutChart.tsx` | UI | Stable | SPM-132 |
| EmptyState | `src/components/ui/EmptyState.tsx` | UI | Stable | SPM-91 |
| ErrorState | `src/components/ui/ErrorState.tsx` | UI | Stable | SPM-91 |
| FilterBar | `src/components/ui/FilterBar.tsx` | UI | Partial | SPM-91 |
| FilterDropdown | `src/components/ui/FilterDropdown.tsx` | UI | Stable | SPM-91 |
| HeaderDate | `src/components/ui/HeaderDate.tsx` | UI (layout sub) | Stable | SPM-91 |
| HighlightCard | `src/components/ui/HighlightCard.tsx` | UI | Stable | SPM-91 (rewritten SPM-135) |
| KpiCard | `src/components/ui/KpiCard.tsx` | UI | Stable | SPM-91 |
| LoadingState | `src/components/ui/LoadingState.tsx` | UI | Stable | SPM-91 |
| NotificationButton | `src/components/ui/NotificationButton.tsx` | UI (layout sub) | Stable | SPM-91 |
| OffenderBarChart | `src/components/ui/OffenderBarChart.tsx` | UI | Stable | SPM-126 |
| OffenderList | `src/components/ui/OffenderList.tsx` | UI | Stable | SPM-130 |
| SectionCard | `src/components/ui/SectionCard.tsx` | UI | Stable | SPM-104 |
| SectionHeader | `src/components/ui/SectionHeader.tsx` | UI | Stable | SPM-129 |
| Sparkline | `src/components/ui/Sparkline.tsx` | UI | Stable | SPM-129 |
| StatusChip | `src/components/ui/StatusChip.tsx` | UI | Stable | SPM-91 |
| UserAvatar | `src/components/ui/UserAvatar.tsx` | UI (layout sub) | Stable | SPM-91 |
| ViewHeader | `src/components/ui/ViewHeader.tsx` | UI | Partial | SPM-125 |
| QualityPerformanceSection | `src/components/summary/QualityPerformanceSection.tsx` | Feature | Stable | SPM-104 |
| DeliveryPerformanceSection | `src/components/summary/DeliveryPerformanceSection.tsx` | Feature | Stable | SPM-114 |
| TopOffendersSection | `src/components/summary/TopOffendersSection.tsx` | Feature | Stable | SPM-126 |
| QualitySections | `src/components/quality/QualitySections.tsx` | Feature | Partial | SPM-125 |
| SectionPlaceholder | `src/components/quality/SectionPlaceholder.tsx` | Feature | Partial | SPM-125 |
| KpiTrendTable | `src/components/quality/KpiTrendTable.tsx` | Feature | Stable | SPM-130 (renamed SPM-133) |
| QualityTrendSection | `src/components/quality/QualityTrendSection.tsx` | Feature | Stable | SPM-130 |
| PpmSection | `src/components/quality/PpmSection.tsx` | Feature | Stable | SPM-130 |
| CalSection | `src/components/quality/CalSection.tsx` | Feature | Stable | SPM-130 |
| ProductsOnHoldChart | `src/components/quality/ProductsOnHoldChart.tsx` | Feature | Stable | SPM-132 |
| ProductsOnHoldCard | `src/components/quality/ProductsOnHoldCard.tsx` | Feature | Stable | SPM-132 |
| ProductsOnHoldSection | `src/components/quality/ProductsOnHoldSection.tsx` | Feature | Stable | SPM-132 |
| PiqMaturitySection | `src/components/quality/PiqMaturitySection.tsx` | Feature | Stable | SPM-133 |
| ExhibitsCard | `src/components/quality/ExhibitsCard.tsx` | Feature | Stable | SPM-132 |
| ExhibitsSection | `src/components/quality/ExhibitsSection.tsx` | Feature | Stable | SPM-132 |
| MetricCardsSection | `src/components/quality/MetricCardsSection.tsx` | Feature | Stable | SPM-135 |
| CostRecoverySection | `src/components/quality/CostRecoverySection.tsx` | Feature | Stable | SPM-135 |
| FocusSupplierSection | `src/components/quality/FocusSupplierSection.tsx` | Feature | Stable | SPM-135 |

**Status values:**
- **Stable** — implemented and ready to use.
- **Partial** — implemented but has known gaps (see component entry for details).

---

## Contexts

### UserContext

**Path:** `src/context/UserContext.tsx` · `'use client'`
**Provider:** `UserContextProvider` — wrap at app root in `Providers.tsx`
**Hook:** `useUser(): { user: User | null; isLoading: boolean }`

Fetches the authenticated user once on mount via `getCurrentUser()`. On `401`, calls `redirectToLogin()`. On other errors, resolves `user` to `null`. Consumed by `AppHeader` → `UserAvatar`.

---

## Layout Components

Full implementation details and composition rules are in `specs/features/SPM-91-app-layout.md`.

### AppHeader

**Path:** `src/components/layout/AppHeader.tsx` · `'use client'`
**Barrel:** not exported (layout components have no barrel)

| Prop | Type |
|---|---|
| `user` | `User \| null` |
| `notificationCount` | `number` |

Fixed AppBar (64px, `primary.main`). Contains logo, app title, `HeaderDate`, `NotificationButton`, and `UserAvatar`. zIndex: `theme.zIndex.drawer + 1`.

---

### AppNavigation

**Path:** `src/components/layout/AppNavigation.tsx` · `'use client'`
**Barrel:** not exported

No props. Fixed tab bar (59px). Four tabs: SUMMARY, QUALITY, DELIVERY, ACTIVE SUPPLIERS. Custom animated sliding indicator — MUI built-in indicator hidden.

---

### ChatbotPanel

**Path:** `src/components/layout/ChatbotPanel.tsx` · `'use client'`
**Barrel:** not exported

| Prop | Type | Default |
|---|---|---|
| `sessionId` | `string \| null` | — |
| `onSessionChange` | `(id: string) => void` | — |
| `scope` | `ChatScope` | `'GLOBAL'` |
| `viewContext` | `Record<string, unknown>` | — |

Resizable right-hand AI assistant panel. Calls Backend B directly via `chat.service` — never through Backend A. Min width: 360px / 440px at xl. Collapses to `width: 0` with a re-expand amber `Fab`.

---

## UI Components

### AlertBanner

**Path:** `src/components/ui/AlertBanner.tsx`
**Barrel:** `src/components/ui/index.ts`

| Prop | Type | Default |
|---|---|---|
| `status` | `KpiStatus` | `'YELLOW'` |
| `message` | `string` | `'KPI Alert'` |
| `onSeeMore` | `() => void` | — |

Warning banner with dismiss action. Renders `null` after user dismisses — session-local, not persisted. "See More" rendered only when `onSeeMore` is provided.

- Background: `warning.light` · text: `warning.dark` · border: `1px solid var(--color-alert-border)`.
- Layout: `role="alert"` flex row — `WarningAmberIcon` (18px) + message + `StatusChip` + optional "See More" (`Typography component="button"`) + spacer + `CloseIcon` dismiss.
- `borderRadius: 1` (4px).

---

### ChatSuggestions

**Path:** `src/components/ui/ChatSuggestions.tsx`
**Barrel:** `src/components/ui/index.ts`
**Used by:** `ChatbotPanel` only

| Prop | Type | Notes |
|---|---|---|
| `scope` | `ChatScope` | Controls subtitle text only |
| `onSelect` | `(text: string) => void` | Fires when a suggestion chip is clicked |

Chatbot empty state. Shows a heading, a scope-aware subtitle, and 4 static suggestion chips. Scope affects subtitle text — chips are always the same regardless of scope.

See `specs/features/SPM-91-app-layout.md §ChatSuggestions` for full visual spec.

---

### CardSurface

**Path:** `src/components/ui/CardSurface.tsx`
**Barrel:** `src/components/ui/index.ts`

| Prop | Type | Notes |
|---|---|---|
| …`BoxProps` | `BoxProps` | Every `Box` prop passes through — callers own padding, layout, and `component` |

The bare panel every Quality page card sits on: `background.paper`, a 1px `divider` border, `borderRadius={3}` (12px). Nothing else — no title, no padding, no layout opinion.

Extracted in SPM-132 when the page gained its third and fourth card shells. The three cards' **headers** genuinely diverge — `ContentCard` draws an `h2` over a divider, `ProductsOnHoldCard` a plain 14px label, `ExhibitsCard` a full-bleed `secondary.main` band — so folding them into one component's props would be a variant matrix over layouts sharing no internals. This extracts the one thing they do share.

`ContentCard` was refactored to compose it; its rendered output is unchanged (pinned by regression tests in `ContentCard.test.tsx`), so the shipped PPM/CAL section is unaffected.

No `.Skeleton` — it has no content of its own to shape; the card composing it supplies one.

---

### ContentCard

**Path:** `src/components/ui/ContentCard.tsx`
**Barrel:** `src/components/ui/index.ts`

| Prop | Type | Notes |
|---|---|---|
| `title` | `string` | Rendered above the header divider — `h2`, `primary.main` |
| `footer` | `string` | Optional line below a closing divider, e.g. "As of January, 2026" |
| `children` | `React.ReactNode` | The card's single free-form content block |

The design system's **"Card Template"** (Figma `804:26162` / `804:26161`, SPM-130): a `CardSurface` with `p={3}` (12px), laid out as title → divider → content → divider → footer. The panel itself (paper background, 1px `divider` border, 12px radius) comes from `CardSurface`; this component owns only the chrome layered on top.

Not every card on the Quality page is a `ContentCard` — the Products on Hold and Exhibits cards have different headers and no dividers or footer, so they compose `CardSurface` directly (SPM-132).

Distinct from `SectionCard`, which is the Summary view's 6-column divider **grid**; `ContentCard` wraps a single child (a table, a list, a chart). Its content children are expected to be chrome-free (`OffenderList`, `DataTable`), matching the `OffenderBarChart` convention where the parent owns the card surface.

`ContentCard.Skeleton` takes the same `title` (rendered for real — card titles are page structure, known up front) plus `footer?: boolean`, and shapes only the footer; the caller supplies the content skeleton as children.

---

### DataTable

**Path:** `src/components/ui/DataTable.tsx`
**Barrel:** `src/components/ui/index.ts` (exports `DataTable` and `Column` type)

Generic `DataTable<T>` with typed `Column<T>` definitions.

```tsx
interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
  cellSx?: (row: T) => SxProps<Theme>;   // SPM-130
}
```

**`cellSx`** applies styles to the `<TableCell>` element itself rather than to its rendered contents — necessary for any fill that must cover the whole cell (the PPM/CAL status highlights, whose tint and 4px leading rule run the full row height). Styling `render` output instead leaves an inset block inside the cell's padding. It receives the row, so the style can depend on the data.

> **Cascade note (SPM-130):** the table typography overrides in `theme.ts` live on `MuiTableCell`'s `head`/`body` slots, **not** as descendant selectors under `MuiTableHead`/`MuiTableBody`. A descendant selector (`& .MuiTableCell-body`) scores 0,2,0 and silently outranks any `sx` on the cell (0,1,0) — which made per-cell color impossible. Keep new table styling on the `MuiTableCell` slots.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `rows` | `T[]` | — | — |
| `columns` | `Column<T>[]` | — | — |
| `loading` | `boolean` | `false` | Shows 5 skeleton rows; headers still render |
| `groupBy` | `(row: T) => string` | — | Inserts a group header row before each group |
| `pagination` | object | — | Controlled pagination |
| `footer` | `React.ReactNode` | — | Rendered below `<TableBody>` |
| `stickyHeader` | `boolean` | `false` | — |
| `maxHeight` | `number \| string` | — | — |
| `size` | `'small' \| 'medium'` | `'small'` | **SPM-130.** Row density. `'small'` keeps the compact rows existing callers expect; `'medium'` gives MUI's standard ~56px rows, matching the Figma KPI tables (PPM/CAL). |
| `renderExpanded` | `(row: T) => React.ReactNode` | — | **SPM-129.** Presence of this prop turns on a leading expand-toggle column. Expansion is **uncontrolled** — `DataTable` owns its own `expandedKeys: Set<string>` state internally, keyed by `getRowKey`. Clicking the row or its chevron toggles an inline row rendering `renderExpanded(row)`, full-width, below it. No controlled variant exists — add one only if a consumer needs external control. |

**States:**
- Loading: 5 skeleton rows, column headers still rendered. When `renderExpanded` is set, each skeleton row also gets a leading circular-skeleton toggle placeholder so the loading shape matches the loaded shape.
- Empty: empty `<TableBody>` — no built-in empty message. Compose with `EmptyState` at the feature level.
- Error: not built-in. Compose with `ErrorState` at the feature level.

**Group rows:** uppercase · `bgcolor: background.default` · Open Sans · `fontSize: 11` · `fontWeight: 600`. Group header cells span the expand-toggle column too when `renderExpanded` is set.

**Chrome (SPM-130, from the Figma table style):** container border 1px `divider` at `borderRadius: 2` (8px); header cells fill `var(--color-gray-lightest)` (`#f5f6f7`) with a `var(--color-gray)` (`#d1d3d4`) rule; body row separators use the same `--color-gray`. Header text is Roboto Medium 14px `primary.main`, body text Roboto Regular 14px `text.primary` — both from the theme's `MuiTableCell` slots (see the cascade note above).

**Sparkline cells:** no dedicated DataTable prop — compose a column's `render` callback with the standalone `Sparkline` component (e.g. PIQ Maturity's "12M Trend" column, SPM-133).

---

### DonutChart

**Path:** `src/components/ui/DonutChart.tsx` · `'use client'`
**Barrel:** `src/components/ui/index.ts` (exports `DonutChart`, `DonutChartProps`, `DonutSegment`)

| Prop | Type | Notes |
|---|---|---|
| `segments` | `DonutSegment[]` | `{ label, value, color }` — `color` is a resolved CSS string the caller reads from the theme, never hardcoded |
| `label` | `string` | Accessible name for the chart (e.g. `"GLOBAL exhibits by status"`); not rendered visibly |

Recharts donut with its **derived** total in the center and a legend list beside it (Figma `804:26272`, SPM-132). 110px ring, 34px inner radius.

**The total is computed as the sum of `segments`, never passed in** — so the center figure can't drift from the arcs it summarises. (Contrast the PPM/CAL cells' RAG status, which *must* travel as data because it's a business judgement, not arithmetic.) The center label is a real `Typography` positioned over the ring's hole rather than an SVG `<text>` node, so it uses theme typography.

Generic by design: the segment set and its colours are props, so the Exhibits status→colour map lives in `ExhibitsCard`, not here. Chrome-free — the calling card supplies the surface, same convention as `OffenderBarChart` / `OffenderList`.

Empty segments (or all-zero values) render an `EmptyState` rather than a ring with no arcs — `data: []` is an empty result, never an error (§14).

**`DonutChart.Skeleton`** — `{ segments?: number }` (default 5): a circular placeholder plus that many legend rows, holding the card's footprint.

---

### EmptyState

**Path:** `src/components/ui/EmptyState.tsx`
**Barrel:** `src/components/ui/index.ts`

| Prop | Type | Default |
|---|---|---|
| `title` | `string` | — |
| `description` | `string` | — |
| `action` | `React.ReactNode` | — |
| `icon` | `React.ReactNode` | `InboxOutlinedIcon` 48px |
| `minHeight` | `number \| string` | — |

All props optional. Centered layout: icon → title → description → action. Use when `data: []` is returned with HTTP 200.

---

### ErrorState

**Path:** `src/components/ui/ErrorState.tsx`
**Barrel:** `src/components/ui/index.ts`

| Prop | Type | Default |
|---|---|---|
| `title` | `string` | — |
| `description` | `string` | — |
| `onRetry` | `() => void` | — |
| `minHeight` | `number \| string` | — |

All props optional. `role="alert"`. Renders an optional retry button when `onRetry` is provided. Use on non-2xx responses or failed requests.

---

### FilterBar

**Path:** `src/components/ui/FilterBar.tsx`
**Barrel:** `src/components/ui/index.ts`
**Status:** Partial — two filters not yet implemented (see gap note)

| Prop | Type | Notes |
|---|---|---|
| `filters` | `FilterParams` | Current filter state |
| `metadata` | `FilterMetadata \| null` | Dynamic options (plants, commodities, etc.) |
| `onChange` | `(filters: FilterParams) => void` | — |
| `onOpenDrawer` | `() => void` | FILTERS button handler |
| `onExport` | `() => void` | EXPORT button handler |
| `showExport` | `boolean` | Shows/hides EXPORT button |

**Implemented (9 of 11):** Region · Plant · Commodity · Subcommodity · Supplier Loc. · Month · Year · Category · Focus Supplier.

**GAP — Supplier and Supplier Code:** The spec (`UI_REQUIREMENTS_SPEC.md §4`) lists `Supplier` and `Supplier Code` as filters 5 and 6. Both are present in `FilterParams` (`supplierIds` and `supplierCode`). Implementation approach (dropdown vs. search-and-select modal) is not yet confirmed. These are not rendered in `FilterBar`.

Region options are hardcoded (`GLOBAL` / `NAR` / `LAR`). Month options are hardcoded 1–12. Plants, commodities, subcommodities, categories, and supplier locations are sourced from `metadata`.

---

### FilterDropdown

**Path:** `src/components/ui/FilterDropdown.tsx`
**Barrel:** `src/components/ui/index.ts`

| Prop | Type | Default |
|---|---|---|
| `label` | `string` | — |
| `value` | `string` | — |
| `options` | `Array<{ value: string; label: string }>` | — |
| `onChange` | `(value: string) => void` | — |
| `allLabel` | `string` | `'All'` |

`FormControl size="small"`. Always prepends an "All" option (empty string value). `minWidth: 110`. `fontSize: 12`. Building block for `FilterBar`.

---

### HeaderDate

**Path:** `src/components/ui/HeaderDate.tsx` · `'use client'`
**Barrel:** `src/components/ui/index.ts`
**Used by:** `AppHeader` only

No props. Renders the current date and auto-updates at midnight. See `specs/features/SPM-91-app-layout.md §HeaderDate` for full spec.

---

### HighlightCard

**Path:** `src/components/ui/HighlightCard.tsx`
**Barrel:** `src/components/ui/index.ts`
**Status:** Stable

| Prop | Type | Default | Notes |
|---|---|---|---|
| `label` | `string` | — | What the figure measures. `body1`/500, `primary.main` |
| `value` | `string` | — | Pre-formatted figure. Theme `h1` (24px/400) rendered as a `<p>`, `text.primary` |
| `HighlightCard.Skeleton` | — | — | Same panel, two placeholder blocks either side of the rule |

One labelled figure on a `CardSurface` at an **8px** radius (`borderRadius={2}` — the Quality page's other cards are 12px), 16px padding, contents centred with an 8px gap.

`value` is a `string`, not a number: the Cost Recovery cards mix a plain count with two currency figures, so formatting is the caller's and the card stays a pure layout.

**Two layouts, one component.** Figma draws it horizontal (`label │ vertical rule │ value`, 221.5×64) with the chatbot closed and stacked (label / horizontal rule / value, 151.5×103) with it open. The card is its own `container-type: inline-size` query container and flips at a **200px card width**, turning the divider with it — the card sits three levels below the viewport (page column → half-width section → three cards), so only its own width is a reliable signal. Height is never fixed, so a label that wraps grows the card instead of clipping.

**Rewritten by SPM-135.** It previously rendered a title plus a status `Chip` (SPM-91) for Summary highlight cards that were never built — `UI_REQUIREMENTS_SPEC.md` §4.1 records them as dropped — and had no callers, so the name was reclaimed for the card the design system actually draws under it rather than adding a near-identical second component.

---

### KpiCard

**Path:** `src/components/ui/KpiCard.tsx`
**Barrel:** `src/components/ui/index.ts`

| Prop | Type | Default | Notes |
|---|---|---|---|
| `kpi` | `KpiCard` | — | Data object |
| `values` | object | — | Per-tile overrides |
| `metrics` | `SummaryMetric[]` | — | Labelled figures, one flex-wrap row. **Supersedes `tiles` / `values` when provided.** |
| `metricRows` | `SummaryMetric[][]` | — | Explicit row grouping, **supersedes `metrics`** when provided. Use when the design fixes which metrics share a row regardless of tile width — plain `metrics`' flex-wrap only breaks a row when it runs out of horizontal space, which doesn't reproduce a fixed grouping on a wide tile (e.g. Delivery's region tiles, SPM-114). |
| `tiles` | `'1' \| '2' \| '3'` | — | Layout variant (ignored when `metrics`/`metricRows` is set) |
| `subtitle` | `string` | — | Shown in `tiles="1"` variant |
| `title` | `string` | — | Overrides the header text with a group-label style (Open Sans SemiBold 13px, `primary.main`, theme `subtitle2`) instead of the KPI-name style. Use for tiles not scoped to one KPI, e.g. a region name (`DeliveryPerformanceSection`, SPM-114). Status chip still only renders from `kpi?.status`. |
| `variant` | `'card' \| 'embedded'` | `'card'` | `'embedded'` drops the `Card` chrome |
| `stackMetrics` | `boolean` | `false` | Forces `metrics` into a vertical column instead of wrapping by available width — for tiles whose stacking is design-mandated, not a width artifact (e.g. Cost Recovery). See `SPM-104` V-3. Not used with `metricRows`, which is already explicit about rows. |
| `loading` | `boolean` | `false` | — |
| `error` | `boolean` | `false` | — |
| `onClick` | `() => void` | — | Makes the card/tile actionable |

**Tile variants:**

| `tiles` | Metric columns |
|---|---|
| `'1'` | Global only |
| `'2'` | Global + NAR |
| `'3'` | Global + NAR + LAR |

`tiles` only produces region-labelled columns. Use `metrics` for any other label — 8Ds ("Open > 90 Days"), Cost Recovery ("Global YTD"), Risk Rating, and all Delivery tiles.

**Rendering variants:**

| `variant` | Output |
|---|---|
| `'card'` | MUI `Card`; `onClick` wraps it in `CardActionArea` |
| `'embedded'` | Bare `Box`, no border/radius/shadow; `onClick` wraps it in a `ButtonBase` with an `action.hover` background. For cells inside a `SectionCard` grid. |

**States:**
- Loading: `Skeleton` for title and metric area. Also available standalone as `KpiCard.Skeleton` (`metrics`, `variant`).
- Error: `Typography color="error"` "Unable to load".
- No data: value shows "—" · `StatusChip` hidden.
- Success: value + optional status chip (hidden when `status` is null).

Metric values are formatted by `formatMetricValue` from `src/lib/format.ts` — unit-aware for `USD`, `PERCENT`, and count-like units; strings pass through so the backend can send pre-composed values like "Qty 145 / $1.2M".

**Metric tile typography** (`MetricColumn`, internal to `KpiCard`): label and caption use `variant="caption"` (12px), value uses `variant="h5"` (24px) — both MUI defaults, confirmed against real Figma tokens via `get_design_context` during SPM-114. Originally `fontSize={28}`/`{11}` estimates from SPM-104's screenshot; corrected for both sections since `MetricColumn` is shared.

---

### SectionCard

**Path:** `src/components/ui/SectionCard.tsx`
**Barrel:** `src/components/ui/index.ts`

Container for the large Summary sections: a titled `Card` wrapping a divider grid of KPI tiles.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `title` | `string` | — | `variant="h2"` · `primary.main`. Also the `aria-label` of the `section` landmark. |
| `footer` | `string` | — | Footer line, e.g. "As of January, 2026" |
| `children` | `React.ReactNode` | — | Grid cells — use `SectionCard.Cell` |

**`SectionCard.Cell`** — `{ span?: number; children }`. `span` is the cell's column count in the 6-column grid.

**Grid dividers:** the container uses `gap="1px"` over `bgcolor="divider"`, and each cell paints its own `background.paper`. The gaps read as divider lines and stay correct for any mix of column spans — no per-cell border bookkeeping, no outer border. The grid is wrapped in a `px={6}` inset (`background.paper`), and both the header→grid and grid→footer `Divider`s carry a matching `mx={6}` — so none of the card's 3 horizontal rules (header divider, internal row divider, footer divider) touch the card's left/right border.

**Responsive columns:** `xs: 2 · md: 3 · lg: 6`.

**`SectionCard.Skeleton`** — `{ title, spans?, metricsPerCell? }`. Keeps the title rendered and mirrors the real grid shape via `spans`, so nothing shifts when data arrives.

**Removed (SPM-114, 2026-07-31):** the `filterLabels` placeholder filter row (muted text with `/` separators, added in SPM-104 per OQ-1) is gone — the current design has no filter row on the section cards. Both `QualityPerformanceSection` and `DeliveryPerformanceSection` no longer pass it.

**States:** empty and error are composed at the feature level — render an `EmptyState` or `ErrorState` inside a full-width `SectionCard.Cell span={6}`.

---

### SectionHeader

**Path:** `src/components/ui/SectionHeader.tsx`
**Barrel:** `src/components/ui/index.ts`

Shared section-intro pattern used across the Quality page (and beyond): `divider — centered title — divider — optional right-aligned action button`. **Not** the same as `SectionCard` (the Summary divider-grid card) — this is a plain intro row, no tile grid.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `title` | `string` | — | Centered, `variant="h2"`, `primary.main` |
| `action` | `ViewHeaderAction` | — | Reuses `ViewHeader`'s action shape (`{ label; icon?; onClick?; disabled? }`). Omit for no button. |

Unlike `ViewHeader`'s plain-text action buttons, `SectionHeader`'s action renders as a single `variant="contained"` `Button` (`color="primary"`, `size="small"`, uppercase label, `endIcon={<ChevronRightIcon />}` by default, overridable via `action.icon`) — confirmed against the Figma frame (filled navy "DEEP DIVE ›" button).

**`SectionHeader.Skeleton`** — `{ title: string; action?: boolean }`. The title always renders for real (section titles are page structure, known up front, not fetched data) — only the optional action button gets a skeleton placeholder shape, mirroring `SectionCard.Skeleton`'s approach of keeping known content real and only mirroring the shape of what's actually async.

**States:** presentational only, no async states of its own.

---

### Sparkline

**Path:** `src/components/ui/Sparkline.tsx` · `'use client'`
**Barrel:** `src/components/ui/index.ts`

| Prop | Type | Default |
|---|---|---|
| `data` | `number[]` | — |
| `width` | `number \| string` | `114` |
| `height` | `number \| string` | `24` |

Minimal inline trend line for a compact space (e.g. a `DataTable` cell) — no axes, grid, or tooltip, single Recharts `<Line>` in a `ResponsiveContainer`. Stroke color read from the theme (`useTheme()`, `text.primary`), never hardcoded, same convention as `OffenderBarChart`. Not DataTable-specific — reusable anywhere a compact trend needs showing.

When given fewer than 2 points (including empty data), renders a flat placeholder line (`text.secondary`) instead of an empty/degenerate chart. No dedicated loading state of its own — the owning table/section's loading state covers it.

**Renders inline-level** (`inline-block`, or `inline-flex` for the short-data placeholder, both `vertical-align: middle`), so it honours its parent's `text-align` — which is how `DataTable`'s `Column.align` positions cell content. It was originally a fixed-width *block*, which ignores `text-align` entirely and pins the line to the left of its cell; the gap only becomes visible once the column is wider than the 114px line, so it read as correct on a laptop and off-centre on a wide monitor or with the chatbot collapsed (found in SPM-133 review). Two regression tests pin both branches.

---

### OffenderBarChart

**Path:** `src/components/ui/OffenderBarChart.tsx` · `'use client'`
**Barrel:** `src/components/ui/index.ts`

The app's first chart component (Recharts). A horizontal bar chart of the worst-performing suppliers for a single metric, used by `TopOffendersSection`.

| Prop | Type | Notes |
|---|---|---|
| `title` | `string` | Chart title — `body1` (14px), `primary.main` |
| `offenders` | `TopOffenderBar[]` | Rendered in received order — the caller/endpoint owns ranking, this component never re-sorts |
| `unit` | `KpiUnit` | Formats axis ticks and per-bar value labels via `formatMetricValue` |

Bars use `secondary.main` on a faint `background.default` (ice-blue) track, with rounded value-end caps and value labels via Recharts `<LabelList>`; the plot fills a `<ResponsiveContainer>`. Colours are read from the theme (`useTheme()`), never hardcoded. Carries no card chrome (no background/radius) so it composes cleanly inside a divider grid — the consuming cell paints `background.paper`, matching the `KpiCard` embedded convention. When `offenders` is empty it renders an inline `EmptyState` (per `UI_REQUIREMENTS_SPEC.md` §14.2). `OffenderBarChart.Skeleton` keeps the title bar + five placeholder bars so the footprint doesn't shift on load.

---

### OffenderList

**Path:** `src/components/ui/OffenderList.tsx` · `'use client'`
**Barrel:** `src/components/ui/index.ts`

| Prop | Type | Notes |
|---|---|---|
| `offenders` | `TopOffenderBar[]` | Rendered in received order, same ranking contract as `OffenderBarChart` |
| `unit` | `KpiUnit` | Formats each value via `formatMetricValue`; appends a literal `" PPM"` suffix for `unit === 'PPM'` (the only unit this list renders today) |

Ranked supplier list — rank dot, name, value, optional region/status caption (`TopOffenderBar.caption`) — introduced for the Quality PPM/CAL narrow card (Figma `804:26161`/`804:26171`, SPM-130). Shares `OffenderBarChart`'s data shape (`TopOffenderBar`) but not its bar layout, so it's a sibling rather than a variant — the two visuals don't overlap enough to unify without one faking the other's layout.

Rank dot colors are a fixed positional ramp taken straight from the design — `var(--color-red-dark)` → `var(--color-orange)` → `secondary.main` — **not** `KpiStatus`, since the payload carries a ranking rather than a per-supplier status. Like `OffenderBarChart` it carries **no card chrome**; the parent supplies it (here, `ContentCard`). Empty `offenders` renders an inline `EmptyState`. `OffenderList.Skeleton` keeps 3 placeholder rows.

**Known deviation:** Figma draws pure-black rules between rows; this uses the standard MUI `Divider` (`divider`, `#dee0e3`). Black is not part of the design system's named neutral ramp, so the black stroke reads as an unstyled Figma default rather than an intentional token. Revisit if design confirms otherwise.

---

### LoadingState

**Path:** `src/components/ui/LoadingState.tsx`
**Barrel:** `src/components/ui/index.ts`

| Prop | Type |
|---|---|
| `variant` | `'card' \| 'table' \| 'page' \| 'spinner'` |

General-purpose loading placeholder for page- and section-level skeletons.

| Variant | Output |
|---|---|
| `'card'` | 2 rectangular skeletons |
| `'table'` | Table header skeleton + N body row skeletons |
| `'page'` | 2-column grid of 6 rectangular skeletons |
| `'spinner'` | `CircularProgress` |

For component-level loading states, prefer the component's own built-in loading prop (e.g. `KpiCard loading`). Use `LoadingState` at the page or section level.

---

### NotificationButton

**Path:** `src/components/ui/NotificationButton.tsx`
**Barrel:** `src/components/ui/index.ts`
**Used by:** `AppHeader` only

| Prop | Type | Default |
|---|---|---|
| `count` | `number` | 0 |

See `specs/features/SPM-91-app-layout.md §NotificationButton` for full visual spec.

---

### StatusChip

**Path:** `src/components/ui/StatusChip.tsx`
**Barrel:** `src/components/ui/index.ts`

| Prop | Type | Default |
|---|---|---|
| `status` | `KpiStatus` | — |
| `size` | `'small' \| 'medium'` | `'small'` |

| Status | Label | Background | Text | Dot |
|---|---|---|---|---|
| `GREEN` | On Track | `var(--color-green-light)` | `success.main` | `var(--color-green)` |
| `YELLOW` | Watch | `var(--color-amber-light)` | `var(--color-amber-dark)` | `var(--color-amber)` |
| `RED` | At Risk | `var(--color-red-light)` | `var(--color-red-dark)` | `var(--color-orange)` |
| `NEUTRAL` | Neutral | `var(--color-gray-light)` | `text.primary` | `text.secondary` |

Status dot: `::before` pseudo-element, 6×6px circle, `ml: 0.75`. Height: 20px (small) / 24px (medium). `fontSize: 11` · `fontWeight: 500` · `borderRadius: 1`. No hex literals.

---

### UserAvatar

**Path:** `src/components/ui/UserAvatar.tsx` · `'use client'`
**Barrel:** `src/components/ui/index.ts`
**Used by:** `AppHeader` only

| Prop | Type | Default |
|---|---|---|
| `user` | `User \| null` | — |
| `size` | `number` | 32 |

See `specs/features/SPM-91-app-layout.md §UserAvatar` for full visual spec.

---

### ViewHeader

**Path:** `src/components/ui/ViewHeader.tsx`
**Barrel:** `src/components/ui/index.ts`

| Prop | Type | Default | Notes |
|---|---|---|---|
| `title` | `string` | — | `h1`, `primary.main`. |
| `subtitle` | `string` | — | Optional line under the title, `secondary.main`. |
| `actions` | `ViewHeaderAction[]` | `[]` | Right-aligned text buttons; omit for a title-only header. |

Shared header for every top-level view (Summary, Quality, Delivery, …): a title + optional subtitle on the left, a row of text action buttons on the right. Each `ViewHeaderAction` is `{ label; icon?; onClick?; disabled? }`. Replaces the former per-view `SummaryHeader` / `QualityHeader` copies (SPM-125) — the pages now pass their own title, subtitle, and actions. Action buttons are currently disabled stubs (behaviour TBD); subtitle values are hardcoded at the page level until the global filter bar is wired.

---

## Feature Components

Feature-scoped compositions live in `src/components/{feature}/`. They are not reusable and have no barrel — each is imported by its own view. They may call services (via hooks); the reusable components in `ui/` may not.

### QualityPerformanceSection

**Path:** `src/components/summary/QualityPerformanceSection.tsx` · `'use client'`

| Prop | Type | Default |
|---|---|---|
| `filters` | `FilterParams` | `{}` |

Composes `SectionCard` with nine embedded `KpiCard` tiles from `useSummaryKpis()`, filtered to `category === 'QUALITY'`. Owns the column-span map (six span-1 tiles, then three span-2) — a layout concern kept out of the API payload. Implements all four states per `UI_REQUIREMENTS_SPEC.md` §14. Tiles navigate to `kpi.detailRoute` when one is present.

---

### DeliveryPerformanceSection

**Path:** `src/components/summary/DeliveryPerformanceSection.tsx` · `'use client'`

| Prop | Type | Default |
|---|---|---|
| `filters` | `FilterParams` | `{}` |

Composes `SectionCard` with 3 region tiles (Global, NAR, LAR — `span={2}` each, filling the 6-column grid) from `useSummaryKpis()`, filtered to `category === 'DELIVERY'`. Unlike `QualityPerformanceSection`'s one-tile-per-KPI grid, the mock dataset stays KPI-centric (metrics keyed by region); a local `groupByRegion` helper regroups it into one tile per region at render time, dropping a KPI out of a region's tile when it has no metric there (e.g. VMI has no LAR entry, OTIF has no NAR entry) — matches `DATA_MODEL_SPEC.md`'s region-availability table. Within each tile, `groupByRegion` also chunks the pivoted metrics into that region's fixed row shape (`ROW_SIZES`: `Global: [1, 1, 3]` stacks Expedite and Production Loss on their own rows; `NAR`/`LAR: [2, 2]` keep them side by side) and passes the result as `KpiCard`'s `metricRows` — the grouping is fixed per region by design, not a width-driven wrap. Each region tile uses `KpiCard`'s `title` prop for its region-name header. No per-KPI detail pages exist yet, so every tile navigates to `/delivery` (the top-level Delivery view) on click, not a KPI-specific route. Implements all four states per `UI_REQUIREMENTS_SPEC.md` §14.

---

### TopOffendersSection

**Path:** `src/components/summary/TopOffendersSection.tsx` · `'use client'`

| Prop | Type | Default |
|---|---|---|
| `filters` | `FilterParams` | `{}` |

The third Summary section card. Composes `SectionCard` with a single full-width `SectionCard.Cell span={6}` holding five `OffenderBarChart`s (one per metric) from `useTopOffenders()`. A local `ChartGrid` lays them out three-across on `lg`+ / stacked below, reusing `SectionCard`'s divider technique (1px gaps over a `divider` backdrop, cells paint `background.paper`); trailing filler cells hidden below `lg` complete the last row so no divider line bleeds into the empty bottom-right slot. No header filter row (deferred to a future ticket). Data is mocked via `GET /kpis/top-offenders` pending Backend A; the mock owns the ranking rule (OQ-MAP-7 open). Implements all four states per `UI_REQUIREMENTS_SPEC.md` §14, plus per-chart empty handling in `OffenderBarChart`. See `specs/features/SPM-126-top-offenders.md`.

---

### QualitySections

**Path:** `src/components/quality/QualitySections.tsx` · `'use client'`

| Prop | Type | Default |
|---|---|---|
| `filters` | `FilterParams` | `{}` |

The Quality page's scaffold body. The `/quality` page composes it under a shared `ViewHeader`. Renders the real `PpmSection` and `CalSection` first, then one `SectionPlaceholder` per remaining section in Figma top→bottom order, all with 24px (`gap={6}`) spacing — a layout concern kept out of the API payload. Drives its own four §14 states off `useQualityKpis()` (mocked `GET /kpis/quality`): loading → `SectionPlaceholder.Skeleton` stack (`PpmSection`/`CalSection` aren't mounted yet at this point, so they don't start fetching until this resolves — a T1 scaffold characteristic, not changed by SPM-130), error → `ErrorState` with retry, empty (`data: []` + 200) → `EmptyState`, success → `PpmSection` + `CalSection` + remaining placeholders + an "As of …" footer from `formatAsOfFooter(meta.reportingPeriod)`. Remaining placeholders are replaced by real sections in tickets T4–T8 (SPM-131…135).

---

### SectionPlaceholder

**Path:** `src/components/quality/SectionPlaceholder.tsx`

| Prop | Type |
|---|---|
| `title` | `string` |

Scaffold stand-in for a Quality page section — a bordered `background.paper` box with the section title (`h2`, `primary.main`) and a muted "Section coming soon" caption. Establishes the vertical stack's order and spacing until the real content lands (now only needed for T4–T8; T3/SPM-130 replaced the PPM/CAL entries with `PpmSection`/`CalSection`). `SectionPlaceholder.Skeleton` preserves the box and title line for the page loading state.

---

### KpiTrendTable

**Path:** `src/components/quality/KpiTrendTable.tsx` · `'use client'`

> Named `PpmCalTrendTable` until SPM-133, when PIQ Maturity turned out to render the identical table and it was generalized rather than copied.

| Prop | Type | Notes |
|---|---|---|
| `aggregate` | `TrendRow` | The total row — "Whirlpool" (PPM/CAL) or "Global" (PIQ) |
| `breakdown` | `TrendRow[]` | By commodity (PPM) or by region (CAL, PIQ) |
| `latestPeriodLabel` | `string` | Trailing column header, e.g. `"May'26"` — build with `formatShortMonth` |
| `unit` | `KpiUnit?` | Default `'PPM'` (bare localized number). `'PERCENT'` suffixes `%` on all five numeric cells |

`TrendRow: { dimension, fy2025, plan2026, ytd2026, rollingR3, monthly: number[] }` — a presentation-only shape; callers map `PpmBreakdownRow`/`CalBreakdownRow`/`PiqMaturityRegionRow` into it (extracting `.ppm`/`.calCount` from each `monthly` entry where those are row objects; PIQ's `monthly` is already `number[]`).

The Quality page's shared trend table (Figma `804:26162` / `804:26172` / `804:26198`; SPM-130, generalized by SPM-133): a **flat** `DataTable` at `size="medium"` — aggregate row + breakdown rows, all always visible, no expand/collapse. The chevron-shaped icons in Figma are the latest-month trend indicator, **not** an expand toggle; this caught out both SPM-130 and SPM-133 at pickup, and no table on the Quality page expands.

Three sections render through it: Incoming Material PPM, CAL A/AA – PPM, and PIQ Maturity. Carries no card chrome — PPM/CAL wrap it in a `ContentCard`, while PIQ deliberately doesn't, leaving `DataTable`'s own bordered container as the visible panel.

Columns: dimension label (bold), `2025 FY`, `2026 Plan`, `2026 YTD` (highlighted), `Rolling` (highlighted, `" (R3)"` suffix), `12M Trend` (`Sparkline`), latest month (filled `ExpandLess`/`ExpandMore` at MUI's default 24px + value).

**Status highlighting** goes through `Column.cellSx` so the tint fills the whole cell, pairing `X.light` (fill) with `X.main` (4px leading rule **and** the value's text color) — the design system's alert pairing. Both the highlight thresholds and the trend direction read through `getPlanVarianceStatus`/`getMonthOverMonthTrend` (`src/lib/kpiTrend.ts`), which are **explicitly documented placeholder rules**, not confirmed business logic; swap their implementation in one place when the real thresholds are decided. Note that the placeholder cannot serve all callers: PIQ colours green for `>= plan`, PPM for `<= plan`, so PIQ's payload states its statuses explicitly. `KpiTrendTable.Skeleton` preserves the header row + a `rowCount` of placeholder rows (default 4; PIQ passes 3).

---

### QualityTrendSection

**Path:** `src/components/quality/QualityTrendSection.tsx` · `'use client'`

| Prop | Type | Notes |
|---|---|---|
| `title` | `string` | — |
| `isLoading` / `isError` | `boolean` | From the caller's detail hook |
| `onRetry` | `() => void` | — |
| `footer` | `string?` | From `formatAsOfFooter` |
| `data` | `{ aggregate, breakdown, offenders, latestPeriodLabel } \| null` | `null` renders the empty state |
| `unit` | `KpiUnit` | Forwarded to `OffenderList` |

Shared four-§14-state layout for `PpmSection`/`CalSection` (Figma `804:26153`/`804:26163`): a `SectionHeader` carrying a **DEEP DIVE** action, then a row of two `ContentCard`s — the wide `KpiTrendTable` and the narrow `OffenderList` — each with its own "As of …" footer (the footer belongs to each card, not the section). The two sections are identical in structure and differ only in which hook feeds them and how that hook's rows map to `TrendRow`; that mapping stays in each thin section component while this holds the shared JSX, so they aren't two near-duplicate files (CLAUDE.md anti-duplication rule).

`unit` is forwarded to **both** `OffenderList` and `KpiTrendTable` (PPM and CAL both pass `'PPM'`).

The DEEP DIVE button is a **disabled stub** — its destination isn't specified yet, but it's part of the section design, so it renders rather than being silently dropped (same convention as `ViewHeader`'s action stubs). It lives in `src/components/quality/deepDive.ts` as a single shared `DEEP_DIVE` const, imported by `QualityTrendSection`, `ExhibitsSection`, and `PiqMaturitySection`, so wiring the real navigation is one edit rather than a hunt through every section.

Layout: the trend card flexes while the offender card holds Figma's fixed 290px, stacking below a 720px container-query width — keyed to the section's own width, like `TopOffendersSection`'s `ChartGrid`, because it's the chatbot panel toggling that changes this column's width, not the viewport. Section and card-row gaps are both 16px (`gap={4}`), matching the frame.

---

### PpmSection

**Path:** `src/components/quality/PpmSection.tsx` · `'use client'`

| Prop | Type | Default |
|---|---|---|
| `filters` | `FilterParams` | `{}` |

Incoming Material PPM section. Fetches `usePpmDetail()` (mocked `GET /kpis/kpi-ppm`), maps the aggregate row + `byCommodity` breakdown into `TrendRow[]` (extracting `.ppm` from each `monthly` entry), and renders through `QualityTrendSection`. The "Whirlpool" aggregate-row label is a display constant here, not part of the fetched detail. See `specs/features/SPM-128-quality-page/SPM-130-quality-ppm-cal.md`.

---

### CalSection

**Path:** `src/components/quality/CalSection.tsx` · `'use client'`

| Prop | Type | Default |
|---|---|---|
| `filters` | `FilterParams` | `{}` |

CAL A/AA – PPM section. Same structure as `PpmSection`: fetches `useCalDetail()` (mocked `GET /kpis/kpi-cal`), maps the aggregate row + `byRegion` breakdown into `TrendRow[]` (extracting `.calCount` from each `monthly` entry), and renders through `QualityTrendSection`.

---

### ProductsOnHoldChart

**Path:** `src/components/quality/ProductsOnHoldChart.tsx` · `'use client'`
**Barrel:** none (feature-scoped)

| Prop | Type | Notes |
|---|---|---|
| `byMonth` | `ProductsOnHoldMonthRow[]` | Month rows in reporting order, oldest first |
| `carryOver2025` | `number` | A single 2025 figure — **drawn in the first month group only** |

The grouped bar chart behind each Products on Hold card (Figma `804:26188`–`804:26191`, SPM-132). Three series per month: 2025 Carry Over (`var(--color-yellow-mid)`), Full Month (`primary.main`), EOM (`secondary.main`). 198px plot, dotted gridlines, legend below, axis colours from `useTheme()`.

Carry-over is left `undefined` on every month but the first, so Recharts paints no bar there — matching the frame's empty slots. A bar per month would misrepresent a single scalar as a monthly series; `ProductsOnHoldChart.test.tsx` pins this.

**Deliberately not a generic `GroupedBarChart`.** The three series are fixed and named, and the carry-over rule above is section-specific, so a generic version would be a thin Recharts wrapper with a quirk bolted on. Generalise if a second grouped-bar section appears.

Chrome-free — the card supplies the surface. **`.Skeleton`** holds the plot height with five bar placeholders.

---

### ProductsOnHoldCard

**Path:** `src/components/quality/ProductsOnHoldCard.tsx` · `'use client'`
**Barrel:** none (feature-scoped)

| Prop | Type | Notes |
|---|---|---|
| `scope` | `ProductsOnHoldScope` | `GLOBAL` / `NAR` / `LAR` / `FPS_ONLY` |
| `byMonth` | `ProductsOnHoldMonthRow[]` | Passed through to the chart |
| `carryOver2025` | `number` | Passed through to the chart |

`CardSurface` + a plain 14px scope label + `ProductsOnHoldChart`. No divider and no footer — unlike `ContentCard`, this card's frame is just a titled panel around the plot.

Card titles (`Global (FPS & Components)`, `NAR (FPS & Components)`, `LAR (FPS & Components)`, `FPS`) come from a `SCOPE_LABELS` map here rather than the payload — labels are a layout concern, the same call `QualitySections` makes for section titles.

**`.Skeleton`** takes `scope` and renders the real label (page structure, known before the fetch), shaping only the chart.

---

### ProductsOnHoldSection

**Path:** `src/components/quality/ProductsOnHoldSection.tsx` · `'use client'`
**Barrel:** none (feature-scoped)

| Prop | Type | Default |
|---|---|---|
| `filters` | `FilterParams` | `{}` |

Products on Hold section (Figma `804:26181`, SPM-132). Fetches `useProductsOnHold()` (mocked `GET /kpis/kpi-products-on-hold`, one entry per segment scope) and renders a card per entry, plus all four §14 states.

**The one Quality section whose header carries no action button** — `804:26182` is divider–title–divider only. A regression test asserts the absence.

Layout: 4 → 2 → 1 columns via container queries on the section's own width (the `QualityTrendSection` technique — the chatbot panel, not the viewport, changes this column's width). The loading state renders the full four-card row so the footprint doesn't shift.

---

### ExhibitsCard

**Path:** `src/components/quality/ExhibitsCard.tsx` · `'use client'`
**Barrel:** none (feature-scoped)

| Prop | Type | Notes |
|---|---|---|
| `exhibits` | `QualityExhibitsKpi` | One region's status breakdown |

`CardSurface` + a full-bleed `secondary.main` band carrying `exhibits.region` in white + a `DonutChart` (Figma `804:26272`–`804:26274`, SPM-132). The band is why this card doesn't reuse `ContentCard` — it replaces the title-over-a-divider chrome entirely. `overflow="hidden"` on the surface clips the band to the 12px corners rather than giving it its own radius.

Owns the status→colour map, read from the theme so Recharts gets resolved strings: `success.main` (Completed) · `secondary.main` (On going) · `error.main` (Delayed) · `warning.main` (Disposition) · `divider` (Not started).

Rendered as `<section aria-label="{REGION} exhibits">` so each card in the row is individually addressable.

**`.Skeleton`** takes `region` and renders the real band, shaping only the donut.

---

### ExhibitsSection

**Path:** `src/components/quality/ExhibitsSection.tsx` · `'use client'`
**Barrel:** none (feature-scoped)

| Prop | Type | Default |
|---|---|---|
| `filters` | `FilterParams` | `{}` |

Quality Exhibits section (Figma `804:26265`, SPM-132). Fetches `useExhibits()` (mocked `GET /kpis/kpi-exhibits`, one entry per region) and renders a donut card per entry, plus all four §14 states. Header carries the disabled `DEEP DIVE` stub (`804:56849`), same convention as `QualityTrendSection`.

Layout: 3 → 1 columns via a container query.

> **Not merged with `ProductsOnHoldSection`.** Unlike PPM/CAL — structurally identical, hence the shared `QualityTrendSection` — these two share only "a row of cards": different headers, card contents, column counts, and one has an action button while the other doesn't. A shared shell would abstract over a coincidence.

---

### PiqMaturitySection

**Path:** `src/components/quality/PiqMaturitySection.tsx` · `'use client'`
**Barrel:** none (feature-scoped)

| Prop | Type | Default |
|---|---|---|
| `filters` | `FilterParams` | `{}` |

PIQ Maturity (NPI Projects) section (Figma `804:26192`, SPM-133). Fetches `usePiqMaturity()` (mocked `GET /kpis/kpi-piq-maturity`) and renders one full-width `KpiTrendTable` at `unit="PERCENT"` — the aggregate "Global" row (the payload's top-level values) over one row per `byRegion` entry (NAR, LAR) — plus all four §14 states. Header carries the shared disabled `DEEP_DIVE` stub (`804:56708`).

> **The only Quality section with no card chrome.** Figma wraps the table in a plain 8px-radius `#dee0e3` panel, which `DataTable`'s own `TableContainer` already draws — there is no card title and no "As of …" footer, so no `ContentCard` here. A regression test pins this.

The trailing column label comes from `formatShortMonth(detail.reportingPeriod)` rather than from the last `monthly` point, because `PiqMaturityKpi.monthly` is a bare `number[]` (PPM's is `{ period, ppm }` rows).

> **Not merged with `QualityTrendSection`.** That component hardcodes the two-`ContentCard` row (wide table + Top Offenders list) that PIQ has neither half of. The genuine overlap — the table itself — is shared via `KpiTrendTable`, which is where the duplication actually was.
