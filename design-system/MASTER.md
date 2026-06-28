# Design System Master File — Shishka Web (showcase)

> **LOGIC:** When building a page, first check `design-system/pages/[page-name].md`.
> If it exists, its rules **override** this Master. Otherwise follow the rules below.
>
> This Master is the brand source of truth. It was seeded by ui-ux-pro-max, then
> overwritten with Shishka's real design tokens. Do NOT replace brand values with
> the skill's generic defaults — the skill is used here for *rules + audit*, not palette.

**Project:** Shishka Web · **Category:** Restaurant / Healthy Food · **Theme:** **royal-green dark** — one continuous `#1E3903` canvas with cream reversed-out text. `tokens/theme-royal.css` is imported **last** and overrides the light base everywhere; the light tokens still exist but are not what renders. Verify all contrast against `#1E3903`, never against cream.
**Brand line:** "from the SOIL to the SOUL"

---

## Color Palette — reference SEMANTIC tokens in UI, never raw scale

Source: `src/styles/tokens/colors.css`; the active surface/text/border aliases come from `tokens/theme-royal.css`. **The whole UI renders on royal green** — pairs below are verified against `#1E3903`.

| Role | Token | Value |
|------|-------|-------|
| Page canvas (everywhere) | `--bg-canvas` / `--bg-page` | `#1E3903` royal-green |
| Raised surfaces (cards/sheets) | `--surface-1/2/3` | `#46521D` · `#3C481A` · `#56641F` |
| Energy red (accent/CTA) | `--accent` → `--red-600` | `#B62A23` |
| Antioxidant purple (order/feature) | `--brand-purple` → `--purple-700` | `#511A52` |
| Strong text | `--text-strong` | `#FBF8F0` cream |
| Body text | `--text-body` | `rgba(251,248,240,.86)` |
| Muted text | `--text-muted` | `rgba(251,248,240,.62)` |
| Faint text | `--text-faint` | `rgba(251,248,240,.45)` |
| Price (gold) | `--menu-price` → `--honey-300` | `#F0CE83` |
| Kcal (mint) | `--menu-kcal` → `--green-200` | `#CCDAAE` |
| Hairlines | `--border` / `--border-strong` | `rgba(255,255,255,.14 / .26)` |

**Verified contrast — measured against the live royal canvas `#1E3903`** (recompute with `design-system/` scripts if a token changes):
- `--text-strong` cream → **12.05:1** ✓ AAA
- `--text-body` (cream α.86) → **9.31:1** ✓ AAA
- `--text-muted` (cream α.62) → **5.61:1** ✓ AA — use ≥14px
- `--menu-price` honey-300 → **8.44:1** ✓ AAA · `--menu-kcal` green-200 → **8.65:1** ✓ AAA
- white on `--accent` red-600 (buttons) → **6.28:1** ✓ AA · white on purple-700 (order FAB) → **12.97:1** ✓ AAA
- ⚠️ `--text-faint` (cream α.45) → **3.71:1** — **large text only** (≥24px / ≥18.6px bold); never small captions. Raise to ~.58 (≈4.6:1) for small.
- ⚠️ **On raised surfaces** (`--surface-3` #56641F, the lightest): cream drops — `--text-body` → **5.01:1** ✓ but `--text-muted` → **3.46:1 FAIL** for small text. Keep muted captions on the canvas; on cards use `--text-body`/`--text-strong`.

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
- MUST stay a real `<button type="button">` (current ✓ — keyboard/Enter/Space free).
- `loading="lazy"` on images (✓). Placeholder gets `aria-hidden` + empty `alt` (✓).
- Hover lift via transform only, no layout shift; 150–300ms.

### Modal (`DishDialog`)
- `role="dialog"` + `aria-modal` + `aria-label` (✓), Escape closes (✓), scrim click closes (✓).
- **REQUIRED additions (currently missing):**
  - Move focus into the dialog on open; restore focus to trigger on close.
  - Trap Tab focus inside the dialog.
  - Lock body scroll (`overflow:hidden`) while open.

### Tabs (`CategoryTabs`)
- `role="tablist"/tab"` + `aria-selected` (✓).
- **REQUIRED additions:** Left/Right arrow-key navigation + roving `tabIndex`; link `aria-controls` → the panel and give the panel `role="tabpanel"`.

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
