# Design System Master File — Shishka Web (showcase)

> **LOGIC:** When building a page, first check `design-system/pages/[page-name].md`.
> If it exists, its rules **override** this Master. Otherwise follow the rules below.
>
> This Master is the brand source of truth. It was seeded by ui-ux-pro-max, then
> overwritten with Shishka's real design tokens. Do NOT replace brand values with
> the skill's generic defaults — the skill is used here for *rules + audit*, not palette.

**Project:** Shishka Web · **Category:** Restaurant / Healthy Food · **Theme:** light-default, dark feature sections
**Brand line:** "from the SOIL to the SOUL"

---

## Color Palette — reference SEMANTIC tokens in UI, never raw scale

Source: `src/styles/tokens/colors.css`. All pairs below verified ≥4.5:1 (WCAG AA) unless flagged.

| Role | Token | Value |
|------|-------|-------|
| Brand green (surface/signage) | `--brand-green` → `--green-700` | `#3A4A1C` |
| Energy red (accent/CTA) | `--accent` → `--red-600` | `#B62A23` |
| Antioxidant purple (feature) | `--brand-purple` → `--purple-700` | `#511A52` |
| Warm white / cream | `--brand-cream` → `--cream-100` | `#F5EEDF` |
| Honey/amber (functional warn) | `--honey-600` | `#C8901F` |
| Page background | `--bg-canvas` → `--cream-50` | `#FBF8F0` |
| Card surface | `--bg-surface` | `#FFFFFF` |
| Dark hero | `--bg-dark` → `--green-700` | `#3A4A1C` |
| Body text | `--text-body` → `--ink-700` | `#3B3F31` (10.2:1 on canvas ✓) |
| Muted text | `--text-muted` → `--ink-500` | `#6B6E5F` (4.9:1 ✓, use ≥14px) |
| Text on dark | `--text-on-dark` → `--cream-50` | `#FBF8F0` |

**Verified contrast (against real tokens):**
- white on `--accent` red-600 → 6.28:1 ✓ · white on purple-700 → 12.97:1 ✓
- `--text-on-dark-muted` (0.70) on green-700 → 5.42:1 ✓
- ⚠️ `--text-on-dark-faint` (rgba 0.45) on green-700 → **3.21:1 FAIL** for body. Allowed ONLY as large text (≥24px / ≥18.6px bold). For small captions raise alpha to ~0.58.

## Typography

Source: `src/styles/tokens/{fonts,typography}.css`. **Brand face = SF Pro**, web fallback **Albert Sans** (CDN). Arabic = Noto Kufi Arabic.
DO NOT switch to Playfair/Karla (the skill's restaurant default) — off-brand here.

- `--font-display` (tight, often UPPERCASE "stamp"): hero/display/title
- `--font-sans` (Albert Sans / SF Pro): body, eyebrows
- `--font-mono` + `tabular-nums`: all nutrition figures / prices (`.shk-data`)
- Scale: 11 → 12 → 14 → 16 → 18 → 22 → 28 → 36 → 48 → 64 → 88
- Body line-height `--leading-relaxed` 1.65; min body 16px (mobile, avoids iOS zoom)

## Spacing & Effects
- 4/8px rhythm: `--space-xs..3xl` (`src/styles/tokens/spacing.css`)
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
