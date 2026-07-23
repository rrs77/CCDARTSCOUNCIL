import { Check, ShoppingBag } from 'lucide-react';
import { formatPricePence, getPaidProduct } from '../../config/paidPartnerProducts';
import { usePaidBasket } from '../../contexts/PaidBasketContext';

/**
 * Add to basket CTA for WTD / iCompose paid demo products.
 */
export function AddToBasketButton({
  productId,
  className,
  variant = 'primary',
}: {
  productId: string;
  className?: string;
  variant?: 'primary' | 'secondary';
}) {
  const { addItem, isInBasket } = usePaidBasket();
  const product = getPaidProduct(productId);
  if (!product) return null;

  const inBasket = isInBasket(productId);
  const base =
    variant === 'secondary'
      ? 'border border-[#002D24]/25 bg-white text-[#002D24] hover:bg-[#E8F0EA]'
      : 'bg-[#002D24] text-white hover:opacity-95';

  return (
    <button
      type="button"
      onClick={() => addItem(productId)}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-opacity ${className || base}`}
    >
      {inBasket ? (
        <Check className="h-4 w-4" aria-hidden />
      ) : (
        <ShoppingBag className="h-4 w-4" aria-hidden />
      )}
      {inBasket
        ? 'In basket'
        : `Add to basket · ${formatPricePence(product.pricePence)}`}
    </button>
  );
}
