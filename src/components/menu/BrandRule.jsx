import { DEFAULT_CONTENT } from "../../lib/content.js";

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
            <li key={r} className="shk-rule__pill">
              <span className="shk-rule__no">NO</span>
              <span className="shk-rule__what">{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
