/*
  Manakeesh section — a big "manakish" title + tagline, then ALL tiers
  (Classic → Specialty → Premium) stacked vertically so the whole range is
  visible at once. Each tier is a band: a price/name header over a responsive
  grid of clean cutout photos floating on green. The set/bundle cards render
  under this (see App.jsx). Clicking a manakeesh opens the dish detail window
  (DishDialog) via onSelect.
*/

import { PriceSeal } from "./PriceSeal.jsx";
import { optimizedSrc } from "../../lib/img.js";
import { DietTag } from "../filters/DietTag.jsx";
import { t, t as tr, LANG, DEFAULT_LANG } from "../../i18n/index.js";

const TAGLINE = t("tacos.tagline");

// Poster tier wording (DB calls the middle tier "Signature"). Title Case.
// Keyed on the ENGLISH tier name; other languages show the translated DB name.
const TIER_LABEL = { signature: "Specialty" };
const tierLabel = (tier) =>
  LANG === DEFAULT_LANG
    ? TIER_LABEL[(tier.key || "").toLowerCase()] ?? (tier.name || "")
    : tier.name || "";

// Group a section's dishes into tiers (subcategories), ordered by their sort.
function tiersOf(items) {
  const map = new Map();
  for (const d of items) {
    const id = d.subcategory_id ?? d.section_id;
    if (!map.has(id)) {
      map.set(id, {
        id,
        name: d.subcategory_name ?? "",
        key: d.subcategory_key ?? d.subcategory_name ?? "",
        sort: d.subcategory_sort ?? 0,
        items: [],
      });
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

export function ManakishTiers({ section, tagline = TAGLINE, onSelect, onQuickAdd, addedIds }) {
  const tiers = tiersOf(section.items);

  return (
    <div className="shk-mana">
      <header className="shk-mana__head">
        <h2 className="shk-mana__title">{t("tacos.title")}</h2>
        <p className="shk-mana__tag">{tagline}</p>
        <DietTag type="gluten-free" />
      </header>

      <div className="shk-mana__cols">
        {tiers.map((t) => {
          const isPremium = (t.key || "").toLowerCase() === "premium";
          return (
          <div className={`shk-mana__col ${isPremium ? "is-premium" : ""}`} key={t.id}>
            <ul className="shk-mana__list">
                {t.minPrice != null && (
                  <li>
                    <div className="shk-mana__item shk-mana__priceitem">
                      <span className="shk-mana__disc">
                        <PriceSeal price={t.minPrice} fill />
                      </span>
                      <span className="shk-mana__price-label">{tierLabel(t)}</span>
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
                          <img src={optimizedSrc(d.image_url, 384)} alt="" loading="lazy" />
                        ) : (
                          <span className="shk-mana__disc-ph" aria-hidden="true" />
                        )}
                        {!d.comingSoon && (
                          <button
                            type="button"
                            className={`shk-mana__dot ${addedIds?.has(d.id) ? "is-on" : ""}`}
                            onClick={(e) => { e.stopPropagation(); onQuickAdd?.(d); }}
                            aria-pressed={addedIds?.has(d.id) || false}
                            aria-label={tr("card.addToOrder", { name: d.name })}
                          />
                        )}
                      </span>
                      <span className="shk-mana__item-name">{d.name}</span>
                      {d.calories != null && (
                        <span className="shk-card__kcal-pill shk-mana__kcal">
                          <b>{Math.round(d.calories)}</b> {tr("card.kcal")}
                        </span>
                      )}
                    </div>
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
