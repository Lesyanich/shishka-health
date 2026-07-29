import { DEFAULT_CONTENT } from "../../lib/content.js";

// Per-item line marks, keyed by the (lower-cased) rule item: a droplet, a wheat
// stalk, a cube, fries, a flask, a seasoning shaker. Each is struck through.
// Unknown items fall back to a plain cross.
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
      <path d="M16 16 32 32" />
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
  // A seasoning shaker: perforated cap over a rounded body — the additive
  // poured in from a jar, which is how MSG reads on a menu.
  msg: (
    <>
      <rect x="19" y="13.5" width="10" height="4.5" rx="1.5" />
      <path d="M20 18h8v12a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3z" />
      <path d="M22 15.7h.01M24 15.7h.01M26 15.7h.01" />
      <path d="M16 16 32 32" />
    </>
  ),
};

const DEFAULT_ICON = <path d="M15 15 33 33M33 15 15 33" />;

// Exact key first, then any key contained in the label, so both the full
// "monosodium glutamate (msg)" and a bare "msg" find the shaker.
function pickIcon(key) {
  const k = key.toLowerCase();
  if (RULE_ICONS[k]) return RULE_ICONS[k];
  const hit = Object.keys(RULE_ICONS).find((name) => k.includes(name));
  return hit ? RULE_ICONS[hit] : DEFAULT_ICON;
}

// An item is either a plain string, rendered as "no <thing>", or an object for
// the ones that read as a positive claim ("Gluten FREE options"), which drop
// the "no". The whole list is red either way. `icon` picks the glyph when the
// label no longer matches a RULE_ICONS key.
function normalizeItem(item) {
  if (typeof item === "string") return { label: item, deny: true, icon: item };
  return {
    label: item?.label ?? "",
    deny: item?.deny !== false,
    icon: item?.icon ?? item?.label ?? "",
  };
}

export function BrandRule({ wide = false, content }) {
  const c = { ...DEFAULT_CONTENT.rule, ...(content || {}) };
  const raw = Array.isArray(c.items) && c.items.length ? c.items : DEFAULT_CONTENT.rule.items;
  const items = raw.map(normalizeItem).filter((i) => i.label);

  return (
    <section className={`shk-rule ${wide ? "shk-rule--wide" : ""}`} aria-label="The Rule">
      <div className="shk-rule__inner">
        {c.eyebrow && <p className="shk-rule__eyebrow">{c.eyebrow}</p>}
        {c.lead && <h2 className="shk-rule__lead">{c.lead}</h2>}
        <ul className="shk-rule__line">
          {items.map((it) => (
            <li key={it.label} className="shk-rule__item">
              <span className="shk-rule__icon" aria-hidden="true">
                {/* Cropped to the glyph's own bounds (x 15–33, y 13–34) — the
                    enclosing circle is dropped so the mark stays legible small;
                    the word "no" already carries the prohibition. */}
                <svg viewBox="13 11 22 25" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {pickIcon(it.icon)}
                </svg>
              </span>
              <span className="shk-rule__label">
                {it.deny && <><span className="shk-rule__no">no</span>{" "}</>}
                <span className="shk-rule__what">{it.label}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
