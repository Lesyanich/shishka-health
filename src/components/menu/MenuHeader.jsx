import { IconButton } from "../primitives/IconButton.jsx";
import { FilterIcon } from "../Icons.jsx";

export function MenuHeader({ filterCount = 0, onOpenFilters, wide = false }) {
  return (
    <header className={`shk-header ${wide ? "shk-header--wide" : "shk-header--mobile"}`}>
      <img
        src="/assets/logo-full-white.png"
        alt="Shishka Healthy Kitchen"
        style={{ height: wide ? 80 : 66, width: "auto", display: "block" }}
      />
      <div className="shk-header__filter">
        <div className="shk-header__filter-wrap">
          <IconButton label="Filter menu" variant="solid" onClick={onOpenFilters}>
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
