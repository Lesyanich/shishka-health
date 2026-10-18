import { useRef } from "react";
import { Button } from "../primitives/Button.jsx";
import { useModal } from "../../hooks/useModal.js";
import { QuickFilterChips } from "./QuickFilterChips.jsx";
import { activeCount } from "../../lib/quickFilters.js";
import { FilterChip } from "./FilterChip.jsx";
import { XIcon, CheckIcon } from "../Icons.jsx";
import { t } from "../../i18n/index.js";

export function FilterPanel({
  open,
  onClose,
  dietOptions = [],
  allergenOptions = [],
  selectedDiets = [],
  excludedAllergens = [],
  onToggleDiet,
  onToggleAllergen,
  quickActive = [],
  onToggleQuick,
  onClear,
  onApply,
  resultCount,
}) {
  // Before the early return: hooks cannot be conditional. This panel used to be
  // a bare overlay — no Escape, no focus trap, no focus restore, no scroll lock —
  // which is MASTER's whole modal contract missing. See hooks/useModal.js.
  const dialogRef = useRef(null);
  useModal(open, dialogRef, onClose);

  if (!open) return null;

  const has = (arr, v) => arr.includes(v);
  // Quick filters count too: "Clear (3)" that ignores the chips at the top of
  // the same sheet would leave filters on while saying it had cleared them.
  const count = selectedDiets.length + excludedAllergens.length + activeCount(quickActive);

  return (
    <div className="shk-fp__scrim" onClick={onClose}>
      <div
        className="shk-fp"
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t("filter.aria")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shk-fp__grab" />
        <div className="shk-fp__head">
          <span className="shk-fp__title">{t("filter.title")}</span>
          <button
            className="shk-iconbtn"
            aria-label={t("filter.close")}
            onClick={onClose}
            style={{ background: "var(--surface-3)", border: "none" }}
          >
            <XIcon />
          </button>
        </div>

        <div className="shk-fp__body">
          {/* The same chips as the row under the page title, so a guest ten
              thousand pixels down can change them without climbing back up. */}
          {onToggleQuick && (
            <div className="shk-fp__section">
              <div className="shk-fp__legend">{t("filter.quick")}</div>
              <QuickFilterChips
                className="shk-fp__chips"
                active={quickActive}
                onToggle={onToggleQuick}
              />
            </div>
          )}

          {/* No dietary tag exists on the live menu today (all 121 tag links are
              allergens), so this section used to render a heading with nothing
              under it. It appears by itself the day the menu is tagged. */}
          {dietOptions.length > 0 && (
          <div className="shk-fp__section">
            <div className="shk-fp__legend">{t("filter.suitableFor")}</div>
            <div className="shk-fp__chips">
              {dietOptions.map((d) => (
                <FilterChip
                  key={d.id}
                  icon={d.icon}
                  active={has(selectedDiets, d.id)}
                  onClick={() => onToggleDiet?.(d.id)}
                >
                  {d.label}
                </FilterChip>
              ))}
            </div>
          </div>
          )}

          <div className="shk-fp__section">
            <div className="shk-fp__legend">{t("filter.exclude")}</div>
            <div className="shk-fp__chips">
              {allergenOptions.map((a) => (
                <FilterChip
                  key={a.id}
                  exclude
                  icon={a.icon}
                  active={has(excludedAllergens, a.id)}
                  onClick={() => onToggleAllergen?.(a.id)}
                >
                  {a.label}
                </FilterChip>
              ))}
            </div>
            {/* The honest half of an exclusion filter. Hiding every dish tagged
                "Dairy" implies the rest are dairy-free, and 24 of 81 dishes carry
                no allergen tag at all — "nobody has looked" reads the same as
                "nothing in it". Said here, next to the control, not buried in a
                footer. See lib/dishFilters.js. */}
            {allergenOptions.length > 0 && (
              <p className="shk-fp__note">{t("filter.allergenNote")}</p>
            )}
          </div>
        </div>

        <div className="shk-fp__foot">
          <Button variant="secondary" onClick={onClear} disabled={count === 0}>
            {t("filter.clear")}{count ? ` (${count})` : ""}
          </Button>
          <Button variant="primary" icon={<CheckIcon size={18} />} onClick={onApply}>
            {resultCount != null ? t("filter.show", { n: resultCount }) : t("filter.apply")}
          </Button>
        </div>
      </div>
    </div>
  );
}
