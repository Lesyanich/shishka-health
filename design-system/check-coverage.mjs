#!/usr/bin/env node
/**
 * Design-system guide coverage check (RULE-DESIGN-SYSTEM).
 *
 * The living guide `design-system/index.html` is hand-maintained: a new `.shk-*`
 * component family added to `src/styles/components.css` will not appear in the
 * guide until someone writes a demo for it. This script makes that drift a hard
 * CI failure instead of a silent gap.
 *
 * WHAT IT DOES
 *   forward (fails build): every top-level `.shk-*` family in components.css must
 *     be referenced in the guide (a live demo OR an explicit `<code>shk-…</code>`
 *     prose mention — both are how the guide acknowledges a family exists).
 *   reverse (warns only): a class actually applied in the guide markup with no
 *     matching CSS rule is probably a typo or a removed component. Non-fatal.
 *
 * USAGE   node design-system/check-coverage.mjs      (run from repo root)
 *         npm run ds:check
 *
 * Exit 0 = covered. Exit 1 = a family is missing a guide entry (or a file is
 * missing). The build should block on a non-zero exit.
 */

import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const CSS_PATH = resolve(repoRoot, "src/styles/components.css");
const STYLES_DIR = resolve(repoRoot, "src/styles");
const GUIDE_PATH = resolve(repoRoot, "design-system/index.html");

/**
 * Families intentionally NOT rendered as a demo in the guide (app-shell + a11y
 * utilities that have nothing visual to show). Keep this list SHORT and add to
 * it deliberately — every entry here is a component the guide is allowed to skip.
 */
const ALLOWLIST = new Set([
  "shk-app", // page/root wrapper — structural, nothing to render
  "shk-visually-hidden", // screen-reader-only helper — invisible by design
]);

/** Strip a `.shk-foo__el--mod` class down to its base family `shk-foo`. */
function toFamily(cls) {
  // Cut at the first BEM element (`__`) or modifier (`--`) marker. Single
  // hyphens are part of the family name (e.g. shk-row-wrap, shk-seal-edge).
  return cls.replace(/(__|--).*$/, "");
}

/** Top-level `.shk-*` families declared in a CSS string. */
function cssFamilies(css) {
  const out = new Set();
  for (const m of css.matchAll(/\.(shk-[a-z0-9-]+)/g)) out.add(toFamily(m[1]));
  return out;
}

/** Recursively collect every .css file path under a directory. */
async function cssFilesUnder(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = resolve(dir, e.name);
    if (e.isDirectory()) files.push(...(await cssFilesUnder(full)));
    else if (e.name.endsWith(".css")) files.push(full);
  }
  return files;
}

/** Every `.shk-*` family defined anywhere under src/styles (components + tokens). */
async function allDefinedFamilies(dir) {
  const out = new Set();
  for (const file of await cssFilesUnder(dir)) {
    for (const fam of cssFamilies(await readFile(file, "utf8"))) out.add(fam);
  }
  return out;
}

/**
 * Families the guide references ANYWHERE — live demo `class="shk-…"` usage and
 * `<code>shk-…</code>` documentation prose both count, matching how the guide is
 * actually authored (some app-shell families are documented in prose, not demos).
 */
function guideReferencedFamilies(html) {
  const out = new Set();
  for (const m of html.matchAll(/shk-[a-z0-9-]+/g)) out.add(toFamily(m[0]));
  return out;
}

/** Families actually APPLIED as a class in the guide markup (for reverse check). */
function guideAppliedFamilies(html) {
  const out = new Set();
  for (const attr of html.matchAll(/class\s*=\s*"([^"]*)"/g)) {
    for (const token of attr[1].split(/\s+/)) {
      if (token.startsWith("shk-")) out.add(toFamily(token));
    }
  }
  return out;
}

async function readOrFail(path, label) {
  try {
    return await readFile(path, "utf8");
  } catch {
    console.error(`✖ design-system coverage: cannot read ${label} (${path})`);
    process.exit(1);
  }
}

const css = await readOrFail(CSS_PATH, "components.css");
const html = await readOrFail(GUIDE_PATH, "design-system/index.html");

const inCss = cssFamilies(css); // forward scope: components.css only (per task)
const definedAnywhere = await allDefinedFamilies(STYLES_DIR); // for reverse check
const referenced = guideReferencedFamilies(html);
const applied = guideAppliedFamilies(html);

// ── forward: CSS families with no guide entry (minus the allowlist) ──────────
const missing = [...inCss]
  .filter((fam) => !referenced.has(fam) && !ALLOWLIST.has(fam))
  .sort();

// ── reverse (warn only): classes used in the guide with no CSS rule anywhere ──
const dangling = [...applied]
  .filter((fam) => !definedAnywhere.has(fam) && !ALLOWLIST.has(fam))
  .sort();

if (dangling.length) {
  console.warn(
    `⚠ design-system coverage: ${dangling.length} guide class(es) have no rule in components.css ` +
      `(typo or removed component?): ${dangling.join(", ")}`,
  );
}

if (missing.length) {
  console.error(
    `\n✖ design-system coverage FAILED — ${missing.length} component famil${
      missing.length === 1 ? "y is" : "ies are"
    } in components.css but missing from the guide:\n`,
  );
  for (const fam of missing) console.error(`    .${fam}`);
  console.error(
    `\n  Add a demo for each in design-system/index.html (a <section class="ds-section"> block),\n` +
      `  or, if the family is app-shell/utility with nothing to render, add it to the ALLOWLIST\n` +
      `  in design-system/check-coverage.mjs with a one-line reason.\n\n` +
      `  RULE-DESIGN-SYSTEM: the living guide is the front-end source of truth — it must not\n` +
      `  silently fall behind components.css.\n`,
  );
  process.exit(1);
}

console.log(
  `✓ design-system coverage: all ${inCss.size} .shk-* families are in the guide ` +
    `(${ALLOWLIST.size} allowlisted).`,
);
