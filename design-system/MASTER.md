# Design System Master File — Shishka Web (showcase)

> **LOGIC:** This Master is the brand source of truth — for both repos. It was seeded by
> ui-ux-pro-max, then overwritten with Shishka's real design tokens. Do NOT replace brand
> values with the skill's generic defaults — the skill is used here for *rules + audit*,
> not palette.
>
> **Brand constants.** These are the identity, and changing one changes the brand — change
> it here first, then let the admin panel follow:
> royal-green `#1E3903` canvas · cream `#FBF8F0` text · spice-red `#B62A23` CTA ·
> gold `#F0CE83` prices · brand-purple `#511A52` · SF Pro / Albert Sans ·
> "from the SOIL to the SOUL".
>
> The admin panel's dark working surfaces, borders and motion are a *separate* set
> (`shishka-os/agents/designer/admin-ui-tokens.md`) — application tokens, not brand.
> They derive these hues but are not required to match surface for surface.

**Project:** Shishka Web · **Category:** Restaurant / Healthy Food · **Theme:** **white page, royal-green ink** — the printed-menu look. `tokens/theme-light.css` is imported **last** and overrides the base everywhere. Verify all contrast against `#FFFFFF`, never against `#1E3903`.
**Brand line:** "from the SOIL to the SOUL"

> **Corrected 2026-10-17 (menu redesign PR 2).** This file previously stated the
> theme was royal-green dark and that `theme-royal.css` was imported last. It is
> **not imported at all** — `grep -rn theme-royal src/` returns only the comment
> at the top of `theme-light.css`. The dark theme survives on disk as dead code.
> Every contrast pair below has been recomputed against the white canvas; the
> old table was measured against a background the site does not render.

---

## Color Palette — reference SEMANTIC tokens in UI, never raw scale

Source: `src/styles/tokens/colors.css`; the active surface/text/border aliases come from `tokens/theme-light.css`. **The whole UI renders royal-green ink on white** — pairs below are verified against `#FFFFFF`.

| Role | Token | Value |
|------|-------|-------|
| Page canvas (everywhere) | `--bg-canvas` / `--bg-page` | `#FFFFFF` white |
| Raised surfaces (cards/sheets) | `--surface-1/2/3` | `#FFFFFF` · `#F4F8EC` · `#E7EFD6` |
| Energy red (accent/CTA) | `--accent` → `--red-600` | `#B62A23` |
| Strong text | `--text-strong` | `#1E3903` royal-green |
| Body text | `--text-body` | `rgba(30,57,3,.86)` |
| Muted text | `--text-muted` | `rgba(30,57,3,.70)` |
| Faint text | `--text-faint` | `rgba(30,57,3,.55)` |
| Price | `--menu-price` → `--royal-green` | `#1E3903` |
| Kcal | `--menu-kcal` on `--menu-kcal-bg` | `#1E3903` on `--green-100` |
| Price seal ink | `--seal-ink` | `#1E3903` |
| Bands (washes) | `--band-mint` · `--band-warm` · `--band-drink` | `#E9F3EC` · `#FBF8F0` · `#FBF4E6` |
| Hairlines | `--border` / `--border-strong` | `rgba(30,57,3,.14 / .26)` |
| Open status dot | `--status-open` / `--status-closed` | `#3F8A2A` · `--ink-400` |

Gold (`--honey-300`) and brand-purple are **not** in play on the light theme: gold is unreadable on white, so prices carry royal-green, and purple's "selected" job went to royal-green too (see the overrides at the foot of `theme-light.css`). They remain brand colours for print and signage.

**Verified contrast — measured against the live white canvas `#FFFFFF`** (recompute with `design-system/` scripts if a token changes; figures below computed 2026-10-17):
- `--text-strong` royal-green → **12.79:1** ✓ AAA · `--menu-price` (same ink) → **12.79:1** ✓ AAA
- `--text-body` (royal α.86) → **8.29:1** ✓ AAA
- `--text-muted` (royal α.70) → **5.08:1** ✓ AA — use ≥14px
- `--accent` red-600 → **6.28:1** ✓ AA · cream-50 on red (High protein badge) → **5.92:1** ✓ AA
- cream-50 on royal-green (buttons, selected tab, order bar) → **12.05:1** ✓ AAA
- `--menu-kcal` royal on `--green-100` pill → **10.79:1** ✓ AAA
- ⚠️ `--text-faint` (royal α.55) → **3.32:1** — **large text only** (≥24px / ≥18.6px bold); never small captions.
- `--status-open` `#3F8A2A` → **4.33:1** on white. **Added 2026-10-17 (PR 3)** for the menu header's "● Open till 18:30" dot. It is an 8px dot, not text, so the 4.5:1 floor does not bind — but it may only ever be used that way: the status WORDS beside it carry the meaning in `--text-strong`, per the no-colour-only rule below. Never set type in it.
- **On raised surfaces** the drop is small, unlike the old dark theme: on `--surface-2` `#F4F8EC` (card photo box, tab track) `--text-body` → **7.84:1** ✓, `--text-muted` → **4.90:1** ✓ AA, `--text-faint` → **3.23:1** large-only. On `--surface-3` `#E7EFD6` `--text-muted` → **4.62:1** ✓ AA — the tightest pair in the system, so do not darken that panel further.

## Typography

Source: `src/styles/tokens/{fonts,typography}.css`. **Brand face = SF Pro**, web fallback **Albert Sans** (CDN). Arabic = Noto Kufi Arabic.
DO NOT switch to Playfair/Karla (the skill's restaurant default) — off-brand here.

- `--font-display` (tight, often UPPERCASE "stamp"): hero/display/title
- `--font-sans` (Albert Sans / SF Pro): body, eyebrows
- `--font-mono` + `tabular-nums`: all nutrition figures / prices (`.shk-data`)
- Scale: 11 → 12 → 14 → 16 → 18 → 22 → 28 → 36 → 48 → 64 → 88
- Body line-height `--leading-relaxed` 1.65; min body 16px (mobile, avoids iOS zoom)

## Spacing & Effects
- 4/8px rhythm — **canonical scale is numeric `--sp-0..--sp-32`** (`tokens/spacing.css`). The `--space-xs..3xl` names are **deprecated aliases** living in `compat.css`; always author with `--sp-*`. Radius `--radius-xs..2xl/pill`, motion `--dur-*`/`--ease-*`, z-index `--z-*` all live in `spacing.css` too.
- Focus ring is GLOBAL: `:focus-visible { box-shadow: var(--shadow-focus) }` (base.css) — keep it; never `outline:none` without it.

---

## Component Contract (enforce on every change)

### Cards (`DishCard`)
- The open target MUST be a real `<button type="button">`, and the quick-add
  MUST NOT be nested inside it.
  - ⚠️ The **legacy** tile (`variant="legacy"`, still what the app mounts) fails
    this: it is a `<div role="button" tabIndex={0}>` with the `PriceSeal`
    `<button>` nested inside — a control inside a control. The "(current ✓)"
    this line used to carry was never true. It is deleted in redesign PR 4.
  - The **redesign** variants do it properly: the dish name is a real `<button>`
    whose `::after` is stretched across the card (one tab stop, whole-card hit
    area), with "+" as a sibling layered above it.
- `loading="lazy"` on images (✓). Placeholder gets `aria-hidden` + empty `alt` (✓).
- Hover lift via transform only, no layout shift; 150–300ms.
- Numeric figures (price, macros, kcal) take `font-variant-numeric: tabular-nums`
  but **not** `.shk-data`'s mono family — the brand sets prices and the seals in
  the sans display face (see `.shk-seal__num`), and mono reads off-brand there.

### Modal (`DishDialog`)
- `role="dialog"` + `aria-modal` + `aria-label` (✓), Escape closes (✓), scrim click closes (✓).
- Focus moved in on open and restored to the trigger on close (✓), Tab trapped
  inside (✓), body scroll locked while open (✓). **Corrected 2026-10-17:** this
  block listed all three as "REQUIRED additions (currently missing)". They were
  implemented before that; the note had gone stale. Keep them.
- `FilterPanel` (the page-wide diet / allergen sheet) uses the shared
  `hooks/useModal.js` for the same contract. It had **none** of it before PR 3 —
  no Escape, no trap, no focus restore, no scroll lock. `DishDialog` still carries
  its own inline copy; migrating it is a follow-up with no visible effect.
- **Trap on enabled controls only.** The focusable query must be `:not(:disabled)`.
  A disabled button can never be `document.activeElement`, so if the LAST control
  in a dialog is disabled the "wrap to first" branch never fires and Tab walks out
  into the page behind. `DishDialog` had this bug (its pinned Add button is
  disabled until a build-your-own dish has its required options) and is fixed.
- `sheet` (menu redesign PR 3) is the **mobile** shape: `100dvh − 56px`, its own
  scroller so the pinned Add bar stays put, and it closes by swipe-down and
  browser Back as well — it carries its own `?dish=<slug>` URL. The swipe only
  arms at `scrollTop === 0`, so reading the sheet never dismisses it.
- **Desktop (≥1024px) opens no dish dialog at all** (SPEC §4.5). The `grid-full`
  card is a document, not a control: description, macros, weight and allergens
  are inline, and only Add is interactive. Do not add an opener back to it.

### Tabs (`CategoryTabs`)
- `role="tablist"/tab"` + `aria-selected` (✓).
- Left/Right arrow navigation + roving `tabIndex` (✓). The arrow keys existed
  before but only moved the *selection*: DOM focus stayed on the old button,
  which had just been given `tabIndex -1`, so the ring vanished and the next
  press went nowhere. Focus now follows the move — keep it that way.
- `aria-controls` is wired when a caller passes `panelId` on a category (✓).
  **The caller owns the other half:** `role="tabpanel"` + that id on the panel,
  pointing back with `aria-labelledby={`tab-${cat.id}`}`.

### Charts (`CalorieDonut`)
- `role="img"` + numeric `aria-label` (✓ — exemplary). Keep MacroBar as the non-color-only supplement.

---

## Anti-Patterns (Do NOT Use)
- ❌ Emojis as icons → use the SVG set in `components/Icons.jsx`
- ❌ `outline:none` without the global focus shadow
- ❌ Color-only meaning (always icon/text too — diets, allergens, macros)
- ❌ Off-brand fonts (Playfair/Karla/etc.) or raw hex in components — use tokens
- ❌ Layout-shifting hovers; instant (0ms) state changes
- ❌ `--text-on-dark-faint` on small text

## Pre-Delivery Checklist (run before every PR)
- [ ] Text contrast ≥4.5:1 (recompute if you touch a token)
- [ ] All interactive els reachable + visible focus ring (keyboard only)
- [ ] Dialog: focus trapped, restored, body scroll locked
- [ ] Tabs: arrow-key nav works
- [ ] `prefers-reduced-motion` respected
- [ ] Nutrition figures use mono + tabular-nums (no layout jitter)
- [ ] Responsive 375 / 768 / 1024 / 1440; no horizontal scroll on mobile
- [ ] Images `loading="lazy"`; width/height or aspect-ratio set (no CLS)
