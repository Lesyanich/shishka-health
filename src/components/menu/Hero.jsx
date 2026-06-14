import { DEFAULT_CONTENT } from "../../lib/content.js";

// Wrap ALL-CAPS words (e.g. SOIL, SOUL) in an accent span; leave the rest as-is.
function renderTitle(title) {
  return title.split(/(\s+)/).map((tok, i) => {
    const letters = tok.replace(/[^A-Za-z]/g, "");
    const isCaps = letters.length > 1 && letters === letters.toUpperCase();
    return isCaps ? <span key={i}>{tok}</span> : tok;
  });
}

export function Hero({ wide = false, content }) {
  const c = { ...DEFAULT_CONTENT.hero, ...(content || {}) };
  return (
    <section className={`shk-hero ${wide ? "shk-hero--wide" : ""}`} aria-label="Shishka Healthy Kitchen">
      <div className="shk-hero__inner">
        {c.eyebrow && <p className="shk-hero__eyebrow">{c.eyebrow}</p>}
        <h1 className="shk-hero__title">{renderTitle(c.title)}</h1>
        {c.sub && <p className="shk-hero__sub">{c.sub}</p>}
      </div>
      <div className="shk-hero__band" aria-hidden="true">
        <picture>
          {/* phones: portrait crop · tablets: square crop · desktop: landscape */}
          <source
            media="(max-width: 640px)"
            srcSet="https://qcqgtcsjoacuktcewpvo.supabase.co/storage/v1/object/public/nomenclature-photos/landing/salad-bar-portrait.webp?v=20260612"
          />
          <source
            media="(max-width: 1024px)"
            srcSet="https://qcqgtcsjoacuktcewpvo.supabase.co/storage/v1/object/public/nomenclature-photos/landing/salad-bar-square.webp?v=20260612"
          />
          <img
            src="https://qcqgtcsjoacuktcewpvo.supabase.co/storage/v1/object/public/nomenclature-photos/landing/main-salad-bar.webp?v=20260612"
            alt=""
          />
        </picture>
      </div>
    </section>
  );
}
