import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { SCORE } from "../lib/fruitArt.jsx";

/*
  The slice game's counter.

  Cutting produce as it falls past adds up the calories the guest actually burns
  doing it. That is the whole feature — there is no goal, no prize and no
  discount attached to it. It is a toy.

  --------------------------------------------------------------------------
  WHY THE NUMBERS ARE SO SMALL
  --------------------------------------------------------------------------
  Because that is what a swipe costs. Moving an arm hard enough to cut a falling
  fruit runs at roughly 3 kcal/min above resting, and a swipe lasts about half a
  second — so a slice is worth a few hundredths of a calorie.

  It is tempting to inflate this into arcade numbers, and we deliberately don't:
  every dish on this site publishes a real calorie count, and a counter claiming
  the guest burned 10,000 of them while browsing would sit on the same screen as
  those figures and quietly make a liar of them. A restaurant selling honest
  food should not be the one place a customer sees fake nutrition maths. Small
  and true is also funnier than big and invented — "you have burned 0.4 calories"
  is the joke, and it only works if the 0.4 is real.

  PRODUCE[key].score in lib/fruitArt.jsx stays an *effort* rating (how hard the
  item is to hit: a lemon 60, a scatter of chia 1100). Calories are derived from
  it here, in one place, so retuning the difficulty never desynchronises from the
  number on screen.
*/

const STORE_KEY = "shk.slicer.v3"; // v2 held credits + a discount reward; both are gone

/*
  Effort points → calories, compressed rather than scaled.

  The effort ratings span 18× (lemon 60 → chia 1100) because they encode how
  hard something is to *hit*. The energy cost of the swipes themselves does not
  span 18×: a hard slice is a faster, longer arm movement than an easy one, but
  it is still one arm movement. Multiplying effort by a constant would therefore
  keep the ordering and lose the physics — the chia would "burn" half a calorie,
  which is about ten swipes' worth of truth in a single flick.

  So a square root: the ordering survives, the spread compresses to ~4×, and
  both ends stay in a band you could defend out loud. An easy slice is 0.02 kcal
  (a half-second arm movement at roughly 3 kcal/min above resting); the hardest
  is about 0.09.
*/
const KCAL_EASIEST = 0.02;
const EASIEST = Math.min(...Object.values(SCORE)); // read from the table, so retuning it can't desync

export const kcalFor = (key) => {
  const score = SCORE[key] ?? 0;
  if (score <= 0) return 0;
  return KCAL_EASIEST * Math.sqrt(score / EASIEST);
};

// Kept to 3 decimals so repeated float addition can't drift into 0.30000000000004.
const tidy = (n) => Math.round(n * 1000) / 1000;

const SlicerContext = createContext(null);

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (typeof v?.kcal !== "number" || !Number.isFinite(v.kcal)) return null;
    return { kcal: v.kcal, sliced: typeof v.sliced === "number" ? v.sliced : 0 };
  } catch {
    return null;
  }
}

/*
  Two tabs on the same site share one key and each holds its own React state, so
  a plain write lets the staler tab drag the count backwards. Merging on the way
  out keeps it monotonic — the guest's total only ever goes up.
*/
function merge(mine) {
  const theirs = load();
  if (!theirs) return mine;
  return {
    kcal: tidy(Math.max(mine.kcal, theirs.kcal)),
    sliced: Math.max(mine.sliced, theirs.sliced),
  };
}

export function SlicerProvider({ children }) {
  const [state, setState] = useState(() => load() ?? { kcal: 0, sliced: 0 });

  // Everything the loop needs to read without re-subscribing.
  const latest = useRef(state);
  latest.current = state;

  useEffect(() => {
    const merged = merge(state);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(merged));
    } catch {
      /* private mode, quota, whatever — the game just doesn't persist */
    }
    if (merged.kcal !== state.kcal || merged.sliced !== state.sliced) setState(merged);
  }, [state]);

  // Another tab has been slicing: catch up rather than show a stale total.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORE_KEY) return;
      const next = load();
      if (next) setState((prev) => merge({ ...prev, ...next }));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /*
    Called from the rAF slice loop, which can fire several times in one frame if
    a fast swipe crosses two items. The functional update makes that safe, and
    the return value is what the "+N" popup shows.
  */
  const scoreSlice = useCallback((key) => {
    const burn = kcalFor(key);
    setState((prev) => ({ kcal: tidy(prev.kcal + burn), sliced: prev.sliced + 1 }));
    return burn;
  }, []);

  const value = useMemo(
    () => ({ kcal: state.kcal, sliced: state.sliced, scoreSlice }),
    [state, scoreSlice],
  );

  return <SlicerContext.Provider value={value}>{children}</SlicerContext.Provider>;
}

export function useSlicer() {
  const ctx = useContext(SlicerContext);
  if (!ctx) throw new Error("useSlicer must be used within SlicerProvider");
  return ctx;
}
