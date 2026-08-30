# CCDesigner – Product Specification & Feature List

## 1. Clarifying questions (please complete)

Before locking the roadmap and licensing model, the following will help tailor documentation and prioritisation.

### Product & scope
- **Primary audience today:** Music/primary education only, or already including drama (e.g. We Teach Drama) and other subjects? This affects how we describe “curriculum” and “activity bank” in sales materials.
- **Multi-tenancy:** Is the plan one Supabase project per licensee (e.g. one for Rhythmstix, one for We Teach Drama), or a single shared project with tenant_id / organisation_id and RLS? This drives architecture and licensing.
- **Pilot with We Teach Drama:** Will they get a dedicated instance (separate URL + DB), or a shared app with their branding and data isolated by organisation? This affects the first licensing pilot.

### Licensing & commercial
- **Revenue model:** Subscription per organisation, one-off licence fee, per-seat pricing, or a mix? Any target price bands (e.g. £X/month per school)?
- **Contract terms:** Minimum term, cancellation, SLA (uptime/support)? Needed for the “sales section” and legal wording.
- **Support & onboarding:** Who provides training and support for licensees (you, or they self-serve)? Any tiered support (e.g. email vs dedicated)?

### Technical & compliance
- **Data residency:** Any requirement for UK/EU-only data (e.g. Supabase region, Blob storage)?
- **Integrations:** Any must-have integrations in the next 12 months (e.g. Google Classroom, MIS, SSO/SAML)?
- **Accessibility:** Any formal target (e.g. WCAG 2.1 AA) for public-sector or tender use?

### Roadmap priorities
- **Calendar:** How critical is “full” calendar (scheduling, assignments, sync) vs current week/month view and date-based plans?
- **Mobile:** PWA-only acceptable, or do you want a native app later?
- **Offline:** Should the app work offline with sync, or is “online-first with cache” enough for now?

---

## 2. Product overview (aligned with your description)

CCDesigner is a **lesson planning platform** built around a **reusable activity bank**. Teachers store activities (with notes, links, and resources), then **combine them into lesson plans** instead of rewriting from scratch. Plans can be **exported as PDFs** (with clickable links), **shared via links**, and organised by **units/half-terms** and **lesson stacks**. Curriculum objectives are **customisable** (EYFS, custom frameworks, exam boards). A **traditional lesson plan** format is also available for formal, section-based plans.

---

## 3. Complete feature list (from product description + codebase)

### 3.1 Authentication & users
| Feature | Status | Notes |
|--------|--------|--------|
| Email/password login (Supabase Auth) | ✅ | Optional via `VITE_USE_SUPABASE_AUTH` |
| Password reset (email link) | ✅ | Resend SMTP, reset-password route |
| Session persistence | ✅ | localStorage, auto-refresh |
| User profiles (Supabase) | ✅ | roles, display_name, permissions |
| View-only mode | ✅ | Restricts edits |
| Admin/superuser roles | ✅ | User management, branding, packs |
| (Future) SSO / SAML | ❌ | Not implemented |

### 3.2 Activity bank
| Feature | Status | Notes |
|--------|--------|--------|
| Create / edit / delete activities | ✅ | ActivityLibrary, ActivityCreator, ActivityDetailsModal |
| Activity fields: name, description, time, category, level, links (video, music, backing, resource, vocals, image, Canva) | ✅ | |
| Rich-text description | ✅ | RichTextEditor |
| Category list (customisable) | ✅ | Settings → Categories |
| Category groups | ✅ | Grouping of categories |
| Year-group / class assignment for activities | ✅ | custom_categories ↔ year_groups |
| Search and filter activities | ✅ | ActivityLibrary, ActivitySearchModal |
| Import activities (e.g. CSV/Excel) | ✅ | ActivityImporter, DataSourceSettings |
| Activity packs | ✅ | Admin → Manage Packs |
| Link resources with thumbnails and labels | ✅ | Settings → Resource links |

### 3.3 Lesson plans (activity-based)
| Feature | Status | Notes |
|--------|--------|--------|
| Build lesson from activity bank (drag-and-drop or picker) | ✅ | LessonLibrary, StandaloneLessonCreator, LessonPlanBuilder |
| Order activities within lesson | ✅ | categoryOrder, orderedActivities |
| Learning goals (EYFS or custom objectives) | ✅ | NestedStandardsBrowser, Custom Objectives |
| Lesson notes | ✅ | Per-lesson notes field |
| Custom header/footer per lesson | ✅ | PDF and share link |
| Duplicate lesson | ✅ | LessonLibrary |
| Trash and restore lessons | ✅ | LessonLibrary trash view |
| Copy lessons to another class | ✅ | ClassCopyModal |
| Academic year filter | ✅ | 2025-2026, 2026-2027 |

### 3.4 Curriculum objectives
| Feature | Status | Notes |
|--------|--------|--------|
| EYFS statements (stored, selectable) | ✅ | NestedStandardsBrowser, eyfs_statements |
| Custom objectives (areas, year groups, statements) | ✅ | CustomObjectivesAdmin, customObjectivesApi |
| Attach objectives to lessons | ✅ | Lesson builder, PDF export |
| Attach objectives to activities | ✅ | Activity custom objectives |

### 3.5 Units, half-terms & lesson stacks
| Feature | Status | Notes |
|--------|--------|--------|
| Half-terms (A1, A2, SP1, SP2, SM1, SM2) | ✅ | UnitViewer, HalfTermView, HalfTermCard |
| Assign lessons to half-terms | ✅ | AssignToHalfTermModal, updateHalfTerm |
| Lesson stacks (named groups of lessons) | ✅ | useLessonStacks, LessonStackBuilder, StackedLessonCard |
| Assign stacks to half-terms | ✅ | AssignStackToTermModal |
| Term-specific lesson numbering | ✅ | e.g. “Lesson 3” within Autumn 1 |
| Copy term to another class | ✅ | TermCopyModal |

### 3.6 Year groups / classes
| Feature | Status | Notes |
|--------|--------|--------|
| Configurable year groups (classes) | ✅ | Settings → Year Groups |
| Year-group bands (e.g. Year 1 → 1s, 1b, 1d) | ✅ | YearGroupBand |
| Switch current class/sheet | ✅ | Header dropdown |
| Per-class theme colours | ✅ | getThemeForClass |
| Data per class (lessons, half-terms) | ✅ | sheet_name / currentSheetInfo |

### 3.7 Export & sharing
| Feature | Status | Notes |
|--------|--------|--------|
| Export lesson plan as PDF (single or unit) | ✅ | LessonPrintModal, PDFBolt or Vercel API fallback |
| PDF with clickable resource links | ✅ | |
| Copy link (shareable URL to lesson PDF) | ✅ | useShareLesson, Vercel Blob |
| Share timetable as PDF/link | ✅ | useShareTimetable |
| Export calendar view as PDF | ✅ | LessonPlannerCalendar |

### 3.8 Traditional lesson plan format
| Feature | Status | Notes |
|--------|--------|--------|
| Structured sections (e.g. Learning outcome, Main activity, Plenary) | ✅ | LessonPlanBuilder, lesson plan details in modal |
| Editable templates / sections | ✅ | learningOutcome, successCriteria, introduction, mainActivity, plenary, vocabulary, keyQuestions, resources, differentiation, assessment |
| Resource thumbnails and custom links | ✅ | Settings → Resource links, LinkViewer |

### 3.9 Calendar
| Feature | Status | Notes |
|--------|--------|--------|
| Week/month calendar view | ✅ | LessonPlannerCalendar |
| Assign lesson plans to dates | ✅ | CalendarLessonAssignmentModal, TimeSlotLessonModal |
| Create plan from date | ✅ | handleCreateLessonPlan |
| Export calendar as PDF | ✅ | |
| (Future) Recurring events, sync to external calendar | ❌ | Not implemented |

### 3.10 Data & backup
| Feature | Status | Notes |
|--------|--------|--------|
| Supabase backend (activities, lessons, half-terms, settings, branding) | ✅ | api.ts, DataContext, SettingsContextNew |
| LocalStorage fallback / cache | ✅ | When Supabase unavailable or timeout |
| Backup / restore (e.g. Excel export/import) | ✅ | DataSourceSettings |
| Data source configuration UI | ✅ | DataSourceSettings |

### 3.11 Branding & white-label
| Feature | Status | Notes |
|--------|--------|--------|
| Login title / product name | ✅ | branding.loginTitle |
| Footer company name | ✅ | branding.footerCompanyName |
| Copyright year | ✅ | branding.footerCopyrightYear |
| Logo (e.g. school/organisation) | ✅ | settings.schoolLogo / branding |
| Primary/secondary/accent colours | ✅ | settings (theme) |
| Branding persisted in Supabase | ✅ | branding_settings table |
| (Future) Full white-label (domain, email, legal) | Partial | Structure in place; multi-tenant not yet |

### 3.12 Admin
| Feature | Status | Notes |
|--------|--------|--------|
| User management (list, edit, roles) | ✅ | UserManagement, EditUserModal (Supabase Auth + profiles) |
| Manage activity packs | ✅ | ActivityPacksAdmin |
| Branding settings | ✅ | UserSettings → Admin → Branding |
| View purchases | ✅ | ViewPurchasesModal (if used) |

### 3.13 UX & help
| Feature | Status | Notes |
|--------|--------|--------|
| In-app help guide | ✅ | HelpGuide (activity, lesson, unit, assign) |
| Walkthrough guide | ✅ | WalkthroughGuide |
| PWA install prompt | ✅ | PWAInstallPrompt, usePWAInstall |
| Responsive layout | ✅ | Tailwind, mobile-friendly tabs |

---

## 4. Document control

| Version | Date | Author | Changes |
|---------|------|--------|--------|
| 0.1 | 2026-03 | — | Initial spec and feature list from product description and codebase scan |

---

*Next: [02_ARCHITECTURE_AND_MISSING_FEATURES.md](./02_ARCHITECTURE_AND_MISSING_FEATURES.md) for architecture overview and missing-features analysis.*
