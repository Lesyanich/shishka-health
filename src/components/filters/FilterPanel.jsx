import { Button } from "../primitives/Button.jsx";
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
  onClear,
  onApply,
  resultCount,
}) {
  if (!open) return null;

  const has = (arr, v) => arr.includes(v);
  const count = selectedDiets.length + excludedAllergens.length;

  return (
    <div className="shk-fp__scrim" onClick={onClose}>
      <div
        className="shk-fp"
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
