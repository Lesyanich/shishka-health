import { useMenu } from "../../hooks/useMenu.js";

/*
  SHISHKA home / landing — advertising splash for the new menu. A royal-green
  canvas with a warm glow and a row of featured drink cutouts (the big ORANGE
  espresso in the middle, a smoothie + a coffee beside it), a "New on the menu"
  eyebrow and the headline. Logo + the single "Enter the site" button sit
  together in the bottom-right corner. (See main.jsx for the gate.)
*/

const BUCKET =
  "https://qcqgtcsjoacuktcewpvo.supabase.co/storage/v1/object/public/nomenclature-photos/landing";
const DRINKS = {
  orange: `${BUCKET}/orange-coffee-cutout.webp?v=20260613`,
  mango: `${BUCKET}/smoothie-mango-strawberry.webp?v=20260613`,
  latte: `${BUCKET}/iced-latte.webp?v=20260613`,
};

export function Landing({ onEnter }) {
  // Warm the menu data while the visitor is on the splash so the site is ready.
  useMenu();

  return (
    <div className="shk-landing shk-landing--promo">
      <div className="shk-landing__glow" aria-hidden="true" />

      <div className="shk-landing__content">
        <div className="shk-landing__promo">
          <p className="shk-landing__eyebrow">New on the menu</p>

          <div className="shk-landing__drinks">
            <img
              className="shk-landing__drink shk-landing__drink--side"
              src={DRINKS.mango}
              alt="Mango Strawberry Smoothie"
            />
            <img
              className="shk-landing__drink shk-landing__drink--hero"
              src={DRINKS.orange}
              alt="Orange Espresso"
            />
            <img
              className="shk-landing__drink shk-landing__drink--side"
              src={DRINKS.latte}
              alt="Iced Latte"
            />
          </div>

          <h1 className="shk-landing__tagline">
            <span>ORANGE</span> espresso
          </h1>
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
