# SPM-134 — Quality: Risk Rating + 8Ds

**Branch:** `feature/SPM-134-quality-risk-8ds`
**Status:** Draft — refine at pickup
**Epic:** [Quality Page](./README.md) — read for shared context
**Figma:** Risk Rating `1365:13014` (Components `1365:13044`, FPS `1365:13067`); 8Ds `804:26275` (table `1365:14512`)

---

## Scope

Three plain `DataTable`s → one review unit.

- Risk Rating: two side-by-side tables — Components (`Preferred / Not Preferred / New Business on Hold`)
  and FPS (`On Quality / Not on Quality`), each with a footer text.
- 8Ds: one table (`Total Open 2026 / Open > 90 Days / Open > 45 Days`), rows Global / LAR / NAR.

## To confirm at pickup

- Footer text content for the Risk Rating tables (`get_design_context`).
- Shapes: `RiskRatingComponentsKpi`, `RiskRatingFpsKpi`, `OpenActionsKpi` (in `DATA_MODEL_SPEC.md` after T1).

## Components

- Reuse: `DataTable` (footer supported), `SectionHeader` (T2). No new reusable components.

## States (§14)

Loading (skeleton rows) / empty / error / success — per table.

## Tests (same PR)

- Section smoke tests across §14 for all three tables.

## Acceptance criteria (draft)

- [ ] Risk Rating (two tables + footers) and 8Ds (one table) render from mock data
- [ ] Side-by-side Risk tables stack when narrow (chat open); all four §14 states
- [ ] Tests committed
