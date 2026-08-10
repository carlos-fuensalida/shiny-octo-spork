# SPM-131 — Quality: GSIR

**Branch:** `feature/SPM-131-quality-gsir`
**Status:** Draft — refine at pickup
**Epic:** [Quality Page](./README.md) — read for shared context
**Figma:** section `804:26173`; "Card with side menu Template" `804:26180`

---

## Scope

The GSIR section — a **card with a side menu** (1360px wide). Most complex single section;
own unknowns (side-menu navigation, multiple data blocks — R12 / 5 Stars / TCQ / FPS / MVT
per OQ-MAP-4). Own PR.

## To confirm at pickup

- Side-menu structure and which sub-views it switches between (`get_design_context` on `804:26180`).
- **OQ-MAP-4** — do GSIR sub-views map to separate endpoints or one endpoint with blocks?
- **OQ-MAP-10** — what is `LOS` (Level of Service)? computed or direct value?
- `GsirKpiDetail` shape (proposed in `DATA_MODEL_SPEC.md` after T1).

## Components

- New: GSIR card-with-side-menu. Reuse: `SectionHeader` (T2), possibly the chart card (T3) and `DataTable`.
- Update barrel + inventory for anything new.

## States (§14)

Loading / empty / error / success — plus per-sub-view state if the side menu lazy-loads blocks.

## Tests (same PR)

- Section smoke test across §14 + side-menu switching.

## Acceptance criteria (draft)

- [ ] GSIR section renders card + side menu from mock data
- [ ] Side-menu navigation works; each sub-view has its §14 states
- [ ] Responsive; colours from theme
- [ ] Tests committed; `COMPONENT_INVENTORY.md` updated
