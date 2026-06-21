/*
  PriceSeal — the price + quick-add rendered as ONE circular "stamp" with a
  sawtooth (sunburst) edge echoing the brand mandala. Inside, stacked: a "+"
  (add), the price number, and "thb". The whole seal is the add button.
  When not interactive (no onClick) it renders as a static price stamp.
*/

const N = 28;             // sawtooth teeth
const C = 50;             // viewBox centre (100×100)
const R_TIP = 49;         // tooth tip radius
const R_VALLEY = 43.5;    // tooth base radius (thin band → finer "sunburst")
const R_INNER = 41;       // inner edge of the ring (hole) — roomy interior
const STEP = (2 * Math.PI) / N;
const pt = (r, a) => `${(C + r * Math.cos(a)).toFixed(2)} ${(C + r * Math.sin(a)).toFixed(2)}`;

// Ring = zigzag outer edge minus an inner circle (evenodd) → hollow stamp.
function buildRing() {
  let d = "M " + pt(R_TIP, -Math.PI / 2);
  for (let i = 0; i < N; i++) {
    d += " L " + pt(R_VALLEY, (i + 0.5) * STEP - Math.PI / 2);
    d += " L " + pt(R_TIP, (i + 1) * STEP - Math.PI / 2);
  }
  d += " Z";
  d += ` M ${C + R_INNER} ${C} A ${R_INNER} ${R_INNER} 0 1 1 ${C - R_INNER} ${C} A ${R_INNER} ${R_INNER} 0 1 1 ${C + R_INNER} ${C} Z`;
  return d;
}
const RING = buildRing();

export function PriceSeal({ price, currency = "thb", size = 58, fill = false, onClick, label }) {
  const interactive = typeof onClick === "function";
  const Tag = interactive ? "button" : "div";
  // `fill` lets a parent (e.g. the manakish disc) size the seal via CSS so it
  // matches the food images; otherwise it's a fixed `size` px stamp.
  return (
    <Tag
      type={interactive ? "button" : undefined}
      className="shk-seal"
      style={fill ? undefined : { width: size, height: size, fontSize: `${(size * 0.25).toFixed(1)}px` }}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <svg className="shk-seal__ring" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <path className="shk-seal__edge" d={RING} fillRule="evenodd" />
      </svg>
      <span className="shk-seal__stack">
        {interactive && <span className="shk-seal__plus">+</span>}
        <span className="shk-seal__num">{price}</span>
        <span className="shk-seal__cur">{currency}</span>
      </span>
    </Tag>
  );
}
