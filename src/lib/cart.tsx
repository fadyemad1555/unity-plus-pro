import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = {
  id: string; name_en: string; name_ar: string;
  price: number; discount_percent: number; image: string; quantity: number;
};

type Ctx = {
  items: CartItem[];
  add: (i: Omit<CartItem, "quantity">, q?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, q: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};
const CartCtx = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try { setItems(JSON.parse(localStorage.getItem("cart") || "[]")); } catch {}
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  const add: Ctx["add"] = (i, q = 1) => setItems(prev => {
    const ex = prev.find(p => p.id === i.id);
    if (ex) return prev.map(p => p.id === i.id ? { ...p, quantity: p.quantity + q } : p);
    return [...prev, { ...i, quantity: q }];
  });
  const remove = (id: string) => setItems(prev => prev.filter(p => p.id !== id));
  const setQty = (id: string, q: number) => setItems(prev => prev.map(p => p.id === id ? { ...p, quantity: Math.max(1, q) } : p));
  const clear = () => setItems([]);
  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.quantity * i.price * (1 - i.discount_percent / 100), 0);

  return <CartCtx.Provider value={{ items, add, remove, setQty, clear, count, subtotal }}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart must be used within CartProvider");
  return c;
}

// Favorites
type FavCtx = { ids: string[]; toggle: (id: string) => void; has: (id: string) => boolean; };
const FavContext = createContext<FavCtx | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try { setIds(JSON.parse(localStorage.getItem("favorites") || "[]")); } catch {}
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("favorites", JSON.stringify(ids));
  }, [ids]);
  const toggle = (id: string) => setIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  const has = (id: string) => ids.includes(id);
  return <FavContext.Provider value={{ ids, toggle, has }}>{children}</FavContext.Provider>;
}

export function useFavorites() {
  const c = useContext(FavContext);
  if (!c) throw new Error("useFavorites must be used within FavoritesProvider");
  return c;
}
