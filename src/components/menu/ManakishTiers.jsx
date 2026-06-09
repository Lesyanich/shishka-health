/*
  Manakeesh section — built to match the shop poster: a big "manakish" title +
  tagline, a lighter-green tier band (Classic 59 / Specialty 69 / Premium 79),
  then THREE COLUMNS (one per tier) of clean cutout photos floating on green
  with the name beneath. No shadows or scrims — the PNGs are clean cutouts.
  Clicking a manakeesh opens the dish detail window (DishDialog) via onSelect.
*/

const TAGLINE = "our signature gluten-free crust crafted from potato & rice";

// Poster tier wording (DB calls the middle tier "Signature").
const TIER_LABEL = { signature: "specialty" };
const tierLabel = (name) => {
  const n = (name || "").toLowerCase();
  return TIER_LABEL[n] ?? n;
};

const CLAIMS = ["gluten free", "zero seed oils", "grass-fed", "halal"];

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
  }
  return tiers;
}

export function ManakishTiers({ section, tagline = TAGLINE, onSelect }) {
  const tiers = tiersOf(section.items);

  return (
    <div className="shk-mana">
      <header className="shk-mana__head">
        <h2 className="shk-mana__title">manakish</h2>
        <p className="shk-mana__tag">{tagline}</p>
      </header>

      <div className="shk-mana__cols">
        {tiers.map((t) => (
          <div className="shk-mana__col" key={t.id}>
            <div className="shk-mana__colhead">
              {t.minPrice != null && (
                <span className="shk-mana__price">
                  <b>{t.minPrice}</b>
                  <small>thb</small>
                </span>
              )}
              <span className="shk-mana__tier-name">{tierLabel(t.name)}</span>
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
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <footer className="shk-mana__foot">
        <img className="shk-mana__foot-logo" src="/assets/logo-full-white.png" alt="Shishka Healthy Kitchen" />
        <ul className="shk-mana__claims">
          {CLAIMS.map((c) => <li key={c}>{c}</li>)}
        </ul>
      </footer>
    </div>
  );
}
