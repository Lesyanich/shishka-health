import { DEFAULT_CONTENT } from "../../lib/content.js";

export function MenuCTA({ wide = false, content }) {
  const c = { ...DEFAULT_CONTENT.cta, ...(content || {}) };

  return (
    <section className={`shk-cta ${wide ? "shk-cta--wide" : ""}`} aria-label="Visit & order">
      <div className="shk-cta__inner">
        {c.eyebrow && <p className="shk-cta__eyebrow">{c.eyebrow}</p>}
        <h2 className="shk-cta__title">{c.title}</h2>
        {c.sub && <p className="shk-cta__sub">{c.sub}</p>}

        <div className="shk-cta__actions">
          {c.whatsappUrl && (
            <a
              className="shk-cta__btn shk-cta__btn--primary"
              href={c.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              order on WhatsApp <span aria-hidden="true">→</span>
            </a>
          )}
          {c.instagramUrl && (
            <a
              className="shk-cta__btn shk-cta__btn--ghost"
              href={c.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram <span aria-hidden="true">→</span>
            </a>
          )}
        </div>

        {(c.hoursLabel || c.hoursTime) && (
          <div className="shk-cta__hours">
            {c.hoursLabel && <span className="shk-cta__hours-label">{c.hoursLabel}</span>}
            {c.hoursTime && <span className="shk-cta__hours-time num">{c.hoursTime}</span>}
          </div>
        )}
      </div>
    </section>
  );
}
