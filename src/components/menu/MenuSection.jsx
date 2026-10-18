import { useMemo, useState } from "react";
import { CategoryTabs } from "../filters/CategoryTabs.jsx";
import { DishCard } from "./DishCard.jsx";
import { subcategoriesOf, hasSubcategories } from "../../lib/menuSections.js";
import { minPrice, isHighProtein, cardPrice } from "../../lib/dishFacts.js";
import { ChevronDownIcon } from "../Icons.jsx";
import { t } from "../../i18n/index.js";

const ALL = "all";

/*
  One section of the menu (SPEC.md §3.6 mobile, §4.4 desktop).

  Title, "from ฿…", subcategory tabs, then a grid of `grid-compact` / `grid-full`
  cards or a list of `list-row`s — which one is decided from the data in
  lib/menuSections.js, not from a list of names here.

  NO item count anywhere (§2): not after the title, not in the rail. They are
  volatile and a small number undersells a category. "from ฿…" stays, because a
  price is a real decision input.

  The quick filters are NOT here. They used to repeat under every one of ten
  sections; they are now one row for the whole menu (components/filters/
  QuickFilterChips) and arrive here already applied: `section.items` is what
  survived, and `section.collapsed` says this is a DRINK section that a nutrition
  filter does not apply to.

  A collapsed section is a real disclosure — a <button aria-expanded> that owns
  the body — not a hidden one. The alternative, dropping drinks from the page
  while a calorie filter is on, is a silent gap: the guest would not know there
  were drinks they could not see, or why.
*/
export function MenuSection({ section, domId, wide, addedIds, onOpen, onQuickAdd }) {
  const [selectedSub, setSub] = useState(ALL);
  const [open, setOpen] = useState(false);

  // Built from the items that SURVIVED the filters, so a subcategory with no
  // matches has no tab, and a section left with one subcategory has none at all.
  const subs = useMemo(() => subcategoriesOf(section.items, section.id), [section.items, section.id]);
  const tabbed = hasSubcategories(subs, section.id) && subs.length >= 2;

  // A filter can remove the very subcategory the guest had selected ("Cold
  // coffee" with nothing cold left). Fall back to All rather than show an empty
  // grid under a tab that no longer exists.
  const sub = subs.some((s) => s.id === selectedSub) ? selectedSub : ALL;
  const shown = tabbed && sub !== ALL ? (subs.find((s) => s.id === sub)?.items ?? []) : section.items;

  const from = minPrice(section.items);
  const panelId = `panel-${domId}`;
  const bodyId = `body-${domId}`;
  const variant = section.layout === "list" ? "list-row" : wide ? "grid-full" : "grid-compact";
  const closed = section.collapsed && !open;

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

      {section.collapsed && (
        <button
          type="button"
          className={`shk-menu__collapse${open ? " is-open" : ""}`}
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen((v) => !v)}
        >
          {/* In words, because a colour or an icon cannot say WHY the drinks are
              folded away. The filters that do apply to drinks (price, seafood)
              are not nutrition filters and never collapse a section. */}
          <span className="shk-menu__collapse-text">{t("filter.drinksNote")}</span>
          <span className="shk-menu__collapse-action">
            {open ? t("filter.drinksHide") : t("filter.drinksShow")}
            {!open && <> <span className="num">{section.items.length}</span></>}
            <ChevronDownIcon size={18} />
          </span>
        </button>
      )}

      {/* `hidden`, not unmounted: the photos below are lazy, and a display:none
          subtree never fetches them — so a folded drinks section costs nothing
          until it is opened. */}
      <div id={bodyId} hidden={closed}>
        {tabbed && (
          <div className="shk-menu__controls">
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
              price={cardPrice(dish)}
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
      </div>
    </section>
  );
}
