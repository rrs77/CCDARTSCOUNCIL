/**
 * Profile row from public.profiles (Supabase Auth).
 * id matches auth.users(id).
 */
export type ProfileRole =
  | 'admin'
  | 'teacher'
  | 'viewer'
  | 'student'
  | 'superuser'
  | 'creator'
  | 'organisation';

export type ProfileStatus = 'active' | 'invited' | 'suspended';

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  first_name?: string | null;
  last_name?: string | null;
  school_or_org?: string | null;
  role: ProfileRole;
  status?: ProfileStatus;
  can_edit_activities: boolean;
  can_edit_lessons: boolean;
  can_manage_year_groups: boolean;
  can_manage_users: boolean;
  /** Organisation / admin download analytics permission. */
  can_view_download_analytics?: boolean;
  organisation_id?: string | null;
  organisation_name?: string | null;
  must_change_password?: boolean;
  privacy_policy_accepted_at?: string | null;
  marketing_consent?: boolean;
  marketing_consent_at?: string | null;
  anonymised_at?: string | null;
  allowed_year_groups: string[] | null;
  /** Category names assigned by admin; user cannot remove these. */
  admin_preset_categories?: string[] | null;
  /** Activity pack IDs granted by admin (e.g. paid content). */
  admin_preset_activity_pack_ids?: string[] | null;
  /** User-starred activity IDs/keys for Activity Library ordering. */
  starred_activity_ids?: string[] | null;
  /** Category names where "starred first" is enabled. */
  starred_first_activity_categories?: string[] | null;
  /** Global toggle for "starred first" in all categories. */
  starred_first_activity_global?: boolean | null;
  created_at: string;
  updated_at: string;
}

/** Purchase row for View Purchases (optional table user_purchases). */
export interface UserPurchase {
  id: string;
  user_id: string;
  product_name: string;
  status: string;
  purchased_at: string;
  expires_at?: string | null;
}

/** App-level user (AuthContext): from Supabase auth + profile or from local/WordPress. */
export interface AppUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
  token?: string;
  /** Set when logged in via Supabase Auth; used for RLS and permission checks. */
  profile?: Profile;
}

/** Tracked partner resource (mirrors public.resources). */
export interface TrackedResource {
  id: string;
  title: string;
  description?: string;
  type: string;
  collection: string;
  filename: string;
  relatedAudioId?: string | null;
}
