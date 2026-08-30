# Threat Model

## Project Overview

Creative Curriculum Designer is a pnpm monorepo centered on a React/Vite frontend in `artifacts/ccd` that lets schools manage curriculum content, activities, and lesson plans backed directly by Supabase. The repo also contains an Express service in `artifacts/api-server`, but the current production-reachable server surface in this repo is limited to `/api/healthz`; the main security boundary is therefore the browser client talking to Supabase Auth and database APIs.

## Assets

- **User accounts and roles** — teacher/admin/superuser identities, profile roles, and permissions such as `can_manage_users`. Compromise enables impersonation and administrative actions.
- **Lesson plans and activity content** — school-authored curriculum data, lesson text, activity descriptions, resources, and standards mappings. This data is business-sensitive and also appears throughout rich UI views.
- **Authorization state** — Supabase sessions, cached profile data, and the app’s local auth state in browser storage. Errors here can turn into account takeover or privilege escalation.
- **Supabase-backed school data** — profiles and application tables queried directly from the client. Exposure depends on server-side RLS remaining aligned with frontend assumptions.
- **Tenant-scoped school settings** — branding, year groups, category groups, and curriculum configuration should remain isolated per school. Cross-tenant overwrites change the visible product configuration for other schools.
- **Third-party export service credentials and quota** — PDF generation and upload credentials represent billable capabilities. Exposure lets attackers spend quota or disrupt exports without compromising a user account.

## Trust Boundaries

- **Browser to Supabase** — the client is untrusted and talks directly to Supabase Auth and PostgREST. Authentication and authorization must hold without relying on hidden frontend controls.
- **Authenticated users to privileged UI/actions** — the app exposes teacher/admin capabilities in the same frontend bundle. Role checks must not depend on insecure client-only identities or defaults.
- **Rich text / imported content to DOM rendering** — lesson and activity fields cross from user-controlled HTML into `dangerouslySetInnerHTML` sinks. This boundary requires strict sanitization or safe rendering.
- **Production code to dev-only/backward-compatibility paths** — demo mode, local auth fallback, and `.migration-backup/` artifacts exist in the repo. These should be treated as out of scope unless clearly reachable in the shipped production app.
- **School-to-school data isolation inside shared Supabase tables** — multiple schools use the same deployment, so lesson data, planning records, branding, and curriculum settings must be partitioned by a trustworthy tenant identifier rather than generic class names or singleton keys.
- **Browser to third-party export providers** — PDF generation/storage providers are outside the trust boundary. Provider credentials must stay server-side because every browser user is untrusted.

## Scan Anchors

- **Primary production entry point:** `artifacts/ccd/src`
- **Highest-risk areas:** `artifacts/ccd/src/contexts/AuthContext.tsx`, `artifacts/ccd/src/config/api.ts`, export/share flows in `artifacts/ccd/src/components/LessonPrintModal.tsx` and `artifacts/ccd/src/components/LessonPlannerCalendar.tsx`, lesson/activity rich-text components under `artifacts/ccd/src/components/`
- **Public surface:** login, preview/demo entry points, password-reset page
- **Authenticated/admin surface:** settings, user-management affordances, lesson/activity creation and editing, direct Supabase queries from `config/api.ts`, and export/share actions that invoke PDF generation
- **Usually ignore unless reachability changes:** `.migration-backup/`, mock/demo-only helpers, and `artifacts/api-server` beyond its current health endpoint

## Threat Categories

### Spoofing

The application must authenticate users through Supabase Auth in production and must not accept embedded fallback credentials, browser-stored pseudo-tokens, or legacy local identities as proof of identity. Any alternative sign-in path that works when a deployment flag is omitted is effectively a backdoor because the browser bundle is public.

### Tampering

Teachers and administrators can author rich lesson and activity content, import formatted text, and update records directly from the frontend. User-controlled content must be validated and sanitized before it can be persisted or rendered, otherwise an attacker can turn ordinary content edits into script execution in other users’ browsers. Separately, curriculum settings and planning data must be bound to the correct school/tenant; using shared class names or whole-table rewrites for mutable data turns a legitimate settings change by one school into unauthorized tampering against another.

### Information Disclosure

The frontend issues broad `select('*')` queries directly to Supabase tables and assumes RLS will enforce scoping. Production deployments must ensure no sensitive table can be read beyond the caller’s authorized scope, and the client must avoid treating unrestricted reads as safe merely because they originate from authenticated UI flows. Tenant isolation must also be explicit in the application data model: if lesson plans or class data are addressed only by generic labels such as `LKG` or `Year 1`, one school can read another school’s data during normal use.

### Elevation of Privilege

Administrative capabilities such as user management and privileged configuration must be derived from trusted server-side role data, not hardcoded identities or insecure fallback auth state. A production deployment must fail closed when auth configuration is missing rather than silently enabling a legacy local-admin path.

### Denial of Service

Export and sharing features rely on third-party PDF generation and storage services. Their provider credentials and billable operations must stay behind trusted server-side code; if the browser receives those credentials directly, any visitor can abuse quota, generate arbitrary documents, or exhaust the export capacity available to legitimate schools.
