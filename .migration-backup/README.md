lessonviewergit

## Deployment

Deploy via **GitHub** only: push to your GitHub repo. The app is configured for **Vercel** (`vercel.json`). Connect the repo in [Vercel](https://vercel.com) and deployments run on push. Netlify is not used.

## Clerk Authentication

This app uses [Clerk](https://clerk.com) for authentication with email/password, email verification, and password reset.

### Setup

1. Create an app at [Clerk Dashboard](https://dashboard.clerk.com).
2. Go to **Configure** → **Email, Phone, Username**:
   - Enable **Email address**
   - Enable **Password**
   - Turn on **Require verification** for email
   - Ensure **Forgot password** is enabled (default when email/password is on)
3. Copy your **Publishable Key** from **API Keys** to `VITE_CLERK_PUBLISHABLE_KEY` in `.env`.

### Vercel Environment Variables

In Vercel project settings → **Settings** → **Environment Variables**:

| Name | Value |
|------|-------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Your Clerk Publishable Key (from Clerk Dashboard → API Keys) |

Redeploy after adding the variable.

### Clerk Allowed Origins

In Clerk Dashboard → **Configure** → **Paths** (or **Settings** → **Paths**):

- Add your production URL: `https://your-app.vercel.app`
- Add preview pattern: `https://*-your-team.vercel.app` (adjust to your Vercel project)
- Add local dev: `http://localhost:5173`

The "Forgot password?" link appears on the sign-in page when Email + Password is enabled. Users receive a reset link by email.
