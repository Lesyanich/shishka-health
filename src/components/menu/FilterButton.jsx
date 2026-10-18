import { FilterIcon } from "../Icons.jsx";
import { t } from "../../i18n/index.js";

/*
  The Filters button — opens the Filters sheet (filters/FilterPanel.jsx).

  Two placements, one component:
    mobile   pinned to the END of the sticky category rail, icon only. It cannot
             live in the 64px header (logo + status + language already fill 375px)
             and it must not scroll away: the menu is ~13 phone screens, and a
             guest who remembers an allergy on screen eight should not have to
             climb back to the top to act on it.
    desktop  in the header, with its label — there is room, and a word beats an
             icon for a control this important.

  The count badge is part of the accessible name ("Filters, 2 active"), not just
  a coloured dot: how many filters are on is exactly the kind of state that must
  not be colour-only.
*/
export function FilterButton({ count = 0, onOpen, labelled = false, className = "" }) {
  const name = count > 0 ? t("filter.buttonActive", { n: count }) : t("filter.button");
  return (
    <button
      type="button"
      className={`shk-menu__filter${count > 0 ? " is-on" : ""}${labelled ? " shk-menu__filter--labelled" : ""} ${className}`.trim()}
      aria-label={name}
      aria-haspopup="dialog"
      onClick={onOpen}
    >
      <FilterIcon size={20} />
      {labelled && <span className="shk-menu__filter-text">{t("filter.button")}</span>}
      {count > 0 && (
        <span className="shk-menu__filter-badge num" aria-hidden="true">{count}</span>
      )}
    </button>
  );
}
