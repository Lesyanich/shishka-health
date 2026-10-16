import { useRef } from "react";

/*
  CategoryTabs — subcategory switcher inside a menu section.

  Two shapes:
    default     the scrolling pill rail the site uses today
    segmented   full-width segmented control on a --surface-2 track, equal
                columns (spec §3, the mobile category screen)

  Roving tabindex: exactly one tab is tabbable and Left/Right move between
  them. The arrow handling already existed, but it only changed the SELECTION
  — DOM focus stayed on the old button, which had just been given tabIndex -1,
  so the focus ring vanished and the next arrow press went nowhere. The move
  now carries focus with it.

  `aria-controls` is wired when a caller gives a category a `panelId`. The
  caller then owns the other half: `role="tabpanel"` + that id on the panel,
  pointing back with aria-labelledby={`tab-${cat.id}`}.
*/

export function CategoryTabs({
  categories = [],
  active,
  onChange,
  variant = "default",
  className = "",
  ...rest
}) {
  const refs = useRef([]);

  const select = (i) => {
    const cat = categories[i];
    if (!cat) return;
    onChange?.(cat.id);
    // Focus the destination directly: the tabIndex flip only lands on the next
    // render, and by then the old button is no longer focusable.
    refs.current[i]?.focus();
  };

  const cls = [
    "shk-tabs",
    variant === "segmented" ? "shk-tabs--segmented" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cls} role="tablist" {...rest}>
      {categories.map((cat, i) => (
        <button
          key={cat.id}
          id={`tab-${cat.id}`}
          ref={(el) => (refs.current[i] = el)}
          type="button"
          role="tab"
          aria-selected={active === cat.id}
          aria-controls={cat.panelId || undefined}
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
            select(n);
          }}
        >
          {cat.label}
          {cat.count != null && <span className="shk-tab__count num">{cat.count}</span>}
        </button>
      ))}
    </div>
  );
}
