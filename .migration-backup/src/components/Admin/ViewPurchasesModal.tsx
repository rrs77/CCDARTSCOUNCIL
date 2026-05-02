import React, { useEffect, useState } from 'react';
import { X, Loader2, ShoppingBag } from 'lucide-react';
import { supabase } from '../../config/supabase';
import type { Profile } from '../../types/auth';
import type { UserPurchase } from '../../types/auth';

interface ViewPurchasesModalProps {
  user: Profile;
  onClose: () => void;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

export function ViewPurchasesModal({ user, onClose }: ViewPurchasesModalProps) {
  const [purchases, setPurchases] = useState<UserPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('user_purchases')
      .select('*')
      .eq('user_id', user.id)
      .order('purchased_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          setError(err.message);
          setPurchases([]);
          return;
        }
        setPurchases((data as UserPurchase[]) ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user.id]);

  const subscriptionStatus = purchases.length === 0
    ? 'None'
    : purchases.some(p => p.status === 'active')
      ? 'Active'
      : purchases.some(p => p.status === 'expired')
        ? 'Expired'
        : 'None';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">View Purchases</h2>
          <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          <p className="text-sm text-gray-600 mb-4">
            {user.display_name || user.email || user.id}
          </p>
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-700">Subscription status: </span>
            <span className={`text-sm font-medium ${subscriptionStatus === 'Active' ? 'text-green-700' : subscriptionStatus === 'Expired' ? 'text-amber-700' : 'text-gray-600'}`}>
              {subscriptionStatus}
            </span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
          ) : error ? (
            <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
              {error}. Ensure <code className="bg-amber-100 px-1 rounded">profiles_status_and_purchases.sql</code> has been run to create the <code className="bg-amber-100 px-1 rounded">user_purchases</code> table.
            </p>
          ) : purchases.length === 0 ? (
            <p className="text-sm text-gray-500">No purchases recorded.</p>
          ) : (
            <ul className="space-y-2">
              {purchases.map((p) => (
                <li key={p.id} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg">
                  <ShoppingBag className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{p.product_name}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(p.purchased_at)}
                      {p.expires_at ? ` · Expires ${formatDate(p.expires_at)}` : ''}
                      {p.status ? ` · ${p.status}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
