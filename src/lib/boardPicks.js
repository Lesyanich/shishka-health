// Which dishes the in-restaurant TV board rotates through, and in what order.
//
// This list is the CEO's, not an algorithm's. An earlier version picked one
// hero per section automatically; that covered the menu evenly but put a 50 g
// sauce and a single slice of bread on a 55-inch screen next to the lamb. The
// running order below was chosen by hand on 2026-08-25 and should be treated
// as an editorial decision — change it when he asks, not to make it tidier.
//
// Rules he has given, in order given:
//   "all salads between the dishs" (2026-08-25) — every salad we can
//     photograph goes in. Originally spread evenly through the reel;
//     superseded by the rule below, which groups them instead.
//   "all wraps then bowls then salads" (2026-09-28) — those three sections
//     now lead the reel as three blocks, in that order, each pulled by
//     section (not by naming every dish) so a new wrap, bowl, or salad joins
//     the wall the day it goes live. This is what finally answers "wraps
//     have no auto-fill pool", open on MC 743b166f since 2026-08-27.
//   "add the breakfast also" (2026-09-28) — a fourth block, same treatment,
//     appended after salads. Section is "🍳 All-Day Breakfast", which is also
//     where Hummus, Mutabal and the two open toasts live, not just the four
//     BRK_ dishes — all of it comes in together.
//   "start with All-Day Breakfast then wraps" (2026-10-04) — reorders the four
//     lead blocks to breakfast, wraps, bowls, salads. Same four blocks, same
//     section-match rule; only which one opens the reel changes.
//     Everything else follows, in the order written below.
//
// Dishes are matched on `product_code`, never on name: names get retitled in
// the admin panel all the time, and a rename should not silently empty the
// wall screen.

/**
 * Hard ceiling; this only catches runaway growth, not meant to trim a healthy
 * reel. Raised 40 -> 56 on 2026-09-29: adding the breakfast block put the
 * curated reel at 40 slides on its own, which was silently truncating the
 * tail (chocolate, coffee, matcha) rather than guarding against anything.
 */
export const BOARD_MAX_SLOTS = 56;

/** Slots the automatic fallback aims for, if it is ever needed. See autoPick. */
export const BOARD_TARGET_SLOTS = 18;

/**
 * The tail of the reel, in the CEO's stated order — everything that isn't a
 * wrap, bowl, or salad. Those three sections are pulled separately and lead
 * the reel; see `pickBoardDishes` below.
 *
 * "All Breakfast Smashe" in his list is expanded to the four live breakfasts,
 * kept together and in menu order, because that is how he grouped them.
 */
export const BOARD_RUNNING_ORDER = [
  "SALE-SMOOTHIE_MIXED_BERRY", //          Mixed Berry Smoothie
  "SALE-MANAISH_LAMB_GF", //               Lamb Grass-Fed
  "SALE-MANAISH_ZAATAR_GF", //             zatar
  "SALE-MANAISH_FALAFEL_GF", //            Falafel
  "SALE-MANAISH_SALAMI_GF", //             salami
  "SALE-SUMMER_ROLLS_CHICKEN", //          2X Chicken Fresh Spring Rolls
  "SALE-CHOC_PREACTIVE_SQ", //             Before Workout Power Square
  "SALE-CHOC_DARK_70_ALMOND", //           70% Dark Chocolate with Roasted Almond
  "SALE-COFFEE_LATTE", //                  Latte
  "SALE-COFFEE_PASSION_FRUIT", //          Passion Fruit Coffee
  "SALE-SMOOTHIE_MANGO_STRAWBERRY", //     Mango Strawberry Smoothie
  "SALE-COFFEE_ORANGE", //                 Orange coffee
  "SALE-SMOOTHIE_CHOCO_AVO", //            Choco Avocado Smoothie
  "SALE-CHOC_COCONUT_SQ", //               Coconut Bounty
  "SALE-CHOC_HIGH_COCOA_MILK", //          High Cocoa Milk Chocolate

  // Added 2026-08-25, in the order he listed them. They sit together at the
  // tail rather than being woven into the block above because the reel loops:
  // "last" is only ever one slide away from "first", so appending costs nothing
  // and keeps his original running order legible as the thing he actually wrote.
  "SALE-SANDWICH_MEATLOAF_MELT", //        Ham Meatloaf Melt
  "SALE-HUMMUS_KEBAB_BEEF", //             Hummus Kebab Grass-Fed Beef
  "SALE-MATCHA_ORANGE", //                 Orange Matcha
  "SALE-MATCHA_ICED_LATTE", //             Iced Matcha Latte

  // The 6 Fold Wraps added 2026-09-27, and the Breakfast dishes added here on
  // 2026-08-25 (Hummus, the four BRK_ dishes, the two open toasts), used to be
  // named explicitly. Both are now picked up by section instead (see isWrap /
  // isBreakfast below), same treatment as salads, so neither needs an entry
  // of its own any more.
];

// A slide is nine parts photograph and one part price. Without either there is
// nothing to put on a 55-inch screen, and an out-of-stock dish on the wall is
// an argument at the counter. This is why Chicken Mexican Salad does not
// appear despite "all salads" — it has no photograph anywhere yet.
function isShowable(dish) {
  return Boolean(dish.cardImage) && dish.price != null && !dish.comingSoon;
}

// Matched on the section rather than the dish name, so a new salad joins the
// reel the day it goes live. Deliberately loose: a future "Small Salads"
// section counts too, which is what "all salads" means.
function isSalad(dish) {
  return /salad/i.test(dish.section_name ?? "");
}

// Matched on the section, same reasoning as isSalad. This also catches the
// rice-paper rolls and tortilla-wrap toasts: their finer category label reads
// "Rice Paper Wraps" / "Tortilla Wraps", but the website groups all of them
// under one customer-facing section, "🌯 Wraps" — which is the level "all
// wraps" means at.
function isWrap(dish) {
  return /wrap/i.test(dish.section_name ?? "");
}

// Matched on the section, same reasoning as isSalad/isWrap.
function isBowl(dish) {
  return /bowl/i.test(dish.section_name ?? "");
}

// Matched on the section, same reasoning as isSalad/isWrap/isBowl. This is
// "🍳 All-Day Breakfast", which also holds Hummus, Mutabal, and the two open
// toasts — not just the four BRK_ dishes — so all of it leads together.
function isBreakfast(dish) {
  return /breakfast/i.test(dish.section_name ?? "");
}

/* ---------------------------------------------------------------------------
   Automatic fallback.

   Only runs if NOT ONE code in BOARD_RUNNING_ORDER matches live data — which
   in practice means the product codes were renamed wholesale or the feed
   changed shape. The wall screen must not go blank because a curated list went
   stale, so it degrades to the old behaviour: the best dish from each section.
   --------------------------------------------------------------------------- */

function richness(dish) {
  return (
    (dish.description ? 2 : 0) +
    (dish.ingredients ? 1 : 0) +
    (dish.calories != null ? 1 : 0)
  );
}

function preferred(a, b) {
  if (!a) return b;
  if (Boolean(a.is_featured) !== Boolean(b.is_featured)) return a.is_featured ? a : b;
  const ra = richness(a);
  const rb = richness(b);
  if (ra !== rb) return ra > rb ? a : b;
  return a;
}

function autoPick(showable, categories, limit) {
  const rank = new Map((categories ?? []).map((c, i) => [c.id, i]));
  const rankOf = (dish) => rank.get(dish.section_id) ?? Number.MAX_SAFE_INTEGER;

  const heroBySection = new Map();
  for (const dish of showable) {
    heroBySection.set(dish.section_id, preferred(heroBySection.get(dish.section_id), dish));
  }

  const picked = new Map();
  for (const hero of heroBySection.values()) picked.set(hero.id, hero);
  for (const dish of showable) if (dish.is_featured) picked.set(dish.id, dish);

  const ordered = Array.from(picked.values()).sort((a, b) => {
    const byRank = rankOf(a) - rankOf(b);
    if (byRank !== 0) return byRank;
    return Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured));
  });

  return ordered.slice(0, limit);
}

/**
 * Build the board reel: all breakfast, then all wraps, then all bowls, then
 * all salads — each block pulled by section — followed by the rest of the
 * curated running order.
 *
 * @param {Array} dishes      dishes from useMenu()
 * @param {Array} categories  sections from useMenu(), already in sort order
 * @param {number} limit      hard cap on slides
 * @returns {Array} dishes to rotate, in display order
 */
export function pickBoardDishes(dishes, categories, limit = BOARD_MAX_SLOTS) {
  const showable = (dishes ?? []).filter(isShowable);
  if (showable.length === 0) return [];

  const byCode = new Map();
  for (const dish of showable) {
    if (dish.product_code) byCode.set(dish.product_code, dish);
  }

  // Missing codes are skipped, not fatal: a dish that sold out or lost its
  // photo simply drops off the wall until it is back.
  const spine = BOARD_RUNNING_ORDER.map((code) => byCode.get(code)).filter(Boolean);

  if (spine.length === 0) return autoPick(showable, categories, BOARD_TARGET_SLOTS);

  // Breakfast, then wraps, then bowls, then salads, in that order. A dish
  // only leads once even if it somehow matches more than one bucket (checked
  // in this order), and it is dropped from the historic spine below so it is
  // not shown twice.
  const lead = [];
  const seen = new Set();
  for (const test of [isBreakfast, isWrap, isBowl, isSalad]) {
    for (const dish of showable) {
      if (!test(dish) || seen.has(dish.id)) continue;
      seen.add(dish.id);
      lead.push(dish);
    }
  }

  const rest = spine.filter((d) => !seen.has(d.id));

  return [...lead, ...rest].slice(0, limit);
}
