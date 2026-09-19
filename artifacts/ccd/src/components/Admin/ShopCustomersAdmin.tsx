/**
 * Platform admin — customer / purchase tracking across all hubs.
 * Hubs still keep their own Sales tab for product-only views.
 */

import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AdminShopCustomersPayload } from '../../types/shop';
import { loadAdminShopCustomers } from '../../utils/shopApi';
import { formatShopPence, loadLocalHubSales } from '../../utils/hubShopLocalStore';
import { PAID_PARTNER_PRODUCTS } from '../../config/paidPartnerProducts';

export function ShopCustomersAdmin() {
  const [data, setData] = useState<AdminShopCustomersPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [days, setDays] = useState(90);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await loadAdminShopCustomers({ days, q: q || undefined });
      setData(payload);
      if (payload.warning) toast(payload.warning, { icon: 'ℹ️' });
    } catch {
      // Aggregate local prototype sales across known partner org ids
      const orgIds = [...new Set(PAID_PARTNER_PRODUCTS.map((p) => p.partnerSlug))];
      let gross = 0;
      let orders = 0;
      const customersMap = new Map<string, AdminShopCustomersPayload['customers'][0]>();
      const hubs: AdminShopCustomersPayload['hubs'] = {};
      for (const id of orgIds) {
        const sales = loadLocalHubSales(id, days);
        gross += sales.gross_pence;
        orders += sales.total_orders;
        hubs[id] = {
          organisation_id: id,
          gross_pence: sales.gross_pence,
          units: sales.total_units,
          order_count: sales.total_orders,
        };
        for (const c of sales.customers) {
          const key = c.buyer_email || c.buyer_user_id || id;
          const prev = customersMap.get(key) || {
            buyer_email: c.buyer_email,
            buyer_user_id: c.buyer_user_id,
            spent_pence: 0,
            orders: 0,
            hubs: [],
            last_purchase_at: null,
            products: [],
          };
          prev.spent_pence += c.spent_pence;
          prev.orders += c.orders;
          if (!prev.hubs?.includes(id)) prev.hubs = [...(prev.hubs || []), id];
          if (
            !prev.last_purchase_at ||
            (c.last_purchase_at && c.last_purchase_at > prev.last_purchase_at)
          ) {
            prev.last_purchase_at = c.last_purchase_at;
          }
          customersMap.set(key, prev);
        }
      }
      setData({
        days,
        total_orders: orders,
        gross_pence: gross,
        currency: 'gbp',
        customers: [...customersMap.values()],
        hubs,
        warning: 'Showing prototype local sales (admin API unavailable).',
      });
    } finally {
      setLoading(false);
    }
  }, [days, q]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Users className="mt-0.5 h-5 w-5 text-[#002D24]" aria-hidden />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Shop customers</h3>
            <p className="text-sm text-gray-600">
              Platform-wide purchase tracking. Each hub also has its own Sales view for its products
              only.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email or product"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
          <option value={365}>365 days</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : !data ? null : (
        <>
          {data.warning && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">{data.warning}</p>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-white px-4 py-3">
              <p className="text-xs uppercase text-gray-500">Orders</p>
              <p className="text-xl font-semibold text-[#002D24]">{data.total_orders}</p>
            </div>
            <div className="rounded-xl border bg-white px-4 py-3">
              <p className="text-xs uppercase text-gray-500">Gross</p>
              <p className="text-xl font-semibold text-[#002D24]">
                {formatShopPence(data.gross_pence)}
              </p>
            </div>
            <div className="rounded-xl border bg-white px-4 py-3">
              <p className="text-xs uppercase text-gray-500">Customers</p>
              <p className="text-xl font-semibold text-[#002D24]">{data.customers.length}</p>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <h4 className="mb-2 text-sm font-semibold">By hub</h4>
            <ul className="space-y-1 text-sm">
              {Object.values(data.hubs || {}).map((h) => (
                <li key={h.organisation_id} className="flex justify-between gap-2">
                  <span>{h.organisation_id}</span>
                  <span className="text-gray-600">
                    {h.order_count} orders · {formatShopPence(h.gross_pence)}
                  </span>
                </li>
              ))}
              {Object.keys(data.hubs || {}).length === 0 && (
                <li className="text-gray-500">No hub sales in this period.</li>
              )}
            </ul>
          </div>

          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Hubs</th>
                  <th className="px-3 py-2">Orders</th>
                  <th className="px-3 py-2">Spent</th>
                  <th className="px-3 py-2">Last purchase</th>
                </tr>
              </thead>
              <tbody>
                {data.customers.map((c) => (
                  <tr
                    key={c.buyer_email || c.buyer_user_id || Math.random()}
                    className="border-b last:border-0"
                  >
                    <td className="px-3 py-2 font-medium">{c.buyer_email || '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{(c.hubs || []).join(', ') || '—'}</td>
                    <td className="px-3 py-2">{c.orders}</td>
                    <td className="px-3 py-2">{formatShopPence(c.spent_pence)}</td>
                    <td className="px-3 py-2 text-gray-600">
                      {c.last_purchase_at
                        ? new Date(c.last_purchase_at).toLocaleString('en-GB')
                        : '—'}
                    </td>
                  </tr>
                ))}
                {data.customers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                      No customers yet — complete a hub shop checkout to populate.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
