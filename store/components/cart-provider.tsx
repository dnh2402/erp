"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartLine, Product } from "@/lib/types";

type CartContextType = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  subtotal: number;
  add: (product: Product, size: string, color: string, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};
const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = "dseb-store-cart-v1";
const lineKey = (line: Pick<CartLine,"product"> & {size:string;color:string}) => `${line.product.id}:${line.size}:${line.color}`;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // localStorage is unavailable during SSR, so hydrate the cart after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { const saved = localStorage.getItem(STORAGE_KEY); if (saved) setLines(JSON.parse(saved) as CartLine[]); }
    catch { localStorage.removeItem(STORAGE_KEY); }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(lines)); }, [lines, ready]);
  const add = useCallback((product: Product, size: string, color: string, quantity = 1) => {
    if (!size || !color || quantity < 1) throw new Error("Chọn size và màu trước khi thêm vào giỏ.");
    const key = `${product.id}:${size}:${color}`;
    const existing = lines.find((line) => lineKey(line) === key);
    const requested = (existing?.quantity ?? 0) + quantity;
    if (requested > product.available) throw new Error("Số lượng vượt quá tồn kho hiện có.");
    setLines(existing
      ? lines.map((line) => lineKey(line) === key ? { ...line, quantity: requested, product } : line)
      : [...lines, { product, size, color, quantity }]);
  }, [lines]);
  const setQuantity = useCallback((key: string, quantity: number) => setLines((current) => current.map((line) => lineKey(line) === key ? { ...line, quantity: Math.max(1, Math.min(quantity, line.product.available)) } : line)), []);
  const remove = useCallback((key: string) => setLines((current) => current.filter((line) => lineKey(line) !== key)), []);
  const clear = useCallback(() => setLines([]), []);
  const value = useMemo(() => ({ lines, ready, count: lines.reduce((n,l) => n+l.quantity,0), subtotal: lines.reduce((n,l) => n+Number(l.product.price)*l.quantity,0), add, setQuantity, remove, clear }), [lines, ready, add, setQuantity, remove, clear]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() { const value = useContext(CartContext); if (!value) throw new Error("useCart must be used inside CartProvider"); return value; }
