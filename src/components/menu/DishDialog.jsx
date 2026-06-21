import { useState, useEffect, useRef } from "react";
import { CalorieDonut } from "../nutrition/CalorieDonut.jsx";
import { MacroBar } from "../nutrition/MacroBar.jsx";
import { DietTag } from "../filters/DietTag.jsx";
import { Badge } from "../primitives/Badge.jsx";
import { IconButton } from "../primitives/IconButton.jsx";
import { ModifierBuilder } from "./ModifierBuilder.jsx";
import {
  XIcon, ShareIcon, ClockIcon,
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

export function DishDialog({ open, onClose, dish, onShare, onAdd }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    const node = dialogRef.current;
    node?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") return onClose?.();
      if (e.key !== "Tab" || !node) return;
      const f = node.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prevFocus?.focus?.();
    };
  }, [open, onClose]);

  const [imgOk, setImgOk] = useState(true);
  useEffect(() => setImgOk(true), [dish?.image_url]);

  // Current build reported by the ModifierBuilder: selected options, configured
  // total, requiredMet flag, and the add-ons' nutrition (for the live counter).
  // Reset when the dish changes.
  const [build, setBuild] = useState(null);
  useEffect(() => setBuild(null), [dish?.id]);

  if (!open || !dish) return null;
  const {
    name, description, price, priceDefault = null, priceFrom = null, currency = "฿", image, image_url,
    calories, protein = 0, carbs = 0, fat = 0,
    diets = [], allergens = [], tags = [], badges = [], benefits = [],
    category, portion_size, portion_unit, ingredients,
    modifierGroups = [],
  } = dish;
  const photo = image ?? image_url;
  // Build-your-own dishes (a required modifier group) price "from ฿X": the base
  // plus the cheapest mandatory add-ons. The flat base alone isn't orderable.
  const buildYourOwn = priceFrom != null;
  const configurable = modifierGroups.length > 0;
  // A build-your-own dish can only be ordered once its required minimums are met.
  const canAdd = !buildYourOwn || (build?.requiredMet ?? false);
  // Headline price: a dish with a default-configured add-on (e.g. a dip served
  // with a bun) opens at that default total (฿149). Once the guest changes the
  // build, follow the live configured total so the header/CTA stay honest.
  const headlinePrice = build?.total ?? priceDefault ?? price;

  // Base dish nutrition + selected add-ons → live values for the donut/macros.
  const added = build?.nutrition ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const round1 = (n) => Math.round(n * 10) / 10;
  const liveCalories = calories != null ? calories + added.calories : (added.calories || null);
  const liveProtein = round1((protein || 0) + added.protein);
  const liveCarbs = round1((carbs || 0) + added.carbs);
  const liveFat = round1((fat || 0) + added.fat);

  return (
    <div className="shk-dlg__scrim" onClick={onClose}>
      <div
        className="shk-dlg"
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={name}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shk-dlg__media">
          {photo && imgOk ? (
            <>
              <img
                className="shk-dlg__img"
                src={photo}
                alt={name}
                onError={() => setImgOk(false)}
              />
              <span className="shk-dlg__media-scrim" />
            </>
          ) : (
            <div className="shk-dlg__ph" aria-hidden="true">
              <img className="shk-dlg__ph-logo" src="/assets/logo-mark-white.png" alt="" />
              {category && <div className="shk-dlg__ph-word">{category}</div>}
            </div>
          )}
          <div className="shk-dlg__topbtns">
            <div className="shk-dlg__flags">
              {badges.map((b, i) => (
                <Badge key={i} tone={b.tone || "solid-gold"} icon={b.icon}>{b.label}</Badge>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {onShare && (
                <IconButton label="Share dish" variant="solid" onClick={onShare}>
                  <ShareIcon />
                </IconButton>
              )}
              <IconButton label="Close" variant="solid" onClick={onClose}>
                <XIcon />
              </IconButton>
            </div>
          </div>
        </div>

        <div className="shk-dlg__body">
          <div className="shk-dlg__head">
            <h2 className="shk-dlg__title">{name}</h2>
            {buildYourOwn ? (
              <span className="shk-dlg__price">
                <span className="shk-dlg__from">from </span>{currency}{priceFrom}
              </span>
            ) : (
              headlinePrice != null && (
                <span className="shk-dlg__price">{currency}{headlinePrice}</span>
              )
            )}
          </div>

          {portion_size != null && (
            <div className="shk-dlg__meta">
              <ClockIcon />
              {portion_size}{portion_unit ?? ""}
            </div>
          )}

          {description && <p className="shk-dlg__desc">{description}</p>}

          {modifierGroups.length > 0 && (
            <ModifierBuilder
              key={dish.id}
              basePrice={price ?? 0}
              currency={currency}
              groups={modifierGroups}
              onChange={setBuild}
            />
          )}

          {onAdd && (
            <button
              type="button"
              className="shk-dlg__add"
              onClick={() => onAdd(build)}
              disabled={!canAdd}
            >
              {configurable
                ? canAdd
                  ? `Add to order · ${currency}${build?.total ?? priceDefault ?? priceFrom ?? price}`
                  : "Pick the required options"
                : `Add to order${price != null ? ` · ${currency}${price}` : ""}`}
            </button>
          )}

          <div className="shk-dlg__nutri">
            <CalorieDonut kcal={liveCalories} protein={liveProtein} carbs={liveCarbs} fat={liveFat} size={104} thickness={11} />
            <div className="shk-dlg__nutri-bars">
              <MacroBar protein={liveProtein} carbs={liveCarbs} fat={liveFat} />
            </div>
          </div>

          {benefits.length > 0 && (
            <div>
              <div className="shk-dlg__section-label">Benefits</div>
              <ul className="shk-benefits">
                {benefits.map((b) => {
                  const Icon = BENEFIT_ICONS[b.icon] || BENEFIT_ICONS[b.slug] || LeafIcon;
                  return (
                    <li key={b.slug} className={`shk-boost shk-boost--${b.tone || "green"}`}>
                      <span className="shk-boost__icon"><Icon /></span>
                      <span className="shk-boost__label">{b.label}</span>
                      {b.value && <span className="shk-boost__val">{b.value}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {diets.length > 0 && (
            <div>
              <div className="shk-dlg__section-label">Suitable for</div>
              <div className="shk-dlg__tags">
                {diets.map((d) => <DietTag key={d} type={d} />)}
              </div>
            </div>
          )}

          {allergens.length > 0 && (
            <div>
              <div className="shk-dlg__section-label">Contains</div>
              <div className="shk-dlg__tags">
                {allergens.map((a) => <DietTag key={a} type={a} tone="allergen" />)}
              </div>
            </div>
          )}


          {ingredients && (
            <div>
              <div className="shk-dlg__section-label">Ingredients</div>
              <p className="shk-dlg__ingredients">{ingredients}</p>
            </div>
          )}

          <p className="shk-dlg__disclaimer">
            Nutrition is calculated per serving and may vary. Tell our team about any allergies — dishes are prepared in a shared kitchen.
          </p>
        </div>
      </div>
    </div>
  );
}
