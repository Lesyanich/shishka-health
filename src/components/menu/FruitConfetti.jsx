/*
  Decorative fruit- and veg-slice cut-outs scattered behind the hero copy.

  This file owns only the *placement*. The drawings themselves live in
  lib/fruitArt.jsx, shared with the falling sliceable layer (FruitFall.jsx), so
  a colour fix lands in both surfaces at once.

  These slices are static and authored, never randomised — the hero reads the
  same on every load. The fruit that drifts past you is the other component.
*/

import { SLICE_ART } from "../../lib/fruitArt.jsx";

/*
  Where each slice lands. Fixed rather than randomised at runtime so the layout
  never shifts between renders — the scatter is authored, not generated.

  x/y are percentages of the hero copy block; `size` is the desktop diameter.

  On desktop the copy sits in a centred column, so the outer ~22% either side is
  free. A phone has no such gutter — the headline runs nearly edge to edge — so
  slices with mx/my move into the empty bands above and below the copy, and the
  ones without are dropped entirely rather than sat on top of the type.
*/
const SCATTER = [
  { art: "lemon", x: 7, y: 20, size: 78, rot: -14, mx: 2, my: 8 },
  { art: "blueberry", x: 20, y: 36, size: 26, rot: 0 },
  { art: "bloodOrange", x: 4, y: 48, size: 30, rot: 20 },
  { art: "kiwi", x: 13, y: 66, size: 46, rot: 10 },
  { art: "watermelon", x: 3, y: 86, size: 54, rot: 18, mx: 1, my: 96 },
  { art: "lime", x: 23, y: 80, size: 30, rot: -8, mx: 15, my: 97 },
  { art: "tomato", x: 80, y: 16, size: 44, rot: -18, mx: 86, my: 5 },
  { art: "orange", x: 94, y: 26, size: 74, rot: 12, mx: 98, my: 10 },
  { art: "dragonfruit", x: 89, y: 52, size: 34, rot: 14 },
  { art: "strawberry", x: 78, y: 74, size: 32, rot: -10 },
  { art: "cucumber", x: 96, y: 86, size: 56, rot: 6, mx: 99, my: 94 },
];

export function FruitConfetti() {
  return (
    <div className="shk-confetti" aria-hidden="true">
      {SCATTER.map((s) => (
        <svg
          key={s.art}
          className={`shk-confetti__slice${s.mx === undefined ? " shk-confetti__slice--wide-only" : ""}`}
          viewBox="0 0 100 100"
          style={{
            "--x": `${s.x}%`,
            "--y": `${s.y}%`,
            "--mx": `${s.mx}%`,
            "--my": `${s.my}%`,
            "--size": `${s.size}px`,
            "--rot": `${s.rot}deg`,
          }}
        >
          {SLICE_ART[s.art]}
        </svg>
      ))}
    </div>
  );
}
