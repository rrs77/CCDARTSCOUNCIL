import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Users,
  Edit2,
  Loader2,
  Mail,
  Plus,
  X,
  MoreVertical,
  UserX,
  Send,
  Package,
  Search,
  Eraser,
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { getVercelApiUrl } from '../../utils/apiUrl';
import { activityPacksApi } from '../../config/api';
import { useSettings } from '../../contexts/SettingsContextNew';
import { useAuth } from '../../hooks/useAuth';
import type { Profile, ProfileRole, ProfileStatus } from '../../types/auth';
import { EditUserModal } from './EditUserModal';
import { AssignPacksModal } from './AssignPacksModal';
import { listAdminHubs } from '../../utils/hubAdminApi';
import toast from 'react-hot-toast';

const BASE_ROLES: { value: ProfileRole; label: string }[] = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'student', label: 'Student' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'creator', label: 'Creator' },
  { value: 'organisation', label: 'Organisation' },
  { value: 'admin', label: 'Admin' },
];

const STATUS_OPTIONS: { value: ProfileStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'invited', label: 'Invited' },
  { value: 'suspended', label: 'Suspended' },
];

const PAGE_SIZE = 25;

async function authHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  return headers;
}

function roleLabel(role: ProfileRole): string {
  switch (role) {
    case 'super_admin':
      return 'Super admin';
    case 'superuser':
      return 'Superuser';
    case 'admin':
      return 'Administrator';
    case 'teacher':
      return 'Teacher';
    case 'creator':
      return 'Creator';
    case 'organisation':
      return 'Organisation';
    case 'viewer':
      return 'Viewer';
    case 'student':
      return 'Student';
    default:
      return role;
  }
}

function roleBadgeClass(role: ProfileRole): string {
  switch (role) {
    case 'super_admin':
    case 'superuser':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'admin':
      return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'organisation':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'creator':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'teacher':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function statusLabel(status: ProfileStatus | undefined): string {
  if (!status) return 'Active';
  switch (status) {
    case 'active':
      return 'Active';
    case 'invited':
      return 'Invited';
    case 'suspended':
      return 'Suspended';
    default:
      return status;
  }
}

function statusBadgeClass(status: ProfileStatus | undefined): string {
  if (!status || status === 'active') return 'bg-green-100 text-green-800 border-green-200';
  if (status === 'invited') return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-red-100 text-red-800 border-red-200';
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

type SortKey = 'created_at' | 'email' | 'display_name' | 'role';

interface ListResponse {
  users: Profile[];
  total: number;
  page: number;
  pageSize: number;
  activeAdminCount: number;
  scope?: string;
}

export function UserManagement() {
  const { customYearGroups, categories } = useSettings();
  const { profile: currentProfile } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuDropdownRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [total, setTotal] = useState(0);
  const [activeAdminCount, setActiveAdminCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [assignPacksUser, setAssignPacksUser] = useState<Profile | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<Profile | null>(null);
  const [menuOpenForId, setMenuOpenForId] = useState<string | null>(null);
  const [sendingResetFor, setSendingResetFor] = useState<string | null>(null);
  const [resendingInviteFor, setResendingInviteFor] = useState<string | null>(null);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<ProfileRole>('viewer');
  const [createStatus, setCreateStatus] = useState<ProfileStatus>('invited');
  const [createSendInvite, setCreateSendInvite] = useState(true);
  const [createSending, setCreateSending] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createAllowedYearGroups, setCreateAllowedYearGroups] = useState<string[]>([]);
  const [createPresetCategories, setCreatePresetCategories] = useState<string[]>([]);
  const [createPresetPackIds, setCreatePresetPackIds] = useState<string[]>([]);
  const [createPacks, setCreatePacks] = useState<{ pack_id: string; name: string }[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterHub, setFilterHub] = useState<string>('all');
  const [hubOptions, setHubOptions] = useState<{ id: string; label: string }[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [anonymiseUser, setAnonymiseUser] = useState<Profile | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const yearGroupNames = customYearGroups.map((g) => g.name);
  const categoryNames = categories.map((c) => c.name);
  const isSuperuser =
    currentProfile?.role === 'superuser' || currentProfile?.role === 'super_admin';
  const createUserRoles = isSuperuser
    ? [
        ...BASE_ROLES,
        { value: 'superuser' as const, label: 'Superuser' },
        { value: 'super_admin' as const, label: 'Super admin' },
      ]
    : BASE_ROLES;

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [search, filterRole, filterStatus, filterHub, sortKey, sortAsc]);

  useEffect(() => {
    let cancelled = false;
    listAdminHubs()
      .then(({ hubs }) => {
        if (cancelled) return;
        setHubOptions(
          hubs.map((h) => ({
            id: h.id,
            label: h.display_name || h.short_name || h.slug || h.id,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setHubOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchUsers = useCallback(async (): Promise<ListResponse> => {
    const qs = new URLSearchParams();
    qs.set('page', String(page));
    qs.set('pageSize', String(PAGE_SIZE));
    qs.set('sort', sortKey);
    qs.set('order', sortAsc ? 'asc' : 'desc');
    if (search) qs.set('q', search);
    if (filterRole !== 'all') qs.set('role', filterRole);
    if (filterStatus !== 'all') qs.set('status', filterStatus);
    if (filterHub !== 'all') qs.set('hub', filterHub);

    const res = await fetch(getVercelApiUrl(`/api/users/list?${qs}`), {
      headers: await authHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error((data as { error?: string })?.error || 'Failed to load users');
    }
    return data as ListResponse;
  }, [page, sortKey, sortAsc, search, filterRole, filterStatus, filterHub]);

  const reload = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data.users || []);
      setTotal(data.total ?? 0);
      setActiveAdminCount(data.activeAdminCount ?? 0);
      setSelectedIds(new Set());
    } catch (err) {
      setUsers([]);
      setTotal(0);
      setLoadError(err instanceof Error ? err.message : 'Failed to load users');
      toast.error('Could not load user list. Check your connection and permissions.');
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    setLoading(true);
    fetchUsers()
      .then((data) => {
        if (cancelled) return;
        setUsers(data.users || []);
        setTotal(data.total ?? 0);
        setActiveAdminCount(data.activeAdminCount ?? 0);
      })
      .catch((err) => {
        if (cancelled) return;
        setUsers([]);
        setTotal(0);
        setLoadError(err instanceof Error ? err.message : 'Failed to load users');
        toast.error('Could not load user list. Check your connection and permissions.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchUsers]);

  useEffect(() => {
    if (!showCreateUserModal) return;
    activityPacksApi
      .getAllPacksAdmin()
      .then((packs) => {
        setCreatePacks(packs.map((p) => ({ pack_id: p.pack_id, name: p.name })));
      })
      .catch(() => setCreatePacks([]));
  }, [showCreateUserModal]);

  useLayoutEffect(() => {
    if (!menuOpenForId || !menuButtonRef.current) {
      setMenuPosition(null);
      return;
    }
    const rect = menuButtonRef.current.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
  }, [menuOpenForId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuOpenForId &&
        menuRef.current &&
        !menuRef.current.contains(target) &&
        menuDropdownRef.current &&
        !menuDropdownRef.current.contains(target)
      ) {
        setMenuOpenForId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpenForId]);

  const handleSave = async (updates: Partial<Profile>) => {
    if (!editingUser) return;
    const { error } = await supabase.from('profiles').update(updates).eq('id', editingUser.id);
    if (error) throw new Error(error.message);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === editingUser.id
          ? {
              ...u,
              ...updates,
              hub_ids: editingUser.hub_ids,
              hub_memberships: editingUser.hub_memberships,
            }
          : u,
      ),
    );
    setMenuOpenForId(null);
    // Modal stays open until EditUserModal finishes hub sync and calls onClose
  };

  const handleAssignPacksSave = async (updates: Partial<Profile>) => {
    if (!assignPacksUser) return;
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', assignPacksUser.id);
    if (error) throw new Error(error.message);
    setUsers((prev) =>
      prev.map((u) => (u.id === assignPacksUser.id ? { ...u, ...updates } : u)),
    );
    setAssignPacksUser(null);
  };

  const handleSendResetEmail = async (profile: Profile) => {
    const email = profile.email?.trim();
    if (!email) {
      toast.error('No email on file for this user.');
      return;
    }
    setSendingResetFor(profile.id);
    setMenuOpenForId(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw new Error(error.message);
      toast.success('Password reset email sent. They can use the link to set a new password.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send');
    } finally {
      setSendingResetFor(null);
    }
  };

  const handleResendInvite = async (profile: Profile) => {
    const email = profile.email?.trim();
    if (!email) {
      toast.error('No email on file.');
      return;
    }
    setResendingInviteFor(profile.id);
    setMenuOpenForId(null);
    try {
      const res = await fetch(getVercelApiUrl('/api/resend-invite'), {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to resend');
      toast.success(`Invite resent to ${email}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to resend invite');
    } finally {
      setResendingInviteFor(null);
    }
  };

  const handleSuspendReactivate = async (profile: Profile) => {
    const next: ProfileStatus = profile.status === 'suspended' ? 'active' : 'suspended';
    if (
      next === 'suspended' &&
      (profile.role === 'admin' ||
        profile.role === 'superuser' ||
        profile.role === 'super_admin') &&
      activeAdminCount <= 1
    ) {
      toast.error('Cannot suspend the last active administrator.');
      setMenuOpenForId(null);
      return;
    }
    setMenuOpenForId(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: next, updated_at: new Date().toISOString() })
        .eq('id', profile.id);
      if (error) throw new Error(error.message);
      toast.success(next === 'suspended' ? 'User suspended.' : 'User reactivated.');
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update status');
    }
  };

  const handleDeleteUser = async (profile: Profile) => {
    if (
      (profile.role === 'admin' ||
        profile.role === 'superuser' ||
        profile.role === 'super_admin') &&
      activeAdminCount <= 1
    ) {
      toast.error('Cannot delete the last active administrator.');
      return;
    }
    setMenuOpenForId(null);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', profile.id);
      if (error) throw new Error(error.message);
      setDeleteConfirmUser(null);
      toast.success('User removed.');
      await reload();
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : 'Failed to delete. You may need to delete from Auth first.',
      );
    }
  };

  const handleAnonymiseUser = async (profile: Profile) => {
    setMenuOpenForId(null);
    try {
      const res = await fetch(getVercelApiUrl('/api/users/anonymise'), {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ user_id: profile.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Anonymise failed');
      setAnonymiseUser(null);
      toast.success('User anonymised.');
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Anonymise failed');
    }
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllPage = () => {
    const pageIds = users.map((u) => u.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const selectedUsers = users.filter((u) => selectedIds.has(u.id));

  const handleBulkSuspend = async () => {
    if (selectedUsers.length === 0) return;
    setBulkBusy(true);
    try {
      let suspended = 0;
      for (const profile of selectedUsers) {
        if (profile.status === 'suspended') continue;
        if (
          (profile.role === 'admin' ||
            profile.role === 'superuser' ||
            profile.role === 'super_admin') &&
          activeAdminCount - suspended <= 1
        ) {
          toast.error('Skipped suspending the last active administrator.');
          continue;
        }
        const { error } = await supabase
          .from('profiles')
          .update({ status: 'suspended', updated_at: new Date().toISOString() })
          .eq('id', profile.id);
        if (!error) suspended += 1;
      }
      toast.success(`Suspended ${suspended} user${suspended === 1 ? '' : 's'}.`);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Bulk suspend failed');
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkResendInvite = async () => {
    const invited = selectedUsers.filter((u) => u.status === 'invited' && u.email?.trim());
    if (invited.length === 0) {
      toast.error('No invited users with email selected.');
      return;
    }
    setBulkBusy(true);
    try {
      let ok = 0;
      for (const profile of invited) {
        const res = await fetch(getVercelApiUrl('/api/resend-invite'), {
          method: 'POST',
          headers: await authHeaders(),
          body: JSON.stringify({ email: profile.email!.trim() }),
        });
        if (res.ok) ok += 1;
      }
      toast.success(`Resent ${ok} invite${ok === 1 ? '' : 's'}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Bulk resend failed');
    } finally {
      setBulkBusy(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailTrimmed = createEmail.trim();
    if (!emailTrimmed) {
      setCreateError('Email is required.');
      return;
    }
    setCreateError('');
    setCreateSending(true);
    const apiUrl = getVercelApiUrl('/api/create-user');
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({
          email: emailTrimmed,
          password: createSendInvite ? undefined : createPassword.trim() || undefined,
          display_name: createName.trim() || undefined,
          role: createRole,
          status: createStatus,
          send_invite_email: createSendInvite,
          must_change_password: !createSendInvite && Boolean(createPassword.trim()),
          allowed_year_groups:
            createAllowedYearGroups.length > 0 ? createAllowedYearGroups : undefined,
          admin_preset_categories:
            createPresetCategories.length > 0 ? createPresetCategories : undefined,
          admin_preset_activity_pack_ids:
            createPresetPackIds.length > 0 ? createPresetPackIds : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        let msg = data?.error || `Request failed (${res.status})`;
        if (res.status === 404) {
          const isDev = import.meta.env.DEV;
          msg = isDev
            ? 'Create-user API not available locally. Add VITE_VERCEL_URL=https://your-app.vercel.app to .env (your real Vercel URL), restart the dev server, then try again. Or add users on the deployed site.'
            : 'Create-user API not found. On Vercel: ensure the api/ folder is deployed and SUPABASE_SERVICE_ROLE_KEY is set in Project Settings → Environment Variables. If the frontend is hosted elsewhere, set VITE_API_BASE_URL to your Vercel app URL.';
        } else if (res.status === 500 && msg.includes('SUPABASE_SERVICE_ROLE_KEY')) {
          msg =
            'Server misconfigured: SUPABASE_SERVICE_ROLE_KEY is not set. Add it in Vercel → Project Settings → Environment Variables.';
        }
        setCreateError(msg);
        return;
      }
      toast.success(
        data.invited ? `Invite sent to ${emailTrimmed}.` : `User ${emailTrimmed} created.`,
      );
      setShowCreateUserModal(false);
      setCreateName('');
      setCreateEmail('');
      setCreatePassword('');
      setCreateRole('viewer');
      setCreateStatus('invited');
      setCreateSendInvite(true);
      setCreateAllowedYearGroups([]);
      setCreatePresetCategories([]);
      setCreatePresetPackIds([]);
      await reload();
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to create user');
      const isNetwork = err.message === 'Failed to fetch' || err.name === 'TypeError';
      setCreateError(
        isNetwork
          ? 'Cannot reach the Create User API. In dev set VITE_VERCEL_URL in .env and restart. On production ensure the API is deployed (Vercel api/ folder) and SUPABASE_SERVICE_ROLE_KEY is set.'
          : err.message,
      );
    } finally {
      setCreateSending(false);
    }
  };

  if (loading && users.length === 0 && !loadError) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (loadError && users.length === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="text-amber-800 font-medium">Could not load users</p>
        <p className="mt-1 text-sm text-amber-700">{loadError}</p>
        <button
          type="button"
          onClick={() => void reload()}
          className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          Try again
        </button>
      </div>
    );
  }

  const allPageSelected =
    users.length > 0 && users.every((u) => selectedIds.has(u.id));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-gray-700">
          <Users className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Users & access</h3>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowCreateUserModal(true);
            setCreateError('');
            setCreateName('');
            setCreateEmail('');
            setCreatePassword('');
            setCreateRole('viewer');
            setCreateStatus('invited');
            setCreateSendInvite(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create User
        </button>
      </div>
      <p className="text-sm text-gray-600">
        Search and filter users server-side. Edit role and hub access, send password reset or
        resend invite, suspend, anonymise (UK GDPR), or remove access.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search name or email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-sm"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
        >
          <option value="all">All roles</option>
          {createUserRoles.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        {hubOptions.length > 0 && (
          <select
            value={filterHub}
            onChange={(e) => setFilterHub(e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
          >
            <option value="all">All hubs</option>
            {hubOptions.map((h) => (
              <option key={h.id} value={h.id}>
                {h.label}
              </option>
            ))}
          </select>
        )}
        <select
          value={`${sortKey}:${sortAsc ? 'asc' : 'desc'}`}
          onChange={(e) => {
            const [k, dir] = e.target.value.split(':') as [SortKey, string];
            setSortKey(k);
            setSortAsc(dir === 'asc');
          }}
          className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
        >
          <option value="created_at:desc">Newest first</option>
          <option value="created_at:asc">Oldest first</option>
          <option value="email:asc">Email A–Z</option>
          <option value="display_name:asc">Name A–Z</option>
          <option value="role:asc">Role A–Z</option>
        </select>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
          <span className="text-gray-700">{selectedIds.size} selected</span>
          <button
            type="button"
            disabled={bulkBusy}
            onClick={() => void handleBulkSuspend()}
            className="rounded border border-gray-300 bg-white px-2 py-1 hover:bg-gray-100 disabled:opacity-50"
          >
            Suspend selected
          </button>
          <button
            type="button"
            disabled={bulkBusy}
            onClick={() => void handleBulkResendInvite()}
            className="rounded border border-gray-300 bg-white px-2 py-1 hover:bg-gray-100 disabled:opacity-50"
          >
            Resend invites
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-gray-500 hover:text-gray-800"
          >
            Clear
          </button>
        </div>
      )}

      <div className="relative border border-gray-200 rounded-lg overflow-x-auto">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
        )}
        <table className="w-full text-left min-w-[720px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={toggleSelectAllPage}
                  aria-label="Select all on page"
                />
              </th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Name</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Email</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Role</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Status</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Created</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No users match your filters. Use &quot;Create User&quot; to add one.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(user.id)}
                      onChange={() => toggleSelected(user.id)}
                      aria-label={`Select ${user.display_name || user.email || user.id}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {user.display_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{user.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${roleBadgeClass(user.role as ProfileRole)}`}
                    >
                      {roleLabel(user.role as ProfileRole)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${statusBadgeClass(user.status)}`}
                    >
                      {statusLabel(user.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div
                      className="relative inline-block"
                      ref={menuOpenForId === user.id ? menuRef : undefined}
                    >
                      <button
                        ref={menuOpenForId === user.id ? menuButtonRef : undefined}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenForId(menuOpenForId === user.id ? null : user.id);
                        }}
                        className="p-2 rounded-lg hover:bg-gray-200 text-gray-600"
                        aria-label="Actions"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {total} user{total === 1 ? '' : 's'}
          {loading ? ' · updating…' : ''}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border border-gray-300 px-2 py-1 disabled:opacity-40"
          >
            Prev
          </button>
          <span>
            Page {page} / {pageCount}
          </span>
          <button
            type="button"
            disabled={page >= pageCount || loading}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            className="rounded border border-gray-300 px-2 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {menuOpenForId &&
        menuPosition &&
        (() => {
          const menuUser = users.find((u) => u.id === menuOpenForId);
          if (!menuUser) return null;
          return createPortal(
            <div
              ref={menuDropdownRef}
              className="py-1 w-56 bg-white rounded-lg border border-gray-200 shadow-lg"
              style={{
                position: 'fixed',
                top: menuPosition.top,
                right: menuPosition.right,
                zIndex: 9999,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setEditingUser(menuUser);
                  setMenuOpenForId(null);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" /> Edit User
              </button>
              <button
                type="button"
                onClick={() => {
                  setAssignPacksUser(menuUser);
                  setMenuOpenForId(null);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Package className="h-4 w-4" /> Assign packs
              </button>
              <button
                type="button"
                onClick={() => handleSendResetEmail(menuUser)}
                disabled={!menuUser.email?.trim() || sendingResetFor === menuUser.id}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
              >
                {sendingResetFor === menuUser.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}{' '}
                Send Password Reset Email
              </button>
              {menuUser.status === 'invited' && (
                <button
                  type="button"
                  onClick={() => handleResendInvite(menuUser)}
                  disabled={!menuUser.email?.trim() || resendingInviteFor === menuUser.id}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                >
                  {resendingInviteFor === menuUser.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}{' '}
                  Resend Invite
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSuspendReactivate(menuUser)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <UserX className="h-4 w-4" />{' '}
                {menuUser.status === 'suspended' ? 'Reactivate User' : 'Suspend User'}
              </button>
              {!menuUser.anonymised_at && (
                <button
                  type="button"
                  onClick={() => {
                    setAnonymiseUser(menuUser);
                    setMenuOpenForId(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Eraser className="h-4 w-4" /> Anonymise (GDPR)
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmUser(menuUser);
                  setMenuOpenForId(null);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <X className="h-4 w-4" /> Remove access
              </button>
            </div>,
            document.body,
          );
        })()}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          yearGroupNames={yearGroupNames}
          categoryNames={categoryNames}
          onSave={handleSave}
          onClose={() => {
            setEditingUser(null);
            void reload();
          }}
        />
      )}
      {assignPacksUser && (
        <AssignPacksModal
          user={assignPacksUser}
          onSave={handleAssignPacksSave}
          onClose={() => setAssignPacksUser(null)}
        />
      )}

      {deleteConfirmUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Remove access?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will remove{' '}
              <strong>
                {deleteConfirmUser.display_name ||
                  deleteConfirmUser.email ||
                  deleteConfirmUser.id}
              </strong>{' '}
              from the list. You may also need to remove them from Authentication in Supabase.
              Continue?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteUser(deleteConfirmUser)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {anonymiseUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Anonymise user?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This clears personal data for{' '}
              <strong>{anonymiseUser.display_name || anonymiseUser.email}</strong>, suspends the
              account, and writes an audit log entry. Download history may retain hashed IPs for
              retention period. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAnonymiseUser(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleAnonymiseUser(anonymiseUser)}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                Anonymise
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900">Create User</h2>
              <button
                type="button"
                onClick={() => !createSending && setShowCreateUserModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {import.meta.env.DEV && !import.meta.env.VITE_VERCEL_URL && (
                  <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                    Local dev: Create User uses the Vercel API. Add{' '}
                    <code className="text-xs bg-amber-100 px-1 rounded">VITE_VERCEL_URL</code> to
                    .env and restart, or add users on the deployed site.
                  </p>
                )}
                {createError && (
                  <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    {createError}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      placeholder="e.g. Jane Smith"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      value={createRole}
                      onChange={(e) => setCreateRole(e.target.value as ProfileRole)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      {createUserRoles.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={createStatus}
                      onChange={(e) => setCreateStatus(e.target.value as ProfileStatus)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {!createSendInvite && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password (min 6 characters)
                    </label>
                    <input
                      type="password"
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>
                )}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={createSendInvite}
                    onChange={(e) => setCreateSendInvite(e.target.checked)}
                  />
                  <span className="text-sm text-gray-700">Send invite email</span>
                </label>
                {yearGroupNames.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Allowed year groups (optional)
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {yearGroupNames.map((name) => (
                        <label
                          key={name}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-gray-200 bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={createAllowedYearGroups.includes(name)}
                            onChange={() =>
                              setCreateAllowedYearGroups((prev) =>
                                prev.includes(name)
                                  ? prev.filter((n) => n !== name)
                                  : [...prev, name],
                              )
                            }
                          />
                          <span className="text-sm">{name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {categoryNames.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preset categories (optional)
                    </label>
                    <p className="text-xs text-gray-500 mb-1">
                      User will have these categories and cannot remove them.
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {categoryNames.map((name) => (
                        <label
                          key={name}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-gray-200 bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={createPresetCategories.includes(name)}
                            onChange={() =>
                              setCreatePresetCategories((prev) =>
                                prev.includes(name)
                                  ? prev.filter((n) => n !== name)
                                  : [...prev, name],
                              )
                            }
                          />
                          <span className="text-sm">{name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {createPacks.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assign resource packs (optional)
                    </label>
                    <p className="text-xs text-gray-500 mb-1">Grant access to activity packs.</p>
                    <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                      {createPacks.map((p) => (
                        <label
                          key={p.pack_id}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-gray-200 bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={createPresetPackIds.includes(p.pack_id)}
                            onChange={() =>
                              setCreatePresetPackIds((prev) =>
                                prev.includes(p.pack_id)
                                  ? prev.filter((id) => id !== p.pack_id)
                                  : [...prev, p.pack_id],
                              )
                            }
                          />
                          <span className="text-sm">{p.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-shrink-0 border-t border-gray-200 px-6 py-3 bg-gray-50 flex justify-end gap-2 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => !createSending && setShowCreateUserModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSending}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {createSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}{' '}
                  {createSending ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
