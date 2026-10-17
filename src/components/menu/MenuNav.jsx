import { t } from "../../i18n/index.js";

/*
  The desktop left nav (SPEC.md §4.2) — the same thing as the mobile rail,
  stood on its end. Sticky at `top: 24px`, categories under their EAT / DRINK /
  SWEET group, no counts (§2), and the same scroll-spy module marks the current
  one (§4.3 is deliberately identical to §3.4).

  Real `<a href="#slug">` rather than buttons: a category is a place on this
  page, so it must be copyable, openable in a new tab, and reachable with the
  keyboard without JavaScript. The click handler only adds the smooth scroll and
  lights the item immediately; letting the default through would also work, just
  with a jump instead of a glide.
*/
export function MenuNav({ groups, idFor, active, onPick }) {
  if (groups.length === 0) return null;

  return (
    <nav className="shk-menu__nav" aria-label={t("menu.categories")}>
      {groups.map((g) => (
        <div className="shk-menu__nav-group" key={g.key ?? "ungrouped"}>
          {/* A group with no key is the trailing bucket of sections no group
              claims (lib/menuGroups.js). It gets no eyebrow — inventing one
              would be inventing a group name. */}
          {g.key && <p className="shk-menu__nav-label">{t(`menu.group.${g.key}`)}</p>}
          <ul className="shk-menu__nav-list">
            {g.sections.map((s) => {
              const id = idFor.get(s.id);
              const on = id === active;
              return (
                <li key={s.id}>
                  <a
                    className={`shk-menu__nav-link${on ? " is-on" : ""}`}
                    href={`#${id}`}
                    aria-current={on ? "true" : undefined}
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                      e.preventDefault();
                      onPick(id);
                    }}
                  >
                    {s.allSoon ? t("menu.railSoon", { name: s.name }) : s.name}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
