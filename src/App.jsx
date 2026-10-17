import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMenu } from "./hooks/useMenu.js";
import { useWide } from "./hooks/useWide.js";
import { MenuPage } from "./components/menu/MenuPage.jsx";
import { DishDialog } from "./components/menu/DishDialog.jsx";
import { FilterPanel } from "./components/filters/FilterPanel.jsx";
import { FruitFall } from "./components/menu/FruitFall.jsx";
import { SliceScore } from "./components/menu/SliceScore.jsx";
import { FruitSymbols } from "./lib/fruitArt.jsx";
import { assignDishSlugs } from "./lib/menuSections.js";
import { buildFilterOptions, dishPasses } from "./lib/dishFilters.js";
import { useCart } from "./state/cart.jsx";

/*
  The app shell.

  Everything that used to live here — the section tints, the gutter art, the
  orbit ring, the showcase and split layouts, the taco bundle wiring, the
  page-wide filter panel — was the pre-redesign page. The menu is now one
  scrolling page with a sticky nav (SPEC.md §3, §4), built in
  components/menu/MenuPage.jsx; what is left in this file is the three things
  only the shell can own: the data, the order, and the dish sheet's URL.

  `Hero` is gone (§1): the slogan and the salad-bar photograph are what put the
  first dish photo 910 px down a 375 px screen.
*/

export default function App() {
  const { data, loading, error } = useMenu();
  const cart = useCart();
  const wide = useWide();

  const [selected, setSelected] = useState(null);

  // The page-wide diet / allergen sheet. Separate from the per-section quick
  // filters (lib/quickFilters.js): those only make claims the data can fully
  // support; this one EXCLUDES, which is why the sheet carries a note.
  const [filterOpen, setFilterOpen] = useState(false);
  const [diets, setDiets] = useState([]);
  const [excluded, setExcluded] = useState([]);

  const dishes = data?.dishes ?? [];
  // Slugs and the `?dish=` lookup deliberately use the UNFILTERED list: a shared
  // link to a dish must keep opening it whatever the recipient's filters are.
  const slugs = useMemo(() => assignDishSlugs(dishes), [dishes]);

  // Options come from what the menu's own dishes carry, never a fixed list.
  const { dietOptions, allergenOptions } = useMemo(() => buildFilterOptions(dishes), [dishes]);
  const filtered = useMemo(
    () => dishes.filter((d) => dishPasses(d, diets, excluded)),
    [dishes, diets, excluded],
  );
  const pageData = useMemo(() => (data ? { ...data, dishes: filtered } : data), [data, filtered]);

  const toggle = (list, set, id) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const clearFilters = () => {
    setDiets([]);
    setExcluded([]);
  };
  const bySlug = useMemo(() => {
    const m = new Map();
    for (const d of dishes) m.set(slugs.get(d.id), d);
    return m;
  }, [dishes, slugs]);

  /*
    `?dish=<slug>` (§3, dish sheet point 2). The sheet is a page state a guest
    can share and, just as importantly, can leave with the Back button — on a
    phone that is the gesture people actually use to dismiss a sheet, and a
    dialog that swallows it feels like a trap.

    `pushedRef` records whether WE put the entry on the history stack. Closing
    then unwinds it with history.back(), so Back does not reopen the sheet the
    guest just closed. A sheet opened by a LINK (?dish=… typed, shared, or
    restored by the browser) was never pushed by us, so it closes by rewriting
    the URL instead — history.back() there would leave the site.
  */
  const pushedRef = useRef(false);

  const urlFor = useCallback((slug) => {
    const u = new URL(window.location.href);
    if (slug) u.searchParams.set("dish", slug);
    else u.searchParams.delete("dish");
    return `${u.pathname}${u.search}${u.hash}`;
  }, []);

  const openDish = useCallback(
    (dish) => {
      setSelected(dish);
      const slug = slugs.get(dish.id);
      if (!slug) return;
      history.pushState({ shkDish: slug }, "", urlFor(slug));
      pushedRef.current = true;
    },
    [slugs, urlFor],
  );

  const closeDish = useCallback(() => {
    setSelected(null);
    if (pushedRef.current) {
      pushedRef.current = false;
      history.back();
    } else if (new URL(window.location.href).searchParams.has("dish")) {
      history.replaceState(null, "", urlFor(null));
    }
  }, [urlFor]);

  // Back / forward: the URL is the truth, so read the dish out of it rather
  // than tracking what the sheet was doing.
  useEffect(() => {
    const onPop = () => {
      const want = new URL(window.location.href).searchParams.get("dish");
      pushedRef.current = false;
      setSelected(want ? (bySlug.get(want) ?? null) : null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [bySlug]);

  /*
    A `?dish=` link arriving cold, once the menu has loaded.

    On desktop there is no dish dialog at all (§4.5) — the full card already
    shows the description, the macros, the weight and the allergens inline — so
    the parameter is dropped rather than honoured by a sheet that exists nowhere
    else on that breakpoint.
  */
  const [landed, setLanded] = useState(false);
  useEffect(() => {
    if (landed || dishes.length === 0) return;
    setLanded(true);
    const want = new URL(window.location.href).searchParams.get("dish");
    if (!want) return;
    const dish = !wide && bySlug.get(want);
    if (dish) setSelected(dish);
    else history.replaceState(null, "", urlFor(null));
  }, [dishes.length, bySlug, wide, landed, urlFor]);

  // Leaving the breakpoint where the sheet exists must not leave it open.
  useEffect(() => {
    if (wide && selected) closeDish();
  }, [wide, selected, closeDish]);

  /*
    Quick-add straight from the card. A dish that REQUIRES a choice (a modifier
    group with minSelect > 0) has no single price to add, so it opens instead —
    and on desktop, where nothing opens, it is simply not addable from the card.
  */
  const quickAdd = (dish) => {
    if (!dish || dish.comingSoon || dish.price == null) return;
    if (dish.modifierGroups?.some((g) => (g.minSelect ?? 0) > 0)) {
      if (!wide) openDish(dish);
      return;
    }
    cart.addDish(dish);
  };

  const handleShare = (dish) => {
    if (navigator.share) {
      navigator.share({ title: dish.name, text: dish.description, url: window.location.href });
    }
  };

  return (
    <>
      {/* Outside the page on purpose: the symbol sheet is the one copy of every
          fruit drawing, and the falling layer is position:fixed. */}
      <FruitSymbols />
      <FruitFall />
      <SliceScore />

      <MenuPage
        data={pageData}
        loading={loading}
        error={error}
        addedIds={cart.addedIds}
        onOpenDish={openDish}
        onQuickAdd={quickAdd}
        filter={{
          count: diets.length + excluded.length,
          onOpen: () => setFilterOpen(true),
          onClear: clearFilters,
          shown: filtered.length,
          total: dishes.length,
        }}
      />

      <FilterPanel
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        dietOptions={dietOptions}
        allergenOptions={allergenOptions}
        selectedDiets={diets}
        excludedAllergens={excluded}
        onToggleDiet={(id) => toggle(diets, setDiets, id)}
        onToggleAllergen={(id) => toggle(excluded, setExcluded, id)}
        onClear={clearFilters}
        onApply={() => setFilterOpen(false)}
        resultCount={filtered.length}
      />

      <DishDialog
        open={!!selected}
        sheet
        dish={selected}
        onClose={closeDish}
        onShare={selected ? () => handleShare(selected) : undefined}
        onAdd={
          selected && !selected.comingSoon && selected.price != null
            ? (build, qty = 1) => {
                if (selected.modifierGroups?.length && build) {
                  cart.addConfiguredDish(selected, build, qty);
                } else {
                  cart.addDish(selected, qty);
                }
                closeDish();
              }
            : undefined
        }
      />
    </>
  );
}
