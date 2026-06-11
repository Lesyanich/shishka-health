import { useEffect } from "react";

/*
  Scroll-reveal with per-group stagger. Menu items (cutout tiles, menu rows,
  manakish cutouts, set cards) rise in as they enter the viewport, staggered
  30-50ms within their group. Uses a one-shot animation and removes its own
  classes on animationend so card hover/press transforms are never overridden
  by animation fill. Reduced motion is handled globally (base.css forces
  animation-duration to 0.01ms, so items appear instantly).
*/

const SELECTOR =
  ".shk-app__grid > *, .shk-rows > li, .shk-mana__list > li, .shk-set";

export function useReveal(deps) {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const els = [...document.querySelectorAll(SELECTOR)].filter(
      (el) => !el.dataset.reveal
    );
    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 }
    );

    for (const el of els) {
      el.dataset.reveal = "1";
      const i = [...el.parentElement.children].indexOf(el);
      el.style.setProperty("--reveal-delay", `${Math.min(i, 11) * 40}ms`);
      el.classList.add("shk-reveal");
      el.addEventListener(
        "animationend",
        () => {
          el.classList.remove("shk-reveal", "is-in");
          el.style.removeProperty("--reveal-delay");
        },
        { once: true }
      );
      io.observe(el);
    }
    return () => io.disconnect();
  }, deps);
}
