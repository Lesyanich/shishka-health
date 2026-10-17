import { LangSwitch } from "./LangSwitch.jsx";
import { FilterButton } from "./FilterButton.jsx";
import { openStatus } from "../../lib/hours.js";
import { VENUE } from "../../lib/venue.js";
import { t } from "../../i18n/index.js";

/*
  The menu page's header (SPEC.md §3.1 and §4.1) — 64 px on a phone, 84 px on a
  desktop, and NOT sticky in either. The sticky thing on this page is the
  category rail: two stacked sticky bars would eat a quarter of a phone screen,
  and the logo is not what a guest needs pinned while they read 81 dishes.

  It replaces the old header + `Hero` pair. The old one centred a 96 px logo
  with the language switcher on one side and a filter button on the other, then
  handed the top of the page to a salad-bar photograph — which is why the first
  dish sat 910 px down. Logo left, status and language right, done.

  Everything below the header is the menu.
*/
export function MenuTopbar({ wide = false, hoursTime, visitHref = "#visit", filterCount = 0, onOpenFilters }) {
  const status = openStatus(hoursTime);

  return (
    <header className={`shk-menu__bar${wide ? " shk-menu__bar--wide" : ""}`}>
      <a className="shk-menu__logo" href={visitHref.startsWith("#") ? "#top" : "/"} aria-label="Shishka Healthy Kitchen">
        <img src="/assets/logo-full-color.png" alt="Shishka Healthy Kitchen" />
      </a>

      <div className="shk-menu__bar-right">
        {/* Hours are content (site_content.cta.hoursTime); an unparseable or
            missing range renders NO status rather than an invented one. */}
        {status && (
          <a className="shk-menu__status" href={visitHref}>
            <span
              className={`shk-menu__dot${status.open ? "" : " is-closed"}`}
              aria-hidden="true"
            />
            {status.open
              ? wide
                ? t("status.openNow")
                : t("status.openTill")
              : t("status.closed")}{" "}
            <span className="num">
              {status.open
                ? wide
                  ? `${status.hours.open.label}\u2013${status.hours.close.label}`
                  : status.hours.close.label
                : status.hours.open.label}
            </span>
          </a>
        )}

        {wide && (
          <a
            className="shk-menu__where"
            href={VENUE.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {VENUE.locality}
          </a>
        )}

        {/* Desktop only. On a phone the button rides on the sticky rail instead
            (CategoryRail) — see FilterButton.jsx for why. */}
        {wide && onOpenFilters && (
          <FilterButton labelled count={filterCount} onOpen={onOpenFilters} />
        )}

        <LangSwitch />
      </div>
    </header>
  );
}
