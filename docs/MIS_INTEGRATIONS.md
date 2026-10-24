# School Systems & MIS Integration

Org-scoped framework for connecting school MIS / hub systems to Rhythmstix apps.
**Nothing is live** until official docs, commercial terms, provider approval, school
authorisation, data-protection, permitted categories, and test-data checks all pass.

## Settings UI

New Settings section **School systems** (`/settings/integrations`):

- Amber “Nothing is connected yet” notice
- Provider catalogue (9 providers, all **Unverified**)
- Request integration workflow (local record only — no live connection)
- Disabled configuration until approved
- Per-app data table
- Six-step approval checklist
- Year-group mapping review (example / preview only) with
  **Match** / **Rename to MIS name** / **Keep existing**
- Manual fallback link to **My classes**

Design mockup: `design-previews/school-systems/index.html`

## Per-app data

| App | Receives | Internal scopes |
| --- | --- | --- |
| CCDesigner | Year groups only | `year_groups.read` |
| Assessify | Pupils, classes, teacher assignments | `pupils.read`, `classes.read` |
| PeriFeedback | Pupils, lesson assignments, restricted parent contacts | `pupils.read`, `lesson_assignments.read`, `parent_contacts.read` |
| PeriPlanner | Pupils, timetables, activities/clubs | `pupils.read`, `timetables.read`, `activities.read` |

CCDesigner **never** receives pupil names/IDs, records, parents, class memberships,
attendance, medical or safeguarding data. Enforced in application code and Supabase
RLS / triggers (`supabase/migrations/20261024_mis_integrations.sql`).

## Providers (all UNVERIFIED)

Wonde (recommended central hub), iSAMS, SIMS, Arbor, Bromcom, Engage, WCBS,
SchoolBase, SOCS (co-curricular — may need a separate integration).

### Wonde research (public docs only)

- Docs: https://docs.wonde.com/docs/api/sync/
- Year groups: `GET /v1.0/schools/{school_id}/groups` with `type=YEAR`
- Auth: Bearer token (not implemented — pending commercial / provider approval)
- No endpoints, credentials, or connected states are invented in the product UI

## Year-group sync (planned behaviour)

1. Provider returns year/phase groups only.
2. Admin reviews mappings (Match / Rename to MIS name / Keep existing).
3. Accepted mappings update local year-group labels/structure.
4. Manual editor in **My classes** remains for schools without an MIS.
5. Curricula stay linked to year-group ids — never overwritten.

## Implemented vs planned

**Implemented now:** Settings section, catalogue, request workflow (local),
org-level mapping preview UI, per-app permission table, shared scope architecture,
activation checklist UI, secure config placeholders (disabled), manual fallback,
DB migration + RLS (not applied to live DB by this agent).

**Left pending:** real provider auth, live sync, field mappings, automated pupil
imports, SOCS scheduling, last-sync timestamps (only when genuinely connected).

## Recommended first integration

**Wonde** — central hub covering many MIS systems with one connection once
external approval is in place.

## DB security

Migrations (not applied to live DB by this agent):

- `supabase/migrations/20261024205000_mis_integrations.sql`
- `supabase/migrations/20261024210000_mis_integrations_super_admin_scope.sql` (after `20261024200000`)

- `mis_user_in_org` / `mis_user_can_manage_org` use the caller’s own `profiles.organisation_id` only (never `school_or_org`, never `current_user_is_full_user_admin()` which is true for school `role=admin`). Platform operators use `is_super_admin()`.
- `commercial_terms_confirmed` and `provider_approval_confirmed` gates: `is_super_admin()` or `service_role` only.
- Config placeholders in `mis_org_connection_secrets`: `is_super_admin()` only.

SQL tests: `supabase/tests/mis_integrations_security.sql` (includes school-admin repro).
