import { DEFAULT_CONTENT } from "../../lib/content.js";

// Per-item line icons drawn inside a prohibition circle, matching the
// "THE RULE" red style. Keyed by the (lower-cased) rule item. The seed-oil /
// gluten / fried / preservative marks carry a slash; fake food is a cube and
// toxic is a skull. Unknown items fall back to a plain crossed circle.
const RULE_ICONS = {
  "seed oils": (
    <>
      <path d="M24 14c4.5 6 7 9.5 7 13.5a7 7 0 0 1-14 0c0-4 2.5-7.5 7-13.5z" />
      <path d="M16 16 32 32" />
    </>
  ),
  "industrial gluten": (
    <>
      <path d="M24 34V17" />
      <path d="M24 21l-4-3M24 21l4-3M24 25l-4-3M24 25l4-3M24 29l-4-3M24 29l4-3" />
      <path d="M16 16 32 32" />
    </>
  ),
  "fake food": (
    <>
      <path d="M24 13l9 5v10l-9 5-9-5V18z" />
      <path d="M24 23v10M24 23l9-5M24 23l-9-5" />
    </>
  ),
  "fried food": (
    <>
      <path d="M18 22h12l-1.6 11h-8.8z" />
      <path d="M21 22v-6M24 22v-8M27 22v-6" />
      <path d="M16 16 32 32" />
    </>
  ),
  preservatives: (
    <>
      <path d="M21 14h6M23 14v6l-5 10a2 2 0 0 0 2 3h8a2 2 0 0 0 2-3l-5-10v-6" />
      <path d="M16 16 32 32" />
    </>
  ),
  toxic: (
    <>
      <path d="M24 13a8 8 0 0 0-8 8c0 3 1.4 5.2 3.5 6.6V31h9v-3.4C30.6 26.2 32 24 32 21a8 8 0 0 0-8-8z" />
      <circle cx="21" cy="21.5" r="1.8" />
      <circle cx="27" cy="21.5" r="1.8" />
      <path d="M22 31v2M24 31v2.5M26 31v2" />
    </>
  ),
};

const DEFAULT_ICON = <path d="M15 15 33 33M33 15 15 33" />;

export function BrandRule({ wide = false, content }) {
  const c = { ...DEFAULT_CONTENT.rule, ...(content || {}) };
  const items = Array.isArray(c.items) && c.items.length ? c.items : DEFAULT_CONTENT.rule.items;

  return (
    <section className={`shk-rule ${wide ? "shk-rule--wide" : ""}`} aria-label="The Rule">
      <div className="shk-rule__inner">
        {c.eyebrow && <p className="shk-rule__eyebrow">{c.eyebrow}</p>}
        <h2 className="shk-rule__title">{c.title}</h2>
        {c.lead && <p className="shk-rule__lead">{c.lead}</p>}
        <ul className="shk-rule__grid">
          {items.map((r) => (
            <li key={r} className="shk-rule__item">
              <span className="shk-rule__icon" aria-hidden="true">
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="24" cy="24" r="22" />
                  {RULE_ICONS[(r || "").toLowerCase()] ?? DEFAULT_ICON}
                </svg>
              </span>
              <span className="shk-rule__label">
                <span className="shk-rule__no">no</span>{" "}
                <span className="shk-rule__what">{r}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
