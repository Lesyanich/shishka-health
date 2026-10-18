/*
  Facts the menu page asks about a dish or a section, in one place so the page,
  the badges and the dialog cannot answer them differently.

  Everything here is computed from fields the site already reads (see
  contracts/menu-contract.json). No new column, no tag the data does not have.
*/

/*
  High protein — ONE rule, used by the DishCard badge and by the benefit chip in
  the dialog (lib/benefits.js imports it). SPEC §7: `protein >= 30`, computed.

  The `high-protein` TAG is deliberately not used: 16 live dishes clear 30 g and
  not one of them carries it, so reading the tag would hide the badge almost
  everywhere. Cleaning the tag up is the CEO's deferred data job (SPEC §9); when
  it happens, this stays the rule and the tag stays unread.
*/
export const HIGH_PROTEIN_G = 30;

export function isHighProtein(protein) {
  const g = typeof protein === "object" && protein !== null ? protein.protein : protein;
  return g != null && Number(g) >= HIGH_PROTEIN_G;
}

/*
  Seafood.

  TRUE means "this dish carries a seafood allergen tag". It does NOT mean the
  rest of the menu is seafood-free, and this helper must not be used as if it
  did: 8 of 81 live dishes carry `allergen-fish` or `allergen-shellfish`, there
  is no crustacean tag in the data at all, and `fn_dish_allergen_status` reports
  40 of 81 dishes as `confident: false` with BOM lines nobody has reviewed. An
  exclusion filter that hides 8 dishes promises the guest that the other 73 are
  safe, which the data cannot support — see SPEC §7.

  So: fine for labelling a dish, not fine as an allergen guarantee.
*/
const SEAFOOD_ALLERGENS = new Set([
  "allergen-fish",
  "allergen-shellfish",
  // Not in the data today. Listed so that tagging a prawn dish correctly in the
  // admin panel is all it takes for this to start working.
  "allergen-crustacean",
  "allergen-mollusc",
]);

export function isSeafood(dish) {
  return (dish?.allergens ?? []).some((slug) => SEAFOOD_ALLERGENS.has(slug));
}

/*
  The price printed on the card: the default-configured total where a dish has
  default add-ons (a dip with its bun, ฿111 + ฿38 = ฿149), else the base price.

  ONE definition, used by the card AND by the price filter, so the two cannot
  disagree. `dishPrice` below is a different thing (it prefers the build-your-own
  "from" floor) and is for section headers; filtering "Under ฿150" by it would
  hide a dish whose card plainly says ฿139.
*/
export function cardPrice(dish) {
  const p = dish?.priceDefault ?? dish?.price;
  return p == null ? null : Number(p);
}

// What the guest would actually pay for this dish: the price the card shows.
// A dish configured with default add-ons headlines base + defaults; a
// build-your-own dish with a required group and no default headlines its floor.
export function dishPrice(dish) {
  const p = dish?.priceDefault ?? dish?.priceFrom ?? dish?.price;
  return p == null ? null : Number(p);
}

/*
  "from ฿…" for a section header (SPEC §2). Coming-soon dishes are skipped:
  they have no Add button, so quoting their price would be quoting something the
  guest cannot buy. A section whose dishes are ALL coming soon returns null,
  which is what makes the header read "Coming soon" instead of a price.
*/
export function minPrice(items) {
  let min = null;
  for (const d of items ?? []) {
    if (d?.comingSoon) continue;
    const p = dishPrice(d);
    if (p == null) continue;
    if (min == null || p < min) min = p;
  }
  return min;
}

// Counts are no longer shown to the guest (SPEC §2: they are volatile and a
// small number undersells a category), but code still needs them for ordering
// and empty checks.
export function countOf(items) {
  return (items ?? []).length;
}

export function allComingSoon(items) {
  return (items ?? []).length > 0 && items.every((d) => d?.comingSoon);
}
