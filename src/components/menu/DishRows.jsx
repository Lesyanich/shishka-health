/*
  Classic menu rows — used instead of the cutout-tile grid when a subsection
  has no photos at all (e.g. Drinks). Name + kcal/volume on the left, dot
  leaders, price on the right; clicking opens the dish dialog. Avoids a sea
  of placeholder discs while photography catches up.
*/

import { PriceSeal } from "./PriceSeal.jsx";
import { t, unit } from "../../i18n/index.js";

export function DishRows({ items, currency = "฿", addedIds, onSelect, onQuickAdd }) {
  return (
    <ul className="shk-rows">
      {items.map((d) => (
        <li key={d.id} className="shk-row-wrap">
          <button
            type="button"
            className={`shk-row ${d.comingSoon ? "is-soon" : ""}`}
            onClick={d.comingSoon ? undefined : () => onSelect?.(d)}
            aria-disabled={d.comingSoon || undefined}
          >
            <span className="shk-row__main">
              <span className="shk-row__name">
                {d.name}
                {d.comingSoon && <span className="shk-row__soon">{t("rows.comingSoon")}</span>}
              </span>
              {(d.calories != null || d.portion_size != null) && (
                <span className="shk-row__meta num">
                  {d.calories != null && `${d.calories} ${t("card.kcal")}`}
                  {d.calories != null && d.portion_size != null && " · "}
                  {d.portion_size != null && `${d.portion_size}${unit(d.portion_unit)}`}
                </span>
              )}
              {d.description && <span className="shk-row__desc">{d.description}</span>}
            </span>
            <span className="shk-row__dots" aria-hidden="true" />
          </button>

          {d.price != null ? (
            <PriceSeal
              price={d.price}
              size={51}
              active={addedIds?.has(d.id)}
              onClick={!d.comingSoon && onQuickAdd ? (e) => { e.stopPropagation(); onQuickAdd(d); } : undefined}
              label={!d.comingSoon && onQuickAdd ? t("card.addToOrder", { name: d.name }) : t("card.priceLabel", { name: d.name, price: d.price })}
            />
          ) : d.priceFrom != null ? (
            <span className="shk-row__pricefrom">{t("card.from")} {currency}{d.priceFrom}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
