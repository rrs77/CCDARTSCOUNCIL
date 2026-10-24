/**
 * GET  /api/admin/backup  — export curriculum snapshot (super_admin only)
 * POST /api/admin/backup  — restore (super_admin only; hardened)
 *
 * Query: ?organisationId= (optional export filter / restore target org)
 * Body (POST): { data, dryRun?, organisationId?, timestamp? }
 */

import {
  assertRateLimit,
  createServiceClient,
  getClientIp,
  hashIpForStorage,
  jsonResponse,
  optionsResponse,
  requireSuperAdmin,
  writeAuditLog,
} from '../../../api/_authShared.js';
import {
  BACKUP_MAX_BODY_BYTES,
  backupContentLengthGate,
  exportCurriculumBackup,
  normalizeOrganisationId,
  restoreCurriculumBackupRpc,
  sanitizeRestorePayload,
  saveCurriculumBackupSnapshot,
} from '../../../api/_dataBackupShared.js';

const NO_STORE = { 'Cache-Control': 'private, no-store' };

/**
 * Real restore stays OFF until org-scoped RPC + pre-export storage (items 1–5)
 * pass Security Reviewer. Export and dryRun remain available.
 */
const RESTORE_ENABLED = false;

export async function OPTIONS(request) {
  return optionsResponse(request);
}

async function auditBackup({
  request,
  auth,
  action,
  ok,
  meta = {},
}) {
  const ip = getClientIp(request) || null;
  const ipHash = await hashIpForStorage(ip);
  await writeAuditLog({
    actorId: auth.userId,
    action,
    targetType: 'curriculum',
    ipHash,
    meta: {
      ok: Boolean(ok),
      ...meta,
    },
  });
}

export async function GET(request) {
  let auth = null;
  try {
    auth = await requireSuperAdmin(request);
    if (!auth.ok) {
      return auth.response;
    }

    const limited = assertRateLimit(`admin-backup:${auth.userId}`, {
      limit: 5,
      windowMs: 600_000,
    });
    if (!limited.ok) {
      await auditBackup({
        request,
        auth,
        action: 'curriculum_backup_export',
        ok: false,
        meta: { reason: 'rate_limited' },
      });
      return new Response(limited.response.body, {
        status: limited.response.status,
        headers: {
          ...Object.fromEntries(limited.response.headers.entries()),
          ...NO_STORE,
        },
      });
    }

    const service = createServiceClient();
    if (!service) {
      return jsonResponse({ error: 'Service unavailable.' }, 503, NO_STORE, request);
    }

    const url = new URL(request.url);
    const organisationId = url.searchParams.get('organisationId');

    const { data, rowCounts } = await exportCurriculumBackup(service, {
      organisationId,
    });

    await auditBackup({
      request,
      auth,
      action: 'curriculum_backup_export',
      ok: true,
      meta: {
        organisationId: organisationId || null,
        rowCounts,
      },
    });

    return jsonResponse(
      {
        version: '1.0',
        timestamp: new Date().toISOString(),
        description: 'Complete database backup',
        organisationId: organisationId || null,
        data,
        rowCounts,
      },
      200,
      NO_STORE,
      request,
    );
  } catch (error) {
    console.error('admin/backup GET:', error instanceof Error ? error.message : error);
    if (auth?.ok) {
      await auditBackup({
        request,
        auth,
        action: 'curriculum_backup_export',
        ok: false,
        meta: { reason: error instanceof Error ? error.message : 'export_failed' },
      });
    }
    const status = error?.status && Number.isFinite(error.status) ? error.status : 500;
    return jsonResponse({ error: 'Backup export failed.' }, status, NO_STORE, request);
  }
}

export async function POST(request) {
  let auth = null;
  try {
    auth = await requireSuperAdmin(request);
    if (!auth.ok) {
      return auth.response;
    }

    const limited = assertRateLimit(`admin-backup:${auth.userId}`, {
      limit: 5,
      windowMs: 600_000,
    });
    if (!limited.ok) {
      await auditBackup({
        request,
        auth,
        action: 'curriculum_backup_restore',
        ok: false,
        meta: { reason: 'rate_limited' },
      });
      return new Response(limited.response.body, {
        status: limited.response.status,
        headers: {
          ...Object.fromEntries(limited.response.headers.entries()),
          ...NO_STORE,
        },
      });
    }

    const clGate = backupContentLengthGate(request.headers.get('content-length'));
    if (clGate) {
      await auditBackup({
        request,
        auth,
        action: 'curriculum_backup_restore',
        ok: false,
        meta: { reason: 'content_length', status: clGate.status },
      });
      return jsonResponse(
        {
          error: clGate.error,
          maxBytes: BACKUP_MAX_BODY_BYTES,
        },
        clGate.status,
        NO_STORE,
        request,
      );
    }

    const service = createServiceClient();
    if (!service) {
      return jsonResponse({ error: 'Service unavailable.' }, 503, NO_STORE, request);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      await auditBackup({
        request,
        auth,
        action: 'curriculum_backup_restore',
        ok: false,
        meta: { reason: 'invalid_json' },
      });
      return jsonResponse({ error: 'Invalid JSON body.' }, 400, NO_STORE, request);
    }

    const url = new URL(request.url);
    const organisationId = normalizeOrganisationId(
      (typeof body?.organisationId === 'string' && body.organisationId.trim()) ||
        url.searchParams.get('organisationId') ||
        null,
    );
    const dryRun = Boolean(body?.dryRun);

    if (!organisationId) {
      await auditBackup({
        request,
        auth,
        action: 'curriculum_backup_restore',
        ok: false,
        meta: { reason: 'organisationId_required', dryRun },
      });
      return jsonResponse(
        { error: 'organisationId is required and must match ^[A-Za-z0-9_-]{1,64}$.' },
        400,
        NO_STORE,
        request,
      );
    }

    const { data: orgRow, error: orgErr } = await service
      .from('organisations')
      .select('id')
      .eq('id', organisationId)
      .maybeSingle();
    if (orgErr || !orgRow?.id) {
      await auditBackup({
        request,
        auth,
        action: 'curriculum_backup_restore',
        ok: false,
        meta: { reason: 'organisationId_not_found', organisationId, dryRun },
      });
      return jsonResponse({ error: 'organisationId not found.' }, 400, NO_STORE, request);
    }

    // Real restore OFF until items 1–5 pass review; dryRun + export still allowed.
    if (!dryRun && !RESTORE_ENABLED) {
      await auditBackup({
        request,
        auth,
        action: 'curriculum_backup_restore',
        ok: false,
        meta: { reason: 'restore_disabled', organisationId },
      });
      return jsonResponse({ error: 'restore disabled' }, 503, NO_STORE, request);
    }

    const sanitized = sanitizeRestorePayload(body, { targetOrg: organisationId });
    if (!sanitized.ok) {
      await auditBackup({
        request,
        auth,
        action: 'curriculum_backup_restore',
        ok: false,
        meta: {
          reason: 'validation',
          error: sanitized.error,
          organisationId,
          dryRun,
        },
      });
      return jsonResponse({ error: sanitized.error }, 400, NO_STORE, request);
    }

    // Automatic export + persist to private curriculum_backups (skipped for dry-run).
    let preExport = null;
    let snapshotRef = null;
    if (!dryRun) {
      try {
        preExport = await exportCurriculumBackup(service, { organisationId });
        snapshotRef = await saveCurriculumBackupSnapshot(service, {
          userId: auth.userId,
          organisationId,
          payload: preExport.data,
          rowCounts: preExport.rowCounts,
        });
      } catch (e) {
        await auditBackup({
          request,
          auth,
          action: 'curriculum_backup_restore',
          ok: false,
          meta: {
            reason: 'pre_export_persist_failed',
            error: e instanceof Error ? e.message : 'pre_export_persist_failed',
            organisationId,
          },
        });
        return jsonResponse(
          {
            error:
              'Automatic pre-restore snapshot failed; restore aborted.',
          },
          500,
          NO_STORE,
          request,
        );
      }
    }

    const rpcResult = await restoreCurriculumBackupRpc(service, sanitized.data, {
      organisationId,
      dryRun,
    });

    // Prefer RPC-reported write counts when present.
    const writtenCounts =
      rpcResult && typeof rpcResult === 'object' && rpcResult.counts
        ? rpcResult.counts
        : sanitized.rowCounts;

    await auditBackup({
      request,
      auth,
      action: 'curriculum_backup_restore',
      ok: true,
      meta: {
        organisationId,
        dryRun,
        rowCounts: writtenCounts,
        rpc: rpcResult,
        preExportRowCounts: preExport?.rowCounts || null,
        snapshotId: snapshotRef?.id || null,
        snapshotStorageKey: snapshotRef?.storageKey || null,
        backupTimestamp: typeof body?.timestamp === 'string' ? body.timestamp : null,
      },
    });

    return jsonResponse(
      {
        success: true,
        dryRun,
        organisationId,
        rowCounts: writtenCounts,
        rpc: rpcResult,
        preExportRowCounts: preExport?.rowCounts || null,
        snapshotId: snapshotRef?.id || null,
        snapshotStorageKey: snapshotRef?.storageKey || null,
      },
      200,
      NO_STORE,
      request,
    );
  } catch (error) {
    console.error('admin/backup POST:', error instanceof Error ? error.message : error);
    if (auth?.ok) {
      await auditBackup({
        request,
        auth,
        action: 'curriculum_backup_restore',
        ok: false,
        meta: { reason: error instanceof Error ? error.message : 'restore_failed' },
      });
    }
    const status = error?.status && Number.isFinite(error.status) ? error.status : 500;
    return jsonResponse(
      { error: status === 400 ? error.message : 'Backup restore failed.' },
      status === 400 ? 400 : 500,
      NO_STORE,
      request,
    );
  }
}
