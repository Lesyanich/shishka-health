import { useState, useMemo } from "react";

// Interactive "build your own" panel. Toggle options, see a live total.
// Loyverse has no min/max-select configured, so every option is a toggle.
export function ModifierBuilder({ basePrice = 0, currency = "฿", groups = [] }) {
  const initial = useMemo(() => {
    const s = new Set();
    groups.forEach((g, gi) =>
      g.options.forEach((o, oi) => {
        if (o.isDefault) s.add(`${gi}:${oi}`);
      })
    );
    return s;
  }, [groups]);

  const [selected, setSelected] = useState(initial);

  const toggle = (key) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const extra = useMemo(() => {
    let sum = 0;
    groups.forEach((g, gi) =>
      g.options.forEach((o, oi) => {
        if (selected.has(`${gi}:${oi}`)) sum += o.priceDelta;
      })
    );
    return sum;
  }, [selected, groups]);

  const total = (basePrice || 0) + extra;
  const count = selected.size;

  return (
    <div className="shk-build">
      <div className="shk-build__head">
        <span className="shk-build__title">Build your own</span>
        {count > 0 && (
          <button type="button" className="shk-build__reset" onClick={() => setSelected(new Set())}>
            Reset
          </button>
        )}
      </div>

      {groups.map((g, gi) => (
        <div key={gi} className="shk-build__group">
          <div className="shk-build__group-name">{g.name}</div>
          <div className="shk-build__opts">
            {g.options.map((o, oi) => {
              const key = `${gi}:${oi}`;
              const on = selected.has(key);
              return (
                <button
                  type="button"
                  key={oi}
                  className={`shk-build__opt ${on ? "is-on" : ""}`}
                  onClick={() => toggle(key)}
                  aria-pressed={on}
                >
                  {o.emoji && <span className="shk-build__opt-emoji" aria-hidden="true">{o.emoji}</span>}
                  <span className="shk-build__opt-name">{o.name}</span>
                  {o.priceDelta > 0 && (
                    <span className="shk-build__opt-delta num">+{currency}{o.priceDelta}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="shk-build__total">
        <span className="shk-build__total-label">
          Total{count > 0 ? ` · ${count} add-on${count > 1 ? "s" : ""}` : ""}
        </span>
        <span className="shk-build__total-val num">{currency}{total}</span>
      </div>
    </div>
  );
}
