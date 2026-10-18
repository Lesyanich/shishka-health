import { useEffect, useMemo, useState } from "react";
import { MenuTopbar } from "./MenuTopbar.jsx";
import { CategoryRail } from "./CategoryRail.jsx";
import { MenuNav } from "./MenuNav.jsx";
import { MenuSection } from "./MenuSection.jsx";
import { VisitUs } from "./VisitUs.jsx";
import { SiteFooter } from "./SiteFooter.jsx";
import { Cart } from "../cart/Cart.jsx";
import { useScrollSpy } from "../../hooks/useScrollSpy.js";
import { useWide } from "../../hooks/useWide.js";
import { assignSectionIds } from "../../lib/menuSections.js";
import { QuickFilterChips } from "../filters/QuickFilterChips.jsx";
import { DEFAULT_CONTENT } from "../../lib/content.js";
import { t } from "../../i18n/index.js";

/*
  The menu page (SPEC.md §3 mobile, §4 desktop).

  One model, two placements of the nav: a sticky pill rail on top under 1024 px,
  a sticky column on the left above it. Both drive, and are driven by, the SAME
  scroll-spy module (hooks/useScrollSpy.js) — §3.4 and §4.3 are the same rule on
  purpose, so the two placements can never disagree about where the guest is.

  There is no home screen. The menu IS the first screen: the old `Hero` (slogan
  + salad-bar photograph) is gone, and the first section starts under the
  header. Measured on the live site at 375 px, the first dish photo used to sit
  at 910 px — 1.1 screens down, past a logo, a slogan and a stock photo of the
  salad bar. That number is the whole reason this page exists.

  The document is the scroller. Not an inner `overflow:auto` box like the old
  app shell: the scroll-spy's IntersectionObserver measures against the
  viewport, `scroll-margin-top` and `#wraps` anchors only work natively on the
  document, and on iOS a full-height inner scroller fights the address bar.
*/

/*
  "What are you craving?" with "craving" in accent red (§3.2).

  Two keys rather than one with markup in it: "{accent}" lets a translator put
  the accented word wherever that language puts it, instead of forcing English
  word order on Russian or Thai.
*/
function Lede() {
  const parts = t("menu.lede").split("{accent}");
  return (
    <div className="shk-menu__lede">
      <h1 className="shk-menu__title">
        {parts[0]}
        <span>{t("menu.ledeAccent")}</span>
        {parts[1] ?? ""}
      </h1>
      {/* "Clean" carries over the one word worth keeping from the retired
          CLEAN FOOD banner, which died with Hero. */}
      <p className="shk-menu__sub">{t("menu.subline")}</p>
    </div>
  );
}

/*
  `sections` arrive ALREADY filtered (App runs the Filters sheet and the quick
  filters, lib/quickFilters.js), so the rail, the left nav, the group eyebrows and
  the scroll-spy all reflect the same list. A section with nothing left to show is
  not in it — it leaves the page and the nav together, because a nav entry for a
  section that is not on the page would leave the spy pointing at nothing. A
  DRINK section that a nutrition filter does not apply to IS in it, flagged
  `collapsed`, and renders as a disclosure.

  `filter` is the filter state owned by App:
    { count, onOpen, onClear, shown, total, quick: { active, onToggle } }
*/
export function MenuPage({ data, sections = [], resultsTick = 0, loading, error, onOpenDish, addedIds, onQuickAdd, filter }) {
  const wide = useWide();

  // The header's opening hours must be right in the first frame, not after the
  // fetch: a status that appears a second late reads as the page still loading.
  // DEFAULT_CONTENT is the same fallback lib/content.js merges the DB row over.
  const content = data?.content ?? DEFAULT_CONTENT;
  const idFor = useMemo(() => assignSectionIds(sections), [sections]);
  const ids = useMemo(() => sections.map((s) => idFor.get(s.id)), [sections, idFor]);

  const [active, setActive] = useState(null);
  const [spyActive, setSpyActive] = useScrollSpy(ids);
  useEffect(() => setActive(spyActive), [spyActive]);

  /*
    Jumping to a section. Light the destination at once (the guest tapped it —
    waiting for the smooth scroll to drag the 30% band over the target makes the
    rail feel broken), then let the spy take over as the page settles.

    `scrollIntoView` is correct HERE and wrong in the rail: this is the page we
    mean to move. The rail nudges its own scrollLeft instead, precisely because
    scrollIntoView would move the page too (see CategoryRail.jsx).
  */
  const go = (id) => {
    setActive(id);
    setSpyActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    // The hash is part of §4.2 and is what makes a section shareable. replaceState,
    // not pushState: a guest scrolling the menu should not have to press Back
    // once per category they looked at.
    if (typeof history !== "undefined") history.replaceState(null, "", `#${id}`);
  };

  /*
    The two places this page jumps by itself, and why each resets the pill.

    The scroll-spy is an IntersectionObserver, which only reports CHANGES. Jump
    from "past the last section" (the footer) to "above the first" and there is
    nothing in the 30% band before or after, so it fires nothing and the rail
    keeps the last section's pill at the top of the page. A smooth scroll passes
    through the sections and is fine; an instant jump is not. So wherever the page
    itself jumps, it says where it landed: the first section.

      resultsTick  the Filters sheet closed having changed the filter: bring the
                   results into view (the chip row, the top of the list).
      onTop        the logo's #top link.
      onVisit      the header status, which links to Visit us (below the last section).

    Deliberately not a scroll listener: that is the thing §3.4 rules out.
  */
  const toFirst = () => {
    if (!ids[0]) return;
    setActive(ids[0]);
    setSpyActive(ids[0]);
  };
  // The mirror image: the header status links to Visit us, below the last section,
  // so the pill is the last section's.
  const toLast = () => {
    const last = ids[ids.length - 1];
    if (!last) return;
    setActive(last);
    setSpyActive(last);
  };
  useEffect(() => {
    if (!resultsTick) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document
      .querySelector(".shk-menu__chipbar")
      ?.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
    toFirst();
    // Runs on the tick only; `ids` is read as it is at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultsTick]);

  // A `#wraps` link arriving from outside (a share, a bookmark, the AEO pages).
  // One shot, after the sections exist — the browser's own anchor jump fired
  // before React had rendered them.
  const [landed, setLanded] = useState(false);
  useEffect(() => {
    if (landed || ids.length === 0) return;
    setLanded(true);
    const want = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (!want || !ids.includes(want)) return;
    requestAnimationFrame(() =>
      document.getElementById(want)?.scrollIntoView({ block: "start" }),
    );
  }, [ids, landed]);

  /* Group eyebrows (§3.5): quiet labels BETWEEN sections, not navigation. They
     are rendered inline with the sections so the scroll order is one list. */
  const groupOf = (i) => {
    const key = sections[i].group;
    return key && (i === 0 || sections[i - 1].group !== key) ? key : null;
  };

  const sectionNodes = sections.map((s, i) => (
    <div key={s.id}>
      {groupOf(i) && <p className="shk-menu__group">{t(`menu.group.${s.group}`)}</p>}
      <MenuSection
        section={s}
        domId={idFor.get(s.id)}
        wide={wide}
        addedIds={addedIds}
        /* Desktop has NO dish pop-up (§4.5): the full card shows everything
           inline, so there is nothing for a dialog to add. Passing no opener is
           what makes DishCard render the name as plain text instead of a
           control that would open nothing. */
        onOpen={wide ? undefined : onOpenDish}
        onQuickAdd={onQuickAdd}
      />
    </div>
  ));

  // The nav needs the sections grouped; the page needs them flat. Same objects.
  const navGroups = useMemo(() => {
    const out = [];
    for (const s of sections) {
      const last = out[out.length - 1];
      if (last && last.key === s.group) last.sections.push(s);
      else out.push({ key: s.group, sections: [s] });
    }
    return out;
  }, [sections]);

  const filtering = (filter?.count ?? 0) > 0;

  const body = (
    <>
      {/* A filtered menu must LOOK filtered. A filter a guest can forget about —
          scrolled eight screens down, the badge off screen — is how someone ends
          up reading a menu they believe is complete. Not sticky and not
          dismissable on its own: it goes when the filter does. */}
      {filtering && !loading && (
        <div className="shk-menu__filtered" role="status">
          <span>
            {t("filter.shown")}{" "}
            <span className="num">{filter.shown} / {filter.total}</span>
          </span>
          <button type="button" className="shk-menu__filtered-clear" onClick={filter.onClear}>
            {t("menu.clearFilters")}
          </button>
        </div>
      )}

      {/* Keyed on `shown`, not on the section list: a filter can match nothing
          while folded drink headers remain (a nutrition filter folds drinks
          rather than filtering them), and a page that is all folded headers and
          no explanation reads as broken. With the filters single-select this is
          no longer reachable by combining chips; it covers the data changing
          under a live filter (e.g. no dish carrying seafood is live that day). */}
      {!loading && !error && filtering && filter.shown === 0 && (
        <div className="shk-menu__empty">
          <p>{t("menu.noMatch")}</p>
          <button type="button" className="shk-app__clear" onClick={filter.onClear}>
            {t("menu.clearFilters")}
          </button>
        </div>
      )}

      {loading && <MenuSkeleton />}

      {/* The menu could not be loaded. Say so plainly rather than falling back
          to hardcoded prices — a wrong price is worse than a missing menu. */}
      {!loading && error && (
        <div className="shk-menu__empty">
          <p>{t("menu.unavailable")}</p>
          <button type="button" className="shk-app__clear" onClick={() => window.location.reload()}>
            {t("menu.reload")}
          </button>
        </div>
      )}

      {sectionNodes}
    </>
  );

  return (
    <div className={`shk-menu${wide ? " shk-menu--wide" : ""}`} id="top">
      <MenuTopbar
        wide={wide}
        hoursTime={content?.cta?.hoursTime}
        onTop={toFirst}
        onVisit={toLast}
        filterCount={filter?.count ?? 0}
        onOpenFilters={filter?.onOpen}
      />

      {!wide && (
        <>
          <Lede />
          {/* One chip row under the title, scrolling sideways, NOT sticky: the
              rail below is already the sticky bar and a second one would spend
              another ~56px of a 812px screen. */}
          <div className="shk-menu__chipbar">
            <QuickFilterChips active={filter.quick.active} onToggle={filter.quick.onToggle} />
          </div>
          <CategoryRail
            sections={sections}
            idFor={idFor}
            active={active}
            onPick={go}
            filterCount={filter?.count ?? 0}
            onOpenFilters={filter?.onOpen}
          />
          <main className="shk-menu__main">{body}</main>
          <VisitUs cta={content?.cta} />
        </>
      )}

      {wide && (
        <div className="shk-menu__layout">
          <div className="shk-menu__aside shk-menu__aside--left">
            <MenuNav groups={navGroups} idFor={idFor} active={active} onPick={go} />
          </div>
          <main className="shk-menu__main">
            <Lede />
            <div className="shk-menu__chipbar">
              <QuickFilterChips active={filter.quick.active} onToggle={filter.quick.onToggle} />
            </div>
            {body}
          </main>
          <div className="shk-menu__aside shk-menu__aside--right">
            {/* §4.6: the order panel, and Visit us under it, both sticky. */}
            <Cart variant="panel" />
            <VisitUs cta={content?.cta} wide />
          </div>
        </div>
      )}

      <SiteFooter wide={wide} />

      {/* The floating order bar is the mobile placement of the same Cart (§5).
          On desktop the panel above has the job, so no FAB. */}
      {!wide && <Cart />}
    </div>
  );
}

/*
  What the page paints while the menu is in flight. Shaped like the real first
  section (a title, a price line, a 2-up grid) so the layout does not jump when
  the dishes land.
*/
function MenuSkeleton() {
  return (
    <section className="shk-menu__sec" aria-hidden="true">
      <div className="shk-menu__sec-head">
        <div className="shk-skeleton" style={{ height: 26, width: "55%" }} />
        <div className="shk-skeleton" style={{ height: 14, width: 90, marginTop: 8 }} />
      </div>
      <div className="shk-menu__grid">
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="shk-skeleton" style={{ height: 150, borderRadius: 22 }} />
            <div className="shk-skeleton" style={{ height: 16, width: "70%" }} />
          </div>
        ))}
      </div>
    </section>
  );
}
