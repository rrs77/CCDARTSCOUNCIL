/**
 * Demo basket for We Teach Drama + iCompose paid resources.
 * Persists to localStorage; checkout is a prototype toast only.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import toast from 'react-hot-toast';
import {
  formatPricePence,
  getPaidProduct,
  type PaidPartnerProduct,
} from '../config/paidPartnerProducts';

const STORAGE_KEY = 'ccd-paid-partner-basket-v1';

export interface BasketLine {
  productId: string;
  quantity: number;
}

interface PaidBasketContextValue {
  items: BasketLine[];
  lines: Array<BasketLine & { product: PaidPartnerProduct }>;
  itemCount: number;
  totalPence: number;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  clearBasket: () => void;
  isInBasket: (productId: string) => boolean;
  checkoutDemo: () => void;
}

const PaidBasketContext = createContext<PaidBasketContextValue | null>(null);

function readStored(): BasketLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BasketLine[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (line) =>
        line &&
        typeof line.productId === 'string' &&
        typeof line.quantity === 'number' &&
        line.quantity > 0 &&
        getPaidProduct(line.productId),
    );
  } catch {
    return [];
  }
}

export function PaidBasketProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<BasketLine[]>(() => readStored());
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* localStorage may be blocked */
    }
  }, [items]);

  const lines = useMemo(
    () =>
      items
        .map((line) => {
          const product = getPaidProduct(line.productId);
          return product ? { ...line, product } : null;
        })
        .filter((x): x is BasketLine & { product: PaidPartnerProduct } => x !== null),
    [items],
  );

  const itemCount = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity, 0),
    [lines],
  );

  const totalPence = useMemo(
    () => lines.reduce((sum, line) => sum + line.product.pricePence * line.quantity, 0),
    [lines],
  );

  const addItem = useCallback((productId: string) => {
    const product = getPaidProduct(productId);
    if (!product) return;
    setItems((prev) => {
      if (prev.some((l) => l.productId === productId)) {
        toast.success(`${product.title} is already in your basket`);
        return prev;
      }
      toast.success(`Added to basket · ${formatPricePence(product.pricePence)} (demo)`);
      return [...prev, { productId, quantity: 1 }];
    });
    setDrawerOpen(true);
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const clearBasket = useCallback(() => setItems([]), []);

  const isInBasket = useCallback(
    (productId: string) => items.some((l) => l.productId === productId),
    [items],
  );

  const checkoutDemo = useCallback(() => {
    if (lines.length === 0) {
      toast.error('Your basket is empty');
      return;
    }
    toast(
      (t) => (
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-[#002D24]">Demo checkout only</p>
          <p className="text-gray-600">
            No payment is taken. This basket ({formatPricePence(totalPence)}) is a prototype
            for We Teach Drama and iCompose paid resources.
          </p>
          <button
            type="button"
            className="mt-1 text-xs font-medium text-teal-700 underline"
            onClick={() => toast.dismiss(t.id)}
          >
            Dismiss
          </button>
        </div>
      ),
      { duration: 8000 },
    );
    clearBasket();
    setDrawerOpen(false);
  }, [lines.length, totalPence, clearBasket]);

  const value = useMemo(
    () => ({
      items,
      lines,
      itemCount,
      totalPence,
      drawerOpen,
      setDrawerOpen,
      addItem,
      removeItem,
      clearBasket,
      isInBasket,
      checkoutDemo,
    }),
    [
      items,
      lines,
      itemCount,
      totalPence,
      drawerOpen,
      addItem,
      removeItem,
      clearBasket,
      isInBasket,
      checkoutDemo,
    ],
  );

  return (
    <PaidBasketContext.Provider value={value}>{children}</PaidBasketContext.Provider>
  );
}

export function usePaidBasket(): PaidBasketContextValue {
  const ctx = useContext(PaidBasketContext);
  if (!ctx) {
    throw new Error('usePaidBasket must be used within PaidBasketProvider');
  }
  return ctx;
}
