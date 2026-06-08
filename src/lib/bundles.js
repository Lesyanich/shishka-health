/*
  Manakish bundle helpers for the showcase. The price model lives in the DB
  (price_tiers — read via useMenu). A bundle = pick N manakish (repeats allowed)
  at the tier's discount + K free sauces. Each manakish is discounted and rounded
  individually, matching the POS to the baht.
*/

export function tierPrice(regular, discountPct) {
  return Math.round((Number(regular) || 0) * (1 - discountPct / 100));
}

/** Available manakish (KP-FIN-MAN subtree), priced + in stock. */
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

/** "From ฿X" = cheapest fill (count × cheapest manakish at the tier discount). */
export function bundleFloor(pool, count, discountPct) {
  if (!pool.length) return null;
  const cheapest = Math.min(...pool.map((d) => Number(d.price)));
  return count * tierPrice(cheapest, discountPct);
}

/** Total for a manakish selection {dishId: qty} at the tier discount. */
export function bundleTotal(selection, pool, discountPct) {
  const byId = new Map(pool.map((d) => [d.id, d]));
  let sum = 0;
  for (const [id, qty] of Object.entries(selection)) {
    const price = byId.get(id)?.price ?? 0;
    sum += tierPrice(price, discountPct) * qty;
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
