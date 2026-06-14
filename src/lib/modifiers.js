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

/** True when any option is pre-selected by default (e.g. a dip's default bun). */
export function hasDefaultSelection(groups = []) {
  return groups.some((g) => g.options.some((o) => o.isDefault));
}

/** Sum of the default-selected options' price deltas. */
export function defaultExtra(groups = []) {
  let extra = 0;
  for (const g of groups) {
    for (const o of g.options) {
      if (o.isDefault) extra += Number(o.priceDelta) || 0;
    }
  }
  return extra;
}

/**
 * The price a dish shows when it opens "as configured by default" — base plus
 * its default-selected add-ons (e.g. dip = base + bun = ฿149). Returns null when
 * nothing is selected by default, so callers fall back to plain/from pricing.
 */
export function dishDefaultPrice(basePrice, groups = []) {
  if (basePrice == null || !hasDefaultSelection(groups)) return null;
  return Number(basePrice) + defaultExtra(groups);
}

/**
 * Sum the per-portion nutrition of the currently selected options. `selected` is
 * the Set of "${groupIndex}:${optionIndex}" keys used by the ModifierBuilder.
 * Returns rounded {calories, protein, carbs, fat} to add onto the base dish.
 */
export function selectedNutrition(groups = [], selected = new Set()) {
  const acc = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  groups.forEach((g, gi) =>
    g.options.forEach((o, oi) => {
      if (!selected.has(`${gi}:${oi}`)) return;
      acc.calories += Number(o.calories) || 0;
      acc.protein += Number(o.protein) || 0;
      acc.carbs += Number(o.carbs) || 0;
      acc.fat += Number(o.fat) || 0;
    })
  );
  return {
    calories: Math.round(acc.calories),
    protein: Math.round(acc.protein * 10) / 10,
    carbs: Math.round(acc.carbs * 10) / 10,
    fat: Math.round(acc.fat * 10) / 10,
  };
}

/**
 * Flat list of the currently selected options — {group, name, priceDelta} — for
 * carrying a configured build into the cart / counter ticket. Ordered by group
 * then option, matching the builder layout.
 */
export function selectedOptionsList(groups = [], selected = new Set()) {
  const out = [];
  groups.forEach((g, gi) =>
    g.options.forEach((o, oi) => {
      if (selected.has(`${gi}:${oi}`)) {
        out.push({ group: g.name, name: o.name, priceDelta: Number(o.priceDelta) || 0 });
      }
    })
  );
  return out;
}
