import { useMenu } from "../../hooks/useMenu.js";

/*
  SHISHKA home / landing — advertising splash for the new menu. A solid
  royal-green canvas: the white logo centred at the top, then the featured pair
  (one coffee + one smoothie) as equally-sized, tightly-trimmed cutouts with
  their names directly underneath, and a "New on the menu" eyebrow sitting right
  above them. One "Enter the kitchen" button. (See main.jsx for the gate.)
*/

const BUCKET =
  "https://qcqgtcsjoacuktcewpvo.supabase.co/storage/v1/object/public/nomenclature-photos/landing";
const V = "20260613c";
const DRINKS = [
  { key: "orange", file: "orange-coffee-cutout", name: "Orange Espresso" },
  { key: "mango", file: "smoothie-mango-strawberry", name: "Mango Strawberry" },
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
      </header>

      <div className="shk-landing__feature">
        <p className="shk-landing__eyebrow">New on the menu</p>
        <div className="shk-landing__strip">
          {DRINKS.map((d) => (
            <figure key={d.key} className="shk-landing__item">
              <img
                className="shk-landing__drink"
                src={`${BUCKET}/${d.file}.webp?v=${V}`}
                alt={d.name}
              />
              <figcaption className="shk-landing__name">{d.name}</figcaption>
            </figure>
          ))}
        </div>
      </div>

      <button type="button" className="shk-landing__enter" onClick={onEnter}>
        Enter the kitchen
        <span className="shk-landing__enter-arrow" aria-hidden="true">→</span>
      </button>
    </div>
  );
}
