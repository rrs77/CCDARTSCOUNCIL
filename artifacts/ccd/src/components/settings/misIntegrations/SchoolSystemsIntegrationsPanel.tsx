import React, { useCallback, useId, useMemo, useState } from 'react';
import {
  MIS_APP_DATA_TABLE,
  MIS_APPROVAL_STEPS,
  MIS_MAPPING_ACTIONS,
  MIS_PROVIDERS,
  MIS_STATUS_KEY,
  MIS_YEAR_GROUP_MAPPING_PREVIEW,
  configControlsEnabled,
  defaultApprovalProgress,
  mappingActionLabel,
  resolveConnectionUiStatus,
  stepProgressLabel,
  uiStatusLabel,
  verifyCcdAllowListInvariant,
  type MisAppId,
  type MisMappingAction,
  type MisProviderId,
  type MisUiStatus,
} from '../../../features/mis-integrations';
import { navigateToSettings } from '../routes';
import {
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalShell,
} from '../../ccdPlanner/ModalShell';

const STORAGE_KEY = 'ccd-mis-integration-requests';

type LocalRequest = {
  providerId: MisProviderId;
  submittedAt: string; // ISO — display with en-GB
  schoolName: string;
  requesterName: string;
  requesterEmail: string;
  message: string;
  requestedApps: MisAppId[];
};

function readLocalRequests(): LocalRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalRequest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalRequests(rows: LocalRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    /* ignore quota */
  }
}

function formatSubmittedAt(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status: MisUiStatus }) {
  const cls =
    status === 'connected'
      ? 'ss-mis-badge ss-mis-badge-connected'
      : status === 'approved'
        ? 'ss-mis-badge ss-mis-badge-approved'
        : status === 'requested'
          ? 'ss-mis-badge ss-mis-badge-requested'
          : 'ss-mis-badge ss-mis-badge-unverified';
  return (
    <span className={cls}>
      <span className="ss-mis-dot" aria-hidden />
      {uiStatusLabel(status)}
    </span>
  );
}

function ProviderCard({
  providerId,
  displayName,
  subtitle,
  flag,
  softFlag,
  recommended,
  status,
  onRequest,
}: {
  providerId: MisProviderId;
  displayName: string;
  subtitle: string;
  flag?: string;
  softFlag?: string;
  recommended?: boolean;
  status: MisUiStatus;
  onRequest: (id: MisProviderId) => void;
}) {
  const configEnabled = configControlsEnabled(status);
  return (
    <article className={`ss-mis-card${recommended ? ' is-recommended' : ''}`}>
      <div className="ss-mis-card-head">
        <span className="ss-mis-provider-name">{displayName}</span>
        {flag ? <span className="ss-mis-flag">{flag}</span> : null}
        {softFlag ? <span className="ss-mis-flag is-soft">{softFlag}</span> : null}
      </div>
      <p className="ss-mis-provider-sub">{subtitle}</p>
      <StatusBadge status={status} />
      <button
        type="button"
        className="ss-mis-btn ss-mis-btn-primary"
        onClick={() => onRequest(providerId)}
        disabled={status === 'connected'}
      >
        {status === 'requested' ? 'Request again' : 'Request integration'}
      </button>
      <fieldset disabled={!configEnabled} className="ss-mis-cfg">
        <legend>Configuration</legend>
        <label className="ss-mis-cfg-field">
          Sync frequency
          <select defaultValue="daily" aria-label={`${displayName} sync frequency`}>
            <option value="daily">Daily</option>
            <option value="manual">Manual</option>
          </select>
        </label>
        <label className="ss-mis-cfg-check">
          <input type="checkbox" disabled defaultChecked={false} />
          Year groups
        </label>
        <p className="ss-mis-cfg-hint">Available once approved</p>
      </fieldset>
    </article>
  );
}

export function SchoolSystemsIntegrationsPanel() {
  const titleId = useId();
  const [requests, setRequests] = useState<LocalRequest[]>(() =>
    typeof window !== 'undefined' ? readLocalRequests() : [],
  );
  const [requestProvider, setRequestProvider] = useState<MisProviderId | null>(null);
  const [schoolName, setSchoolName] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitNote, setSubmitNote] = useState<string | null>(null);
  const [mappingDraft, setMappingDraft] = useState<MisMappingAction[]>(() =>
    MIS_YEAR_GROUP_MAPPING_PREVIEW.map((r) => r.action),
  );

  const approvalProgress = useMemo(() => defaultApprovalProgress(), []);

  // Invariant checked at render — never silent if allow-list drifts
  if (!verifyCcdAllowListInvariant()) {
    console.error('[MIS] CCDesigner allow-list invariant failed');
  }

  const statusFor = useCallback(
    (providerId: MisProviderId): MisUiStatus => {
      const hasRequest = requests.some((r) => r.providerId === providerId);
      return resolveConnectionUiStatus({
        connectionStatus: hasRequest ? 'requested' : null,
        approvalProgress,
        hasSubmittedRequest: hasRequest,
      });
    },
    [requests, approvalProgress],
  );

  const openRequest = (id: MisProviderId) => {
    setRequestProvider(id);
    setSubmitNote(null);
  };

  const closeRequest = () => {
    setRequestProvider(null);
    setSubmitNote(null);
  };

  const submitRequest = () => {
    if (!requestProvider) return;
    if (!schoolName.trim() || !requesterEmail.trim()) {
      setSubmitNote('Please add your school name and email so we can follow up.');
      return;
    }
    const row: LocalRequest = {
      providerId: requestProvider,
      submittedAt: new Date().toISOString(),
      schoolName: schoolName.trim(),
      requesterName: requesterName.trim(),
      requesterEmail: requesterEmail.trim(),
      message: message.trim(),
      requestedApps: ['ccdesigner'],
    };
    const next = [row, ...requests.filter((r) => r.providerId !== requestProvider)];
    setRequests(next);
    writeLocalRequests(next);
    setSubmitNote(
      `Request recorded locally on ${formatSubmittedAt(row.submittedAt)}. No live connection was created — provider approval is still required.`,
    );
  };

  const activeProvider = MIS_PROVIDERS.find((p) => p.id === requestProvider);

  return (
    <div className="ss-mis-panel">
      <div className="ss-mis-banner" role="status">
        <strong>Nothing is connected yet.</strong> Every provider below is unverified. No data is
        shared or synced until the provider, your school and Rhythmstix have completed the six
        approval steps.
      </div>

      {/* Providers */}
      <section className="ss-mis-section" aria-labelledby="ss-mis-h-prov">
        <h3 id="ss-mis-h-prov" className="ss-mis-h2">
          Providers
        </h3>
        <p className="ss-mis-lead">
          Request an integration to start the approval process. Wonde is a central provider that can
          cover many MIS systems with one connection.
        </p>

        <div className="ss-mis-legend" aria-label="Status legend">
          <strong className="ss-mis-legend-title">Status key</strong>
          {MIS_STATUS_KEY.map((item) => (
            <div key={item.status} className="ss-mis-legend-item">
              <StatusBadge status={item.status} />
              {item.status === 'connected' ? (
                <span className="ss-mis-legend-extra">
                  Last sync: only shown when genuinely connected
                </span>
              ) : null}
            </div>
          ))}
        </div>

        <div className="ss-mis-grid">
          {MIS_PROVIDERS.map((p) => (
            <ProviderCard
              key={p.id}
              providerId={p.id}
              displayName={p.displayName}
              subtitle={p.subtitle}
              flag={p.flag}
              softFlag={p.softFlag}
              recommended={p.recommendedFirst}
              status={statusFor(p.id)}
              onRequest={openRequest}
            />
          ))}
        </div>
      </section>

      {/* Which app uses what */}
      <section className="ss-mis-section" aria-labelledby="ss-mis-h-apps">
        <h3 id="ss-mis-h-apps" className="ss-mis-h2">
          Which app uses what
        </h3>
        <p className="ss-mis-lead">
          Each app asks only for the data it needs. Permission names are proposed internal names,
          not provider scopes.
        </p>
        <div className="ss-mis-table-wrap">
          <table className="ss-mis-apps-table">
            <thead>
              <tr>
                <th scope="col">App</th>
                <th scope="col">Data it can receive</th>
                <th scope="col">Permission</th>
                <th scope="col">Never receives</th>
              </tr>
            </thead>
            <tbody>
              {MIS_APP_DATA_TABLE.map((row) => (
                <tr key={row.appId} className={row.highlightCcd ? 'is-ccd' : undefined}>
                  <td>
                    <strong>{row.displayName}</strong>
                  </td>
                  <td>{row.dataItCanReceive}</td>
                  <td>
                    {row.scopes.map((s) => (
                      <code key={s} className="ss-mis-code">
                        {s}
                      </code>
                    ))}
                    {row.scopesNote ? (
                      <span className="ss-mis-scopes-note"> {row.scopesNote}</span>
                    ) : null}
                  </td>
                  <td className={row.neverReceives ? 'ss-mis-never' : undefined}>
                    {row.neverReceives ? (
                      <>
                        <span aria-hidden>⛔ </span>
                        {row.neverReceives}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="ss-mis-note">
          Access is enforced on the server and in the database, not just hidden on screen.
        </p>
      </section>

      {/* Approval checklist */}
      <section className="ss-mis-section" aria-labelledby="ss-mis-h-chk">
        <h3 id="ss-mis-h-chk" className="ss-mis-h2">
          Approval checklist
        </h3>
        <p className="ss-mis-lead">
          All six steps must be complete before any connection goes live.
        </p>
        <ol className="ss-mis-checklist">
          {MIS_APPROVAL_STEPS.map((step) => (
            <li key={step.id}>
              <span className="ss-mis-step-num" aria-hidden>
                {step.step}
              </span>
              <span className="ss-mis-step-label">{step.label}</span>
              <span className="ss-mis-step-status">
                {stepProgressLabel(approvalProgress[step.id])}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Year-group mapping review */}
      <section className="ss-mis-section" aria-labelledby="ss-mis-h-map">
        <h3 id="ss-mis-h-map" className="ss-mis-h2">
          Year-group mapping review
        </h3>
        <p className="ss-mis-lead">
          When an MIS is connected, an administrator reviews its year groups against yours before
          anything changes.
        </p>
        <span className="ss-mis-example-tag">Example data · preview only</span>
        <div className="ss-mis-table-wrap">
          <table className="ss-mis-map-table">
            <thead>
              <tr>
                <th scope="col">Imported from MIS</th>
                <th scope="col" className="ss-mis-map-arrow" aria-hidden>
                  {' '}
                </th>
                <th scope="col">Your CCDesigner year group</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {MIS_YEAR_GROUP_MAPPING_PREVIEW.map((row, i) => (
                <tr key={row.externalName}>
                  <td>{row.externalName}</td>
                  <td className="ss-mis-map-arrow" aria-hidden>
                    →
                  </td>
                  <td>{row.localName ?? '—'}</td>
                  <td>
                    <select
                      disabled
                      aria-label={`Action for ${row.externalName}`}
                      value={mappingDraft[i] ?? row.action}
                      onChange={(e) => {
                        const next = [...mappingDraft];
                        next[i] = e.target.value as MisMappingAction;
                        setMappingDraft(next);
                      }}
                      className="ss-mis-select"
                    >
                      {MIS_MAPPING_ACTIONS.map((a) => (
                        <option key={a.value} value={a.value}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                    <span className="sr-only">
                      Default: {mappingActionLabel(row.action)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ss-mis-safe">
          <strong>Your curricula are never overwritten.</strong> Renaming only changes a label.
          Lessons, units and schemes of work stay linked to their year group.
        </div>
        <p className="ss-mis-map-actions">
          <button type="button" className="ss-mis-btn" disabled>
            Apply mapping (available once connected)
          </button>
        </p>
        <button
          type="button"
          className="ss-mis-link"
          onClick={() => navigateToSettings('classes')}
        >
          No MIS? Edit year groups manually in My classes →
        </button>
      </section>

      <ModalShell
        open={requestProvider !== null}
        onClose={closeRequest}
        labelledBy={titleId}
      >
        <ModalHeader
          titleId={titleId}
          title="Request integration"
          subtitle={
            activeProvider
              ? `${activeProvider.displayName} — no live connection is created by this request`
              : undefined
          }
          onClose={closeRequest}
        />
        <ModalBody>
          <p className="ss-mis-modal-lead">
            This records an integration request for your organisation. Provider approval, commercial
            terms and the six-step checklist must all complete before any data is shared.
          </p>
          <div className="ss-mis-form">
            <label className="ss-mis-form-field">
              School / organisation
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                autoComplete="organization"
                className="ss-mis-input"
              />
            </label>
            <label className="ss-mis-form-field">
              Your name
              <input
                type="text"
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                autoComplete="name"
                className="ss-mis-input"
              />
            </label>
            <label className="ss-mis-form-field">
              Email
              <input
                type="email"
                value={requesterEmail}
                onChange={(e) => setRequesterEmail(e.target.value)}
                autoComplete="email"
                className="ss-mis-input"
              />
            </label>
            <label className="ss-mis-form-field">
              Message (optional)
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="ss-mis-input ss-mis-textarea"
                placeholder="e.g. We use Arbor via Wonde and only need year groups for CCDesigner."
              />
            </label>
          </div>
          {submitNote ? (
            <p className="ss-mis-submit-note" role="status">
              {submitNote}
            </p>
          ) : null}
        </ModalBody>
        <ModalFooter>
          <button type="button" className="ss-mis-btn" onClick={closeRequest}>
            Close
          </button>
          <button type="button" className="ss-mis-btn ss-mis-btn-primary" onClick={submitRequest}>
            Submit request
          </button>
        </ModalFooter>
      </ModalShell>
    </div>
  );
}
