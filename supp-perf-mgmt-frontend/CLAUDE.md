# CLAUDE.md — Supplier Performance Management Frontend

This file is loaded automatically by Claude Code at the start of every session.
Full design system spec: `specs/UI_REQUIREMENTS_SPEC.md` §1.

---

## Project Overview

Supplier Performance Management System (SPMS). Next.js (App Router) + TypeScript dashboard, Material UI. Internal users authenticate via SSO; suppliers authenticate via signed URL (no login, no chatbot, own data only).

This repo is the **frontend only**. It talks to two independent backends plus an AI agent behind them:

- **Backend A — Data API** (Nest.js): all KPI data, auth, saved filters, supplier signed-URL validation. Base URL: `NEXT_PUBLIC_API_BASE_URL`.
- **Backend B — Chat Service** (FastAPI): chat only. Called **directly** by the frontend — never routed through Backend A. Base URL: `NEXT_PUBLIC_CHAT_API_BASE_URL`.
- **AI Agent** (Google ADK + BigQuery MCP): never called by the frontend. Backend B is the only caller.

Full detail lives in `specs/`. Read the relevant file before touching an area you haven't worked in yet — don't infer architecture from guesses.

| Topic | File |
|---|---|
| Product goals, personas, scope, phasing | `PRD.md` |
| Frontend architecture, conventions, component strategy | `PRD-frontend.md` |
| Data API contract (KPIs, auth, filters, suppliers) | `API_SPEC.md` |
| Chat API contract | `CHAT_API_SPEC.md` |
| Entity shapes / TypeScript interfaces | `DATA_MODEL_SPEC.md` |
| Per-view data requirements, routes, gaps | `VIEW_DATA_MAP_SPEC.md` |
| Component states, tokens, layout, interaction rules | `UI_REQUIREMENTS_SPEC.md` |
| Backend A / B / AI agent internals (rarely needed from frontend) | `PRD-backend-a.md`, `PRD-backend-b.md`, `PRD-ai-agent.md` |

**Do not use `PRD-backend.md`.** It's marked superseded in its own header (split into Backend A / Backend B) and describes an old single-backend chat-proxy flow that no longer applies.

**Auth is Google Workspace SSO** (confirmed). Any remaining "Azure AD" references in specs are stale — Google Workspace is the source of truth.

---

## Stack

- Next.js App Router (TypeScript) — currently v16, Turbopack is the default dev bundler
- MUI v6 (`@mui/material`)
- Custom theme: `src/lib/theme.ts`
- Global CSS: `src/app/globals.css`

---

## Routes

| Route | View | Backend endpoint |
|---|---|---|
| `/` | Summary | `GET /kpis/summary` |
| `/quality` | Quality | `GET /kpis/quality` |
| `/delivery` | Delivery | `GET /kpis/delivery` |
| `/suppliers` | Suppliers | `GET /suppliers`, `GET /kpis/supplier/{id}` |
| `/suppliers/compare` | Supplier Comparison | `GET /kpis/comparison` |
| `/quality/{kpiId}`, `/delivery/{kpiId}` | KPI detail | `GET /kpis/{kpiId}` |
| `/supplier-view?token=...` | Supplier Limited View (signed URL, no shared layout) | `GET /supplier-links/{id}/data` |

---

## Workflow

Every work item — feature or otherwise — follows this single loop. Do not skip or reorder steps.

1. **Discuss requirements** with the user; refine until agreement — you need the shape of the feature before a ticket can be written.
2. **Create the Jira work item** in the backlog using the template below. This assigns the `SPM-{ID}`. If someone else creates it, ask the user for the ID.
3. **Create the branch off `dev`** using that ID, following the branch naming convention — **before writing any code**. If you're on `dev`, `main`, or any branch that isn't this item's branch, branch first. Creating the branch is proactive and expected at this point; it's non-destructive, so don't wait to be asked. (Committing, pushing, and opening the PR are separate actions that still wait for explicit approval.)
4. **Check the specs** — `VIEW_DATA_MAP_SPEC.md` and `UI_REQUIREMENTS_SPEC.md` for this view: data source, fields, component states, open gaps (`OQ-*`) that block implementation. Surface any blocking gap before proceeding.
5. **Pull the relevant Figma frame** via Figma MCP. **Ask the user for the specific node link (or file key + node ID)** for the section — don't guess node IDs (unless a spec, e.g. an epic README, already records them). Use `get_metadata` here: node IDs, layer names, sizes, positions, and spacing are the precise structural reference for the spec. Real colours/typography/tokens come later at implementation via `get_design_context` (see the Figma MCP skill); a screenshot is optional when a visual check helps. **If Figma MCP is unavailable**, ask the user to provide a screenshot or image of the design before proceeding.
6. **Draft the feature spec** (data needs, states, components required, which backend endpoint(s) from `API_SPEC.md` / `CHAT_API_SPEC.md`). Save it to `specs/features/SPM-{ID}-{short-description}.md` — same `{ID}` and `{short-description}` as the branch name (e.g. `SPM-91-app-layout.md` for branch `feature/SPM-91-app-layout`). For a page split across several connected tickets, nest them under an epic folder `specs/features/SPM-{epicID}-{slug}/` with a `README.md` holding the shared context and one thin file per ticket (each linking back to the README).
7. **Refine the spec** and agree with the user.
8. **Check `specs/COMPONENT_INVENTORY.md`** before creating any new component. If a similar component exists, extend it as a variant instead of duplicating it.
9. **Implement**, following the commit message convention: components → skeleton variant → loading/empty/error/success states → feature composition. Pull real tokens/styles for the node via `get_design_context` (Figma MCP skill) before translating visuals.
10. **Validate against the Figma frame** — `get_design_context` and/or a screenshot of the node (or the image provided in step 5 when Figma MCP is unavailable).
11. **Test** — a feature is not done until tests are committed in the same PR:
    - **Services:** every new or modified service function → unit test in `src/test/services/`.
    - **Route handlers:** every new Next.js API route → test in `src/test/api/` mirroring the route path. Add `// @vitest-environment node` at the top of each route handler test file.
    - **Components:** non-trivial logic or async state → at minimum a smoke test.
    - **Integration/e2e:** for critical user journeys where applicable.
12. **Update `specs/COMPONENT_INVENTORY.md`** with any new or changed components before merging.
13. **Open a Bitbucket PR** targeting `dev` using the template below.
14. After approval, **squash merge into `dev`**.
15. **Pull `dev`** locally and begin the next work item.

### Rebasing onto `dev`

Bring a branch up to date with `git rebase dev`, never `git merge dev`. A merge commit's auto-generated message (`Merge branch 'dev' into ...`) has no Conventional Commits type, so the `commit-msg` hook rejects it.

```bash
git checkout dev
git pull origin dev
git checkout <your-branch>
git rebase dev
```

Rebase rewrites commit hashes, so this is only safe on a branch that has not been pushed, or that no one else has based work on. A shared branch needs a coordinated force-push or a merge instead.

### Branch Naming Convention

Format: `{type}/SPM-{ID}-{short-description}`

| Type | When to use |
|---|---|
| `feature` | New functionality |
| `bugfix` | Bug fix during development |
| `hotfix` | Urgent fix on production |
| `release` | Release preparation |
| `chore` | Tooling, config, setup — no production code change |
| `docs` | Documentation only |

- Jira ID must be **uppercase**: `SPM-91` not `spm-91`
- Short description is lowercase kebab-case
- Examples: `feature/SPM-91-app-layout` · `docs/SPM-89-repo-init` · `chore/SPM-90-nextjs-setup`

### Commit Message Convention

Follows [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/).

Format: `{type}: {short description}`

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Tooling, config, maintenance |
| `docs` | Documentation changes |
| `style` | Formatting or whitespace — no logic change |
| `refactor` | Code restructure — no feature or fix |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `build` | Build system or dependency changes |
| `ci` | CI/CD configuration |

- **No Jira ID** in commit messages
- Description is lowercase, imperative mood — `add login page` not `Added login page`

### Jira Work Item Template

**Summary:** `[FE] Brief imperative description`

> Use `[FE]` for frontend, `[BE]` for backend data API, `[CB]` for chatbot backend.

**Description:** Brief paragraph explaining what this work item delivers and why.

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### Bitbucket Pull Request Template

**Title:** `{Type}/{SPM-ID} {Jira summary without component tag}`

The type is capitalized to match the branch prefix: `Feature`, `Bugfix`, `Hotfix`, `Release`, `Chore`, `Docs`.

Examples:
- `Docs/SPM-89 Initialize repository with README, .gitignore, and specification files`
- `Chore/SPM-90 Initialize Next.js project with TypeScript, MUI, and tooling`
- `Feature/SPM-91 Implement application shell and layout components`

**Description:**

```
## Summary

Brief description of what this PR does.

**Changes:**
- Change 1
- Change 2

## Why

Reason for this change — business or technical context.

## Checklist
- [ ] Checklist item 1
- [ ] Checklist item 2
```

> All merges into `dev` use **squash merge**.

---

## Non-negotiable Rules

- Reusable components must never call APIs directly. All data access goes through `src/services/`. Data/auth/filters/suppliers → Backend A. Chat → Backend B, directly, never proxied through Backend A (`FE-C9`).
- Every component that renders async data must implement all four states per `UI_REQUIREMENTS_SPEC.md` §14: **loading** (shimmer skeleton, full shape preserved — tables show 3–5 skeleton rows with headers still rendered), **empty** (`data: []` + HTTP 200 — never treat as an error), **error** (non-2xx or failed request), **success**. No blank screens, ever. A component is not done without its matching `ComponentName.Skeleton`.
- Never hardcode colors, spacing, or typography — always reference the design tokens defined in `UI_REQUIREMENTS_SPEC.md` §1.
- Use the real entity types from `DATA_MODEL_SPEC.md` (`KpiCard`, `QualityKpiCard`, `DeliveryKpiCard`, `Supplier`, `SupplierKpiResult`, `User`, `Region`, etc.) — not placeholder names from earlier drafts.
- Prefer variants over duplicate components (e.g. `Button` with a `variant` prop, not `BlueButton`/`RedButton`).
- **Never ship a near-identical copy of something that already exists to keep a PR "focused."** If the component/helper you're about to write largely duplicates an existing one, the correct move is to **generalize** — extract a shared version (into `ui/` or `lib/`) and point both the old and new usages at it. This *includes editing the already-existing component*: doing so is in scope, because removing the duplication **is** part of the work. This does not contradict "keep the PR focused" — that guidance is about avoiding *unrelated* drive-by changes, not about tolerating duplication. Anti-duplication is a rule; a tidy diff is a preference, and the rule wins. Only when the existing component is genuinely risky to touch (heavily used, thin test coverage, or a large refactor) may you split the extraction into an immediately-following PR — never silently ship the duplicate and move on. When it's genuinely unclear whether to generalize now, defer it, or let the two cases diverge (e.g. they only look similar today but will drift), **ask the developer directly** instead of guessing — a quick question beats either a wrong abstraction or a silent duplicate.
- Global filters persist across view navigation; per-view filters reset to that view's defaults (`VIEW_DATA_MAP_SPEC.md`, Navigation Rules).
- Supplier Limited View renders with no shared layout: no header nav, no chatbot panel, no comparison link, own-data-only.
- Auth is cookie-based (`HttpOnly`). The frontend never reads or stores a token. Use `credentials: 'include'` on all Backend A requests. On `401`, redirect to `GET /api/v1/auth/login`. No role checks — all authenticated internal users have equivalent access (v1). See `PRD-frontend.md` FE-C13.
- Every new service function and API route handler must have a corresponding unit test committed in the same PR. Tests live in `src/test/`, mirroring the source path — e.g. `src/services/foo.service.ts` → `src/test/services/foo.service.test.ts`. A feature without tests is incomplete.
- Never place test files inside `src/app/`. Turbopack scans that directory as part of the Next.js module graph and will try to resolve `vitest` imports as Next.js entries, hanging the dev server. All tests belong under `src/test/`.

---

## Color Rules (read before touching any component)

Three tiers. Never skip a tier or hardcode hex.

**Tier 1 — MUI palette paths** (for semantic/brand colors)
Reference as strings in `sx`, direct props, or `color=`: `'primary.main'`, `'warning.light'`, `'text.secondary'`, etc.
Full table: `specs/UI_REQUIREMENTS_SPEC.md` §1.1 Tier 1.

**Tier 2 — CSS custom properties** (for status/domain colors not in the palette)
Reference as `'var(--color-amber)'`, `'var(--color-green-light)'`, etc.
Full table: `specs/UI_REQUIREMENTS_SPEC.md` §1.1 Tier 2.

**Tier 3 — `tokens` object in `theme.ts`** — internal only, drives the palette.
**Components must never import `tokens`.**

Decision order:
1. Color has a semantic palette slot → use the palette path.
2. Domain/status color not in palette → use `var(--color-*)` from `globals.css`.
3. Doesn't exist yet → add to `globals.css` + `tokens` (+ palette if warranted).

---

## MUI Usage Rules

### Which components accept direct system props

MUI v6 documents system props as direct props on exactly three layout primitives:

| Component | Direct system props | Source |
|---|---|---|
| `Box` | ✅ yes | [v6 Box API](https://v6.mui.com/material-ui/api/box/) |
| `Typography` | ✅ yes | [v6 Typography API](https://v6.mui.com/material-ui/api/typography/) |
| `Stack` | ✅ yes | [v6 Stack API](https://v6.mui.com/material-ui/api/stack/) |

Every other MUI component — `AppBar`, `Toolbar`, `Tabs`, `Tab`, `Card`, `CardContent`, `Chip`, `Button`, `IconButton`, `Avatar`, `Badge`, `Alert`, `FormControl`, `Select`, `MenuItem`, `Menu`, `TextField`, `Table*`, `Fab`, `Skeleton`, `CircularProgress`, etc. — **does not** document this capability. Use `sx` for all styles on those components.

### Prefer direct props over `sx` (Box, Typography, Stack only)

For `Box`, `Typography`, and `Stack`, use direct props for static styles. Use `sx` only for dynamic values, conditionals, or pseudo-selectors.

**Critical:** even when `sx` is required for one property, all static properties must still be direct props. `sx` must contain **only** pseudo-selectors, dynamic values, or conditionals — never a mix of static and non-static.

```tsx
// Correct
<Box display="flex" alignItems="center" gap={2} bgcolor="background.paper" />

// Avoid — static props in sx
<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'background.paper' }} />

// sx required (dynamic)
<Box sx={{ width: isCollapsed ? 0 : width }} />

// sx required (pseudo-selector)
<Box sx={{ '&:hover': { bgcolor: 'action.hover' } }} />

// Correct — static as direct props, only pseudo-selector in sx
<Box
  position="absolute"
  width={8}
  display="flex"
  alignItems="center"
  sx={{ cursor: 'col-resize', '&:hover .dots': { opacity: 1 } }}
/>

// Wrong — mixes static and pseudo in sx
<Box
  sx={{
    position: 'absolute',
    width: 8,
    display: 'flex',
    alignItems: 'center',
    '&:hover .dots': { opacity: 1 },
  }}
/>

// Correct — dynamic in sx, static as direct
<Box display="flex" flexDirection="column" gap={2} sx={{ minHeight }}>

// Wrong — static props pollute sx alongside a dynamic value
<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minHeight }}>
```

### Numeric px values — no string literals

```tsx
fontSize={13}          // not fontSize="13px"
borderRadius: 2        // not borderRadius: '8px'  (2 × 4 = 8px)
sx={{ fontSize: 16 }}  // not sx={{ fontSize: '16px' }}
```

**Exception:** `lineHeight` with a px unit stays as a string — `lineHeight: '24px'`.
Writing `lineHeight: 24` means 24× the font size, not 24px.

### `borderRadius` multiplier (theme.shape.borderRadius = 4)

| Value | px |
|---|---|
| `1` | 4px — chips, badges |
| `2` | 8px — buttons, icon buttons |
| `3` | 12px — text fields |
| `5` | 20px — pill chips |
| `"50%"` | circle |

### Spacing (theme.spacing = 4)

`gap={2}` = 8px · `p={3}` = 12px · `px={4}` = 16px · `py={6}` = 24px · `p={8}` = 32px

### No deprecated APIs

- `inputProps` on `TextField` → `slotProps.htmlInput`
- `InputProps` on `TextField` → `slotProps.input`

---

## Layout CSS Variables

Never hardcode these as pixel literals.

| Variable | Default | xl ≥1536px |
|---|---|---|
| `--header-height` | 64px | 64px |
| `--nav-height` | 59px | 59px |
| `--content-padding` | 12px | 32px |

---

## Custom Breakpoints

`xs:0 · sm:600 · md:900 · lg:1280 · xl:1536`
Note: `lg` = 1280px (not MUI's default 1200px).

---

## File Locations

| Purpose | Path |
|---|---|
| MUI theme + token object | `src/lib/theme.ts` |
| CSS vars + layout vars | `src/app/globals.css` |
| Layout components | `src/components/layout/` |
| UI components | `src/components/ui/` |
| Feature components | `src/components/{feature}/` — view-scoped compositions (e.g. `summary/`). Not reusable, no barrel. |
| Custom hooks | `src/hooks/` |
| Services | `src/services/` |
| Contexts | `src/context/` |
| Tests | `src/test/` — mirrors source path; **never** inside `src/app/` |
| Specs | `specs/` |
| Feature specs | `specs/features/` — one file per feature, named `SPM-{ID}-{short-description}.md`. Connected multi-ticket pages get a folder `specs/features/SPM-{epicID}-{slug}/` with a `README.md` epic overview + one thin file per ticket. |
| Component inventory | `specs/COMPONENT_INVENTORY.md` |

---

## Import Order

Five groups, separated by a blank line. Enforced by `eslint-plugin-simple-import-sort` (auto-fixable with `npm run lint -- --fix`).

```ts
// 1. React
import { useState } from 'react';

// 2. Next.js
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// 3. Third-party packages (MUI, Tanstack, Zod, Recharts, CopilotKit, etc.)
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';

// 4. Internal aliases (@/lib, @/services, @/hooks, @/types, @/components)
import { usePanelResize } from '@/hooks';
import { KpiCard, StatusChip } from '@/components/ui';
import type { KpiStatus } from '@/types';

// 5. Relative imports
import FilterDropdown from './FilterDropdown';
```

Within each group: alphabetical by module path. `import type` lines go at the bottom of their group.

**MUI imports:** always use individual path imports — `import Box from '@mui/material/Box'`, never `import { Box } from '@mui/material'` (the barrel hurts tree-shaking).

---

## Formatting

Prettier owns whitespace, quotes, and wrapping for code — config in `.prettierrc`. Conventions:

- **Single quotes** for JS/TS strings (`'use client'`); JSX attributes stay double-quoted (`variant="h2"`) — Prettier's default with `singleQuote: true`.
- Trailing commas everywhere (`trailingComma: "all"`), semicolons, `printWidth` 80.
- `endOfLine: "auto"` — respects each file's existing LF/CRLF, so Windows and macOS checkouts both pass `format:check`.

**Markdown is excluded** (`*.md` in `.prettierignore`) — specs, CLAUDE.md, and READMEs are hand-maintained, so Prettier never re-flows their tables or prose.

Run `npm run format` to apply, `npm run format:check` to verify. The pre-commit hook checks staged files via `format:check:staged`.

---

## Barrel Files

Three barrel files expose clean public APIs for the most-imported directories:

| Barrel | Path | Usage |
|---|---|---|
| UI components | `src/components/ui/index.ts` | `import { KpiCard, StatusChip } from '@/components/ui'` |
| Services | `src/services/index.ts` | `import { getCurrentUser, logout } from '@/services'` |
| Hooks | `src/hooks/index.ts` | `import { usePanelResize } from '@/hooks'` |

**`src/services/http.ts` is intentionally excluded from the services barrel** — it is an internal HTTP client, not part of the public service API.

**When adding a new component, service, or hook:** add its export to the relevant barrel file in the same commit. A new export that isn't in the barrel is incomplete.

**Layout components** (`src/components/layout/`) do not have a barrel — each is imported exactly once in a layout file, so there is no ergonomic gain.

---

## Commands

```bash
npm run dev                 # start the Next.js dev server (Turbopack)
npm test                    # run the full Vitest test suite (one-shot)
npm run lint                # ESLint — add -- --fix for auto-fix
npm run build                # production build (also runs type-check)
npm run typecheck            # tsc --noEmit
npm run format               # Prettier --write .
npm run format:check         # Prettier --check .
npm run validate:precommit   # runs everything the pre-commit hook runs, on demand
```

---

## Commit Quality Gates (Husky)

Configured in `chore/SPM-113`. Two git hooks run automatically — do not bypass them with `--no-verify`.

- **`commit-msg`** — `commitlint` enforces the Conventional Commits format from this file (type must be one of the enum above).
- **`pre-commit`** — runs `npm run validate:precommit`, which chains, stopping at the first failure:
  1. `npm run lint` (whole repo)
  2. `npm run typecheck` (whole repo)
  3. `npm run format:check:staged` — Prettier check on staged files only
  4. `npm run test:staged` — `vitest related --run` against staged files
  5. `npm run test:key` — a fixed manifest of always-run tests, `scripts/key-tests.txt`
  6. `npm run build:staged` — runs a full `next build` **only if** the commit touches `src/app/` or `src/components/`, otherwise a no-op. Neither `tsc` nor Vitest (jsdom, renders components in isolation) catch Next.js Server/Client Component boundary errors — e.g. a file that gained a hook (`useState`, etc.) without a `'use client'` directive, which only breaks at `next build`/`next dev` time once something imports it through a Server Component chain. Scoped to these two directories (rather than running on every commit) since that's the only place such a violation can originate — added after SPM-129 shipped exactly this bug past every other gate.

Because lint/typecheck/tests already gate every commit, there's no need to proactively re-run the full suite after every small edit while iterating — save it for right before a commit, or when explicitly asked. `test:staged`/`test:key` don't cover every file exhaustively (staged-only + a fixed manifest), so for a multi-file or shared-component change, a final `npm test` before commit is still worth doing as a broader safety net.

---

## Out of Scope (v1)

User administration UI, custom report builder, native mobile app, chatbot access for suppliers, real-time streaming data. Do not build toward these.
