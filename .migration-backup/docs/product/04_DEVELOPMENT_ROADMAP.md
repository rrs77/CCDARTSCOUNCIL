# CCDesigner – Development Roadmap

## 1. Roadmap overview

The roadmap is organised in **phases** so you can prioritise by business need (e.g. We Teach Drama pilot first, then broader licensing and scale).

---

## 2. Phase 1 – Pilot-ready (We Teach Drama)

**Goal:** Solid pilot with one licensee: dedicated instance, branding, and curriculum; no new product features required beyond current app.

| Item | Effort | Owner | Notes |
|------|--------|--------|--------|
| Document pilot setup (env, Supabase, Vercel, domain) | S | Dev | Runbook so second pilot is repeatable |
| Dedicated Supabase + Vercel for We Teach Drama | M | Dev | New project; env vars; optional custom domain |
| Pre-load branding (We Teach Drama name, logo, footer) | S | Dev / Ops | Or hand over to their admin |
| Custom objectives / curriculum for drama | S–M | Dev / Content | Areas and objectives that match their framework |
| Pilot contract (terms, support, data) | S | You | Legal/commercial |
| Onboarding and training sessions | S | You | 1–2 sessions; use existing Help guide |

---

## 3. Phase 2 – Licensing and operations

**Goal:** Repeatable licensing process, clear commercial offer, and basic “organisation” admin.

| Item | Effort | Notes |
|------|--------|--------|
| Sales/landing page (“License CCDesigner”) | S | Use [03_LICENSING_AND_SALES.md](./03_LICENSING_AND_SALES.md) copy |
| Pricing and packaging (tiers, pilot vs full) | S | Commercial decision; document in 03 |
| Licence agreement template | M | Legal; pilot vs annual |
| Setup runbook per new licensee (clone/env/branding) | M | Reduces time for 2nd, 3rd licensee |
| Optional: “Organisation” field in DB + RLS (if moving to Option B later) | M | Prep only if you plan shared multi-tenant later |
| Billing (e.g. Stripe) for paid licences | M | Invoices or self-serve subscription |

---

## 4. Phase 3 – Product enhancements (high value)

**Goal:** Features that increase retention and appeal to schools and training providers.

| Feature | Value | Effort | Notes |
|--------|--------|--------|--------|
| **Calendar improvements** | High | M | Recurring events; clearer “plan per date”; optional sync (e.g. iCal export) |
| **SSO / SAML** | High (schools) | L | Many schools require it; consider Auth0, Supabase Enterprise, or custom |
| **Templates and sharing** | Medium | M | Share lesson/unit templates between teachers or orgs; “copy from template library” |
| **Mobile-friendly refinements** | Medium | S–M | PWA already; improve touch and layout on small screens |
| **Audit log (who changed what)** | Medium (compliance) | M | Log key actions (create/edit lesson, export, user changes) |
| **Structured onboarding** | Medium | S | First-login wizard or checklist (e.g. “Add your first activity”) |
| **In-app notifications** | Medium | S–M | E.g. “Your colleague shared a lesson with you” (if sharing is added) |

---

## 5. Phase 4 – Scale and enterprise

**Goal:** Multi-tenant option, larger deployments, and enterprise expectations.

| Feature | Value | Effort | Notes |
|--------|--------|--------|--------|
| **Multi-tenant (single deployment)** | High (scale) | L | organisation_id, RLS, subdomain or org selector |
| **Org-level admin role** | High | M | Admin sees only their org’s users and data |
| **Subscription and usage metering** | High | M | Per-seat or tiered; Stripe + usage tables |
| **Data export for licensees** | Medium | S–M | Self-serve “export all my data” (GDPR and offboarding) |
| **SLA and status page** | Medium | S | Uptime target; public status page |
| **WCAG 2.1 AA** | Medium (tenders) | M | If targeting public sector |
| **Self-hosted / on-prem option** | Low (niche) | L | Only if required by large customers |

---

## 6. Future high-value features (ideas)

- **Collaboration:** Shared editing, comments, or “share lesson with colleague” with permissions.  
- **Integrations:** Google Classroom, MIS (e.g. Arbor, SIMS), or LTI for VLEs.  
- **Reporting:** Simple dashboards (e.g. “lessons created this term”, “most used activities”).  
- **Curriculum mapping:** “Coverage” view (which objectives are covered across the year).  
- **AI assist:** Suggest activities for a lesson outcome or topic (experimental).  
- **Native app:** If PWA is not enough for “on the go” planning.  
- **Marketplace:** Optional “activity packs” or templates that orgs can buy or share.  

---

## 7. How to use this roadmap

- **Pilot:** Focus on Phase 1; only add Phase 2 items that unblock the first contract (e.g. a simple licence template).  
- **After pilot:** Phase 2 (sales, runbooks, billing) and selected Phase 3 items based on We Teach Drama feedback.  
- **Scale:** Phase 4 when you have several licensees and need multi-tenant or enterprise features.  

Revisit and reprioritise quarterly; keep [01_PRODUCT_SPEC_AND_FEATURES.md](./01_PRODUCT_SPEC_AND_FEATURES.md) and this file in sync when you add or drop features.

---

*Next: [05_CODEBASE_ANALYSIS_GUIDE.md](./05_CODEBASE_ANALYSIS_GUIDE.md) for how to analyse the Cursor project and document implemented features.*
