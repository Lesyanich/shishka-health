import { IconButton } from "../primitives/IconButton.jsx";
import { FilterIcon } from "../Icons.jsx";
import { LangSwitch } from "./LangSwitch.jsx";
import { t } from "../../i18n/index.js";

export function MenuHeader({ filterCount = 0, onOpenFilters, wide = false }) {
  return (
    <header className={`shk-header ${wide ? "shk-header--wide" : "shk-header--mobile"}`}>
      <div className="shk-header__lang">
        <LangSwitch />
      </div>
      <img
        src="/assets/logo-full-color.png"
        alt="Shishka Healthy Kitchen"
        style={{ height: wide ? 116 : 96, width: "auto", display: "block", marginTop: wide ? 26 : 22 }}
      />
      <div className="shk-header__filter">
        <div className="shk-header__filter-wrap">
          <IconButton label={t("header.filter")} variant="plain" onClick={onOpenFilters}>
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
