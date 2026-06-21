/*
  "Real food, real supplement" — derive the nourishment a dish gives you
  from its OWN ingredient list, so every benefit chip is honest and
  traceable to something actually in the bowl. No micronutrient figures
  live in the menu data, so we never invent numbers; we surface the
  well-established nutrient each ingredient is known for.

  benefitsForDish({ text, protein }) → [{ slug, label, icon, note }]
    text    — the dish's ingredient list (+ name as a fallback)
    protein — grams per serving, used for the protein/amino-acid chip

  Curated per-dish wording (drafted for review). Keep claims defensible:
  these are recognised nutrient associations, not medical claims. The icon
  field is a slug resolved to an SVG in the dialog (see BENEFIT_ICONS).
*/

// Ingredient-keyword → benefit knowledge base. Keywords match on a leading
// word boundary (so "oat" never fires on "goat", but plurals like "seeds"
// and "almonds" still match). Order here is the display priority; we keep
// the top few per dish.
const BENEFITS = [
  {
    slug: "omega3", label: "Omega-3", icon: "waves",
    note: "Omega-3 fatty acids that support heart and brain health.",
    keywords: ["tuna", "salmon", "sardine", "mackerel", "walnut", "chia"],
  },
  {
    slug: "bvitamins", label: "Vitamin B12", icon: "bolt",
    note: "B12 from real animal protein for steady energy and healthy nerves.",
    keywords: ["shrimp", "tuna", "chicken", "beef", "lamb", "sujuk", "egg"],
  },
  {
    slug: "iron", label: "Iron", icon: "beef",
    note: "Dietary iron that helps carry oxygen and fight fatigue.",
    keywords: ["beef", "lamb", "sujuk", "spinach"],
  },
  {
    slug: "magnesium", label: "Magnesium", icon: "leaf",
    note: "Magnesium for muscle recovery, calm and better sleep.",
    keywords: ["tahini", "sesame", "chia", "spinach", "cacao", "cocoa",
      "dark chocolate", "almond", "cashew", "pumpkin seed", "sunflower seed"],
  },
  {
    slug: "vitaminc", label: "Vitamin C", icon: "shield",
    note: "Vitamin C and antioxidants to support your immune system.",
    keywords: ["mango", "orange", "guava", "lemon", "lime", "kiwi",
      "strawberry", "passion fruit", "pepper", "pineapple", "blueberry"],
  },
  {
    slug: "vitamina", label: "Vitamin A", icon: "sprout",
    note: "Beta-carotene (vitamin A) for healthy eyes and skin.",
    keywords: ["carrot", "pumpkin", "mango", "apricot", "spinach"],
  },
  {
    slug: "fiber", label: "Fibre", icon: "wheat",
    note: "Plant fibre that feeds your gut and keeps you full.",
    keywords: ["chickpea", "hummus", "beetroot", "whole wheat", "oat",
      "banana", "lettuce", "cucumber", "carrot", "eggplant", "corn",
      "apple", "kiwi", "date", "seed"],
  },
  {
    slug: "calcium", label: "Calcium", icon: "bone",
    note: "Calcium for strong bones and teeth.",
    keywords: ["cheese", "milk", "yogurt", "tahini", "sesame", "almond"],
  },
  {
    slug: "healthyfats", label: "Healthy Fats", icon: "nut",
    note: "Plant fats that help you absorb vitamins and stay satisfied.",
    keywords: ["avocado", "olive oil", "almond", "cashew", "walnut",
      "peanut", "tahini", "sesame", "coconut milk", "seed"],
  },
  {
    slug: "antioxidants", label: "Antioxidants", icon: "sparkle",
    note: "Polyphenols and antioxidants that help fight everyday stress.",
    keywords: ["matcha", "cacao", "cocoa", "dark chocolate", "turmeric",
      "berry", "blueberry", "strawberry", "pomegranate", "espresso",
      "coffee", "beetroot", "guava"],
  },
  {
    slug: "potassium", label: "Electrolytes", icon: "heart",
    note: "Potassium and electrolytes to rehydrate and recharge.",
    keywords: ["coconut water", "coconut", "banana", "avocado", "potato"],
  },
  {
    slug: "antiinflam", label: "Anti-Inflammatory", icon: "flame",
    note: "Ginger and turmeric with natural anti-inflammatory compounds.",
    keywords: ["ginger", "turmeric"],
  },
  {
    slug: "caffeine", label: "Natural Energy", icon: "coffee",
    note: "A clean caffeine lift from real coffee and matcha.",
    keywords: ["espresso", "coffee", "matcha"],
  },
];

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Leading word boundary, no trailing — matches "seeds"/"almonds" but not
// "goat" for "oat". Case-insensitive.
const matches = (text, keyword) =>
  new RegExp(`\\b${escapeRe(keyword)}`, "i").test(text);

// Protein gets its own chip, sized to the actual grams in the dish.
function proteinBenefit(protein) {
  if (protein == null) return null;
  const g = Math.round(protein);
  if (protein >= 20)
    return { slug: "protein", label: "High Protein", icon: "droplet",
      tone: "red", value: `${g} g`, note: `${g}g of protein to rebuild and recover.` };
  if (protein >= 10)
    return { slug: "protein", label: "Protein", icon: "droplet",
      tone: "red", value: `${g} g`, note: `${g}g of quality protein per serving.` };
  return null;
}

// Design-system colour tone per nutrient (NUTRITION BOOSTS kit): green / red /
// purple / honey. Drives the pill border + icon-badge colour in the dialog.
const BENEFIT_TONE = {
  protein: "red", omega3: "green", bvitamins: "honey", iron: "red",
  magnesium: "purple", vitaminc: "honey", vitamina: "honey", fiber: "green",
  calcium: "purple", healthyfats: "green", antioxidants: "purple",
  potassium: "green", antiinflam: "red", caffeine: "honey",
};

// Cap the number of chips so the section stays scannable.
const MAX_BENEFITS = 5;

export function benefitsForDish({ text, protein } = {}) {
  const haystack = (text || "").toLowerCase();
  const out = [];

  const proteinChip = proteinBenefit(protein);
  if (proteinChip) out.push(proteinChip);

  if (haystack) {
    for (const b of BENEFITS) {
      if (out.length >= MAX_BENEFITS) break;
      if (b.keywords.some((k) => matches(haystack, k))) {
        out.push({ slug: b.slug, label: b.label, icon: b.icon,
          tone: BENEFIT_TONE[b.slug] || "green", note: b.note });
      }
    }
  }
  return out.slice(0, MAX_BENEFITS);
}
