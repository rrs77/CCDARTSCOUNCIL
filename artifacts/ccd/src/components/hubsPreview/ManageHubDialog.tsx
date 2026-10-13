import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { Check, Copy, History, KeyRound, Send, Users, X } from 'lucide-react';
import { supabase } from '../../config/supabase';
import type { MapHub, MapIndex } from './ukHubMapData';
import {
  type AccessCodeRecord,
  type Contact,
  type DirectoryDraft,
  type DirectoryRevision,
  type HubDetail,
  type HubEditableFields,
  type HubRole,
  type ReachRow,
  atLeast,
  createAccessCode,
  engagementSummary,
  listAccessCodes,
  listDrafts,
  listRevisions,
  reviewDraft,
  saveDraft,
  setAccessCodeActive,
  withdrawDraft,
} from './partnerDirectory';

const ink = 'text-[#002D24]';
const muted = 'text-[#002D24]/65';
const field =
  'mt-1 w-full rounded-xl border border-[#002D24]/15 bg-white px-3 py-2.5 text-[15px] text-[#002D24] focus:border-[#14B8A6] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30';
const btn =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14B8A6] disabled:opacity-50';
const primary = `${btn} bg-[#002D24] text-white hover:bg-[#0B3F33]`;
const secondary = `${btn} border border-[#002D24]/12 bg-white text-[#002D24] hover:bg-[#F6F8F6]`;

type Panel = 'edit' | 'review' | 'history' | 'reach' | 'codes';

const ROLE_LABEL: Record<HubRole, string> = {
  hub_viewer: 'Viewer',
  hub_editor: 'Editor',
  hub_publisher: 'Publisher',
  hub_administrator: 'Administrator',
};

const EVENT_LABEL: Record<string, string> = {
  viewed: 'Opened the resource',
  added_to_library: 'Added to their library',
  placed_in_lesson: 'Placed in a lesson',
  assigned_to_planner: 'Assigned in the planner',
  taught_reflected: 'Marked as taught',
};

const STATUS_LABEL: Record<DirectoryDraft['status'], string> = {
  draft: 'Draft',
  pending: 'Awaiting approval',
  approved: 'Approved',
  rejected: 'Not approved',
  withdrawn: 'Withdrawn',
};

const FIELD_LABEL: Record<string, string> = { short_name: 'Short name', site_url: 'Website', about: 'About', contact: 'Contact' };

const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function changedFields(r: DirectoryRevision) {
  const keys = Object.keys(FIELD_LABEL).filter((k) => JSON.stringify(r.before?.[k] ?? null) !== JSON.stringify(r.after?.[k] ?? null));
  return keys.length ? keys.map((k) => FIELD_LABEL[k]).join(', ') : 'No visible change';
}

function describe(changes: Record<string, unknown>) {
  return Object.keys(changes)
    .map((k) => FIELD_LABEL[k] ?? k)
    .join(', ');
}

interface Form {
  short_name: string;
  site_url: string;
  about: string;
  lines: string;
  phone: string;
  email: string;
}

function initialForm(hub: MapHub, detail: HubDetail): Form {
  return {
    short_name: hub.shortName ?? '',
    site_url: hub.siteUrl ?? '',
    about: detail.about ?? '',
    lines: detail.contact?.lines?.join('\n') ?? '',
    phone: detail.contact?.phone ?? '',
    email: detail.contact?.email ?? '',
  };
}

function formChanges(base: Form, f: Form, sourceUrl?: string): HubEditableFields {
  const out: HubEditableFields = {};
  if (f.short_name.trim() !== base.short_name) out.short_name = f.short_name.trim();
  if (f.site_url.trim() !== base.site_url) out.site_url = f.site_url.trim();
  if (f.about.trim() !== base.about.trim()) out.about = f.about.trim();
  if (f.lines !== base.lines || f.phone !== base.phone || f.email !== base.email) {
    const contact: Contact = {
      lines: f.lines
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
      phone: f.phone.trim() || undefined,
      email: f.email.trim() || undefined,
      sourceUrl,
    };
    out.contact = contact;
  }
  return out;
}

function validate(f: Form): string | null {
  if (f.site_url.trim() && !/^https:\/\/[^\s]+\.[^\s]+$/.test(f.site_url.trim())) return 'Website must start with https://';
  if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return 'Enter a valid email address.';
  if (f.about.length > 4000) return 'About must be 4,000 characters or fewer.';
  return null;
}

export function ManageHubDialog({
  ix,
  hub,
  detail,
  role,
  onClose,
  onPublished,
}: {
  ix: MapIndex;
  hub: MapHub;
  detail: HubDetail;
  role: HubRole;
  onClose: () => void;
  onPublished: () => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const canReview = atLeast(role, 'hub_publisher');
  const isAdmin = atLeast(role, 'hub_administrator') && Boolean(detail.organisationId);
  const [panel, setPanel] = useState<Panel>('edit');
  const [me, setMe] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<DirectoryDraft[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    listDrafts(hub.id)
      .then(setDrafts)
      .catch((e: Error) => setLoadError(e.message));
  }, [hub.id]);

  useEffect(() => {
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
    refresh();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', esc);
    };
  }, [onClose, refresh]);

  const pending = (drafts ?? []).filter((d) => d.status === 'pending');
  const tabs: { id: Panel; label: string; show: boolean; count?: number }[] = [
    { id: 'edit', label: 'Edit details', show: true },
    { id: 'review', label: 'Approvals', show: canReview, count: pending.length },
    { id: 'history', label: 'History', show: true },
    { id: 'reach', label: 'Reach', show: isAdmin },
    { id: 'codes', label: 'Access codes', show: isAdmin },
  ];

  return createPortal(
    <div className="ccd-partner-hubs fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button type="button" aria-label="Close" className="absolute inset-0 bg-[#002D24]/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="ccd-sheet-up relative flex max-h-[92vh] w-full max-w-[760px] flex-col overflow-hidden rounded-t-3xl bg-[#FBFCFB] shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#002D24]/[0.06] px-6 py-5">
          <div>
            <p className={`text-[13px] font-semibold uppercase tracking-[0.12em] text-[#0B6B5F]`}>Manage hub · {ROLE_LABEL[role]}</p>
            <h2 id={titleId} className={`mt-1 text-[22px] font-semibold tracking-tight ${ink}`}>
              {hub.name}
            </h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-[#002D24]/60 hover:bg-[#002D24]/5">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div role="tablist" aria-label="Manage hub" className="flex gap-1 overflow-x-auto border-b border-[#002D24]/[0.06] px-4">
          {tabs
            .filter((t) => t.show)
            .map((t) => (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={panel === t.id}
                onClick={() => setPanel(t.id)}
                className={`min-h-[44px] whitespace-nowrap border-b-2 px-3 text-[15px] font-medium ${
                  panel === t.id ? 'border-[#14B8A6] text-[#002D24]' : 'border-transparent text-[#002D24]/60 hover:text-[#002D24]'
                }`}
              >
                {t.label}
                {t.count ? <span className="ml-1.5 rounded-full bg-[#F59E0B]/15 px-2 text-[13px] text-[#8A5300]">{t.count}</span> : null}
              </button>
            ))}
        </div>
        <div className="overflow-y-auto px-6 py-6" role="tabpanel">
          {loadError && <p className="mb-4 rounded-xl bg-[#FEF2F2] p-3 text-[14px] text-[#991B1B]">{loadError}</p>}
          {panel === 'edit' && <EditPanel hub={hub} detail={detail} me={me} drafts={drafts} onSaved={refresh} />}
          {panel === 'review' && (
            <ReviewPanel
              drafts={pending}
              me={me}
              onReviewed={(approved) => {
                refresh();
                if (approved) onPublished();
              }}
            />
          )}
          {panel === 'history' && <HistoryPanel hubId={hub.id} drafts={drafts} ix={ix} />}
          {panel === 'reach' && detail.organisationId && <ReachPanel organisationId={detail.organisationId} />}
          {panel === 'codes' && detail.organisationId && <CodesPanel organisationId={detail.organisationId} />}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function EditPanel({
  hub,
  detail,
  me,
  drafts,
  onSaved,
}: {
  hub: MapHub;
  detail: HubDetail;
  me: string | null;
  drafts: DirectoryDraft[] | null;
  onSaved: () => void;
}) {
  const base = initialForm(hub, detail);
  const open = (drafts ?? []).find((d) => d.proposed_by === me && !d.area_code && (d.status === 'draft' || d.status === 'pending'));
  const [form, setForm] = useState<Form>(() => base);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedDraft = useRef<string | null>(null);

  useEffect(() => {
    if (!open || loadedDraft.current === open.id) return;
    loadedDraft.current = open.id;
    const c = open.changes;
    setForm((f) => ({
      ...f,
      ...(c.short_name !== undefined && { short_name: c.short_name }),
      ...(c.site_url !== undefined && { site_url: c.site_url }),
      ...(c.about !== undefined && { about: c.about }),
      ...(c.contact && {
        lines: c.contact.lines?.join('\n') ?? '',
        phone: c.contact.phone ?? '',
        email: c.contact.email ?? '',
      }),
    }));
  }, [open]);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  const save = async (submit: boolean) => {
    const invalid = validate(form);
    if (invalid) return setError(invalid);
    const changes = formChanges(base, form, detail.contact?.sourceUrl);
    if (!Object.keys(changes).length) return setError('Nothing has changed yet.');
    setError(null);
    setBusy(true);
    try {
      await saveDraft({ id: open?.id, hubId: hub.id, changes, submit });
      toast.success(submit ? 'Sent to a hub publisher for approval' : 'Draft saved');
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async () => {
    if (!open) return;
    setBusy(true);
    try {
      await withdrawDraft(open.id);
      loadedDraft.current = null;
      setForm(base);
      toast.success('Draft withdrawn');
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        void save(true);
      }}
    >
      <p className={`text-[15px] leading-relaxed ${muted}`}>
        Changes go live only after a hub publisher approves them. The hub name, areas and lead organisation come from Arts Council England and can’t be edited here.
      </p>
      {open && (
        <p className="rounded-xl bg-[#14B8A6]/10 p-3 text-[14px] text-[#0B6B5F]">
          You have a {open.status === 'pending' ? 'change awaiting approval' : 'saved draft'} from {fmtDate(open.updated_at)}. Editing updates it.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={`block text-[14px] font-medium ${ink}`}>
          Short name
          <input className={field} value={form.short_name} onChange={set('short_name')} maxLength={60} />
        </label>
        <label className={`block text-[14px] font-medium ${ink}`}>
          Website
          <input className={field} value={form.site_url} onChange={set('site_url')} type="url" inputMode="url" placeholder="https://" />
        </label>
      </div>
      <label className={`block text-[14px] font-medium ${ink}`}>
        About
        <textarea className={`${field} min-h-[140px]`} value={form.about} onChange={set('about')} maxLength={4000} />
        <span className={`mt-1 block text-[13px] font-normal ${muted}`}>Leave a blank line between paragraphs.</span>
      </label>
      <fieldset className="space-y-4 rounded-2xl border border-[#002D24]/[0.08] p-4">
        <legend className={`px-1 text-[14px] font-semibold ${ink}`}>Contact</legend>
        <label className={`block text-[14px] font-medium ${ink}`}>
          Address or team (one per line)
          <textarea className={`${field} min-h-[72px]`} value={form.lines} onChange={set('lines')} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={`block text-[14px] font-medium ${ink}`}>
            Phone
            <input className={field} value={form.phone} onChange={set('phone')} type="tel" autoComplete="off" />
          </label>
          <label className={`block text-[14px] font-medium ${ink}`}>
            Email
            <input className={field} value={form.email} onChange={set('email')} type="email" autoComplete="off" />
          </label>
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="text-[14px] text-[#B42318]">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={primary} disabled={busy}>
          <Send className="h-4 w-4" /> Submit for approval
        </button>
        <button type="button" className={secondary} disabled={busy} onClick={() => void save(false)}>
          Save draft
        </button>
        {open && (
          <button type="button" className={secondary} disabled={busy} onClick={() => void withdraw()}>
            Withdraw
          </button>
        )}
      </div>
    </form>
  );
}

function ChangeList({ changes }: { changes: HubEditableFields }) {
  return (
    <dl className="mt-3 space-y-2 text-[14px]">
      {Object.entries(changes).map(([k, v]) => (
        <div key={k}>
          <dt className={`font-medium ${ink}`}>{FIELD_LABEL[k] ?? k}</dt>
          <dd className={`whitespace-pre-line ${muted}`}>
            {k === 'contact' && v && typeof v === 'object'
              ? [...((v as Contact).lines ?? []), (v as Contact).phone, (v as Contact).email].filter(Boolean).join('\n')
              : String(v || '(cleared)')}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ReviewPanel({ drafts, me, onReviewed }: { drafts: DirectoryDraft[]; me: string | null; onReviewed: (approved: boolean) => void }) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const decide = async (d: DirectoryDraft, decision: 'approved' | 'rejected') => {
    setBusy(d.id);
    try {
      await reviewDraft(d.id, decision, notes[d.id]?.trim() || undefined);
      toast.success(decision === 'approved' ? 'Approved and published' : 'Returned to the editor');
      onReviewed(decision === 'approved');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (!drafts.length) return <p className={`text-[15px] ${muted}`}>Nothing is waiting for approval.</p>;
  return (
    <ul className="space-y-4">
      {drafts.map((d) => (
        <li key={d.id} className="rounded-2xl border border-[#002D24]/[0.08] bg-white p-4">
          <p className={`text-[15px] font-semibold ${ink}`}>
            {d.area_code ? `Local area ${d.area_code}` : 'Hub details'} · {describe(d.changes as Record<string, unknown>)}
          </p>
          <p className={`text-[13px] ${muted}`}>
            Submitted {fmtDate(d.updated_at)}
            {d.proposed_by === me ? ' by you' : ''}
          </p>
          <ChangeList changes={d.changes} />
          <label className={`mt-4 block text-[14px] font-medium ${ink}`}>
            Note to the editor (optional)
            <input className={field} value={notes[d.id] ?? ''} onChange={(e) => setNotes({ ...notes, [d.id]: e.target.value })} maxLength={500} />
          </label>
          {d.proposed_by === me && (
            <p className={`mt-2 text-[13px] ${muted}`}>Another publisher needs to approve changes you proposed.</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={primary} disabled={busy === d.id} onClick={() => void decide(d, 'approved')}>
              <Check className="h-4 w-4" /> Approve and publish
            </button>
            <button type="button" className={secondary} disabled={busy === d.id} onClick={() => void decide(d, 'rejected')}>
              Return with note
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function HistoryPanel({ hubId, drafts, ix }: { hubId: string; drafts: DirectoryDraft[] | null; ix: MapIndex }) {
  const [revisions, setRevisions] = useState<DirectoryRevision[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    listRevisions(hubId)
      .then(setRevisions)
      .catch((e: Error) => setError(e.message));
  }, [hubId]);
  const mine = (drafts ?? []).filter((d) => d.status !== 'pending' && d.status !== 'draft');

  return (
    <div className="space-y-6">
      <section>
        <h3 className={`flex items-center gap-2 text-[16px] font-semibold ${ink}`}>
          <History className="h-4 w-4" aria-hidden /> Published changes
        </h3>
        {error ? (
          <p className="mt-2 text-[14px] text-[#B42318]">{error}</p>
        ) : !revisions ? (
          <p className={`mt-2 text-[14px] ${muted}`}>Loading…</p>
        ) : !revisions.length ? (
          <p className={`mt-2 text-[14px] ${muted}`}>No changes have been published yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[#002D24]/[0.06] rounded-2xl border border-[#002D24]/[0.08] bg-white">
            {revisions.map((r) => (
              <li key={r.id} className="px-4 py-3 text-[14px]">
                <span className={ink}>{changedFields(r)}</span>
                <span className={muted}>
                  {' '}
                  · {r.area_code ? ix.lad(r.area_code)?.name ?? r.area_code : 'hub'} · {fmtDate(r.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      {mine.length > 0 && (
        <section>
          <h3 className={`text-[16px] font-semibold ${ink}`}>Reviewed proposals</h3>
          <ul className="mt-3 space-y-2">
            {mine.map((d) => (
              <li key={d.id} className="rounded-xl bg-white px-4 py-3 text-[14px] ring-1 ring-[#002D24]/[0.08]">
                <span className={ink}>{describe(d.changes as Record<string, unknown>)}</span>
                <span className={muted}>
                  {' '}
                  · {STATUS_LABEL[d.status]} · {fmtDate(d.updated_at)}
                </span>
                {d.review_note && <p className={`mt-1 ${muted}`}>“{d.review_note}”</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ReachPanel({ organisationId }: { organisationId: string }) {
  const [rows, setRows] = useState<ReachRow[] | null>(null);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    engagementSummary(organisationId)
      .then(async (r) => {
        setRows(r);
        const ids = [...new Set(r.map((x) => x.resource_id))];
        if (!ids.length) return;
        const { data } = await supabase.from('resources').select('id,title').in('id', ids);
        setTitles(Object.fromEntries((data ?? []).map((x: { id: string; title: string }) => [x.id, x.title])));
      })
      .catch((e: Error) => setError(e.message));
  }, [organisationId]);

  const byResource = new Map<string, ReachRow[]>();
  for (const r of rows ?? []) byResource.set(r.resource_id, [...(byResource.get(r.resource_id) ?? []), r]);

  return (
    <div className="space-y-4">
      <p className={`flex gap-2 text-[15px] leading-relaxed ${muted}`}>
        <Users className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        Teachers using your resources in the last 12 months. Numbers count distinct teachers. Groups smaller than three are hidden to protect privacy. Opening or adding a
        resource doesn’t mean it has been taught.
      </p>
      {error ? (
        <p className="text-[14px] text-[#B42318]">{error}</p>
      ) : !rows ? (
        <p className={`text-[14px] ${muted}`}>Loading…</p>
      ) : !rows.length ? (
        <p className={`text-[14px] ${muted}`}>No activity recorded yet.</p>
      ) : (
        <ul className="space-y-3">
          {[...byResource.entries()].map(([id, list]) => (
            <li key={id} className="rounded-2xl border border-[#002D24]/[0.08] bg-white p-4">
              <p className={`text-[15px] font-semibold ${ink}`}>{titles[id] ?? 'Resource'}</p>
              <dl className="mt-2 grid gap-x-6 gap-y-1 text-[14px] sm:grid-cols-2">
                {list.map((r) => (
                  <div key={r.event_type} className="flex justify-between gap-3">
                    <dt className={muted}>{EVENT_LABEL[r.event_type] ?? r.event_type}</dt>
                    <dd className={`font-medium tabular-nums ${ink}`}>{r.teachers ?? 'Fewer than 3'}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CodesPanel({ organisationId }: { organisationId: string }) {
  const [codes, setCodes] = useState<AccessCodeRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [grantDays, setGrantDays] = useState('365');
  const [maxUses, setMaxUses] = useState('');
  const [fresh, setFresh] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    listAccessCodes(organisationId)
      .then(setCodes)
      .catch((e: Error) => setError(e.message));
  }, [organisationId]);
  useEffect(load, [load]);

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const days = Number.parseInt(grantDays, 10);
      const max = Number.parseInt(maxUses, 10);
      const { code } = await createAccessCode(organisationId, {
        label: label.trim() || undefined,
        grantDays: Number.isInteger(days) && days > 0 ? days : undefined,
        maxRedemptions: Number.isInteger(max) && max > 0 ? max : undefined,
      });
      setFresh(code);
      setLabel('');
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (c: AccessCodeRecord) => {
    try {
      await setAccessCodeActive(organisationId, c.id, !c.active);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-5">
      <p className={`flex gap-2 text-[15px] leading-relaxed ${muted}`}>
        <KeyRound className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        Give a code to a school so its teachers can open your locked resources. Codes are stored securely and shown only once.
      </p>
      {fresh && (
        <div className="rounded-2xl bg-[#002D24] p-4 text-white" role="status">
          <p className="text-[14px] text-white/75">New code. Copy it now, it won’t be shown again.</p>
          <div className="mt-2 flex items-center gap-3">
            <code className="text-[22px] font-semibold tracking-[0.12em]">{fresh}</code>
            <button
              type="button"
              className="rounded-lg p-2 hover:bg-white/10"
              aria-label="Copy code"
              onClick={() => navigator.clipboard?.writeText(fresh).then(() => toast.success('Copied'), () => undefined)}
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      <div className="grid gap-3 rounded-2xl border border-[#002D24]/[0.08] bg-white p-4 sm:grid-cols-[minmax(0,1fr)_120px_120px_auto] sm:items-end">
        <label className={`block text-[14px] font-medium ${ink}`}>
          School or label
          <input className={field} value={label} onChange={(e) => setLabel(e.target.value)} maxLength={80} />
        </label>
        <label className={`block text-[14px] font-medium ${ink}`}>
          Access days
          <input className={field} value={grantDays} onChange={(e) => setGrantDays(e.target.value)} inputMode="numeric" />
        </label>
        <label className={`block text-[14px] font-medium ${ink}`}>
          Max uses
          <input className={field} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} inputMode="numeric" placeholder="No limit" />
        </label>
        <button type="button" className={primary} disabled={busy} onClick={() => void create()}>
          Create code
        </button>
      </div>
      {error && <p className="text-[14px] text-[#B42318]">{error}</p>}
      {codes && !codes.length && <p className={`text-[14px] ${muted}`}>No codes yet.</p>}
      {codes && codes.length > 0 && (
        <ul className="divide-y divide-[#002D24]/[0.06] rounded-2xl border border-[#002D24]/[0.08] bg-white">
          {codes.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-[14px]">
              <div>
                <p className={`font-medium ${ink}`}>{c.label}</p>
                <p className={muted}>
                  Used {c.redemption_count}
                  {c.max_redemptions ? ` of ${c.max_redemptions}` : ''} · {c.grant_days ? `${c.grant_days} days access` : 'No time limit'} · created {fmtDate(c.created_at)}
                </p>
              </div>
              <button type="button" className={secondary} onClick={() => void toggle(c)}>
                {c.active ? 'Turn off' : 'Turn on'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
