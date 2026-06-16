/*
  AddMedallion — the quick-add "+" rendered as a small honey SUNBURST medallion
  that abstracts the brand mandala (a ring of radiating triangles around a
  centre). Tapping it adds the dish straight to the order. Colours come from
  CSS (.shk-add*) so the same SVG works on any surface.
*/

const N = 18;                       // number of rays (mandala teeth)
const C = 50;                       // viewBox centre (100×100 space)
const RO = C * 0.99;                // ray tip radius
const RI = C * 0.70;                // ray base / core radius
const STEP = (2 * Math.PI) / N;
const PL = RI * 0.62;               // half-length of the "+" arms

const pt = (r, a) => `${(C + r * Math.cos(a)).toFixed(2)},${(C + r * Math.sin(a)).toFixed(2)}`;

// Precompute each triangular ray once (deterministic — safe at module load).
const RAYS = Array.from({ length: N }, (_, i) => {
  const a = i * STEP - Math.PI / 2;
  return `${pt(RI, a - STEP / 2)} ${pt(RO, a)} ${pt(RI, a + STEP / 2)}`;
});

export function AddMedallion({ size = 26, onClick, label, className = "" }) {
  return (
    <button
      type="button"
      className={`shk-add ${className}`}
      style={{ width: size, height: size }}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <svg className="shk-add__svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        {RAYS.map((points, i) => (
          <polygon key={i} className="shk-add__ray" points={points} />
        ))}
        <circle className="shk-add__core" cx={C} cy={C} r={(RI + 0.5).toFixed(2)} />
        <line className="shk-add__plus" x1={C - PL} y1={C} x2={C + PL} y2={C} />
        <line className="shk-add__plus" x1={C} y1={C - PL} x2={C} y2={C + PL} />
      </svg>
    </button>
  );
}
