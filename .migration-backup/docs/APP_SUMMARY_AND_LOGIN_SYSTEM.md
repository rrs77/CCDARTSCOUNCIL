# App Summary & Login System Plan

## What your app does

Your app is a **Creative Curriculum Designer** (lesson-viewer / CCD2026) for planning and delivering curriculum. It is used to:

- **Manage year groups / classes** – e.g. Lower/Upper Kindergarten, Reception, Year 1–6, Assembly Songs. You can add, edit, reorder, and delete year groups.
- **Manage activity categories** – e.g. Drama Games, Vocal Warmups, Kodaly Songs. Categories can be assigned to year groups so the right activities show per class.
- **Browse and manage an activity library** – Activities (name, description, category, links, year groups, etc.) are filtered by the selected year group and category. You can add, edit, and delete activities and organise them into **activity stacks**.
- **Build lessons** – Drag activities into a lesson plan, group by category, add notes. Lessons are stored per sheet (year group) and academic year.
- **View units and half-terms** – Units, half-terms, and timetable slots can be configured. Lessons can be assigned to half-terms and viewed in a unit view.
- **Lesson library** – List and manage saved lessons (by year group and academic year).
- **Calendar** – Lesson planner calendar for dates and lesson plans.
- **Custom objectives** – Curriculum objectives with year groups and areas; link objectives to activities.
- **User settings** – Year groups, categories (and their year-group assignments), resource links, data source, and (optionally) activity packs / purchases.
- **Timetable builder** – Build timetables by day and time slot.

**Data in Supabase (main tables):**

| Table | Purpose |
|-------|--------|
| `activities` | Activity library (shared or per-user depending on policy) |
| `lessons` | Lesson content per sheet (year group) and academic year |
| `lesson_plans` | Calendar lesson plans |
| `lesson_stacks`, `activity_stacks` | Stacks of lessons/activities |
| `year_groups` | Class/year group list (e.g. Year 1, Assembly Songs) |
| `custom_categories` | Categories + year-group assignments (e.g. Vocal Warmups → Year 1–6) |
| `category_groups` | Category grouping metadata |
| `half_terms` | Half-term definitions |
| `eyfs_statements` | EYFS standards |
| `custom_objectives`, `custom_objective_year_groups`, `custom_objective_areas`, `activity_custom_objectives` | Curriculum objectives |
| `activity_packs`, `user_purchases` | Packs and purchases (already user-scoped where used) |

**Current auth:**  
Login exists via a **local user list** (hardcoded emails/passwords) and/or **WordPress** (if `VITE_WORDPRESS_URL` is set). There is no Supabase Auth yet; the app uses the **anon** key and does not send a real user identity to Supabase. `getCurrentUserId()` in the API is a localStorage placeholder (`'1'`), not a Supabase user id.

---

## What you want for the login system

1. **Separate logins** – Multiple distinct users (teachers, admins, etc.), each with their own credentials.
2. **Admin-defined access** – An admin user can specify what access each user has to the databases (which tables/rows they can read or write).
3. **Per-user profile in Supabase** – Each user has a profile in Supabase so the app can “remember” their activities (their data, preferences, and access rights).

So you need:

- **Authentication** – Who is this user? (Supabase Auth: email/password or magic link, etc.)
- **Profile** – One row per user (e.g. `profiles` or `user_profiles`) storing display name, role, and **per-user access settings** (e.g. which tables or “realms” they can access).
- **Row-level security (RLS)** – Policies that use `auth.uid()` and optionally the profile (e.g. role, access flags) so each user only sees/edits data they’re allowed to.
- **Admin UI (optional)** – Screens where an admin can edit a user’s profile and access rights.

---

## How to implement it with Supabase

### 1. Use Supabase Auth for “separate logins”

- Enable **Email** (and optionally **Magic Link**) in Supabase Dashboard → Authentication → Providers.
- Replace (or bridge) the current local/WordPress login with **Supabase sign-in**:
  - `supabase.auth.signInWithPassword({ email, password })` for email/password.
  - After sign-in, use `supabase.auth.getUser()` / `session` in the app and stop relying on the hardcoded `localUsers` for Supabase-backed features.
- Create a **second Supabase client** (or switch the existing one) so that after login you use the **session’s access token** for all Supabase requests. That way every request is tied to the logged-in user.

So: **separate logins** = one Supabase Auth user per person; each login gives a different `auth.uid()`.

### 2. Per-user profile so “the app remembers their activities”

- **Table: `profiles`** (or `user_profiles`), keyed by Supabase user id:
  - `id` (UUID, primary key, references `auth.users(id)`)
  - `email`, `display_name`, `avatar_url` (optional, can be synced from Auth)
  - `role` – e.g. `'admin' | 'teacher' | 'viewer'`
  - **Access/permissions** – e.g. JSONB column `access` or columns like `can_edit_activities`, `can_edit_lessons`, `can_manage_users`, `allowed_year_groups` (array), etc., so an admin can limit what this user can see/edit.
- **Creation:**  
  - Either a **Database Trigger** on `auth.users` (after insert) that inserts a row into `profiles` with default role/access.  
  - Or your app creates a profile on first login if missing (e.g. from a “post-signup” flow or an admin-only “invite user” flow).
- **“Remember their activities”** means:
  - All RLS policies and app logic use `auth.uid()` (and optionally `profiles.role` / `profiles.access`) so that:
    - **Shared data** (e.g. global activity library, year_groups, custom_categories) can be read (or written) according to role/access.
    - **User-specific data** (e.g. lessons, lesson_plans, their own settings) are filtered by `user_id = auth.uid()` (or equivalent), so each user only sees and edits their own activities/lessons/plans.

So: **separate profile in Supabase** = one row in `profiles` per `auth.users.id`, with role and access fields that you use in RLS and in the app.

### 3. Admin specifies what access each user has to the databases

- Store “what this user can do” in **`profiles`** (or a related table like `user_access`).
- Examples:
  - **Role-based:** `role` in `profiles`: e.g. `admin` (full access), `teacher` (own lessons + shared read), `viewer` (read-only).
  - **Fine-grained:** columns or JSONB in `profiles`, e.g.:
    - `can_edit_activities` (boolean)
    - `can_edit_lessons` (boolean)
    - `can_manage_year_groups` (boolean)
    - `allowed_sheets` or `allowed_year_groups` (text[] or jsonb) – which year groups this user can see/edit.
- **Admin UI:**  
  - Only users with `role = 'admin'` (or `can_manage_users`) can open “User management”.  
  - There, admin selects a user (from `profiles` or Auth) and edits that user’s `role` and access fields.  
  - Save by updating `profiles` (and optionally custom claims if you use them).

So: **admin specifies access** = admin updates `profiles` (and possibly related tables) for each user; RLS and app logic read those fields to allow/deny access per table or per feature.

### 4. RLS so each user only has the access you defined

- Enable RLS on all tables that should respect “who can see what”.
- **Policies** typically:
  - Use `auth.uid()` to know the current user.
  - Use `profiles` (e.g. via a small function or join) to get `role` and access flags.
  - **Examples:**
    - **activities:** e.g. “allow read for everyone; allow insert/update/delete only if `profiles.role` in ('admin','teacher') and maybe `profiles.can_edit_activities = true`”.
    - **lessons:** “allow read/insert/update/delete only where `user_id = auth.uid()`” (and optionally only for `sheet_name` in the user’s `allowed_year_groups`).
    - **year_groups / custom_categories:** “allow read for all authenticated; allow write only if `profiles.can_manage_year_groups` or `profiles.role = 'admin'`”.
    - **profiles:** “users can read their own row; only admin can update others’ rows (or update access fields)”.
- **Service role** (backend-only, never in the browser) can bypass RLS for admin tasks (e.g. creating users, bulk fixes). The frontend should use the **authenticated** user’s token so RLS applies.

So: **each user only has the access you specified** = RLS policies that depend on `auth.uid()` and on `profiles` (role + access flags) so the database enforces who can read/write which tables and rows.

### 5. App changes (high level)

- **Auth:**  
  - Use Supabase Auth for login/signup/logout and store session (and optionally refresh `profiles` on load).  
  - Remove or reduce reliance on hardcoded `localUsers` and WordPress for Supabase-backed features; keep WordPress only if you still need it for something else.
- **Supabase client:**  
  - After login, use a client that’s configured with the user’s session (so all API calls use the user’s JWT and RLS applies).
- **Data loading:**  
  - Where data is per-user, add `user_id = auth.uid()` (or equivalent) in queries; RLS will enforce it, but the app can pass `user_id` in inserts/updates.  
  - Where data is shared (e.g. activities, year_groups), keep loading as now but RLS will restrict writes (and reads if you add read policies).
- **Profile and access:**  
  - On app load, fetch the current user’s `profiles` row (by `auth.uid()`).  
  - Use `profiles.role` and access flags to show/hide UI (e.g. “Edit”, “User management”) and to decide which API calls to make.  
  - Admin UI: list users (from `profiles`), edit role and access for each user.
- **“Remember their activities”:**  
  - Once every table that should be per-user has a `user_id` (or equivalent) and RLS filters by `auth.uid()`, each user will only see and modify their own lessons, plans, and other per-user data. Shared reference data (activities, year groups, categories) can stay shared with access controlled by role/access.

---

## Summary table

| Requirement | How |
|-------------|-----|
| Separate logins | Supabase Auth: one user per person; each login gives a distinct `auth.uid()`. |
| Admin specifies access per user | Store role and access flags (or JSONB) in `profiles`; admin UI updates them. |
| Per-user profile in Supabase | `profiles` table keyed by `auth.users.id`; created on signup or first login. |
| Remember each user’s activities | RLS + `user_id` on per-user tables (lessons, lesson_plans, etc.); shared data access by role/access. |

Next concrete steps are: (1) Enable Supabase Auth and add a `profiles` table (+ trigger or app-side creation), (2) Add RLS policies that use `auth.uid()` and `profiles`, (3) Switch the app to Supabase login and use the session for all Supabase calls, (4) Add an admin-only “User management” screen to edit `profiles` (role and access). If you want, the next step can be a minimal `profiles` schema and example RLS policies for one or two tables (e.g. `lessons` and `profiles`).

---

## Implementation status & compatibility (Supabase Auth port)

The app has been wired for **optional** Supabase Auth. It works with your current setup; you only need to enable it when you want separate logins and RLS.

### When Supabase Auth is **off** (default)

- No env change: app keeps using **local users** and/or **WordPress** as before.
- Supabase client uses the **anon** key with no session; existing anon RLS (e.g. `year_groups_rls_allow_anon.sql`) continues to apply.
- No migrations required for current behaviour.

### When Supabase Auth is **on**

1. **Env** – Set `VITE_USE_SUPABASE_AUTH=true` (e.g. in `.env` or Vercel). Keep `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as they are.
2. **Supabase Dashboard** – Enable **Email** (and optionally Magic Link) under Authentication → Providers.
3. **Migrations (run in this order in SQL Editor)** – `create_profiles_table.sql`, then `rls_lessons_activities_year_groups.sql`.
4. **Anon vs authenticated** – With Auth on, the app sends the session JWT, so requests are **authenticated** and the new RLS policies apply. The existing anon policy on `year_groups` only applies when the client is anon (Auth off); it does not conflict.
5. **First admin** – New users get a `profiles` row with `role = 'teacher'`. To make someone admin: in Supabase Table Editor open `profiles`, set their `role` to `admin` (and optionally `can_manage_users` to `true`). They can then use the **Users** tab and promote others.
6. **Other tables** – RLS has been added for: `profiles`, `lessons`, `lesson_plans`, `activities`, `year_groups`, `custom_categories`. Tables such as `half_terms`, `eyfs_statements`, `lesson_stacks`, `activity_stacks`, `category_groups`, and custom objectives tables are **not** in the new RLS migration; they remain without RLS (or with existing policies) and keep working when authenticated. `activity_packs` and `user_purchases` already have RLS that checks JWT email for admin; that continues to work with Supabase Auth and is not driven by `profiles.role`.
7. **Logout** – Logout is async when Auth is on. The Header uses `onClick={() => void logout()}` so the promise is handled correctly.
