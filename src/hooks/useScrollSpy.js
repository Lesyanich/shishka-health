import { useEffect, useState } from "react";

/*
  Scroll-spy — ONE module, two placements (SPEC.md §3.4 and §4.3 are the same
  rule on purpose: the mobile rail and the desktop left nav must never disagree
  about where the guest is).

  The rule: the active section is the one whose body last crossed 30% of the
  viewport height.

  The implementation is an IntersectionObserver and NEVER a scroll listener. A
  scroll handler on a ~10 700px page runs on every frame of a flick and still
  has to answer "which heading is nearest 30%?" with its own arithmetic; the
  observer answers it in the browser, off the main thread, by construction:

    rootMargin "-30% 0px -69% 0px"

  shrinks the root to a band 1% of the viewport tall sitting exactly on the 30%
  line. Sections are contiguous and much taller than 1% of a screen, so exactly
  one of them crosses that band at any moment — no "nearest heading" maths and
  no jitter at the seam between two sections. (A 0%-tall band is degenerate and
  matches nothing, which is why it is 69 and not 70.)

  Observes the SECTIONS, not the headings: a heading is a few pixels tall and
  leaves the band almost immediately, which would blank the selection for most
  of the scroll.

  The root is the viewport, so the page itself must be the scroller — the
  redesign page scrolls the document rather than an inner overflow box.
*/

export const SPY_ROOT_MARGIN = "-30% 0px -69% 0px";

/*
  ids — the DOM ids of the sections, in page order. Returns [active, setActive];
  `setActive` exists so a nav click can light its own pill immediately instead
  of waiting for the smooth scroll to drag the band over the destination.
*/
export function useScrollSpy(ids) {
  const [active, setActive] = useState(null);
  // Effects key off the list's contents, not its identity: the caller rebuilds
  // the array on every render.
  const key = ids.join("|");

  useEffect(() => {
    if (ids.length === 0) return;

    // Above the first 30% band nothing intersects, so the first section is the
    // honest answer for a page sitting at the top. Also repairs a selection
    // pointing at a section that has gone away (a filter, a data reload).
    setActive((cur) => (cur && ids.includes(cur) ? cur : ids[0]));

    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: SPY_ROOT_MARGIN, threshold: 0 },
    );
    for (const el of els) io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [active, setActive];
}
