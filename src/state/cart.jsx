import { createContext, useContext, useMemo, useState } from "react";

/*
  Lightweight order builder for the showcase site. No payment — guests assemble
  an order and see the running total, then pay at the counter. Lines are one of:
    - plain dish        (stacks by id)
    - configured dish   (build-your-own: chosen options + computed unit price)
    - manakish bundle   (its chosen items + computed price)
  Configured dishes and bundles never stack — each build is its own line.
*/

const CartContext = createContext(null);

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `line-${Date.now()}-${Math.round(Math.random() * 1e6)}`;

export function CartProvider({ children }) {
  const [lines, setLines] = useState([]);

  const api = useMemo(() => {
    // Plain dishes stack by id (but never merge into a configured line).
    const addDish = (dish) =>
      setLines((prev) => {
        const existing = prev.find((l) => l.kind === "dish" && !l.config && l.dish.id === dish.id);
        if (existing) {
          return prev.map((l) => (l.id === existing.id ? { ...l, qty: l.qty + 1 } : l));
        }
        return [...prev, { kind: "dish", id: newId(), dish, qty: 1 }];
      });

    // A build-your-own dish: carries its chosen options + the configured unit
    // price so the line bills the real total, not the bare base. Never stacks.
    // build = { options: [{group, name, priceDelta}], total }
    const addConfiguredDish = (dish, build) =>
      setLines((prev) => [
        ...prev,
        {
          kind: "dish",
          id: newId(),
          dish,
          qty: 1,
          config: { options: build?.options ?? [] },
          price: build?.total ?? (Number(dish.price) || 0),
        },
      ]);

    // children: [{ dish, qty, role: 'manakish' | 'sauce' }]
    const addBundle = (label, children, price) =>
      setLines((prev) => [...prev, { kind: "bundle", id: newId(), label, children, price, qty: 1 }]);

    const setQty = (id, qty) =>
      setLines((prev) => prev.flatMap((l) => (l.id !== id ? [l] : qty <= 0 ? [] : [{ ...l, qty }])));

    const remove = (id) => setLines((prev) => prev.filter((l) => l.id !== id));
    const clear = () => setLines([]);

    // Bundles + configured dishes carry an explicit unit price; plain dishes use
    // the dish's base price.
    const lineTotal = (l) => (l.price != null ? l.price : Number(l.dish?.price) || 0) * l.qty;
    const count = lines.reduce((n, l) => n + l.qty, 0);
    const total = lines.reduce((s, l) => s + lineTotal(l), 0);

    // Dish ids currently in the order — lets the menu mark added items.
    const addedIds = new Set();
    for (const l of lines) {
      if (l.kind === "bundle") (l.children || []).forEach((c) => c.dish && addedIds.add(c.dish.id));
      else if (l.dish) addedIds.add(l.dish.id);
    }

    return { lines, count, total, addedIds, lineTotal, addDish, addConfiguredDish, addBundle, setQty, remove, clear };
  }, [lines]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
