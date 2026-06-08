import { useState } from "react";
import { useCart } from "../../state/cart.jsx";
import { IconButton } from "../primitives/IconButton.jsx";
import { XIcon } from "../Icons.jsx";

/*
  Order builder UI. A floating bar shows the running total; tapping it opens a
  drawer listing the chosen items + total. No payment — guests pay at the counter.
*/
export function Cart({ currency = "฿" }) {
  const cart = useCart();
  const [open, setOpen] = useState(false);

  if (cart.count === 0) return null;

  return (
    <>
      {!open && (
        <button type="button" className="shk-cartbar" onClick={() => setOpen(true)}>
          <span className="shk-cartbar__count num">{cart.count}</span>
          <span className="shk-cartbar__label">View order</span>
          <span className="shk-cartbar__total num">{currency}{cart.total}</span>
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
                        <span className="shk-cart__line-unit num">{currency}{l.dish.price}</span>
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
              <div className="shk-cart__total-row">
                <span>Total</span>
                <span className="num">{currency}{cart.total}</span>
              </div>
              <p className="shk-cart__note">Pay at the counter — no online payment. Show this total to our team.</p>
              <button type="button" className="shk-cart__clear" onClick={cart.clear}>Clear order</button>
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}
