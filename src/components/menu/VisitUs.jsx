import { MapPinIcon, ClockIcon } from "../Icons.jsx";
import { VENUE } from "../../lib/venue.js";
import { parseHours, weekdayName, dateForWeekday } from "../../lib/hours.js";
import { t, LANG } from "../../i18n/index.js";

/*
  "Visit us" (SPEC.md §3.8 / §4.6) — hours, address, directions, Instagram.

  The end of the mobile page and the foot of the desktop right column are the
  same block. It is also what the header's status links to, which is why it
  carries `id="visit"`.

  Hours come from `site_content.cta` like the rest of the copy; the address and
  the map link are facts, not copy (lib/venue.js).
*/
export function VisitUs({ cta, wide = false }) {
  const hours = parseHours(cta?.hoursTime);
  const instagram = cta?.instagramUrl || VENUE.instagram;

  return (
    <section
      className={`shk-menu__visit${wide ? " shk-menu__visit--wide" : ""}`}
      id="visit"
      aria-labelledby="visit-title"
    >
      <h2 className="shk-menu__visit-title" id="visit-title">{t("visit.title")}</h2>

      {hours && (
        <p className="shk-menu__visit-row">
          <ClockIcon size={18} />
          <span>
            {t("visit.hours")}{" "}
            <span className="num">{hours.open.label}&ndash;{hours.close.label}</span>
            {VENUE.closedDays.length > 0 && (
              <>
                {" · "}
                {t("visit.closedOn", {
                  day: VENUE.closedDays
                    .map((d) => weekdayName(dateForWeekday(d), LANG))
                    .join(", "),
                })}
              </>
            )}
          </span>
        </p>
      )}

      <p className="shk-menu__visit-row">
        <MapPinIcon size={18} />
        {/* The street line is the same string in every language — it is what a
            driver types into a map — so it is isolated LTR under /ar. */}
        <span className="shk-menu__visit-addr">
          {VENUE.street}
          <br />
          {VENUE.locality}
        </span>
      </p>

      <div className="shk-menu__visit-acts">
        <a
          className="shk-menu__visit-btn"
          href={VENUE.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("visit.directions")}
        </a>
        <a
          className="shk-menu__visit-link"
          href={instagram}
          target="_blank"
          rel="noopener noreferrer"
        >
          Instagram
        </a>
      </div>
    </section>
  );
}
