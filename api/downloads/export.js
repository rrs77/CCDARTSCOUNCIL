/**
 * GET /api/downloads/export?format=csv|xlsx
 * Admin / org analytics export with formula-injection protection.
 */

import {
  assertRateLimit,
  canViewGlobalAnalytics,
  canViewOrgAnalytics,
  createServiceClient,
  jsonResponse,
  loadProfile,
  optionsResponse,
  requireAuth,
  writeAuditLog,
  getClientIp,
  hashIpForStorage,
} from '../_authShared.js';
import { formatUkDateTime, sanitizeSpreadsheetCell, toCsv } from '../_downloadShared.js';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const profile = await loadProfile(auth.userId);
    if (!profile || (!canViewGlobalAnalytics(profile) && !canViewOrgAnalytics(profile))) {
      return jsonResponse({ error: 'Forbidden.' }, 403);
    }

    const rl = assertRateLimit(`downloads-export:${auth.userId}`, {
      limit: 10,
      windowMs: 60_000,
    });
    if (!rl.ok) return rl.response;

    const service = createServiceClient();
    if (!service) return jsonResponse({ error: 'Server configuration error.' }, 500);

    const url = new URL(request.url);
    const format = (url.searchParams.get('format') || 'csv').toLowerCase();
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const partnerSlug = url.searchParams.get('partner_slug');
    let organisationId = url.searchParams.get('organisation_id');

    if (!canViewGlobalAnalytics(profile)) {
      organisationId = profile.organisation_id;
    }

    let q = service
      .from('download_events')
      .select(
        'id, resource_id, user_id, organisation_id, partner_slug, geo_country, geo_region, geo_city, created_at, resources(title, filename)',
      )
      .order('created_at', { ascending: false })
      .limit(5000);

    if (from) q = q.gte('created_at', from);
    if (to) q = q.lte('created_at', to);
    if (partnerSlug) q = q.eq('partner_slug', partnerSlug);
    if (organisationId) q = q.eq('organisation_id', organisationId);

    const { data, error } = await q;
    if (error) return jsonResponse({ error: error.message }, 400);

    const timezone = 'Europe/London';
    const rows = (data || []).map((row) => ({
      id: row.id,
      resource_id: row.resource_id,
      resource_title: row.resources?.title || '',
      filename: row.resources?.filename || '',
      user_id: row.user_id || '',
      organisation_id: row.organisation_id || '',
      partner_slug: row.partner_slug || '',
      geo_country: row.geo_country || '',
      geo_region: row.geo_region || '',
      geo_city: row.geo_city || '',
      created_at_utc: row.created_at,
      created_at_uk: formatUkDateTime(row.created_at, timezone),
    }));

    const ipHash = await hashIpForStorage(getClientIp(request));
    await writeAuditLog({
      actorId: auth.userId,
      action: 'downloads.export',
      targetType: 'download_events',
      meta: { format, count: rows.length, organisation_id: organisationId },
      ipHash,
    });

    const columns = [
      { header: 'Downloaded (UK)', key: 'created_at_uk' },
      { header: 'Downloaded (UTC)', key: 'created_at_utc' },
      { header: 'Resource ID', key: 'resource_id' },
      { header: 'Title', key: 'resource_title' },
      { header: 'Filename', key: 'filename' },
      { header: 'User ID', key: 'user_id' },
      { header: 'Organisation', key: 'organisation_id' },
      { header: 'Partner', key: 'partner_slug' },
      { header: 'Country', key: 'geo_country' },
      { header: 'Region', key: 'geo_region' },
      { header: 'City', key: 'geo_city' },
    ];

    if (format === 'xlsx') {
      // Lightweight XML SpreadsheetML (opens in Excel) — no heavy dependency
      const sheetRows = [
        `<Row>${columns.map((c) => `<Cell><Data ss:Type="String">${xmlEscape(sanitizeSpreadsheetCell(c.header))}</Data></Cell>`).join('')}</Row>`,
        ...rows.map(
          (row) =>
            `<Row>${columns
              .map(
                (c) =>
                  `<Cell><Data ss:Type="String">${xmlEscape(sanitizeSpreadsheetCell(row[c.key]))}</Data></Cell>`,
              )
              .join('')}</Row>`,
        ),
      ];
      const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Downloads"><Table>
 ${sheetRows.join('\n')}
 </Table></Worksheet>
</Workbook>`;
      return new Response(xml, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
          'Content-Disposition': 'attachment; filename="ccd-downloads.xlsx"',
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const csv = toCsv(rows, columns);
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="ccd-downloads.csv"',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    return jsonResponse(
      { error: e instanceof Error ? e.message : 'Export failed' },
      500,
    );
  }
}

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
