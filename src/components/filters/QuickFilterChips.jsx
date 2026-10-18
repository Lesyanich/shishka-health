import { useEffect, useRef } from "react";
import { FilterChip } from "./FilterChip.jsx";
import { QUICK_FILTERS } from "../../lib/quickFilters.js";
import { t } from "../../i18n/index.js";

/*
  The quick filters, once for the whole menu (lib/quickFilters.js). Single-select:
  `active` is one filter id or null, and tapping the active chip clears it.

  Rendered in TWO places from this one component, on purpose: as a row under the
  page title, and at the top of the Filters sheet — so a guest ten thousand
  pixels down the page can change them without climbing back up. Both read and
  write the same state in App, so they can never disagree.

  `className` styles the chip row itself: the page passes `shk-menu__chips` (a
  horizontally scrolling row on a phone, a wrapping row on desktop), the sheet
  passes `shk-fp__chips`.

  The note under the row appears only while the seafood chip is on. That chip is
  a POSITIVE filter — "dishes listed with fish or shellfish" — and it must never
  read as "seafood-free": 40 of 81 dishes have unreviewed ingredient data and 24
  carry no allergen tag at all, so a dish missing from this list may still
  contain seafood. The note is the honest half of the control and sits next to
  it, not in a footer.
*/
export function QuickFilterChips({ active = null, onToggle, className = "shk-menu__chips" }) {
  const rowRef = useRef(null);

  /*
    On a phone the row scrolls sideways and only three chips fit, so a chip
    switched on from the Filters sheet can sit off-screen to the right — leaving
    a badge as the only sign anything is on. Slide the row so the active chip is
    visible.

    Horizontal only, and by `scrollBy` on the row itself: `scrollIntoView` would
    also scroll the PAGE to bring the row into view, and this effect runs while
    the sheet is open over a page the guest is deep in. Measured from bounding
    rects so it holds in a right-to-left layout too, where `scrollLeft` is
    negative. A no-op wherever the row wraps (desktop, the sheet).
  */
  const key = active ?? "";
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const chip = row.querySelector('[aria-pressed="true"]');
    if (!chip) return;
    const r = row.getBoundingClientRect();
    const c = chip.getBoundingClientRect();
    if (c.right > r.right) row.scrollBy({ left: c.right - r.right + 16 });
    else if (c.left < r.left) row.scrollBy({ left: c.left - r.left - 16 });
  }, [key]);

  return (
    <div className="shk-menu__chipgroup">
      <div ref={rowRef} className={className} role="group" aria-label={t("filter.quick")}>
        {QUICK_FILTERS.map((f) => (
          <FilterChip
            key={f.id}
            className="shk-menu__chip"
            active={active === f.id}
            onClick={() => onToggle(f.id)}
          >
            {t(f.labelKey)}
          </FilterChip>
        ))}
      </div>
      {active === "seafood" && (
        <p className="shk-menu__chipnote" role="note">{t("filter.seafoodNote")}</p>
      )}
    </div>
  );
}
