/*
  The quick filters on a section header (SPEC.md §3.7) — and, just as
  important, the two §3 asked for that DO NOT SHIP.

  §7a is the reasoning, checked against the live menu on 2026-10-17 and
  re-checked when this page was built:

  - **Plant-based — not shipped.** All 121 tag links on the 81 live dishes are
    `tag_group = 'allergen'`. There is not one dietary tag on the menu, so the
    chip would match ZERO dishes: a control whose only effect is to empty the
    menu. `vegan` (57 links) and `vegetarian` (62) sit on preps, RAW and
    archived rows, not on anything a guest can order. It ships the day someone
    tags the menu in the admin panel, and not before.

  - **Seafood — not shipped as a filter.** 8 of 81 dishes carry
    `allergen-fish` or `allergen-shellfish`, there is no crustacean tag in the
    data at all, and `fn_dish_allergen_status` reports 40 of 81 dishes as
    `confident: false`. Hiding those 8 tells a guest the other 73 are
    seafood-free; for someone with an allergy that is the one wrong answer that
    actually hurts. `isSeafood` in lib/dishFacts.js stays a positive LABEL
    helper, documented as unsafe for exclusion.

  What does ship is what the data supports completely. Macros are complete — 0
  of 81 dishes is missing `calories` or `protein` — so both chips below are
  computed, exact, and cannot go stale:

  - **Under 400 kcal** — §3.7's own third filter, the one §7a clears.
  - **High protein** — the same `protein >= 30` rule the card badge already
    shows (lib/dishFacts.js). Not in §3.7's list; added because shipping a
    filter ROW with a single chip in it reads like something is broken, and this
    one costs no data work and no new promise. Flagged in the PR as an addition
    to the spec.

  Each filter is `{ id, labelKey, test }`. A chip the data cannot honestly
  support has no entry here at all, rather than an entry that is switched off —
  the absence is the point.
*/
import { isHighProtein } from "./dishFacts.js";

export const KCAL_CEILING = 400;

export const QUICK_FILTERS = [
  {
    id: "under400",
    labelKey: "filter.under400",
    test: (d) => d?.calories != null && Number(d.calories) < KCAL_CEILING,
  },
  {
    id: "highProtein",
    labelKey: "filter.highProtein",
    test: (d) => isHighProtein(d?.protein),
  },
];

// Several at once, AND-ed (§3.7: "toggles, several at once"). An unknown id is
// ignored rather than throwing — filter state can outlive a filter.
export function applyQuickFilters(items, ids) {
  if (!ids || ids.length === 0) return items ?? [];
  const tests = QUICK_FILTERS.filter((f) => ids.includes(f.id)).map((f) => f.test);
  if (tests.length === 0) return items ?? [];
  return (items ?? []).filter((d) => tests.every((fn) => fn(d)));
}
