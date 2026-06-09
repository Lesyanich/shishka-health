import { useMenu } from "../../hooks/useMenu.js";

/*
  SHISHKA home / landing page — the brand mockup as-is: royal-green canvas,
  centered white logo, the category icon row, and the full-bleed salad bar
  along the bottom, with a single "Enter the site" button in the open space.
  (See main.jsx for the gate that reveals the menu site.)

  Category icons live in /public/assets/cat. Three of the nine categories in the
  mockup (mana keesh, super wrap, hot meals) don't have a dedicated icon in the
  repo yet — marked `placeholder` below and using the closest existing icon
  until the real ones are supplied.
*/

const CATEGORIES = [
  { label: "daily breakfast",      icon: "breakfast.png" },
  { label: "mana keesh",           icon: "sourdough.png",       placeholder: true },
  { label: "salad & bowl",         icon: "salad-bowl.png" },
  { label: "super wrap",           icon: "nutrition-bowl.png",  placeholder: true },
  { label: "fresh springroll",     icon: "fresh-springroll.png" },
  { label: "hot meals",            icon: "rice-protein.png",    placeholder: true },
  { label: "daily soup",           icon: "daily-soup.png" },
  { label: "fresh juice",          icon: "fresh-juice.png" },
  { label: "chocolate & desserts", icon: "healthy-desserts.png" },
];

export function Landing({ onEnter }) {
  // Warm the menu data while the visitor is on the splash so the site is ready.
  useMenu();

  return (
    <div className="shk-landing">
      <div className="shk-landing__inner">
        <header className="shk-landing__head">
          <img
            className="shk-landing__logo"
            src="/assets/logo-full-white.png"
            alt="SHISHKA — Healthy Kitchen"
          />
        </header>

        <div className="shk-landing__center">
          <button
            type="button"
            className="shk-landing__enter"
            onClick={onEnter}
          >
            Enter the site
            <span className="shk-landing__enter-arrow" aria-hidden="true">→</span>
          </button>
        </div>

        <nav className="shk-landing__cats" aria-label="What we serve">
          {CATEGORIES.map((c) => (
            <div className="shk-landing__cat" key={c.label}>
              <img
                className="shk-landing__cat-icon"
                src={`/assets/cat/${c.icon}`}
                alt=""
                aria-hidden="true"
              />
              <span className="shk-landing__cat-label">{c.label}</span>
            </div>
          ))}
        </nav>
      </div>

      <div className="shk-landing__saladbar" aria-hidden="true">
        <img src="/assets/hero-saladbar.jpg" alt="" />
      </div>
    </div>
  );
}
