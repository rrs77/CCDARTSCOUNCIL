# Bolt-ons entitlements

Catalogue gating for Explore / Assessify / PeriFeedback is **on-screen only** for now
(see commit `958a9cf`).

TODO: Do not ship any paid bolt-on feature without **server-side entitlements**
(authenticated checks that refuse unlock / API use when the org or user is not
entitled). Client-only hides are not sufficient.
