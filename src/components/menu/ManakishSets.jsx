import { t, tp } from "../../i18n/index.js";
/*
  Manakish sets — borderless, type-led cards that scroll sideways (swipe).
  Each card: big count, "from ฿X", "manakish", "set of N + M sauce free", and a
  "save N%" badge, then "build your set →". No thumbnails. Clicking opens the
  build-your-own set dialog (BundleDialog) via onSelect.
*/

export function ManakishSets({ bundles, onSelect, currency = "฿" }) {
  if (!bundles || bundles.length === 0) return null;

  return (
    <div className="shk-sets" role="list" aria-label={t("sets.aria")}>
      {bundles.map((b) => (
        <button
          type="button"
          className="shk-set"
          key={b.tierCode}
          role="listitem"
          onClick={() => onSelect?.(b)}
        >
          <span className="shk-set__pct">
            <small>{t("sets.saveUpTo")}</small>{b.discountPct}%
          </span>

          <span className="shk-set__num">{b.manakishCount}</span>
          <span className="shk-set__title">{t("tacos.title")}</span>
          <span className="shk-set__sub">
            {tp("sets.sub", b.sauceCount, { count: b.manakishCount })}
          </span>
          {b.from != null && (
            <span className="shk-set__from">{t("sets.from")} {currency}{b.from}</span>
          )}

          <span className="shk-set__cta">
            {t("sets.cta")} <span aria-hidden="true">→</span>
          </span>
        </button>
      ))}
    </div>
  );
}
