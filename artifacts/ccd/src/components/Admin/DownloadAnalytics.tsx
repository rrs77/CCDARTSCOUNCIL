import React, { useCallback, useEffect, useState } from 'react';
import { BarChart3, Download, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { getVercelApiUrl } from '../../utils/apiUrl';
import toast from 'react-hot-toast';

interface AnalyticsPayload {
  total: number;
  timezone: string;
  scope: string;
  organisation_id: string | null;
  summary: {
    byResource: Record<string, number>;
    byCountry: Record<string, number>;
    byDay: Record<string, number>;
  };
  events: Array<{
    id: string;
    resource_id: string;
    resource_title?: string;
    user_id?: string;
    partner_slug?: string;
    geo_country?: string;
    created_at_uk?: string;
    created_at: string;
  }>;
}

export function DownloadAnalytics() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partnerSlug, setPartnerSlug] = useState('jazznorth');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Sign in required.');
        return;
      }
      const params = new URLSearchParams();
      if (partnerSlug) params.set('partner_slug', partnerSlug);
      if (from) params.set('from', new Date(from).toISOString());
      if (to) params.set('to', new Date(to + 'T23:59:59').toISOString());
      const res = await fetch(
        `${getVercelApiUrl('/api/downloads/analytics')}?${params.toString()}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Failed (${res.status})`);
      setData(json as AnalyticsPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [partnerSlug, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const exportFile = async (format: 'csv' | 'xlsx') => {
    setExporting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Sign in required');
      const params = new URLSearchParams({ format });
      if (partnerSlug) params.set('partner_slug', partnerSlug);
      if (from) params.set('from', new Date(from).toISOString());
      if (to) params.set('to', new Date(to + 'T23:59:59').toISOString());
      const res = await fetch(
        `${getVercelApiUrl('/api/downloads/export')}?${params.toString()}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Export failed (${res.status})`);
      }
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `ccd-downloads.${format === 'xlsx' ? 'xls' : 'csv'}`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success(`Exported ${format.toUpperCase()}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const topResources = Object.entries(data?.summary.byResource || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <BarChart3 className="h-5 w-5" />
            Download analytics
          </h3>
          <p className="text-sm text-gray-600">
            {data
              ? `${data.scope} scope · times in ${data.timezone}`
              : 'Admin and organisation roles with analytics permission.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={exporting}
            onClick={() => void exportFile('csv')}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
          <button
            type="button"
            disabled={exporting}
            onClick={() => void exportFile('xlsx')}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            XLSX
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <label className="text-sm">
          Partner
          <select
            value={partnerSlug}
            onChange={(e) => setPartnerSlug(e.target.value)}
            className="ml-2 rounded border border-gray-300 px-2 py-1"
          >
            <option value="">All</option>
            <option value="jazznorth">Jazz North</option>
          </select>
        </label>
        <label className="text-sm">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="ml-2 rounded border border-gray-300 px-2 py-1"
          />
        </label>
        <label className="text-sm">
          To
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="ml-2 rounded border border-gray-300 px-2 py-1"
          />
        </label>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-7 w-7 animate-spin text-teal-600" />
        </div>
      )}
      {error && !loading && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      {data && !loading && (
        <>
          <p className="text-sm text-gray-700">
            <strong>{data.total}</strong> events
            {data.organisation_id ? ` · org ${data.organisation_id}` : ''}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-200 p-3">
              <h4 className="mb-2 text-sm font-semibold text-gray-800">Top resources</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                {topResources.length === 0 && <li className="text-gray-500">No data</li>}
                {topResources.map(([id, n]) => (
                  <li key={id} className="flex justify-between gap-2">
                    <span className="truncate">{id}</span>
                    <span className="font-medium">{n}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <h4 className="mb-2 text-sm font-semibold text-gray-800">By country</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                {Object.entries(data.summary.byCountry)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 8)
                  .map(([c, n]) => (
                    <li key={c} className="flex justify-between gap-2">
                      <span>{c}</span>
                      <span className="font-medium">{n}</span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-3 py-2 font-medium">When (UK)</th>
                  <th className="px-3 py-2 font-medium">Resource</th>
                  <th className="px-3 py-2 font-medium">User</th>
                  <th className="px-3 py-2 font-medium">Partner</th>
                  <th className="px-3 py-2 font-medium">Country</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.events.slice(0, 100).map((ev) => (
                  <tr key={ev.id}>
                    <td className="px-3 py-2 text-gray-600">{ev.created_at_uk}</td>
                    <td className="px-3 py-2">{ev.resource_title || ev.resource_id}</td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-500">
                      {(ev.user_id || '').slice(0, 8)}…
                    </td>
                    <td className="px-3 py-2">{ev.partner_slug || '—'}</td>
                    <td className="px-3 py-2">{ev.geo_country || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
