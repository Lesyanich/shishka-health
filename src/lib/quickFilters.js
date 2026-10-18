/*
  The menu's quick filters — ONE row for the whole menu (SPEC.md §3.7, revised
  2026-10-18: the per-section rows are gone; they repeated the same two chips
  under every one of ten sections).

  SINGLE-SELECT. Choosing a chip switches the previous one off; tapping the active
  chip clears it. (The CEO's call, 2026-10-18 — they were briefly AND-ed, which
  made dead ends: High protein + Low carb matches no food dish at all.)

  Five filters. The first three are NUTRITION filters, the last two are not, and
  that split is the whole design:

    under400     calories < 400
    highProtein  protein >= 30          (lib/dishFacts.js, the card badge's rule)
    lowCarb      carbs <= 20 g
    under150     the price the card shows <= ฿150
    seafood      the dish carries allergen-fish or allergen-shellfish

  NUTRITION FILTERS APPLY TO FOOD ONLY (everything outside the DRINK group).
  Measured on the live menu: "Under 400 kcal" matches 54 dishes and 32 of them
  are drinks (coffee is 0–150 kcal), so on a mixed menu it degenerates into
  "show me coffee". Low carb is the same story (15 of 22 matches are drinks).
  So a nutrition chip never touches a drink; the page says so in words and folds
  the drink sections behind a disclosure instead (components/menu/MenuSection).
  Price and seafood are not about nutrition, so they apply to everything.

  "Food" is "not in the DRINK group", not "in EAT or SWEET". A section no group
  claims (a section added after menu_groups was written) therefore gets the
  nutrition filters. That is the safe direction to be wrong in: the alternative
  is a guest with a filter on seeing unfiltered food under it.

  THE SEAFOOD CHIP IS POSITIVE ONLY. It shows dishes listed with fish or
  shellfish, and it must never read as "seafood-free": 40 of 81 dishes have
  unreviewed ingredient data (fn_dish_allergen_status confident:false), 24 carry
  no allergen tag at all, and there is no crustacean tag in the data. There is no
  "exclude seafood" counterpart, and no allergen exclusion ANYWHERE: the Filters
  sheet no longer names allergens at all (CEO, 2026-10-18; lib/dishFilters.js).
  SPEC §7a refused Seafood as an exclusion control for exactly this reason; the
  label option it allowed ("show it as a label on the dishes that do carry the
  tag") is this.

  Plant-based is still not offered: there is no dietary tag on the live menu, so
  the chip would match zero dishes (§7a).

  Each entry is `{ id, kind, labelKey, test }`. A chip the data cannot honestly
  support has no entry at all, rather than an entry that is switched off.
*/
import { isHighProtein, isSeafood, cardPrice, allComingSoon } from "./dishFacts.js";

export const KCAL_CEILING = 400;
export const LOW_CARB_G = 20;
export const PRICE_CEILING = 150;

// The group whose sections the nutrition filters must not touch.
export const DRINK_GROUP = "DRINK";

export const QUICK_FILTERS = [
  {
    id: "under400",
    kind: "nutrition",
    labelKey: "filter.under400",
    test: (d) => d?.calories != null && Number(d.calories) < KCAL_CEILING,
  },
  {
    id: "highProtein",
    kind: "nutrition",
    labelKey: "filter.highProtein",
    test: (d) => isHighProtein(d?.protein),
  },
  {
    id: "lowCarb",
    kind: "nutrition",
    labelKey: "filter.lowCarb",
    test: (d) => d?.carbs != null && Number(d.carbs) <= LOW_CARB_G,
  },
  {
    id: "under150",
    kind: "menu",
    labelKey: "filter.under150",
    test: (d) => {
      const p = cardPrice(d);
      return p != null && p <= PRICE_CEILING;
    },
  },
  {
    id: "seafood",
    kind: "menu",
    labelKey: "filter.seafood",
    test: (d) => isSeafood(d),
  },
];

// Filter state can outlive a filter; an unknown id is ignored, never thrown on.
function filterOf(id) {
  return QUICK_FILTERS.find((f) => f.id === id) ?? null;
}

export function hasNutritionActive(id) {
  return filterOf(id)?.kind === "nutrition";
}

/*
  One section through the active filter.

    items      what the section shows when open. For a food section: the filter.
               For a drink section: the filter only if it is NOT a nutrition
               one, because a calorie filter has no meaning for a latte.
    collapsed  a drink section while a nutrition filter is on, with at least one
               dish left. The page renders it as a one-line disclosure, not as a
               silent gap: the guest is told in words that the calorie / protein
               / carb filter does not apply, and can open it.

  A section with no items left is the caller's to drop (see applyQuickFilters).
*/
export function filterSection(section, id) {
  const f = filterOf(id);
  if (!f) return { ...section, collapsed: false };

  const isDrink = section.group === DRINK_GROUP;
  const nutrition = f.kind === "nutrition";
  const items = isDrink && nutrition ? section.items ?? [] : (section.items ?? []).filter(f.test);

  return {
    ...section,
    items,
    allSoon: allComingSoon(items),
    collapsed: isDrink && nutrition && items.length > 0,
  };
}

/*
  The whole menu through the filter.

  Returns the sections that still have something to show — a section with zero
  matches leaves the page AND the rail / left nav together, because both are
  built from this list (otherwise the scroll-spy would point at nothing) — and
  `shown`, the number of dishes a guest can see WITHOUT opening anything.

  `shown` deliberately does not count a collapsed drink section: its dishes are
  behind a disclosure, and counting them would make "Dishes shown 22 / 81" claim
  a menu the guest is not looking at. Expanding a section does not change it
  either, so the number stays put while the guest explores.
*/
export function applyQuickFilters(sections, id) {
  const out = [];
  let shown = 0;
  for (const s of sections ?? []) {
    const f = filterSection(s, id);
    if (f.items.length === 0) continue;
    out.push(f);
    if (!f.collapsed) shown += f.items.length;
  }
  return { sections: out, shown };
}
