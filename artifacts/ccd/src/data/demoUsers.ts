/**
 * Demo-mode roster for Settings → Users when the live admin API is unavailable.
 * Mirrors the Profile shape returned by GET /api/users/list.
 */

import type { Profile } from '../types/auth';

const now = Date.now();
const days = (n: number) => new Date(now - n * 24 * 60 * 60 * 1000).toISOString();

export const DEMO_USERS_ROSTER: Profile[] = [
  {
    id: 'demo-user-admin',
    email: 'admin@curriculum.demo',
    display_name: 'Alex Morgan',
    first_name: 'Alex',
    last_name: 'Morgan',
    school_or_org: 'Curriculum Designer',
    role: 'admin',
    status: 'active',
    can_edit_activities: true,
    can_edit_lessons: true,
    can_manage_year_groups: true,
    can_manage_users: true,
    invitation_status: 'complete',
    allowed_year_groups: ['Year 1', 'Year 2', 'Year 3'],
    created_at: days(120),
    updated_at: days(1),
  },
  {
    id: 'demo-user-lead',
    email: 's.chen@curriculum.demo',
    display_name: 'Sam Chen',
    first_name: 'Sam',
    last_name: 'Chen',
    school_or_org: 'Curriculum Designer',
    role: 'teacher',
    status: 'active',
    can_edit_activities: true,
    can_edit_lessons: true,
    can_manage_year_groups: true,
    can_manage_users: true,
    invitation_status: 'complete',
    allowed_year_groups: ['Year 4', 'Year 5', 'Year 6'],
    created_at: days(90),
    updated_at: days(3),
  },
  {
    id: 'demo-user-teacher',
    email: 'j.patel@curriculum.demo',
    display_name: 'Jordan Patel',
    first_name: 'Jordan',
    last_name: 'Patel',
    school_or_org: 'Curriculum Designer',
    role: 'teacher',
    status: 'active',
    can_edit_activities: true,
    can_edit_lessons: true,
    can_manage_year_groups: false,
    can_manage_users: false,
    invitation_status: 'complete',
    allowed_year_groups: ['Reception', 'Year 1'],
    created_at: days(60),
    updated_at: days(5),
  },
  {
    id: 'demo-user-invited',
    email: 'new.teacher@curriculum.demo',
    display_name: 'Priya Nair',
    first_name: 'Priya',
    last_name: 'Nair',
    school_or_org: 'Curriculum Designer',
    role: 'teacher',
    status: 'invited',
    can_edit_activities: true,
    can_edit_lessons: true,
    can_manage_year_groups: false,
    can_manage_users: false,
    invitation_status: 'pending',
    invite_sent_at: days(2),
    invite_expires_at: days(-5),
    allowed_year_groups: ['Year 3'],
    created_at: days(2),
    updated_at: days(2),
  },
  {
    id: 'demo-user-viewer',
    email: 'observer@curriculum.demo',
    display_name: 'Riley Brooks',
    first_name: 'Riley',
    last_name: 'Brooks',
    school_or_org: 'Partner Hub North',
    role: 'viewer',
    status: 'active',
    can_edit_activities: false,
    can_edit_lessons: false,
    can_manage_year_groups: false,
    can_manage_users: false,
    invitation_status: 'complete',
    allowed_year_groups: null,
    created_at: days(40),
    updated_at: days(10),
  },
  {
    id: 'demo-user-suspended',
    email: 'former@curriculum.demo',
    display_name: 'Casey Lee',
    first_name: 'Casey',
    last_name: 'Lee',
    school_or_org: 'Curriculum Designer',
    role: 'teacher',
    status: 'suspended',
    can_edit_activities: false,
    can_edit_lessons: false,
    can_manage_year_groups: false,
    can_manage_users: false,
    invitation_status: 'suspended',
    allowed_year_groups: ['Year 2'],
    created_at: days(200),
    updated_at: days(14),
  },
  {
    id: 'demo-user-creator',
    email: 'content@curriculum.demo',
    display_name: 'Morgan Ellis',
    first_name: 'Morgan',
    last_name: 'Ellis',
    school_or_org: 'Curriculum Designer',
    role: 'creator',
    status: 'active',
    can_edit_activities: true,
    can_edit_lessons: true,
    can_manage_year_groups: true,
    can_manage_users: false,
    invitation_status: 'complete',
    allowed_year_groups: ['Year 7', 'Year 8', 'Year 9'],
    created_at: days(75),
    updated_at: days(4),
  },
  {
    id: 'demo-user-expired',
    email: 'expired.invite@curriculum.demo',
    display_name: 'Taylor Quinn',
    first_name: 'Taylor',
    last_name: 'Quinn',
    school_or_org: 'Partner Hub North',
    role: 'teacher',
    status: 'invited',
    can_edit_activities: true,
    can_edit_lessons: true,
    can_manage_year_groups: false,
    can_manage_users: false,
    invitation_status: 'expired',
    invite_sent_at: days(20),
    invite_expires_at: days(5),
    allowed_year_groups: ['Year 5'],
    created_at: days(20),
    updated_at: days(20),
  },
];

/** Mutable demo store so invite/suspend/delete feel interactive in preview. */
let demoStore: Profile[] | null = null;

export function getDemoUsersStore(): Profile[] {
  if (!demoStore) demoStore = DEMO_USERS_ROSTER.map((u) => ({ ...u }));
  return demoStore;
}

export function resetDemoUsersStore(): void {
  demoStore = DEMO_USERS_ROSTER.map((u) => ({ ...u }));
}

export function filterDemoUsers(opts: {
  q?: string;
  role?: string;
  status?: string;
  school?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}): { users: Profile[]; total: number; page: number; pageSize: number; activeAdminCount: number } {
  const pageSize = opts.pageSize ?? 25;
  const page = opts.page ?? 1;
  let list = [...getDemoUsersStore()];
  const q = (opts.q || '').trim().toLowerCase();
  if (q) {
    list = list.filter(
      (u) =>
        (u.display_name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.school_or_org || '').toLowerCase().includes(q),
    );
  }
  if (opts.role && opts.role !== 'all') {
    list = list.filter((u) => u.role === opts.role);
  }
  if (opts.status && opts.status !== 'all') {
    list = list.filter((u) => (u.status || 'active') === opts.status);
  }
  if (opts.school && opts.school !== 'all') {
    list = list.filter((u) => (u.school_or_org || '') === opts.school);
  }
  const sortKey = opts.sort || 'created_at';
  const asc = opts.order === 'asc';
  list.sort((a, b) => {
    let av = '';
    let bv = '';
    if (sortKey === 'email') {
      av = a.email || '';
      bv = b.email || '';
    } else if (sortKey === 'display_name') {
      av = a.display_name || '';
      bv = b.display_name || '';
    } else if (sortKey === 'role') {
      av = a.role;
      bv = b.role;
    } else if (sortKey === 'school_or_org') {
      av = a.school_or_org || '';
      bv = b.school_or_org || '';
    } else {
      av = a.created_at || '';
      bv = b.created_at || '';
    }
    const cmp = av.localeCompare(bv, undefined, { sensitivity: 'base' });
    return asc ? cmp : -cmp;
  });
  const total = list.length;
  const start = (page - 1) * pageSize;
  const users = list.slice(start, start + pageSize);
  const activeAdminCount = getDemoUsersStore().filter(
    (u) =>
      (u.role === 'admin' || u.role === 'superuser' || u.role === 'super_admin') &&
      u.status !== 'suspended',
  ).length;
  return { users, total, page, pageSize, activeAdminCount };
}
