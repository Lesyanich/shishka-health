import { useState, useEffect } from "react";
import { CalorieDonut } from "../nutrition/CalorieDonut.jsx";
import { MacroBar } from "../nutrition/MacroBar.jsx";
import { DietTag } from "../filters/DietTag.jsx";
import { Badge } from "../primitives/Badge.jsx";
import { IconButton } from "../primitives/IconButton.jsx";
import { ModifierBuilder } from "./ModifierBuilder.jsx";
import { XIcon, ShareIcon, ClockIcon } from "../Icons.jsx";

export function DishDialog({ open, onClose, dish, onShare }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const [imgOk, setImgOk] = useState(true);
  useEffect(() => setImgOk(true), [dish?.image_url]);

  if (!open || !dish) return null;
  const {
    name, description, price, currency = "฿", image, image_url,
    calories, protein = 0, carbs = 0, fat = 0,
    diets = [], allergens = [], tags = [], badges = [],
    category, portion_size, portion_unit, ingredients,
    modifierGroups = [],
  } = dish;
  const photo = image ?? image_url;

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
            {price != null && (
              <span className="shk-dlg__price">{currency}{price}</span>
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
            />
          )}

          <div className="shk-dlg__nutri">
            <CalorieDonut kcal={calories} protein={protein} carbs={carbs} fat={fat} size={104} thickness={11} />
            <div className="shk-dlg__nutri-bars">
              <MacroBar protein={protein} carbs={carbs} fat={fat} />
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
