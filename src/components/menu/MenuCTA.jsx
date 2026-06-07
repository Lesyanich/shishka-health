// Contact / order links. TODO: add the WhatsApp ordering number when ready.
// WhatsApp uses the wa.me format: https://wa.me/<countrycode+number, digits only>
const WHATSAPP_URL = ""; // e.g. "https://wa.me/66812345678" — button is hidden while empty
const INSTAGRAM_URL = "https://www.instagram.com/shishka_phuket";

export function MenuCTA({ wide = false }) {
  return (
    <section className={`shk-cta ${wide ? "shk-cta--wide" : ""}`} aria-label="Visit & order">
      <div className="shk-cta__inner">
        <p className="shk-cta__eyebrow">visit us in phuket</p>
        <h2 className="shk-cta__title">come hungry.</h2>
        <p className="shk-cta__sub">
          Real food, made fresh every day — drop by our Phuket kitchen.
        </p>

        <div className="shk-cta__actions">
          {WHATSAPP_URL && (
            <a
              className="shk-cta__btn shk-cta__btn--primary"
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              order on WhatsApp <span aria-hidden="true">→</span>
            </a>
          )}
          <a
            className="shk-cta__btn shk-cta__btn--ghost"
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram <span aria-hidden="true">→</span>
          </a>
        </div>

        <div className="shk-cta__hours">
          <span className="shk-cta__hours-label">open daily</span>
          <span className="shk-cta__hours-time num">9:00 – 18:00</span>
        </div>
      </div>
    </section>
  );
}
