/*
  A "Manakish set of N" card shown at the top of the Manakish section. Build-your-
  own: opens the constructor. Shows the "from ฿X" floor (cheapest fill).
*/
export function BundleCard({ label, manakishCount, sauceCount, discountPct, from, currency = "฿", onClick }) {
  return (
    <button type="button" className="shk-bcard" onClick={onClick}>
      <div className="shk-bcard__badge num">−{discountPct}%</div>
      <div className="shk-bcard__name">{label}</div>
      <div className="shk-bcard__meta">
        Build your own · {manakishCount} manakish + {sauceCount} free sauce{sauceCount > 1 ? "s" : ""}
      </div>
      {from != null && (
        <div className="shk-bcard__price num">
          from {currency}{from}
        </div>
      )}
    </button>
  );
}
