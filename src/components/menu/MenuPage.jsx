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
import { assignSectionIds, buildSections } from "../../lib/menuSections.js";
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

export function MenuPage({ data, loading, error, onOpenDish, addedIds, onQuickAdd }) {
  const wide = useWide();

  // The header's opening hours must be right in the first frame, not after the
  // fetch: a status that appears a second late reads as the page still loading.
  // DEFAULT_CONTENT is the same fallback lib/content.js merges the DB row over.
  const content = data?.content ?? DEFAULT_CONTENT;
  const sections = useMemo(
    () => buildSections(data?.groups, data?.categories, data?.dishes),
    [data?.groups, data?.categories, data?.dishes],
  );
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

  const body = (
    <>
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
      <MenuTopbar wide={wide} hoursTime={content?.cta?.hoursTime} />

      {!wide && (
        <>
          <Lede />
          <CategoryRail sections={sections} idFor={idFor} active={active} onPick={go} />
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
