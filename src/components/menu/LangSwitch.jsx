import { useState, useRef, useEffect } from "react";
import { LANG, LANGS, LANG_NAMES, pathFor, switchLang, t } from "../../i18n/index.js";

/*
  Language switcher — header, mirroring the filter button on the other side of
  the logo.

  Every option is a real link to that language's URL, not a button: crawlers and
  "open in new tab" get the right address, and it still works without JS. The
  click handler only records the choice (see i18n/index.js) before the same
  navigation happens.

  Two layouts, one markup. On desktop the options sit inline as a segmented
  pill. On a phone three segments would run into the centred logo, so the list
  collapses behind one round button carrying the current language — the same
  44px footprint as the filter button opposite. That is what keeps the header
  honest when Arabic becomes the fourth language.
*/
export function LangSwitch() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const go = (lang) => (e) => {
    if (lang === LANG) {
      e.preventDefault();
      setOpen(false);
      return;
    }
    // Let modified clicks (new tab / new window) behave like a normal link.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    switchLang(lang);
  };

  return (
    <nav className="shk-lang" aria-label={t("lang.label")} ref={ref}>
      <button
        type="button"
        className="shk-lang__current"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("lang.label")}
        onClick={() => setOpen((v) => !v)}
      >
        {LANG.toUpperCase()}
      </button>
      <ul className={`shk-lang__list${open ? " is-open" : ""}`}>
        {LANGS.map((l) => {
          const on = l === LANG;
          return (
            <li key={l} className="shk-lang__item">
              <a
                className={`shk-lang__opt${on ? " is-on" : ""}`}
                href={pathFor(l)}
                hrefLang={l}
                lang={l}
                aria-current={on ? "true" : undefined}
                title={LANG_NAMES[l]}
                onClick={go(l)}
              >
                {l.toUpperCase()}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
