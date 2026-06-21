import {
  BoltIcon, ShieldIcon, SparkleIcon, WavesIcon, BoneIcon,
  DropletIcon, LeafIcon, SproutIcon, WheatIcon, NutIcon, BeefIcon,
  HeartIcon, FlameIcon, CoffeeIcon,
} from "../Icons.jsx";

// Benefit-slug → icon, resolving the string icon set in lib/benefits.js.
const BENEFIT_ICONS = {
  protein: DropletIcon, bvitamins: BoltIcon, omega3: WavesIcon, iron: BeefIcon,
  magnesium: LeafIcon, vitaminc: ShieldIcon, vitamina: SproutIcon, fiber: WheatIcon,
  calcium: BoneIcon, healthyfats: NutIcon, antioxidants: SparkleIcon,
  potassium: HeartIcon, antiinflam: FlameIcon, caffeine: CoffeeIcon,
};

// Compact nutrient "boost" pills shared by the dish window and the order page.
export function BenefitPills({ benefits = [] }) {
  if (!benefits.length) return null;
  return (
    <ul className="shk-benefits">
      {benefits.map((b) => {
        const Icon = BENEFIT_ICONS[b.icon] || BENEFIT_ICONS[b.slug] || LeafIcon;
        return (
          <li key={b.slug} className={`shk-boost shk-boost--${b.tone || "green"}`}>
            <span className="shk-boost__icon"><Icon /></span>
            <span className="shk-boost__text">
              <span className="shk-boost__label">
                {b.label}{b.value ? ` · ${b.value}` : ""}
              </span>
              {b.note && <span className="shk-boost__note">{b.note}</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
