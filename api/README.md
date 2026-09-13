# Vercel serverless API (`/api`)

Production routes for CCDesigner. Prefer these over inventing a second database.

## Auth / users

| Route | Method | Auth | Notes |
|-------|--------|------|-------|
| `/api/create-user` | POST | Admin JWT | Create or invite user (service role) |
| `/api/resend-invite` | POST | Admin JWT | Resend invite email |
| `/api/register` | POST | Public + rate limit | Self-registration + consent |
| `/api/users/anonymise` | POST | Admin JWT | GDPR-style anonymise; protects last admin |

## Downloads

| Route | Method | Auth | Notes |
|-------|--------|------|-------|
| `/api/resources/:resourceId/download` | GET | User JWT (header or `?access_token=`) | Record event → 302 allow-listed URL |
| `/api/downloads/mine` | GET | User JWT | My download history |
| `/api/downloads/analytics` | GET | Admin / org analytics | Filters + UK timezone |
| `/api/downloads/export` | GET | Admin / org analytics | CSV or XLSX; formula injection protected |

## Shared modules

- `_authShared.js` — JWT verify, profiles, rate limit, IP hash, audit log
- `_downloadShared.js` — allow-list, geo, CSV helpers
- `_emailTemplates.js` — branded HTML/text + Resend send

See `docs/DEPLOY_USER_MGMT_DOWNLOADS.md` for env vars and SQL migration.
