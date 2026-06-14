import { useState, useEffect } from "react";
import { CalorieDonut } from "../nutrition/CalorieDonut.jsx";
import { MacroBar } from "../nutrition/MacroBar.jsx";
import { DietTag } from "../filters/DietTag.jsx";
import { Badge } from "../primitives/Badge.jsx";
import { IconButton } from "../primitives/IconButton.jsx";
import { ModifierBuilder } from "./ModifierBuilder.jsx";
import { XIcon, ShareIcon, ClockIcon } from "../Icons.jsx";

export function DishDialog({ open, onClose, dish, onShare, onAdd }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const [imgOk, setImgOk] = useState(true);
  useEffect(() => setImgOk(true), [dish?.image_url]);

  // Nutrition of the currently selected add-ons (reported by the builder), added
  // onto the base dish for a live KBJU counter. Reset when the dish changes.
  const [addedNutri, setAddedNutri] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  useEffect(() => setAddedNutri({ calories: 0, protein: 0, carbs: 0, fat: 0 }), [dish?.id]);

  if (!open || !dish) return null;
  const {
    name, description, price, priceDefault = null, priceFrom = null, currency = "฿", image, image_url,
    calories, protein = 0, carbs = 0, fat = 0,
    diets = [], allergens = [], tags = [], badges = [],
    category, portion_size, portion_unit, ingredients,
    modifierGroups = [],
  } = dish;
  const photo = image ?? image_url;
  // Build-your-own dishes (a required modifier group) price "from ฿X": the base
  // plus the cheapest mandatory add-ons. The flat base alone isn't orderable.
  const buildYourOwn = priceFrom != null;
  // Headline price: a dish with a default-configured add-on (e.g. a dip served
  // with a bun) shows that default total (฿149); the guest changes it below.
  const headlinePrice = priceDefault ?? price;

  // Base dish nutrition + selected add-ons → live values for the donut/macros.
  const round1 = (n) => Math.round(n * 10) / 10;
  const liveCalories = calories != null ? calories + addedNutri.calories : (addedNutri.calories || null);
  const liveProtein = round1((protein || 0) + addedNutri.protein);
  const liveCarbs = round1((carbs || 0) + addedNutri.carbs);
  const liveFat = round1((fat || 0) + addedNutri.fat);

  return (
    <div className="shk-dlg__scrim" onClick={onClose}>
      <div
        className="shk-dlg"
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
              onNutritionChange={setAddedNutri}
            />
          )}

          {onAdd && (
            <button type="button" className="shk-dlg__add" onClick={onAdd}>
              Add to order{buildYourOwn ? ` · from ${currency}${priceFrom}` : headlinePrice != null ? ` · ${currency}${headlinePrice}` : ""}
            </button>
          )}

          <div className="shk-dlg__nutri">
            <CalorieDonut kcal={liveCalories} protein={liveProtein} carbs={liveCarbs} fat={liveFat} size={104} thickness={11} />
            <div className="shk-dlg__nutri-bars">
              <MacroBar protein={liveProtein} carbs={liveCarbs} fat={liveFat} />
            </div>
          </div>

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
