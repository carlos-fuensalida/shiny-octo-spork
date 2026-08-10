# PRD-frontend.md — SPMS Dashboard (Frontend)

Component Requirements Document

---

## 1. Document Control

| Field | Value |
|---|---|
| Component | Frontend (Web Dashboard) |
| Tech | Next.js (App Router), TypeScript, Material UI, Cloud Run |
| Version | 0.1 (Draft) |
| Status | Draft for stakeholder review |
| Owner | Full-Stack Developers |
| Parent | `PRD.md` |
| Peers | `PRD-backend-a.md`, `PRD-backend-b.md`, `PRD-ai-agent.md` |

Requirement IDs in this document are namespaced `FE-###`.

---

## 2. Purpose and Objectives

Deliver a consistent, responsive analytical dashboard built from a reusable design system, fast to extend as new KPI views are added. Objectives from the spec: consistent UI across views, minimal duplicated UI code, a reusable component library, fast implementation from Figma, easy maintenance, easy onboarding, and a responsive experience.

---

## 3. Technology and Architecture Constraints

- **FE-C1. Framework and language.** Next.js App Router, TypeScript.
- **FE-C2. Styling order of preference.** MUI Theme, then global CSS, then CSS Modules, then MUI `sx`, choosing the best fit per case. Tokens are the single source of truth for colors, spacing, typography, borders, and shadows.
- **FE-C3. Component library and icons.** Material UI and Material Icons.
- **FE-C4. Charts.** Recharts or shadcn/ui charts. Visualizations are simple, so pick whichever is more flexible per chart type (OQ-FE-1). Charts must meet WCAG AA (FE-C11).
- **FE-C5. Validation.** Zod, kept and scoped to validating API responses at the service boundary and parsing URL/query params. Not used for forms.
- **FE-C6. Rendering model.** Server-first: RSC for initial data fetch, client components for filters, charts, and chat.
- **FE-C7. Chatbot UI.** Use CopilotKit Generative UI for dynamic, agent-driven visualizations inside the chat surface.
- **FE-C8. Server state.** TBD, TanStack Query proposed (OQ-FE-2).
- **FE-C9. API access.** All backend communication goes through services in `src/services/`. No page or component calls HTTP directly. Reusable components never call APIs; they receive props.
  - Data, auth, supplier, and filter requests go to **Backend A** (`NEXT_PUBLIC_API_BASE_URL`).
  - Chat requests go directly to **Backend B** (`NEXT_PUBLIC_CHAT_API_BASE_URL`). They do not route through Backend A.
- **FE-C13. Auth token storage.** The frontend never stores or reads the access token. Backend A delivers it as an `HttpOnly` cookie after the Google SSO callback; the browser attaches it automatically on every request. The frontend's only auth responsibilities are: (1) Next.js middleware redirects unauthenticated requests to `GET /api/v1/auth/login`; (2) calling `GET /auth/me` after the callback to hydrate the user context; (3) calling `POST /auth/logout` on sign-out. Token refresh handling depends on OQ-Sec-2 (explicit endpoint vs automatic rotation).
- **FE-C10. Layout.** All views share one layout in `app/layout.tsx` containing Header, Navigation, and Chatbot UI. Pages provide content only and contain no layout components.
- **FE-C11. Accessibility.** WCAG 2.1 AA minimum: keyboard navigation, visible focus states, semantic HTML, accessible forms, accessible charts where possible.
- **FE-C12. Responsiveness.** Responsive web for desktop and tablet. Mobile app is out of scope; mobile browser is best-effort.

---

## 4. Project Structure and Conventions

```
src/
  app/         Route definitions (server-first)
  components/  Reusable UI (no API calls)
  features/    Feature-specific functionality
  services/    API access (only place that calls the Data API)
  hooks/       Reusable hooks (e.g. useDashboardData.ts)
  types/       Shared TypeScript models (DashboardMetric, UserPreference)
  lib/         Utilities
specs/         Feature specs for spec-driven development
```

Naming: Components PascalCase (`StatCard.tsx`), services `dashboard.service.ts`, hooks `useDashboardData.ts`, types `DashboardMetric`, `UserPreference`.

Component strategy: pages compose components; create a reusable component when a pattern appears in two or more places; never copy components between views; prefer variants over duplicates (e.g. `Button` with `primary` / `secondary` / `danger`, not `BlueButton` / `RedButton`).

---

## 5. Design System Strategy

Layering, from the spec: **Tokens → UI Components → Layout Components → Feature Components → Pages.**

- **FE-FR-001. Tokens.** Define design tokens (color, spacing, typography, borders, shadows) as the single styling source, wired into the MUI theme.
  - *Acceptance:* Given a token change, when the app rebuilds, then the change propagates everywhere with no per-component overrides.
- **FE-FR-002. UI component library.** Build base components (Button, StatCard, DataTable, Filter controls, Chart wrappers, Empty/Loading/Error states) as reusable, prop-driven, API-free components.
- **FE-FR-003. Layout components.** Header, Navigation, and the Chatbot panel live in the shared layout.
- **FE-FR-004. Figma parity.** Implement against Figma (main views largely complete; per-KPI pages pending, DEP3). Validate each view against Figma before it is considered done.

---

## 6. Functional Requirements — Views

The system has five primary views plus per-KPI detail views (~20). Suppliers see only the limited public view (Section 7).

- **FE-FR-010. Shared layout.** Every internal view renders inside the shared layout with Header, Navigation across the five primary views, and the Chatbot panel.
  - *Given* an authenticated internal user, *when* any view loads, *then* the layout and chat panel are present and consistent.
- **FE-FR-011. Summary view (leadership).** Show headline quality and delivery KPIs with value, target, direction, and trend. Optimized for a fast, uncluttered read.
- **FE-FR-012. Quality view.** Show all finalized quality KPIs with breakdowns and trends, honoring global and view-specific filters.
- **FE-FR-013. Delivery view.** Show all finalized delivery KPIs, same filter model.
- **FE-FR-014. Supplier view.** Show per-supplier KPI performance for internal users (all suppliers visible).
- **FE-FR-015. Supplier Comparison view.** Let internal users select two or more suppliers and compare their KPIs side by side.
  - *Given* two selected suppliers, *when* comparison renders, *then* matching KPIs are shown aligned for direct comparison.
- **FE-FR-016. Per-KPI views.** For each finalized KPI, provide a dedicated detail view (values, breakdowns, trend, target). Delivered incrementally as KPIs are finalized.
  - *Empty state:* KPIs without a finalized definition/source do not appear in navigation.
- **FE-FR-017. Loading, empty, and error states.** Every data view renders explicit loading, empty (`data: []`), and error states from the standard UI components. No blank screens.
- **FE-FR-018. Data currency.** Display the `data_as_of` timestamp returned by the API so users know how fresh the data is.

---

## 7. Supplier Limited Public View

- **FE-FR-020. Signed-URL entry.** A supplier opens a signed URL and lands directly on the limited public view. No SSO, no login screen.
- **FE-FR-021. Scoped content only.** Render only the data the backend returns for that link. No navigation to internal views, no Supplier Comparison, no other suppliers' data.
- **FE-FR-022. No chatbot.** The Chatbot panel is not rendered in the supplier layout.
- **FE-FR-023. Expiry handling.** When the backend reports an expired or invalid link, show a clear "link expired" message rather than an error page.

---

## 8. Filters and Saved Filters

- **FE-FR-030. Global filters.** Provide a global filter bar that applies across views, plus additional per-view filters where a view needs them.
  - *Given* a global filter change, *when* the user navigates between views, *then* the global filter persists; per-view filters reset to that view's defaults.
- **FE-FR-031. Save filter set.** Let internal users save a named filter combination (scoped global or per view) via the Data API.
- **FE-FR-032. Reuse saved filters.** List and apply saved filter sets; allow update and delete of the user's own sets.
- **FE-FR-033. URL-encoded filters.** Encode active filters in the URL (validated with Zod) so views are shareable and reload-safe.

---

## 9. Chatbot UI (internal only)

- **FE-FR-040. Embedded chat panel.** Render the chat panel in the shared layout for internal users, backed by CopilotKit Generative UI.
- **FE-FR-041. Scope toggle.** Let the user choose `Global` or `Current view` scope for each conversation.
  - *Given* `Current view` scope, *when* the user sends a message, *then* the request includes the active filters and the current view's dataset/summary as context (assembled and sent directly to the Chat Service, per `PRD-backend-b.md` BE-B-FR-010).
- **FE-FR-042. Context persistence and new session.** Persist conversation context as the user moves between views, and provide a clear "start new conversation" action (session managed by the agent via ADK).
- **FE-FR-043. Generative visualizations.** Render agent-returned visualizations dynamically in the chat surface via CopilotKit Generative UI.
- **FE-FR-044. Traceability display.** Where the agent returns a source/query reference, surface it so the user can see the answer is grounded.
- **FE-FR-045. Chat calls go through services only.** The chat service in `src/services/` calls Backend B (Chat Service) directly. The frontend never calls the AI Agent directly (FE-C9). See `CHAT_API_SPEC.md` for the endpoint contract.

---

## 10. Non-Functional Requirements

| ID | Area | Target |
|---|---|---|
| FE-NFR1 | Performance | Interactive within a few seconds; latency is not critical (analytical system) |
| FE-NFR2 | Accessibility | WCAG 2.1 AA across views and charts |
| FE-NFR3 | Responsiveness | Desktop and tablet supported; mobile browser best-effort |
| FE-NFR4 | Maintainability | Reusable components, single token source, minimal duplication |
| FE-NFR5 | Onboarding | Clear structure and naming so new developers ramp quickly |

---

## 11. Testing Strategy

- **FE-T1. Unit tests (Vitest).** Components and utility functions, including empty/loading/error states.
- **FE-T2. Integration tests (Vitest).** Services layer against mocked API contracts (validated with Zod).
- **FE-T3. End-to-end tests (Playwright).** Critical journeys: SSO login and land on Summary; apply and save a filter; compare suppliers; open a scoped chat and receive a grounded answer; open an expired supplier link.
- **FE-T4. Accessibility checks.** Automated a11y checks in CI plus keyboard-navigation verification on critical journeys.
- **FE-T5. Figma validation.** Each view checked against Figma before sign-off.

---

## 12. Development Workflow

Follow the spec's order: Requirements, Data Model, API Specification, Design Tokens, Component Inventory, Shared Layout, View Implementation, Validate against Figma. Per-KPI views are implemented as each KPI is finalized.

---

## 13. Open Questions

| ID | Question | Status |
|---|---|---|
| OQ-FE-1 | Recharts vs shadcn/ui charts per chart type | Open |
| OQ-FE-2 | Server-state library (TanStack Query proposed) | Open |
| OQ-FE-3 | Exact global vs per-view filter split per view | Depends on finalized KPIs |
| OQ-FE-4 | Per-KPI view designs | Pending Figma (DEP3) |
| OQ-FE-5 | CopilotKit integration shape with Backend B (Chat Service) | To align with backend/agent — see OQ-Chat-6 in CHAT_API_SPEC.md |
