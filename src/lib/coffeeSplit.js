/*
  THE LAST SYNTHESIZED GROUPING ON THIS SITE. It is quarantined in its own file
  on purpose: when the CEO's decision lands (SPEC §2 ‡), removing it is deleting
  this file, its one call site in useMenu.js, the two `sub.hotCoffee` /
  `sub.coldCoffee` dictionary keys and the `coffee-split` assertion in
  contracts/menu-contract.json. Nothing else knows about it.

  What it does: splits the single Coffee category (12 live dishes) into "Hot
  Coffee" and "Cold Coffee" leaves by reading the DISH NAME — 🧊, "iced",
  "cold", "tonic" — plus two product codes the names do not betray. Those two
  leaves exist nowhere in `product_categories`.

  Why that is a problem and not a convenience: the rule this business runs on is
  "what reaches the site is controlled from the admin panel". For WHICH dishes
  appear that is true — `menu_public` admits a row only on
  `product_code LIKE 'SALE-%'` AND `is_web_visible` AND NOT `is_deleted` AND the
  name not being `[ARCHIVED]%`, one switch in the admin. For HOW they are
  grouped it is false here: a guest sees two coffee groups that no one can find,
  rename or reorder in the admin, because they are made up in this function. It
  is the same shape of bug as the invented "Fresh Spring Roll" section, which is
  why searching the admin for "spring" found nothing while the site showed it
  (that one died with the rolls on 2026-10-16, shishka-os migration 480).

  It cannot be fixed from shishka-health: real subcategories are rows in
  `product_categories`, and this repo only reads. The honest fix is a small
  shishka-os migration creating "Hot Coffee" and "Cold Coffee" as real
  subcategories of Coffee and re-parenting the 12 dishes; after it, this file
  deletes itself and the admin owns the split. Until the CEO decides, the split
  stays — losing it would merge hot and iced coffee into one 12-item list, which
  is worse for the guest — and it is written down here rather than left to be
  rediscovered.
*/

// Cold = iced / cold brew / tonic. SALE-COFFEE_ORANGE and
// SALE-COFFEE_PASSION_FRUIT are cold drinks whose names say neither.
const COLD_NAME_RE = /🧊|\biced\b|\bcold\b|tonic/i;
const COLD_CODES = new Set(["SALE-COFFEE_ORANGE", "SALE-COFFEE_PASSION_FRUIT"]);

export const isCoffeeCategory = (categoryName) => /coffee/i.test(categoryName || "");

/*
  Returns the synthesized subcategory for a coffee dish, or null for anything
  that is not coffee — in which case the caller keeps the dish's real
  `category_*` fields, which is what every other dish on the menu uses.

  The id is `<category_id>:hot` / `:cold`; i18n/localize.js matches that suffix
  to translate the two invented names.
*/
export function coffeeSubcategory(dish) {
  if (!isCoffeeCategory(dish?.category_name)) return null;
  const cold = COLD_NAME_RE.test(dish.name || "") || COLD_CODES.has(dish.product_code);
  return {
    id: `${dish.category_id}:${cold ? "cold" : "hot"}`,
    name: cold ? "🧊 Cold Coffee" : "☕ Hot Coffee",
    // Hot first, cold immediately after, both inside Coffee's own slot.
    sort: (dish.category_sort_order ?? 0) + (cold ? 0.5 : 0),
  };
}
