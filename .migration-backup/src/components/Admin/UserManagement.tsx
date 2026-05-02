import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, Edit2, Loader2, Mail, Plus, X, MoreVertical, ShoppingBag, UserX, Send, Package } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { getVercelApiUrl } from '../../utils/apiUrl';
import { activityPacksApi } from '../../config/api';
import { useSettings } from '../../contexts/SettingsContextNew';
import { useAuth } from '../../hooks/useAuth';
import type { Profile, ProfileRole, ProfileStatus } from '../../types/auth';
import { EditUserModal } from './EditUserModal';
import { ViewPurchasesModal } from './ViewPurchasesModal';
import { AssignPacksModal } from './AssignPacksModal';
import toast from 'react-hot-toast';

const BASE_ROLES: { value: ProfileRole; label: string }[] = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'student', label: 'Student' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'admin', label: 'Admin' }
];

const STATUS_OPTIONS: { value: ProfileStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'invited', label: 'Invited' },
  { value: 'suspended', label: 'Suspended' }
];

function roleLabel(role: ProfileRole): string {
  switch (role) {
    case 'superuser': return 'Superuser';
    case 'admin': return 'Admin';
    case 'teacher': return 'Teacher';
    case 'viewer': return 'Viewer';
    case 'student': return 'Student';
    default: return role;
  }
}

function roleBadgeClass(role: ProfileRole): string {
  switch (role) {
    case 'superuser': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'admin': return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'teacher': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'viewer': return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'student': return 'bg-gray-100 text-gray-700 border-gray-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function statusLabel(status: ProfileStatus | undefined): string {
  if (!status) return 'Active';
  switch (status) {
    case 'active': return 'Active';
    case 'invited': return 'Invited';
    case 'suspended': return 'Suspended';
    default: return status;
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
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

export function UserManagement() {
  const { customYearGroups, categories } = useSettings();
  const { profile: currentProfile } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuDropdownRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [viewPurchasesUser, setViewPurchasesUser] = useState<Profile | null>(null);
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

  const yearGroupNames = customYearGroups.map(g => g.name);
  const categoryNames = categories.map(c => c.name);
  const isSuperuser = currentProfile?.role === 'superuser';
  const createUserRoles = isSuperuser ? [...BASE_ROLES, { value: 'superuser' as const, label: 'Superuser' }] : BASE_ROLES;

  const fetchUsers = React.useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Failed to load users:', error);
      throw new Error(error.message || 'Failed to load users');
    }
    return (data as Profile[]) ?? [];
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    fetchUsers()
      .then(data => {
        if (!cancelled) {
          setUsers(data);
          setLoadError(null);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setUsers([]);
          setLoadError(err instanceof Error ? err.message : 'Failed to load users');
          toast.error('Could not load user list. Check your connection and permissions.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [fetchUsers]);

  useEffect(() => {
    if (!showCreateUserModal) return;
    activityPacksApi.getAllPacksAdmin().then(packs => {
      setCreatePacks(packs.map(p => ({ pack_id: p.pack_id, name: p.name })));
    }).catch(() => setCreatePacks([]));
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
      if (menuOpenForId && menuRef.current && !menuRef.current.contains(target) && menuDropdownRef.current && !menuDropdownRef.current.contains(target)) {
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
    setUsers(prev => prev.map(u => (u.id === editingUser.id ? { ...u, ...updates } : u)));
    setEditingUser(null);
    setMenuOpenForId(null);
  };

  const handleAssignPacksSave = async (updates: Partial<Profile>) => {
    if (!assignPacksUser) return;
    const { error } = await supabase.from('profiles').update(updates).eq('id', assignPacksUser.id);
    if (error) throw new Error(error.message);
    setUsers(prev => prev.map(u => (u.id === assignPacksUser.id ? { ...u, ...updates } : u)));
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
        redirectTo: `${window.location.origin}/reset-password`
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
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
    setMenuOpenForId(null);
    try {
      const { error } = await supabase.from('profiles').update({ status: next, updated_at: new Date().toISOString() }).eq('id', profile.id);
      if (error) throw new Error(error.message);
      setUsers(prev => prev.map(u => (u.id === profile.id ? { ...u, status: next } : u)));
      toast.success(next === 'suspended' ? 'User suspended.' : 'User reactivated.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update status');
    }
  };

  const handleDeleteUser = async (profile: Profile) => {
    setMenuOpenForId(null);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', profile.id);
      if (error) throw new Error(error.message);
      setUsers(prev => prev.filter(u => u.id !== profile.id));
      setDeleteConfirmUser(null);
      toast.success('User removed.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete. You may need to delete from Auth first.');
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailTrimmed,
          password: createSendInvite ? undefined : (createPassword.trim() || undefined),
          display_name: createName.trim() || undefined,
          role: createRole,
          status: createStatus,
          send_invite_email: createSendInvite,
          allowed_year_groups: createAllowedYearGroups.length > 0 ? createAllowedYearGroups : undefined,
          admin_preset_categories: createPresetCategories.length > 0 ? createPresetCategories : undefined,
          admin_preset_activity_pack_ids: createPresetPackIds.length > 0 ? createPresetPackIds : undefined,
        })
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
          msg = 'Server misconfigured: SUPABASE_SERVICE_ROLE_KEY is not set. Add it in Vercel → Project Settings → Environment Variables.';
        }
        setCreateError(msg);
        return;
      }
      toast.success(data.invited ? `Invite sent to ${emailTrimmed}.` : `User ${emailTrimmed} created.`);
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
      fetchUsers().then(setUsers);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to create user');
      const isNetwork = err.message === 'Failed to fetch' || err.name === 'TypeError';
      setCreateError(
        isNetwork
          ? 'Cannot reach the Create User API. In dev set VITE_VERCEL_URL in .env and restart. On production ensure the API is deployed (Vercel api/ folder) and SUPABASE_SERVICE_ROLE_KEY is set.'
          : err.message
      );
    } finally {
      setCreateSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="text-amber-800 font-medium">Could not load users</p>
        <p className="mt-1 text-sm text-amber-700">{loadError}</p>
        <button
          type="button"
          onClick={() => {
            setLoadError(null);
            setLoading(true);
            fetchUsers()
              .then(data => {
                setUsers(data);
                setLoadError(null);
              })
              .catch(err => {
                setUsers([]);
                setLoadError(err instanceof Error ? err.message : 'Failed to load users');
              })
              .finally(() => setLoading(false));
          }}
          className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          Try again
        </button>
      </div>
    );
  }

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
        Manage users: edit name and role (including Admin or Superuser), change status (Active / Suspended), view purchases, send password reset or resend invite, suspend or delete. Use the <strong>⋮ Actions</strong> menu on a row → <strong>Edit</strong> to assign activity packs (e.g. Commedia) or change role. Use Edit → Role to assign Superuser.
      </p>
      <div className="border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
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
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No users found. Use &quot;Create User&quot; to add one, or they appear after signing up.
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{user.display_name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{user.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${roleBadgeClass(user.role as ProfileRole)}`}>
                      {roleLabel(user.role as ProfileRole)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${statusBadgeClass(user.status)}`}>
                      {statusLabel(user.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="relative inline-block" ref={menuOpenForId === user.id ? menuRef : undefined}>
                      <button
                        ref={menuOpenForId === user.id ? menuButtonRef : undefined}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setMenuOpenForId(menuOpenForId === user.id ? null : user.id); }}
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

      {menuOpenForId && menuPosition && (() => {
        const menuUser = users.find(u => u.id === menuOpenForId);
        if (!menuUser) return null;
        return createPortal(
          <div
            ref={menuDropdownRef}
            className="py-1 w-56 bg-white rounded-lg border border-gray-200 shadow-lg"
            style={{ position: 'fixed', top: menuPosition.top, right: menuPosition.right, zIndex: 9999 }}
          >
            <button type="button" onClick={() => { setEditingUser(menuUser); setMenuOpenForId(null); }} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
              <Edit2 className="h-4 w-4" /> Edit User
            </button>
            <button type="button" onClick={() => { setViewPurchasesUser(menuUser); setMenuOpenForId(null); }} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" /> View Purchases
            </button>
            <button type="button" onClick={() => { setAssignPacksUser(menuUser); setMenuOpenForId(null); }} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
              <Package className="h-4 w-4" /> Assign packs
            </button>
            <button type="button" onClick={() => handleSendResetEmail(menuUser)} disabled={!menuUser.email?.trim() || sendingResetFor === menuUser.id} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50">
              {sendingResetFor === menuUser.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Send Password Reset Email
            </button>
            {(menuUser.status === 'invited') && (
              <button type="button" onClick={() => handleResendInvite(menuUser)} disabled={!menuUser.email?.trim() || resendingInviteFor === menuUser.id} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50">
                {resendingInviteFor === menuUser.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Resend Invite
              </button>
            )}
            <button type="button" onClick={() => handleSuspendReactivate(menuUser)} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
              <UserX className="h-4 w-4" /> {menuUser.status === 'suspended' ? 'Reactivate User' : 'Suspend User'}
            </button>
            <button type="button" onClick={() => { setDeleteConfirmUser(menuUser); setMenuOpenForId(null); }} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
              <X className="h-4 w-4" /> Delete User
            </button>
          </div>,
          document.body
        );
      })()}

      {editingUser && (
        <EditUserModal user={editingUser} yearGroupNames={yearGroupNames} categoryNames={categoryNames} onSave={handleSave} onClose={() => setEditingUser(null)} />
      )}
      {viewPurchasesUser && (
        <ViewPurchasesModal user={viewPurchasesUser} onClose={() => setViewPurchasesUser(null)} />
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete user?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will remove <strong>{deleteConfirmUser.display_name || deleteConfirmUser.email || deleteConfirmUser.id}</strong> from the list. You may also need to remove them from Authentication in Supabase. Continue?
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteConfirmUser(null)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button type="button" onClick={() => handleDeleteUser(deleteConfirmUser)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900">Create User</h2>
              <button type="button" onClick={() => !createSending && setShowCreateUserModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg disabled:opacity-50" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {import.meta.env.DEV && !import.meta.env.VITE_VERCEL_URL && (
                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                  Local dev: Create User uses the Vercel API. Add <code className="text-xs bg-amber-100 px-1 rounded">VITE_VERCEL_URL</code> to .env and restart, or add users on the deployed site.
                </p>
              )}
              {createError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{createError}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input type="text" value={createName} onChange={e => setCreateName(e.target.value)} placeholder="e.g. Jane Smith" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                  <input type="email" value={createEmail} onChange={e => setCreateEmail(e.target.value)} placeholder="user@example.com" className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select value={createRole} onChange={e => setCreateRole(e.target.value as ProfileRole)} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    {createUserRoles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={createStatus} onChange={e => setCreateStatus(e.target.value as ProfileStatus)} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              {!createSendInvite && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password (min 6 characters)</label>
                  <input type="password" value={createPassword} onChange={e => setCreatePassword(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" minLength={6} autoComplete="new-password" />
                </div>
              )}
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={createSendInvite} onChange={e => setCreateSendInvite(e.target.checked)} />
                <span className="text-sm text-gray-700">Send invite email</span>
              </label>
              {yearGroupNames.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Allowed year groups (optional)</label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {yearGroupNames.map(name => (
                      <label key={name} className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-gray-200 bg-gray-50">
                        <input
                          type="checkbox"
                          checked={createAllowedYearGroups.includes(name)}
                          onChange={() => setCreateAllowedYearGroups(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])}
                        />
                        <span className="text-sm">{name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {categoryNames.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preset categories (optional)</label>
                  <p className="text-xs text-gray-500 mb-1">User will have these categories and cannot remove them.</p>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {categoryNames.map(name => (
                      <label key={name} className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-gray-200 bg-gray-50">
                        <input
                          type="checkbox"
                          checked={createPresetCategories.includes(name)}
                          onChange={() => setCreatePresetCategories(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])}
                        />
                        <span className="text-sm">{name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {createPacks.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign purchased resources (optional)</label>
                  <p className="text-xs text-gray-500 mb-1">Grant access to activity packs without purchasing.</p>
                  <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                    {createPacks.map(p => (
                      <label key={p.pack_id} className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-gray-200 bg-gray-50">
                        <input
                          type="checkbox"
                          checked={createPresetPackIds.includes(p.pack_id)}
                          onChange={() => setCreatePresetPackIds(prev => prev.includes(p.pack_id) ? prev.filter(id => id !== p.pack_id) : [...prev, p.pack_id])}
                        />
                        <span className="text-sm">{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              </div>
              <div className="flex-shrink-0 border-t border-gray-200 px-6 py-3 bg-gray-50 flex justify-end gap-2 rounded-b-xl">
                <button type="button" onClick={() => !createSending && setShowCreateUserModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={createSending} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 inline-flex items-center gap-2">
                  {createSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {createSending ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
