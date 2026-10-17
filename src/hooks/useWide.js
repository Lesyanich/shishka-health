import { useEffect, useState } from "react";

/*
  The one breakpoint (SPEC.md §6): 1024 px. Under it the nav is a sticky rail on
  top and a dish opens a bottom sheet; over it the nav is a sticky left column
  and the card shows everything inline with no dialog at all (§4.5).

  A media query in JS, not only in CSS, because those two differences are
  structural rather than cosmetic — which component renders, and whether a dish
  has an opener — and CSS cannot decide those.
*/
export const WIDE_MQ = "(min-width: 1024px)";

export function useWide() {
  const [wide, setWide] = useState(
    () => typeof window !== "undefined" && window.matchMedia(WIDE_MQ).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(WIDE_MQ);
    const fn = (e) => setWide(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return wide;
}
