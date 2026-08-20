"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import type { MenuItem } from "./menu";

export type CartLine = {
  id: string;
  quantity: number;
  /** Snapshot for display only. The server re-prices from the menu source. */
  price: number;
};

type State = { lines: CartLine[] };

type Action =
  | { type: "add"; id: string; price: number }
  | { type: "decrement"; id: string }
  | { type: "remove"; id: string }
  | { type: "clear" }
  | { type: "hydrate"; lines: CartLine[] };

const STORAGE_KEY = "kyoto.cart.v1";

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "add": {
      const existing = state.lines.find((l) => l.id === action.id);
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.id === action.id ? { ...l, quantity: Math.min(l.quantity + 1, 40) } : l,
          ),
        };
      }
      return { lines: [...state.lines, { id: action.id, quantity: 1, price: action.price }] };
    }
    case "decrement": {
      return {
        lines: state.lines.flatMap((l) =>
          l.id === action.id
            ? l.quantity <= 1
              ? []
              : [{ ...l, quantity: l.quantity - 1 }]
            : [l],
        ),
      };
    }
    case "remove":
      return { lines: state.lines.filter((l) => l.id !== action.id) };
    case "clear":
      return { lines: [] };
    case "hydrate":
      return { lines: action.lines };
  }
}

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  /** False until localStorage has been read, so SSR and first paint agree. */
  ready: boolean;
  add: (item: MenuItem) => void;
  decrement: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  quantityOf: (id: string) => number;
  /** Drawer open state lives here so the header badge and the drawer agree. */
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { lines: [] });
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Read once on mount. Rendering the stored cart during SSR would mismatch.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartLine[];
        if (Array.isArray(parsed)) dispatch({ type: "hydrate", lines: parsed });
      }
    } catch {
      // A corrupt cart is not worth a broken page.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines));
    } catch {
      // Private mode, quota, whatever — the cart still works in memory.
    }
  }, [state.lines, ready]);

  const add = useCallback((item: MenuItem) => {
    dispatch({ type: "add", id: item.id, price: item.price });
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const count = state.lines.reduce((n, l) => n + l.quantity, 0);
    const subtotal = state.lines.reduce((n, l) => n + l.price * l.quantity, 0);
    return {
      lines: state.lines,
      count,
      subtotal,
      ready,
      add,
      decrement: (id) => dispatch({ type: "decrement", id }),
      remove: (id) => dispatch({ type: "remove", id }),
      clear: () => dispatch({ type: "clear" }),
      quantityOf: (id) => state.lines.find((l) => l.id === id)?.quantity ?? 0,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    };
  }, [state.lines, ready, add, drawerOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
