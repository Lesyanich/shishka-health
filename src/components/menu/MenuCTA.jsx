// Contact / order links. TODO: replace placeholders with the real ones.
// WhatsApp uses the wa.me format: https://wa.me/<countrycode+number, digits only>
const WHATSAPP_URL = ""; // e.g. "https://wa.me/66812345678"
const INSTAGRAM_URL = "https://instagram.com/shishka.health";

const BRANCHES = [
  { name: "2 Tops branch", note: "Phuket" },
  { name: "9 Kitchen branch", note: "Phuket" },
];

export function MenuCTA({ wide = false }) {
  return (
    <section className={`shk-cta ${wide ? "shk-cta--wide" : ""}`} aria-label="Visit & order">
      <div className="shk-cta__inner">
        <p className="shk-cta__eyebrow">visit us in phuket</p>
        <h2 className="shk-cta__title">come hungry.</h2>
        <p className="shk-cta__sub">
          Real food, made fresh every day across our two Phuket kitchens.
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
            Instagram
          </a>
        </div>

        <ul className="shk-cta__branches">
          {BRANCHES.map((b) => (
            <li key={b.name} className="shk-cta__branch">
              <span className="shk-cta__branch-name">{b.name}</span>
              <span className="shk-cta__branch-note">{b.note}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
