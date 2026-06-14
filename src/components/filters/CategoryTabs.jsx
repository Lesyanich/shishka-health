export function CategoryTabs({ categories = [], active, onChange, className = "", ...rest }) {
  return (
    <div className={`shk-tabs ${className}`} role="tablist" {...rest}>
      {categories.map((cat, i) => (
        <button
          key={cat.id}
          role="tab"
          aria-selected={active === cat.id}
          tabIndex={active === cat.id ? 0 : -1}
          className="shk-tab"
          onClick={() => onChange?.(cat.id)}
          onKeyDown={(e) => {
            if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
            e.preventDefault();
            const n =
              e.key === "ArrowRight"
                ? (i + 1) % categories.length
                : (i - 1 + categories.length) % categories.length;
            onChange?.(categories[n].id);
          }}
        >
          {cat.label}
          {cat.count != null && <span className="shk-tab__count num">{cat.count}</span>}
        </button>
      ))}
    </div>
  );
}
