# Settings redesign audit

Full-page Settings (`/settings/...`) inside the Studio shell. Autosave with confirmation toasts. Plain teacher language; most-used sections first.

## Sections (teacher-facing)

| Section | URL | What it covers |
| --- | --- | --- |
| My classes | `/settings/classes` | Stages, add/rename/move classes |
| Activity folders | `/settings/folders` | Which folders each class sees in Activity Library |
| Learning objectives | `/settings/objectives` | Custom objectives admin |
| Preferences | `/settings/preferences` | School name, hover tips, resource labels |
| Downloads | `/settings/downloads` | My downloads (+ stats chip when allowed) |
| Users | `/settings/users` | Invite/manage school users (admin / school lead; visible in demo) |
| School tools | `/settings/school?panel=…` | Role-gated: hubs, branding, packs, system folders, backup |

## Control audit

| Setting | Status before | What we did | Verified |
| --- | --- | --- | --- |
| Open Settings (header gear) | Opened modal overlay | Navigates to `/settings/classes` full page; shell stays | Yes — screenshots; sidebar+header visible |
| Open Settings (More tools) | Event → modal | `onNavigate('settings')` → full page | Yes — `settings-from-more-tools.png` |
| Deep link Hub admin | `sessionStorage` + `/` then modal | `/settings/school?panel=hub-admin` | Code path updated (`PartnerHubPage`) |
| My classes list | Modal tab; mixed save | Page section; sections autosave to localStorage + cloud | Yes — UI; classes appear in header chip |
| Add / rename / move class | Worked; Save footer confusing | Immediate persist + toast language; no modal footer | Yes — chip lists LKG/UKG/Year… after Settings |
| Stage sections (EYFS/KS…) | Autosave + “Save Settings” copy | Autosave only; copy updated | Yes |
| Clear all class ticks on folders | Broken (only LKG/UKG/Reception keys) | Clears **all** dynamic class keys on every folder | Code fix |
| Folder ↔ class visibility | Mostly worked; modal | Same persistence; full page; plainer labels | Yes — Activity Library still class-filtered |
| Learning objectives | Modal “Objectives” / internal `admin` tab | Renamed section; embedded admin unchanged | Yes — screenshot |
| School name | In settings blob; **no UI** | Preferences field; autosave on blur | Yes — Preferences screenshot |
| Hover help for buttons | Immediate update under Resource Links | Preferences; toast on toggle | Yes |
| Activity resource labels | Temp + dual Save buttons | Autosave on change; toast on blur | Yes |
| My downloads | Modal tab | Downloads section | Yes — screenshot |
| Download analytics | Separate top tab | Chip inside Downloads when allowed | Role-gated |
| Users admin (list, invite, roles, packs, reset, suspend) | Buried under School tools → People; gated off in demo | Top-level **Users** section; searchable/sortable table; school/classes/status columns; CSV import/export; demo roster fallback | Yes — Users screenshot |
| Hub admin / branding / packs / system folders / data | Admin dropdown soup | Remain under School tools with chips | Role-gated |
| Header "Demo Visitor" | Synthetic demo name always shown | Account menu with real profile name/initials (never "Demo Visitor") | Yes — header screenshot |
| Dead “Resource Library / purchases” tab | Unreachable but still in bundle | Removed | N/A |
| Unused `general` tab type | Dead | Dropped from IA | N/A |
| Duplicate MyHubAdministration on My classes | Shown at bottom of classes | Removed from classes (kept under School tools) | Yes |
| Preview / view-only lock copy | “View-only mode…” alerts | Softened; no preview-mode lock copy | Demo teacher can edit |
| Header empty chip copy | “Settings → Year Groups” | “Settings → My classes”; Other classes surface when stages empty | Yes — chip populated |
| Timetable / Half-terms / Partner hubs as settings | Not real Settings controls | Preferences tip points to Planner / Half-terms / Partner Hubs | Yes — Preferences tip card |
| Refresh / browser back | Modal lost state | Real `/settings/...` URLs + `popstate` | Code + URL in screenshots |

## Screenshots

- `/opt/cursor/artifacts/screenshots/settings-classes.png`
- `/opt/cursor/artifacts/screenshots/settings-folders.png`
- `/opt/cursor/artifacts/screenshots/settings-objectives.png`
- `/opt/cursor/artifacts/screenshots/settings-preferences.png`
- `/opt/cursor/artifacts/screenshots/settings-preferences-1280.png`
- `/opt/cursor/artifacts/screenshots/settings-preferences-1440.png`
- `/opt/cursor/artifacts/screenshots/settings-users.png`
- `/opt/cursor/artifacts/screenshots/settings-downloads.png`
- `/opt/cursor/artifacts/screenshots/header-account-menu.png`
- `/opt/cursor/artifacts/screenshots/settings-from-more-tools.png`
- `/opt/cursor/artifacts/screenshots/settings-effect-class-chip.png`
- `/opt/cursor/artifacts/screenshots/settings-effect-activity-library.png`
- `/opt/cursor/artifacts/screenshots/settings-effect-preferences.png`

## Build

- `vite build` — pass
- `tsc` — no new Settings-related errors (pre-existing errors remain in unrelated files)
