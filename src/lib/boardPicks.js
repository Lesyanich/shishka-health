// Which dishes the in-restaurant TV board rotates through, and in what order.
//
// This list is the CEO's, not an algorithm's. An earlier version picked one
// hero per section automatically; that covered the menu evenly but put a 50 g
// sauce and a single slice of bread on a 55-inch screen next to the lamb. The
// running order below was chosen by hand on 2026-08-25 and should be treated
// as an editorial decision — change it when he asks, not to make it tidier.
//
// Two rules he gave, in his words:
//   "all salads between the dishs"  — every salad we can photograph goes in,
//                                     spread through the reel rather than
//                                     clumped in one salad block
//   everything else                 — in the order written below
//
// Dishes are matched on `product_code`, never on name: names get retitled in
// the admin panel all the time, and a rename should not silently empty the
// wall screen.

/** Hard ceiling. The curated reel is ~27 slides; this only catches runaway growth. */
export const BOARD_MAX_SLOTS = 40;

/** Slots the automatic fallback aims for, if it is ever needed. See autoPick. */
export const BOARD_TARGET_SLOTS = 18;

/**
 * The spine of the reel, in the CEO's stated order. Salads are NOT in here —
 * they are interleaved between these by `interleave()` below.
 *
 * "All Breakfast Smashe" in his list is expanded to the four live breakfasts,
 * kept together and in menu order, because that is how he grouped them.
 */
export const BOARD_RUNNING_ORDER = [
  "SALE-HUMMUS_PLAIN", //                  Hummus
  "SALE-SMOOTHIE_MIXED_BERRY", //          Mixed Berry Smoothie
  "SALE-MANAISH_LAMB_GF", //               Lamb Grass-Fed
  "SALE-MANAISH_ZAATAR_GF", //             zatar
  "SALE-MANAISH_FALAFEL_GF", //            Falafel
  "SALE-BRK_EGGS_YOUR_WAY", //         ┐
  "SALE-BRK_CHEESE_EGG", //            │   All Breakfast Smashe
  "SALE-BRK_GUACAMOLE_EGG", //         │
  "SALE-BRK_DOUBLE_PROTEIN", //        ┘
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

/**
 * Spread `fill` evenly through `spine` without disturbing the spine's order.
 *
 * With 20 spine dishes and 7 salads the salads land roughly every third slide,
 * which is the point — a guest watching for a minute should see salads keep
 * coming back rather than pass once in a block and never return.
 */
function interleave(spine, fill) {
  if (fill.length === 0) return spine;
  if (spine.length === 0) return fill;

  const out = [];
  const gap = spine.length / (fill.length + 1);
  let next = 0;

  for (let i = 0; i < spine.length; i++) {
    out.push(spine[i]);
    // Emit the next filler once we have passed its ideal position. Comparing
    // against a running float keeps the spacing even when the two lengths do
    // not divide cleanly.
    while (next < fill.length && i + 1 >= Math.round((next + 1) * gap)) {
      out.push(fill[next]);
      next += 1;
    }
  }
  // Anything that did not fit (short spine) goes on the end rather than vanishing.
  for (; next < fill.length; next++) out.push(fill[next]);

  return out;
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
 * Build the board reel: the curated running order, with every showable salad
 * spread between them.
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

  // A salad named explicitly in the running order stays where he put it rather
  // than being interleaved a second time.
  const inSpine = new Set(spine.map((d) => d.id));
  const salads = showable.filter((d) => isSalad(d) && !inSpine.has(d.id));

  return interleave(spine, salads).slice(0, limit);
}
