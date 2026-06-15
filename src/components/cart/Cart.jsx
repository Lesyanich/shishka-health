import { useState } from "react";
import { useCart } from "../../state/cart.jsx";
import { IconButton } from "../primitives/IconButton.jsx";
import { XIcon, BagIcon } from "../Icons.jsx";

/*
  Order builder UI. An always-visible floating "Order" button (food-app style):
  shows "Order" when empty, or the item count + running total once dishes are
  added; tapping opens the order drawer. No payment — guests pay at the counter.
*/
export function Cart({ currency = "฿" }) {
  const cart = useCart();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const empty = cart.count === 0;

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
            <ul className="shk-cart__lines">
              {cart.lines.map((l) => (
                <li key={l.id} className="shk-cart__line">
                  {l.kind === "bundle" ? (
                    <div className="shk-cart__line-main">
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
                      <div className="shk-cart__line-right">
                        <span className="shk-cart__line-price num">{currency}{cart.lineTotal(l)}</span>
                        <button type="button" className="shk-cart__rm" onClick={() => cart.remove(l.id)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="shk-cart__line-main">
                      <div className="shk-cart__line-info">
                        <span className="shk-cart__line-name">{l.dish.name}</span>
                        {l.config?.options?.length > 0 && (
                          <ul className="shk-cart__sub">
                            {l.config.options.map((o, i) => (
                              <li key={`${o.name}-${i}`}>
                                + {o.name}
                                {o.priceDelta > 0 ? ` (${currency}${o.priceDelta})` : ""}
                              </li>
                            ))}
                          </ul>
                        )}
                        <span className="shk-cart__line-unit num">
                          {currency}{l.price != null ? l.price : l.dish.price}
                        </span>
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
                <span className="num">{currency}{cart.total}</span>
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
