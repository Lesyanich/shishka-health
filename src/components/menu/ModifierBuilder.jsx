import { useState, useMemo, useEffect } from "react";
import { requiredAddOnFloor, selectedNutrition, selectedOptionsList } from "../../lib/modifiers.js";

// Interactive "build your own" panel. Toggle options, see a live total.
// A group can be REQUIRED (minSelect > 0) and/or CAPPED (maxSelect): e.g.
// "Pick Fruits" needs 2 and allows at most 4. Nothing is pre-selected — the
// guest builds from scratch. Until every required minimum is met, the total
// shows the "from ฿X" floor (base + cheapest mandatory add-ons), matching the
// card; once met, it shows the live total. At a group's cap, its unpicked
// options are disabled.
export function ModifierBuilder({ basePrice = 0, currency = "฿", groups = [], onChange }) {
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
      const g = groups[gi];
      const max = g?.maxSelect ?? null;
      const min = g?.minSelect ?? 0;

      // Single-choice group (max 1) → behave like a radio: clicking an option
      // replaces the group's current pick instead of stacking. A required
      // radio can't be emptied, so re-clicking the active option is a no-op.
      // (e.g. a dip's "Served with bread": buns / crackers / no bread.)
      if (max === 1) {
        if (prev.has(key)) return prev;
        const next = new Set(prev);
        g.options.forEach((_, k) => next.delete(`${gi}:${k}`));
        next.add(key);
        return next;
      }

      const next = new Set(prev);
      if (next.has(key)) {
        // Keep a required group from dropping below its minimum.
        if (min > 0 && groupCount(prev, gi) <= min) return prev;
        next.delete(key);
      } else {
        // Don't let a capped group exceed its maximum.
        if (max != null && groupCount(prev, gi) >= max) return prev;
        next.add(key);
      }
      return next;
    });

  // The price delta of a group's currently selected option (0 if none) — used to
  // show single-choice options RELATIVE to the current pick ("+฿40" / "−฿38").
  const selectedDelta = (gi) => {
    const g = groups[gi];
    for (let oi = 0; oi < g.options.length; oi++) {
      if (selected.has(`${gi}:${oi}`)) return Number(g.options[oi].priceDelta) || 0;
    }
    return 0;
  };

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
  // Count only paid add-ons (a default/free pick like "no bread" or an included
  // bun choice isn't an "add-on" in the summary line).
  const count = useMemo(() => {
    let n = 0;
    groups.forEach((g, gi) =>
      g.options.forEach((o, oi) => {
        if (selected.has(`${gi}:${oi}`) && (Number(o.priceDelta) || 0) > 0) n += 1;
      })
    );
    return n;
  }, [selected, groups]);

  // Required minimums not yet satisfied → show the "from ฿X" floor instead of a
  // not-yet-orderable live total.
  const requiredMet = groups.every((g, gi) => groupCount(selected, gi) >= (g.minSelect ?? 0));
  const floor = (basePrice || 0) + requiredAddOnFloor(groups);
  const displayTotal = requiredMet ? total : floor;

  // Report the full build up so the dialog can drive the live donut/macros AND
  // pass the configured options + price into the cart on "Add to order".
  useEffect(() => {
    onChange?.({
      options: selectedOptionsList(groups, selected),
      extraPrice: extra,
      total,
      requiredMet,
      nutrition: selectedNutrition(groups, selected),
    });
  }, [selected, groups, extra, total, requiredMet, onChange]);

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
        const max = g.maxSelect ?? null;
        // A single-choice group renders as a radio (clicking replaces the pick),
        // so its options are never "blocked" at the cap.
        const isRadio = max === 1;
        const atMax = !isRadio && max != null && groupCount(selected, gi) >= max;
        const selDelta = isRadio ? selectedDelta(gi) : 0;
        const req = isRadio
          ? "choose one"
          : min > 0 && max != null ? `pick ${min}–${max}`
          : min > 0 ? `pick at least ${min}`
          : max != null ? `pick up to ${max}`
          : null;
        return (
        <div key={gi} className={`shk-build__group ${isRadio ? "shk-build__group--radio" : ""}`}>
          <div className="shk-build__group-name">
            {g.name}
            {req && <span className="shk-build__group-req"> · {req}</span>}
          </div>
          <div className="shk-build__opts">
            {g.options.map((o, oi) => {
              const key = `${gi}:${oi}`;
              const on = selected.has(key);
              const blocked = atMax && !on;
              // Single-choice options show their price RELATIVE to the current
              // pick (+฿40 to swap up, −฿38 to go plain); the active pick shows
              // "Included". Multi options show their flat surcharge.
              const rel = isRadio ? (Number(o.priceDelta) || 0) - selDelta : (Number(o.priceDelta) || 0);
              let priceLabel = null;
              if (isRadio && on) priceLabel = <span className="shk-build__opt-delta is-included">Included</span>;
              else if (rel > 0) priceLabel = <span className="shk-build__opt-delta num">+{currency}{rel}</span>;
              else if (rel < 0) priceLabel = <span className="shk-build__opt-delta num is-save">−{currency}{Math.abs(rel)}</span>;
              return (
                <button
                  type="button"
                  key={oi}
                  className={`shk-build__opt ${on ? "is-on" : ""} ${blocked ? "is-disabled" : ""}`}
                  onClick={() => toggle(gi, oi)}
                  aria-pressed={on}
                  role={isRadio ? "radio" : undefined}
                  aria-checked={isRadio ? on : undefined}
                  disabled={blocked}
                >
                  {o.emoji && <span className="shk-build__opt-emoji" aria-hidden="true">{o.emoji}</span>}
                  <span className="shk-build__opt-name">{o.name}</span>
                  {priceLabel}
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
