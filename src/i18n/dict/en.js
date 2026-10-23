// English UI copy — the canonical set. Every other dictionary translates these
// keys; a key missing there falls back to the string here (see ../index.js).
// Values are verbatim what the site rendered before i18n: keep them that way.
export default {
  // language switcher
  "lang.label": "Language",

  // header / hero / page chrome
  "header.filter": "Filter menu",
  "hero.aria": "Shishka Healthy Kitchen",
  // Pre-load placeholders only (i18n/localize.js initialContent); the live
  // copy comes from site_content and must match these, or the hero swaps.
  "hero.banner": "CLEAN FOOD",
  "hero.title": "Honest. Delicious. No junk",
  "hero.sub": "No seed oils · no MSG · nothing ultra-processed.\nOnly fresh ingredients",
  "rule.aria": "The Rule",
  "rule.no": "no",
  "cta.aria": "Visit & order",
  "cta.whatsapp": "order on WhatsApp",
  "footer.live": "Nutrition & prices update live",
  "footer.copy": "© {year} Shishka Healthy Kitchen · Phuket",

  // menu states
  "menu.unavailable": "The menu is temporarily unavailable.",
  "menu.reload": "Reload",
  "menu.instagramBefore": "Today’s menu is always on ",
  "menu.instagramAfter": ".",
  "menu.noMatch": "No dishes match these filters.",
  "menu.clearFilters": "Clear filters",

  // badges
  "badge.comingSoon": "Coming soon",
  "badge.outOfStock": "Out of stock",
  "badge.featured": "Featured",

  // dish card / rows
  "card.addToOrder": "Add {name} to order",
  "card.priceLabel": "{name} {price} thb",
  "card.from": "from",
  "card.kcal": "kcal",
  "rows.comingSoon": "coming soon",
  "seal.currency": "thb",

  // menu redesign — DishCard variants, KcalSeal, CategoryTile (spec §5).
  // Not mounted in the app yet: PR 3 (mobile) and PR 4 (desktop) render these.
  "seal.kcalAria": "{kcal} kcal",
  "dish.inOrder": "{name} is in your order",
  "dish.highProtein": "High protein",
  "dish.soldOut": "Sold out today",
  "dish.add": "Add",
  "dish.added": "Added",
  "dish.macroProtein": "PROTEIN",
  "dish.macroCarbs": "CARBS",
  "dish.macroFat": "FAT",

  // menu redesign PR 3 — the menu page itself (spec §3, §4, §8).
  // EN ONLY so far: RU, TH and AR need a human translator before this page is
  // put in front of a guest. Missing keys fall back to English (see ../index.js),
  // so the page is correct in every language — just not yet translated.
  "menu.lede": "What are you {accent}",
  "menu.ledeAccent": "craving?",
  "menu.subline": "Clean · Ultra fresh · Nothing ultra-processed",
  "menu.group.EAT": "EAT",
  "menu.group.DRINK": "DRINK",
  "menu.group.SWEET": "SWEET",
  "menu.categories": "Menu categories",
  "menu.subcategories": "{name} subcategories",
  "menu.allSub": "All",
  "menu.from": "from {price}",
  "menu.comingSoonSection": "Coming soon",
  // The rail label for a category whose every dish is coming soon (§2).
  "menu.railSoon": "{name} · soon",

  // quick filters — only the two the data honestly supports (§7a, lib/quickFilters.js)
  "filter.under400": "Under 400 kcal",
  "filter.highProtein": "High protein",
  // The quick filters are one row for the whole menu now (lib/quickFilters.js),
  // so the per-section "nothing here matches" message is gone with them — a
  // section with no matches leaves the page instead of showing an empty grid.
  "filter.quick": "Quick filters",
  "filter.lowCarb": "Low carb",
  "filter.under150": "Under ฿150",
  // POSITIVE wording on purpose: "With seafood" lists dishes that carry it. It
  // must never read as "seafood-free" — see the note below.
  "filter.seafood": "With seafood",
  "filter.seafoodNote":
    "Shows dishes listed with fish or shellfish. Dishes not listed here may still contain them — ask our team about any allergy.",
  // A DRINK section while a nutrition filter is on. Says in words why the drinks
  // are folded away; the count renders in its own .num span so it stays LTR in
  // Arabic, which is why "Show" carries no {n}.
  "filter.drinksNote": "Calorie, protein and carb filters don’t apply to drinks.",
  "filter.drinksShow": "Show",
  "filter.drinksHide": "Hide",

  // the Filters sheet, behind the Filters button. It names no allergens.
  "filter.button": "Filters",
  "filter.buttonActive": "Filters, {n} active",
  // Label only; the figures ("74 / 81") render in their own .num span so they
  // stay left-to-right in Arabic.
  "filter.shown": "Dishes shown",

  // Open / closed status in the header (§3.1, §4.1). The LABEL and the CLOCK
  // FIGURE are separate keys on purpose: the figure renders in its own `.num`
  // span, which components.css pins to LTR under /ar — interpolated into the
  // sentence it would come out as "18:30 till Open" in Arabic.
  "status.openTill": "Open till",
  "status.openNow": "Open now",
  "status.closed": "Closed · opens",
  // Before a weekday name ("Closed · opens Thu 9:30") — a day off, or the
  // evening before one.
  "status.closedUntilDay": "Closed · opens",

  // visit us (§3.8, §4.6)
  "visit.title": "Visit us",
  "visit.hours": "Open",
  // {day} is the weekday name from Intl, already in the page language.
  "visit.closedOn": "closed {day}s",
  "visit.directions": "Get directions",

  // order bar + desktop order panel (§5, §8)
  "order.empty": "Your order · Empty",
  "order.filled.one": "{n} item · {total}",
  "order.filled.other": "{n} items · {total}",
  "cart.showAtCounter": "Show at the counter",
  "cart.emptyHint": "Nothing here yet. Tap + on any dish. Then show this list at the counter — we cook it fresh.",

  // dish sheet (§3): the pinned bottom bar with the quantity stepper
  "sheet.fewer": "Fewer",
  "sheet.more": "More",
  "sheet.qty": "Quantity",
  "sheet.addQty": "Add to order · {total}",

  // dish dialog
  "dlg.share": "Share dish",
  "dlg.close": "Close",
  "dlg.addToOrder": "Add to order",
  "dlg.pickRequired": "Pick the required options",
  "dlg.benefits": "Benefits",
  "dlg.suitableFor": "Suitable for",
  "dlg.contains": "Contains",
  "dlg.ingredients": "Ingredients",
  "dlg.disclaimer":
    "Nutrition is calculated per serving and may vary. Tell our team about any allergies — dishes are prepared in a shared kitchen.",

  // build-your-own
  "build.title": "Build your own",
  "build.reset": "Reset",
  "build.chooseOne": "choose one",
  "build.pickRange": "pick {min}–{max}",
  "build.pickAtLeast": "pick at least {min}",
  "build.pickUpTo": "pick up to {max}",
  "build.included": "Included",
  "build.total": "Total",
  "build.addons.one": "{n} add-on",
  "build.addons.other": "{n} add-ons",
  // website-side spring roll removals (useMenu.js)
  "build.no": "No {name}",

  // nutrition
  "nutri.kcal": "kcal",
  "nutri.cal": "cal",
  "nutri.noData": "No data",
  "nutri.aria": "{kcal} kilocalories. Protein {protein}g, carbs {carbs}g, fat {fat}g.",
  "nutri.ariaNone": "Nutrition not available",
  "macro.protein": "Protein",
  "macro.carbs": "Carbs",
  "macro.fat": "Fat",
  "unit.g": "g",
  "unit.ml": "ml",

  // slicer game
  "slicer.hint": "burned · {n} sliced",

  // filters
  "filter.aria": "Filter the menu",
  "filter.title": "Filters",
  "filter.close": "Close filters",
  "filter.suitableFor": "Suitable for",
  "filter.clear": "Clear",
  "filter.show": "Show {n}",
  "filter.apply": "Apply",

  // diet presets (DietTag)
  "diet.vegan": "Vegan",
  "diet.vegetarian": "Vegetarian",
  "diet.gluten-free": "Gluten-free",
  "diet.dairy-free": "Dairy-free",
  "diet.high-protein": "High protein",
  "diet.grass-fed": "Grass-fed",
  "diet.halal": "Halal",
  "diet.spicy": "Spicy",
  "diet.contains-gluten": "Gluten",
  "diet.contains-dairy": "Dairy",
  "diet.contains-nuts": "Nuts",
  "diet.contains-egg": "Egg",

  // benefits (lib/benefits.js)
  "benefit.caffeine": "Energy & Focus",
  "benefit.omega3": "Omega-3",
  "benefit.bvitamins": "Vitamin B12",
  "benefit.iron": "Iron",
  "benefit.magnesium": "Magnesium",
  "benefit.vitaminc": "Vitamin C",
  "benefit.vitamina": "Vitamin A",
  "benefit.fiber": "Fibre",
  "benefit.calcium": "Calcium",
  "benefit.healthyfats": "Healthy Fats",
  "benefit.antioxidants": "Antioxidants",
  "benefit.potassium": "Electrolytes",
  "benefit.antiinflam": "Anti-Inflammatory",
  "benefit.highProtein": "High Protein",
  "benefit.protein": "Protein",

  // potato tacos
  "tacos.title": "Potato Tacos",
  "tacos.tagline": "our signature gluten-free crust crafted from potato & rice",
  "sets.aria": "Potato Tacos sets",
  "sets.saveUpTo": "save up to",
  "sets.sub.one": "set of {count} + {n} sauce free",
  "sets.sub.other": "set of {count} + {n} sauce free",
  "sets.from": "from",
  "sets.cta": "build your set",

  // bundle dialog
  "bundle.free": "free",
  "bundle.removeOne": "Remove one {name}",
  "bundle.addOne": "Add one {name}",
  "bundle.sub.one": "Pick {count} potato tacos + {n} free sauce · save up to {pct}%",
  "bundle.sub.other": "Pick {count} potato tacos + {n} free sauces · save up to {pct}%",
  "bundle.tacos": "Potato Tacos",
  "bundle.sauceFree": "Sauce · free",
  "bundle.save": "save",
  "bundle.pickMore": "Pick {n} more potato tacos",
  "bundle.pickMoreSauce": " + {n} sauce",

  // cart
  "cart.start": "Start your order",
  "cart.viewAria": "View order, {n} items, {total}",
  "cart.order": "Order",
  "cart.view": "View order",
  "cart.title": "Your order",
  "cart.close": "Close",
  "cart.emptyTitle": "Your order is empty",
  "cart.emptySub": "Tap any dish to add it — build your order, then show the total at the counter. 🌿",
  "cart.browse": "Browse the menu",
  "cart.free": " (free)",
  "cart.remove": "Remove",
  "cart.decrease": "decrease",
  "cart.increase": "increase",
  "cart.whatYouGet": "What you'll get",
  "cart.noteLabel": "Add a note for your order",
  "cart.notePlaceholder": "Allergies, preferences, anything for our team…",
  "cart.total": "Total",
  "cart.payNote": "Pay at the counter — no online payment. Show this total to our team.",
  "cart.payNoteWithNote": "Pay at the counter — no online payment. Show this total and note to our team.",
  "cart.clear": "Clear order",
};
