/*
  Manakeesh section — a big "manakish" title + tagline, then ALL tiers
  (Classic → Specialty → Premium) stacked vertically so the whole range is
  visible at once. Each tier is a band: a price/name header over a responsive
  grid of clean cutout photos floating on green. The set/bundle cards render
  under this (see App.jsx). Clicking a manakeesh opens the dish detail window
  (DishDialog) via onSelect.
*/

import { PriceSeal } from "./PriceSeal.jsx";

const TAGLINE = "our signature gluten-free crust crafted from potato & rice";

// Poster tier wording (DB calls the middle tier "Signature").
const TIER_LABEL = { signature: "specialty" };
const tierLabel = (name) => {
  const n = (name || "").toLowerCase();
  return TIER_LABEL[n] ?? n;
};

// Group a section's dishes into tiers (subcategories), ordered by their sort.
function tiersOf(items) {
  const map = new Map();
  for (const d of items) {
    const id = d.subcategory_id ?? d.section_id;
    if (!map.has(id)) {
      map.set(id, { id, name: d.subcategory_name ?? "", sort: d.subcategory_sort ?? 0, items: [] });
    }
    map.get(id).items.push(d);
  }
  const tiers = Array.from(map.values()).sort((a, b) => a.sort - b.sort);
  for (const t of tiers) {
    const prices = t.items.map((d) => d.price).filter((p) => p != null);
    t.minPrice = prices.length ? Math.min(...prices) : null;
    t.maxPrice = prices.length ? Math.max(...prices) : null;
  }
  return tiers;
}

export function ManakishTiers({ section, tagline = TAGLINE, onSelect }) {
  const tiers = tiersOf(section.items);

  return (
    <div className="shk-mana">
      <header className="shk-mana__head">
        <h2 className="shk-mana__title">Manakish</h2>
        <p className="shk-mana__tag">{tagline}</p>
      </header>

      <div className="shk-mana__cols">
        {tiers.map((t) => {
          const isPremium = (t.name || "").toLowerCase() === "premium";
          return (
          <div className={`shk-mana__col ${isPremium ? "is-premium" : ""}`} key={t.id}>
            <div className="shk-mana__colhead">
              {t.minPrice != null && <PriceSeal price={t.minPrice} size={60} />}
              <span className="shk-mana__tier-name">{tierLabel(t.name)}</span>
              {isPremium && <span className="shk-mana__tier-badge">premium</span>}
            </div>

            <ul className="shk-mana__list">
              {t.items.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    className={`shk-mana__item ${d.comingSoon ? "is-soon" : ""}`}
                    onClick={() => onSelect?.(d)}
                    aria-label={d.name}
                  >
                    <span className="shk-mana__disc">
                      {d.image_url ? (
                        <img src={d.image_url} alt="" loading="lazy" />
                      ) : (
                        <span className="shk-mana__disc-ph" aria-hidden="true" />
                      )}
                    </span>
                    <span className="shk-mana__item-name">{d.name}</span>
                    {d.price != null && d.price !== t.minPrice && (
                      <span className="shk-mana__item-price num">฿{d.price}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          );
        })}
      </div>
    </div>
  );
}
