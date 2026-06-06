import {
  SproutIcon, LeafIcon, WheatIcon, MilkIcon, NutIcon,
  EggIcon, FlameIcon, DropletIcon, BeefIcon, HalalIcon,
} from "../Icons.jsx";

const PRESETS = {
  vegan:            { label: "Vegan",        Icon: SproutIcon,  tone: "diet" },
  vegetarian:       { label: "Vegetarian",   Icon: LeafIcon,    tone: "diet" },
  "gluten-free":    { label: "Gluten-free",  Icon: WheatIcon,   tone: "diet" },
  "dairy-free":     { label: "Dairy-free",   Icon: MilkIcon,    tone: "diet" },
  "high-protein":   { label: "High protein", Icon: DropletIcon, tone: "diet" },
  "grass-fed":      { label: "Grass-fed",    Icon: BeefIcon,    tone: "diet" },
  halal:            { label: "Halal",        Icon: HalalIcon,   tone: "diet" },
  spicy:            { label: "Spicy",        Icon: FlameIcon,   tone: "spice" },
  "contains-gluten":{ label: "Gluten",       Icon: WheatIcon,   tone: "allergen" },
  "contains-dairy": { label: "Dairy",        Icon: MilkIcon,    tone: "allergen" },
  "contains-nuts":  { label: "Nuts",         Icon: NutIcon,     tone: "allergen" },
  "contains-egg":   { label: "Egg",          Icon: EggIcon,     tone: "allergen" },
};

export function DietTag({
  type,
  label,
  icon,
  tone,
  iconOnly = false,
  bare = false,
  className = "",
  ...rest
}) {
  const preset = type ? PRESETS[type] : null;
  const Icon = preset?.Icon;
  const resolvedTone = tone || preset?.tone || "diet";
  const resolvedLabel = label || preset?.label || type;
  const cls = [
    "shk-diet",
    `shk-diet--${resolvedTone}`,
    iconOnly ? "shk-diet--icon" : "",
    bare ? "shk-diet--bare" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={cls} title={iconOnly ? resolvedLabel : undefined} {...rest}>
      {icon ? icon : Icon ? <Icon /> : null}
      {!iconOnly && <span>{resolvedLabel}</span>}
    </span>
  );
}
