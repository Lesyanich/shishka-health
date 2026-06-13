/*
  Classic menu rows — used instead of the cutout-tile grid when a subsection
  has no photos at all (e.g. Drinks). Name + kcal/volume on the left, dot
  leaders, price on the right; clicking opens the dish dialog. Avoids a sea
  of placeholder discs while photography catches up.
*/

import { PlusIcon } from "../Icons.jsx";

export function DishRows({ items, currency = "฿", onSelect, onQuickAdd }) {
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
                {d.comingSoon && <span className="shk-row__soon">coming soon</span>}
              </span>
              {(d.calories != null || d.portion_size != null) && (
                <span className="shk-row__meta num">
                  {d.calories != null && `${d.calories} kcal`}
                  {d.calories != null && d.portion_size != null && " · "}
                  {d.portion_size != null && `${d.portion_size}${d.portion_unit ?? ""}`}
                </span>
              )}
            </span>
            <span className="shk-row__dots" aria-hidden="true" />
            <span className="shk-row__price num">
              {d.priceFrom != null ? (
                <>
                  <span className="shk-row__from">from </span>
                  {currency}
                  {d.priceFrom}
                </>
              ) : d.price != null ? (
                <>
                  {currency}
                  {d.price}
                </>
              ) : null}
            </span>
          </button>

          {!d.comingSoon && onQuickAdd && d.price != null && (
            <button
              type="button"
              className="shk-quickadd shk-quickadd--row"
              onClick={(e) => { e.stopPropagation(); onQuickAdd(d); }}
              aria-label={`Add ${d.name} to order`}
              title={`Add ${d.name} to order`}
            >
              <PlusIcon size={16} strokeWidth={2.5} />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
