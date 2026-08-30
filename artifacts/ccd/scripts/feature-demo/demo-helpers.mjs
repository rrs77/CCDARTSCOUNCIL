/**
 * CCDesigner feature-demo helpers.
 *
 * SLIDE PALETTE (fixed 1920×1080 — NOT responsive):
 *   --bg-deep:   #05231e
 *   --bg-forest: #002D24
 *   --text:      #FFFFFF
 *   --accent:    #B6FF7E
 *
 * Type sizes are hard-coded px for video readability at normal playback size.
 */
import path from 'node:path';

export const VIEWPORT = { width: 1920, height: 1080 };
export const GATE_KEY = 'ccd-prototype-gate';
export const DEMO_MODE_KEY = 'ccd-demo-mode';
export const HERO_IMAGE_URL = 'http://127.0.0.1:5173/login/hero-arts.jpg?v=ages-3';

/** Brand lime — matches Logo.tsx LOGO_RING / attachment ring */
export const BRAND_LIME = '#B6FF7E';
export const BRAND_FOREST = '#002D24';

/** Global pacing — energetic holds are authored short; keep multiplier near 1. */
export const DEMO_PACE = 1;

/** Intro / title slides — long enough for Ken Burns (3.2s) to finish. */
export const INTRO_SLIDE_MS = 3100;

export const PALETTE = {
  bgDeep: '#05231e',
  bgForest: BRAND_FOREST,
  text: '#FFFFFF',
  accent: BRAND_LIME,
};

/**
 * Shared CCD lockup: circular mark + CCDesigner wordmark under it.
 * Matches LogoMark (white CCD, dark fill, lime ring #B6FF7E).
 */
export function brandLockupCss({ top = 40, left = 48, mark = 88, word = 22 } = {}) {
  return `
    .brand-lockup {
      position: absolute; top: ${top}px; left: ${left}px; z-index: 4;
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      width: ${Math.max(mark, 140)}px;
      opacity: 0; animation: brandLockupIn 0.7s ease 0.1s forwards;
      pointer-events: none;
    }
    .brand-lockup .brand-mark {
      width: ${mark}px; height: ${mark}px; border-radius: 50%;
      background: radial-gradient(circle at 50% 42%, #1a4038 0%, ${BRAND_FOREST} 55%, #001812 100%);
      border: 3px solid ${BRAND_LIME};
      box-shadow: 0 0 28px rgba(182,255,126,0.22);
      display: grid; place-items: center;
      font-family: "Source Sans 3", system-ui, sans-serif;
      font-size: ${Math.round(mark * 0.32)}px; font-weight: 800; color: #FFFFFF;
      letter-spacing: -0.04em;
    }
    .brand-lockup .brand-word {
      font-family: "Source Sans 3", system-ui, sans-serif;
      font-size: ${word}px; font-weight: 700; color: #FFFFFF;
      letter-spacing: -0.02em; line-height: 1; white-space: nowrap;
      text-shadow: 0 2px 12px rgba(0,0,0,0.45);
    }
    .brand-lockup .brand-word span { color: ${BRAND_LIME}; }
    @keyframes brandLockupIn { to { opacity: 1; } }
  `;
}

export function brandLockupHtml() {
  return `<div class="brand-lockup" aria-label="CCDesigner">
  <div class="brand-mark">CCD</div>
  <div class="brand-word">CC<span>Designer</span></div>
</div>`;
}

export function hold(page, ms) {
  return page.waitForTimeout(Math.max(30, Math.round(ms * DEMO_PACE)));
}

export async function dismissIfVisible(page, selectors) {
  for (const sel of selectors) {
    const loc = page.locator(sel).first();
    if (await loc.isVisible({ timeout: 600 }).catch(() => false)) {
      await loc.click({ timeout: 2000 }).catch(() => {});
      await hold(page, 300);
    }
  }
}

export async function ensureCursor(page) {
  await page
    .evaluate(() => {
      if (document.getElementById('ccd-demo-cursor')) return;
      const style = document.createElement('style');
      style.id = 'ccd-demo-cursor-style';
      // Standard arrow pointer (not a green dot). Tip sits at (x,y).
      // Subtle click ripple only — primary pointer must look like a normal cursor.
      style.textContent = `
        #ccd-demo-cursor {
          position: fixed; left: 0; top: 0; width: 28px; height: 28px;
          pointer-events: none; z-index: 2147483646;
          transform: translate(-120px, -120px);
          transition: transform 35ms linear;
        }
        #ccd-demo-cursor svg {
          display: block; width: 28px; height: 28px;
          filter: drop-shadow(0 1px 1px rgba(0,0,0,0.45));
        }
        #ccd-demo-cursor.down svg { transform: scale(0.92); transform-origin: 2px 2px; }
        #ccd-demo-ripple {
          position: fixed; left: 0; top: 0; width: 10px; height: 10px;
          margin-left: -5px; margin-top: -5px; border-radius: 50%;
          border: 2px solid rgba(0,0,0,0.35); background: rgba(0,0,0,0.08);
          pointer-events: none; z-index: 2147483645;
          opacity: 0; transform: translate(-120px, -120px) scale(0.4);
        }
        #ccd-demo-ripple.flash {
          animation: ccd-demo-ripple 320ms ease-out forwards;
        }
        @keyframes ccd-demo-ripple {
          0% { opacity: 0.55; transform: translate(var(--ccd-rx), var(--ccd-ry)) scale(0.35); }
          100% { opacity: 0; transform: translate(var(--ccd-rx), var(--ccd-ry)) scale(2.2); }
        }
        html.ccd-demo-recording, html.ccd-demo-recording * { cursor: none !important; }
      `;
      document.documentElement.appendChild(style);
      document.documentElement.classList.add('ccd-demo-recording');
      const cur = document.createElement('div');
      cur.id = 'ccd-demo-cursor';
      cur.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#ffffff"
            stroke="#111111"
            stroke-width="1.15"
            stroke-linejoin="round"
            d="M4.2 2.4 L4.2 19.6 L9.1 14.9 L12.8 22.3 L15.6 21 L12 13.8 L18.8 13.8 Z"
          />
        </svg>`;
      document.documentElement.appendChild(cur);
      const ripple = document.createElement('div');
      ripple.id = 'ccd-demo-ripple';
      document.documentElement.appendChild(ripple);
      window.__ccdMoveCursor = (x, y, down) => {
        const el = document.getElementById('ccd-demo-cursor');
        if (!el) return;
        el.style.transform = `translate(${x}px, ${y}px)`;
        const wasDown = el.classList.contains('down');
        el.classList.toggle('down', !!down);
        if (down && !wasDown) {
          const r = document.getElementById('ccd-demo-ripple');
          if (r) {
            r.classList.remove('flash');
            r.style.setProperty('--ccd-rx', `${x}px`);
            r.style.setProperty('--ccd-ry', `${y}px`);
            // reflow so animation restarts
            void r.offsetWidth;
            r.classList.add('flash');
          }
        }
      };
      window.addEventListener(
        'mousemove',
        (e) => window.__ccdMoveCursor?.(e.clientX, e.clientY, false),
        { passive: true },
      );
    })
    .catch(() => {});
}

export async function moveCursor(page, x, y, down = false) {
  await page
    .evaluate(({ x, y, down }) => window.__ccdMoveCursor?.(x, y, down), { x, y, down })
    .catch(() => {});
}

export async function setCaption(page, title, caption) {
  await ensureCursor(page);
  await page
    .evaluate(
      ({ title, caption }) => {
        let el = document.getElementById('ccd-demo-caption');
        if (!el) {
          el = document.createElement('div');
          el.id = 'ccd-demo-caption';
          el.style.cssText =
            'position:fixed;left:48px;right:48px;bottom:36px;z-index:2147483645;pointer-events:none;font-family:"Source Sans 3",system-ui,sans-serif;transition:opacity 280ms ease;';
          document.body.appendChild(el);
        }
        el.style.opacity = '0';
        el.innerHTML = `
          <div style="max-width:980px;margin:0 auto;background:rgba(5,35,30,0.94);color:#FFFFFF;border:1px solid rgba(182,255,126,0.55);border-radius:16px;padding:18px 24px;box-shadow:0 18px 44px rgba(0,0,0,0.35);">
            <div style="font-size:14px;letter-spacing:0.16em;text-transform:uppercase;color:#B6FF7E;font-weight:700;margin-bottom:6px;">CCDesigner · Feature demo</div>
            <div style="font-size:26px;font-weight:700;line-height:1.25;margin-bottom:4px;color:#FFFFFF;">${title}</div>
            <div style="font-size:18px;line-height:1.45;color:#FFFFFF;">${caption}</div>
          </div>`;
        requestAnimationFrame(() => {
          el.style.opacity = '1';
        });
      },
      { title, caption },
    )
    .catch(() => {});
}

export async function clearCaption(page) {
  await page
    .evaluate(() => {
      const el = document.getElementById('ccd-demo-caption');
      if (el) el.style.opacity = '0';
    })
    .catch(() => {});
}

/** Shared slide CSS — large fixed px for 1080p video readability + Ken Burns bg. */
function slideShellCss() {
  return `
    :root {
      --bg-deep: #05231e;
      --bg-forest: ${BRAND_FOREST};
      --text: #FFFFFF;
      --accent: ${BRAND_LIME};
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 1920px; height: 1080px; overflow: hidden;
      background: var(--bg-deep); color: var(--text);
      font-family: "Source Sans 3", system-ui, sans-serif;
    }
    .frame {
      width: 1920px; height: 1080px; position: relative; overflow: hidden;
      /* Clears absolute CCD lockup (mark + wordmark under circle). */
      padding: 190px 140px 110px;
      display: flex; flex-direction: column; justify-content: center;
    }
    .kb {
      position: absolute; inset: -10%;
      background:
        radial-gradient(ellipse 1200px 700px at 42% 28%, rgba(182,255,126,0.16), transparent 62%),
        linear-gradient(160deg, #05231e 0%, ${BRAND_FOREST} 52%, #05231e 100%);
      animation: kenBurns 3.2s ease-in-out forwards;
      z-index: 0;
    }
    .frame > *:not(.kb):not(.brand-lockup) { position: relative; z-index: 1; }
    ${brandLockupCss()}
    .eyebrow {
      font-size: 28px; letter-spacing: 0.18em; text-transform: uppercase;
      color: var(--accent); font-weight: 700; margin-bottom: 28px;
      opacity: 0; transform: translateY(14px);
      animation: rise 0.85s cubic-bezier(.2,.8,.2,1) 0.22s forwards;
    }
    .eyebrow::after {
      content: ""; display: block; width: 100px; height: 5px;
      background: var(--accent); margin-top: 18px;
    }
    h1 {
      font-family: "Playfair Display", Georgia, serif;
      font-size: 96px; line-height: 1.05; font-weight: 700; color: #FFFFFF;
      max-width: 1640px;
      text-shadow: 0 3px 28px rgba(0,0,0,0.4);
      opacity: 0; transform: translateY(20px);
      animation: rise 0.9s cubic-bezier(.2,.8,.2,1) 0.38s forwards;
    }
    h1.compact { font-size: 88px; }
    .body {
      margin-top: 36px;
      font-size: 40px; line-height: 1.32; color: #FFFFFF;
      max-width: 1400px; font-weight: 600;
      text-shadow: 0 2px 18px rgba(0,0,0,0.35);
      opacity: 0; transform: translateY(16px);
      animation: rise 0.9s cubic-bezier(.2,.8,.2,1) 0.52s forwards;
    }
    .pill {
      display: inline-block; margin-top: 44px; padding: 18px 28px;
      border-radius: 999px; border: 2px solid rgba(182,255,126,0.75);
      color: var(--accent); font-size: 24px; font-weight: 700;
      opacity: 0; animation: fadeIn 0.8s ease 0.8s forwards;
    }
    @keyframes rise { to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeIn { to { opacity: 1; } }
    @keyframes kenBurns {
      from { transform: scale(1) translate(0, 0); }
      to { transform: scale(1.09) translate(-1.4%, -0.8%); }
    }
  `;
}

export function slideHtml({ eyebrow, title, body, pill, compactTitle = false }) {
  const fonts =
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@600;700&display=swap';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<link href="${fonts}" rel="stylesheet" />
<style>${slideShellCss()}</style></head>
<body>
  <div class="frame">
    <div class="kb" aria-hidden="true"></div>
    ${brandLockupHtml()}
    ${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ''}
    <h1 class="${compactTitle ? 'compact' : ''}">${title}</h1>
    ${body ? `<p class="body">${body}</p>` : ''}
    ${pill ? `<div class="pill">${pill}</div>` : ''}
  </div>
</body></html>`;
}

/** Exact partner/funding disclaimer — large fixed-px type for 1920×1080 video. */
export const PARTNER_DISCLAIMER_TEXT =
  'Organisations shown are examples for demonstration only. Their inclusion does not imply endorsement, funding or partnership. All trademarks remain the property of their respective owners.';

export function partnerDisclaimerSlideHtml() {
  const fonts =
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@600;700&display=swap';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<link href="${fonts}" rel="stylesheet" />
<style>
  ${slideShellCss()}
  h1 { font-size: 72px; max-width: 1600px; }
  .body {
    margin-top: 40px;
    font-size: 42px; line-height: 1.38; color: #FFFFFF;
    max-width: 1560px; font-weight: 700;
  }
  .pill { font-size: 26px; margin-top: 48px; }
</style></head>
<body>
  <div class="frame">
    <div class="kb" aria-hidden="true"></div>
    ${brandLockupHtml()}
    <div class="eyebrow">For potential partners &amp; funding</div>
    <h1 class="compact">Demonstration only</h1>
    <p class="body">${PARTNER_DISCLAIMER_TEXT}</p>
    <div class="pill">Shown for potential partners and for funding</div>
  </div>
</body></html>`;
}

/**
 * Opening slide — hero arts photo + connection copy + CCD lockup.
 * Replaces the old centred tagline (erroneous "desuik" / wrong subtitle).
 */
export function logoIntroHtml(heroImageUrl = HERO_IMAGE_URL) {
  const fonts =
    'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0;700;1;500&family=Source+Sans+3:wght@600;700&display=swap';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<link href="${fonts}" rel="stylesheet" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1920px; height: 1080px; overflow: hidden; background: ${BRAND_FOREST}; }
  .stage { width: 1920px; height: 1080px; position: relative; overflow: hidden; }
  .photo {
    position: absolute; inset: -8%;
    background: ${BRAND_FOREST} url("${heroImageUrl}") center center / cover no-repeat;
    animation: kenBurns 3.2s ease-in-out forwards;
  }
  .veil {
    position: absolute; inset: 0;
    background:
      linear-gradient(90deg, rgba(0,45,36,0.88) 0%, rgba(0,45,36,0.55) 48%, rgba(0,45,36,0.72) 100%),
      linear-gradient(180deg, rgba(0,45,36,0.22) 0%, rgba(0,45,36,0.42) 45%, rgba(0,45,36,0.92) 100%);
  }
  ${brandLockupCss({ top: 44, left: 52, mark: 96, word: 24 })}
  .copy {
    position: relative; z-index: 1; height: 100%;
    padding: 160px 140px 120px; display: flex; flex-direction: column; justify-content: center;
    max-width: 1320px;
  }
  h1 {
    font-family: "Playfair Display", Georgia, serif;
    font-size: 88px; line-height: 1.06; font-weight: 700; color: #FFFFFF;
    text-shadow: 0 4px 32px rgba(0,0,0,0.5);
    opacity: 0; transform: translateY(18px);
    animation: rise 0.95s cubic-bezier(.2,.8,.2,1) 0.35s forwards;
  }
  h1 em { font-style: italic; font-weight: 500; color: ${BRAND_LIME}; }
  p {
    margin-top: 36px; font-family: "Source Sans 3", system-ui, sans-serif;
    font-size: 36px; line-height: 1.35; font-weight: 600; color: #FFFFFF;
    max-width: 1080px; text-shadow: 0 2px 20px rgba(0,0,0,0.45);
    opacity: 0; transform: translateY(14px);
    animation: rise 0.95s cubic-bezier(.2,.8,.2,1) 0.55s forwards;
  }
  .line {
    width: 0; height: 4px; margin-top: 40px;
    background: linear-gradient(90deg, ${BRAND_LIME}, transparent);
    animation: lineGrow 0.9s ease 1.1s forwards;
  }
  @keyframes rise { to { opacity: 1; transform: translateY(0); } }
  @keyframes lineGrow { to { width: 220px; } }
  @keyframes kenBurns { from{transform:scale(1)} to{transform:scale(1.1) translate(-1.5%, .8%)} }
</style></head>
<body>
  <div class="stage">
    <div class="photo" aria-hidden="true"></div>
    <div class="veil" aria-hidden="true"></div>
    ${brandLockupHtml()}
    <div class="copy">
      <h1>Exceptional lessons start with <em>connection</em></h1>
      <p>Capture ideas. Build lessons. Connect with the best arts organisations. Share or sell your resources. Create inspiring learning experiences — EYFS to A-level.</p>
      <div class="line" aria-hidden="true"></div>
    </div>
  </div>
</body></html>`;
}

export function heroConnectionHtml(heroImageUrl = HERO_IMAGE_URL) {
  return logoIntroHtml(heroImageUrl);
}

export function closingSlideHtml() {
  const fonts =
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Source+Sans+3:wght@600;700&display=swap';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<link href="${fonts}" rel="stylesheet" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1920px; height: 1080px; overflow: hidden; background: #05231e; }
  .frame { width: 1920px; height: 1080px; position: relative; overflow: hidden; padding: 190px 140px 100px; display: flex; flex-direction: column; justify-content: center; }
  .kb {
    position: absolute; inset: -10%;
    background:
      radial-gradient(ellipse 1200px 700px at 70% 20%, rgba(182,255,126,0.18), transparent 58%),
      linear-gradient(155deg, #05231e 0%, ${BRAND_FOREST} 50%, #05231e 100%);
    animation: kenBurns 3.2s ease-in-out forwards;
  }
  .frame > *:not(.kb):not(.brand-lockup) { position: relative; z-index: 1; }
  ${brandLockupCss()}
  .eyebrow {
    font-size: 28px; letter-spacing: 0.18em; text-transform: uppercase;
    color: ${BRAND_LIME}; font-weight: 700; margin-bottom: 24px;
    opacity: 0; transform: translateY(12px);
    animation: rise 0.85s cubic-bezier(.2,.8,.2,1) 0.2s forwards;
  }
  .eyebrow::after { content:""; display:block; width:100px; height:5px; background:${BRAND_LIME}; margin-top:16px; }
  h1 {
    font-family: "Playfair Display", Georgia, serif;
    font-size: 84px; line-height: 1.06; font-weight: 700; color: #FFFFFF; max-width: 1600px;
    text-shadow: 0 3px 24px rgba(0,0,0,0.35);
    opacity: 0; transform: translateY(18px);
    animation: rise 0.95s cubic-bezier(.2,.8,.2,1) 0.35s forwards;
  }
  .body {
    margin-top: 28px; font-size: 36px; line-height: 1.35; color: #FFFFFF; max-width: 1300px; font-weight: 600;
    opacity: 0; transform: translateY(14px);
    animation: rise 0.9s cubic-bezier(.2,.8,.2,1) 0.5s forwards;
  }
  .contacts { margin-top: 48px; display: flex; flex-direction: column; gap: 22px; opacity: 0; animation: fadeIn 1s ease 0.7s forwards; }
  .contact { display: flex; align-items: baseline; gap: 24px; }
  .contact .label { font-size: 22px; letter-spacing: 0.14em; text-transform: uppercase; color: ${BRAND_LIME}; font-weight: 700; min-width: 110px; }
  .contact .value { font-size: 44px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.01em; }
  .pill {
    margin-top: 40px; display: inline-block; padding: 16px 26px; border-radius: 999px;
    border: 2px solid rgba(182,255,126,0.65); color: ${BRAND_LIME}; font-size: 24px; font-weight: 700;
    opacity: 0; animation: fadeIn 0.9s ease 0.95s forwards;
  }
  .glow-line {
    position: absolute; left: 140px; right: 140px; bottom: 64px; height: 3px; z-index: 1;
    background: linear-gradient(90deg, transparent, ${BRAND_LIME}, transparent);
    opacity: 0; animation: fadeIn 1s ease 1.05s forwards;
  }
  @keyframes rise { to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { to { opacity: 1; } }
  @keyframes kenBurns { from{transform:scale(1)} to{transform:scale(1.08) translate(-1%, -.5%)} }
</style></head>
<body>
  <div class="frame">
    <div class="kb" aria-hidden="true"></div>
    ${brandLockupHtml()}
    <div class="eyebrow">Next steps</div>
    <h1>Bring schools and arts partners into one planning space</h1>
    <p class="body">Prototype for Arts Council consultation. Logos for demonstration only.</p>
    <div class="contacts">
      <div class="contact"><span class="label">Email</span><span class="value">rob@rhythmstix.co.uk</span></div>
      <div class="contact"><span class="label">Web</span><span class="value">www.ccdesigner.co.uk</span></div>
    </div>
    <div class="pill">CCDesigner · Creative Curriculum Designer</div>
    <div class="glow-line"></div>
  </div>
</body></html>`;
}

export function contextPressureSlideHtml() {
  return slideHtml({
    eyebrow: 'The challenge',
    title: 'Performing arts under pressure',
    body: 'In schools and further education, specialist expertise and opportunities are harder to reach.',
    compactTitle: true,
  });
}

export function contextResponseSlideHtml() {
  return slideHtml({
    eyebrow: 'The response',
    title: 'One place to plan and connect',
    body: 'Music hubs and arts organisations together — so great teaching ideas stay alive.',
    compactTitle: true,
  });
}

/** @deprecated Use contextPressureSlideHtml / contextResponseSlideHtml */
export function contextSlideHtml() {
  return contextResponseSlideHtml();
}

/** Sleek animated slide — capture lightning moments / melting pot of ideas. */
export function ideasSlideHtml() {
  const fonts =
    'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0;700;1;500&family=Source+Sans+3:wght@600;700&display=swap';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<link href="${fonts}" rel="stylesheet" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1920px; height: 1080px; overflow: hidden; background: #05231e; }
  .frame {
    width: 1920px; height: 1080px; position: relative; overflow: hidden;
    padding: 190px 140px 120px; display: flex; flex-direction: column; justify-content: center;
  }
  .kb {
    position: absolute; inset: -12%;
    background:
      radial-gradient(ellipse 1000px 600px at 70% 25%, rgba(182,255,126,0.2), transparent 55%),
      radial-gradient(ellipse 900px 500px at 15% 80%, rgba(182,255,126,0.08), transparent 50%),
      linear-gradient(155deg, #05231e 0%, ${BRAND_FOREST} 48%, #05231e 100%);
    animation: kenBurns 3.2s ease-in-out forwards;
  }
  .frame > *:not(.kb):not(.brand-lockup) { position: relative; z-index: 1; }
  ${brandLockupCss()}
  .eyebrow {
    font-size: 28px; letter-spacing: 0.18em; text-transform: uppercase;
    color: ${BRAND_LIME}; font-weight: 700; margin-bottom: 36px;
    opacity: 0; transform: translateY(14px);
    animation: rise 0.8s cubic-bezier(.2,.8,.2,1) 0.25s forwards;
  }
  .eyebrow::after {
    content: ""; display: block; width: 100px; height: 5px;
    background: ${BRAND_LIME}; margin-top: 18px;
  }
  .hook {
    font-family: "Playfair Display", Georgia, serif;
    font-size: 72px; line-height: 1.1; font-weight: 700; color: #FFFFFF;
    max-width: 1500px;
    opacity: 0; transform: translateY(22px);
    animation: rise 0.9s cubic-bezier(.2,.8,.2,1) 0.4s forwards;
  }
  .hook em { font-style: italic; font-weight: 500; color: ${BRAND_LIME}; }
  .promise {
    margin-top: 40px;
    font-family: "Playfair Display", Georgia, serif;
    font-size: 56px; line-height: 1.15; font-weight: 700; color: #FFFFFF;
    max-width: 1400px;
    opacity: 0; transform: translateY(18px);
    animation: rise 0.95s cubic-bezier(.2,.8,.2,1) 0.7s forwards;
  }
  .promise strong {
    color: ${BRAND_LIME}; font-weight: 700;
  }
  .tag {
    margin-top: 44px;
    font-family: "Source Sans 3", system-ui, sans-serif;
    font-size: 36px; line-height: 1.35; font-weight: 600; color: #FFFFFF;
    max-width: 1200px;
    opacity: 0; transform: translateY(14px);
    animation: rise 0.95s cubic-bezier(.2,.8,.2,1) 1s forwards;
  }
  .spark {
    position: absolute; right: 160px; top: 200px;
    width: 180px; height: 180px; border-radius: 50%;
    border: 2px solid rgba(182,255,126,0.35);
    opacity: 0; animation: pulseRing 2.8s ease-in-out 1.1s infinite, fadeIn 1s ease 0.9s forwards;
  }
  .spark::after {
    content: ""; position: absolute; inset: 28px; border-radius: 50%;
    border: 2px solid rgba(182,255,126,0.2);
  }
  @keyframes rise { to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { to { opacity: 1; } }
  @keyframes kenBurns { from { transform: scale(1); } to { transform: scale(1.1) translate(-1.2%, -0.6%); } }
  @keyframes pulseRing {
    0%, 100% { transform: scale(1); opacity: 0.7; }
    50% { transform: scale(1.08); opacity: 0.35; }
  }
</style></head>
<body>
  <div class="frame">
    <div class="kb" aria-hidden="true"></div>
    ${brandLockupHtml()}
    <div class="spark" aria-hidden="true"></div>
    <div class="eyebrow">For every teacher</div>
    <p class="hook">Ever had an <em>excellent idea</em> — then felt it slip away?</p>
    <p class="promise">Keep every <strong>lightning moment</strong> in one place.</p>
    <p class="tag">A melting pot of ideas for arts planning.</p>
  </div>
</body></html>`;
}

export async function smoothClick(page, locator, { steps = 8, settle = 110 } = {}) {
  const target = locator.first();
  await target.scrollIntoViewIfNeeded().catch(() => {});
  const box = await target.boundingBox().catch(() => null);
  if (!box) {
    await target.click({ timeout: 8000 }).catch(() => {});
    await ensureCursor(page).catch(() => {});
    return;
  }
  const x = box.x + box.width / 2;
  const y = box.y + Math.min(box.height / 2, 24);
  await page.mouse.move(x, y, { steps }).catch(() => {});
  await moveCursor(page, x, y, false);
  await hold(page, settle);
  await moveCursor(page, x, y, true);
  try {
    await page.mouse.down();
    await hold(page, 45);
    await page.mouse.up();
  } catch {
    await target.click({ timeout: 5000 }).catch(() => {});
  }
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await ensureCursor(page).catch(() => {});
  await moveCursor(page, x, y, false);
  await hold(page, 90);
}

export async function clickTab(page, tab) {
  // Close blockers first — help modal intercepts clicks
  await page.keyboard.press('Escape').catch(() => {});
  const closeBtn = page.getByRole('button', { name: /^Close$/i }).first();
  if (await closeBtn.isVisible({ timeout: 250 }).catch(() => false)) {
    await closeBtn.click({ force: true }).catch(() => {});
  }
  const loc = page.locator(`[data-tab="${tab}"]`).first();
  await loc.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  await loc.scrollIntoViewIfNeeded().catch(() => {});
  const box = await loc.boundingBox().catch(() => null);
  if (box) {
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y, { steps: 6 }).catch(() => {});
    await moveCursor(page, x, y, false).catch(() => {});
    await hold(page, 90);
  }
  // Real Playwright click — mouse.down/up alone can miss Radix TabsTrigger
  await loc.click({ force: true, timeout: 8000 });
  await hold(page, 380);
  await page
    .waitForFunction(
      (t) => {
        const el = document.querySelector(`[data-tab="${t}"]`);
        if (!el) return false;
        return (
          el.getAttribute('data-state') === 'active' ||
          el.getAttribute('aria-selected') === 'true'
        );
      },
      tab,
      { timeout: 4000 },
    )
    .catch(() => {});
  await ensureCursor(page).catch(() => {});
  await hold(page, 180);
}

export async function snap(page, framesDir, id) {
  await page.screenshot({ path: path.join(framesDir, `${id}.png`), type: 'png' });
}

export async function typeSlow(page, locator, text, { delay = 22 } = {}) {
  await smoothClick(page, locator);
  await locator.fill('');
  await locator.type(text, { delay: Math.max(3, Math.round(delay * DEMO_PACE)) });
}
