/**
 * GET  /api/admin/backup  — export curriculum snapshot (super_admin only)
 * POST /api/admin/backup  — restore from JSON body { data } (super_admin only)
 */

import {
  createServiceClient,
  getClientIp,
  jsonResponse,
  optionsResponse,
  requireSuperAdmin,
  writeAuditLog,
} from '../../../api/_authShared.js';
import {
  exportCurriculumBackup,
  importCurriculumBackup,
} from '../../../api/_dataBackupShared.js';

export async function OPTIONS(request) {
  return optionsResponse(request);
}

export async function GET(request) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const service = createServiceClient();
    if (!service) {
      return jsonResponse({ error: 'Service unavailable.' }, 503);
    }

    const data = await exportCurriculumBackup(service);
    await writeAuditLog({
      actorId: auth.userId,
      action: 'curriculum_backup_export',
      targetType: 'curriculum',
      ipHash: null,
      meta: { ip: getClientIp(request) || null },
    });

    return jsonResponse({
      version: '1.0',
      timestamp: new Date().toISOString(),
      description: 'Complete database backup',
      data,
    });
  } catch (error) {
    console.error('admin/backup GET:', error instanceof Error ? error.message : error);
    const status = error?.status && Number.isFinite(error.status) ? error.status : 500;
    return jsonResponse({ error: 'Backup export failed.' }, status);
  }
}

export async function POST(request) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const service = createServiceClient();
    if (!service) {
      return jsonResponse({ error: 'Service unavailable.' }, 503);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body.' }, 400);
    }

    const payload = body?.data && typeof body.data === 'object' ? body.data : body;
    await importCurriculumBackup(service, payload);

    await writeAuditLog({
      actorId: auth.userId,
      action: 'curriculum_backup_restore',
      targetType: 'curriculum',
      meta: {
        backupTimestamp: typeof body?.timestamp === 'string' ? body.timestamp : null,
        ip: getClientIp(request) || null,
      },
    });

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('admin/backup POST:', error instanceof Error ? error.message : error);
    const status = error?.status && Number.isFinite(error.status) ? error.status : 500;
    return jsonResponse(
      { error: status === 400 ? error.message : 'Backup restore failed.' },
      status === 400 ? 400 : 500,
    );
  }
}
