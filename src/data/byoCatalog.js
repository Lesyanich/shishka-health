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

  So this is the interim contract. It is transcribed from two sources that are
  already true and already signed off, not invented here:

    · the four steps and their taglines — the concept the CEO approved 2026-08-25
    · every EN/TH component name — the fridge label sheet now hanging on the
      salad bar (`~/Desktop/shishka-fridge-labels.html`, 59 items). Those labels
      were printed and hung, which makes them the only Thai copy in the business
      that a native speaker has actually stood in front of and read.
    · the dressing list — `nomenclature` where is_available, PF- prefixed.

  When `menu_styles` / `menu_components` / `v_byo_catalog` land in shishka-os
  (MC epic 80da7563-36fd-45cc-9132-894a7c9b5ba9), this file is deleted and the
  board reads the view through useMenu like everything else. Until then: if the
  salad bar changes, change the labels and change this file in the same sitting,
  or the wall and the fridge disagree — which the guest can see, because both
  are three metres apart in the same room.

  ---------------------------------------------------------------------------
  THAI
  ---------------------------------------------------------------------------
  Roughly half our guests in Rawai read Thai more comfortably than English, and
  a board that guides a choice is worthless if it only guides half the room.
  The dressing names are the one block NOT taken from the printed labels — they
  did not need fridge labels — so they are the block to have a Thai speaker
  check first.
*/

/* The one number the whole concept rests on, and the one I do not have from
   the CEO yet. "Flat price with unlimited toppings" is his instruction; the
   value is mine. It is a constant rather than a literal in the markup so that
   confirming it is a one-line change, and it is overridable from the URL
   (/board?p=249) so that whoever is standing in front of the TV can try a
   number on the actual screen before committing it. Same trick their dish
   board uses for slide duration. */
export const DEFAULT_FLAT_PRICE = 219;

/* Avocado, cashews, pomegranate and wakame carry a surcharge — CEO, 2026-08-25.
   They are the four salad-bar items whose cost per portion is high enough that
   "unlimited" against them is a real hole: avocado 149/kg, cashews 352/kg, and
   wakame is the one guests take by the fistful. Also /board?x=49. */
export const DEFAULT_PREMIUM_SURCHARGE = 39;

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

/* Steps 2-5. `columns` is the CSS column count at 16:9 — tuned by eye against
   how many rows each list needs, not derived, because 43 items reading well in
   five columns is a typographic judgement and not an arithmetic one. */
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
    en: "Stack it high",
    th: "จัดให้เต็มที่",
    tagline: "As much as you like. No extra charge.",
    taglineTh: "ตักได้ไม่อั้น ไม่คิดเพิ่ม",
    columns: 5,
    items: [
      { en: "Tomato",                 th: "มะเขือเทศ" },
      { en: "Cherry tomato",          th: "มะเขือเทศเชอร์รี่" },
      { en: "Cucumber",               th: "แตงกวา" },
      { en: "Red onion",              th: "หอมหัวใหญ่สีม่วง" },
      { en: "Tricolor bell peppers",  th: "พริกหวานสามสี" },
      { en: "Carrot",                 th: "แครอท" },
      { en: "Radish",                 th: "หัวไชเท้าแดง" },
      { en: "Daikon radish",          th: "หัวไชเท้า" },
      { en: "Beetroot",               th: "บีทรูท" },
      { en: "Pumpkin",                th: "ฟักทอง" },
      { en: "Japanese sweet potato",  th: "มันหวานญี่ปุ่น" },
      { en: "Sweet corn",             th: "ข้าวโพดหวาน" },
      { en: "Edamame",                th: "ถั่วแระญี่ปุ่น" },
      { en: "Black beans",            th: "ถั่วดำ" },
      { en: "Spring onion",           th: "ต้นหอม" },
      { en: "Cilantro",               th: "ผักชี" },
      { en: "Parsley",                th: "พาร์สลีย์" },
      { en: "Mint",                   th: "สะระแหน่" },
      { en: "Dill",                   th: "ผักชีลาว" },
      { en: "Parsley & red onion",    th: "พาร์สลีย์ผสมหอมแดง" },
      { en: "Lemon",                  th: "เลมอน" },
      { en: "Pickles",                th: "แตงกวาดอง" },
      { en: "Pickled peppers",        th: "พริกดอง" },
      { en: "Olives",                 th: "มะกอกโอลีฟ" },
      { en: "Coleslaw",               th: "สลัดโคลสลอว์" },
      { en: "Mango salsa",            th: "ซัลซ่ามะม่วง" },
      { en: "Tomato salsa",           th: "ซัลซ่ามะเขือเทศ" },
      { en: "Guacamole",              th: "กัวคาโมเล่" },
      { en: "Ripe mango",             th: "มะม่วงสุก" },
      { en: "Raisins",                th: "ลูกเกด" },
      { en: "Goji berries",           th: "โกจิเบอร์รี่" },
      { en: "Cranberries",            th: "แครนเบอร์รี่" },
      { en: "Almonds",                th: "อัลมอนด์" },
      { en: "Walnuts",                th: "วอลนัท" },
      { en: "Peanuts",                th: "ถั่วลิสง" },
      { en: "White sesame",           th: "งาขาว" },
      { en: "Black sesame",           th: "งาดำ" },
      /* Croutons are cut from yesterday's multigrain loaf — CEO, 2026-08-25.
         The rice cracker is the gluten-free swap, so it is flagged rather than
         listed as just another crunch. */
      { en: "Herb croutons",          th: "ครูตองสมุนไพร" },
      { en: "Rice crackers",          th: "ข้าวแต๋น", tag: "GF" },
      /* The four with a surcharge. They sit at the end of the list, together,
         so the gold marks read as one rule and not as scattered exceptions. */
      { en: "Avocado",                th: "อะโวคาโด",                premium: true },
      { en: "Cashews",                th: "เม็ดมะม่วงหิมพานต์",      premium: true },
      { en: "Pomegranate",            th: "ทับทิม",                  premium: true },
      { en: "Wakame seaweed",         th: "สลัดสาหร่ายวากาเมะ",      premium: true },
    ],
  },
  {
    code: "protein",
    n: "03",
    en: "Load the protein",
    th: "เพิ่มโปรตีน",
    tagline: "Pick your favourite. Or stack a few.",
    taglineTh: "เลือกที่ชอบ หรือหลายอย่างก็ได้",
    /* Two columns, same as the bases: eight proteins across four columns is two
       short rows adrift in the top third of the panel. Four rows of two fills
       the screen and makes the protein step read as the twin of the base step,
       which is what it is — the other decision that changes what the meal
       actually is. */
    columns: 2,
    items: [
      { en: "Grilled chicken",  th: "ไก่ย่าง" },
      { en: "Grilled shrimp",   th: "กุ้งย่าง" },
      { en: "Salmon sashimi",   th: "แซลมอนซาชิมิ" },
      { en: "Tuna sashimi",     th: "ทูน่าซาชิมิ" },
      { en: "Crab stick",       th: "ปูอัด" },
      { en: "Firm tofu",        th: "เต้าหู้แข็ง" },
      { en: "Chickpeas",        th: "ถั่วลูกไก่" },
      { en: "Boiled egg",       th: "ไข่ต้ม" },
    ],
  },
  {
    code: "dressing",
    n: "04",
    en: "Dress it right",
    th: "ราดน้ำสลัด",
    tagline: "Our signature dressings do the rest.",
    taglineTh: "น้ำสลัดสูตรพิเศษของเรา",
    columns: 4,
    /* All PF- dressings currently is_available in nomenclature. Seven of these
       still carry a zero or null cost_per_unit in the database — Balsamic,
       Fresh Herb, Ginger Lime, Mushroom Truffle, Basil Pesto, Cashew Cream.
       They are safe to *show* (they exist and are ladled every day) but the
       flat price cannot be defended until they are costed. Flagged on the MC
       epic; the board is not the place that breaks. */
    items: [
      { en: "Olive oil & lemon",   th: "น้ำมันมะกอกกับเลมอน" },
      { en: "Sumac",               th: "ซูแมค" },
      { en: "Tahini vinaigrette",  th: "น้ำสลัดงาขาว" },
      { en: "Yogurt tahini",       th: "โยเกิร์ตงาขาว" },
      { en: "Caesar",              th: "ซีซาร์" },
      { en: "Avocado caesar",      th: "ซีซาร์อะโวคาโด" },
      { en: "Chipotle honey",      th: "ชิโปตเล่น้ำผึ้ง" },
      { en: "Thai peanut",         th: "น้ำสลัดถั่วลิสงไทย" },
      { en: "Clean teriyaki",      th: "ซอสเทริยากิ" },
      { en: "Balsamic",            th: "บัลซามิก" },
      { en: "Fresh herb",          th: "สมุนไพรสด" },
      { en: "Ginger lime",         th: "ขิงมะนาว" },
      { en: "Maple",               th: "เมเปิ้ล" },
      { en: "Strawberry",          th: "สตรอว์เบอร์รี่" },
      { en: "Mushroom truffle",    th: "เห็ดทรัฟเฟิล" },
      { en: "Basil pesto",         th: "เพสโต้โหระพา" },
      { en: "Cashew cream",        th: "ครีมมะม่วงหิมพานต์" },
    ],
  },
];

/* "60+ toppings" is Salata's line. Ours is computed, so the board can never
   promise a number the salad bar does not have — if someone deletes eight
   toppings from this file the headline drops with them. Today: 43 + 8 + 8 = 59
   things a guest can put in the bowl, plus 17 dressings. */
export const TOPPING_COUNT = STEPS.find((s) => s.code === "topping").items.length;
export const COMPONENT_COUNT = STEPS.reduce((n, s) => n + s.items.length, 0);
