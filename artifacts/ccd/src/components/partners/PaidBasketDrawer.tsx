import { ShoppingBag, Trash2, X } from 'lucide-react';
import { formatPricePence } from '../../config/paidPartnerProducts';
import { usePaidBasket } from '../../contexts/PaidBasketContext';

/**
 * Sliding demo basket for We Teach Drama + iCompose paid resources.
 */
export function PaidBasketDrawer() {
  const {
    lines,
    itemCount,
    totalPence,
    drawerOpen,
    setDrawerOpen,
    removeItem,
    clearBasket,
    checkoutDemo,
  } = usePaidBasket();

  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Demo basket">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close basket"
        onClick={() => setDrawerOpen(false)}
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-[#002D24]/10 px-4 py-4 sm:px-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#002D24]/55">
              Demo basket
            </p>
            <h2 className="text-lg font-semibold text-[#002D24]">
              Paid resources ({itemCount})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
            Prototype only — no payment is taken. Items are placeholders for We Teach Drama and
            iCompose paid packs.
          </p>

          {lines.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center text-gray-500">
              <ShoppingBag className="h-10 w-10 text-gray-300" aria-hidden />
              <p className="text-sm">Your basket is empty.</p>
              <p className="max-w-xs text-xs">
                Open We Teach Drama or iCompose and use Add to basket on a paid resource.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {lines.map(({ product, quantity }) => (
                <li
                  key={product.id}
                  className="flex gap-3 rounded-xl border border-gray-200 bg-[#E8F0EA]/40 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#002D24]/55">
                      {product.partnerName}
                    </p>
                    <h3 className="mt-0.5 text-sm font-semibold leading-snug text-gray-900">
                      {product.title}
                    </h3>
                    {product.meta && (
                      <p className="mt-0.5 text-xs text-gray-500">{product.meta}</p>
                    )}
                    <p className="mt-1.5 text-sm font-medium text-[#002D24]">
                      {formatPricePence(product.pricePence)}
                      {quantity > 1 ? ` × ${quantity}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(product.id)}
                    className="self-start rounded-md p-1.5 text-gray-400 hover:bg-white hover:text-red-600"
                    aria-label={`Remove ${product.title}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="border-t border-[#002D24]/10 bg-[#E8F0EA]/50 px-4 py-4 sm:px-5">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-sm text-gray-600">Demo total</span>
            <span className="text-lg font-semibold text-[#002D24]">
              {formatPricePence(totalPence)}
            </span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={checkoutDemo}
              disabled={lines.length === 0}
              className="inline-flex flex-1 items-center justify-center rounded-lg bg-[#002D24] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Checkout (demo)
            </button>
            <button
              type="button"
              onClick={clearBasket}
              disabled={lines.length === 0}
              className="inline-flex items-center justify-center rounded-lg border border-[#002D24]/20 px-4 py-2.5 text-sm font-medium text-[#002D24] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}

/** Compact basket trigger — use on Partner Hubs tab and paid hub pages. */
export function PaidBasketButton({ className = '' }: { className?: string }) {
  const { itemCount, setDrawerOpen } = usePaidBasket();

  return (
    <button
      type="button"
      onClick={() => setDrawerOpen(true)}
      className={`relative inline-flex items-center gap-2 rounded-lg border border-[#002D24]/20 bg-white px-3 py-2 text-sm font-semibold text-[#002D24] shadow-sm transition-colors hover:border-[#002D24]/40 hover:bg-[#E8F0EA] ${className}`}
      aria-label={`Open demo basket${itemCount ? `, ${itemCount} items` : ''}`}
    >
      <ShoppingBag className="h-4 w-4" aria-hidden />
      Basket
      {itemCount > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#A3E635] px-1 text-[11px] font-bold text-[#002D24]">
          {itemCount}
        </span>
      )}
    </button>
  );
}
