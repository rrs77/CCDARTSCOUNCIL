# Using Supabase (current setup)

The app uses **Supabase only** as its database. There is no Neon or other database in use.

- **Netlify** and **Vercel** deployments both talk to the same Supabase project.
- Your data lives in Supabase. Keep the project **active** (free tier projects pause after inactivity — restore from the [Supabase Dashboard](https://supabase.com/dashboard) if needed).
- In the app, **Data Source Management** (Admin Settings) shows **Supabase Status**. If it says Connected, you’re good.

## Tables the app uses (single source of truth)

To avoid confusion, only these tables are read/written by the app:

| Table | Purpose |
|-------|--------|
| `activities` | Activity library |
| `lessons` | Lessons |
| `lesson_plans` | Calendar lesson plans |
| `eyfs_statements` | EYFS statements |
| `half_terms` | Half terms |
| `year_groups` | Year groups (e.g. LKG, Reception) |
| **`custom_categories`** | **Category list + Assign Year Groups** (same table as when persistence last worked) |
| `category_groups` | Category groups |
| `custom_objective_year_groups` | Custom objectives – year groups |
| `custom_objective_areas` | Custom objectives – areas |
| `custom_objectives` | Custom objectives |
| `activity_custom_objectives` | Activity–objective links |
| `lesson_stacks` | Lesson stacks |
| `activity_stacks` | Activity stacks |

## Tables not used by the app (safe to ignore)

- **`categories`** – Alternative category table; the app currently uses **`custom_categories`** for category list and year group assignments.

Other tables in your project (e.g. `activity_packs`, `backup_snapshots`, `classes`) may be used elsewhere or for backups; the list above is what this app’s code touches.

## Categories and category choices

**Categories** and **Assign Year Groups** are stored in **`public.custom_categories`**. The app reads and writes this table (same as ~2 weeks ago when persistence worked).

**If year group assignments don’t persist:**

1. **Check schema from terminal:**  
   `node scripts/check-supabase-categories.js`  
   (Uses `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from env or defaults.)  
   If the script reports **year_groups column: MISSING** for `custom_categories`, run the migration below.

2. **Run in Supabase → SQL Editor:**  
   **`supabase_migrations/add_custom_categories_year_groups.sql`**  
   (Adds `year_groups` JSONB to `custom_categories` if missing.)

3. Ensure **Save** in Settings → Manage Categories is clicked after assigning year groups.

**Unique on name:** Upsert uses `onConflict: 'name'`. If you get duplicate-key or upsert errors, add a unique constraint:  
`CREATE UNIQUE INDEX IF NOT EXISTS custom_categories_name_key ON public.custom_categories (name);`

**Custom objectives (Curriculum Objectives)** use `custom_objective_year_groups`. If you see a white screen or "Could not find the 'linked_year_groups' column", run `supabase_migrations/add_linked_year_groups_to_custom_objective_year_groups.sql` in the SQL Editor to add the `linked_year_groups` column.

**Copy Link (shareable lesson PDF link)** needs the server to upload the PDF to Supabase. Set **SUPABASE_SERVICE_ROLE_KEY** in your host’s environment variables: in **Vercel** → Project → Settings → Environment Variables, add `SUPABASE_SERVICE_ROLE_KEY` with the value from Supabase Dashboard → Project Settings → API (Service role key). Then redeploy. Same for Netlify (Site settings → Environment variables).

If Supabase doesn’t show as connected or data doesn’t load, see the **“Supabase isn’t showing” / Status shows “Disconnected”** and **Vercel deploy** sections in `COPY_SUPABASE_TO_NEON_STEPS.md` — that doc also has optional steps for copying data to Neon, which you can ignore if you’re only using Supabase.
