// English UI copy — the canonical set. Every other dictionary translates these
// keys; a key missing there falls back to the string here (see ../index.js).
// Values are verbatim what the site rendered before i18n: keep them that way.
export default {
  // language switcher
  "lang.label": "Language",

  // header / hero / page chrome
  "header.filter": "Filter menu",
  "hero.aria": "Shishka Healthy Kitchen",
  "hero.banner": "NO SEED OIL",
  // Pre-load placeholder only (i18n/localize.js initialContent); the live
  // subline comes from site_content.
  "hero.sub": "fresh, unprocessed, real food, made daily.",
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

  // synthetic sections / subgroups (not DB categories)
  "sub.springRolls": "Fresh Spring Roll",
  "sub.sides": "Sides",
  "sub.coldCoffee": "Cold Coffee",
  "sub.hotCoffee": "Hot Coffee",

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
  "filter.exclude": "Exclude allergens",
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
