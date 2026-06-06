import { Button } from "../primitives/Button.jsx";
import { FilterChip } from "./FilterChip.jsx";
import { XIcon, CheckIcon } from "../Icons.jsx";

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
        aria-label="Filter the menu"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shk-fp__grab" />
        <div className="shk-fp__head">
          <span className="shk-fp__title">Filters</span>
          <button
            className="shk-iconbtn"
            aria-label="Close filters"
            onClick={onClose}
            style={{ background: "var(--surface-3)", border: "none" }}
          >
            <XIcon />
          </button>
        </div>

        <div className="shk-fp__body">
          <div className="shk-fp__section">
            <div className="shk-fp__legend">Suitable for</div>
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
            <div className="shk-fp__legend">Exclude allergens</div>
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
            Clear{count ? ` (${count})` : ""}
          </Button>
          <Button variant="primary" icon={<CheckIcon size={18} />} onClick={onApply}>
            {resultCount != null ? `Show ${resultCount}` : "Apply"}
          </Button>
        </div>
      </div>
    </div>
  );
}
