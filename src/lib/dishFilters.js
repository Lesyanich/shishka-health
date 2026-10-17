/*
  The page-wide diet / allergen filter (the sheet behind the header's Filters
  button) — NOT the per-section quick filters, which live in lib/quickFilters.js
  and only ever make claims the data can fully support.

  This one is different in kind, and the difference is the whole reason it needs
  a note beside it: it EXCLUDES. Hiding every dish that carries `allergen-dairy`
  tells the guest the dishes left on screen are dairy-free. The data cannot
  promise that. Checked 2026-10-17 against the live menu: 24 of 81 dishes carry
  no allergen tag at all, and an empty tag list means "nobody has looked", not
  "nothing in it" (`fn_dish_allergen_status` reports 40 of 81 as not confident).
  SPEC §7a refused to ship Seafood as an exclusion control for exactly this
  reason. The sheet ships because the CEO asked for it back; it ships WITH a
  line saying so (filter.allergenNote), not instead of one.

  Options are built from the tags the menu's own dishes carry — never from a
  hardcoded list — so an allergen nobody has tagged is never offered, and a
  dietary tag appears the day someone adds one in the admin panel.
*/

// Most-used first: on a 81-dish menu, Dairy (40) and Gluten (28) are what most
// guests reach for, and an alphabetical list would bury them under "Eggs".
function optionsFor(dishes, wantAllergen) {
  const seen = new Map();
  for (const dish of dishes ?? []) {
    for (const tag of dish.tags ?? []) {
      if ((tag.tag_group === "allergen") !== wantAllergen) continue;
      const hit = seen.get(tag.slug) ?? { id: tag.slug, label: tag.name, n: 0 };
      hit.n += 1;
      seen.set(tag.slug, hit);
    }
  }
  return Array.from(seen.values()).sort(
    (a, b) => b.n - a.n || String(a.label).localeCompare(String(b.label)),
  );
}

export function buildFilterOptions(dishes) {
  return {
    dietOptions: optionsFor(dishes, false),
    allergenOptions: optionsFor(dishes, true),
  };
}

// Diets must ALL be present; excluded allergens must ALL be absent.
export function dishPasses(dish, diets, excluded) {
  const have = dish?.diets ?? [];
  const allergens = dish?.allergens ?? [];
  for (const id of diets) if (!have.includes(id)) return false;
  for (const id of excluded) if (allergens.includes(id)) return false;
  return true;
}
