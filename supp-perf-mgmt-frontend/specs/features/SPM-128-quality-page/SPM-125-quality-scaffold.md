# SPM-125 — Quality Page Scaffold

**Branch:** `feature/SPM-125-quality-scaffold`
**Status:** Built
**Epic:** [Quality Page](./README.md) — read for shared context (data strategy, states, colour rules)
**Figma:** view header `804:26139` in frame `804:26132`, file `XDBgP7IlEw9d9xvIEinGxM`

---

## Scope

Foundation the other 7 tickets build on. Nothing renders without it.

- `/quality` route + page shell, vertical section stack with correct spacing, placeholder sections.
- **View header:** "Quality" title + "Steel Forgings · All regions" subtitle + 2 action buttons.
- Data access: `getQualityKpis(filters)` service + `useQualityKpis(filters)` hook against a
  **mocked** `GET /kpis/quality` (mirror the summary mock conventions — see epic §Data strategy).
- Page-level loading / empty / error / success (§14).
- **Move the proposed extended KPI interfaces into `DATA_MODEL_SPEC.md`** (see epic §Data strategy)
  so T3–T8 build on committed types.

## Decisions (resolved at pickup)

- **Header:** shared **`ViewHeader`** (`ui/`) — title + subtitle + `actions[]`. Quality passes two **disabled stubs**, **FILTERS** (`FilterListIcon`) + **EXPORT** (`SaveAltIcon`), per Figma `804:26139`. The header was first built as a per-view `QualityHeader`, but that was a near-duplicate of the existing `SummaryHeader`; both were replaced by the generic `ViewHeader` in this PR (Summary migrated too) rather than shipping a copy — see [[prefer-generic-over-duplicate]] rule in CLAUDE.md.
- **Subtitle:** hardcoded `Steel Forgings · All regions` at the page level (constants); binds to real filter state when the global filter bar is wired.
- **Section spacing:** uniform **24px** between sections and header — `gap={6}` — measured off the frame (each section top is 24px below the previous section's bottom).
- **Placeholders:** minimal titled placeholders (`SectionPlaceholder`) — a bordered box with the section title + "Section coming soon". The real shared `SectionHeader` and section content stay in T2–T8.
- **Footer:** the "As of …" footer helper (`formatAsOfFooter`) was extracted to `lib/format.ts` — it had been copy-pasted into all four section components; consolidated here.
- **Extended interfaces:** already committed to `DATA_MODEL_SPEC.md` + `src/types/index.ts` (with detail service fns in `kpi.service.ts`) before this ticket — no move needed. Corrected the stale "only proposed" note in the epic README.

## Components

- Reuse: `EmptyState`, `ErrorState`, and the shared **`ViewHeader`** (`ui/`).
- New: `ViewHeader` (`ui/`, generic, replaces `SummaryHeader`/`QualityHeader`); feature-scoped `QualitySections`, `SectionPlaceholder` (+ `.Skeleton`) in `src/components/quality/`. See `COMPONENT_INVENTORY.md`.

## States (§14)

Page-level skeleton (section placeholders) / empty / error (retry → refetch) / success.

## Tests (same PR)

- `src/test/api/mock/.../kpis/quality/route.test.ts` (`// @vitest-environment node`) — 401 guard, envelope, `_state` hatch.
- `src/test/services/kpi.service.test.ts` — extend for `getQualityKpis`.
- Page/section smoke test across §14 states.

## Acceptance criteria

- [x] `/quality` renders the shell + view header, section placeholders in order
- [x] `getQualityKpis` + `useQualityKpis` wired to mocked `GET /kpis/quality`
- [x] Extended KPI interfaces committed to `DATA_MODEL_SPEC.md` (already in place; verified)
- [x] All four §14 states at page level; responsive (chat open/closed)
- [x] Tests committed; `COMPONENT_INVENTORY.md` updated
