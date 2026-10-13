# Partner Hubs redesign: Stage 3 report

Branch: `design/partner-hubs-uk-map` (Vercel preview only; `main` and the live app are unchanged).

## What's live on the preview

- The redesigned Partner Hubs page is on by default on this branch. Add `?hubs=classic` to any URL, or set `VITE_PARTNER_HUBS=classic` on a deployment, to show the previous page instead.
- Zoomable UK map (UK → nation → region → hub → local area), list and search routes to the same pages, deep links that survive back/reload.
- Hub and area pages are one shared template. Every hub, service, area and resource comes from the database (or the identical bundled seed for demo visitors); nothing is hardcoded per hub in the presentation.
- Key Stage filter, with a one-tap "For {current class} · {phase}" option based on the class the teacher has open.
- Mobile bottom sheet for the selected area (390px), side panel on desktop.
- Locked resources (organisation access code or provider subscription): the file location is only released by the server after an access check. Teachers enter a code once; it grants access for the organisation's chosen period.
- "Manage hub" for hub staff: edit short name, website, about and contact as a draft; submit for approval; publishers approve or return with a note; revision history; contributor reach; access-code management.
- Aptos typeface where installed (Microsoft 365 schools), falling back to Inter.

## Database changes (applied to the shared Supabase, additive only)

| Migration | Adds |
| --- | --- |
| `20261013120000_partner_directory.sql` | Tables `music_hubs`, `music_hub_services`, `music_hub_areas`, `music_hub_directory_drafts`, `music_hub_directory_revisions`, `resource_scopes`, `resource_private_locations`, `organisation_access_codes`, `organisation_access_grants`, `resource_engagement_events`; new nullable/defaulted columns on `resources` (`access_level`, `contributor_name`, `licence`, `source_url`, `resource_version`); functions `music_hub_role`, `music_hub_has_role`, `review_music_hub_draft`, `resource_engagement_summary`. |
| `20261013120100_partner_directory_seed.sql` | 43 hubs, their services, 361 local areas, the EMS organisation row (if missing) and 3 EMS resources scoped to Greater Essex. Every insert is `ON CONFLICT DO NOTHING`. |

No existing table, column, policy or row was dropped, altered, truncated or deleted. Existing RLS is untouched. New tables all have RLS on:

- Teachers can read the published directory and log or read only their own engagement events.
- Editors can only create and edit their own drafts. Only a publisher (not the author, unless a super admin) can approve, and approval can only change whitelisted fields.
- Locked file locations are readable by the server only. Access-code hashes are never sent to the browser.
- Contributor reach is aggregated, and any group of fewer than 3 teachers is hidden.

Verified with `supabase/tests/partner_directory_rls.sql` (25 checks, run in a rolled-back transaction on a scratch Postgres).

## Sources

- Hub areas and lead organisations: Arts Council England, Music Hub Investment Programme published list.
- Boundaries: ONS Local Authority Districts, Regions and Countries (December 2024), Open Government Licence v3.
- Greater Essex about/contact text: Essex Music Service's published hub pages (source URLs stored with each record).

## Real vs demonstration

- Greater Essex is marked **Working example** (`relationship_status = 'demonstration'`): its content is real and published by Essex Music Service, but there's no confirmed contributor agreement yet.
- All other 42 hubs are **directory listings**: ACE name, area and lead organisation only, with honest empty states for resources.
- TBC lead organisations are left as published by ACE (to revisit later).

## Admin steps

**Give someone hub access.** Add a `hub_memberships` row for the hub's organisation (Greater Essex is `ems`). Roles: `hub_editor` (drafts), `hub_publisher` (approves), `hub_administrator` (also reach and access codes). Super admins have administrator rights on every hub.

```sql
insert into public.hub_memberships (organisation_id, user_id, role)
values ('ems', '<user uuid>', 'hub_publisher')
on conflict (organisation_id, user_id) do update set role = excluded.role, updated_at = now();
```

**Link a hub to an organisation** (required before anyone but a super admin can manage it): `update public.music_hubs set organisation_id = '<org id>' where id = '<hub id>';`

**Approve changes.** Open the hub page → Manage hub → Approvals → Approve and publish (or Return with note). Changes appear for everyone straight away.

**Create an access code.** Manage hub → Access codes → enter the school, number of days and optional maximum uses → Create code. Copy the code immediately; only its hash is stored. Codes can be turned off at any time.

**Lock a resource.** Set `resources.access_level` to `access_code` or `subscription`, and put the file in `resource_private_locations` (URL or storage bucket/path) rather than `download_url`.

**Switch back to the classic page.** Set `VITE_PARTNER_HUBS=classic` in the Vercel project and redeploy, or use `?hubs=classic` for a single visit.

## Tests run

- TypeScript and production build: clean.
- API unit tests: 101 passed (includes access decisions and code hashing).
- Browser journeys (Playwright): 22 passed, zero console or page errors. They cover the map, list and search routes, back/reload, keyboard, organisations filter, data-driven About/Contact, KS filter, legacy and classic links, and the mobile bottom sheet.
- Screenshots at 1440 / 1280 / 768 / 390 in `previews/`, with no horizontal overflow at any width.

## Known limitations

- The engagement schema includes `placed_in_lesson`, `assigned_to_planner` and `taught_reflected`, but only `viewed` and `added_to_library` are logged so far. Reach never claims a resource was taught.
- Area-level editing (local about/website per district) is supported by the database and approval flow, but the dialog edits hub-level details only.
- Demo visitors always see the bundled seed and can't use access codes or Manage hub.
- CPD & events has no data source yet and shows an empty state.
