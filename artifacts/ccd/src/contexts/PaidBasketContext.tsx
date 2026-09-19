/**
 * Paid / hub-shop basket. Checkout uses Stripe when configured; otherwise demo
 * fulfilment + per-hub local sales tracking so Preview still works.
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
import {
  canSeedPaidProduct,
  seedPaidPartnerProduct,
} from '../utils/seedPaidPartnerProduct';
import { recordLocalDemoCheckout } from '../utils/hubShopLocalStore';
import { startShopCheckout } from '../utils/shopApi';
import { useAuth } from '../hooks/useAuth';

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
  checkingOut: boolean;
  setDrawerOpen: (open: boolean) => void;
  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  clearBasket: () => void;
  isInBasket: (productId: string) => boolean;
  /** @deprecated use checkout */
  checkoutDemo: () => void;
  checkout: () => Promise<void>;
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

async function seedLines(productIds: string[]) {
  let seeded = 0;
  for (const id of productIds) {
    if (!canSeedPaidProduct(id)) continue;
    try {
      const result = await seedPaidPartnerProduct(id, { force: true });
      if (result && !result.skipped) seeded += 1;
    } catch (e) {
      console.error(e);
    }
  }
  return seeded;
}

export function PaidBasketProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<BasketLine[]>(() => readStored());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

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
      toast.success(`Added to basket · ${formatPricePence(product.pricePence)}`);
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

  const finishLocalDemo = useCallback(
    async (message?: string) => {
      const buyerEmail =
        profile?.email || user?.email || 'demo@ccd.preview';
      recordLocalDemoCheckout({
        buyerEmail,
        lines: lines.map((l) => ({ product: l.product, quantity: l.quantity })),
      });
      const seeded = await seedLines(lines.map((l) => l.productId));
      toast.success(
        message ||
          `Checkout complete (demo). ${formatPricePence(totalPence)} recorded for hub sales tracking.${
            seeded ? ` Seeded ${seeded} pack(s) into your library.` : ''
          }`,
        { duration: 7000 },
      );
      clearBasket();
      setDrawerOpen(false);
    },
    [lines, profile?.email, user?.email, totalPence, clearBasket],
  );

  const checkout = useCallback(async () => {
    if (lines.length === 0) {
      toast.error('Your basket is empty');
      return;
    }
    setCheckingOut(true);
    try {
      // Catalogue ids from paidPartnerProducts are not DB UUIDs — use local
      // hub sales tracking + optional Stripe path once hub_products are linked.
      const looksLikeUuid = lines.every((l) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          l.productId,
        ),
      );

      if (!looksLikeUuid) {
        await finishLocalDemo(
          'Demo checkout — sale recorded on each hub’s Sales dashboard. Connect Stripe + hub_products for live card payments.',
        );
        return;
      }

      const result = await startShopCheckout({
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        successUrl: `${window.location.origin}/?shop=success`,
        cancelUrl: `${window.location.origin}/?shop=cancel`,
      });

      if (result.mode === 'stripe' && result.checkout_url) {
        window.location.assign(result.checkout_url);
        return;
      }

      if (result.mode === 'demo') {
        const seedIds = result.seed_product_ids?.length
          ? result.seed_product_ids
          : lines.map((l) => l.productId);
        await seedLines(seedIds);
        recordLocalDemoCheckout({
          buyerEmail: profile?.email || user?.email || 'demo@ccd.preview',
          lines: lines.map((l) => ({ product: l.product, quantity: l.quantity })),
        });
        toast.success(result.message || 'Demo checkout complete — hubs can see this sale.');
        clearBasket();
        setDrawerOpen(false);
        return;
      }
    } catch (e) {
      console.warn('Shop checkout API unavailable, using local demo path', e);
      await finishLocalDemo(
        'Checkout saved locally for hub sales tracking (API/Stripe not available in this session).',
      );
    } finally {
      setCheckingOut(false);
    }
  }, [lines, finishLocalDemo, clearBasket, profile?.email, user?.email]);

  const value = useMemo(
    () => ({
      items,
      lines,
      itemCount,
      totalPence,
      drawerOpen,
      checkingOut,
      setDrawerOpen,
      addItem,
      removeItem,
      clearBasket,
      isInBasket,
      checkoutDemo: () => {
        void checkout();
      },
      checkout,
    }),
    [
      items,
      lines,
      itemCount,
      totalPence,
      drawerOpen,
      checkingOut,
      addItem,
      removeItem,
      clearBasket,
      isInBasket,
      checkout,
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
