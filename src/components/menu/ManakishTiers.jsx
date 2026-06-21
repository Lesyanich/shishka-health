/*
  Manakeesh section — a big "manakish" title + tagline, then ALL tiers
  (Classic → Specialty → Premium) stacked vertically so the whole range is
  visible at once. Each tier is a band: a price/name header over a responsive
  grid of clean cutout photos floating on green. The set/bundle cards render
  under this (see App.jsx). Clicking a manakeesh opens the dish detail window
  (DishDialog) via onSelect.
*/

import { useCallback, useEffect, useRef, useState } from "react";
import { PriceSeal } from "./PriceSeal.jsx";
import { DietTag } from "../filters/DietTag.jsx";

const TAGLINE = "our signature gluten-free crust crafted from potato & rice";

// Poster tier wording (DB calls the middle tier "Signature"). Title Case.
const TIER_LABEL = { signature: "Specialty" };
const tierLabel = (name) => TIER_LABEL[(name || "").toLowerCase()] ?? (name || "");

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

// Horizontal scroller for one tier: the list scrolls sideways, and the prev/next
// arrows move the row by ~one viewport so guests can reach every manakish.
function TierScroll({ children }) {
  const ref = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft >= max - 1);
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  const scrollBy = (dir) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="shk-mana__scroll">
      <button
        type="button"
        className="shk-mana__arrow shk-mana__arrow--prev"
        aria-label="Show previous"
        hidden={atStart}
        onClick={() => scrollBy(-1)}
      >
        ‹
      </button>
      <ul className="shk-mana__list" ref={ref} onScroll={update}>
        {children}
      </ul>
      <button
        type="button"
        className="shk-mana__arrow shk-mana__arrow--next"
        aria-label="Show more"
        hidden={atEnd}
        onClick={() => scrollBy(1)}
      >
        ›
      </button>
    </div>
  );
}

export function ManakishTiers({ section, tagline = TAGLINE, onSelect, onQuickAdd, addedIds }) {
  const tiers = tiersOf(section.items);

  return (
    <div className="shk-mana">
      <header className="shk-mana__head">
        <h2 className="shk-mana__title">Manakish</h2>
        <p className="shk-mana__tag">{tagline}</p>
        <DietTag type="gluten-free" />
      </header>

      <div className="shk-mana__cols">
        {tiers.map((t) => {
          const isPremium = (t.name || "").toLowerCase() === "premium";
          return (
          <div className={`shk-mana__col ${isPremium ? "is-premium" : ""}`} key={t.id}>
            <TierScroll>
                {t.minPrice != null && (
                  <li>
                    <div className="shk-mana__item shk-mana__priceitem">
                      <span className="shk-mana__disc">
                        <PriceSeal price={t.minPrice} fill />
                      </span>
                      <span className="shk-mana__price-label">{tierLabel(t.name)}</span>
                    </div>
                  </li>
                )}
                {t.items.map((d) => (
                  <li key={d.id}>
                    <div
                      className={`shk-mana__item ${d.comingSoon ? "is-soon" : ""}`}
                      role="button"
                      tabIndex={d.comingSoon ? -1 : 0}
                      onClick={() => !d.comingSoon && onSelect?.(d)}
                      onKeyDown={(e) => {
                        if (!d.comingSoon && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          onSelect?.(d);
                        }
                      }}
                      aria-label={d.name}
                    >
                      <span className="shk-mana__disc">
                        {d.image_url ? (
                          <img src={d.image_url} alt="" loading="lazy" />
                        ) : (
                          <span className="shk-mana__disc-ph" aria-hidden="true" />
                        )}
                        {d.price != null && !d.comingSoon && (
                          <span className="shk-mana__seal">
                            <PriceSeal
                              price={d.price}
                              size={46}
                              active={addedIds?.has(d.id)}
                              onClick={(e) => { e.stopPropagation(); onQuickAdd?.(d); }}
                              label={`Add ${d.name} to order`}
                            />
                          </span>
                        )}
                      </span>
                      <span className="shk-mana__item-name">{d.name}</span>
                    </div>
                  </li>
                ))}
            </TierScroll>
          </div>
          );
        })}
      </div>
    </div>
  );
}
