/*
  Manakish sets — poster image 2: outlined cards for the 4 / 8 / 12 manakish
  sets (+ free sauces) with the tier discount. Each card shows the big count,
  "from ฿X", "manakish", "set of N + M sauce free", a free-sauce cutout and the
  discount %, then a grid of the included manakeesh cutouts. Clicking opens the
  build-your-own set dialog (BundleDialog) via onSelect.
*/

// N tiles from the manakish pool (cycle if the pool is shorter than N).
function pickItems(pool, n) {
  if (!pool || pool.length === 0) {
    return Array.from({ length: n }, () => ({ id: null, name: "", image_url: null }));
  }
  return Array.from({ length: n }, (_, i) => pool[i % pool.length]);
}

export function ManakishSets({ bundles, pool = [], sauces = [], onSelect, currency = "฿" }) {
  if (!bundles || bundles.length === 0) return null;

  return (
    <div className="shk-sets">
      {bundles.map((b, i) => {
        const items = pickItems(pool, b.manakishCount);
        const sauce = sauces.length ? sauces[i % sauces.length] : null;
        return (
          <button type="button" className="shk-set" key={b.tierCode} onClick={() => onSelect?.(b)}>
            <div className="shk-set__head">
              <span className="shk-set__num">{b.manakishCount}</span>
              <div className="shk-set__copy">
                {b.from != null && (
                  <span className="shk-set__from">from {currency}{b.from}</span>
                )}
                <span className="shk-set__title">manakish</span>
                <span className="shk-set__sub">
                  set of {b.manakishCount} + {b.sauceCount} sauce free
                </span>
              </div>
              <span className="shk-set__sauce">
                {sauce?.image_url ? (
                  <img src={sauce.image_url} alt="" loading="lazy" />
                ) : (
                  <span className="shk-set__sauce-ph" aria-hidden="true" />
                )}
              </span>
              <span className="shk-set__pct">{b.discountPct}%</span>
            </div>

            <div className="shk-set__grid">
              {items.map((d, j) => (
                <span className="shk-set__item" key={d.id ? `${d.id}-${j}` : j}>
                  <span className="shk-set__disc">
                    {d.image_url ? (
                      <img src={d.image_url} alt="" loading="lazy" />
                    ) : (
                      <span className="shk-set__disc-ph" aria-hidden="true" />
                    )}
                  </span>
                  {d.name && <span className="shk-set__item-name">{d.name}</span>}
                </span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
