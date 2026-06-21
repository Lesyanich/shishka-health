import { useState, useRef, useEffect, useMemo, Fragment } from "react";
import { useMenu } from "./hooks/useMenu.js";
import { useReveal } from "./hooks/useReveal.js";
import { MenuHeader } from "./components/menu/MenuHeader.jsx";
import { CategoryTabs } from "./components/filters/CategoryTabs.jsx";
import { DishCard } from "./components/menu/DishCard.jsx";
import { DishRows } from "./components/menu/DishRows.jsx";
import { Hero } from "./components/menu/Hero.jsx";
import { ManakishTiers } from "./components/menu/ManakishTiers.jsx";
import { ManakishSets } from "./components/menu/ManakishSets.jsx";
import { BrandRule } from "./components/menu/BrandRule.jsx";
import { MenuCTA } from "./components/menu/MenuCTA.jsx";
import { SiteFooter } from "./components/menu/SiteFooter.jsx";
import { DEFAULT_CONTENT } from "./lib/content.js";
import { DishDialog } from "./components/menu/DishDialog.jsx";
import { FilterPanel } from "./components/filters/FilterPanel.jsx";
import { BundleDialog } from "./components/menu/BundleDialog.jsx";
import { Cart } from "./components/cart/Cart.jsx";
import { useCart } from "./state/cart.jsx";
import { manakishPool as getManakishPool, saucePool as getSaucePool, bundleFloor } from "./lib/bundles.js";
import {
  SproutIcon, LeafIcon, WheatIcon, MilkIcon, NutIcon,
  EggIcon, DropletIcon, BeefIcon, HalalIcon,
} from "./components/Icons.jsx";

const DIET_ICONS = {
  vegan:         <SproutIcon />,
  vegetarian:    <LeafIcon />,
  "gluten-free": <WheatIcon />,
  "dairy-free":  <MilkIcon />,
  "high-protein":<DropletIcon />,
  "grass-fed":   <BeefIcon />,
  halal:         <HalalIcon />,
};

const ALLERGEN_ICONS = {
  "contains-gluten": <WheatIcon />,
  "contains-dairy":  <MilkIcon />,
  "contains-nuts":   <NutIcon />,
  "contains-egg":    <EggIcon />,
};

function dishPasses(dish, diets, excl) {
  const d = dish.diets || [];
  const a = dish.allergens || [];
  for (const id of diets) if (!d.includes(id)) return false;
  for (const id of excl) if (a.includes(id)) return false;
  return true;
}

// A section (umbrella, e.g. Manakish / Drinks) groups its dishes into
// subcategories (Classic / Signature / Premium, Coffee / Lemonades / …) coming
// straight from the data (menu_public section/subcategory rollup). Flat sections
// resolve to a single subcategory whose id === the section id → rendered without
// a subheader. Subcategories sort by their own sort_order, dishes keep theirs.
function subcategoriesOf(items, sectionId) {
  const map = new Map();
  for (const d of items) {
    const id = d.subcategory_id ?? sectionId;
    if (!map.has(id)) {
      map.set(id, { id, name: d.subcategory_name ?? "", sort: d.subcategory_sort ?? 0, items: [] });
    }
    map.get(id).items.push(d);
  }
  return Array.from(map.values()).sort((a, b) => a.sort - b.sort);
}
// True when the section is a real umbrella (its dishes carry a subcategory
// distinct from the section itself), vs a flat section (one self-subcategory).
function hasSubcategories(subs, sectionId) {
  return subs.length > 1 || (subs.length === 1 && subs[0].id !== sectionId);
}
function priceHint(items) {
  const prices = items.map((d) => d.price).filter((p) => p != null);
  if (prices.length === 0) return "";
  const min = Math.min(...prices), max = Math.max(...prices);
  return min === max ? `฿${min}` : `฿${min}–${max}`;
}
// A subsection with zero photography renders as classic menu rows instead of
// a grid of placeholder discs (photo coverage is still catching up).
const photoless = (items) => items.every((d) => !d.image_url);

function LoadingSkeleton() {
  return (
    <div className="shk-app__section">
      <div className="shk-app__grid">
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="shk-skeleton" style={{ aspectRatio: "4/3", borderRadius: "var(--radius-lg)" }} />
            <div className="shk-skeleton" style={{ height: 20, width: "70%" }} />
            <div className="shk-skeleton" style={{ height: 14, width: "90%" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const { data, loading } = useMenu();
  const cart = useCart();
  const [activeBundle, setActiveBundle] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [diets, setDiets] = useState([]);
  const [excl, setExcl] = useState([]);
  const [selected, setSelected] = useState(null);
  const [active, setActive] = useState(null);

  const scrollRef = useRef(null);
  const sectionRefs = useRef({});

  // Determine if we're in wide (desktop) mode
  const [wide, setWide] = useState(() => window.innerWidth >= 960);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 960px)");
    const fn = (e) => setWide(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  const categories = data?.categories ?? [];
  const dishes = data?.dishes ?? [];
  const content = data?.content ?? DEFAULT_CONTENT;
  const bundles = data?.bundles ?? [];

  // Bundle pools (manakish + free sauces) + the "from ฿X" floor per size.
  const manaPool = useMemo(() => getManakishPool(dishes), [dishes]);
  const saucePoolList = useMemo(() => getSaucePool(dishes), [dishes]);
  const bundleCards = useMemo(
    () =>
      manaPool.length > 0
        ? bundles.map((b) => ({ ...b, from: bundleFloor(manaPool, b.manakishCount, b.discountPct) }))
        : [],
    [bundles, manaPool],
  );

  // Build unique diet and allergen options from actual tags on dishes
  const dietOptions = useMemo(() => {
    const seen = new Map();
    for (const dish of dishes) {
      for (const tag of dish.tags ?? []) {
        if (tag.tag_group !== "allergen" && !seen.has(tag.slug)) {
          seen.set(tag.slug, { id: tag.slug, label: tag.name, icon: DIET_ICONS[tag.slug] });
        }
      }
    }
    return Array.from(seen.values());
  }, [dishes]);

  const allergenOptions = useMemo(() => {
    const seen = new Map();
    for (const dish of dishes) {
      for (const tag of dish.tags ?? []) {
        if (tag.tag_group === "allergen" && !seen.has(tag.slug)) {
          seen.set(tag.slug, { id: tag.slug, label: tag.name, icon: ALLERGEN_ICONS[tag.slug] });
        }
      }
    }
    return Array.from(seen.values());
  }, [dishes]);

  const filtered = dishes.filter((d) => dishPasses(d, diets, excl));
  const byCat = categories
    .map((c) => ({ ...c, items: filtered.filter((d) => (d.section_id ?? d.category_id) === c.id) }))
    .filter((c) => c.items.length > 0);

  // Index after which the "the RULE" accent block is inserted (1-based in config).
  const ruleAfter = Math.min(
    Math.max((content.rule?.afterCategory ?? 1) - 1, 0),
    Math.max(byCat.length - 1, 0)
  );

  // Quick-add straight to the order from the tile/row, without opening the
  // dish. Items that REQUIRE a choice (a modifier group with minSelect > 0)
  // open the builder instead, since there's no single price to add.
  const quickAdd = (dish) => {
    if (!dish || dish.comingSoon || dish.price == null) return;
    if (dish.modifierGroups?.some((g) => (g.minSelect ?? 0) > 0)) {
      setSelected(dish);
    } else {
      cart.addDish(dish);
    }
  };

  const renderDish = (dish, catName) => (
    <DishCard
      key={dish.id}
      name={dish.name}
      description={dish.description}
      price={dish.priceDefault ?? dish.price}
      priceFrom={dish.priceFrom}
      image={dish.cardImage}
      kcal={dish.calories}
      protein={dish.protein}
      carbs={dish.carbs}
      fat={dish.fat}
      weight={dish.portion_size}
      weightUnit={dish.portion_unit}
      diets={dish.diets ?? []}
      badges={dish.badges ?? []}
      category={catName}
      comingSoon={dish.comingSoon ?? false}
      added={cart.addedIds.has(dish.id)}
      onClick={() => setSelected(dish)}
      onQuickAdd={() => quickAdd(dish)}
    />
  );

  useEffect(() => {
    if (!active && byCat.length > 0) setActive(byCat[0].id);
  }, [byCat.length]);

  // Stagger-reveal menu items as they scroll into view (re-arms when the
  // rendered set changes — data load, filters).
  useReveal([loading, byCat.map((c) => `${c.id}:${c.items.length}`).join()]);

  const toggle = (arr, set, id) =>
    set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const goToCat = (id) => {
    setActive(id);
    const el = sectionRefs.current[id];
    const cont = scrollRef.current;
    if (el && cont) cont.scrollTo({ top: el.offsetTop - 64, behavior: "smooth" });
  };

  useEffect(() => {
    const cont = scrollRef.current;
    if (!cont || byCat.length === 0) return;
    const onScroll = () => {
      const y = cont.scrollTop + 100;
      let cur = byCat[0]?.id;
      for (const c of byCat) {
        const el = sectionRefs.current[c.id];
        if (el && el.offsetTop <= y) cur = c.id;
      }
      if (cur) setActive(cur);
    };
    cont.addEventListener("scroll", onScroll, { passive: true });
    return () => cont.removeEventListener("scroll", onScroll);
  }, [byCat.map((c) => c.id).join()]);

  const handleShare = (dish) => {
    if (navigator.share) {
      navigator.share({ title: dish.name, text: dish.description, url: window.location.href });
    }
  };

  return (
    <div
      ref={scrollRef}
      className={`shk-app ${wide ? "shk-app--wide" : ""}`}
      style={{ height: "100dvh" }}
    >
      <MenuHeader
        filterCount={diets.length + excl.length}
        onOpenFilters={() => setFilterOpen(true)}
        wide={wide}
      />

      <Hero wide={wide} content={content.hero} />

      <CategoryTabs
        categories={byCat.map((c) => ({ id: c.id, label: c.name, count: c.items.length }))}
        active={active}
        onChange={goToCat}
      />

      <main className="shk-app__main">
        {loading && <LoadingSkeleton />}

        {!loading && byCat.length === 0 && (
          <div className="shk-app__empty">
            <p>No dishes match these filters.</p>
            <button
              className="shk-app__clear"
              onClick={() => { setDiets([]); setExcl([]); }}
            >
              Clear filters
            </button>
          </div>
        )}

        {byCat.map((cat, i) => (
          <Fragment key={cat.id}>
            <section
              ref={(el) => (sectionRefs.current[cat.id] = el)}
              className="shk-app__section"
            >
              {cat.name === "Manakish" ? (
                <ManakishTiers section={cat} onSelect={setSelected} />
              ) : (
                <>
                  <div className="shk-app__sec-head">
                    <h2 className="shk-app__sec-title">{cat.name}</h2>
                    <span className="shk-app__sec-count num">{cat.items.length}</span>
                  </div>

                  {content.sectionIntros?.[cat.name] && (
                    <p className="shk-app__sec-intro">
                      {content.sectionIntros[cat.name]}
                    </p>
                  )}

                  {(() => {
                    const subs = subcategoriesOf(cat.items, cat.id);
                    return hasSubcategories(subs, cat.id) ? (
                      subs.map((sub) => (
                        <div key={sub.id} className="shk-app__tier">
                          <div className="shk-app__subhead">
                            <h3 className="shk-app__sub-title">{sub.name}</h3>
                            <span className="shk-app__sub-price num">{priceHint(sub.items)}</span>
                          </div>
                          {photoless(sub.items) ? (
                            <DishRows items={sub.items} onSelect={setSelected} onQuickAdd={quickAdd} addedIds={cart.addedIds} />
                          ) : (
                            <div className="shk-app__grid">
                              {sub.items.map((dish) => renderDish(dish, cat.name))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : photoless(cat.items) ? (
                      <DishRows items={cat.items} onSelect={setSelected} onQuickAdd={quickAdd} addedIds={cart.addedIds} />
                    ) : (
                      <div className="shk-app__grid">
                        {cat.items.map((dish) => renderDish(dish, cat.name))}
                      </div>
                    );
                  })()}
                </>
              )}

              {cat.name === "Manakish" && bundleCards.length > 0 && (
                <ManakishSets
                  bundles={bundleCards}
                  pool={manaPool}
                  sauces={saucePoolList}
                  onSelect={setActiveBundle}
                />
              )}
            </section>

            {/* Brand accent block after the configured category */}
            {i === ruleAfter && <BrandRule wide={wide} content={content.rule} />}
          </Fragment>
        ))}

        {!loading && byCat.length > 0 && <MenuCTA wide={wide} content={content.cta} />}

        {!loading && <SiteFooter wide={wide} instagramUrl={content.cta?.instagramUrl} />}
      </main>

      <FilterPanel
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        dietOptions={dietOptions}
        allergenOptions={allergenOptions}
        selectedDiets={diets}
        excludedAllergens={excl}
        onToggleDiet={(id) => toggle(diets, setDiets, id)}
        onToggleAllergen={(id) => toggle(excl, setExcl, id)}
        onClear={() => { setDiets([]); setExcl([]); }}
        onApply={() => setFilterOpen(false)}
        resultCount={filtered.length}
      />

      <DishDialog
        open={!!selected}
        dish={selected}
        onClose={() => setSelected(null)}
        onShare={selected ? () => handleShare(selected) : undefined}
        onAdd={
          selected && !selected.comingSoon && selected.price != null
            ? (build) => {
                if (selected.modifierGroups?.length && build) {
                  cart.addConfiguredDish(selected, build);
                } else {
                  cart.addDish(selected);
                }
                setSelected(null);
              }
            : undefined
        }
      />

      <BundleDialog
        open={!!activeBundle}
        bundle={activeBundle}
        manakishPool={manaPool}
        saucePool={saucePoolList}
        onClose={() => setActiveBundle(null)}
        onAdd={cart.addBundle}
      />

      <Cart />
    </div>
  );
}
