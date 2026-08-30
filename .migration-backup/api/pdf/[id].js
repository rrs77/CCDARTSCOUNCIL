/**
 * Redirect short PDF links to the stored blob URL.
 * GET /api/pdf/1 → 302 to the current blob URL for lesson/short code "1".
 * Used with rewrite so ccdesigner.co.uk/pdf/1 hits this.
 */

import { createClient } from '@supabase/supabase-js';

function getShortCodeFromRequest(request) {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.replace(/^\/+/, '').split('/');
    // Path is api/pdf/[id] so segments are ['api', 'pdf', id] or with rewrite /pdf/[id] so ['pdf', id]
    const idIndex = segments.indexOf('pdf');
    if (idIndex >= 0 && segments[idIndex + 1]) return segments[idIndex + 1];
    return segments[segments.length - 1] || null;
  } catch {
    return null;
  }
}

export async function GET(request, context = {}) {
  const id = context?.params?.id ?? getShortCodeFromRequest(request);
  if (!id) {
    return new Response('Not Found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return new Response('Configuration error', { status: 500, headers: { 'Content-Type': 'text/plain' } });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from('share_short_links')
    .select('blob_url')
    .eq('short_code', id)
    .maybeSingle();

  if (error || !data?.blob_url) {
    return new Response('Not Found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: data.blob_url,
      'Cache-Control': 'public, max-age=60',
    },
  });
}
