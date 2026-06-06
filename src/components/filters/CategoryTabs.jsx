export function CategoryTabs({ categories = [], active, onChange, className = "", ...rest }) {
  return (
    <div className={`shk-tabs ${className}`} role="tablist" {...rest}>
      {categories.map((cat) => (
        <button
          key={cat.id}
          role="tab"
          aria-selected={active === cat.id}
          className="shk-tab"
          onClick={() => onChange?.(cat.id)}
        >
          {cat.label}
          {cat.count != null && <span className="shk-tab__count num">{cat.count}</span>}
        </button>
      ))}
    </div>
  );
}
