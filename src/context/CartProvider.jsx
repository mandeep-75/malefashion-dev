import { useEffect, useMemo, useReducer } from "react";
import { getProduct } from "../data/products";
import { CartContext } from "./cartContext";

const STORAGE_KEY = "malefashion.cart.v1";


const sameLine = (a, b) => a.id === b.id && a.size === b.size;

function reducer(state, action) {
  switch (action.type) {
    case "add": {
      const { id, qty = 1, size = "" } = action;
      const product = getProduct(id);
      if (!product) return state;
      const amount = Math.max(1, Math.floor(qty) || 1);
      const existing = state.findIndex((line) => sameLine(line, { id, size }));
      if (existing !== -1) {
        const next = [...state];
        next[existing] = { ...next[existing], qty: next[existing].qty + amount };
        return next;
      }
      return [...state, { id, size, qty: amount }];
    }
    case "setQty": {
      const { index, qty } = action;
      const next = [...state];
      if (!next[index]) return state;
      const parsed = Math.floor(qty);
      next[index] = { ...next[index], qty: Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 99) : 1 };
      return next;
    }
    case "remove":
      return state.filter((_, i) => i !== action.index);
    case "clear":
      return [];
    default:
      return state;
  }
}

const readStorage = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    // Drop anything that no longer exists in the catalog, so a stale entry
    // can never produce a NaN total.
    return parsed.filter((line) => line && getProduct(line.id));
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const [lines, dispatch] = useReducer(reducer, undefined, readStorage);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Storage blocked or full. The cart still works for this session.
    }
  }, [lines]);

  const value = useMemo(() => {
    const detailed = lines
      .map((line, index) => {
        const product = getProduct(line.id);
        if (!product) return null;
        return { ...line, index, product, lineTotal: product.price * line.qty };
      })
      .filter(Boolean);

    return {
      lines,
      detailed,
      count: lines.reduce((sum, line) => sum + line.qty, 0),
      subtotal: detailed.reduce((sum, line) => sum + line.lineTotal, 0),
      add: (id, qty, size) => dispatch({ type: "add", id, qty, size }),
      setQty: (index, qty) => dispatch({ type: "setQty", index, qty }),
      remove: (index) => dispatch({ type: "remove", index }),
      clear: () => dispatch({ type: "clear" }),
    };
  }, [lines]);

  return <CartContext value={value}>{children}</CartContext>;
}
