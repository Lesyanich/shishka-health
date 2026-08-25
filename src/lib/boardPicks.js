// Which dishes the in-restaurant TV board rotates through.
//
// The board is a hero reel, not the menu: a guest waiting at the counter sees
// maybe three slides, so showing all 88 live dishes (a ~12 minute loop) would
// mean most of the menu is never seen by anyone. Instead we show one strong
// dish per section, which covers the whole breadth of the menu in ~2 minutes.
//
// Nothing here is stored — the board picks itself from whatever is live, so a
// new dish joins the reel the day it gets a photo and no list needs curating.
// Flagging a dish `is_featured` in the admin panel is the manual override:
// featured dishes are always in, and win their section's slot.

export const BOARD_TARGET_SLOTS = 18;

// A slide is nine parts photograph and one part price. Without either there is
// nothing to put on a 55-inch screen, and an out-of-stock dish on the wall is
// an argument at the counter.
function isShowable(dish) {
  return Boolean(dish.cardImage) && dish.price != null && !dish.comingSoon;
}

// How much of the slide we can actually fill. A dish with a description and
// nutrition reads as a finished slide; one with only a name and price leaves
// two thirds of the panel empty, so it loses the slot to a sibling that has
// the copy — even though both are perfectly sellable.
function richness(dish) {
  return (
    (dish.description ? 2 : 0) +
    (dish.ingredients ? 1 : 0) +
    (dish.calories != null ? 1 : 0)
  );
}

// Input order is display_order (useMenu sorts by it), so ties resolve to
// whichever the menu already puts first. Returning `a` on a tie keeps the
// comparison stable across renders.
function preferred(a, b) {
  if (!a) return b;
  if (Boolean(a.is_featured) !== Boolean(b.is_featured)) return a.is_featured ? a : b;
  const ra = richness(a);
  const rb = richness(b);
  if (ra !== rb) return ra > rb ? a : b;
  return a;
}

/**
 * Build the board reel: the best dish from each section, plus every featured
 * dish, walked in menu order so the screen reads top-to-bottom down the menu.
 *
 * @param {Array} dishes      dishes from useMenu()
 * @param {Array} categories  sections from useMenu(), already in sort order
 * @param {number} limit      hard cap on slides
 * @returns {Array} dishes to rotate, in display order
 */
export function pickBoardDishes(dishes, categories, limit = BOARD_TARGET_SLOTS) {
  const showable = (dishes ?? []).filter(isShowable);
  if (showable.length === 0) return [];

  // Section rank drives the running order, so the reel walks the menu the same
  // way the printed board does instead of jumping around.
  const rank = new Map((categories ?? []).map((c, i) => [c.id, i]));
  const rankOf = (dish) => rank.get(dish.section_id) ?? Number.MAX_SAFE_INTEGER;

  const heroBySection = new Map();
  for (const dish of showable) {
    const key = dish.section_id;
    heroBySection.set(key, preferred(heroBySection.get(key), dish));
  }

  const picked = new Map();
  for (const hero of heroBySection.values()) picked.set(hero.id, hero);
  // Featured is the CEO's thumb on the scale: it never loses to the automatic
  // pick, even in a section that already filled its slot.
  for (const dish of showable) {
    if (dish.is_featured) picked.set(dish.id, dish);
  }

  const ordered = Array.from(picked.values()).sort((a, b) => {
    const byRank = rankOf(a) - rankOf(b);
    if (byRank !== 0) return byRank;
    // Within a section the featured dish leads.
    return Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured));
  });

  // Trim from the back rather than sampling: the reel stays contiguous in menu
  // order, so a shortened loop is still a coherent walk through the menu.
  return ordered.slice(0, limit);
}
