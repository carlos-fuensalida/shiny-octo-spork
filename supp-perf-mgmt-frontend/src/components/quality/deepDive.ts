import type { ViewHeaderAction } from '@/components/ui';

/**
 * The DEEP DIVE button every Quality section header carries (Figma `804:26159`,
 * `804:56708`, `804:56849`, …) — except Products on Hold, which has none.
 *
 * A disabled stub, matching the `ViewHeader` action convention: the deep-dive
 * destinations aren't specified yet, but the button is part of the design, so it
 * renders rather than being silently dropped. Sharing one const keeps the three
 * stubs from drifting apart while they're identical.
 *
 * **This const stops being shareable the moment the buttons navigate**, since
 * each section deep-dives to a different page. At that point turn it into a
 * factory — `deepDiveTo(destination)` returning a `ViewHeaderAction` with its
 * own `onClick` — so the label/icon stay shared and only the destination
 * varies. TypeScript will point at all three call sites. Deliberately not built
 * that way yet: the routing shape isn't decided, and guessing it would be the
 * wrong abstraction rather than no abstraction.
 */
export const DEEP_DIVE: ViewHeaderAction = {
  label: 'Deep Dive',
  disabled: true,
};
