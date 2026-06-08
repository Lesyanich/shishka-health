import { createContext, useContext, useMemo, useState } from "react";

/*
  Lightweight order builder for the showcase site. No payment — guests assemble
  an order and see the running total, then pay at the counter. Lines are either
  a plain dish or a configured manakish bundle (its chosen items + computed price).
*/

const CartContext = createContext(null);

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `line-${Date.now()}-${Math.round(Math.random() * 1e6)}`;

export function CartProvider({ children }) {
  const [lines, setLines] = useState([]);

  const api = useMemo(() => {
    // Plain dishes stack by id; bundles never stack (each build is its own line).
    const addDish = (dish) =>
      setLines((prev) => {
        const existing = prev.find((l) => l.kind === "dish" && l.dish.id === dish.id);
        if (existing) {
          return prev.map((l) => (l.id === existing.id ? { ...l, qty: l.qty + 1 } : l));
        }
        return [...prev, { kind: "dish", id: newId(), dish, qty: 1 }];
      });

    // children: [{ dish, qty, role: 'manakish' | 'sauce' }]
    const addBundle = (label, children, price) =>
      setLines((prev) => [...prev, { kind: "bundle", id: newId(), label, children, price, qty: 1 }]);

    const setQty = (id, qty) =>
      setLines((prev) => prev.flatMap((l) => (l.id !== id ? [l] : qty <= 0 ? [] : [{ ...l, qty }])));

    const remove = (id) => setLines((prev) => prev.filter((l) => l.id !== id));
    const clear = () => setLines([]);

    const lineTotal = (l) => (l.kind === "bundle" ? l.price : Number(l.dish.price) || 0) * l.qty;
    const count = lines.reduce((n, l) => n + l.qty, 0);
    const total = lines.reduce((s, l) => s + lineTotal(l), 0);

    return { lines, count, total, lineTotal, addDish, addBundle, setQty, remove, clear };
  }, [lines]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
