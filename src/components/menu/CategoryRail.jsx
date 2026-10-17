import { useEffect, useRef } from "react";
import { CategoryTabs } from "../filters/CategoryTabs.jsx";
import { t } from "../../i18n/index.js";

/*
  The sticky category rail (SPEC.md §3.3) — the existing `.shk-tabs` pill rail,
  pinned to the top of a phone screen.

  This rail is load-bearing, not decoration. The menu is ~10 700 px, about
  thirteen phone screens: without it the only way to the Chocolate at the bottom
  is thirteen flicks. That is the honest cost of dropping the tile home (§0), and
  it is why the pills have to track the scroll and stay reachable.

  The one piece of real behaviour here is keeping the ACTIVE pill in view as the
  guest scrolls. It moves the rail's own `scrollLeft` and never calls
  `scrollIntoView`: that method scrolls every scrollable ancestor, so nudging a
  pill sideways would drag the PAGE as well — the menu would scroll itself while
  the guest was already scrolling it, and the spy would then report a section
  nobody navigated to. (Same trap, same fix, as in the approved prototype.)
*/

// How much of the next pill stays visible past the active one, so the rail
// reads as "there is more this way" rather than ending at the selection.
const PEEK = 16;

export function CategoryRail({ sections, idFor, active, onPick }) {
  const wrapRef = useRef(null);

  useEffect(() => {
    const rail = wrapRef.current?.querySelector(".shk-tabs");
    if (!rail || !active) return;
    // The selected pill is the one CategoryTabs marked, so this never has to
    // know how that component builds its ids.
    const pill = rail.querySelector('[aria-selected="true"]');
    if (!pill) return;

    const left = pill.offsetLeft - PEEK;
    const right = pill.offsetLeft + pill.offsetWidth + PEEK;
    if (left < rail.scrollLeft) {
      rail.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
    } else if (right > rail.scrollLeft + rail.clientWidth) {
      rail.scrollTo({ left: right - rail.clientWidth, behavior: "smooth" });
    }
  }, [active]);

  if (sections.length === 0) return null;

  return (
    <div className="shk-menu__rail" ref={wrapRef}>
      <CategoryTabs
        aria-label={t("menu.categories")}
        active={active}
        onChange={onPick}
        categories={sections.map((s) => ({
          // The tab id IS the section's DOM id, so a pill, the spy and the
          // anchor it scrolls to can never drift apart.
          id: idFor.get(s.id),
          // §2: NO item counts, here or in a section header. They are volatile
          // (one dish going coming_soon changes them) and a small number
          // undersells a category. `count` is simply not passed.
          label: s.allSoon ? t("menu.railSoon", { name: s.name }) : s.name,
        }))}
      />
    </div>
  );
}
