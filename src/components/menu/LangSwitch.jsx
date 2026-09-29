import { LANG, LANGS, LANG_NAMES, pathFor, switchLang, t } from "../../i18n/index.js";

/*
  Language switcher — a two-segment pill in the header, mirroring the filter
  button on the other side of the logo.

  Each segment is a real link to that language's URL, not a button: crawlers
  and "open in new tab" get the right address, and it still works if JS fails.
  The click handler only adds the remembered choice (see i18n/index.js) before
  the same navigation happens.
*/
export function LangSwitch() {
  return (
    <nav className="shk-lang" aria-label={t("lang.label")}>
      {LANGS.map((l) => {
        const on = l === LANG;
        return (
          <a
            key={l}
            className={`shk-lang__opt${on ? " is-on" : ""}`}
            href={pathFor(l)}
            hrefLang={l}
            lang={l}
            aria-current={on ? "true" : undefined}
            title={LANG_NAMES[l]}
            onClick={(e) => {
              if (on) {
                e.preventDefault();
                return;
              }
              // Let modified clicks (new tab/window) behave like a normal link.
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
              e.preventDefault();
              switchLang(l);
            }}
          >
            {l.toUpperCase()}
          </a>
        );
      })}
    </nav>
  );
}
