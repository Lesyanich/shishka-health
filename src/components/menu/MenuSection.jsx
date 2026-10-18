import { useMemo, useState } from "react";
import { CategoryTabs } from "../filters/CategoryTabs.jsx";
import { FilterChip } from "../filters/FilterChip.jsx";
import { DishCard } from "./DishCard.jsx";
import { subcategoriesOf, hasSubcategories } from "../../lib/menuSections.js";
import { minPrice, isHighProtein } from "../../lib/dishFacts.js";
import { QUICK_FILTERS, applyQuickFilters } from "../../lib/quickFilters.js";
import { t } from "../../i18n/index.js";

const ALL = "all";

/*
  One section of the menu (SPEC.md §3.6 mobile, §4.4 desktop).

  Title, "from ฿…", subcategory tabs, the quick filters, then a grid of
  `grid-compact` / `grid-full` cards or a list of `list-row`s — which one is
  decided from the data in lib/menuSections.js, not from a list of names here.

  NO item count anywhere (§2): not after the title, not in the rail. They are
  volatile and a small number undersells a category. "from ฿…" stays, because a
  price is a real decision input.

  Filters are per section (§3.7). A guest filtering the salads to under 400 kcal
  has said something about salads, not about the chocolate eight screens down —
  and a page-wide filter on a thirteen-screen page silently changes sections the
  guest cannot see.
*/
export function MenuSection({ section, domId, wide, addedIds, onOpen, onQuickAdd }) {
  const [sub, setSub] = useState(ALL);
  const [filters, setFilters] = useState([]);

  const subs = useMemo(() => subcategoriesOf(section.items, section.id), [section.items, section.id]);
  const tabbed = hasSubcategories(subs, section.id) && subs.length >= 2;

  // Tabs narrow first, then the chips: "Cold coffee under 400 kcal".
  const inSub = tabbed && sub !== ALL ? (subs.find((s) => s.id === sub)?.items ?? []) : section.items;
  const shown = applyQuickFilters(inSub, filters);

  const from = minPrice(section.items);
  const panelId = `panel-${domId}`;
  const variant = section.layout === "list" ? "list-row" : wide ? "grid-full" : "grid-compact";

  const toggle = (id) =>
    setFilters((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  return (
    /*
      `id` is what the rail, the left nav and a shared `#wraps` link all scroll
      to, and `scroll-margin-top` in the CSS keeps the title clear of the sticky
      rail. The section is also what the scroll-spy observes — see
      hooks/useScrollSpy.js for why it is the section and not the heading.
    */
    <section className="shk-menu__sec" id={domId} aria-labelledby={`${domId}-title`}>
      <div className="shk-menu__sec-head">
        <h2 className="shk-menu__sec-title" id={`${domId}-title`}>{section.name}</h2>
        {/* A section whose every dish is coming soon has no price a guest can
            pay, so it says so instead of quoting one (§2). */}
        <p className="shk-menu__from">
          {from == null ? t("menu.comingSoonSection") : t("menu.from", { price: `฿${from}` })}
        </p>
      </div>

      {(tabbed || QUICK_FILTERS.length > 0) && (
        <div className="shk-menu__controls">
          {tabbed && (
            <CategoryTabs
              variant="segmented"
              className="shk-menu__subtabs"
              aria-label={t("menu.subcategories", { name: section.name })}
              active={sub}
              onChange={setSub}
              categories={[
                { id: ALL, label: t("menu.allSub"), panelId },
                ...subs.map((s) => ({ id: s.id, label: s.name, panelId })),
              ]}
            />
          )}

          {/* Two chips, not the three §3 asked for. Plant-based would match zero
              dishes and Seafood would promise an allergen guarantee the data
              cannot support — lib/quickFilters.js carries the evidence. */}
          <div className="shk-menu__chips">
            {QUICK_FILTERS.map((f) => (
              <FilterChip
                key={f.id}
                className="shk-menu__chip"
                active={filters.includes(f.id)}
                onClick={() => toggle(f.id)}
              >
                {t(f.labelKey)}
              </FilterChip>
            ))}
          </div>
        </div>
      )}

      <div
        className={section.layout === "list" ? "shk-menu__list" : "shk-menu__grid"}
        {...(tabbed
          ? { role: "tabpanel", id: panelId, "aria-labelledby": `tab-${sub}` }
          : {})}
      >
        {shown.map((dish) => (
          <DishCard
            key={dish.id}
            variant={variant}
            data-code={dish.product_code}
            name={dish.name}
            description={dish.description}
            price={dish.priceDefault ?? dish.price}
            image={dish.cardImage}
            kcal={dish.calories}
            protein={dish.protein ?? 0}
            carbs={dish.carbs ?? 0}
            fat={dish.fat ?? 0}
            weight={dish.portion_size}
            weightUnit={dish.portion_unit}
            highProtein={isHighProtein(dish.protein)}
            category={section.name}
            comingSoon={dish.stockState === "coming_soon"}
            soldOut={dish.stockState === "out_of_stock"}
            added={addedIds.has(dish.id)}
            onClick={onOpen ? () => onOpen(dish) : undefined}
            onQuickAdd={() => onQuickAdd(dish)}
          />
        ))}
      </div>

      {shown.length === 0 && (
        <div className="shk-menu__empty">
          <p>{t("filter.noneHere")}</p>
          <button type="button" className="shk-app__clear" onClick={() => setFilters([])}>
            {t("menu.clearFilters")}
          </button>
        </div>
      )}
    </section>
  );
}
