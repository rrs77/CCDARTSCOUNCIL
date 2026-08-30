# CCDesigner – Licensing Model & Sales Section

## 1. White-label licensing model

### 1.1 Principles

- **Licensee** = organisation (e.g. We Teach Drama) that licenses the platform for its own teachers/trainees.
- **White-label** = branding (logo, colours, product name, footer) and optionally domain and curriculum are under the licensee’s control.
- **Data isolation** = each licensee’s data is separate (either by separate deployment or by tenant_id in a multi-tenant setup).

### 1.2 Licensing structure (recommended)

| Tier | Description | Typical use |
|------|-------------|-------------|
| **Pilot / Partner** | Fixed-term pilot (e.g. 6–12 months); dedicated instance; your support. | We Teach Drama and early partners. |
| **Organisation licence** | Annual (or monthly) licence; dedicated or shared instance; SLA and support as agreed. | Schools, MATs, training companies. |
| **Enterprise** | Custom terms, SLAs, SSO, data residency, dedicated success manager. | Large MATs, local authorities. |

**Deliverables per licence (suggested):**

1. **Instance**  
   - Dedicated: own URL (e.g. `app.weteachdrama.com` or `weteachdrama.ccdesigner.co.uk`), own Supabase project (and optional Vercel project).  
   - Shared: subdomain or path + tenant_id; one codebase, RLS by organisation.

2. **Branding**  
   - Login screen: logo, product name (e.g. “We Teach Drama – Lesson Planner”).  
   - Footer and PDFs: company name, copyright.  
   - Optional: primary/secondary colours, favicon.

3. **Curriculum**  
   - Pre-loaded or editable: custom objectives, areas, year groups to match their framework (drama, music, etc.).  
   - Optional: EYFS or other statutory frameworks if relevant.

4. **Activity bank**  
   - Empty, or seeded with your/their activities (by agreement).  
   - They can import and manage their own.

5. **Users**  
   - They create accounts (or you create initial admin).  
   - Roles: admin (branding, users), teacher (full access), viewer (read-only) – as per current app.

6. **Support & training**  
   - Documented in contract: email support, response time, onboarding/training (e.g. 1–2 sessions), help site or in-app guide.

### 1.3 Customisation framework (what licensees can change)

| Item | Where | Scope |
|------|--------|--------|
| Login title / product name | Settings → Admin → Branding | Text |
| Footer company name | Settings → Admin → Branding | Text |
| Logo | Settings / Branding | Image URL or upload |
| Theme colours | Settings (primary, secondary, accent) | Colours |
| Year groups / classes | Settings → Year Groups | Add/edit/delete bands and classes |
| Categories | Settings → Categories | Add/edit/delete, assign to year groups |
| Custom objectives | Settings → Custom Objectives | Areas, year groups, objectives |
| Resource link types | Settings → Resource Links | Labels, thumbnails, categories |
| Activity bank | Activity Library | Their activities only (in their instance) |
| Lessons & units | Lesson Library, Unit Viewer | Their data only |

**What stays with the platform (you):**

- Core product roadmap and feature set.  
- Security, backups, infrastructure (unless enterprise self-host).  
- Legal terms, privacy policy (you provide template; they may add their own).

### 1.4 Pricing model (suggested options)

- **Pilot:** Discounted or free for 6–12 months in return for feedback and case study.  
- **Per organisation:**  
  - **Flat annual fee** (e.g. £X/year per school or training org) – simple.  
  - **Per-seat** (e.g. £Y/teacher/year) – scales with size; requires user count or sync.  
  - **Tiered:** e.g. Starter (up to N teachers), Pro (unlimited teachers, extra support).  
- **One-off setup fee** for branding, curriculum setup, training (optional).  
- **Enterprise:** Quote-based; SSO, SLA, data residency, custom work.

*You can plug in actual numbers once you decide bands and positioning.*

---

## 2. Sales page / “How to license” section

Below is copy you can use on a **sales or “For organisations”** page (e.g. on the main site or a separate landing page).

---

### Headline

**License CCDesigner for your organisation**

Use the same lesson-planning platform that helps teachers build lessons from a reusable activity bank—with your branding, your curriculum, and your team.

---

### Who it’s for

- **Training providers** (e.g. drama, music, CPD)  
- **Schools and MATs**  
- **Curriculum or resource publishers** who want to offer planning tools to their customers  

---

### What you get

- **Your branding** – Logo, product name, and colours on login, in the app, and on exported PDFs.  
- **Your curriculum** – Custom objectives and frameworks (EYFS, exam boards, or your own) so teachers plan against the right standards.  
- **Your activity bank** – A shared library of activities that your team can reuse across lessons and year groups.  
- **Full lesson planning** – Build lessons from activities, organise by units and half-terms, create lesson stacks, and use a traditional lesson plan format when needed.  
- **Export and share** – PDF export with clickable links, and shareable links to lesson plans for colleagues and trainees.  
- **Calendar** – Schedule and assign lesson plans to dates with a week/month view.  

---

### How it works

1. **Agree terms** – We agree a licence (pilot or full) and support level.  
2. **Setup** – We configure your instance with your branding and, if needed, your curriculum structure.  
3. **Onboarding** – Your admins and teachers get access; we provide training and support as agreed.  
4. **Ongoing** – You manage users and content; we keep the platform secure and up to date.  

---

### Pilot with us

We’re piloting with a small number of organisations (including **We Teach Drama**) to refine the offering. If you’re a training provider or school group interested in licensing CCDesigner for your teachers or trainees, we’d like to hear from you.

**Contact:** [Your contact – e.g. email or form]

---

### Technical notes (for procurement or IT)

- **Hosting:** Vercel (frontend and serverless); Supabase (database and auth).  
- **Data:** Stored in UK/EU where applicable; isolated per licensee when using dedicated instances.  
- **Access:** Email/password; optional SSO/SAML in future for enterprise.  
- **Export:** Users can export data via in-app backup/restore.  
- **Uptime:** Target 99.5% or as per SLA for licensed tiers.  

*(Adjust hosting/region and SLA to match your actual setup.)*

---

## 3. We Teach Drama pilot – checklist

- [ ] **Instance:** Dedicated Supabase project + Vercel deployment (or subdomain) for We Teach Drama.  
- [ ] **Branding:** “We Teach Drama” (or agreed name) on login, footer, PDFs; logo and colours.  
- [ ] **Curriculum:** Drama-focused custom objectives/areas (and year groups if they use them).  
- [ ] **Users:** Create initial admin account; they invite their team.  
- [ ] **Contract:** Pilot duration, fee (if any), support, data ownership, and what happens at end of pilot.  
- [ ] **Training:** 1–2 onboarding sessions; link to in-app Help and any written guides.  
- [ ] **Feedback:** Regular check-ins to capture feature requests and pain points for roadmap and case study.  

---

*Next: [04_DEVELOPMENT_ROADMAP.md](./04_DEVELOPMENT_ROADMAP.md) for prioritised roadmap and high-value features.*
