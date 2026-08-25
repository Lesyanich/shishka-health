/*
  BUILD YOUR OWN — the component catalog behind the in-restaurant board.

  ---------------------------------------------------------------------------
  WHY THIS FILE EXISTS AS A FILE
  ---------------------------------------------------------------------------
  Everything else the guest-facing site shows comes out of `menu_public`, which
  is a view over dishes. BYO is not made of dishes — it is made of *ingredients*,
  and `nomenclature` has no guest-facing contract: no customer names, no Thai,
  no step grouping, and half the salad-bar items are RAW-AUTO-xxxx rows whose
  `name` is a purchase-order description ("ARO Frozen Sweet Corn Kernel 1 kg"),
  not something you put on a wall in 40-point type.

  So this is the interim contract, transcribed from sources that are already
  true rather than invented here:

    · the four steps and their taglines — the concept the CEO approved 2026-08-25
    · every EN/TH component name — the fridge label sheet now hanging on the
      salad bar (`~/Desktop/shishka-fridge-labels.html`). Those labels were
      printed and hung, which makes them the only Thai copy in the business that
      a native speaker has actually stood in front of and read.
    · the dressings and cheeses — `nomenclature` where is_available.

  When `menu_styles` / `menu_components` / `v_byo_catalog` land in shishka-os
  (MC epic 80da7563-36fd-45cc-9132-894a7c9b5ba9), this file is deleted and the
  board reads the view through useMenu like everything else. Until then: if the
  salad bar changes, change the labels and change this file in the same sitting,
  or the wall and the fridge disagree — which the guest can see, because both
  are three metres apart in the same room.

  ---------------------------------------------------------------------------
  THE ALLOWANCE, AND WHY IT REPLACED "UNLIMITED"  (CEO, 2026-08-25)
  ---------------------------------------------------------------------------
  The first cut of this board promised unlimited toppings. It now grants a fixed
  number of picks per group — four vegetables, two beans, one cheese, and so on.
  That is the CEO's call, and costing it out showed it does more than cap the
  bleed:

    · UNLIMITED was uncontrollable at the top end. A guest is not the problem;
      the spread is. Priced flat, the same bowl ranged from 37 to 162 THB of
      food depending only on what went in it.

    · THE ALLOWANCE MADE THE TOPPING SURCHARGE REDUNDANT. Avocado, cashews,
      pomegranate and wakame each carried +39 under the unlimited model. Once
      avocado takes one of four vegetable slots it costs 3.67 THB more than a
      tomato, and cashews 1.16 more than peanuts. Charging 39 for that would be
      indefensible, so the premium marks came off the toppings entirely. This
      is the allowance doing the work the surcharge used to do, better.

    · WHAT THE ALLOWANCE CANNOT FIX IS THE PROTEIN SPREAD. A slot limit caps
      how much goes in; it says nothing about what. 100 g of salmon is 59.90 —
      more than an entire cheap build — against 13.99 for chicken. So the
      surcharge moved to where the money actually is: shrimp carries it, and
      salmon and sashimi tuna are off this list altogether. They are not
      build-your-own ingredients at a build-your-own price; they already have a
      home on the signature menu at ฿449.

    · IT IS ALSO THE ONLY VERSION STAFF CAN ACTUALLY ENFORCE. "Unlimited but
      portioned" asks the line to judge a portion under queue pressure.
      "Four vegetables" asks them to count. Only one of those survives a
      Saturday.
*/

/* The one number the whole concept rests on, and the one I do not have from
   the CEO yet. "Flat price" is his instruction; the value is mine. It is a
   constant rather than a literal in the markup so that confirming it is a
   one-line change, and it is overridable from the URL (/board?p=249) so that
   whoever is standing in front of the TV can try a number at full size on the
   actual panel before committing it. Same trick the dish board uses for slide
   duration.

   At 219 the middle build — green oak, mixed veg, chicken, feta, tahini —
   runs 69.48 in food, or 31.7%. That is a shade over the 21-31% band, which is
   the argument for 229 rather than 219. His call, not mine. */
export const DEFAULT_FLAT_PRICE = 219;

/* Shrimp is the only component that still needs a surcharge. At 80 g it costs
   23.13 against 13.99 for 100 g of chicken, so +40 covers the gap with room.
   Also /board?x=50. */
export const DEFAULT_PREMIUM_SURCHARGE = 40;

/* Step 1. Not a menu section — a question asked of a guest standing at the
   counter deciding what shape their lunch is. The order is deliberate: salad
   first because it is what we are known for, cup last because it is the
   grab-and-go afterthought. */
export const STYLES = [
  { code: "salad", en: "Salad",  th: "สลัด",       note: "In the bowl, greens up",   noteTh: "จานสลัดผักสด" },
  { code: "bowl",  en: "Bowl",   th: "ข้าวกล่อง",   note: "On grains, warm or cold",  noteTh: "ราดบนธัญพืช" },
  { code: "wrap",  en: "Wrap",   th: "แร็พ",        note: "Rolled to go",             noteTh: "ห่อพร้อมทาน" },
  { code: "cup",   en: "Cup",    th: "ถ้วยสลัด",    note: "Half size, one hand",      noteTh: "ขนาดครึ่ง ถือได้" },
];

/* Steps 2-5.

   `columns` is the CSS column count at 16:9 for the plain list steps — tuned
   by eye against how many rows each list needs, not derived, because a list
   reading well is a typographic judgement and not an arithmetic one.

   The topping step is the exception: it is `layout: "groups"`, because under an
   allowance the grouping IS the message. A flat list of 43 names cannot express
   "four of these, one of those"; six labelled columns with a count on each can,
   and a guest reads the rule off the layout without being told it. */
export const STEPS = [
  {
    code: "base",
    n: "01",
    en: "Choose your base",
    th: "เลือกฐานของคุณ",
    tagline: "Greens, grains or noodles.",
    taglineTh: "ผักสด ธัญพืช หรือเส้น",
    columns: 2,
    items: [
      { en: "Iceberg lettuce",   th: "ผักกาดแก้ว" },
      { en: "Romaine lettuce",   th: "ผักกาดคอส" },
      { en: "Green oak lettuce", th: "ผักกาดกรีนโอ๊ค" },
      { en: "Cabbage",           th: "กะหล่ำปลี" },
      { en: "Red cabbage",       th: "กะหล่ำปลีม่วง" },
      { en: "Cooked quinoa",     th: "คีนัวสุก" },
      { en: "Riceberry rice",    th: "ข้าวไรซ์เบอร์รี่" },
      { en: "Konjac noodles",    th: "เส้นบุก" },
    ],
  },
  {
    code: "topping",
    n: "02",
    en: "Stack it up",
    th: "จัดให้เต็มที่",
    /* The tagline has to carry the whole rule in one line, because it is the
       one line a guest in a queue will actually read. "Included" is doing
       deliberate work: the picks are not an upsell, they are what they already
       paid for. */
    tagline: "picks included — take them from any row.",
    taglineTh: "เลือกได้ตามจำนวนในแต่ละแถว",
    layout: "groups",
    groups: [
      {
        en: "Vegetables", th: "ผัก", pick: 4,
        /* Twelve is the longest column on the board and sets the row count for
           the whole screen, so it renders in two sub-columns. Names are the
           short forms — "Bell peppers" not "Tricolor bell peppers" — because a
           name that wraps at four metres is a name nobody reads. */
        wide: true,
        items: [
          { en: "Tomato",        th: "มะเขือเทศ" },
          { en: "Cherry tomato", th: "มะเขือเทศเชอร์รี่" },
          { en: "Cucumber",      th: "แตงกวา" },
          { en: "Red onion",     th: "หอมแดงใหญ่" },
          { en: "Bell peppers",  th: "พริกหวาน" },
          { en: "Carrot",        th: "แครอท" },
          { en: "Radish",        th: "หัวไชเท้าแดง" },
          { en: "Daikon",        th: "หัวไชเท้า" },
          { en: "Beetroot",      th: "บีทรูท" },
          { en: "Pumpkin",       th: "ฟักทอง" },
          { en: "Sweet potato",  th: "มันหวาน" },
          { en: "Avocado",       th: "อะโวคาโด" },
        ],
      },
      {
        en: "Beans & corn", th: "ถั่วและข้าวโพด", pick: 2,
        items: [
          { en: "Edamame",     th: "ถั่วแระญี่ปุ่น" },
          { en: "Black beans", th: "ถั่วดำ" },
          { en: "Sweet corn",  th: "ข้าวโพดหวาน" },
        ],
      },
      {
        en: "Fruit & pickles", th: "ผลไม้และของดอง", pick: 2,
        items: [
          { en: "Ripe mango",      th: "มะม่วงสุก" },
          { en: "Pomegranate",     th: "ทับทิม" },
          { en: "Raisins",         th: "ลูกเกด" },
          { en: "Goji berries",    th: "โกจิเบอร์รี่" },
          { en: "Cranberries",     th: "แครนเบอร์รี่" },
          { en: "Pickles",         th: "แตงกวาดอง" },
          { en: "Pickled peppers", th: "พริกดอง" },
          { en: "Olives",          th: "มะกอกโอลีฟ" },
        ],
      },
      {
        en: "Nuts & seeds", th: "ถั่วและเมล็ดพืช", pick: 1,
        items: [
          { en: "Almonds",      th: "อัลมอนด์" },
          { en: "Walnuts",      th: "วอลนัท" },
          { en: "Peanuts",      th: "ถั่วลิสง" },
          { en: "Cashews",      th: "เม็ดมะม่วงหิมพานต์" },
          { en: "White sesame", th: "งาขาว" },
          { en: "Black sesame", th: "งาดำ" },
        ],
      },
      {
        /* New to the bar — these three are the salad-appropriate cheeses we
           already stock and cost (feta 772/kg, parmesan 569, ricotta 298).
           Goat at 1245 and blue at 995 are deliberately NOT here: at a 20 g
           scoop they are 25 and 20 THB, a tenth of the ticket for one topping.
           They stay on the manakeesh line where they are priced for.

           THESE HAVE NO FRIDGE LABEL YET. Print three before this goes live. */
        en: "Cheese", th: "ชีส", pick: 1,
        items: [
          { en: "Feta",     th: "เฟต้า" },
          { en: "Parmesan", th: "พาร์เมซาน" },
          { en: "Ricotta",  th: "ริคอตต้า" },
        ],
      },
      {
        en: "Scoops", th: "ของตักเพิ่ม", pick: 1,
        items: [
          { en: "Guacamole",       th: "กัวคาโมเล่" },
          { en: "Coleslaw",        th: "สลัดโคลสลอว์" },
          /* Named as the POS names them (SALE-SAUCE_MANGO_SALSA,
             SALE-SAUCE_PICO_DE_GALLO). "Tomato salsa" was my paraphrase and it
             is the kind of small drift that ends with the wall and the till
             calling the same tub two different things. */
          { en: "Mango salsa",     th: "ซัลซ่ามะม่วง" },
          { en: "Pico de gallo",   th: "ซัลซ่ามะเขือเทศ" },
          { en: "Wakame seaweed",  th: "สลัดสาหร่ายวากาเมะ" },
        ],
      },
    ],
    /* The giveaway. Herbs cost us almost nothing and guests take a pinch, so
       counting them would be mean about an amount of money that does not exist
       — and croutons are cut from yesterday's loaf, which makes charging for
       them worse than pointless. One free row buys more goodwill than the four
       baht it costs, and it gives the allowance somewhere generous to land. */
    free: {
      en: "Herbs, lemon & crunch",
      th: "สมุนไพร เลมอน และของกรุบ",
      label: "always free",
      labelTh: "ฟรีทุกเมนู",
      items: [
        { en: "Parsley",       th: "พาร์สลีย์" },
        { en: "Mint",          th: "สะระแหน่" },
        { en: "Dill",          th: "ผักชีลาว" },
        { en: "Cilantro",      th: "ผักชี" },
        { en: "Spring onion",  th: "ต้นหอม" },
        { en: "Lemon",         th: "เลมอน" },
        { en: "Herb croutons", th: "ครูตองสมุนไพร" },
        { en: "Rice crackers", th: "ข้าวแต๋น", tag: "GF" },
      ],
    },
  },
  {
    code: "protein",
    n: "03",
    en: "Load the protein",
    th: "เพิ่มโปรตีน",
    tagline: "One with every build.",
    taglineTh: "เลือกได้ 1 อย่างในทุกเมนู",
    /* Two columns, same as the bases: these are the twin decisions that
       determine what the meal actually is, either side of the topping bar. */
    columns: 2,
    /* Salmon and sashimi tuna were here and have been removed. At 599/kg,
       100 g of salmon is 59.90 — more food cost than an entire cheap build,
       and no flat price survives it: even at 339 a salmon bowl runs 34%. They
       remain on the signature menu at ฿449, which is where a fish that
       expensive is priced honestly. Crab stick still carries cost_per_unit
       0.00 in nomenclature and needs costing before it can be defended. */
    items: [
      { en: "Grilled chicken", th: "ไก่ย่าง" },
      { en: "Grilled shrimp",  th: "กุ้งย่าง", premium: true },
      { en: "Firm tofu",       th: "เต้าหู้แข็ง" },
      { en: "Chickpeas",       th: "ถั่วลูกไก่" },
      { en: "Boiled egg",      th: "ไข่ต้ม" },
      { en: "Crab stick",      th: "ปูอัด" },
    ],
  },
  {
    code: "dressing",
    n: "04",
    en: "Dress it right",
    th: "ราดน้ำสลัด",
    tagline: "One ladle, poured to order.",
    taglineTh: "ราดสดใหม่ตอนสั่ง",

    /* THE LIST IS SLICED, NOT FIXED  (CEO, 2026-08-25: "9 or 12")
       ------------------------------------------------------------------
       Ordered by priority; the board shows the first N. Nine is the default and
       twelve is /board?sauces=12, so the count gets chosen standing in front of
       the panel rather than argued about in this file.

       The order is not a ranking of quality, it is coverage: the first nine put
       one sauce in every flavour family we sell into — neutral, Middle Eastern,
       western creamy, Asian, spicy, fruit. Each of the last three is the SECOND
       of a kind (sumac after two tahinis; strawberry and maple after mango),
       which is the real argument for nine — twelve buys a third sweet dressing
       and three more open bottles with a shelf life.

       WHY THIS LIST CHANGED COMPLETELY  (CEO: "the sauce you have is wrong")
       ------------------------------------------------------------------
       The first cut was transcribed from `PF-` semi-finished rows — the prep
       recipes — on the assumption that a prep which exists is a sauce a guest
       can be handed. It is not, and six of the seventeen names on that board
       were dead: Balsamic, Fresh Herb, Ginger Lime and both Mushroom Truffles
       are is_available=false with cost_per_unit=0, and Basil Pesto and Cashew
       Cream price at 0.89 — which is the cost of the empty 2 oz cup
       (RAW-SAUCE_CUP_2OZ) and nothing whatsoever in it. A wall that offers a
       dressing the line cannot pour is worse than a wall with nine on it.

       So every entry carries the code it came from, and the state that matters
       is recorded rather than assumed:
         · `live: true` — a SALE- sauce SKU, is_available AND is_web_visible.
         · no `live`    — the prep is real and is ladled into dishes today, but
                          has no sellable standalone SKU. Those must be created
                          in the POS before this screen is true. On the epic.
       `cost` is THB per 50 g ladle, for whoever revisits the flat price. */
    sliceable: true,
    items: [
      // --- the nine ---------------------------------------------------------
      { en: "Olive oil & lemon",  th: "น้ำมันมะกอกกับเลมอน", code: "PF-OLIVE_LEMON_DRESSING",    cost: 15.91 },
      { en: "Tahini vinaigrette", th: "น้ำสลัดงาขาว",         code: "SALE-SAUCE_TAHINI_TAMARIND", cost: 6.98, live: true },
      { en: "Yogurt tahini",      th: "โยเกิร์ตงาขาว",        code: "SALE-SAUCE_YOGURT_TAHINI",   cost: 8.43, live: true },
      { en: "Hummus",             th: "ซอสฮัมมูส",            code: "SALE-SAUCE_HUMMUS",          cost: 5.20, live: true },
      { en: "Caesar",             th: "ซีซาร์",               code: "PF-CAESAR_YOGURT_DRESSING",  cost: 6.91 },
      { en: "Chipotle honey",     th: "ชิโปตเล่น้ำผึ้ง",       code: "PF-CHIPOTLE_HONEY_DRESSING", cost: 12.29 },
      { en: "Thai peanut",        th: "น้ำสลัดถั่วลิสงไทย",    code: "PF-DRESSING_THAI_PEANUT",    cost: 8.48 },
      { en: "Clean teriyaki",     th: "ซอสเทริยากิ",          code: "PF-TERIYAKI_CLEAN",          cost: 4.31 },
      { en: "Mango",              th: "ซอสมะม่วง",            code: "SALE-SAUCE_MANGO",           cost: 6.48, live: true },

      // --- and the three that make it twelve --------------------------------
      /* Sumac is the Fattoush and Tabbouleh dressing and the most obviously
         "ours" of the twelve, but PF-SUMAC_DRESSING prices at 501.55/kg — 25.08
         a ladle, 11% of a 219 ticket for the dressing alone. That is either a
         genuinely expensive dressing or a unit trap in the BOM, and it should
         not go on a flat-price board until someone has looked at which. */
      { en: "Sumac",              th: "ซูแมค",                code: "PF-SUMAC_DRESSING",          cost: 25.08 },
      { en: "Strawberry",         th: "สตรอว์เบอร์รี่",        code: "SALE-SAUCE_STRAWBERRY",      cost: 11.01, live: true },
      { en: "Maple",              th: "เมเปิ้ล",              code: "SALE-SAUCE_MAPLE",           cost: 18.33, live: true },
    ],
  },
];

/* Nine unless the panel says otherwise (/board?sauces=12). The dressing step
   above explains why nine is the default. Both counts divide by three, so the
   screen is three rows either way and only the column count moves. */
export const DEFAULT_SAUCE_COUNT = 9;
export const SAUCE_COUNT_OPTIONS = [9, 12];

/* Resolve a step to what actually goes on screen. Only the sauces slice today,
   but the board asks every step through here so a second sliceable list does
   not need a second branch in the component. */
export function stepItems(step, sauceCount) {
  if (!step.sliceable) return step.items;
  return step.items.slice(0, sauceCount);
}

/* Three rows on the dressing screen at either count — 9/3 and 12/3 — which is
   why the type scale does not have to change with the CEO's answer. */
export function stepColumns(step, sauceCount) {
  if (!step.sliceable) return step.columns;
  return Math.ceil(sauceCount / 3);
}

const TOPPING_STEP = STEPS.find((s) => s.code === "topping");

/* The headline number, summed from the allowances rather than typed. Under
   "unlimited" the board's claim was unfalsifiable; under an allowance it is a
   promise with an exact size, and the guest will count. Change a `pick` and the
   headline follows it — the board cannot promise eleven and hand over ten. */
export const PICKS_INCLUDED = TOPPING_STEP.groups.reduce((n, g) => n + g.pick, 0);

/* What is actually on the bar, for the "N to choose from" badge on each step. */
export const TOPPING_COUNT =
  TOPPING_STEP.groups.reduce((n, g) => n + g.items.length, 0) +
  TOPPING_STEP.free.items.length;

export const COMPONENT_COUNT = STEPS.reduce(
  (n, s) => n + (s.items ? s.items.length : 0),
  0,
) + TOPPING_COUNT;
