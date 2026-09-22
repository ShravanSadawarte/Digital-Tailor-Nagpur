"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  product_id: string;
  name: string;
  price: number;
  size: string;
  qty: number;
  image?: string;
};

type CartCtx = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (product_id: string, size: string) => void;
  setQty: (product_id: string, size: string, qty: number) => void;
  clear: () => void;
  count: number;
  total: number;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "dt_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const add: CartCtx["add"] = (item, qty = 1) => {
    setItems((prev) => {
      const i = prev.findIndex(
        (p) => p.product_id === item.product_id && p.size === item.size
      );
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: next[i].qty + qty };
        return next;
      }
      return [...prev, { ...item, qty }];
    });
  };

  const remove = (product_id: string, size: string) =>
    setItems((prev) =>
      prev.filter((p) => !(p.product_id === product_id && p.size === size))
    );

  const setQty = (product_id: string, size: string, qty: number) =>
    setItems((prev) =>
      qty <= 0
        ? prev.filter(
            (p) => !(p.product_id === product_id && p.size === size)
          )
        : prev.map((p) =>
            p.product_id === product_id && p.size === size ? { ...p, qty } : p
          )
    );

  const clear = () => setItems([]);
  const count = items.reduce((n, i) => n + i.qty, 0);
  const total = items.reduce((n, i) => n + i.qty * i.price, 0);

  return (
    <Ctx.Provider
      value={{ items, add, remove, setQty, clear, count, total }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
