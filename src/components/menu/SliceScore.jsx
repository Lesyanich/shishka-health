import { useEffect, useState } from "react";
import { useSlicer } from "../../state/slicer.jsx";

/*
  The calorie counter — bottom-left, mirroring the Order button opposite it.

  It doesn't exist until you've cut something. Nobody arrives at a restaurant
  menu wanting a game explained to them; the fruit falls, you eventually swipe
  through one, and only then does a counter appear to tell you that meant
  something. That order matters — a "PLAY!" badge on a menu is an ad.

  There is nothing to win. It counts the calories the swiping actually burned,
  which is a very small number, and that is the joke. See state/slicer.jsx for
  why we don't inflate it.
*/

function KnifeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 21 8.5 15.5" />
      <path d="M9 15 20.5 3.5a1.5 1.5 0 0 1 2 2L11 17Z" />
    </svg>
  );
}

/*
  Two decimals early on, when a single slice is most of the total and rounding to
  one would show a stubborn "0.0"; one decimal later, when the extra digit is
  just noise.
*/
const fmt = (n) => (n < 1 ? n.toFixed(2) : n.toFixed(1));

export function SliceScore() {
  const { kcal, sliced } = useSlicer();
  const [bump, setBump] = useState(false);

  // A short pulse on every gain, so the counter is legible out of the corner of
  // the eye without needing to be big.
  useEffect(() => {
    if (sliced <= 0) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 280);
    return () => clearTimeout(t);
  }, [sliced]);

  if (sliced <= 0) return null;

  return (
    <div
      className={`shk-slicer${bump ? " is-bump" : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className="shk-slicer__icon"><KnifeIcon /></span>
      <span className="shk-slicer__body">
        <span className="shk-slicer__num num">
          {fmt(kcal)}<i className="shk-slicer__unit">cal</i>
        </span>
        <span className="shk-slicer__hint">
          burned · {sliced.toLocaleString()} sliced
        </span>
      </span>
    </div>
  );
}
