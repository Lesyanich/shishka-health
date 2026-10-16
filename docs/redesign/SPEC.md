# Menu redesign — spec

Status: approved design, not started · Owner: Lesia · 2026-10-16
Mockups: `docs/redesign/mockups/` (source of truth for visuals: the "Shishka first screen: A vs B" canvas in Claude)

## 1. Summary

The menu becomes the first screen. Mobile opens on category tiles; desktop opens on the full menu
with a sticky category nav. The current `Hero` (slogan + salad-bar photo) is removed.

Why: today the first dish sits ~1160 px down on a laptop and ~1700 px on a phone. Nothing above the
fold shows food, prices, hours or address, and the floating "Order" button opens an empty cart.

| Where | Screen | What it is | Mockup |
|---|---|---|---|
| Mobile | Home | "What are you craving?" + category tiles grouped EAT / DRINK / SWEET | `A2-home-full.dc.html` |
| Mobile | Category | 2-column grid, subcategory tabs, kcal seal | `A2-cat-grid.dc.html` |
| Mobile | Dish | Bottom sheet: description, macros, allergens, Add to order | `A2-dish.dc.html` |
| Desktop | Menu (first screen) | Sticky left nav with scroll-spy, 3-column full cards, sticky cart | `D-category.dc.html` |

Desktop has no tile home and no dish pop-up: every card shows description and macros inline,
and all categories scroll as one page.

## 2. Menu structure

13 current sections collapse into 11 categories in 3 groups. Row order = order on the site.

| Group | Category (site) | Built from today | Items | Subcategories (tabs) | Mobile tile |
|---|---|---|---|---|---|
| EAT | Salads & Bowls | Salads + Bowls | 13 | All · Salads · Bowls | featured (full width) |
| EAT | Wraps | Whole Wheat Wraps | 11 | — | regular |
| EAT | Protein meals | Protein Meals | 3 | — | regular |
| EAT | All-day breakfast | All-Day Breakfast | 6 | Eggs · Toasts | regular |
| EAT | Spring rolls | Fresh Spring Roll | 4 | — | regular |
| EAT | Hummus, dips & sides | Sauce, Dressing and Dips + Extras | 8 | Hummus & dips · Sauces · Sides | row (wide, short) |
| DRINK | Coffee | Coffee | 12 | Hot · Cold | regular, `--band-drink` |
| DRINK | Matcha | Matcha | 6 | — | regular, `--band-drink` |
| DRINK | Smoothies | Smoothies | 9 | — | regular, `--band-drink` |
| DRINK | Fresh juices | Juices | 7, all coming soon | — | soon (dashed, not clickable) |
| SWEET | Chocolate | Chocolate | 6 | — | row (wide, short) |

Rules:
- Category = `section_*` in `menu_public`; subcategory = `category_*`. Groups come from `site_content`
  key `menu_groups` (group → ordered list of section ids), with a fallback in `lib/content.js`.
- Item count and "from ฿…" on a tile are computed from data (available dishes, min price).
- A category whose items are all coming soon renders as a dashed "Coming soon" tile and does not open.
  On desktop it shows greyed in the nav with "soon".
- Tabs only when a section has ≥ 2 categories. "All" is first and selected by default.

## 3. Mobile (< 1024 px)

Flow: home → category → dish sheet → cart.

Home
1. Header, 64 px, not sticky: colour logo (36 px) left; right: "● Open till 18:30" (links to Visit us)
   and EN / RU / TH switcher.
2. Title "What are you craving?" ("craving" in accent red) + line "No seed oils · No MSG · Nothing ultra-processed".
3. Groups EAT / DRINK / SWEET, tiles in a 2-column grid (variants in §5). Tap opens the category.
4. Visit us block at the end: hours, address, Directions, Instagram.
5. Order bar floats at the bottom of every screen (16 px side inset, 20 px + safe-area bottom).

Category
1. Header: back arrow (44×44) + category name. Back returns to home and restores its scroll position.
2. Subcategory tabs: full-width segmented control, sticks to top on scroll. On "All", subcategories
   follow each other with small headers.
3. Quick filters (Plant-based, Under 400 kcal, Seafood): toggles, several at once; set per category.
4. Card grid, 2 columns, gaps 12 px horizontal / 18 px vertical. Tap on photo or name opens the sheet;
   tap on "+" adds 1 immediately.
5. Exception: DRINK categories and "Hummus, dips & sides" render as a list (76 px photo left) — people
   choose those by name and price.

Dish sheet (`DishDialog` on mobile)
1. Slides up to viewport height − 56 px over `--scrim`. Closes by swipe down, ✕, scrim tap, browser back.
2. Has its own URL (`?dish=<slug>`) so a dish can be shared.
3. Top to bottom: photo 260 px → name + price → weight + sides → description → 4 tiles
   (kcal, protein, carbs, fat) → diet tags + allergens.
4. Pinned bottom bar: quantity stepper + "Add to order · ฿<price × qty>". After adding, the sheet
   closes and the order bar pulses once.

## 4. Desktop (≥ 1024 px)

The whole menu is one scrolling page; categories follow each other.

Layout: 84 px header full width; below it a grid `220px | 1fr | 320px`, gap 36 px, side padding 40 px,
content max 1440 px, centred.

1. Header: logo 48 px left; right: "● Open now · daily 9:30–18:30", "Rawai, Phuket" (map link),
   segmented EN / RU / TH.
2. Left nav is sticky (`top: 24px`). Categories grouped EAT / DRINK / SWEET with item counts.
   Click smooth-scrolls to the section and updates the hash (`#wraps`).
3. Scroll-spy: the highlighted item (red pill) is the section whose heading last crossed 30 % of the
   viewport height. Use IntersectionObserver on section headings, not a scroll listener.
4. Section: H2 40 px, line "13 dishes · from ฿149", subcategory tabs + filters on one row, then a
   3-column grid (gap 20 px, row gap 36 px). 64 px between sections. First section starts right
   under the header — no hero.
5. Dish card shows everything inline, no pop-up: photo with kcal seal, name + price, description,
   3 macro tiles, weight + allergens, Add button.
6. Right column is sticky: Your order, and under it Visit us (hours, address, Get directions).
7. DRINK and dips on desktop: 4-column grid with a 1-line description. Open question: do they need
   macros, or are kcal + price enough?

## 5. Components

Reuse what exists in `src/components/`; new: `CategoryTile`, the desktop side nav. Remove `Hero`.

| Component | Today | Variants | States | Sizes |
|---|---|---|---|---|
| `CategoryTile` | new | featured (full width, 2 photos), regular, row (wide, short), soon (dashed) | default, pressed (scale .98), soon = not clickable | mobile: featured 156, regular 132, row 84 px; desktop home not used |
| `DishCard` | exists | grid-compact (mobile: photo, name, price), grid-full (desktop: + description, macros, weight, allergens), list-row (drinks, dips) | default, in-cart (+ → stepper or check), unavailable (photo 50 % opacity, "Sold out today"), coming-soon | photo: mobile 150, desktop 210 px, `object-fit: contain` on `--surface-2` |
| `KcalSeal` | rename/variant of `PriceSeal` | md 62 (mobile), lg 70 (desktop), xl 84 (sheet) | — | SVG, 24 teeth, radii 31.5 / 26.5 in a 64 viewBox, white circle r 24.5; kcal number + small "kcal" |
| High-protein badge | `Badge` | — | only when protein ≥ 30 g | pill `--accent`/red, white 12/800, photo top-left |
| `CategoryTabs` | exists | — | selected (royal-green fill), default | 40 px, container `--surface-2`, pill |
| `FilterChip` | exists | — | off, on (`--green-100` fill, royal-green border) | 36–40 px |
| Order bar (mobile) | `Cart` FAB | — | empty ("Your order · Empty"), filled ("N items · ฿X"), pulse on add | 58 px pill, royal-green |
| Order panel (desktop) | `Cart` | — | empty (icon + "Tap + on any dish…"), filled (list, total ฿ and kcal, "Show at the counter") | 320 px, radius 26 |
| `DishDialog` → sheet | exists | — | open, closing (swipe), qty 1–20 | see §3 |

Accessibility (MASTER.md applies): real `<button>`/`<a>`, targets ≥ 44 px, `aria-label` on icon
buttons ("Add Chicken Caesar"), tabs with arrow-key nav + roving tabindex, dialog with focus trap,
focus restore and body scroll lock, seal read as "559 kcal", `prefers-reduced-motion` respected.

## 6. Tokens

No new colours except one. Use semantic tokens only.

| Role | Token | Value |
|---|---|---|
| Main text, buttons, seal | `--royal-green` | #1E3903 |
| Secondary text | `--text-muted` | rgba(30,57,3,.70–.80) |
| Accent: current category, High protein, "craving" | red accent (`--red-600`) | #B62A23 |
| Card and food-tile background | `--surface-2` | #F4F8EC |
| Featured tile, kcal pill | `--green-100` | #E7EFD6 |
| DRINK tiles (new) | `--band-drink` | #FBF4E6 |
| SWEET tile | `--cream-100` | #F5EEDF |
| Open status dot | — | #3F8A2A (closed: `--ink-400`) |
| Sheet backdrop | `--scrim` | rgba(20,22,13,.55) |

Type (SF Pro / Albert Sans; numbers mono + tabular-nums per MASTER):

| Style | Mobile | Desktop |
|---|---|---|
| Page title | 28 / 800, −0.025em | 40–56 / 800, −0.03em |
| Tile name | 17 / 800 (featured 26) | — |
| Dish name | 15 / 700 | 18 / 800 |
| Price | 18 / 800 | 20 / 800 |
| Description | 13–15 / 400, lh 1.45 | 14 / 400, lh 1.45 |
| Group label (EAT) | 12 / 800, tracking .16em | 12–13 / 800 |

Radii: tiles 22–30 px, card photos 22–26, macro tiles 12–16, buttons and chips `--radius-pill`.
Spacing: `--sp-*` scale, mobile gutter 16 px, desktop 40 px. One breakpoint: 1024 px
(still verify 375 / 768 / 1024 / 1440 per MASTER).

## 7. Data

Almost everything is already in `menu_public`, read by `src/hooks/useMenu.js`
(contract: `contracts/menu-contract.json`). No new DB column is needed.

| Shown | Field / source | Rule |
|---|---|---|
| Group EAT / DRINK / SWEET | `site_content.menu_groups` | data in DB, fallback in `lib/content.js` |
| Category | `section_id`, `section_name`, `section_sort_order` | Salads + Bowls under one section (admin) |
| Subcategory (tabs) | `category_name`, `category_sort_order` | tabs when ≥ 2 categories in a section |
| Photo | `customer_photo_url`, else `image_url` | `contain` on `--surface-2`; none → placeholder `aria-hidden` |
| Name, description | `customer_short_name` / `name`, `customer_description` | desktop description `line-clamp: 3` |
| Price | `price` | "฿159" |
| kcal, macros | `calories`, `protein`, `carbs`, `fat` | mono + tabular-nums |
| Weight | `portion_size` + `portion_unit` | missing → hidden |
| Allergens | tags with `tag_group = 'allergen'` | lower case, comma-separated |
| Plant-based and other diets | other tags (diets) | filter by tag slug; tag set by a person in admin |
| High protein | `protein ≥ 30` (align with `lib/benefits.js`) | one rule for badge and benefits |
| Seafood filter | allergens fish / crustacean / shellfish | automatic |
| Under 400 kcal | `calories` | automatic |
| Featured | `is_featured`, `display_order` | ordering only, no "FEATURED" label |
| Sold out / coming soon | `stock_state`, existing coming-soon logic | `DishCard` states |

The `SALE-SUMMER_ROLLS` prefix hack in `useMenu.js` goes away once Spring rolls is a real section;
update the `spring-rolls-section` assertion in the contract in the same PR.

## 8. Copy and content

Content fixes are data (admin panel / `/chef`), not code.

| What | Now | Should be |
|---|---|---|
| Description case | "Baked Chickpea Falafel on Hummus, Folded into a…" | "Baked chickpea falafel on hummus, folded into a…" |
| Typo | Daynamite Sauce | Dynamite Sauce |
| Typo | Chicken ShishTawook Wrap | Chicken Shish Tawook Wrap |
| Swapped description | Dynamite Sauce: "chickpeas and tahini blended…" | the real Dynamite description |
| Swapped description | Honey-Mustard Sauce: "Greek yogurt loosened with raw tahini…" | the real honey-mustard description |
| Case in THE RULE | "no Seed Oils", "Gluten FREE options", "no Fake Food" | "No seed oils", "Gluten-free options", "No fake food" |
| Price unit | "159 thb" | "฿159" |

New UI strings (EN, RU, TH; defaults in `lib/content.js`, overridable in `site_content`):
- What are you craving?
- No seed oils · No MSG · Nothing ultra-processed
- EAT · DRINK · SWEET · FROM OUR SALAD BAR · COMING SOON
- Open till 18:30 / Open now · daily 9:30–18:30 / Closed · opens 9:30
- Your order · Empty / N items
- Nothing here yet. Tap + on any dish. Then show this list at the counter — we cook it fresh.
- Add to order · ฿X / Show at the counter / Get directions / High protein
- Filters: Plant-based · Under 400 kcal · Seafood

## 9. Work plan

Step 0 is data in the admin panel, no code. Then 4 PRs in this repo, each on its own
`feature/web/menu-redesign-pr<N>` branch, reviewed on a preview before the next. Every UI PR updates
`design-system/index.html` and passes `npm run build`, `ds:check`, `contract:check`, `boundary:check`
and the MASTER.md pre-delivery checklist.

- [ ] **Step 0 — Data (admin / `/chef`, no code).** Section "Salads & Bowls" with categories Salads and
      Bowls; Extras into the "Dips & sides" section; Spring rolls as its own section; `menu_groups` in
      `site_content`; plant-based tag on the right dishes; fixes from §8. If sections need a migration,
      it goes to `shishka-os`.
- [ ] **PR 1 — Data in site code.** `useMenu.js`: groups from `menu_groups` with fallback; drop the
      Spring rolls hack (+ contract); helpers for item count, min price, isHighProtein, isSeafood.
      No visual change.
- [ ] **PR 2 — Components.** `PriceSeal` → `KcalSeal`, `DishCard` variants, new `CategoryTile`,
      `CategoryTabs` arrow keys, `FilterChip` + sections in `design-system/index.html`.
- [ ] **PR 3 — Mobile.** Tile home, category page, `DishDialog` as a sheet with `?dish=`, order bar.
- [ ] **PR 4 — Desktop.** Single scrolling menu, left nav with scroll-spy, sticky `Cart`, full cards.
      Remove `Hero`. New UI strings as fallbacks in `lib/content.js`.
