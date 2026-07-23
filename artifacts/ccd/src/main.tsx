import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { isDemoModeActive } from './utils/demoMode';
import { seedDemoData } from './utils/demoSeed';
import { applyFeatureDemoFilmClass } from './utils/featureDemoFilm';

// Feature-demo film mode (?ccd-feature-demo=1) — hide notice/disclaimer chrome.
applyFeatureDemoFilmClass();

// In development, unregister any service workers that may have been installed
// from a previous Vercel/PWA deploy so HMR is not intercepted by stale caches.
// In production we leave service workers alone so the app's offline/PWA
// behavior (manifest.json + service-worker.js) keeps working for users who
// have installed the PWA. Gating this to DEV fixes a regression where the
// previous unconditional unregister disabled offline mode in production.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  }).catch(() => {
    /* best-effort cleanup */
  });
}

// StrictMode intentionally double-mounts components in development to find bugs.
// This causes duplicate logs. You can disable it to reduce console noise.
// Re-enable periodically to check for side effects.
const ENABLE_STRICT_MODE = false; // Set to true to enable double-mounting checks

async function boot() {
  // In Preview/Demo mode, make sure the snapshot content is seeded into
  // browser storage before the app (and its contexts) mount. Seeding is
  // idempotent per session, so this is a no-op when the login/homepage
  // button already seeded before navigating.
  if (isDemoModeActive()) {
    await seedDemoData();
  }

  createRoot(document.getElementById('root')!).render(
    ENABLE_STRICT_MODE ? (
      <StrictMode>
        <App />
      </StrictMode>
    ) : (
      <App />
    )
  );
}

void boot();
