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
import { FruitFall } from "./components/menu/FruitFall.jsx";
import { SliceScore } from "./components/menu/SliceScore.jsx";
import { FruitSymbols } from "./lib/fruitArt.jsx";
import { optimizedSrc } from "./lib/img.js";
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

/*
  Section backgrounds are keyed by name, not alternated by index. Striping every
  other section made the page read as a barcode; two deliberate washes give the
  scroll two resting points instead. Anything not listed here stays white.
  Salads gets the mint band (it's the produce hero of the menu), Coffee gets the
  warm cream, so the drinks half feels like a different room without a second
  green.
*/
const SECTION_TINT = {
  Salads: "shk-app__section--tint",
  Coffee: "shk-app__section--warm",
};

/*
  One oversized dish photograph per listed section, dropped into the empty
  column the centred grid leaves on wide desktops and cropped by the viewport
  edge. Keyed by name and side so the page alternates down the scroll instead
  of leaning to one side.

  Only listed sections get art — the effect works because it is rare. Three or
  four over the whole menu is the ceiling; past that the gutter stops being a
  surprise and starts being wallpaper.

  The file is loaded by CSS (.shk-sec-art, components.css) inside a 1440px
  media query, so phones never fetch it. Assets are transparent 1200px WebP in
  public/assets/section/.
*/
const SECTION_ART = {
  // Salads has no gutter art: it is the ORBIT section, and its big photograph
  // lives in the middle of the ring rather than off in the margin. See
  // SECTION_ORBIT / OrbitHero below.
  //
  // inset: how far the art may reach back inside the content column. The tiers
  // layout stops ~190px short of the right edge, so the big taco can move into
  // that dead space and sit beside the small ones — showing ~70% of itself
  // instead of half. Safe only because nothing is rendered there; see the
  // --art-inset note in components.css before copying this to another section.
  "Potato Tacos": { src: "/assets/section/tacos-lamb.webp", side: "right", inset: 200 },
  // A spring roll is a column (0.26 wide-to-tall), so it gets the whole-and-tall
  // treatment rather than the viewport crop — see --art-w in components.css.
  // Width is gutter + inset, capped, and the height follows from the ratio.
  "Fresh Spring Roll": {
    src: "/assets/section/springroll-shrimp.webp",
    side: "right",
    inset: 200,
    ratio: 0.26,
    align: "top",
    // rise: how far above its own section the roll starts. At the default 140
    // it began in the empty gap between the RULE block and this section, which
    // read as a picture parked beside a heading. Lifted so the top of the roll
    // breaks into the green Salads band above and the whole thing reads as one
    // column running down the page. The RULE block's own gutter is empty, so
    // there is nothing up there to collide with.
    rise: 350,
    width: "min(calc(50vw - var(--content-max) / 2 + 200px), 470px)",
  },
};

/*
  How long one photograph stays up in a rotating section (cfg.pool).

  Bucketed off the wall clock rather than Math.random on purpose: everyone who
  loads the page inside the same window sees the same salad, so the site is
  reproducible in a screenshot and a hard refresh does not reshuffle it. The
  guest gets a different one when they come back later, which is the point.
*/
const ART_ROTATE_MS = 12 * 60 * 1000;

function useRotatingArt(cfg) {
  const pool = cfg?.pool;
  const [bucket, setBucket] = useState(() => Math.floor(Date.now() / ART_ROTATE_MS));
  useEffect(() => {
    if (!pool || pool.length < 2) return;
    // Coarse poll rather than a timeout aligned to the boundary: a tab left open
    // across a boundary catches up within a minute, and a minute-long interval
    // costs nothing. Cheaper to reason about than clock arithmetic.
    const id = setInterval(() => setBucket(Math.floor(Date.now() / ART_ROTATE_MS)), 60_000);
    return () => clearInterval(id);
  }, [pool]);
  if (!cfg) return null;
  if (!pool || pool.length === 0) return cfg.src;
  return pool[bucket % pool.length];
}

function SectionArt({ cfg }) {
  const src = useRotatingArt(cfg);
  if (!cfg) return null;
  return (
    <div
      // align is a vertical anchor, and the value IS the class suffix: "top"
      // (just above the section, for column art) or "under" (below the section
      // title). Absent means centred on the band, which is the default.
      className={`shk-sec-art shk-sec-art--${cfg.side}${
        cfg.align ? ` shk-sec-art--${cfg.align}` : ""
      }`}
      style={{
        "--art": `url(${src})`,
        ...(cfg.inset && { "--art-inset": `${cfg.inset}px` }),
        ...(cfg.ratio && { "--art-ratio": cfg.ratio }),
        ...(cfg.width && { "--art-w": cfg.width }),
        ...(cfg.rise && { "--art-rise": `${cfg.rise}px` }),
      }}
      aria-hidden="true"
    />
  );
}

/*
  Sections that trade density for size: three dishes per row instead of five,
  with the photo scaled up to match (.shk-app__section--showcase). Reserved for
  sections where the photography is strong enough to be seen big.
*/
const SECTION_SHOWCASE = new Set([]);

/*
  Split sections go further: two dishes per row, pushed into the right half of
  the content column, with the left half given over to one oversized rotating
  photograph. It is the most expensive layout on the page — it halves how many
  dishes a guest sees per screen — so it is worth it only where the photograph
  is the selling argument. Pairs with SECTION_ART[name].inset = 600.

  Empty since Salads moved to ORBIT: split put the grid in the right half and
  the art in the left, but the art only covered the top ~900px of an 1800px
  section, so the bottom half of the left column was a void. Kept because the
  mechanism is sound for a SHORT section; do not point it at a long one.
*/
const SECTION_SPLIT = new Set([]);

/*
  Orbit: one oversized photograph in the middle of the section with the dishes
  ringed around it. Unlike split (art in a margin) the art is the centre of the
  composition, so there is no dead column — the empty middle IS the art.

  The centre photograph rotates through the section's own dish photos, so it
  costs no extra assets and any dish that gets shot joins the rotation for free.
  Only worth it for a section with enough photographed dishes to close a ring
  (>= 5); below that the ring reads as a broken circle. Falls back to the plain
  grid below --wide, where there is no room for a ring.
*/
const SECTION_ORBIT = new Set(["Salads"]);

/*
  How long one photograph holds the centre of an orbit section.

  Short enough to be noticed while the guest is reading the ring, long enough
  not to nag. Unlike ART_ROTATE_MS (wall-clock bucketed, 12 min, deliberately
  reproducible) this one is per-visit and genuinely animated — it is the
  section's motion, not its seed.
*/
const ORBIT_ROTATE_MS = 7000;

/*
  The rotating centre of an orbit section.

  Frames come from the dishes themselves rather than a curated pool: whatever is
  photographed in this section is what the middle cycles through, in menu order.
  Two <img> layers cross-fade so a frame swap never flashes the background.

  Honours prefers-reduced-motion by holding the first frame — a photo that
  changes under you is exactly the kind of unrequested motion that rule exists
  for.
*/
/*
  How much of its own square each salad photograph actually fills, and the scale
  that evens them out.

  The cut-outs are squares of transparent ground with a bowl somewhere in the
  middle, and the bowl's share of that square runs from 78% to 94% depending on
  how each shot was cropped. Painted at one size they visibly jump as the centre
  rotates — the same "why are these different sizes" that the ring's cards were
  fixed for, just spread over time instead of across a row. Scaling each frame by
  what it measures evens them out AND spends the empty margin on the food, which
  is most of what "zoom in" means here: at 96% of the frame the bowl gains ~20%
  over its natural size before the geometry contributes anything.

  Measured from the decoded pixels because nothing records it: 64x64 is plenty
  for a bounding box, and it is the alpha channel we need, not detail. The larger
  of the two axes wins so a scaled frame can never overflow its box.

  A photo on opaque ground measures 1 and is left alone, which is the correct
  answer for it. Any failure — canvas blocked, fetch refused, no OffscreenCanvas
  — also lands on 1 and the photo renders exactly as it does today.
*/
const HERO_FILL_TARGET = 0.96;
const HERO_FILL_MAX = 1.35;

async function measureFill(src) {
  /*
    The Accept header is load-bearing, not boilerplate. In production these URLs
    go through /_vercel/image, which content-negotiates the format — and a bare
    fetch() sends `Accept: * / *`, for which Vercel answers JPEG. JPEG has no
    alpha, so every pixel reads as opaque, the bounding box below comes out as
    the whole square, and the frame is silently scored "already full" (scale 1)
    instead of its real 1.23. The <img> next to us is unaffected: the browser
    sends its own image/* Accept and gets a format that keeps the transparency.
    Caught in production on the Fattoush frame, which is the one .webp source in
    the ring and rendered visibly smaller than the other six because of it.
  */
  const res = await fetch(src, { mode: "cors", headers: { Accept: "image/webp,image/apng,image/png,image/*,*/*" } });
  const bmp = await createImageBitmap(await res.blob());
  const S = 64;
  const ctx = new OffscreenCanvas(S, S).getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bmp, 0, 0, S, S);
  bmp.close?.();
  const { data } = ctx.getImageData(0, 0, S, S);
  let minX = S, minY = S, maxX = -1, maxY = -1;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      if (data[(y * S + x) * 4 + 3] > 12) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return 1;
  const fill = Math.max((maxX - minX + 1) / S, (maxY - minY + 1) / S);
  return Math.min(HERO_FILL_MAX, Math.max(1, HERO_FILL_TARGET / fill));
}

function useHeroFill(srcs) {
  const [fill, setFill] = useState({});
  const key = srcs.join("|");
  useEffect(() => {
    let alive = true;
    if (typeof OffscreenCanvas === "undefined" || typeof createImageBitmap === "undefined") return;
    Promise.all(srcs.map((s) => measureFill(s).catch(() => 1))).then((scales) => {
      if (alive) setFill(Object.fromEntries(srcs.map((s, n) => [s, scales[n]])));
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return fill;
}

function OrbitHero({ items }) {
  const frames = items.filter((d) => d.cardImage).map((d) => optimizedSrc(d.cardImage, 1440));
  const [i, setI] = useState(0);
  const fill = useHeroFill(frames);
  useEffect(() => {
    if (frames.length < 2) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((n) => (n + 1) % frames.length), ORBIT_ROTATE_MS);
    return () => clearInterval(id);
  }, [frames.length]);

  if (frames.length === 0) return null;
  return (
    <div className="shk-orbit__hero" aria-hidden="true">
      {frames.map((src, n) => (
        <img
          key={src}
          className={`shk-orbit__hero-img${n === i % frames.length ? " is-on" : ""}`}
          style={{ "--hero-fill": fill[src] ?? 1 }}
          src={src}
          alt=""
          loading={n === 0 ? "eager" : "lazy"}
        />
      ))}
    </div>
  );
}

/*
  Stable partition: dishes that have a photograph keep their display_order at
  the front, the rest keep theirs behind them. Not a sort by a boolean — that
  would let the comparator reshuffle equal items differently across renders.
*/
function photosFirst(items) {
  const shot = items.filter((d) => d.cardImage);
  return shot.length === 0 || shot.length === items.length
    ? items
    : [...shot, ...items.filter((d) => !d.cardImage)];
}

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
  const { data, loading, error } = useMenu();
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
    .map((c) => {
      const items = filtered.filter((d) => (d.section_id ?? d.category_id) === c.id);
      // A split section shows two dishes per row, so its first row is the most
      // valuable real estate on the page — and in Salads five of seven dishes
      // are not photographed yet, which put an empty placeholder in the top
      // slot next to the big photograph. Float the unphotographed ones to the
      // end HERE ONLY; every other section keeps display_order untouched. This
      // undoes itself as the photos land, and is a display rule only — nothing
      // is written back to the database.
      return { ...c, items: SECTION_SPLIT.has(c.name) ? photosFirst(items) : items };
    })
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
      data-code={dish.product_code}
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
    <>
      {/* Both live outside the scroll container on purpose. The symbol sheet is
          the one copy of every fruit drawing on the page, and the falling layer
          is `position: fixed` — nesting either inside a scrolling, clipped box
          only invites it to be clipped. */}
      <FruitSymbols />
      <FruitFall />
      <SliceScore />

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

          {/* The menu could not be loaded. Say so plainly rather than falling back
              to hardcoded prices — a wrong price is worse than a missing menu. */}
          {!loading && error && (
            <div className="shk-app__empty">
              <p>The menu is temporarily unavailable.</p>
              <button className="shk-app__clear" onClick={() => window.location.reload()}>
                Reload
              </button>
              {content.cta?.instagramUrl && (
                <p>
                  Today&rsquo;s menu is always on{" "}
                  <a href={content.cta.instagramUrl} target="_blank" rel="noreferrer">
                    Instagram
                  </a>
                  .
                </p>
              )}
            </div>
          )}

          {!loading && !error && byCat.length === 0 && (
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
                className={`shk-app__section ${SECTION_TINT[cat.name] ?? ""} ${
                  SECTION_SHOWCASE.has(cat.name) ? "shk-app__section--showcase" : ""
                } ${SECTION_SPLIT.has(cat.name) ? "shk-app__section--split" : ""} ${
                  SECTION_ORBIT.has(cat.name) ? "shk-app__section--orbit" : ""
                }`}
              >
                <SectionArt cfg={SECTION_ART[cat.name]} />
                {cat.name === "Potato Tacos" ? (
                  <ManakishTiers section={cat} onSelect={setSelected} onQuickAdd={quickAdd} addedIds={cart.addedIds} />
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
                      const orbit = SECTION_ORBIT.has(cat.name);
                      /*
                        The ring needs to know how many cards it is placing
                        (--n) so the CSS can space them evenly around the
                        circle, and each card needs its index (--i). Below
                        --wide both are ignored and this is a plain grid.
                      */
                      const cards = (items) => (
                        <div
                          className={`shk-app__grid${orbit ? " shk-orbit" : ""}`}
                          style={orbit ? { "--n": items.length } : undefined}
                        >
                          {orbit && <OrbitHero items={items} />}
                          {items.map((dish, n) => (
                            <Fragment key={dish.id}>
                              {orbit
                                ? <div className="shk-orbit__slot" style={{ "--i": n }}>{renderDish(dish, cat.name)}</div>
                                : renderDish(dish, cat.name)}
                            </Fragment>
                          ))}
                        </div>
                      );
                      const rows = (items) => (
                        <DishRows items={items} onSelect={setSelected} onQuickAdd={quickAdd} addedIds={cart.addedIds} />
                      );
                      /*
                        A card is nine parts photograph. Give one to a dish that
                        has no photo and you get a 380px empty disc — Salads had
                        five of them in a row and the bottom half of the section
                        was nothing but pale ovals and white space.

                        So a group renders by what it actually HAS: photographed
                        dishes take the grid, the rest fall to menu rows below it.
                        A wholly photoless group (the drinks) comes out of the
                        same branch as rows, exactly as before, and any dish
                        rejoins the grid by itself the day it gets a photo — no
                        list to maintain.
                      */
                      const group = (items) => {
                        const shot = items.filter((d) => d.cardImage);
                        if (!shot.length) return rows(items);
                        const plain = items.filter((d) => !d.cardImage);
                        if (!plain.length) return cards(items);
                        return (
                          <>
                            {cards(shot)}
                            {rows(plain)}
                          </>
                        );
                      };
                      return hasSubcategories(subs, cat.id) ? (
                        subs.map((sub) => (
                          <div key={sub.id} className="shk-app__tier">
                            <div className="shk-app__subhead">
                              <h3 className="shk-app__sub-title">{sub.name}</h3>
                              <span className="shk-app__sub-price num">{priceHint(sub.items)}</span>
                            </div>
                            {group(sub.items)}
                          </div>
                        ))
                      ) : (
                        group(cat.items)
                      );
                    })()}
                  </>
                )}

                {cat.items.some((d) => (d.category_code || "").startsWith("KP-FIN-MAN")) &&
                  bundleCards.length > 0 && (
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
    </>
  );
}
