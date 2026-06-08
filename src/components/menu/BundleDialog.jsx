import { useEffect, useState } from "react";
import { IconButton } from "../primitives/IconButton.jsx";
import { XIcon } from "../Icons.jsx";
import { tierPrice, bundleTotal, alaCarteTotal, totalQty } from "../../lib/bundles.js";

/*
  Build-your-own manakish set. Strict counts: exactly `manakishCount` manakish
  (repeats allowed via the steppers) + `sauceCount` free sauces. Live total at the
  bundle's tier discount; "Add to order" disabled until the counts match exactly.
*/
export function BundleDialog({ open, bundle, manakishPool, saucePool, onClose, onAdd, currency = "฿" }) {
  const [mana, setMana] = useState({});
  const [sauce, setSauce] = useState({});

  useEffect(() => {
    if (open) {
      setMana({});
      setSauce({});
    }
  }, [open, bundle?.tierCode]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !bundle) return null;

  const manaChosen = totalQty(mana);
  const sauceChosen = totalQty(sauce);
  const manaFull = manaChosen >= bundle.manakishCount;
  const sauceFull = sauceChosen >= bundle.sauceCount;
  const complete = manaChosen === bundle.manakishCount && sauceChosen === bundle.sauceCount;

  const total = bundleTotal(mana, manakishPool, bundle.discountPct);
  const savings = alaCarteTotal(mana, manakishPool) - total;

  const bump = (setter, id, delta) =>
    setter((prev) => {
      const next = Math.max(0, (prev[id] ?? 0) + delta);
      const rest = { ...prev };
      delete rest[id];
      return next === 0 ? rest : { ...rest, [id]: next };
    });

  const confirm = () => {
    const byId = (pool) => new Map(pool.map((d) => [d.id, d]));
    const mById = byId(manakishPool);
    const sById = byId(saucePool);
    const children = [
      ...Object.entries(mana).map(([id, qty]) => ({ dish: mById.get(id), qty, role: "manakish" })),
      ...Object.entries(sauce).map(([id, qty]) => ({ dish: sById.get(id), qty, role: "sauce" })),
    ].filter((c) => c.dish);
    onAdd?.(bundle.label, children, total);
    onClose?.();
  };

  const Row = ({ dish, qty, price, canAdd, onInc, onDec }) => (
    <li className="shk-bundle__row">
      <div className="shk-bundle__row-info">
        <span className="shk-bundle__row-name">{dish.name}</span>
        <span className="shk-bundle__row-price num">
          {price === 0 ? "free" : `${currency}${price}`}
        </span>
      </div>
      <div className="shk-bundle__stepper">
        <button type="button" aria-label={`Remove one ${dish.name}`} onClick={onDec} disabled={qty <= 0}>
          –
        </button>
        <span className="num">{qty}</span>
        <button type="button" aria-label={`Add one ${dish.name}`} onClick={onInc} disabled={!canAdd}>
          +
        </button>
      </div>
    </li>
  );

  return (
    <div className="shk-dlg__scrim" onClick={onClose}>
      <div className="shk-dlg shk-bundle" role="dialog" aria-modal="true" aria-label={bundle.label} onClick={(e) => e.stopPropagation()}>
        <div className="shk-bundle__head">
          <div>
            <h2 className="shk-dlg__title">{bundle.label}</h2>
            <p className="shk-bundle__sub">
              Pick {bundle.manakishCount} manakish + {bundle.sauceCount} sauce
              {bundle.sauceCount > 1 ? "s" : ""} · save {bundle.discountPct}%
            </p>
          </div>
          <IconButton label="Close" variant="solid" onClick={onClose}>
            <XIcon />
          </IconButton>
        </div>

        <div className="shk-bundle__body">
          <section className="shk-bundle__group">
            <div className="shk-bundle__group-head">
              <h3 className="shk-bundle__group-title">Manakish</h3>
              <span className={`shk-bundle__counter num ${complete || !manaFull ? "" : "is-full"}`}>
                {manaChosen} / {bundle.manakishCount}
              </span>
            </div>
            <ul className="shk-bundle__list">
              {manakishPool.map((d) => (
                <Row
                  key={d.id}
                  dish={d}
                  qty={mana[d.id] ?? 0}
                  price={tierPrice(d.price, bundle.discountPct)}
                  canAdd={!manaFull}
                  onInc={() => bump(setMana, d.id, +1)}
                  onDec={() => bump(setMana, d.id, -1)}
                />
              ))}
            </ul>
          </section>

          <section className="shk-bundle__group">
            <div className="shk-bundle__group-head">
              <h3 className="shk-bundle__group-title">Sauce · free</h3>
              <span className="shk-bundle__counter num">
                {sauceChosen} / {bundle.sauceCount}
              </span>
            </div>
            <ul className="shk-bundle__list">
              {saucePool.map((d) => (
                <Row
                  key={d.id}
                  dish={d}
                  qty={sauce[d.id] ?? 0}
                  price={0}
                  canAdd={!sauceFull}
                  onInc={() => bump(setSauce, d.id, +1)}
                  onDec={() => bump(setSauce, d.id, -1)}
                />
              ))}
            </ul>
          </section>
        </div>

        <div className="shk-bundle__foot">
          <div className="shk-bundle__totals">
            <span className="shk-bundle__total num">{total > 0 ? `${currency}${total}` : "—"}</span>
            {savings > 0 && <span className="shk-bundle__save num">save {currency}{savings}</span>}
          </div>
          <button type="button" className="shk-bundle__add" onClick={confirm} disabled={!complete}>
            {complete
              ? `Add to order · ${currency}${total}`
              : `Pick ${bundle.manakishCount - manaChosen} more manakish${
                  sauceChosen < bundle.sauceCount ? ` + ${bundle.sauceCount - sauceChosen} sauce` : ""
                }`}
          </button>
        </div>
      </div>
    </div>
  );
}
