# Layout Feature Spec — SPM-91

**Status:** Implemented
**Last Updated:** 2026-07-24

---

## Overview

This spec covers the application shell implemented in SPM-91: the fixed header, navigation tab bar, and resizable AI assistant panel that wrap all internal views. View-level content (pages) slots into the main content area.

**Files in scope:**

| File | Role |
|---|---|
| `src/app/layout.tsx` | Root layout — composes the shell |
| `src/components/layout/AppHeader.tsx` | Fixed top bar |
| `src/components/layout/AppNavigation.tsx` | Fixed tab navigation |
| `src/components/layout/ChatbotPanel.tsx` | Resizable AI assistant right panel |
| `src/components/ui/HeaderDate.tsx` | AppHeader sub-component |
| `src/components/ui/NotificationButton.tsx` | AppHeader sub-component |
| `src/components/ui/UserAvatar.tsx` | AppHeader sub-component |
| `src/components/ui/ChatSuggestions.tsx` | ChatbotPanel empty state |
| `src/hooks/usePanelResize.ts` | Drag-resize logic for ChatbotPanel |

**Not in scope:** `/supplier-view` renders with no shared layout.

---

## App Shell Structure

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

The flex row starts below the fixed bars: `mt: calc(var(--header-height) + var(--nav-height))`. `minHeight: calc(100vh - ...)` fills the viewport.

Page background: `background.default` (`#edf4fc`). Content padding: `var(--content-padding)`.

### CSS Variables

| Variable | Default | xl ≥1536px | Usage |
|---|---|---|---|
| `--header-height` | 64px | 64px | AppBar height |
| `--nav-height` | 59px | 59px | Navigation tab bar height |
| `--content-padding` | 12px | 32px | Horizontal page padding |
| `--chatpanel-default-width` | 360px | 440px | Panel initial width (SSR-safe; JS takes over after first drag) |

---

## AppHeader

**File:** `src/components/layout/AppHeader.tsx` · `'use client'`
**Height:** `var(--header-height)` = 64px · `position: fixed`
**Background:** `primary.main` (#0d436b)
**zIndex:** `theme.zIndex.drawer + 1`

| Slot | Component | Details |
|---|---|---|
| Logo | `next/image` | 90×30px · static · not a link |
| App title | `Typography h3` | "Supplier Performance Management" · `fontWeight={400}` · `lineHeight={1.75}` · `letterSpacing="0.15px"` · left border separator |
| Spacer | `Box flexGrow={1}` | Pushes right elements to edge |
| Date | `HeaderDate` | See below |
| Notifications | `NotificationButton` | See below |
| User | `UserAvatar` | See below |

Toolbar: `gap: 4.5` (18px) · `px: var(--content-padding)` · `minHeight: var(--header-height) !important`.

### Props

| Prop | Type |
|---|---|
| `user` | `User \| null` |
| `notificationCount` | `number` |

---

### HeaderDate

**File:** `src/components/ui/HeaderDate.tsx` · `'use client'`

Renders the current date formatted as "Mon, Jun 22, 2026" via `Date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })`.

- Layout: `CalendarTodayIcon` (16px, `color="inherit"`) + `Typography fontSize={13} color="inherit"`.
- `suppressHydrationWarning` handles the rare SSR/client date mismatch at midnight.
- Auto-updates at midnight: computes ms until next `00:00:00`, sets `setTimeout`, on fire updates state and re-schedules. Cleanup clears on unmount.

---

### NotificationButton

**File:** `src/components/ui/NotificationButton.tsx`

Props: `count?: number` (default 0).

- `IconButton size="small" color="inherit"` wrapping `Badge`.
- `Badge color="error"` · `badgeContent={count}` · badge `fontSize: 12` · `letterSpacing: '0.14px'` via `sx['& .MuiBadge-badge']`.
- `NotificationsIcon fontSize: 28`.
- Hover: `bgcolor: primary.dark`.

---

### UserAvatar

**File:** `src/components/ui/UserAvatar.tsx` · `'use client'`

Props: `user?: User | null` · `size?: number` (default 32).

- `Avatar` — `bgcolor: primary.contrastText` · `color: primary.main` · `fontSize: 20` · `fontWeight: 400` · `letterSpacing: '0.14px'`.
- **Initials:** `firstName[0] + lastName[0]` (uppercased) if both present on the `User` object; otherwise `displayName.slice(0, 2)`.
- Hover ring: `color: primary.dark` + `box-shadow: 0 0 0 4px primary.dark` outside the circle. Transition: `color 150ms, box-shadow 150ms`.
- Clicking opens a `Menu` anchored at `{ vertical: 48, horizontal: 'right' }` / `transformOrigin: { vertical: 'top', horizontal: 'right' }`.
- Menu paper: `borderRadius: 1` · `minWidth: 125`.
- Single menu item: "Log Out" (`LogoutIcon` + "Log Out"). On click: calls `logout()` (`POST /auth/logout`) then `router.push('/login')`.
- First-open focus fix: `&.Mui-focusVisible` overridden to `bgcolor: background.paper` (with `&.Mui-focusVisible:hover` restoring `action.hover`) to prevent unwanted darker auto-focus background.

---

## AppNavigation

**File:** `src/components/layout/AppNavigation.tsx` · `'use client'`
**Height:** `var(--nav-height)` = 59px · `position: fixed` · `top: var(--header-height)`
**Background:** `background.paper`
**Bottom border:** `1px solid divider`
**zIndex:** `theme.zIndex.appBar` (via `sx` callback — required for dynamic theme value)

| Tab | Route | Match strategy |
|---|---|---|
| SUMMARY | `/` | Exact |
| QUALITY | `/quality` | `startsWith` |
| DELIVERY | `/delivery` | `startsWith` |
| ACTIVE SUPPLIERS | `/suppliers` | `startsWith` |

- Inactive tab color: `text.secondary`. Active: `secondary.main`.
- Tab typography: 14px Roboto Medium · uppercase · `letterSpacing: '0.4px'` (via `MuiTab` theme override — not per-instance).

### Custom Animated Indicator

MUI's built-in indicator is hidden: `TabIndicatorProps={{ sx: { display: 'none' } }}`.

A `Box` (2px tall, `position: absolute, bottom: 0`) is positioned using `getBoundingClientRect()` relative to a `position: relative` wrapper (`wrapperRef`). Positions measured in `useLayoutEffect` (fires before paint) via per-tab `HTMLDivElement` refs.

**Behavior:**
- Hover → slides to hovered tab, color shifts to `divider`.
- Mouse-leave → returns to active tab, color shifts to `secondary.main`.
- Hovering the already-active tab keeps `secondary.main`.

**Transition:** `left 200ms ease-in-out, width 200ms ease-in-out, background-color 150ms ease-in-out`.

---

## ChatbotPanel

**File:** `src/components/layout/ChatbotPanel.tsx` · `'use client'`
**Hook:** `src/hooks/usePanelResize.ts`
**Empty state:** `src/components/ui/ChatSuggestions.tsx`

> **Constraint:** Chat calls go **directly to Backend B** (FastAPI Chat Service) via `src/services/chat.service`. Never routed through Backend A.

### Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `sessionId` | `string \| null` | — | Managed by parent layout |
| `onSessionChange` | `(id: string) => void` | — | Called after `startNewChatSession` |
| `scope` | `ChatScope` | `'GLOBAL'` | `'GLOBAL'` or `'CURRENT_VIEW'` |
| `viewContext` | `Record<string, unknown>` | — | Active view context sent with each message |

### Width and Resize

- Min width: 360px (`sm`) / 440px (`xl` ≥1536px). Handled by `usePanelResize`.
- Max width: `Math.floor(window.innerWidth / 2)`.
- Drag handle: 8px invisible strip on left edge. `cursor: col-resize`. `onMouseDown` starts resize.
- Transition: `theme.transitions.create('width', easeInOut)` when idle. **Disabled during drag** so the border tracks the cursor 1:1.
- Initial width: driven by `--chatpanel-default-width` CSS variable (resolves SSR-correctly via `@media`). JS via `usePanelResize` takes over after the user's first drag (`hasUserResized` flag). `handleDragStart` reads `panelRef.current.offsetWidth` to start from the actual rendered width.

### Collapse / Expand

- Collapsed: `width: 0` on outer `aside`. Inner wrapper keeps full width — content clipped by `overflow: hidden`, no reflow.
- Collapse trigger: `CloseIcon` button in panel header.
- Re-expand trigger: amber `Fab` via `<Fade in={isCollapsed} unmountOnExit>`. `position: fixed`, bottom-right corner. `bgcolor: var(--color-amber)`, hover: `var(--color-amber-mid)`.

### States

| State | Behaviour |
|---|---|
| Empty (no messages) | Renders `<ChatSuggestions>` |
| Active conversation | Message thread. User: right-aligned, `primary.main` bg. Assistant: left-aligned, `background.default` bg. |
| Loading | "Thinking…" `Typography variant="body2"` below last message |

### Header

- Amber circle badge (36×36px, `borderRadius: "50%"`, `bgcolor: var(--color-amber)`) with `AutoAwesomeIcon` (white, 18px).
- Title: "Supplier AI Assistant" · `color='primary'` · `fontSize: { sm: 20, xl: 24 }`.
- Subtitle: "Connected to live supplier performance data" · `color='secondary'`.
- Close button: `CloseIcon` · `color: text.secondary`.

### Input Area

- `TextField` — fixed height: 44px (`sm`) / 62px (`xl`). Single-line. `size="small"`.
- `slotProps.htmlInput`: `aria-label: 'Chat message input'`.
- `slotProps.input.endAdornment`: `InputAdornment` wrapping an `IconButton` with `SendIcon`. `bgcolor: secondary.main` · `borderRadius: 2` (8px). Hover: `secondary.dark`. Disabled: `action.disabledBackground` / `action.disabled`. Size: 32×32px (`sm`) / 48×48px (`xl`).
- TextField root: `borderRadius: 3` (12px) · `fontSize: 13` via `sx['& .MuiOutlinedInput-root']`.
- Enter (without Shift) submits. Shift+Enter reserved for newline (no-op in single-line mode).
- Footer caption: "Responses are generated from your supplier performance data." · `fontSize: { sm: 10, xl: 12 }` · `color="text.secondary"` · centered.

---

### ChatSuggestions

**File:** `src/components/ui/ChatSuggestions.tsx`

Props: `scope: ChatScope` · `onSelect: (text: string) => void`.

- Heading: "How can I help you?" · `color="primary"` · `fontSize: { sm: 28, xl: 34 }`.
- Subtitle: "…in this view." (`CURRENT_VIEW`) vs "…across all suppliers." (`GLOBAL`). `color="secondary"` · `fontSize: { sm: 12, xl: 14 }` · `width: { sm: 300, xl: 350 }`.
- 4 static suggestion chips: outlined · `borderRadius: 5` (20px) · `fontSize: 13` · `borderColor: divider`. Hover: `borderColor: primary.main`. Chip gap: `{ sm: 1.5, xl: 3 }` (6–12px).

---

## Data Flow

```
layout.tsx (server component)
  ├─ GET /auth/me → User
  ├─ AppHeader (user: User | null, notificationCount)
  │    ├─ HeaderDate
  │    ├─ NotificationButton (count)
  │    └─ UserAvatar (user)
  ├─ AppNavigation (no props — reads route via usePathname)
  └─ ChatbotPanel (sessionId, onSessionChange, scope, viewContext)
       ├─ ChatSuggestions (empty state)
       └─ chat.service → POST /chat/message → Backend B
```

`User` is fetched server-side at the layout level. Passed as a prop to `AppHeader` — no auth context/provider. `sessionId` is managed in `layout.tsx` client state and survives route changes.

---

## Navigation Rules

See `UI_REQUIREMENTS_SPEC.md §16` for the full navigation rules table.

Key layout-level rules:
- Global filters (region, year, etc.) persist across view navigation — encoded in the URL.
- Chatbot `scope` and `sessionId` persist across route changes.
- `/supplier-view` renders with no `AppHeader`, `AppNavigation`, or `ChatbotPanel`.
