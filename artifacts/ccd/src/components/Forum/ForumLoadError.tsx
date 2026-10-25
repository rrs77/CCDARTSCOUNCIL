import React from 'react';
import { AlertCircle, RefreshCw, ServerCrash } from 'lucide-react';

/**
 * Friendly empty / error panel when the forum API or Supabase tables are unavailable.
 * Keeps /forum usable signed-out instead of a blank or crashed shell.
 */
export function ForumLoadError({
  title = 'Community Forum is temporarily unavailable',
  message,
  onRetry,
  showLocalDevHint = false,
}: {
  title?: string;
  message?: string | null;
  onRetry?: () => void;
  /** When true, show a short local-dev checklist under the message. */
  showLocalDevHint?: boolean;
}) {
  const detail = (message || '').trim();
  const looksLikeMissingTable =
    /forum_categories|forum_topics|relation .* does not exist|schema cache/i.test(detail);
  const looksLikeMisconfigured =
    /misconfigured|SUPABASE_SERVICE_ROLE|service role|Cannot GET \/api\/forum|API route not found|Failed to fetch|NetworkError|ECONNREFUSED/i.test(
      detail,
    );
  const isDev = Boolean(import.meta.env?.DEV);
  const localHint =
    isDev &&
    (showLocalDevHint || looksLikeMisconfigured || looksLikeMissingTable);

  return (
    <div
      role="alert"
      className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-6 text-amber-950 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
          {looksLikeMisconfigured || looksLikeMissingTable ? (
            <ServerCrash className="h-5 w-5" aria-hidden />
          ) : (
            <AlertCircle className="h-5 w-5" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <p className="text-sm leading-relaxed text-amber-900/90">
            {looksLikeMissingTable
              ? 'The forum database tables are missing. Apply the community forum migration, then reload.'
              : looksLikeMisconfigured
                ? 'The forum API could not be reached or is not configured. You can still browse the rest of CCDesigner.'
                : detail ||
                  'We could not load categories right now. Please try again in a moment.'}
          </p>
          {isDev && detail && (looksLikeMissingTable || looksLikeMisconfigured) && (
            <p className="break-words font-mono text-xs text-amber-800/80">{detail}</p>
          )}
          {localHint && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-900/80">
              <li>
                Locally: run the Vite app on :5173 and the Express api-server on :8080 (Vite proxies{' '}
                <code className="rounded bg-amber-100 px-1">/api</code>).
              </li>
              <li>
                Set <code className="rounded bg-amber-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> (and
                usually <code className="rounded bg-amber-100 px-1">SUPABASE_URL</code>) in the repo{' '}
                <code className="rounded bg-amber-100 px-1">.env</code> for the api-server.
              </li>
              {looksLikeMissingTable && (
                <li>
                  Apply{' '}
                  <code className="break-all rounded bg-amber-100 px-1">
                    supabase/migrations/20260904_community_forum.sql
                  </code>{' '}
                  to your Supabase project if forum tables do not exist yet.
                </li>
              )}
            </ul>
          )}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#1F1B4D] px-3 py-2 text-sm font-medium text-white hover:bg-[#2a2466]"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
