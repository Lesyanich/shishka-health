/*
  Potato Tacos bundle helpers for the showcase. The price model lives in the DB
  (price_tiers — read via useMenu). A bundle = pick N tacos (repeats allowed)
  at the tier's discount + K free sauces. Each taco is discounted and rounded
  individually, matching the POS to the baht.

  Margin floor (CEO 2026-07-23): a taco's bundle price never drops below its
  `bundle_min_price` (menu_public exposes it only when the floor binds — the
  price at which the item still holds 60% margin). Because of the clamp the
  effective discount varies per item, so all customer copy says "up to X%",
  never a flat percent.
*/

export function tierPrice(regular, discountPct, minPrice) {
  const discounted = Math.round((Number(regular) || 0) * (1 - discountPct / 100));
  return Math.max(discounted, Number(minPrice) || 0);
}

/** Available tacos (KP-FIN-MAN subtree), priced + in stock. */
export function manakishPool(dishes) {
  return (dishes ?? []).filter(
    (d) => (d.category_code || "").startsWith("KP-FIN-MAN") && d.price != null && !d.comingSoon,
  );
}

/** Free-sauce cups (KP-FIN-SDR ≤ ฿50), in stock. */
export function saucePool(dishes) {
  return (dishes ?? []).filter(
    (d) =>
      (d.category_code || "").startsWith("KP-FIN-SDR") &&
      d.price != null &&
      Number(d.price) <= 50 &&
      !d.comingSoon,
  );
}

/** "From ฿X" = cheapest fill (count × cheapest floor-clamped tier price). */
export function bundleFloor(pool, count, discountPct) {
  if (!pool.length) return null;
  const cheapest = Math.min(...pool.map((d) => tierPrice(d.price, discountPct, d.bundle_min_price)));
  return count * cheapest;
}

/** Total for a taco selection {dishId: qty} at the tier discount. */
export function bundleTotal(selection, pool, discountPct) {
  const byId = new Map(pool.map((d) => [d.id, d]));
  let sum = 0;
  for (const [id, qty] of Object.entries(selection)) {
    const dish = byId.get(id);
    sum += tierPrice(dish?.price ?? 0, discountPct, dish?.bundle_min_price) * qty;
  }
  return sum;
}

export function alaCarteTotal(selection, pool) {
  const byId = new Map(pool.map((d) => [d.id, d]));
  let sum = 0;
  for (const [id, qty] of Object.entries(selection)) sum += (Number(byId.get(id)?.price) || 0) * qty;
  return sum;
}

export function totalQty(selection) {
  return Object.values(selection).reduce((n, q) => n + q, 0);
}
