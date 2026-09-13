# Privacy notice — download tracking (DRAFT FOR LEGAL REVIEW)

**Status:** Draft only. Do not treat as final legal advice. Flag for solicitor / DPO review before production launch in the UK.

## Who we are

Creative Curriculum Designer (“CCDesigner”) is operated in connection with Rhythmstix. Contact: hello@rhythmstix.co.uk (update as required).

## What we collect when you download a resource

When you sign in and download a protected learning resource (for example Jazz North PDFs):

- Your user account identifier and email (already held for your account)
- Resource identifier and title
- Approximate location derived from IP (country / region / city), when available
- A **hashed, truncated** form of your IP address (not the full IP)
- Browser user-agent (truncated)
- Timestamp of the download (stored in UTC; shown in Europe/London in the app)

We do **not** put raw DreamHost or third-party file URLs on public buttons. Downloads go through our tracking endpoint, which then redirects to an allow-listed host (e.g. www.rhythmstix.co.uk or Supabase Storage).

## Why we process this (lawful basis)

- **Contract / legitimate interests:** to deliver resources you requested, prevent abuse, understand usage for partner reporting, and improve the service.
- **Consent:** marketing emails are optional and separate (`marketing_consent` on your profile).

## Retention

- Detailed `download_events` are retained for up to **24 months**, then aggregated or deleted unless a longer period is required for security investigations.
- Account profile data is retained while your account is active; anonymisation is available on request via administrators (UK GDPR erasure-style).

## Your rights

Under UK GDPR you may request access, rectification, erasure (anonymisation), restriction, and objection. Contact the address above. You may also complain to the ICO (ico.org.uk).

## Sharing

Download analytics may be visible to CCDesigner administrators and, where configured, to an **Organisation** role scoped to your organisation (e.g. Jazz North). We do not sell personal data.

## Cookies / auth

Sign-in uses Supabase Auth session storage (local or session storage depending on “stay signed in”).

---

**Legal review checklist:** lawful basis wording, retention period, ICO contact, controller/processor roles with Jazz North / Rhythmstix, DPIA if high-risk profiling is added later.
