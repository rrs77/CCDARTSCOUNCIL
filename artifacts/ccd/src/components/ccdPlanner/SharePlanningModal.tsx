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
  // Sharing RLS uses organisation_id only (never school_or_org).
  const orgId = (profile?.organisation_id || '').trim();
  const allowedYearGroups = profile?.allowed_year_groups ?? null;
  const hasProfileYearGroups = Array.isArray(allowedYearGroups) && allowedYearGroups.length > 0;
  // When profiles lack year-group data, year_group shares are whole-school within org.
  const yearGroupOptionLabel = hasProfileYearGroups ? 'Year group' : 'Whole school';
  const yearGroupOptionHint = hasProfileYearGroups
    ? 'Scoped to colleagues whose allowed year groups include this class'
    : 'Profiles have no year-group data — shares reach your whole school (organisation_id)';

  const audienceOptions = useMemo(
    () =>
      [
        { id: 'person' as const, label: 'Person', hint: 'A colleague (email or user id)' },
        { id: 'group' as const, label: 'Group', hint: 'Your teaching group / team' },
        { id: 'school' as const, label: 'School', hint: 'Everyone at your school' },
        {
          id: 'year_group' as const,
          label: yearGroupOptionLabel,
          hint: yearGroupOptionHint,
        },
        {
          id: 'hub_org' as const,
          label: 'Hub / arts organisation',
          hint: 'Members of your hub or arts org',
        },
      ] satisfies { id: ShareAudienceType; label: string; hint: string }[],
    [yearGroupOptionLabel, yearGroupOptionHint],
  );

  const [audienceType, setAudienceType] = useState<ShareAudienceType>('school');
  const [audienceId, setAudienceId] = useState(orgId);
  const [audienceLabel, setAudienceLabel] = useState(orgId ? 'My school' : '');
  const [permission, setPermission] = useState<SharePermission>('view');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const yearOptions = useMemo(() => {
    if (!hasProfileYearGroups) return [];
    const fromSettings = (customYearGroups || []).map((g) => ({
      id: g.id || g.name,
      label: g.name || g.id,
    }));
    // Prefer intersection with profile.allowed_year_groups when both exist.
    const allowed = new Set(allowedYearGroups || []);
    const filtered = fromSettings.filter((y) => allowed.has(y.id) || allowed.has(y.label));
    if (filtered.length) return filtered;
    return (allowedYearGroups || []).map((id) => ({ id, label: id }));
  }, [customYearGroups, hasProfileYearGroups, allowedYearGroups]);

  const onAudienceTypeChange = (next: ShareAudienceType) => {
    setAudienceType(next);
    if (next === 'school' || next === 'hub_org') {
      setAudienceId(orgId);
      setAudienceLabel(next === 'hub_org' ? 'Hub / organisation' : 'My school');
    } else if (next === 'group') {
      setAudienceId('');
      setAudienceLabel('My teaching group');
    } else if (next === 'year_group') {
      if (!hasProfileYearGroups) {
        // Whole school within organisation_id (RLS treats empty allowed_year_groups as org-wide).
        setAudienceId(orgId || 'whole-school');
        setAudienceLabel('Whole school');
      } else {
        const first = yearOptions[0];
        setAudienceId(first?.id || '');
        setAudienceLabel(first?.label || '');
      }
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
    if (!orgId && (audienceType === 'school' || audienceType === 'hub_org' || audienceType === 'year_group')) {
      toast.error('Your profile needs an organisation_id before sharing with school / hub / year group');
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
        // Server trigger overwrites from owner's profile.organisation_id.
        organisationId: orgId || null,
        payload: { note },
      });
      if (audienceType === 'group') {
        await ensurePlanningGroupMembership({
          groupId: audienceId.trim(),
          userId: user.id,
          organisationId: orgId || null,
          label: audienceLabel.trim() || audienceId.trim(),
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
              {audienceOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] font-medium text-[#77738F]">
              {audienceOptions.find((o) => o.id === audienceType)?.hint}
            </p>
          </Field>

          {audienceType === 'year_group' ? (
            hasProfileYearGroups ? (
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
                    <option value="">No year groups available</option>
                  ) : (
                    yearOptions.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.label}
                      </option>
                    ))
                  )}
                </select>
                <p className="mt-1 text-[11px] font-medium text-[#77738F]">
                  Visible to colleagues at your organisation whose allowed year groups include this
                  class.
                </p>
              </Field>
            ) : (
              <Field label="Whole school">
                <TextField value={orgId || '—'} disabled />
                <p className="mt-1 text-[11px] font-medium text-[#77738F]">
                  No year-group data on profiles — this share reaches everyone with your
                  organisation_id.
                </p>
              </Field>
            )
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
                  Membership is managed server-side (group owner or same-org admin). Sharing adds
                  you as a member via the planning-groups API.
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
                placeholder="My school"
              />
            </Field>
          )}

          <Field label="Permission">
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value as SharePermission)}
              className="h-11 w-full rounded-xl border border-[#E2E0EF] bg-white px-3 text-sm font-semibold"
            >
              {PERMISSIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Note (optional)">
            <TextInput
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why you are sharing this"
            />
          </Field>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button onClick={() => void submit()} disabled={busy}>
          {busy ? 'Sharing…' : 'Share'}
        </Button>
      </ModalFooter>
    </ModalShell>
  );
}
