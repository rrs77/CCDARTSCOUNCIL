# One-Page Plan: Funding + Unified Platform (CCD + Assessify)

## Vision
**One platform:** curriculum planning, lesson/activity library, selling content, and AI-powered assessment. For training providers, schools, and course creators in any subject.

---

## Part 1: Funding

| Step | Action | Timeline |
|------|--------|----------|
| **1. Scope the ask** | Define "next stage" in one sentence and a number (e.g. "£10k to merge CCD + Assessify and run one pilot"). List: merge work, 1–2 must-have features, 3-month runway or contractor cost. | Week 1 |
| **2. One-pager for funders** | Single page: problem (planning + assessment fragmented), solution (one app), traction (CCD built, Assessify exists), ask (£X for Y), what backers get (early licence, discount, or equity if angel). | Week 1 |
| **3. Crowdfund / pre-sell** | Launch small campaign (Kickstarter, Indiegogo, or own page): target £5k–£15k. Rewards = discounted annual licence or "founder" lifetime rate. Share with education/training contacts first. | Weeks 2–6 |
| **4. Customer-funder** | Pitch one serious prospect (drama provider, trust, training org): "Pre-pay 1–2 years licence and we prioritise your needs + integrate assessment." Use cash to fund merge. | Ongoing |
| **5. Angel / grant** | If network has HNW or edtech angels: send one-pager + 5-min demo video. For grants (Innovate UK, Nesta): frame as "pilot for planning + assessment in [sector]." | Weeks 2–8 |

**Target:** £8k–£15k to pay for merge + 2–3 months focused build or contractor.

---

## Part 2: Combine CCD + Assessify into One App

| Phase | What | Outcome |
|-------|------|--------|
| **A. Clarify Assessify** | Document how Assessify works today: API, standalone app, data model (assessments, results, links to lessons/activities). Decide: embed in CCD front-end vs. shared backend + separate "Assessment" area. | Clear integration design |
| **B. Shared auth & users** | One login, one user/profile. CCD already has Supabase auth + profiles. Assessify users become same profiles; or link Assessify tenant to CCD org. | Single sign-on, one user list |
| **C. Link content** | Connect CCD lessons/activities to Assessify assessments (e.g. "Lesson 3" → "Assessment for Unit X"). Store in DB: lesson_id / activity_id ↔ assessment_id. | Teachers assign assessment to lesson/unit |
| **D. One shell** | Single app entry: dashboard or tabs for **Plan**, **Library** (lessons/activities), **Sell** (packs/subscriptions), **Assess** (Assessify UI or embedded). Reuse CCD nav; add "Assessment" section. | One URL, one product |
| **E. Data in one place** | If Assessify has its own DB, either: (1) migrate into Supabase with CCD, or (2) keep separate DB and API from CCD front-end. Prefer (1) long term for one codebase. | Single source of truth |
| **F. Branding** | CCD already has white-label (branding settings). Apply same to Assessment area so licence holders see one branded product. | One brand per customer |

**Order of work:** A → B → C → D (E as you go). Ship "Plan + Library + Sell" (current CCD) first, then add "Assess" as a new section that calls Assessify or merged assessment module.

---

## Success Metrics (post-funding)

- [ ] One login for planning, library, selling, and assessment
- [ ] At least one pilot customer using the combined product
- [ ] Clear pricing: "Planning + content selling + AI assessment" as one licence

---

## Next 7 Days

1. Write the one-sentence ask and total number.
2. List 10 people or orgs to contact (network, potential customer-funders, angels).
3. Document Assessify’s current form (codebase, API, or product) and how it could plug into CCD (one page).

*Last updated: 2026*
