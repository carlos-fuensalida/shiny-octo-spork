# SPMS Dashboard (Frontend)

Web dashboard for the **Supplier Performance Management System (SPMS)**. Renders supplier quality and delivery KPIs across five primary views plus per-KPI detail views, includes a chatbot assistant for internal users, and serves a limited public view to suppliers via signed URL.

Full product and architecture context lives in `specs/`:

- `specs/PRD.md` — system-level goals, architecture, security, and delivery plan
- `specs/PRD-frontend.md` — this component's detailed requirements (`FE-###`)
- `specs/PRD-backend-a.md` — Data API (Backend A) contract this app consumes
- `specs/PRD-backend-b.md` — Chat Service (Backend B) contract called directly by this app
- `specs/PRD-ai-agent.md` — AI agent behavior (never called by this app directly)

## Stack

- **Next.js App Router** + TypeScript
- **Material UI** (components + icons) — MUI Theme is the primary styling mechanism, tokens-driven
- **Recharts / shadcn/ui charts** for visualizations (final pick per chart type is open, see `OQ-FE-1`)
- **Zod** for validating API responses and parsing URL/query params (not used for forms)
- **CopilotKit Generative UI** for the embedded chatbot surface
- **TanStack Query** proposed for server state (`OQ-FE-2`, unconfirmed)
- Deployed on **Cloud Run**

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Real backend** — point `.env.local` at a running Data API instance (dev/QA URL, provided by the backend team):
```
NEXT_PUBLIC_API_BASE_URL=https://api.dev.example.com
```

**Mock mode** — if the backend is unavailable, use the built-in mock handlers:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/mock
```
Then visit `http://localhost:3000/api/mock/api/v1/auth/login` once to set a session cookie. See `.env.example` for a full template.

## Architecture Rules (hard constraints)

These come directly from the PRDs and should not be relaxed without updating the specs:

- **Services-only API access.** All calls to the Data API live in `src/services/`. Pages and components never call `fetch`/HTTP directly. Reusable components never call APIs — they receive data via props.
- **No direct agent calls.** The frontend never talks to the AI Agent backend directly. Chat goes to **Backend B** (the Chat Service) which acts as the proxy to the agent — never through Backend A (the Data API).
- **Shared layout owns layout.** Header, Navigation, and the Chatbot panel live once in `app/layout.tsx`. Pages provide content only.
- **Server-first rendering.** RSC for initial data fetch; client components for filters, charts, and chat.
- **Design system layering.** Tokens → UI Components → Layout Components → Feature Components → Pages. Tokens are the single source of truth for color, spacing, typography, borders, shadows — wired into the MUI theme, not per-component overrides.
- **Component reuse over duplication.** Create a reusable component once a pattern appears in two or more places. Prefer variants (`Button` with `primary`/`secondary`/`danger`) over near-duplicate components.

## Target Project Structure

The scaffold will grow into this shape as views are built out:

```
src/
  app/         Route definitions (server-first, App Router)
  components/  Reusable UI — no API calls (Button, StatCard, DataTable, Filters, Chart wrappers, Empty/Loading/Error states)
  features/    Feature-specific functionality (per-view logic, chat, filters)
  services/    API access — the only place allowed to call the Data API
  hooks/       Reusable hooks (e.g. useDashboardData.ts)
  types/       Shared TypeScript models (DashboardMetric, UserPreference, ...)
  lib/         Utilities
  context/     React contexts (e.g. UserContext)
  test/        All test files — mirrors source path, never inside src/app/
specs/         Feature specs for spec-driven development
```

Naming conventions: components PascalCase (`StatCard.tsx`), services `*.service.ts` (`dashboard.service.ts`), hooks `use*.ts` (`useDashboardData.ts`), shared types PascalCase (`DashboardMetric`, `UserPreference`).

## Views

Five primary views, shared by all internal (SSO) users, navigable from the shared layout:

- **Summary** — leadership-facing headline quality/delivery KPIs (value, target, direction, trend)
- **Quality** — all finalized quality KPIs with breakdowns, honoring global + view filters
- **Delivery** — all finalized delivery KPIs, same filter model
- **Supplier** — per-supplier KPI performance across all suppliers (internal only)
- **Supplier Comparison** — side-by-side KPI comparison across two or more suppliers

Plus **per-KPI detail views** (~20 total), delivered incrementally as each KPI's definition and source are finalized (`DEP1`). A KPI without a finalized definition does not appear in navigation.

**Suppliers** access a separate, unauthenticated **limited public view** via a signed URL: own-data-only, no navigation to internal views, no chatbot. See `FE-FR-020` through `FE-FR-023`.

Every data view must render explicit **loading, empty (`data: []`), and error** states — no blank screens — and display the `data_as_of` timestamp returned by the API.

## Filters

- A global filter bar applies across views; per-view filters layer on top and reset to defaults on navigation while the global filter persists.
- Active filters are URL-encoded and validated with Zod, so views are shareable and reload-safe.
- Internal users can save, list, update, and delete named filter sets through the Data API.

## Chatbot (internal users only)

- Embedded in the shared layout; not rendered at all in the supplier layout.
- Users toggle `Global` vs `Current view` scope per conversation; current-view scope sends active filters plus the view's dataset/summary as context.
- Conversation context persists across view navigation, with a "start new conversation" action; session state is managed by the agent (Google ADK).
- Agent responses include a traceable query/source reference, surfaced in the UI so answers are visibly grounded.
- All chat requests go through `src/services/chat.service` **directly to Backend B** (the FastAPI Chat Service). Backend B proxies to the AI agent — the frontend never calls Backend A (Data API) for chat.

## Accessibility & Responsiveness

- WCAG 2.1 AA minimum across all views and charts: keyboard navigation, visible focus states, semantic HTML, accessible forms.
- Responsive for desktop and tablet. No native mobile app; mobile browser is best-effort only.

## Testing

All test files live in `src/test/` mirroring the source path (e.g. `src/services/auth.service.ts` → `src/test/services/auth.service.test.ts`). Never place tests inside `src/app/` — Turbopack scans that directory as the Next.js module graph and will hang the dev server trying to resolve test framework imports.

- **Unit (Vitest):** components, services, and route handlers. Route handler tests use `// @vitest-environment node`.
- **Integration (Vitest):** services layer against mocked API contracts, validated with Zod.
- **End-to-end (Playwright):** critical journeys — SSO login → Summary, apply/save a filter, compare suppliers, scoped chat with a grounded answer, expired supplier link.
- **Accessibility:** automated a11y checks in CI plus manual keyboard-navigation verification on critical journeys.
- **Figma validation:** every view checked against Figma before sign-off.

## Commit Quality Gates

This repository enforces local commit quality gates with npm, Husky, and Commitlint.

### One-time setup

```bash
npm install
npm run prepare
```

`npm run prepare` installs Husky hooks into `.git/hooks`. It runs automatically after `npm install` via the `prepare` script, but can be run manually any time.

### Hook behavior

- `pre-commit` runs `npm run validate:precommit` and blocks the commit if any check fails.
- `commit-msg` runs Commitlint against your commit message and rejects messages that do not follow the project standard.

`validate:precommit` runs:

1. ESLint (`npm run lint`)
2. TypeScript type check (`npm run typecheck`)
3. Formatting validation for staged files (`npm run format:check:staged`)
4. Affected tests for staged source files (`npm run test:staged`)
5. Key regression test subset (`npm run test:key`)

The key regression test list is maintained in `scripts/key-tests.txt` (one test file path per line, relative to repo root). Comments are supported with `#`.

To edit the key list:

1. Add or remove test file paths in `scripts/key-tests.txt`.
2. Keep one path per line.
3. Run `npm run test:key` to validate the list.

### Conventional commit examples

Allowed types are: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`.

Valid examples:

```text
feat: add supplier comparison filter persistence
fix: handle empty quality kpi payload
chore: configure husky commit quality gates
docs: update contributing guide for commit hooks
test: add tests for kpi service error handling
```

Invalid examples:

```text
feature: add new chart
SPM-104 add summary section
Added new tests
```

### Troubleshooting

- Hooks not running after install: run `npm run prepare`.
- `npm` blocked in PowerShell due execution policy: use `npm.cmd`.
- Commit rejected by format check: run `npm run format` and retry.
- Commit rejected by lint/type/test: fix the reported errors and commit again.
- Commit message rejected: rewrite the message using an allowed conventional type.
- `test:key` fails with missing files: update `scripts/key-tests.txt` so every listed path exists.

## Development Workflow

Per the spec, build in this order: Requirements → Data Model → API Specification → Design Tokens → Component Inventory → Shared Layout → View Implementation → Validate against Figma. Per-KPI views are implemented incrementally as each KPI is finalized by stakeholders.

## Open Questions Affecting This App

See `specs/PRD-frontend.md` §13 for the full list, notably:

- `OQ-FE-1` — Recharts vs shadcn/ui charts, decided per chart type
- `OQ-FE-2` — Server-state library (TanStack Query proposed, unconfirmed)
- `OQ-FE-3` — Exact global vs per-view filter split, pending finalized KPIs
- `OQ-FE-4` — Per-KPI view designs, pending Figma
- `OQ-FE-5` — CopilotKit integration shape with the Data API chat proxy
