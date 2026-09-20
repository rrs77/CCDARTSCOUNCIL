/**
 * Hub Admin — Shop (sell courses/resources) + Sales (this hub only).
 */

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, ShoppingBag, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import type { HubProduct, HubSalesSummary } from '../../types/shop';
import {
  createHubProduct,
  listHubProducts,
  loadHubSales,
  updateHubProduct,
} from '../../utils/shopApi';
import {
  createLocalHubProduct,
  formatShopPence,
  listLocalHubProducts,
  loadLocalHubSales,
  updateLocalHubProduct,
} from '../../utils/hubShopLocalStore';

export function HubShopSection({ hubId }: { hubId: string }) {
  const [products, setProducts] = useState<HubProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingLocal, setUsingLocal] = useState(false);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('25.00');
  const [meta, setMeta] = useState('');
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listHubProducts(hubId, { all: true });
      setProducts(data.products || []);
      setUsingLocal(false);
      if (data.warning) toast(data.warning, { icon: 'ℹ️' });
    } catch {
      setProducts(listLocalHubProducts(hubId, true));
      setUsingLocal(true);
    } finally {
      setLoading(false);
    }
  }, [hubId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addProduct = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error('Title is required');
      return;
    }
    const pounds = Number(price);
    if (!Number.isFinite(pounds) || pounds < 0) {
      toast.error('Enter a valid price');
      return;
    }
    const price_pence = Math.round(pounds * 100);
    setSaving(true);
    try {
      if (usingLocal) {
        createLocalHubProduct(hubId, {
          title: trimmed,
          price_pence,
          meta_label: meta.trim() || undefined,
        });
        toast.success('Product added (local fallback — sign in + migration for live shop)');
      } else {
        await createHubProduct(hubId, {
          title: trimmed,
          price_pence,
          meta_label: meta.trim() || undefined,
          status: 'published',
          fulfillment_type: 'manual',
        });
        toast.success('Product published — teachers can buy from this hub');
      }
      setTitle('');
      setMeta('');
      setPrice('25.00');
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create product');
      createLocalHubProduct(hubId, {
        title: trimmed,
        price_pence,
        meta_label: meta.trim() || undefined,
      });
      setUsingLocal(true);
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (product: HubProduct, action: 'publish' | 'unpublish' | 'archive') => {
    try {
      if (usingLocal) {
        updateLocalHubProduct(hubId, product.id, { action });
      } else {
        await updateHubProduct(hubId, product.id, { action });
      }
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <ShoppingBag className="mt-0.5 h-5 w-5 text-[#002D24]" aria-hidden />
        <div>
          <h3 className="font-semibold text-gray-900">Shop — sell on this hub</h3>
          <p className="text-sm text-gray-600">
            Add courses and resources with a price. Teachers check out via the basket; Stripe takes
            payment when configured. Sales for <strong>this hub only</strong> appear under Sales.
          </p>
          {usingLocal && (
            <p className="mt-1 text-xs text-amber-800">
              Shop API unavailable — using a local fallback. Sign in as a hub administrator with the
              shop migration applied for live product + sales tracking (not the working prototype).
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="mb-3 text-sm font-medium text-gray-800">New product</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-gray-600 sm:col-span-2">
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="e.g. KS3 Improvisation course"
            />
          </label>
          <label className="block text-xs font-medium text-gray-600">
            Price (GBP)
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              inputMode="decimal"
            />
          </label>
          <label className="block text-xs font-medium text-gray-600">
            Short label
            <input
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="KS3 · 6 lessons"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={() => void addProduct()}
          disabled={saving}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#002D24] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add &amp; publish
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading products…
        </div>
      ) : products.length === 0 ? (
        <p className="text-sm text-gray-500">No products yet — add a course or resource above.</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {products.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div className="min-w-0">
                <p className="font-medium text-gray-900">{p.title}</p>
                <p className="text-xs text-gray-500">
                  {formatShopPence(p.price_pence)} · {p.status}
                  {p.meta_label ? ` · ${p.meta_label}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {p.status !== 'published' && (
                  <button
                    type="button"
                    className="rounded-md border px-2 py-1 text-xs font-medium"
                    onClick={() => void setStatus(p, 'publish')}
                  >
                    Publish
                  </button>
                )}
                {p.status === 'published' && (
                  <button
                    type="button"
                    className="rounded-md border px-2 py-1 text-xs font-medium"
                    onClick={() => void setStatus(p, 'unpublish')}
                  >
                    Unpublish
                  </button>
                )}
                <button
                  type="button"
                  className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700"
                  onClick={() => void setStatus(p, 'archive')}
                >
                  Archive
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function HubSalesSection({ hubId }: { hubId: string }) {
  const [data, setData] = useState<HubSalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingLocal, setUsingLocal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const sales = await loadHubSales(hubId, 90);
        if (!cancelled) {
          setData(sales);
          setUsingLocal(false);
        }
      } catch {
        if (!cancelled) {
          setData(loadLocalHubSales(hubId, 90));
          setUsingLocal(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hubId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading sales…
      </div>
    );
  }

  if (!data) return null;

  const products = Object.values(data.by_product || {});

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <TrendingUp className="mt-0.5 h-5 w-5 text-[#002D24]" aria-hidden />
        <div>
          <h3 className="font-semibold text-gray-900">Sales — this hub only</h3>
          <p className="text-sm text-gray-600">
            Independent of other hubs and separate from download analytics. Last {data.days} days.
          </p>
          {usingLocal && (
            <p className="mt-1 text-xs text-amber-800">
              Showing local fallback sales. Sign in and apply the shop migration for live hub Sales
              tracking after teacher checkouts.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Orders" value={String(data.total_orders)} />
        <Stat label="Units sold" value={String(data.total_units)} />
        <Stat label="Gross" value={formatShopPence(data.gross_pence)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h4 className="mb-2 text-sm font-semibold text-gray-800">By product</h4>
          {products.length === 0 ? (
            <p className="text-sm text-gray-500">No sales yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {products.map((p) => (
                <li key={p.product_id || p.title} className="flex justify-between gap-2">
                  <span className="min-w-0 truncate">{p.title}</span>
                  <span className="shrink-0 text-gray-600">
                    {p.units} · {formatShopPence(p.gross_pence)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h4 className="mb-2 text-sm font-semibold text-gray-800">Customers</h4>
          {data.customers.length === 0 ? (
            <p className="text-sm text-gray-500">No customers yet.</p>
          ) : (
            <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
              {data.customers.map((c) => (
                <li key={c.buyer_email || c.buyer_user_id || c.last_purchase_at || Math.random()}>
                  <p className="font-medium text-gray-900">{c.buyer_email || 'Unknown buyer'}</p>
                  <p className="text-xs text-gray-500">
                    {c.orders} order(s) · {formatShopPence(c.spent_pence)}
                    {c.last_purchase_at
                      ? ` · last ${new Date(c.last_purchase_at).toLocaleDateString('en-GB')}`
                      : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[#002D24]">{value}</p>
    </div>
  );
}
