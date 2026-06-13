import { useMenu } from "../../hooks/useMenu.js";

/*
  SHISHKA home / landing — advertising splash for the new menu. A solid
  royal-green canvas: the white logo centred at the top, a "New on the menu"
  eyebrow, then a single-line strip of equally-sized drink cutouts (coffee +
  smoothies), and one "Enter the kitchen" button. (See main.jsx for the gate.)
*/

const BUCKET =
  "https://qcqgtcsjoacuktcewpvo.supabase.co/storage/v1/object/public/nomenclature-photos/landing";
const V = "20260613b";
const DRINKS = [
  { key: "passion-mango", file: "smoothie-passion-mango", alt: "Passion Mango Smoothie" },
  { key: "mango-strawberry", file: "smoothie-mango-strawberry", alt: "Mango Strawberry Smoothie" },
  { key: "mixed-berry", file: "smoothie-mixed-berry", alt: "Mixed Berry Smoothie" },
  { key: "green-ice", file: "smoothie-green-ice", alt: "Green Ice Smoothie" },
  { key: "iced-latte", file: "iced-latte", alt: "Iced Latte" },
  { key: "caramel-latte", file: "caramel-latte", alt: "Caramel Latte" },
];

export function Landing({ onEnter }) {
  // Warm the menu data while the visitor is on the splash so the site is ready.
  useMenu();

  return (
    <div className="shk-landing shk-landing--strip">
      <header className="shk-landing__top">
        <img
          className="shk-landing__logo"
          src="/assets/logo-full-white.png"
          alt="SHISHKA — Healthy Kitchen"
        />
        <p className="shk-landing__eyebrow">New on the menu</p>
      </header>

      <div className="shk-landing__strip">
        {DRINKS.map((d) => (
          <img
            key={d.key}
            className="shk-landing__drink"
            src={`${BUCKET}/${d.file}.webp?v=${V}`}
            alt={d.alt}
          />
        ))}
      </div>

      <button type="button" className="shk-landing__enter" onClick={onEnter}>
        Enter the kitchen
        <span className="shk-landing__enter-arrow" aria-hidden="true">→</span>
      </button>
    </div>
  );
}
