import {
  STEPS,
  STYLES,
  DEFAULT_FLAT_PRICE,
  DEFAULT_SAUCE_COUNT,
  stepCount,
  stepTagline,
} from "../../data/byoCatalog.js";
import { DEFAULT_CONTENT } from "../../lib/content.js";

/*
  The Build-Your-Own concept, on the guest site.

  This reads STEPS and STYLES from the same byoCatalog.js the wall board reads.
  That is the whole point of putting it here rather than retyping four steps
  into site_content: the TV in the restaurant and the website cannot drift. Add
  a base to the catalog and both the board and this section say nine. When the
  catalog is replaced by the v_byo_catalog view, both switch in one change.

  Only the framing copy — eyebrow, headline, the line under it — comes from
  site_content, because that is the part the CEO rewrites without a deploy. The
  step names are menu data and belong with the menu.

  ---------------------------------------------------------------------------
  On the palette, because the obvious version of this section is wrong.

  The board is dark royal green with gold. Reproducing that here would mean a
  full-bleed dark band, and this theme deliberately does not have one:
  theme-light.css is "white page, royal-green ink — the printed-menu look", it
  retires the dark surfaces outright ("on dark no longer means dark: the canvas
  is white"), and it says twice that gold is unreadable on white. A dark band
  would not be reflecting the concept on the site, it would be pasting the TV
  onto it.

  So the concept transfers and the palette does not. What carries over is the
  structure a guest has to learn — four steps, one price, pick as you go — set
  the way this site sets everything else: white ground, green ink, red for the
  one word that shouts. The numerals are the only new primitive, and they are
  outlined rather than filled so four of them in a row read as a sequence
  instead of four heavy blocks.
*/

export function ByoIntro({ wide = false, content, sauceCount = DEFAULT_SAUCE_COUNT }) {
  const c = { ...DEFAULT_CONTENT.byo, ...(content || {}) };
  if (c.enabled === false) return null;

  const price = c.price ?? DEFAULT_FLAT_PRICE;

  // aria-label rather than aria-labelledby: the headline is editable from
  // site_content and can be blanked, which would leave the reference pointing
  // at nothing. A landmark's name should not depend on editable copy.
  return (
    <section className={`shk-byoi ${wide ? "shk-byoi--wide" : ""}`} aria-label="Build your own">
      <div className="shk-byoi__inner">
        {c.eyebrow && <p className="shk-byoi__eyebrow">{c.eyebrow}</p>}
        {c.lead && <h2 className="shk-byoi__lead">{c.lead}</h2>}
        {c.sub && <p className="shk-byoi__sub">{c.sub}</p>}

        {/* The four styles, as the answer to "what am I actually ordering?".
            Above the steps because it is the first question — the steps are
            how you fill it, not what it is. */}
        <ul className="shk-byoi__styles">
          {STYLES.map((s) => (
            <li key={s.code} className="shk-byoi__style">
              {s.en}
            </li>
          ))}
        </ul>

        {/* An ordered list because it is genuinely ordered — you cannot pick a
            dressing before a base. Screen readers get the numbering for free;
            the visible numerals are decorative and hidden from them. */}
        <ol className="shk-byoi__steps">
          {STEPS.map((step) => {
            const count = stepCount(step, sauceCount);
            return (
              <li key={step.code} className="shk-byoi__step">
                <span className="shk-byoi__n num" aria-hidden="true">
                  {step.n}
                </span>
                <h3 className="shk-byoi__t">{step.en}</h3>
                <p className="shk-byoi__d">{stepTagline(step)}</p>
                <span className="shk-byoi__c num">{count} to choose from</span>
              </li>
            );
          })}
        </ol>

        <p className="shk-byoi__price">
          <span className="shk-byoi__price-n num">{price}</span>
          <span className="shk-byoi__price-cur">THB</span>
          <span className="shk-byoi__price-note">{c.priceNote}</span>
        </p>
      </div>
    </section>
  );
}
