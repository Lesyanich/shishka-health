# Menu redesign — spec

Status: approved, PR 2 open · Owner: Lesia · revised 2026-10-17 (first written 2026-10-16)
Mockups: `docs/redesign/mockups/` — the A2 tile-home frames are **superseded**, see §0. The dish
card, the dish sheet and `D-category` still hold.

## 0. What changed on 2026-10-17, and why

The 2026-10-16 draft opened mobile on a screen of category tiles. That is dropped. Three findings,
each checked against the live database rather than assumed:

| Finding | Evidence |
|---|---|
| **The tile home has no art to run on.** | Dish photos: **81 of 81**. Category `hero_image_url`: **4 of 10** — and **0 of 4** in DRINK. |
| **A photoless tile home defeats its own premise.** | §1 exists because nothing above the fold shows food. Ten empty coloured rectangles show no food either, and cost a tap before the first dish. |
| **Spring rolls no longer exist.** | All four `SALE-SUMMER_ROLLS_*` renamed `[ARCHIVED]` on 2026-10-16 (OS migration 480). The `useMenu.js` hack and the `spring-rolls-section` contract assertion were removed with them. 11 categories → 10. |

So mobile gets the same shape as desktop: **one scrolling menu with a sticky category nav**. Measured
on the real menu: first dish photo at **303 px**, whole page **~10 700 px (~13 phone screens)**.

That length is the honest cost of this decision. The sticky rail is therefore not decoration — it is
the only way to reach the end of the menu, and it has to work.

`CategoryTile` (built in PR 2) stays in the design system **unmounted**, ready for the day category
photography exists. It is not deleted.

## 1. Summary

The menu becomes the first screen, on both platforms. The current `Hero` (slogan + salad-bar photo)
is removed.

Why: today the first dish sits ~1160 px down on a laptop and ~1700 px on a phone. Nothing above the
fold shows food, prices, hours or address, and the floating "Order" button opens an empty cart.

| Where | Screen | What it is | Mockup |
|---|---|---|---|
| Mobile | Menu (first screen) | Sticky category rail on top, sections scroll as one page | — (see `preview-scroll.html` built 2026-10-17) |
| Mobile | Dish | Bottom sheet: description, macros, allergens, Add to order | `A2-dish.dc.html` |
| Desktop | Menu (first screen) | Sticky **left** nav with scroll-spy, 3-column full cards, sticky cart | `D-category.dc.html` |

One model, two placements of the nav: a rail on top under 1024 px, a column on the left above it.
Desktop has no dish pop-up; mobile keeps one, because its cards cannot show everything inline.

## 2. Menu structure

12 live sections collapse into 10 categories in 3 groups. **Group order: EAT → DRINK → SWEET.**
Row order = order on the page.

| Group | Category (site) | Built from today | Items | Subcategories (tabs) | Layout |
|---|---|---|---|---|---|
| EAT | Salads & Bowls | Salads + Bowls | 13 | All · Salads · Bowls | grid |
| EAT | Wraps | Whole Wheat Wraps | 11 | — | grid |
| EAT | Protein meals | Protein Meals | 3 | — | grid |
| EAT | All-day breakfast | All-Day Breakfast | 6 | Eggs · Toasts | grid |
| EAT | Hummus, dips & sides | Sauce, Dressing and Dips + Extras | 8 | Hummus & dips · Sauces · Sides † | list |
| DRINK | Coffee | Coffee | 12 | Hot · Cold ‡ | list |
| DRINK | Matcha | Matcha | 6 | — | list |
| DRINK | Smoothies | Smoothies | 9 | — | list |
| DRINK | Fresh juices | Juices | 7, all coming soon | — | list |
| SWEET | Chocolate | Chocolate | 6 | — | grid |

† **These subcategories do not exist.** The dips section is two flat categories today — "🥫 Sauce,
Dressing and Dips" and "🍽️ Extras" — with no Hummus / Sauces split. Step 0 must create them, or the
section ships without tabs. Do not assume the data is there.

‡ **Coffee's Hot / Cold tabs are synthesized in code**, not read from `category_*`: `useMenu.js`
regex-matches 🧊 / "iced" / "cold" / "tonic" on the dish name (plus two product codes by hand), and
`contracts/menu-contract.json` guards it with the `coffee-split` assertion. Keep or replace that
deliberately — it is the last hack of the kind the Spring-rolls one belonged to.

Rules:
- Category = `section_*` in `menu_public`; subcategory = `category_*`, except Coffee (see ‡). Groups
  come from `site_content` key `menu_groups`, with a fallback in the site code. **The shape is an
  ordered ARRAY, not an object keyed by group name** — key order in a JSON object is not guaranteed,
  and EAT → DRINK → SWEET is the one thing this key exists to preserve:

  ```json
  { "groups": [ { "key": "EAT",   "sections": ["<section_id>", "…"] },
                { "key": "DRINK", "sections": ["…"] },
                { "key": "SWEET", "sections": ["…"] } ] }
  ```

  Read it in that order and render it in that order; do not sort it, and do not fall back to
  `section_sort_order` for the GROUP order (it orders sections within the page, not the groups).
  Written by shishka-os migration 500.
- **Item counts are not shown** anywhere: not in the rail, not in a section header. They are volatile
  (a dish going `coming_soon` changes them) and a small number undersells a category. `from ฿…` stays —
  price is a real decision input. Counts remain available to code for ordering and empty checks.
- A category whose items are all coming soon shows in the rail as "<name> · soon", and its section
  header reads "Coming soon" in place of `from ฿…`. Its dishes still render, without an Add button.
- Tabs only when a section has ≥ 2 categories. "All" is first and selected by default.
- `grid` = 2 columns of `grid-compact` cards. `list` = `list-row`. Drinks and dips are chosen by name
  and price, not by picture — and they are also where category photography is absent.

## 3. Mobile (< 1024 px)

Flow: menu → dish sheet → cart. There is no home screen to go back to.

1. Header, 64 px, not sticky: colour logo (36 px) left; right: "● Open till 18:30" (links to Visit us)
   and EN / RU / TH switcher.
2. Title "What are you craving?" ("craving" in accent red) + line
   "Clean · Ultra fresh · Nothing ultra-processed".
   ("Clean" carries over the word from the retired `CLEAN FOOD` hero banner, which dies with `Hero`.)
3. **Sticky category rail**: the existing `.shk-tabs` pill rail, horizontally scrollable, pinned to the
   top. Tapping a pill smooth-scrolls to that section. The rail scrolls itself so the active pill stays
   in view — by its own `scrollLeft`, never `scrollIntoView`, which would move the page too.
4. **Scroll-spy** marks the active pill: the section whose heading last crossed **30 %** of the viewport
   height. `IntersectionObserver`, never a scroll listener. Implementation that works: observe the
   *sections* with `rootMargin: "-30% 0px -69% 0px"`, leaving a 1 %-tall band on the 30 % line. Sections
   are contiguous and tall, so exactly one crosses the band at any moment — no "nearest heading" maths,
   no jitter. (A 0 %-tall band is degenerate; hence 69, not 70.)
5. Group labels EAT / DRINK / SWEET sit between sections as quiet eyebrows, not as navigation.
6. Section: H2 24 px, `from ฿…` under it, subcategory tabs and quick filters, then the grid or list.
7. Quick filters (Plant-based, Under 400 kcal, Seafood): toggles, several at once; set per section.
8. Visit us block at the end: hours, address, Directions, Instagram.
9. Order bar floats at the bottom of every screen (16 px side inset, 20 px + safe-area bottom).

Dish sheet (`DishDialog` on mobile)
1. Slides up to viewport height − 56 px over `--scrim`. Closes by swipe down, ✕, scrim tap, browser back.
2. Has its own URL (`?dish=<slug>`) so a dish can be shared.
3. Top to bottom: photo 260 px → name + price → weight + sides → description → 4 tiles
   (kcal, protein, carbs, fat) → diet tags + allergens.
4. Pinned bottom bar: quantity stepper + "Add to order · ฿<price × qty>". After adding, the sheet
   closes and the order bar pulses once.

## 4. Desktop (≥ 1024 px)

The whole menu is one scrolling page; categories follow each other. Same model as mobile, nav moved.

Layout: 84 px header full width; below it a grid `220px | 1fr | 320px`, gap 36 px, side padding 40 px,
content max 1440 px, centred.

1. Header: logo 48 px left; right: "● Open now · daily 9:30–18:30", "Rawai, Phuket" (map link),
   segmented EN / RU / TH.
2. Left nav is sticky (`top: 24px`). Categories grouped EAT / DRINK / SWEET, **without counts**.
   Click smooth-scrolls to the section and updates the hash (`#wraps`).
3. Scroll-spy: identical rule and identical implementation to §3.4 — one module, two placements.
4. Section: H2 40 px, `from ฿…`, subcategory tabs + filters on one row, then a 3-column grid
   (gap 20 px, row gap 36 px). 64 px between sections. First section starts right under the header.
5. Dish card shows everything inline, no pop-up: photo with kcal seal, name + price, description,
   3 macro tiles, weight + allergens, Add button.
6. Right column is sticky: Your order, and under it Visit us (hours, address, Get directions).
7. DRINK and dips on desktop: 4-column grid with a 1-line description. Open question: do they need
   macros, or are kcal + price enough?

## 5. Components

Reuse what exists in `src/components/`. Remove `Hero`. **Shipped in PR 2** (`design-system/index.html`
has a live demo of each): `KcalSeal`, `DishCard` variants, `CategoryTile`, segmented `CategoryTabs`,
`FilterChip` states.

| Component | Today | Variants | States | Sizes |
|---|---|---|---|---|
| `DishCard` | exists | grid-compact (mobile: photo, name, price), grid-full (desktop: + description, macros, weight, allergens), list-row (drinks, dips) | default, in-cart (+ → check), unavailable (photo 50 % opacity, "Sold out today"), coming-soon | photo: mobile 150, desktop 210 px, `object-fit: contain` on `--surface-2` |
| `KcalSeal` | new, sibling of `PriceSeal` | md 62 (mobile), lg 70 (desktop), xl 84 (sheet) | non-interactive, `role="img"` | SVG, 24 teeth, radii 31.5 / 26.5 in a 64 viewBox, solid face r 24.5 |
| High-protein badge | `shk-dish__hp` | — | only when protein ≥ 30 g | pill `--accent`, cream 12/800, photo top-left |
| `CategoryTabs` | exists | default rail (now also the sticky category nav), segmented (subcategories) | selected (royal-green fill), default | 40 px, container `--surface-2`, pill |
| `FilterChip` | exists | — | off, on (`--green-100` fill, royal-green border) | 36–40 px |
| Order bar (mobile) | `Cart` FAB | — | empty ("Your order · Empty"), filled ("N items · ฿X"), pulse on add | 58 px pill, royal-green |
| Order panel (desktop) | `Cart` | — | empty (icon + "Tap + on any dish…"), filled (list, total ฿ and kcal, "Show at the counter") | 320 px, radius 26 |
| `DishDialog` → sheet | exists | — | open, closing (swipe), qty 1–20 | see §3 |
| `CategoryTile` | **built, not mounted** | featured, regular, row, soon | — | held for a tile home once category photos exist |

`PriceSeal` is **not** renamed: it still serves `DishRows` and `ManakishTiers`. `KcalSeal` is a sibling.

Accessibility (MASTER.md applies): real `<button>`/`<a>`, targets ≥ 44 px, `aria-label` on icon buttons
("Add Chicken Caesar"), tabs with arrow-key nav + roving tabindex **that carries focus**, dialog with
focus trap, focus restore and body scroll lock, seal read as "559 kcal", `prefers-reduced-motion`
respected. A card exposes exactly two tab stops — the dish name and Add — and never nests one control
inside another.

## 6. Tokens

No new colours except the two below. Use semantic tokens only.

**The site renders light** — `tokens/theme-light.css` is imported last; `theme-royal.css` is not
imported at all. Verify contrast against `#FFFFFF`. (MASTER.md said the opposite until 2026-10-17.)

| Role | Token | Value |
|---|---|---|
| Main text, buttons, seal | `--text-strong` / `--seal-ink` → `--royal-green` | #1E3903 |
| Secondary text | `--text-muted` | rgba(30,57,3,.70) |
| Accent: current category, High protein, "craving" | `--accent` → `--red-600` | #B62A23 |
| Card and photo-box background | `--surface-2` | #F4F8EC |
| Featured tile, kcal pill | `--green-100` (= `--surface-3`) | #E7EFD6 |
| DRINK tiles (**added PR 2**) | `--band-drink` | #FBF4E6 |
| SWEET tile | `--cream-100` | #F5EEDF |
| Open status dot | **no token yet — must be added** | #3F8A2A (closed: `--ink-400`) |
| Sheet backdrop | `--scrim` | rgba(20,22,13,.55) |

Type (SF Pro / Albert Sans). Numbers take `tabular-nums` but **not** `.shk-data`'s mono family: the
brand sets prices and seals in the sans display face.

| Style | Mobile | Desktop |
|---|---|---|
| Page title | 28 / 800, −0.025em | 40–56 / 800, −0.03em |
| Section H2 | 24 / 800, −0.02em | 40 / 800 |
| Dish name | 15 / 700 | 18 / 800 |
| Price | 18 / 800 | 20 / 800 |
| Description | 13–15 / 400, lh 1.45 | 14 / 400, lh 1.45 |
| Group label (EAT) | 12 / 800, tracking .16em | 12–13 / 800 |

Radii: card photos 22–26, macro tiles 12–16, buttons and chips `--radius-pill`.
Spacing: `--sp-*` scale, mobile gutter 16 px, desktop 40 px. One breakpoint: 1024 px
(still verify 375 / 768 / 1024 / 1440 per MASTER).

## 7. Data

Everything is already in `menu_public`, read by `src/hooks/useMenu.js`
(contract: `contracts/menu-contract.json`). **No new DB column is needed.**

| Shown | Field / source | Rule |
|---|---|---|
| Group EAT / DRINK / SWEET | `site_content.menu_groups` | ordered array `{groups:[{key,sections[]}]}` — see §2; data in DB, fallback in site code |
| Category | `section_id`, `section_name`, `section_sort_order` | Salads + Bowls under one section (Step 0) |
| Subcategory (tabs) | `category_name`, `category_sort_order` | tabs when ≥ 2 categories in a section |
| Photo | `customer_photo_url`, else `image_url` | `contain` on `--surface-2`; 81/81 dishes have one |
| Name, description | `customer_short_name` / `name`, `customer_description` | desktop description `line-clamp: 3` |
| Price | `price` | "฿159" |
| kcal, macros | `calories`, `protein`, `carbs`, `fat` | tabular-nums |
| Weight | `portion_size` + `portion_unit` | missing → hidden |
| Allergens | tags with `tag_group = 'allergen'` | lower case, comma-separated |
| Plant-based | tag `plant-based` | **to be created** — see Step 0 |
| High protein | `protein >= 30`, computed | one rule for badge and benefits; the `high-protein` **tag is not used** |
| Seafood filter | allergens fish / crustacean / shellfish | automatic |
| Under 400 kcal | `calories` | automatic |
| Featured | `is_featured`, `display_order` | ordering only, no "FEATURED" label |
| Sold out / coming soon | `stock_state` | `DishCard` states |

## 8. Copy and content

Content fixes are data (admin panel / `/chef`), not code.

| What | Now | Should be |
|---|---|---|
| Subline | "No seed oils · No MSG · Nothing ultra-processed" | **"Clean · Ultra fresh · Nothing ultra-processed"** |
| Typo | Daynamite Sauce | Dynamite Sauce |
| Wrong description | `SALE-SAUCE_HUMMUS` "Dynamite Sauce" carries the **hummus** text (and duplicates the real Hummus dish) | the real Dynamite description — **to be written** |
| Wrong description | `SALE-SAUCE_YOGURT_TAHINI` "Honey-Mustard Sauce" carries the **yogurt-tahini** text | the real honey-mustard description — **to be written** |
| Duplicate name | "Chicken ShishTawook Wrap" is on **two** dishes: `SALE-TOAST_CHICKEN_TAWOOK` and `SALE-PROTEIN_MEAL_CHICKEN` (skewers on flatbread, not a wrap) | two distinct names; fix the spacing to "Shish Tawook" |
| Case in THE RULE | `"Gluten FREE options"` | "Gluten-free options" (the other `rule` items are already lower case) |

The 2026-10-16 draft read the two sauces as *swapped descriptions*. They are not: each description
matches its own `product_code`, and it is the **names** that were changed without the text following.
The CEO confirmed the names are the intended ones, so the descriptions are what must be rewritten.

New UI strings live in **`src/i18n/dict/{en,ru,th}.js`** (EN canonical, missing keys fall back to EN),
overridable in `site_content`. The 2026-10-16 draft said `lib/content.js`; that predates the i18n layer.
PR 2 added the EN keys for the card, seal and tile. **RU and TH are still missing and need a human
translator before PR 3 puts these in front of a guest.**

Strings: What are you craving? · Clean · Ultra fresh · Nothing ultra-processed · EAT · DRINK · SWEET ·
COMING SOON · Open till 18:30 / Open now · daily 9:30–18:30 / Closed · opens 9:30 · Your order · Empty /
N items · "Nothing here yet. Tap + on any dish. Then show this list at the counter — we cook it fresh." ·
Add to order · ฿X · Show at the counter · Get directions · High protein ·
Filters: Plant-based · Under 400 kcal · Seafood

## 9. Work plan

Step 0 is data, no code. Then 3 PRs in this repo, each on its own `feature/web/menu-redesign-pr<N>`
branch, reviewed on a preview before the next. Every UI PR updates `design-system/index.html` and passes
`npm run build`, `ds:check`, `contract:check`, `boundary:check` and the MASTER.md pre-delivery checklist.

- [ ] **Step 0 — Data.** Two halves, and they are not the same job.
  - *Migration in `shishka-os`* (tree structure in `product_categories`; the admin panel does not edit it):
    new section "Salads & Bowls" with 🥗 Salads (`f8fc367e`) and 🍜 Bowls (`e187f37e`) re-parented under
    it as subcategories; 🍽️ Extras (`1675790d`, 2 dishes) re-parented under 🥫 Sauce, Dressing and Dips
    (`ce2f9959`) and renamed "Sides"; the `menu_groups` row in `site_content`. Claim the migration number
    with the allocator (`claim_migration_number`, MC `c520decf`) — never by eye. **This is shishka-os
    migration 500**, which also renumbers `section_sort_order` (live EAT 1–5, DRINK 24–27) so the data
    agrees with §2 — that reorders the section list in the admin panel too, which the CEO accepted.
  - *By hand in admin / `/chef`*: the §8 copy fixes; a new `plant-based` tag (group `dietary`) — it does
    not exist, and `vegan` (57) / `vegetarian` (62) are not the same set; the two sauce descriptions.
  - *Deferred by the CEO*: cleaning up the `high-protein` tag, after every dish's real macros are checked.
    Today 16 menu dishes have protein ≥ 30 and **none** of them carries the tag. Code ignores the tag.
- [x] **PR 2 — Components.** `KcalSeal`, `DishCard` variants, `CategoryTile`, `CategoryTabs` focus fix +
      segmented variant, `FilterChip` states, `--band-drink`, guide sections, MASTER theme correction.
      Open as #68.
- [ ] **PR 1 — Data in site code.** `useMenu.js`: groups from `menu_groups` with fallback — read the
      **ordered array** shape in §2, and keep the fallback in the same shape so the two paths cannot
      disagree about group order; helpers for
      min price, isHighProtein, isSeafood. Delete the dead `SALE-BAKED_POTATO_SIDE` → "🥔 Sides" branch
      (that dish is not in `menu_public`, so the branch never fires) and the leftover `sub.springRolls`
      keys in `src/i18n/dict/*` plus the `sec-spring-rolls` case in `i18n/localize.js`. Decide what to do
      with the Coffee hot/cold synthesis (‡ in §2). No visual change. *(The Spring-rolls hack itself and
      its contract assertion are already gone — removed 2026-10-16 with the rolls.)*
- [ ] **PR 3 — The menu page.** Mobile and desktop together, because they are now one thing: sections
      rendered as one scrolling page, the scroll-spy module (§3.4) used by the mobile rail and the
      desktop left nav, sticky `Cart`, `DishDialog` as a sheet with `?dish=` on mobile, full cards on
      desktop, order bar. Remove `Hero`. New UI strings as EN fallbacks.
