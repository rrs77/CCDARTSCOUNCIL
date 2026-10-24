import {
  MIS_APP_ALLOWED_SCOPES,
  appAllowsScope,
  isScopeForbiddenForCcd,
} from './scopes';
import { allApprovalStepsComplete, type MisStepProgress } from './activationGates';
import type {
  MisAppId,
  MisApprovalStepId,
  MisConnectionStatus,
  MisScopeId,
  MisUiStatus,
} from './types';

export class MisScopeViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MisScopeViolationError';
  }
}

/**
 * Backend-facing guard: refuse any attempt to grant CCDesigner pupil (or related) access.
 * Shared service must never grant CCDesigner pupil scopes.
 */
export function assertScopeAllowedForApp(appId: MisAppId, scopeId: MisScopeId): void {
  if (appId === 'ccdesigner' && isScopeForbiddenForCcd(scopeId)) {
    throw new MisScopeViolationError(
      `CCDesigner cannot be granted scope "${scopeId}". Pupil records stay outside CCDesigner's data model.`,
    );
  }
  if (!appAllowsScope(appId, scopeId)) {
    throw new MisScopeViolationError(
      `Scope "${scopeId}" is not allow-listed for app "${appId}".`,
    );
  }
}

export function filterScopesForApp(appId: MisAppId, scopes: MisScopeId[]): MisScopeId[] {
  return scopes.filter((s) => {
    try {
      assertScopeAllowedForApp(appId, s);
      return true;
    } catch {
      return false;
    }
  });
}

/** CCDesigner may only ever receive year_groups.read from the shared service. */
export function ccdesignerGrantedScopes(requested: MisScopeId[]): MisScopeId[] {
  return filterScopesForApp('ccdesigner', requested);
}

export function assertNoCcdPupilAccess(grants: { appId: MisAppId; scopeId: MisScopeId }[]): void {
  for (const g of grants) {
    assertScopeAllowedForApp(g.appId, g.scopeId);
  }
}

/**
 * Never invent a connected state. status=connected only when all six UI steps
 * (and thus all DB gates) are complete.
 */
export function resolveConnectionUiStatus(opts: {
  connectionStatus?: MisConnectionStatus | null;
  approvalProgress: Record<MisApprovalStepId, MisStepProgress>;
  hasSubmittedRequest?: boolean;
}): MisUiStatus {
  const { connectionStatus, approvalProgress, hasSubmittedRequest } = opts;
  if (connectionStatus === 'connected' && allApprovalStepsComplete(approvalProgress)) {
    return 'connected';
  }
  if (connectionStatus === 'ready' || connectionStatus === 'gates_incomplete') {
    // Ready/gates incomplete still need approval UX — treat as approved only if marked ready
    if (connectionStatus === 'ready') return 'approved';
  }
  if (connectionStatus === 'requested' || hasSubmittedRequest) {
    return 'requested';
  }
  return 'unverified';
}

/** Last sync is only shown when genuinely connected (never invent timestamps). */
export function mayShowLastSync(uiStatus: MisUiStatus, lastSyncAt: string | null | undefined): boolean {
  return uiStatus === 'connected' && Boolean(lastSyncAt);
}

export function configControlsEnabled(uiStatus: MisUiStatus): boolean {
  return uiStatus === 'approved' || uiStatus === 'connected';
}

/** Sanity: default allow-list never gives CCDesigner pupil scopes. */
export function verifyCcdAllowListInvariant(): boolean {
  const allowed = MIS_APP_ALLOWED_SCOPES.ccdesigner;
  return allowed.length === 1 && allowed[0] === 'year_groups.read';
}
