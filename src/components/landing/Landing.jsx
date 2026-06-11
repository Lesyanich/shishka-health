import { useMenu } from "../../hooks/useMenu.js";

/*
  SHISHKA home / landing — a single full-bleed advertising poster: the salad-bar
  photo fills the screen under a royal-green wash. The brand statement sits at
  the bottom-left; the white logo + the one "Enter the site" button are anchored
  together in the bottom-RIGHT corner, right-aligned. The wide-open top area is
  reserved for promoting monthly offers later. (See main.jsx for the gate.)
*/

export function Landing({ onEnter }) {
  // Warm the menu data while the visitor is on the splash so the site is ready.
  useMenu();

  return (
    <div className="shk-landing">
      <div className="shk-landing__bg" aria-hidden="true">
        <img src="/assets/hero-saladbar.jpg" alt="" />
      </div>
      <div className="shk-landing__wash" aria-hidden="true" />

      <div className="shk-landing__content">
        <p className="shk-landing__tagline">
          Fresh, unprocessed, scientifically balanced
          {" "}— real food, made daily.
        </p>

        <div className="shk-landing__brand">
          <img
            className="shk-landing__logo"
            src="/assets/logo-full-white.png"
            alt="SHISHKA — Healthy Kitchen"
          />
          <button
            type="button"
            className="shk-landing__enter"
            onClick={onEnter}
          >
            Enter the site
            <span className="shk-landing__enter-arrow" aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
