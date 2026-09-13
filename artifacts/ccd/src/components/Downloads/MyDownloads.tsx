import React, { useCallback, useEffect, useState } from 'react';
import { Download, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { getVercelApiUrl } from '../../utils/apiUrl';
import { startTrackedDownload } from '../../utils/trackedDownload';
import toast from 'react-hot-toast';

interface DownloadEventRow {
  id: string;
  resource_id: string;
  partner_slug?: string | null;
  geo_country?: string | null;
  geo_city?: string | null;
  created_at: string;
  created_at_uk?: string;
  resource?: {
    id: string;
    title: string;
    resource_type?: string;
    filename?: string;
    collection_id?: string;
  } | null;
}

export function MyDownloads() {
  const [events, setEvents] = useState<DownloadEventRow[]>([]);
  const [timezone, setTimezone] = useState('Europe/London');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Sign in to see your downloads.');
        setEvents([]);
        return;
      }
      const res = await fetch(getVercelApiUrl('/api/downloads/mine'), {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Failed (${res.status})`);
      setEvents(data.events || []);
      if (data.timezone) setTimezone(data.timezone);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const redownload = async (resourceId: string) => {
    const result = await startTrackedDownload(resourceId);
    if (!result.ok) {
      toast.error(result.message || 'Could not start download');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-7 w-7 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Download className="h-5 w-5" />
            My Downloads
          </h3>
          <p className="text-sm text-gray-600">
            Times shown in {timezone}. Only you can see this list.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      {!error && events.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
          No downloads yet. Sign in and download Jazz North learning resources from the partner hub.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-3 py-2 font-medium text-gray-700">When (UK)</th>
                <th className="px-3 py-2 font-medium text-gray-700">Resource</th>
                <th className="px-3 py-2 font-medium text-gray-700">Partner</th>
                <th className="px-3 py-2 font-medium text-gray-700">Approx. location</th>
                <th className="px-3 py-2 font-medium text-gray-700 text-right">Again</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map((ev) => (
                <tr key={ev.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-600">{ev.created_at_uk || ev.created_at}</td>
                  <td className="px-3 py-2 text-gray-900">
                    {ev.resource?.title || ev.resource_id}
                  </td>
                  <td className="px-3 py-2 text-gray-600">{ev.partner_slug || '—'}</td>
                  <td className="px-3 py-2 text-gray-600">
                    {[ev.geo_city, ev.geo_country].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => void redownload(ev.resource_id)}
                      className="text-teal-700 hover:underline"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
