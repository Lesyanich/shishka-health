/*
  Site language (MC f91194f7).

  The language is part of the URL: English lives at "/", Russian under "/ru".
  A path prefix rather than a toggle so every language has its own indexable,
  shareable address (hreflang + the AEO prerender pages depend on that).

  Switching language is a full page load of the other URL. The site is one
  page and the menu is fetched once per load, so a reload is the simplest
  correct way to refetch everything in the new language — no live re-render of
  half-translated state. That also lets LANG be a module constant.

  UI copy lives in ./dict/<lang>.js. Menu data (dish names, categories, site
  copy …) is translated in the DB — shishka-os content_translations, served by
  the menu_translations view — and overlaid in ./localize.js.
*/
import en from "./dict/en.js";
import ru from "./dict/ru.js";

export const LANGS = ["en", "ru"];
export const DEFAULT_LANG = "en";
const DICTS = { en, ru };
const STORE_KEY = "shk-lang";

// Human names for the switcher, each in its own language.
export const LANG_NAMES = { en: "English", ru: "Русский" };

const PREFIX_RE = /^\/(ru)(?=\/|$)/;

export function langFromPath(pathname) {
  const m = PREFIX_RE.exec(pathname || "");
  return m ? m[1] : DEFAULT_LANG;
}

export const LANG =
  typeof window !== "undefined" ? langFromPath(window.location.pathname) : DEFAULT_LANG;

// The same page in another language: strip any language prefix, add the new one.
export function pathFor(lang, pathname = typeof window !== "undefined" ? window.location.pathname : "/") {
  const bare = pathname.replace(PREFIX_RE, "") || "/";
  if (lang === DEFAULT_LANG) return bare;
  return `/${lang}${bare === "/" ? "" : bare}`;
}

function readPref() {
  try {
    return localStorage.getItem(STORE_KEY);
  } catch {
    return null;
  }
}

function writePref(lang) {
  try {
    localStorage.setItem(STORE_KEY, lang);
  } catch {
    /* private mode — the URL still carries the language */
  }
}

export function switchLang(lang) {
  if (!LANGS.includes(lang) || lang === LANG) return;
  writePref(lang);
  const { search, hash } = window.location;
  window.location.assign(`${pathFor(lang)}${search}${hash}`);
}

/*
  A guest who explicitly picked Russian and later opens the bare "/" (a bookmark,
  a typed address) lands back in Russian. Only an explicit choice counts: we never
  guess from the browser language, and crawlers have no stored choice, so "/"
  always serves English to them.
  Returns true when a redirect was issued (the caller should not render).
*/
export function redirectToPreferredLang() {
  if (typeof window === "undefined") return false;
  const pref = readPref();
  if (!pref || pref === LANG || !LANGS.includes(pref)) return false;
  if (LANG !== DEFAULT_LANG) {
    // The guest followed a /ru link on purpose; that is a choice too.
    writePref(LANG);
    return false;
  }
  const { pathname, search, hash } = window.location;
  window.location.replace(`${pathFor(pref, pathname)}${search}${hash}`);
  return true;
}

// `document.documentElement.lang` drives hyphenation, screen-reader voice and
// the browser's own translate prompt, so it must match the rendered language.
export function applyDocumentLang() {
  if (typeof document === "undefined") return;
  document.documentElement.lang = LANG;
  document.documentElement.dir = "ltr"; // Arabic will set "rtl" here.
}

const dict = DICTS[LANG] ?? en;

// t("cart.title") / t("card.addToOrder", { name }) — falls back to English, then
// to the key itself so a missing string is visible rather than blank.
export function t(key, vars) {
  let s = dict[key] ?? en[key] ?? key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
  return s;
}

/*
  Plurals: tp("cart.items", 3) picks the dictionary entry for the CLDR category
  of n in the current language ("cart.items.one", ".few", ".many", ".other"),
  so Russian gets 1 позиция / 3 позиции / 5 позиций without per-call logic.
*/
const plural = new Intl.PluralRules(LANG);
export function tp(key, n, vars) {
  const cat = plural.select(n);
  const k = dict[`${key}.${cat}`] != null || en[`${key}.${cat}`] != null ? `${key}.${cat}` : `${key}.other`;
  return t(k, { n, ...vars });
}

// Portion units come from the DB in English ("g", "ml").
export function unit(u) {
  if (!u) return "";
  return t(`unit.${u}`) === `unit.${u}` ? u : t(`unit.${u}`);
}
