# CCDesigner – Architecture & Missing Features Analysis

## 1. Software architecture overview

### 1.1 High-level stack

| Layer | Technology | Purpose |
|-------|------------|--------|
| Frontend | React 18, Vite, TypeScript | SPA, build, types |
| UI | Tailwind CSS, Lucide icons, react-hot-toast | Styling, components, notifications |
| State | React context (Auth, Data, Settings) | Auth, lesson/activity data, user/school settings |
| Backend | Supabase (PostgreSQL, Auth, Storage optional) | Data, auth, RLS |
| PDF | PDFBolt API + Vercel serverless (generate-pdf) | Generate PDFs; upload to Vercel Blob for share links |
| Hosting | Vercel | App + serverless API + Blob storage |
| Email | Resend (via Supabase SMTP) | Password reset, verification |

### 1.2 Frontend structure

```
src/
├── App.tsx, main.tsx          # Entry, providers, reset-password route
├── components/                 # UI (Dashboard, UnitViewer, LessonLibrary, ActivityLibrary, etc.)
├── contexts/                   # AuthContext, DataContext, SettingsContextNew
├── config/                     # supabase.ts, api.ts, customObjectivesApi, lessonStacksApi, activityStacksApi
├── hooks/                      # useShareLesson, useShareTimetable, useLessonStacks, useAuth, useIsViewOnly
├── types/                      # auth, customObjectives
├── utils/                      # pdfApi, shareLesson, logger, PWA, etc.
api/
├── generate-pdf.js             # Vercel serverless: HTML → PDF (PDFBolt), upload to Blob or return blob
```

- **No React Router:** Single app; Dashboard uses tabs (Unit Viewer, Lesson Library, Lesson Builder, Activity Library, Calendar).
- **Data flow:** DataContext loads/saves lessons, half-terms, activities (Supabase + localStorage fallback). SettingsContextNew handles year groups, categories, branding. AuthContext handles login and profile.

### 1.3 Data model (Supabase tables, from codebase)

| Table | Purpose |
|-------|--------|
| activities | Activity bank (name, description, category, time, links, etc.) |
| lessons | Lesson data per sheet + academic_year (composite key); JSONB `data` for lesson content |
| lesson_plans | User-created lesson plan records (e.g. calendar-linked) |
| half_terms | Half-term definitions and lesson lists per sheet + academic_year |
| year_groups | Class/year group list (e.g. for dropdown) |
| custom_categories | Categories + optional year_group assignments |
| category_groups | Group names for categories |
| eyfs_statements | EYFS curriculum statements |
| custom_objectives, custom_objective_areas, custom_objective_year_groups | Custom curriculum framework |
| activity_custom_objectives | Link activities to objectives |
| lesson_stacks, activity_stacks | Stacks (grouped lessons/activities) |
| timetable_classes | Timetable/class data |
| branding_settings | White-label branding (login title, footer, etc.) |
| profiles | User profile (role, display_name, permissions) |

RLS (Row Level Security) is used on lessons, lesson_plans, activities, etc., with policies for `auth.uid()` and optional `user_id` for multi-user isolation.

### 1.4 Suggested architecture for multi-tenant licensing

To support **multiple organisations** (e.g. Rhythmstix, We Teach Drama) with optional white-label:

**Option A – One project per licensee (recommended for pilot)**  
- Separate Supabase project (and optionally separate Vercel deployment) per org.  
- Full isolation; branding and env vars (e.g. `VITE_SUPABASE_URL`) set per deployment.  
- Easiest to reason about and to comply with data/residency per client.  
- Trade-off: more deployments and env management.

**Option B – Single project, tenant_id + RLS**  
- Add `organisation_id` (or `tenant_id`) to key tables (activities, lessons, profiles, branding_settings).  
- RLS policies restrict rows by `organisation_id` (e.g. from `profiles.organisation_id` or JWT claim).  
- One app URL; org chosen at login or by subdomain (e.g. `weteachdrama.ccdesigner.co.uk`).  
- Branding and “current org” driven by tenant_id; more code and migration work, single codebase.

**Recommendation for We Teach Drama pilot:** Start with **Option A** (dedicated instance) for simplicity and clear boundaries; document the steps so it’s repeatable for future licensees. Option B can be a later “multi-tenant SaaS” evolution.

---

## 2. Missing product details to document

These are not necessarily missing from the app, but should be written down for consistency, support, and licensing.

| Area | What to document |
|------|-------------------|
| **User roles** | Exact list of roles (e.g. admin, superuser, teacher, viewer) and what each can do (edit lessons, manage users, change branding, etc.). |
| **Data ownership** | Who “owns” data when an org leaves (export, retention, deletion). |
| **Backup/restore** | How often Supabase is backed up; how orgs can export their data (e.g. DataSourceSettings export). |
| **Browser support** | Minimum browsers (e.g. Chrome, Safari, Edge last 2 versions). |
| **Limits** | Max activities, lessons, users per org (if any); Blob/PDF storage limits. |
| **Calendar** | What “calendar” does today (assign plans to dates, week/month view, PDF export) vs planned (recurring, sync, reminders). |
| **Offline** | Whether the app is online-only or has any offline/cache behaviour. |
| **Accessibility** | Any WCAG target and known gaps. |
| **Security** | Auth method, password policy, optional 2FA later; how RLS is used. |

---

## 3. Missing features analysis (gaps vs ideal)

| Gap | Priority | Notes |
|-----|----------|--------|
| **Calendar “full” scheduling** | Medium | No recurring events, no sync to Google/Outlook; calendar is view + date-based plan assignment. Document as “current” and roadmap as “enhanced calendar”. |
| **SSO / SAML** | Medium (for schools) | Many schools expect SSO; not implemented. Add to roadmap if targeting institutional sales. |
| **Multi-tenant in one deployment** | Low for pilot | Option A (one project per org) avoids this for We Teach Drama. |
| **Organisation-level admin** | Medium | “Org admin” who can manage users and branding for their org only (without seeing other orgs). Depends on Option B. |
| **Formal accessibility** | Medium | No stated WCAG level; needed if selling into public sector or tenders. |
| **Offline-first** | Low | Current behaviour is online with cache; full offline sync is a larger project. |
| **Native mobile app** | Low | PWA covers many use cases; native app can follow if required. |
| **Audit log** | Low | No “who changed what when” for compliance; can be added later. |
| **Billing/subscription in app** | Medium | For SaaS, need subscription/billing (Stripe, etc.) and possibly usage metering. |
| **In-app licensing/entitlements** | Medium | Feature flags or “tiers” (e.g. Activity Library vs full Calendar) if you offer multiple plans. |

---

## 4. Recommended documentation structure

Keep product and licensing docs in one place; keep technical and runbooks separate.

```
docs/
├── product/                    # Product & commercial (this folder)
│   ├── 01_PRODUCT_SPEC_AND_FEATURES.md
│   ├── 02_ARCHITECTURE_AND_MISSING_FEATURES.md  # this file
│   ├── 03_LICENSING_AND_SALES.md
│   ├── 04_DEVELOPMENT_ROADMAP.md
│   └── 05_CODEBASE_ANALYSIS_GUIDE.md
├── operations/                 # Optional: runbooks, deployment
│   └── DEPLOYMENT_AND_ENV.md
├── existing technical docs     # e.g. SUPABASE_RESEND_SMTP.md, LESSON_LIBRARY_EMPTY_AFTER_LOGIN.md
└── README.md                   # Link to docs/product and key runbooks
```

- **Sales and partners:** Use `01` and `03` (plus a one-pager or web page derived from them).  
- **Development:** Use `02`, `04`, and `05`.  
- **Support:** Use `01` (feature list) and operations docs.

---

*Next: [03_LICENSING_AND_SALES.md](./03_LICENSING_AND_SALES.md) for white-label licensing and sales section.*
