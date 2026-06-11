import { useMenu } from "../../hooks/useMenu.js";

/*
  SHISHKA home / landing — a single full-bleed poster: the salad-bar photo fills
  the screen under a royal-green wash, with the white logo, a short tagline, and
  ONE "Enter the site" button centered on top. (See main.jsx for the gate that
  reveals the menu.)
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
        <img
          className="shk-landing__logo"
          src="/assets/logo-full-white.png"
          alt="SHISHKA — Healthy Kitchen"
        />
        <p className="shk-landing__tagline">Healthy Kitchen</p>

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
  );
}
