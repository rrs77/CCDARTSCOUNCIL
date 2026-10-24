import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../contexts/SettingsContextNew';
import {
  createPlanningShareGrant,
  ensurePlanningGroupMembership,
  upsertPlanningResource,
  type PlanningResourceType,
  type ShareAudienceType,
  type SharePermission,
} from '../../utils/planner/planningShares';
import { ModalBody, ModalFooter, ModalHeader, ModalShell } from './ModalShell';
import { Button, Field, TextField, TextInput } from './ui';

const AUDIENCE_OPTIONS: { id: ShareAudienceType; label: string; hint: string }[] = [
  { id: 'person', label: 'Person', hint: 'A colleague (email or user id)' },
  { id: 'group', label: 'Group', hint: 'Your teaching group / team' },
  { id: 'school', label: 'School', hint: 'Everyone at your school' },
  { id: 'year_group', label: 'Year group', hint: 'Scoped to a year group / class' },
  { id: 'hub_org', label: 'Hub / arts organisation', hint: 'Members of your hub or arts org' },
];

const PERMISSIONS: { id: SharePermission; label: string }[] = [
  { id: 'view', label: 'View' },
  { id: 'copy', label: 'Can copy' },
  { id: 'edit', label: 'Can edit' },
];

/**
 * Share planning (lesson / unit / scheme / year overview) with ModalShell.
 * Does not replace LessonPrintModal PDF public links — different model.
 */
export function SharePlanningModal({
  open,
  onClose,
  resourceType,
  resourceId,
  title,
  summary,
}: {
  open: boolean;
  onClose: () => void;
  resourceType: PlanningResourceType;
  resourceId: string;
  title: string;
  summary?: string;
}) {
  const { user } = useAuth();
  const { customYearGroups } = useSettings();
  const profile = user?.profile;
  const orgId = (profile as { organisation_id?: string } | undefined)?.organisation_id
    || profile?.school_or_org
    || '';

  const [audienceType, setAudienceType] = useState<ShareAudienceType>('school');
  const [audienceId, setAudienceId] = useState(orgId);
  const [audienceLabel, setAudienceLabel] = useState(profile?.school_or_org || 'My school');
  const [permission, setPermission] = useState<SharePermission>('view');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const yearOptions = useMemo(
    () =>
      (customYearGroups || []).map((g) => ({
        id: g.id || g.name,
        label: g.name || g.id,
      })),
    [customYearGroups],
  );

  const onAudienceTypeChange = (next: ShareAudienceType) => {
    setAudienceType(next);
    if (next === 'school' || next === 'hub_org') {
      setAudienceId(orgId || 'school');
      setAudienceLabel(
        next === 'hub_org'
          ? profile?.school_or_org || 'Hub / organisation'
          : profile?.school_or_org || 'My school',
      );
    } else if (next === 'group') {
      // Group id is membership-backed (planning_group_members), not org id.
      setAudienceId('');
      setAudienceLabel('My teaching group');
    } else if (next === 'year_group') {
      const first = yearOptions[0];
      setAudienceId(first?.id || '');
      setAudienceLabel(first?.label || '');
    } else {
      setAudienceId('');
      setAudienceLabel('');
    }
  };

  const submit = async () => {
    if (!user?.id) {
      toast.error('Sign in to share planning');
      return;
    }
    if (!audienceId.trim()) {
      toast.error('Choose who to share with');
      return;
    }
    setBusy(true);
    try {
      const resource = await upsertPlanningResource({
        ownerId: user.id,
        resourceType,
        resourceId,
        title: title || 'Untitled planning',
        summary: summary || note,
        organisationId: orgId || null,
        payload: { note },
      });
      if (audienceType === 'group') {
        await ensurePlanningGroupMembership({
          groupId: audienceId.trim(),
          userId: user.id,
          organisationId: orgId || null,
        });
      }
      await createPlanningShareGrant({
        resourceId: resource.id,
        sharedBy: user.id,
        audienceType,
        audienceId: audienceId.trim(),
        audienceLabel: audienceLabel.trim() || audienceId.trim(),
        permission,
        title: resource.title,
        resourceType,
      });
      toast.success('Shared — recipients will see it under Shared with me');
      onClose();
    } catch (e: any) {
      toast.error(e?.message || 'Could not share');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell open={open} onClose={onClose} labelledBy="share-planning-title">
      <ModalHeader
        title="Share planning"
        subtitle={`${resourceType.replace('_', ' ')} · ${title || resourceId}`}
        onClose={onClose}
        titleId="share-planning-title"
      />
      <ModalBody>
        <p className="mb-4 text-[13px] leading-snug text-[#5C5878]">
          Share with a person, group, school, year group, or hub/arts organisation. Permissions:
          view, can copy, or can edit. (Separate from Print → public PDF links.)
        </p>
        <div className="space-y-4">
          <Field label="Audience">
            <select
              value={audienceType}
              onChange={(e) => onAudienceTypeChange(e.target.value as ShareAudienceType)}
              className="h-11 w-full rounded-xl border border-[#E2E0EF] bg-white px-3 text-sm font-semibold text-[#1F1B4D]"
            >
              {AUDIENCE_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] font-medium text-[#77738F]">
              {AUDIENCE_OPTIONS.find((o) => o.id === audienceType)?.hint}
            </p>
          </Field>

          {audienceType === 'year_group' ? (
            <Field label="Year group">
              <select
                value={audienceId}
                onChange={(e) => {
                  const opt = yearOptions.find((y) => y.id === e.target.value);
                  setAudienceId(e.target.value);
                  setAudienceLabel(opt?.label || e.target.value);
                }}
                className="h-11 w-full rounded-xl border border-[#E2E0EF] bg-white px-3 text-sm font-semibold"
              >
                {yearOptions.length === 0 ? (
                  <option value="">No year groups in Settings</option>
                ) : (
                  yearOptions.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.label}
                    </option>
                  ))
                )}
              </select>
              <p className="mt-1 text-[11px] font-medium text-[#77738F]">
                Visible to colleagues at your school for this year group (org-scoped).
              </p>
            </Field>
          ) : audienceType === 'person' ? (
            <Field label="Person (email or user id)">
              <TextField
                value={audienceId}
                onChange={(e) => {
                  setAudienceId(e.target.value);
                  setAudienceLabel(e.target.value);
                }}
                placeholder="colleague@school.org"
              />
            </Field>
          ) : audienceType === 'group' ? (
            <>
              <Field label="Group id">
                <TextField
                  value={audienceId}
                  onChange={(e) => setAudienceId(e.target.value)}
                  placeholder="e.g. year6-music-team"
                />
                <p className="mt-1 text-[11px] font-medium text-[#77738F]">
                  Recipients must be members of this group (planning_group_members). Sharing
                  adds you as a member so you can manage the grant.
                </p>
              </Field>
              <Field label="Group label">
                <TextField
                  value={audienceLabel}
                  onChange={(e) => setAudienceLabel(e.target.value)}
                  placeholder="Year 6 music team"
                />
              </Field>
            </>
          ) : (
            <Field label="Audience label">
              <TextField
                value={audienceLabel}
                onChange={(e) => setAudienceLabel(e.target.value)}
              />
            </Field>
          )}

          <Field label="Permission">
            <div className="flex flex-wrap gap-2">
              {PERMISSIONS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPermission(p.id)}
                  className={`inline-flex h-10 items-center rounded-xl border px-3 text-[13px] font-bold ${
                    permission === p.id
                      ? 'border-[#4338E8] bg-[#E9E6FF] text-[#4338E8]'
                      : 'border-[#E2E0EF] bg-white text-[#5C5878]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Note (optional)">
            <TextInput
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why you’re sharing…"
            />
          </Field>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="primary" onClick={() => void submit()} disabled={busy}>
          {busy ? 'Sharing…' : 'Share'}
        </Button>
      </ModalFooter>
    </ModalShell>
  );
}
