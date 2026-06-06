const MACROS = [
  { key: "protein", label: "Protein", color: "var(--macro-protein)" },
  { key: "carbs", label: "Carbs", color: "var(--macro-carbs)" },
  { key: "fat", label: "Fat", color: "var(--macro-fat)" },
];

export function MacroBar({
  protein = 0,
  carbs = 0,
  fat = 0,
  compact = false,
  showBar = true,
  className = "",
}) {
  const cal = { protein: protein * 4, carbs: carbs * 4, fat: fat * 9 };
  const total = cal.protein + cal.carbs + cal.fat || 1;
  const grams = { protein, carbs, fat };

  return (
    <div className={`shk-macro ${compact ? "shk-macro--compact" : ""} ${className}`}>
      {showBar && (
        <div className="shk-macro__bar">
          {MACROS.map((m) => (
            <span
              key={m.key}
              className="shk-macro__fill"
              style={{ width: `${(cal[m.key] / total) * 100}%`, background: m.color }}
            />
          ))}
        </div>
      )}
      <div className="shk-macro__legend">
        {MACROS.map((m) => (
          <div className="shk-macro__item" key={m.key}>
            <div className="shk-macro__top">
              <span className="shk-macro__dot" style={{ background: m.color }} />
              <span className="shk-macro__label">{m.label}</span>
            </div>
            <span className="shk-macro__val">
              {grams[m.key]}
              <small>g</small>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
