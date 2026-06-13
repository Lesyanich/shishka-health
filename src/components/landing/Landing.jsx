import { useMenu } from "../../hooks/useMenu.js";

/*
  SHISHKA home / landing — advertising splash for the new menu. A royal-green
  canvas with a warm glow, the featured drink as a floating cutout, a
  "New on the menu" eyebrow + the drink name. The white logo and the single
  "Enter the site" button sit together in the bottom-right corner.
  (See main.jsx for the gate.)
*/

const DRINK_CUTOUT =
  "https://qcqgtcsjoacuktcewpvo.supabase.co/storage/v1/object/public/nomenclature-photos/landing/orange-coffee-cutout.webp?v=20260613";

export function Landing({ onEnter }) {
  // Warm the menu data while the visitor is on the splash so the site is ready.
  useMenu();

  return (
    <div className="shk-landing shk-landing--promo">
      <div className="shk-landing__glow" aria-hidden="true" />

      <div className="shk-landing__content">
        <div className="shk-landing__promo">
          <p className="shk-landing__eyebrow">New on the menu</p>
          <div className="shk-landing__product">
            <img className="shk-landing__drink" src={DRINK_CUTOUT} alt="Orange Coffee" />
          </div>
          <h1 className="shk-landing__tagline">Orange Coffee</h1>
        </div>

        <div className="shk-landing__brand">
          <img
            className="shk-landing__logo"
            src="/assets/logo-full-white.png"
            alt="SHISHKA — Healthy Kitchen"
          />
          <button type="button" className="shk-landing__enter" onClick={onEnter}>
            Enter the site
            <span className="shk-landing__enter-arrow" aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
