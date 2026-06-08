import { useState, useMemo } from "react";
import { requiredAddOnFloor } from "../../lib/modifiers.js";

// Interactive "build your own" panel. Toggle options, see a live total.
// Most options are free toggles, but a group can be REQUIRED (minSelect > 0):
// the guest must pick at least N (e.g. "Pick Fruits" needs 2). Nothing is
// pre-selected — the guest builds from scratch. Until every required minimum is
// met, the total shows the "from ฿X" floor (base + cheapest mandatory add-ons),
// matching the card; once met, it shows the live total.
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

  const groupCount = (set, gi) =>
    groups[gi].options.reduce((n, _, oi) => (set.has(`${gi}:${oi}`) ? n + 1 : n), 0);

  const toggle = (gi, oi) =>
    setSelected((prev) => {
      const key = `${gi}:${oi}`;
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

  // Required minimums not yet satisfied → show the "from ฿X" floor instead of a
  // not-yet-orderable live total.
  const requiredMet = groups.every((g, gi) => groupCount(selected, gi) >= (g.minSelect ?? 0));
  const floor = (basePrice || 0) + requiredAddOnFloor(groups);
  const displayTotal = requiredMet ? total : floor;

  return (
    <div className="shk-build">
      <div className="shk-build__head">
        <span className="shk-build__title">Build your own</span>
        {count > 0 && (
          <button type="button" className="shk-build__reset" onClick={() => setSelected(initial)}>
            Reset
          </button>
        )}
      </div>

      {groups.map((g, gi) => {
        const min = g.minSelect ?? 0;
        return (
        <div key={gi} className="shk-build__group">
          <div className="shk-build__group-name">
            {g.name}
            {min > 0 && <span className="shk-build__group-req"> · pick at least {min}</span>}
          </div>
          <div className="shk-build__opts">
            {g.options.map((o, oi) => {
              const key = `${gi}:${oi}`;
              const on = selected.has(key);
              return (
                <button
                  type="button"
                  key={oi}
                  className={`shk-build__opt ${on ? "is-on" : ""}`}
                  onClick={() => toggle(gi, oi)}
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
        );
      })}

      <div className="shk-build__total">
        <span className="shk-build__total-label">
          Total{count > 0 ? ` · ${count} add-on${count > 1 ? "s" : ""}` : ""}
        </span>
        <span className="shk-build__total-val num">
          {!requiredMet && <span className="shk-build__from">from </span>}
          {currency}{displayTotal}
        </span>
      </div>
    </div>
  );
}
