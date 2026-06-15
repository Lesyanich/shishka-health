/*
  Manakeesh section — a big "manakish" title + tagline, then the tiers
  (Classic → Specialty → Premium) laid out as a HORIZONTAL, snap-scrolling
  carousel so the section stays compact instead of running the full page.
  A bottom-right "next" control advances to the following tier (and loops).
  The set/bundle cards render under this (see App.jsx). Clicking a manakeesh
  opens the dish detail window (DishDialog) via onSelect.
*/
import { useRef, useState } from "react";
import { ChevronRightIcon } from "../Icons.jsx";

const TAGLINE = "our signature gluten-free crust crafted from potato & rice";

// Poster tier wording (DB calls the middle tier "Signature").
const TIER_LABEL = { signature: "specialty" };
const tierLabel = (name) => {
  const n = (name || "").toLowerCase();
  return TIER_LABEL[n] ?? n;
};

// Group a section's dishes into tiers (subcategories), ordered by their sort.
function tiersOf(items) {
  const map = new Map();
  for (const d of items) {
    const id = d.subcategory_id ?? d.section_id;
    if (!map.has(id)) {
      map.set(id, { id, name: d.subcategory_name ?? "", sort: d.subcategory_sort ?? 0, items: [] });
    }
    map.get(id).items.push(d);
  }
  const tiers = Array.from(map.values()).sort((a, b) => a.sort - b.sort);
  for (const t of tiers) {
    const prices = t.items.map((d) => d.price).filter((p) => p != null);
    t.minPrice = prices.length ? Math.min(...prices) : null;
    t.maxPrice = prices.length ? Math.max(...prices) : null;
  }
  return tiers;
}

export function ManakishTiers({ section, tagline = TAGLINE, onSelect }) {
  const tiers = tiersOf(section.items);
  const scrollerRef = useRef(null);
  const [active, setActive] = useState(0);

  // Distance between consecutive tier panels (panel width + gap).
  const stepWidth = () => {
    const el = scrollerRef.current;
    if (!el || el.children.length === 0) return 0;
    if (el.children.length > 1) return el.children[1].offsetLeft - el.children[0].offsetLeft;
    return el.children[0].getBoundingClientRect().width;
  };

  const onScroll = () => {
    const el = scrollerRef.current;
    const step = stepWidth();
    if (!el || !step) return;
    setActive(Math.round(el.scrollLeft / step));
  };

  // Advance to the next tier; loop back to the first at the end.
  const scrollNext = () => {
    const el = scrollerRef.current;
    const step = stepWidth();
    if (!el || !step) return;
    const next = (active + 1) % el.children.length;
    el.scrollTo({ left: next * step, behavior: "smooth" });
  };

  const nextLabel = tiers.length ? tierLabel(tiers[(active + 1) % tiers.length].name) : "";

  return (
    <div className="shk-mana">
      <header className="shk-mana__head">
        <h2 className="shk-mana__title">manakish</h2>
        <p className="shk-mana__tag">{tagline}</p>
      </header>

      <div className="shk-mana__cols" ref={scrollerRef} onScroll={onScroll}>
        {tiers.map((t) => (
          <div className="shk-mana__col" key={t.id}>
            <div className="shk-mana__colhead">
              {t.minPrice != null && (
                <span className="shk-mana__price">
                  <b>฿{t.minPrice}</b>
                  {t.maxPrice !== t.minPrice && <small>and up</small>}
                </span>
              )}
              <span className="shk-mana__tier-name">{tierLabel(t.name)}</span>
            </div>

            <ul className="shk-mana__list">
              {t.items.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    className={`shk-mana__item ${d.comingSoon ? "is-soon" : ""}`}
                    onClick={() => onSelect?.(d)}
                    aria-label={d.name}
                  >
                    <span className="shk-mana__disc">
                      {d.image_url ? (
                        <img src={d.image_url} alt="" loading="lazy" />
                      ) : (
                        <span className="shk-mana__disc-ph" aria-hidden="true" />
                      )}
                    </span>
                    <span className="shk-mana__item-name">{d.name}</span>
                    {d.price != null && d.price !== t.minPrice && (
                      <span className="shk-mana__item-price num">฿{d.price}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {tiers.length > 1 && (
        <div className="shk-mana__nav">
          <button
            type="button"
            className="shk-mana__next"
            onClick={scrollNext}
            aria-label={`Next tier: ${nextLabel}`}
          >
            <span className="shk-mana__next-label">next: <b>{nextLabel}</b></span>
            <ChevronRightIcon size={22} />
          </button>
        </div>
      )}
    </div>
  );
}
