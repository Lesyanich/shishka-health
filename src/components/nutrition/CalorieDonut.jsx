export function CalorieDonut({
  kcal,
  protein = 0,
  carbs = 0,
  fat = 0,
  size = 116,
  thickness = 12,
  className = "",
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;

  const pCal = Math.max(0, protein) * 4;
  const cCal = Math.max(0, carbs) * 4;
  const fCal = Math.max(0, fat) * 9;
  const total = pCal + cCal + fCal;

  const segs = total
    ? [
        { color: "var(--macro-protein)", frac: pCal / total },
        { color: "var(--macro-carbs)", frac: cCal / total },
        { color: "var(--macro-fat)", frac: fCal / total },
      ]
    : [];

  let offsetAccum = 0;
  const gap = total ? 0.012 * c : 0;

  return (
    <div
      className={`shk-donut ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={
        kcal != null
          ? `${kcal} kilocalories. Protein ${protein}g, carbs ${carbs}g, fat ${fat}g.`
          : "Nutrition not available"
      }
    >
      <svg className="shk-donut__svg" width={size} height={size}>
        <circle
          className="shk-donut__track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={thickness}
        />
        {segs.map((s, i) => {
          const len = Math.max(0, s.frac * c - gap);
          const dash = `${len} ${c - len}`;
          const dashoffset = -offsetAccum;
          offsetAccum += s.frac * c;
          return (
            <circle
              key={i}
              className="shk-donut__seg"
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeDasharray={dash}
              strokeDashoffset={dashoffset}
            />
          );
        })}
      </svg>
      <div className="shk-donut__center">
        {kcal != null ? (
          <>
            <span className="shk-donut__kcal" style={{ fontSize: size * 0.27 }}>
              {kcal}
            </span>
            <span className="shk-donut__unit">kcal</span>
          </>
        ) : (
          <span className="shk-donut__empty">No data</span>
        )}
      </div>
    </div>
  );
}
