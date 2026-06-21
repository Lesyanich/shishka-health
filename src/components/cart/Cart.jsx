import { useState } from "react";
import { useCart } from "../../state/cart.jsx";
import { IconButton } from "../primitives/IconButton.jsx";
import { XIcon, BagIcon } from "../Icons.jsx";
import { CalorieDonut } from "../nutrition/CalorieDonut.jsx";
import { MacroBar } from "../nutrition/MacroBar.jsx";
import { BenefitPills } from "../menu/BenefitPills.jsx";

/*
  Order builder UI. An always-visible floating "Order" button (food-app style):
  shows "Order" when empty, or the item count + running total once dishes are
  added; tapping opens the order drawer. No payment — guests pay at the counter.

  The drawer mirrors the dish window: each line has a thumbnail, and the whole
  order rolls up into a nutrition donut + macro bars + the combined real-food
  benefit pills, so guests see what the order gives them.
*/

const round1 = (n) => Math.round(n * 10) / 10;
const dishThumb = (l) =>
  l.kind === "bundle" ? l.children?.[0]?.dish?.image_url : l.dish?.image_url;

// Roll the whole order up into totals + the union of its real-food benefits.
function orderInfo(lines) {
  let calories = 0, protein = 0, carbs = 0, fat = 0;
  const bm = new Map();
  const add = (dish, qty) => {
    if (!dish) return;
    calories += (Number(dish.calories) || 0) * qty;
    protein += (Number(dish.protein) || 0) * qty;
    carbs += (Number(dish.carbs) || 0) * qty;
    fat += (Number(dish.fat) || 0) * qty;
    (dish.benefits || []).forEach((b) => {
      if (!bm.has(b.slug)) bm.set(b.slug, { slug: b.slug, label: b.label, icon: b.icon, tone: b.tone });
    });
  };
  for (const l of lines) {
    if (l.kind === "bundle") (l.children || []).forEach((c) => add(c.dish, (c.qty || 1) * l.qty));
    else add(l.dish, l.qty);
  }
  const benefits = [...bm.values()];
  const proteinPill = benefits.find((b) => b.slug === "protein");
  if (proteinPill) proteinPill.value = `${Math.round(protein)} g`;
  return { calories: Math.round(calories), protein: round1(protein), carbs: round1(carbs), fat: round1(fat), benefits };
}

function Thumb({ src }) {
  return (
    <span className="shk-cart__thumb">
      {src ? <img src={src} alt="" loading="lazy" /> : <span className="shk-cart__thumb-ph" aria-hidden="true" />}
    </span>
  );
}

export function Cart({ currency = "฿" }) {
  const cart = useCart();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const empty = cart.count === 0;
  const info = orderInfo(cart.lines);

  return (
    <>
      {!open && (
        <button
          type="button"
          className={`shk-orderfab ${empty ? "shk-orderfab--empty" : ""}`}
          onClick={() => setOpen(true)}
          aria-label={empty ? "Start your order" : `View order, ${cart.count} items, ${currency}${cart.total}`}
        >
          <span className="shk-orderfab__icon"><BagIcon /></span>
          {empty ? (
            <span className="shk-orderfab__label">Order</span>
          ) : (
            <>
              <span className="shk-orderfab__count num">{cart.count}</span>
              <span className="shk-orderfab__label">View order</span>
              <span className="shk-orderfab__total num">{currency}{cart.total}</span>
            </>
          )}
        </button>
      )}

      {open && (
        <div className="shk-cart__scrim" onClick={() => setOpen(false)}>
          <aside className="shk-cart" role="dialog" aria-modal="true" aria-label="Your order" onClick={(e) => e.stopPropagation()}>
            <header className="shk-cart__head">
              <h2 className="shk-cart__title">Your order</h2>
              <IconButton label="Close" variant="solid" onClick={() => setOpen(false)}>
                <XIcon />
              </IconButton>
            </header>

            {empty && (
              <div className="shk-cart__empty">
                <span className="shk-cart__empty-icon"><BagIcon /></span>
                <p className="shk-cart__empty-title">Your order is empty</p>
                <p className="shk-cart__empty-sub">Tap any dish to add it — build your order, then show the total at the counter. 🌿</p>
                <button type="button" className="shk-cart__empty-btn" onClick={() => setOpen(false)}>
                  Browse the menu
                </button>
              </div>
            )}

            {!empty && (<>
            <div className="shk-cart__scroll">
              <ul className="shk-cart__lines">
                {cart.lines.map((l) => (
                  <li key={l.id} className="shk-cart__line">
                    {l.kind === "bundle" ? (
                      <div className="shk-cart__line-main">
                        <div className="shk-cart__line-lead">
                          <Thumb src={dishThumb(l)} />
                          <div className="shk-cart__line-info">
                            <span className="shk-cart__line-name">{l.label}</span>
                            <ul className="shk-cart__sub">
                              {l.children.map((c, i) => (
                                <li key={`${c.dish.id}-${i}`}>
                                  {c.qty}× {c.dish.name}
                                  {c.role === "sauce" ? " (free)" : ""}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <div className="shk-cart__line-right">
                          <span className="shk-cart__line-price num">{currency}{cart.lineTotal(l)}</span>
                          <button type="button" className="shk-cart__rm" onClick={() => cart.remove(l.id)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="shk-cart__line-main">
                        <div className="shk-cart__line-lead">
                          <Thumb src={dishThumb(l)} />
                          <div className="shk-cart__line-info">
                            <span className="shk-cart__line-name">{l.dish.name}</span>
                            {l.config?.options?.length > 0 && (
                              <ul className="shk-cart__sub">
                                {l.config.options.map((o, i) => (
                                  <li key={`${o.name}-${i}`}>
                                    {o.priceDelta > 0
                                      ? `+ ${o.name} (${currency}${o.priceDelta})`
                                      : o.name}
                                  </li>
                                ))}
                              </ul>
                            )}
                            <span className="shk-cart__line-unit num">
                              {currency}{l.price != null ? l.price : l.dish.price}
                            </span>
                          </div>
                        </div>
                        <div className="shk-cart__stepper">
                          <button type="button" aria-label="decrease" onClick={() => cart.setQty(l.id, l.qty - 1)}>–</button>
                          <span className="num">{l.qty}</span>
                          <button type="button" aria-label="increase" onClick={() => cart.setQty(l.id, l.qty + 1)}>+</button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              {(info.calories > 0 || info.benefits.length > 0) && (
                <div className="shk-cart__nutri-wrap">
                  <div className="shk-dlg__section-label">What you'll get</div>
                  {info.calories > 0 && (
                    <div className="shk-cart__nutri">
                      <CalorieDonut kcal={info.calories} protein={info.protein} carbs={info.carbs} fat={info.fat} size={104} thickness={11} />
                      <div className="shk-cart__nutri-bars">
                        <MacroBar protein={info.protein} carbs={info.carbs} fat={info.fat} />
                      </div>
                    </div>
                  )}
                  <BenefitPills benefits={info.benefits} />
                </div>
              )}
            </div>

            <footer className="shk-cart__foot">
              <div className="shk-cart__comment">
                <label htmlFor="shk-order-note">Add a note for your order</label>
                <textarea
                  id="shk-order-note"
                  className="shk-cart__comment-input"
                  rows={2}
                  placeholder="Allergies, preferences, anything for our team…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <div className="shk-cart__total-row">
                <span>Total</span>
                <span className="shk-cart__total-num num">{currency}{cart.total}</span>
              </div>
              <p className="shk-cart__note">Pay at the counter — no online payment. Show this total{note.trim() ? " and note" : ""} to our team.</p>
              <button type="button" className="shk-cart__clear" onClick={cart.clear}>Clear order</button>
            </footer>
            </>)}
          </aside>
        </div>
      )}
    </>
  );
}
