import { IconButton } from "../primitives/IconButton.jsx";
import { FilterIcon } from "../Icons.jsx";

export function MenuHeader({ filterCount = 0, onOpenFilters, wide = false }) {
  return (
    <header className={`shk-header ${wide ? "shk-header--wide" : "shk-header--mobile"}`}>
      <img
        src="/assets/logo-full-white.png"
        alt="Shishka Healthy Kitchen"
        style={{ height: wide ? 96 : 80, width: "auto", display: "block", marginTop: wide ? 10 : 12 }}
      />
      <div className="shk-header__filter">
        <div className="shk-header__filter-wrap">
          <IconButton label="Filter menu" variant="plain" onClick={onOpenFilters}>
            <FilterIcon />
          </IconButton>
          {filterCount > 0 && (
            <span className="shk-header__badge">{filterCount}</span>
          )}
        </div>
      </div>
    </header>
  );
}
