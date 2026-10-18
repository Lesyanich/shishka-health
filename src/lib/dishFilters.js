/*
  The diet filter in the Filters sheet — the only page-wide filter besides the
  quick filters (lib/quickFilters.js).

  There is NO allergen filter. The CEO ruled (2026-10-18) that the sheet must not
  name allergens at all, so the "Exclude allergens" section, its chips and its
  caution line are gone, along with the state and options behind them. Do not
  rebuild it from `dish.allergens`: 24 of 81 live dishes carry no allergen tag and
  40 of 81 have unreviewed ingredient data (fn_dish_allergen_status
  confident:false), so hiding every dish tagged "Dairy" would imply the rest are
  dairy-free, which the data cannot promise.

  What remains is dormant today. Every one of the 121 tag links on the live menu
  is an allergen tag, so there is no dietary tag to offer and the sheet's
  "Suitable for" section does not render. It appears by itself the day someone
  tags the menu — and then it is a CEO call whether it should (#75 holds diet
  tags back until a derivation mechanism exists and each dish is reviewed).

  Options come from the tags the menu's own dishes carry, never from a hardcoded
  list, so a tag nobody has applied is never offered.
*/

// Most-used first, so the common choice is not buried alphabetically.
export function buildDietOptions(dishes) {
  const seen = new Map();
  for (const dish of dishes ?? []) {
    for (const tag of dish.tags ?? []) {
      if (tag.tag_group === "allergen") continue;
      const hit = seen.get(tag.slug) ?? { id: tag.slug, label: tag.name, n: 0 };
      hit.n += 1;
      seen.set(tag.slug, hit);
    }
  }
  return Array.from(seen.values()).sort(
    (a, b) => b.n - a.n || String(a.label).localeCompare(String(b.label)),
  );
}

// Every selected diet must be present on the dish.
export function dishPasses(dish, diets) {
  const have = dish?.diets ?? [];
  for (const id of diets) if (!have.includes(id)) return false;
  return true;
}
