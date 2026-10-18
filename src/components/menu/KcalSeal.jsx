/*
  KcalSeal — the calorie figure rendered as a circular sunburst "stamp", the
  same brand mandala language as PriceSeal but carrying a different payload.

  Why a second seal instead of a variant of PriceSeal:
    - PriceSeal IS the add button (a <button> whose whole body is the tap
      target). KcalSeal is never interactive — in the menu redesign the "+"
      moved out into its own 44x44 button and the price became plain text
      under the photo, so the stamp is free to carry kcal.
    - The geometry differs: 24 teeth on a 64 viewBox with a SOLID inner disc,
      against PriceSeal's 28 teeth on a 100 viewBox with an evenodd hole.
    - PriceSeal still has live callers (ManakishTiers, DishRows), so it is not
      being renamed out from under them.

  Geometry is lifted from docs/redesign/mockups/A2-cat-grid.dc.html: a 48-point
  polygon alternating between tip radius 31.5 and valley radius 26.5 about the
  centre of a 64x64 box, with a white disc of r 24.5 punched over it.
*/

import { t } from "../../i18n/index.js";

const TEETH = 24;
const C = 32; // viewBox centre (64x64)
const R_TIP = 31.5;
const R_VALLEY = 26.5;
const R_FACE = 24.5; // the plain disc the number sits on

// One polygon, alternating tip/valley — cheaper than a path and matches the
// mockup's own construction exactly.
const POINTS = Array.from({ length: TEETH * 2 }, (_, i) => {
  const r = i % 2 === 0 ? R_TIP : R_VALLEY;
  const a = (Math.PI * i) / TEETH - Math.PI / 2;
  return `${(C + r * Math.cos(a)).toFixed(2)},${(C + r * Math.sin(a)).toFixed(2)}`;
}).join(" ");

// md = mobile grid card, lg = desktop card, xl = the dish sheet. Spec §5.
const SIZES = { md: 62, lg: 70, xl: 84 };

export function KcalSeal({ kcal, size = "md", className = "", ...rest }) {
  const px = SIZES[size] ?? SIZES.md;

  return (
    <span
      className={`shk-kseal shk-kseal--${size} ${className}`.trim()}
      // The stack scales off one font-size so md/lg/xl stay proportional:
      // 17px number on a 62px stamp is the mockup's ratio.
      style={{ width: px, height: px, fontSize: `${(px * 0.274).toFixed(2)}px` }}
      role="img"
      aria-label={t("seal.kcalAria", { kcal })}
      {...rest}
    >
      <svg className="shk-kseal__ring" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <polygon className="shk-kseal__edge" points={POINTS} />
        <circle className="shk-kseal__face" cx={C} cy={C} r={R_FACE} />
      </svg>
      <span className="shk-kseal__stack" aria-hidden="true">
        <span className="shk-kseal__num">{kcal}</span>
        <span className="shk-kseal__unit">{t("card.kcal")}</span>
      </span>
    </span>
  );
}
