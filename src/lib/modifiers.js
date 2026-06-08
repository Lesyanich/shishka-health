/*
  Build-your-own pricing helpers.

  A modifier group with minSelect > 0 is REQUIRED: the guest must pick at least
  that many options before the dish is valid. So the real entry price of such a
  dish is not its bare base price — it's the base plus the cheapest way to
  satisfy every required group.

  Example: the Custom Smoothie (Build Your Own) is ฿89 base with a "Pick Fruits"
  group at minSelect = 2. The cheapest fruits are ฿10 each, so the floor is
  ฿89 + ฿10 + ฿10 = ฿109 — rendered as "from ฿109", mirroring the manakish
  bundle "from ฿X" floor (see lib/bundles.js).
*/

/** True when any modifier group forces a minimum number of picks. */
export function hasRequiredGroup(groups = []) {
  return groups.some((g) => (g.minSelect ?? 0) > 0);
}

/**
 * Cheapest add-on cost to satisfy every required group: for each group with
 * minSelect > 0, sum the `minSelect` smallest option deltas. Returns 0 when no
 * group is required.
 */
export function requiredAddOnFloor(groups = []) {
  let extra = 0;
  for (const g of groups) {
    const min = g.minSelect ?? 0;
    if (min <= 0) continue;
    const deltas = g.options
      .map((o) => Number(o.priceDelta) || 0)
      .sort((a, b) => a - b)
      .slice(0, min);
    extra += deltas.reduce((s, d) => s + d, 0);
  }
  return extra;
}

/**
 * "From ฿X" floor for a dish: base price + cheapest required add-ons.
 * Returns null when the dish has no required group (so callers can fall back to
 * the plain price) or when the base price is unknown.
 */
export function dishFloor(basePrice, groups = []) {
  if (basePrice == null || !hasRequiredGroup(groups)) return null;
  return Number(basePrice) + requiredAddOnFloor(groups);
}
