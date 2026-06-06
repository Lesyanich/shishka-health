import { useState, useRef, useEffect, useMemo } from "react";
import { useMenu } from "./hooks/useMenu.js";
import { MenuHeader } from "./components/menu/MenuHeader.jsx";
import { CategoryTabs } from "./components/filters/CategoryTabs.jsx";
import { DishCard } from "./components/menu/DishCard.jsx";
import { DishDialog } from "./components/menu/DishDialog.jsx";
import { FilterPanel } from "./components/filters/FilterPanel.jsx";
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
    .map((c) => ({ ...c, items: filtered.filter((d) => d.category_id === c.id) }))
    .filter((c) => c.items.length > 0);

  useEffect(() => {
    if (!active && byCat.length > 0) setActive(byCat[0].id);
  }, [byCat.length]);

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

      <CategoryTabs
        categories={byCat.map((c) => ({ id: c.id, label: c.label, count: c.items.length }))}
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

        {byCat.map((cat) => (
          <section
            key={cat.id}
            ref={(el) => (sectionRefs.current[cat.id] = el)}
            className="shk-app__section"
          >
            <div className="shk-app__sec-head">
              <h2 className="shk-app__sec-title">{cat.label}</h2>
              <span className="shk-app__sec-count num">{cat.items.length}</span>
            </div>
            <div className="shk-app__grid">
              {cat.items.map((dish) => (
                <DishCard
                  key={dish.id}
                  name={dish.name}
                  description={dish.description}
                  price={dish.price}
                  image={dish.image_url}
                  kcal={dish.calories}
                  protein={dish.protein}
                  carbs={dish.carbs}
                  fat={dish.fat}
                  diets={dish.diets ?? []}
                  badges={dish.badges ?? []}
                  category={cat.label}
                  onClick={() => setSelected(dish)}
                />
              ))}
            </div>
          </section>
        ))}

        {!loading && (
          <footer className="shk-app__foot">
            Nutrition &amp; prices update live · Shishka Healthy Kitchen · Phuket
          </footer>
        )}
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
      />
    </div>
  );
}
