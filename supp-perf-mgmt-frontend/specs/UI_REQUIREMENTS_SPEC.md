# UI Requirements Specification

**Version:** 0.3
**Status:** Draft — Design in Progress
**Last Updated:** 2026-07-24
**Figma Source:** [Supplier Performance Management Dashboard](https://www.figma.com/design/XDBgP7IlEw9d9xvIEinGxM/Supplier-Performance-Management-Dashboard?node-id=508-9818)

---

## Purpose

This document defines **how the UI behaves** — component states, interaction rules, conditional rendering logic, navigation flows, and empty/loading/error handling — for each dashboard view.

It is the complement to:

- `VIEW_DATA_MAP_SPEC.md` — *what data* each view displays
- `DATA_MODEL_SPEC.md` — *the shape* of that data
- `API_SPEC.md` — *how* to fetch it
- Figma — *how it looks* visually

This spec is filled in incrementally as Figma views are finalised. Sections for views not yet fully designed are marked **Design in progress**.

Related specifications:

- `PRD-frontend.md` — architecture constraints, component strategy, accessibility requirements
- `FILTER_SPEC.md` — filter schema and URL encoding *(pending)*
- `COMPONENT_INVENTORY.md` — authoritative shared UI component specs (props, states, usage)
- `specs/features/SPM-91-app-layout.md` — application shell architecture and layout component specs

---

## Conventions

- **TBD** — not yet determined; do not implement until resolved.
- **Design in progress** — Figma frame exists but is not finalised.
- All pixel values are from Figma at 1440px viewport width (design base).
- Responsive behaviour below 1440px is TBD unless noted.

---

## 1. Design System & Code Conventions

### 1.1 Color Architecture — Three-Tier System

Colors are managed across three layers. **Never bypass the hierarchy or hardcode hex values in components.**

#### Tier 1 — MUI Palette (semantic, theme-aware)

Defined in `src/lib/theme.ts`. Referenced in components as palette path strings (e.g. `'primary.main'`, `'warning.light'`). Use these for all colors that carry a semantic role across the app.

| Palette path | Hex | Semantic role |
|---|---|---|
| `primary.main` | `#0d436b` | Header bg, page titles, primary text |
| `primary.contrastText` | `#edf4fc` | Text/icons on primary background |
| `secondary.main` | `#00a0dd` | Active tab underline, accent, chart primary |
| `secondary.contrastText` | `#ffffff` | Text/icons on secondary background |
| `background.default` | `#edf4fc` | Page background (iceBlue) |
| `background.paper` | `#ffffff` | Card and panel backgrounds |
| `text.primary` | `#484948` | Primary body text |
| `text.secondary` | `#767777` | Secondary / muted labels |
| `error.main` | `#d32f2f` | Error states, notification badge, over-plan cell rule + value |
| `error.light` | `#fdeded` | Over-plan status cell fill |
| `success.main` | `#2e7d32` | On Track text, success states, on-plan cell rule + value |
| `success.light` | `#edf7ed` | On-plan status cell fill |
| `warning.main` | `#ef6c00` | Watch badge warning icon, near-plan cell rule + value |
| `warning.light` | `#fff4e5` | KPI Alert banner background, near-plan status cell fill |
| `warning.dark` | `#663c00` | KPI Alert banner text |
| `divider` | `#dee0e3` | Card borders, section dividers |
| `common.white` | `#ffffff` | Explicit white (e.g. icon on colored bg) |
| `action.disabled` | MUI default | Disabled icon/text color |
| `action.disabledBackground` | MUI default | Disabled button/control background |

#### Tier 2 — CSS Custom Properties (domain/status colors)

Defined in `src/app/globals.css`. Referenced in components as `var(--color-*)` strings. Used for status and domain-specific colors that don't belong in the MUI palette.

| Variable | Hex | Usage |
|---|---|---|
| `--color-green` | `#6aa342` | On Track status dot |
| `--color-green-light` | `#f1f8ec` | On Track chip background |
| `--color-green-lightest` | `#e8f5e9` | On Track card tint |
| `--color-amber` | `#eeb111` | Watch status dot, AI assistant FAB |
| `--color-amber-mid` | `#c98f00` | Amber hover state |
| `--color-amber-dark` | `#7a5200` | Watch text on light background |
| `--color-amber-light` | `#fff8e1` | Watch chip background |
| `--color-yellow-mid` | `#f3d04f` | Chart series fill — Products on Hold "2025 Carry Over" bars (Figma `brand/accent-yellow-mid`). A lighter, flatter yellow than `--color-amber`, which is the watch-status indicator |
| `--color-orange` | `#e08650` | At Risk status dot |
| `--color-red-dark` | `#c62828` | At Risk text on light background |
| `--color-red-light` | `#fdecea` | At Risk chip/card background |
| `--color-gray` | `#d1d3d4` | Table row separators (Figma "GRAY") |
| `--color-gray-light` | `#f5f5f5` | Neutral chip/card tint |
| `--color-gray-lightest` | `#f5f6f7` | Table header fill (Figma "EXTRA LIGHT GRAY") |
| `--color-alert-border` | `#ffe0b2` | KPI Alert banner border |

#### Tier 3 — Token Object (theme-internal only)

The `tokens` object in `src/lib/theme.ts` is the single source of truth for hex values. It drives the MUI palette and the CSS variables above. **Components must never import `tokens` directly.** It is only for use inside `theme.ts`.

#### Decision rule

1. Does the color have a semantic role covered by the MUI palette? → use the palette path.
2. Is it a domain/status color not in the palette? → use `var(--color-*)` from `globals.css`.
3. If the color doesn't exist in either yet, add it to `globals.css` and the `tokens` object (and update the palette if it warrants a semantic slot).

---

### 1.2 Layout Dimensions (CSS Variables)

Defined in `src/app/globals.css`. Used in `calc()` expressions and direct CSS values across layout components. Never hardcode these dimensions as pixel literals.

| Variable | Default | xl (≥1536px) | Usage |
|---|---|---|---|
| `--header-height` | `64px` | `64px` | AppBar height |
| `--nav-height` | `59px` | `59px` | Navigation tab bar height |
| `--content-padding` | `12px` | `32px` | Horizontal page padding |

---

### 1.3 Spacing & Border Radius

Use MUI's native spacing and `theme.shape.borderRadius` system. Never define custom spacing or radius CSS variables.

**Spacing:** `theme.spacing` is set to `4`. So `gap={2}` = 8px, `p={3}` = 12px, `px={4}` = 16px, `py={6}` = 24px, `p={8}` = 32px.

**Border radius in `sx`:** Numbers are multiplied by `theme.shape.borderRadius` (4). So:
- `borderRadius: 1` = 4px (chips, small badges)
- `borderRadius: 2` = 8px (buttons, input elements)
- `borderRadius: 3` = 12px (text fields)
- `borderRadius: 5` = 20px (pill chips)
- `borderRadius: "50%"` = circle (avatar, icon badge)

**Exception:** `lineHeight` must remain a string with a unit (e.g. `lineHeight: '24px'`). Writing `lineHeight: 24` means 24× the font size, not 24px.

---

### 1.4 Typography Scale

Defined in `src/lib/theme.ts`. Use MUI `variant` props wherever the scale fits rather than overriding `fontSize` manually.

| Variant | Font | Size | Weight | Tracking |
|---|---|---|---|---|
| `h1` | Roboto | 24px | 400 | — |
| `h2` | Roboto | 20px | 500 | 0.15px |
| `h3` | Roboto | 16px | 500 | — |
| `body1` | Roboto | 14px | 400 | — |
| `body2` | Roboto | 12px | 400 | — |
| `button` | Roboto | 13px | 500 | 0.46px (UPPERCASE) |
| `overline` | Roboto | 12px | 400 | 1px |
| Table header | Open Sans | 12px | 600 | — |
| Table body | Open Sans | 12px | 400 | — |

Tab labels are uppercase (enforced by the MUI `MuiTab` component override).

---

### 1.5 MUI Component Usage Rules

#### Which MUI components accept direct system props

MUI v6 documents system props as direct props only on these three layout primitives — confirmed via the v6 API reference:

| Component | Direct system props |
|---|---|
| `Box` | ✅ supported |
| `Typography` | ✅ supported |
| `Stack` | ✅ supported |

All other MUI components (`AppBar`, `Toolbar`, `Tabs`, `Tab`, `Card`, `CardContent`, `Chip`, `Button`, `IconButton`, `Avatar`, `Badge`, `Alert`, `FormControl`, `Select`, `MenuItem`, `Menu`, `TextField`, `Table*`, `Fab`, `Skeleton`, `CircularProgress`, etc.) do **not** document this capability. Use `sx` for all styles on those components.

#### Prefer direct props over `sx` (Box, Typography, Stack only)

Move static style props to direct component attributes instead of the `sx` object. Use `sx` only when the value is dynamic, conditional, or requires a pseudo-selector.

**Critical rule:** even when `sx` is required for one property (e.g. a pseudo-selector or dynamic value), all other static properties must still be direct props. `sx` must contain **only** the things that cannot be direct props.

```tsx
// Correct — all static as direct props
<Box display="flex" alignItems="center" gap={2} px={3} bgcolor="background.paper" />

// Avoid — static props buried in sx
<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 3, bgcolor: 'background.paper' }} />

// sx required (dynamic value)
<Box sx={{ width: isCollapsed ? 0 : width }} />

// sx required (pseudo-selector)
<Box sx={{ '&:hover': { bgcolor: 'action.hover' } }} />

// Correct — statics as direct props, only pseudo-selector in sx
<Box
  position="absolute"
  width={8}
  display="flex"
  alignItems="center"
  sx={{ cursor: 'col-resize', '&:hover .dots': { opacity: 1 } }}
/>

// Wrong — mixes static and pseudo inside sx
<Box
  sx={{
    position: 'absolute',
    width: 8,
    display: 'flex',
    alignItems: 'center',
    '&:hover .dots': { opacity: 1 },
  }}
/>

// Correct — one dynamic prop in sx, statics stay direct
<Box display="flex" flexDirection="column" gap={2} sx={{ minHeight }}>

// Wrong — static props pollute sx alongside one dynamic value
<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minHeight }}>
```

#### Use MUI palette paths, not CSS variables, for palette colors

```tsx
// Correct
<Box bgcolor="warning.light" color="warning.dark" />

// Avoid
<Box bgcolor="var(--color-alert-bg)" /> // wrong: this color IS in the palette
```

#### Numeric values for pixel equivalents

Use numbers instead of string pixel values where MUI accepts them.

```tsx
// Correct
<Typography fontSize={13} />       // 13px
<SendIcon sx={{ fontSize: 16 }} /> // 16px
borderRadius: 2                    // 8px via theme.shape.borderRadius

// Avoid
<Typography fontSize="13px" />
borderRadius: '8px'
```

#### Deprecated MUI APIs

- `inputProps` on `TextField` → use `slotProps.htmlInput`
- `InputProps` on `TextField` → use `slotProps.input`

---

### 1.6 Breakpoints

Custom breakpoints (defined in `theme.ts`):

| Key | Value |
|---|---|
| `xs` | 0px |
| `sm` | 600px |
| `md` | 900px |
| `lg` | 1280px |
| `xl` | 1536px |

Note: `lg` is 1280px (not MUI's default 1200px). The main design base is 1440px (between `lg` and `xl`).

---

## 2. Shared Layout

> **Moved.** Authoritative implementation spec for AppHeader, AppNavigation, ChatbotPanel, HeaderDate, NotificationButton, and UserAvatar is in [`specs/features/SPM-91-app-layout.md`](features/SPM-91-app-layout.md). The content below is kept as a reference snapshot.

**Applies to:** All internal views (Summary, Quality, Delivery, Suppliers, Comparison, KPI Detail pages).
**Does not apply to:** Supplier Limited View (signed-URL access).

### Structure

```
┌─────────────────────────────────────────────────────┐
│  AppHeader (64px, position: fixed)                  │
├─────────────────────────────────────────────────────┤
│  AppNavigation (59px, position: fixed)              │
├──────────────────────────────────┬──────────────────┤
│                                  │                  │
│  Main Content Area               │  ChatbotPanel    │
│  (fluid, flex: 1)                │  (resizable)     │
│  bgcolor: background.default     │  bgcolor: paper  │
│                                  │                  │
└──────────────────────────────────┴──────────────────┘
```

The content row starts at `calc(--header-height + --nav-height)` via `mt` on the flex row. `minHeight: calc(100vh - ...)` ensures it fills the viewport.

- Page background: `background.default` (`#edf4fc`).
- Content padding: `var(--content-padding)` — 12px at `sm`, 32px at `xl` (≥1536px).

### 2.1 AppHeader

**Component:** `src/components/layout/AppHeader.tsx`
**Height:** `var(--header-height)` = 64px, `position: fixed`
**Background:** `primary.main` (`#0d436b`)

| Element | Component | Behaviour |
|---|---|---|
| Whirlpool logo | `next/image` | Static, 90×30px. Not a link. |
| App title | `Typography h3` | "Supplier Performance Management". `fontWeight={400}`, `lineHeight={1.75}`, `letterSpacing="0.15px"`. Left border separator. |
| Spacer | `Box flexGrow={1}` | Pushes right-side elements to the right. |
| Date display | `HeaderDate` | Current date formatted as "Mon, Jun 22, 2026". Calendar icon + `Typography fontSize={13}`. |
| Notification bell | `NotificationButton` | `IconButton` with `Badge`. Error color badge. `fontSize: 12` in badge. |
| User avatar | `UserAvatar` | 32px circle, initials from `user.firstName[0] + user.lastName[0]` (falls back to `displayName.slice(0,2)`). Clicking opens a `Menu` with "Log Out". |

**UserAvatar menu:**
- Anchor: the avatar itself (`aria-haspopup`, `aria-controls`).
- `anchorOrigin: { vertical: 48, horizontal: 'right' }`, `transformOrigin: { vertical: 'top', horizontal: 'right' }`.
- Single menu item: Log Out (`LogoutIcon` + "Log Out"). Calls `logout()` from `auth.service`, then `router.push('/login')`.

### 2.2 AppNavigation

**Component:** `src/components/layout/AppNavigation.tsx`
**Height:** `var(--nav-height)` = 59px, `position: fixed`, `top: var(--header-height)`
**Background:** `background.paper` (white)
**Bottom border:** `1px solid divider`

| Tab label | Route | Active state |
|---|---|---|
| SUMMARY | `/` | `secondary.main` text + underline indicator |
| QUALITY | `/quality` | — |
| DELIVERY | `/delivery` | — |
| ACTIVE SUPPLIERS | `/suppliers` | — |

- Active tab detection: exact match for `/`, `startsWith` for all others.
- Inactive tab color: `text.secondary`.
- Tab typography: 14px Roboto Medium, uppercase, `letterSpacing: '0.4px'` (set via `MuiTab` theme override — not per-instance).
- `zIndex: t.zIndex.appBar` (via `sx` callback — required because it's a dynamic theme value).
- **Animated indicator:** MUI's built-in indicator is hidden (`TabIndicatorProps={{ sx: { display: 'none' } }}`). A custom `Box` (2px tall, `position: absolute, bottom: 0`) is positioned using `getBoundingClientRect()` relative to a `position: relative` wrapper. On hover it slides to the hovered tab (`divider` color); on mouse-leave it returns to the selected tab (`secondary.main`). Hovering the already-selected tab keeps `secondary.main`. Transition: `left 200ms ease-in-out, width 200ms ease-in-out, background-color 150ms ease-in-out`. Position is measured via `useLayoutEffect` (fires before paint) using per-tab `ref` callbacks (`HTMLDivElement`) and a `wrapperRef` on the containing `Box`.

### 2.3 ChatbotPanel

**Component:** `src/components/layout/ChatbotPanel.tsx`
**Hook:** `src/hooks/usePanelResize.ts`
**Empty state:** `src/components/ui/ChatSuggestions.tsx`

#### Width and resize

- Min width: 360px at `sm`, 440px at `xl` (≥1536px). Handled by `usePanelResize`.
- Max width: `Math.floor(window.innerWidth / 2)`.
- Drag handle: 8px wide invisible strip on the left edge. `cursor: col-resize`. `onMouseDown` starts the resize.
- Transition: `theme.transitions.create('width', easeInOut)` when not dragging. **Disabled during drag** (`isResizing` state disables the transition so the border tracks the mouse 1:1).
- Initial width: driven by `--chatpanel-default-width` CSS variable (360px default, 440px at `@media (min-width: 1536px)`) so the correct value is painted from the first SSR frame with no JS flash. `usePanelResize` JS state takes over only after the user's first drag (tracked via `hasUserResized` in `ChatbotPanel`). `handleDragStart` reads `panelRef.current.offsetWidth` from the DOM so drag always starts from the actual rendered width.

#### Collapse / expand

- Collapsed: `width: 0` on the outer `aside`. Inner wrapper maintains its full width — content is clipped by `overflow: hidden`, not reflowed.
- Collapse trigger: `CloseIcon` button in the panel header.
- Re-expand trigger: amber `Fab` rendered via `<Fade in={isCollapsed} unmountOnExit>`, `position: fixed`, bottom-right corner. `bgcolor: var(--color-amber)`, hover: `var(--color-amber-mid)`.

#### States

| State | Behaviour |
|---|---|
| Empty (no messages) | Renders `<ChatSuggestions>` — heading, subtitle, 4 suggestion chips. |
| Active conversation | Message thread. User messages: right-aligned, `primary.main` bg. Assistant: left-aligned, `background.default` bg. |
| Loading | "Thinking…" text below last message. |

#### Header

- Amber circle badge (36×36px, `borderRadius: "50%"`, `bgcolor: var(--color-amber)`) with `AutoAwesomeIcon` (white, 18px).
- Title: "Supplier AI Assistant", `color='primary'`, responsive `fontSize` (20px sm → 24px xl).
- Subtitle: "Connected to live supplier performance data", `color='secondary'`.
- Close button: `CloseIcon`, `color: text.secondary`.

#### Input area

- `TextField` — fixed height (44px at `sm`, 62px at `xl`), single-line, `size="small"`.
- `slotProps.htmlInput`: `aria-label`.
- `slotProps.input.endAdornment`: `IconButton` with `SendIcon`. `bgcolor: secondary.main`, `borderRadius: 2` (8px), hover `secondary.dark`, disabled uses `action.disabledBackground` / `action.disabled`.
- TextField root: `borderRadius: 3` (12px), `fontSize: 13`. Set via `sx['& .MuiOutlinedInput-root']`.
- Enter key (without Shift) submits. Shift+Enter inserts a newline.
- Footer caption: `fontSize={12}`, `color="text.secondary"`, centered.

#### ChatSuggestions component

Props: `scope: ChatScope`, `onSelect: (text: string) => void`.

- Heading: `color="primary"`, `fontSize={{ sm: 28, xl: 34 }}`.
- Subtitle: `color="secondary"`, `fontSize={{ sm: 12, xl: 14 }}`, constrained `width={{ sm: 300, xl: 350 }}`.
- Chips: `variant="outlined"`, `borderRadius: 5` (20px), `fontSize: 13`, `borderColor: divider`. Hover: `borderColor: primary.main`.
- Chip gap: `{ sm: 1.5, xl: 3 }` (6px → 12px).

---

## 3. Shared UI Components

> **Moved.** Authoritative specs for all shared UI components (StatusChip, HighlightCard, AlertBanner, DataTable, KpiCard, FilterBar, FilterDropdown, EmptyState, ErrorState, LoadingState, HeaderDate, NotificationButton, UserAvatar, ChatSuggestions) are in [`specs/COMPONENT_INVENTORY.md`](COMPONENT_INVENTORY.md). The content below is kept as a reference snapshot.

These components are implemented and used across multiple views. This section documents their current API and visual spec.

### 3.1 StatusChip

**Component:** `src/components/ui/StatusChip.tsx`

Props: `status: KpiStatus`, `size?: 'small' | 'medium'` (default `'small'`).

`KpiStatus` values: `'GREEN'` | `'YELLOW'` | `'RED'` | `'NEUTRAL'`.

| Status | Label | Background | Text color | Dot color |
|---|---|---|---|---|
| `GREEN` | On Track | `var(--color-green-light)` | `success.main` | `var(--color-green)` |
| `YELLOW` | Watch | `var(--color-amber-light)` | `var(--color-amber-dark)` | `var(--color-amber)` |
| `RED` | At Risk | `var(--color-red-light)` | `var(--color-red-dark)` | `var(--color-orange)` |
| `NEUTRAL` | Neutral | `var(--color-gray-light)` | `text.primary` | `text.secondary` |

- `borderRadius: 1` (4px). Height: 20px (small) / 24px (medium). `fontSize: '11px'`, `fontWeight: 500`.
- Status dot: `::before` pseudo-element, 6×6px circle, left-padded at `ml: 0.75`.
- No hex literals — all colors reference palette paths or CSS vars.

### 3.2 HighlightCard

**Component:** `src/components/ui/HighlightCard.tsx`

Props: `title: string`, `badge: string`, `variant?: 'status' | 'trend'`, `status?: KpiStatus` (default `'NEUTRAL'`).

- Uses MUI `Card` (theme override: 1px `divider` border, `borderRadius: 8`, no box-shadow).
- Badge chip: `bgcolor` and `color` from `STATUS_COLORS` map (same color logic as StatusChip but without a dot). `borderRadius: 1`, `fontSize: '11px'`, `fontWeight: 600`.
- No hex literals — all colors reference palette paths or CSS vars.

### 3.3 AlertBanner

See section 5.1 for full spec.

### 3.4 HeaderDate

**Component:** `src/components/ui/HeaderDate.tsx`

- Renders current date via `Date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })`.
- Layout: `Box display="flex" alignItems="center" gap={2}` — `CalendarTodayIcon` (16px, `color="inherit"`) + `Typography fontSize={13} color="inherit" suppressHydrationWarning`.
- Requires `'use client'`. Holds date in `useState(() => new Date())`. A `useLayoutEffect`-free `scheduleNextMidnight` function computes ms until `00:00:00` of the next calendar day and sets a `setTimeout`; on fire it updates state and re-schedules. Cleanup clears the pending timeout on unmount. `suppressHydrationWarning` handles the rare SSR/client date mismatch at midnight.

### 3.5 NotificationButton

**Component:** `src/components/ui/NotificationButton.tsx`

Props: `count?: number` (default 0).

- `IconButton size="small" color="inherit"` wrapping a `Badge`.
- `Badge color="error"`, `badgeContent={count}`. Badge font: `fontSize: 12`, `letterSpacing: '0.14px'` via `sx['& .MuiBadge-badge']`.
- `NotificationsIcon fontSize: 28` (sized to visually match the 32px `UserAvatar`).
- Hover: `bgcolor: primary.dark` — darkens the AppBar background, the standard Material Design pattern for icon buttons on a colored surface.

### 3.6 UserAvatar

**Component:** `src/components/ui/UserAvatar.tsx`

Props: `user?: User | null`, `size?: number` (default 32).

- `Avatar` — `bgcolor: primary.contrastText`, `color: primary.main`, `fontSize: 20`, `fontWeight: 400`, `letterSpacing: '0.14px'`. Hover: initials shift to `primary.dark` and a `box-shadow: 0 0 0 4px primary.dark` ring appears outside the circle (visually 40×40px from 32×32px default), using the `sx` theme callback form to resolve the palette hex. Transition: `color 150ms, box-shadow 150ms`.
- Initials: `firstName[0] + lastName[0]` (uppercased) if both exist; otherwise `displayName.slice(0, 2)`.
- Clicking opens a `Menu` anchored to the avatar.
- Menu: `anchorOrigin: { vertical: 48, horizontal: 'right' }`, `transformOrigin: { vertical: 'top', horizontal: 'right' }`. Paper: `borderRadius: 1`, `minWidth: 125`.
- Single item: "Log Out" with `LogoutIcon fontSize="medium"`. `ListItemText` uses `slotProps.primary.sx` for `fontSize: 16`, `lineHeight: 1.5`, `letterSpacing: 0.15`. `MenuItem` overrides `&.Mui-focusVisible` to `bgcolor: background.paper` (with `&.Mui-focusVisible:hover` restoring `action.hover`) to prevent the darker auto-focus background on first open.
- On click: calls `logout()` (`POST /auth/logout`), then `router.push('/login')`.
- Requires `'use client'` (uses `useState`, `useRouter`).

---

## 4. Global Filter Bar

> **Moved.** Authoritative FilterBar and FilterDropdown component specs — including the Supplier/Supplier Code implementation gap — are in [`specs/COMPONENT_INVENTORY.md`](COMPONENT_INVENTORY.md). The content below is kept as a reference snapshot.

**Appears on:** All KPI detail pages (PPM, CAL, etc.). Presence on Summary/Quality/Delivery top-level views: TBD.

**Design confirmed on:** PPM Inner KPI Page (node `318:6889`).

### Filter Controls (in order)

| # | Label | Default | Type | Dimensions |
|---|-------|---------|------|------------|
| 1 | Region | All | Dropdown | — |
| 2 | Plant | All | Dropdown | — |
| 3 | Commodity | All | Dropdown | — |
| 4 | Subcommodity | All | Dropdown | — |
| 5 | Supplier | All | Dropdown | — |
| 6 | Supplier Code | All | Dropdown | — |
| 7 | Supplier Loc. | All | Dropdown | — |
| 8 | Month | Jun (current) | Dropdown | — |
| 9 | Year | 2026 (current) | Dropdown | — |
| 10 | Category | All | Dropdown | — |
| 11 | Focus Supplier | All | Dropdown | — |

- All dropdowns show `ExpandMoreFilled` icon on the right.
- Default label when no selection: "All" (or current month/year).
- When a filter has an active non-default value, it shows the selected value as the label.
- Changing any filter triggers a data re-fetch for the active view.
- Filter state is **encoded in the URL** (see `FILTER_SPEC.md`) to support shareability and reload-safe links.

### Action Buttons (right of filter bar or page header)

| Button | Icon | Behaviour |
|--------|------|-----------|
| FILTERS | FilterListFilled | Opens Filters Drawer (full set of filter controls). |
| EXPORT | SaveAltFilled | Exports current view data. Format TBD. |

### Filters Drawer

- Slides in from the right (or bottom — TBD).
- Contains the full set of filter controls (same 11 as above, but with more space / multi-select options — TBD).
- "Apply" action re-fetches data with selected filters.
- "Reset" / "Clear all" action resets all filters to defaults — TBD.
- Closes on backdrop click or explicit close action.

### "Customize KPI's" Button

- Appears on the Summary and Quality views (confirmed in design).
- Icon: `DragIndicatorFilled` + chevron right.
- Opens a dropdown or drawer to select which KPI cards are shown — behaviour TBD.
- Label: "CUSTOMIZE KPI'S" (uppercase, 13px Roboto Medium).

### View Toggle (Summary view)

Two-option toggle bar for changing the breakdown dimension of charts/tables:

| Option | Behaviour |
|--------|-----------|
| Global / Region / Commodity / Country | Shows global/regional/commodity breakdown (default active state: dark blue background) |
| Supplier / Plant | Shows per-supplier or per-plant breakdown (inactive: white background) |

- Only one option active at a time.
- Switching re-renders the data tables/charts below without a page navigation.

---

## 5. Summary View

**Route:** `/`
**Figma node:** `55:8385` (Chatbot Closed), `55:27467` (Empty State)
**Design status:** Work in progress

> **⚠ Partially superseded — do not implement from this section without reading `specs/features/SPM-104-summary-shell-quality.md` first.**
>
> A newer Summary design (screenshot, 2026-07-29) diverges from the content below. Confirmed with the product owner:
>
> | This section says | Current design | Status |
> |---|---|---|
> | Two Highlight Cards (Quality, Suppliers) — §4.1 | Absent | **Dropped.** Not built. |
> | "Suppliers Needing Attention (N of N)" — §4.4 | Absent | **Dropped.** Closes `OQ-API-17` — no endpoint existed. |
> | 2-column grid of 9 individual bordered KPI cards — §4.2 | One bordered section card per group, containing a 6-column divider grid of tiles | **Rebuilt** as `SectionCard` + `KpiCard variant="embedded"` |
> | Three vertical bar charts — §4.3 | Five horizontal bar charts | **Pending** — deferred to the Top Offenders card |
> | (not described) | Three section cards: Quality Performance, Delivery Performance, Top Offenders — each with a filter row and an "As of …" footer | **New** |
>
> §4.2's `tiles="1"|"2"|"3"` variants remain valid but only produce region-labelled columns; cards with custom labels use the `metrics[]` payload instead.
>
> This section is **not rewritten yet** — doing so from a screenshot would bake in estimated measurements. The rewrite is a follow-on card, to be done once Figma MCP access is restored and exact values can be pulled.

### Layout

- Page title: **"Portfolio Snapshot"** — Roboto Regular 24px, `--semantic/primary`.
- Subtitle: **"Steel Forgings · All regions"** — Roboto Regular 16px, `--semantic/secondary`. Reflects active commodity + region filters.
- Two highlight cards below the title (Quality, Suppliers). 2-column grid.
- KPI card grid below. 2-column grid, 16px gap.
- Top Offenders bar charts below the KPI grid.
- Action buttons (CUSTOMIZE KPI'S, FILTERS, EXPORT) in the page header area, right-aligned.

### 4.1 Highlight Cards

Two summary cards showing headline status:

| Card | Label | Badge type | Sample badge |
|------|-------|-----------|--------------|
| Quality | "Quality" | Status chip | "At Risk" (red) |
| Suppliers | "Suppliers" | Trend chip | "Improved" (green) |

- Chip colours: At Risk → `--semantic/error/main`; Improved → `--semantic/success/main`.
- Card background: `--semantic/surface`.
- Card border: 1px `--semantic/border`.
- Border radius: `--radius/medium`.

### 4.2 KPI Cards

Rendered in a 2-column grid. Each card has a `tiles` prop controlling layout variant:

| Variant | `tiles` | Layout |
|---------|---------|--------|
| Standard | `"3"` | Three metric columns (Global, NAR, LAR) |
| Two-column | `"2"` | Two metric columns + second row |
| Single | `"1"` | One large value + subtitle |

**KPI cards confirmed in design (Summary view):**

| KPI | Variant | Sample values |
|-----|---------|---------------|
| Rejection PPM | `tiles="3"` | Global: 850, NAR: 620, LAR: 910 |
| CAL/PPM | `tiles="3"` | Global: 410, NAR: 350, LAR: 480 |
| GSIR | `tiles="1"` | Global: 42, subtitle: "Unique # · FPS & Components" |
| Products on Hold | `tiles="1"` | Global: 17, subtitle: "Unique # · FPS & Components" |
| Cost Recovery | `tiles="2"` | Global YTD: $340k, Conversion: 68% / DTC: 8,800, VMI: 85% |
| PIQ Maturity | `tiles="1"` | Global: 74%, subtitle: "Unique # · FPS & Components" |
| 8Ds | `tiles="3"` | Total Open: 38, Open >90 days: 9, Open >45 days: 15 |
| Risk Rating Components | `tiles="2"` | Qty Not Preferred: 6, Qty New Business on Hold: 3 |
| Risk Rating FPS | `tiles="1"` | Qty Not on Quality: 4 |

**KPI card fields (per card):**

- Card title (KPI name)
- Status chip (On Track / Watch / At Risk) — top right. Hidden when `status` is null.
- Metric columns: each column has a label ("Global", "NAR", "LAR", or custom) + value.
- `tiles="1"` variant also shows a subtitle below the value.
- Card is **clickable** — navigates to the corresponding KPI detail page (e.g. `/quality/ppm`).
- Clicking anywhere on the card (not just the title) triggers navigation.

**KPI card states:**

| State | Behaviour |
|-------|-----------|
| Default | Value + optional status chip |
| Loading | Skeleton placeholder for value area |
| No data | Value shows "—". Status chip hidden. |
| Error | Card shows inline error icon + "Unable to load" message — TBD |

### 4.3 Top Offenders Section

Three bar charts side by side:

| Chart | Colour | Y-axis metric |
|-------|--------|---------------|
| Expedites – By Supplier ($ Value) | `--semantic/secondary` (cyan) | Dollar value |
| Production Lost – Units Lost By Supplier | `--semantic/warning` (orange) | Unit count |
| DTC – Units Lost By Supplier | `--semantic/error/main` (red) | Unit count |

- Each chart shows top 5 suppliers, ranked descending (highest bar first).
- Bar height is proportional to max value in the set (100% = tallest bar).
- Bar width: 32px each.
- Supplier name label below each bar.
- Value label above each bar (Roboto Medium 12px).
- Title: Roboto Medium 14px, 0.15px tracking.

**View toggle** (Global / Region... | Supplier / Plant) controls what dimension these charts break down by.

### 4.4 Suppliers Needing Attention

- Table component ("Suppliers Needing Attention table") shown below the highlight cards.
- Header: "Suppliers Needing Attention (N of N)" — count reflects filtered result.
- Status legend below header: On Track (N) · Watch (N) · At Risk (N). Coloured dots + count.
- Table columns: TBD (design not fully resolved).

### 4.5 Summary Empty State

**Figma node:** `55:27467`

Shown when no data matches the active filters.

- KPI cards area replaced by `KPI's Empty State` component.
- Message and call-to-action: TBD from design.
- Top Offenders charts not rendered.
- Highlight cards still render with "—" values.

---

## 6. Quality View

**Route:** `/quality`
**Figma node:** `64:15428`
**Design status:** Work in progress

### Layout

- Page title: **"Quality"**
- Subtitle: **"Steel Forgings · All regions"** (active filter context)
- Full-width content, no split-panel (chatbot heading appears but main content is full width below nav)
- Sections stack vertically: GSIR → PPM → CAL → Products on Hold → PIQ Maturity → Exhibits → 8Ds → Risk Rating → Focus Supplier

### 5.1 KPI Alert Banner

**Component:** `src/components/ui/AlertBanner.tsx`

Props: `status?: KpiStatus` (default `'YELLOW'`), `message?: string` (default `'KPI Alert'`), `onSeeMore?: () => void`.

- Background: `warning.light` (`#fff4e5`), text: `warning.dark` (`#663c00`), border: `1px solid var(--color-alert-border)`.
- Layout: `role="alert"` Box with flex row — `WarningAmberIcon` (18px) + message `Typography` + `StatusChip` + optional "See More" button + spacer + dismiss `IconButton`.
- "See More": rendered only when `onSeeMore` prop is provided. Styled as a `Typography component="button"` with `textDecoration: 'underline'`.
- Dismiss: `CloseIcon` (16px) `IconButton`. Sets local `dismissed` state to `true`, which renders `null`. Session-local — does not persist.
- `borderRadius: 1` (4px).

### 5.2 Quality KPI Cards

- Two size variants: 607px height (primary) and 549px height (compact).
- Rendered in a single-column full-width layout (one card per KPI at this width).
- Each card contains: title, data table or breakdown, optional chart.

### 5.3 GSIR Section

Five sub-views presented within the Quality view (likely as tabs or stacked sections — TBD):

| Sub-view | Title |
|----------|-------|
| 1 | "GSIR – Global · 12 MIS R12 (Latest Rate Run · 2026_06)" |
| 2 | "GSIR – Global · 5 Stars" |
| 3 | "GSIR – Global · TCQ (YTD Results, $M)" |
| 4 | "GSIR – FPS · 12 MIS R12 (Latest Rate Run · 2026_06)" |
| 5 | "GSIR – MVT · 12 MIS R12 (Latest Rate Run · 2026_06)" |

**Table row groupings (sub-views 1, 2, 4):**
- "GLOBAL OVERALL"
- "TYPE OF DOMESTIC APPLIANCE" → Whirlpool MDA, Whirlpool SDA
- "REGIONAL MDA" → Whirlpool NAR MDA, Whirlpool LAR MDA

**Group row** styling: uppercase, distinct background colour — TBD.
**Data row** styling: standard body text.

**Column headers (sub-view 1 — R12):**
Volume (k units) · Exit rate R18 · Exit rate Dec'25 · 2025 Baseline · YTD Target · Current Result · Current vs PP · YE Target · LOS

**Column headers (sub-view 3 — TCQ):**
YTD 2025 · YTD Plan · YTD 2026 · B/(W) vs Plan · B/(W) vs PY

### 5.4 PPM Monthly Report Section

- Section title: "PPM Monthly Report"
- Subtitle: "Global Supplier Development · Rolling 3-Month View"
- Shows the rolling 3-month aggregate by default.
- Links to PPM detail page (`/quality/ppm`) — TBD trigger (card click, "See More" button, or section title link).

### 5.5 Donut Charts

Three `Donut Card` components in the Quality view — specific KPIs TBD from design.

### 5.6 Products on Hold Section

- Four stacked tables: Global (FPS & Components), NAR, LAR, FPS Only.
- Month columns: Jan'26, Feb'26, Mar'26, Apr'26, May'26 (plus 2025 Carry Over).
- Column headers per table: 2025 Carry Over · Full Month · EOM.

### 5.7 PIQ Maturity Section

- Title: "PIQ Maturity (NPI Projects)"
- Table: rows = Global, NAR, LAR. Columns: 2025 FY · 2026 Plan · 2026 YTD · Rolling (R3) · 12M Trend.
- "12M Trend" column: mini trend chart — type TBD.

### 5.8 Exhibits, 8Ds, Risk Rating, Focus Supplier

Stacked sections. Each follows the same pattern:

| Section | Fields shown |
|---------|-------------|
| Exhibits | **Not this pattern** — three donut cards (one per region), each a status breakdown: Completed · On going · Delayed · Disposition · Not started, with the derived total centered. See below |
| 8Ds | Total Open 2026 · Open > 90 Days · Open > 45 Days |
| Risk Rating Components | Qty Preferred · Qty Not Preferred · Qty New Business on Hold |
| Risk Rating FPS | Qty On Quality · Qty Not on Quality |
| Focus Supplier | Qty of Focus (Global) · Qty of Focus (NAR) · Qty of Focus (LAR) |

- Focus Supplier note: "Is Focus Supplier – see Focus Supplier table for detail" — links to a detail view (TBD).

**Quality Exhibits (SPM-132, Figma `804:26265`).** Three cards in a row, one per region, each a `CardSurface` with a full-bleed `secondary.main` header band carrying the region in white, then a `DonutChart`. Segment colours come from the palette — `success.main` (Completed) · `secondary.main` (On going) · `error.main` (Delayed) · `warning.main` (Disposition) · `divider` (Not started). The section header carries the `DEEP DIVE ›` action.

**Products on Hold (SPM-132, Figma `804:26181`).** Four cards in a row, one per segment scope (`Global (FPS & Components)` · `NAR (FPS & Components)` · `LAR (FPS & Components)` · `FPS`), each a grouped bar chart with three series: 2025 Carry Over (`var(--color-yellow-mid)`, drawn in the first month group only) · Full Month (`primary.main`) · EOM (`secondary.main`). This is the one Quality section whose header has **no** action button.

---

## 7. Delivery View

**Route:** `/delivery`
**Figma node:** `71:2976`
**Design status:** Design in progress — KPI cards visible, table/chart detail not finalised.

### Layout

- Page title: "Delivery"
- Subtitle: active filter context label (same pattern as Quality).
- KPI card grid (same 2-column layout as Summary).
- `DeliveryRegionCard` component with `row2Tiles` prop:

| Variant | `row2Tiles` | Layout |
|---------|-------------|--------|
| Standard | `"3"` | 3 metric tiles per row |
| Compact | `"2"` | 2 metric tiles per row |

- `Bar Chart Card` components — multiple instances visible (10+ in design). Chart type: vertical bar.

### 6.1 KPI Cards (Delivery)

Expected KPIs (from KPI catalog — not all confirmed in design):

| KPI | Region restriction |
|-----|--------------------|
| Production Loss | None |
| DTC | None |
| OTIF | LAR only |
| Expedite | None |
| VMI Compliance | NAR only |

- Region-restricted KPIs (OTIF, VMI Compliance) are hidden when the active Region filter is not the relevant region.
- When Region is "GLOBAL" → show all KPIs. Individual regional KPIs display their regional value with a region label.

---

## 8. Suppliers View

**Route:** `/suppliers`
**Figma nodes:** `254:5697` (Empty State), `263:6645` (Comparison Chatbot Open), `71:4610` (Comparison Full Width)
**Design status:** Designed

### Layout

- Page title: **"Active Suppliers"**
- Subtitle: **"Steel Forgings · All regions"** (active filter context)
- Tabs row (left) + two action buttons (right). Tabs: TBD (labels not confirmed — "All", "By Region"? TBD).
- `<Alert>` component below the tab row (for KPI alerts or supplier attention warnings).
- Highlight card showing summary KPI snapshot below the alert.
- Two Card Templates side by side (supplier cards) + one full-width Card Template below.
- Chatbot panel: 440px right column (when open). Full-width layout when chatbot is closed.

### 7.1 Supplier Card (Highlight Card)

- Title: **"KPI Name"** placeholder (renders actual KPI name).
- Status chip: top right (`<Chip>` — On Track / Watch / At Risk).
- Four metric cells in a 2×2 grid:
  - Top-left: Metric Name + x,xxx value
  - Top-right: Metric Name + x,xxx value
  - Bottom-left: Metric Name + x,xxx value
  - Bottom-right: Metric Name + x,xxx value
- Status legend (hidden by default, shown on hover or expansion — TBD):
  - On Track: N · Watch: N · At Risk: N

### 7.2 Supplier Selection for Comparison

- Two `<Button>` components in the tab row area for controlling comparison.
- "Select two suppliers to compare their performance across key metrics" — shown in empty state.
- Selection UI: TBD (checkboxes in a list, or search-and-select — not confirmed in design).

### 7.3 Empty State

**Figma node:** `254:5697`

- `KPI's Empty State` component rendered.
- Message: "Select two suppliers to compare their performance across key metrics".
- No card data rendered until suppliers are selected.

---

## 9. Supplier Comparison View

**Route:** `/suppliers/compare`
**Figma node:** `71:4610` (Full Width), `263:6645` (Chatbot Open)
**Design status:** Designed

### Layout

- Same Header + Navigation as all internal views.
- Main area: 1021px (when chatbot is open) or full width (when chatbot is closed).
- Chatbot panel: 440px right column (when open).

### 8.1 Comparison Header Card

- Shows one KPI selected for comparison context.
- Four metric cells: Metric Name + value (placeholder "x,xxx") in a 2×2 grid (465.5px × 2 columns).
- KPI Name chip: top right corner.
- Status summary legend (hidden element in Figma — may appear on expand): On Track (5) · Watch (2) · At Risk (1).

### 8.2 Supplier Columns

- Two `Card Template` instances side by side (474.5px each, 16px gap between them).
- One full-width `Card Template` below.
- Each card represents one supplier's KPI data.
- Supplier name rendered in card header.

### 8.3 Interaction Rules

| Interaction | Behaviour |
|-------------|-----------|
| Minimum suppliers | 2 must be selected. "Compare" action is disabled until 2 are selected. |
| Maximum suppliers | TBD (OQ-API-7) |
| Remove a supplier | TBD — close icon on supplier card, or deselect in supplier list |
| Add a supplier | TBD |
| KPI filter | `category` param filters by Quality / Delivery — TBD toggle control |

---

## 10. KPI Detail — PPM

**Route:** `/quality/ppm`
**Figma node:** `318:6889`
**Design status:** Designed

### Layout

- Page title: **"PPM Monthly Report"**
- Subtitle: **"Global Supplier Development · Rolling 3-Month View"**
- Full filter bar (all 11 filters) immediately below the navigation.
- `<Alert>` banner below filter bar (KPI Alert / Watch — dismissible).
- Hero stat block.
- Four data tables in a grid.
- Bar chart below tables.
- Pagination footer.

### 9.1 Filter Bar (PPM-specific defaults)

| Filter | Default on page load |
|--------|---------------------|
| Region | All |
| Plant | All |
| Commodity | All |
| Subcommodity | All |
| Supplier | All |
| Supplier Code | All |
| Supplier Loc. | All |
| Month | Current month (e.g. "Jun") |
| Year | Current year (e.g. "2026") |
| Category | All |
| Focus Supplier | All |

### 9.2 Hero Stat

- Label: "PPM"
- Value: large number (e.g. "152"). Roboto Regular 32px+.
- Represents the aggregate PPM for the active filter set.

### 9.3 KPI Alert Banner

- Component: `<Alert>` warning type.
- Message: "KPI Alert" + status "Watch" chip + "See More" action.
- Dismissible via `CloseFilled` icon button.

### 9.4 Data Tables

Four tables rendered in a grid layout (2×2 confirmed from design):

#### Table 1: Rejection & PPM by Region

| Column | Type |
|--------|------|
| Name | Text (region label: NAR, LAR) |
| PPM | Number |
| REJ | Number |

- Footer row: "Total REJ: [aggregate]"
- Pagination: "1–2 / 2" (2 rows for 2 regions).

#### Table 2: Month (Rolling 3-Month)

| Column | Type |
|--------|------|
| Month | Text (e.g. "Apr '26") |
| PPM | Number |

- Rows: 3 (most recent 3 complete months).
- No pagination.

#### Table 3: Plant

| Column | Type |
|--------|------|
| Plant | Text |
| PPM | Number |
| REJ | Number |

- Sample data (13 plants): Greenville, Findlay, Cleveland, Whirlpool, Sapse, Tulsa, Horizon, Aroma, Clyde, Ramos, Fall River, Manen, Ottawa.
- Visual accent: coloured `Rectangle` elements in cells (bar-within-cell for relative comparison — TBD).
- Sortable: TBD (Sort Toggle component present in design).

#### Table 4: Commodity

| Column | Type |
|--------|------|
| Commodity | Text |
| PPM | Number |
| REJ | Number |

- Sample data (13 commodities): Service Lead, Metal Components, Steel, Glass, Stamping & Die Cast, Electronics, Gas Systems, Pumps/Fans, Wire Racks, Compressors, Electro-Mechanical, Motors, Injection Molding.
- Visual accent: `Rectangle` elements for relative comparison.

### 9.5 Chart

- Title: **"PPM Monthly Performance – By Region"**
- Type: Bar chart, vertical.
- Series: one per region (LAR, NAR).
- X-axis: months (rolling 3-month window: Apr, May, Jun).
- Bar colours: `--semantic/error/main` and other semantic colours by region.

### 9.6 Pagination

- Format: "N–N / N" (e.g. "1–2 / 2").
- Footer aggregate: "Total REJ: 997,562" pinned to bottom.
- Pagination controls TBD (previous/next buttons, page size selector).

### 9.7 Sorting

- `Sort Toggle` component visible in design — exact sort behaviour and columns TBD.

---

## 11. KPI Detail — CAL

**Route:** `/quality/cal`
**Figma node:** `318:7803`
**Design status:** Designed

### Layout

- Same structure as PPM detail (filter bar, hero stat, tables, optional chart).

### Tables Confirmed

- CAL by Region (Global, NAR, LAR).
- CAL by Plant (plants within each region, e.g. Marion, Amana for NAR; Supsa, Joinsville, Celaya, Manaus for LAR).
- CAL by Commodity (Rubber & Misc. Plastics; Package/Literature/Insulation confirmed).

### CAL-specific columns

| Column | Notes |
|--------|-------|
| Region / Plant / Commodity | Dimension label |
| CAL | Count |
| Status columns (multiple) | Status bucket counts — labels TBD (OQ-KPI-8) |

---

## 12. KPI Detail — Other Quality KPIs

**Routes:** `/quality/{kpiId}` (GSIR, Products on Hold, PIQ Maturity, Exhibits, 8D-CAPA, Risk Rating, Focus Supplier)
**Design status:** Not yet designed. See `VIEW_DATA_MAP_SPEC.md` for data requirements.

- All follow the same structural pattern: filter bar → hero stat → breakdown tables → optional chart.
- Implement using the same page template as PPM and CAL.
- Specific column definitions to be added as Figma designs are delivered.

---

## 13. KPI Detail — Delivery KPIs

**Routes:** `/delivery/{kpiId}`
**Design status:** Not yet designed.

- Same structural template as quality KPI detail pages.
- To be filled in when Figma delivers delivery detail page designs.

---

## 14. Supplier Limited View

**Route:** `/supplier-view?token=...` (signed URL)
**Design status:** Not yet designed.

### Rules

| Rule | Behaviour |
|------|-----------|
| No SSO | Page loads without authentication prompt. Token in URL is the credential. |
| No navigation | Header and Navigation tabs are not rendered. |
| No chatbot | Chatbot panel is not rendered. |
| No comparison | Supplier Comparison link/action is not available. |
| No other suppliers | Only the data permitted by the signed URL scope is shown. |
| Expired token | Show "link expired" message — not a generic error page. Style TBD. |
| Invalid token | Show "link invalid" message — TBD. |

---

## 15. Shared Component States

These states apply to every data-driven component across all views.

### 14.1 Loading State

- Rendered while the API request is in-flight.
- KPI card value area: skeleton placeholder (animated shimmer). Full card shape preserved.
- Tables: skeleton rows (3–5 rows). Column headers still render.
- Charts: empty chart frame with loading indicator.
- Do not show stale data while re-fetching (filter change triggers full loading state).

### 14.2 Empty State

- Rendered when the API returns `data: []` with HTTP 200.
- KPI card: value shows "—", status chip hidden.
- Table: `KPI's Empty State` component in place of rows. Message TBD.
- Charts: empty frame, no bars rendered.
- Top Offenders (Summary): chart area replaced by empty state component.

### 14.3 Error State

- Rendered when the API returns a non-2xx status or the request fails.
- KPI card: inline error icon + "Unable to load" text — TBD.
- Table: error message in place of rows — TBD.
- Chart: error message in place of chart — TBD.
- **No blank screens.** Every data area must render one of: loaded data, loading skeleton, empty state, or error state.

---

## 16. Navigation Rules

| From | To | Trigger | Filter state |
|------|----|---------|--------------|
| Any view | Another primary view (tab) | Click nav tab | Global filters persist. Per-view filters reset to defaults. |
| KPI card (Summary/Quality) | KPI detail page | Click card | Active global filters carried into detail page. |
| KPI detail page | Parent view | Back button / breadcrumb | Returns to parent view with original filter state. |
| Supplier card | Supplier detail | Click card | Supplier ID passed as route param. |
| Supplier list | Comparison view | "Compare" action | Selected supplier IDs passed as query params. |
| Any internal view | Supplier Limited View | Not navigable | Supplier view is only reachable via signed URL. |

### URL and Filter State

- Active filters are encoded in the URL at all times.
- Navigating back (browser back button) restores the previous filter state.
- Sharing a URL with encoded filters loads the view with those filters pre-applied.
- URL encoding format: see `FILTER_SPEC.md` *(pending)*.

---

## 17. Open Questions

| ID | Area | Question | Owner | Blocks |
|----|------|----------|-------|--------|
| OQ-UI-1 | Chatbot panel | How is the chatbot panel toggled open/closed? Is there a toggle button in the header or layout? | Design | Chatbot interaction |
| ~~OQ-UI-2~~ | Chatbot panel | ~~What are the 4 pre-defined suggestion chip labels?~~ | **Resolved** | Implemented in `ChatSuggestions.tsx`: "Why is quality at risk?", "Draft an escalation email for GKN", "Which contracts expire soon?", "Summarize delivery performance". |
| OQ-UI-3 | Chatbot panel | Where is the scope toggle (Global / Current view)? As chips, a toggle, or a dropdown? | Design | Chat scope selection |
| OQ-UI-4 | Filter bar | Does the global filter bar appear on the Summary/Quality/Delivery top-level views, or only on KPI detail pages? | Design | Filter bar placement |
| OQ-UI-5 | Filters Drawer | Does the drawer support multi-select for Supplier, Plant, and Commodity? | Design / Business | Filter UX |
| OQ-UI-6 | Filters Drawer | What is the "Reset" / "Clear all" behaviour — reset to system defaults or to the user's saved default filter? | Business | Filter reset UX |
| OQ-UI-7 | Customize KPIs | What does "Customize KPI's" allow? Reorder, show/hide, or both? | Design / Business | Summary/Quality views |
| OQ-UI-8 | Summary | What are the Suppliers Needing Attention table columns? | Design | Summary view |
| OQ-UI-9 | Summary | What triggers the "Improved" vs "At Risk" badge on the Highlight cards — is this a computed status or a direct field? | Business | Highlight cards |
| OQ-UI-10 | GSIR | Are the 5 GSIR sub-views tabs within the Quality view, or separate sections that scroll? | Design | Quality view |
| OQ-UI-11 | GSIR | What is LOS (Level of Service) — definition and display format (number, %, text)? | Business | GSIR table |
| OQ-UI-12 | Quality | Does the "See More" link on the Quality KPI Alert navigate somewhere or expand the alert? | Design | Alert behaviour |
| OQ-UI-13 | Tables | Which table columns are sortable? What is the default sort order per table? | Design / Business | All detail tables |
| OQ-UI-14 | Tables | What is the page size for paginated tables (Plant, Commodity)? | Design / Backend | Pagination |
| OQ-UI-15 | Suppliers | What is the supplier selection UX for comparison — checkbox list, search-and-add, or something else? | Design | Supplier comparison |
| OQ-UI-16 | Suppliers | What is the maximum number of suppliers in a comparison? | Business / Backend | Comparison layout |
| OQ-UI-17 | Supplier Limited View | What does the "link expired" screen look like? | Design | Supplier limited view |
| OQ-UI-18 | Delivery | Are the delivery KPI detail page designs available or planned? | Design | Delivery detail pages |
| OQ-UI-19 | Mobile | What is the expected behaviour on tablet (< 1024px) and mobile? | Design / Business | Responsive layout |
| OQ-UI-20 | Export | What formats does the Export button support (CSV, PDF, Excel)? | Business | Export action |

---

## Changelog

| Version | Date | Notes |
|---------|------|-------|
| 0.3 | 2026-07-24 | Added redirect notices to §2, §3, §4 — authoritative specs moved to `specs/features/SPM-91-app-layout.md` (layout shell) and `specs/COMPONENT_INVENTORY.md` (all shared components). Updated §2.3 ChatbotPanel input spec: single-line fixed height (44/62px), not multiline. Resolved OQ-UI-2 (suggestion chip labels implemented in ChatSuggestions.tsx). Added COMPONENT_INVENTORY.md and SPM-91-app-layout.md to related specifications. Updated version and related-specs links. |
| 0.2 | 2026-07-21 | Replaced section 1 (Design Tokens) with full Design System & Code Conventions (§1): three-tier color architecture, layout CSS vars, spacing/radius rules, typography scale, MUI usage rules (direct props vs sx, deprecated APIs, numeric values), custom breakpoints. Added section 3 (Shared UI Components) with full implementation specs for StatusChip, HighlightCard, AlertBanner, HeaderDate, NotificationButton, UserAvatar (including logout menu). Updated §2 (Shared Layout) with actual implementation details for AppHeader, AppNavigation, and ChatbotPanel (resize hook, collapse animation, hydration fix, input slotProps). Renumbered all subsequent sections +2. |
| 0.1 | 2026-07-15 | Initial draft. Extracted from Figma nodes: 55:8385 (Summary), 64:15428 (Quality), 71:4610 (Supplier Comparison), 318:6889 (PPM detail), plus metadata scan. Sections for undesigned views are stubs. |
