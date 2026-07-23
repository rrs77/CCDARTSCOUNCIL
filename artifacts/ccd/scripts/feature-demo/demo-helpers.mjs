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

export const PALETTE = {
  bgDeep: '#05231e',
  bgForest: '#002D24',
  text: '#FFFFFF',
  accent: '#B6FF7E',
};

export function hold(page, ms) {
  return page.waitForTimeout(ms);
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
      style.textContent = `
        #ccd-demo-cursor {
          position: fixed; left: 0; top: 0; width: 28px; height: 28px;
          margin-left: -4px; margin-top: -4px; border-radius: 50%;
          background: rgba(182,255,126,0.95); border: 2px solid #002D24;
          box-shadow: 0 0 0 4px rgba(182,255,126,0.3), 0 10px 28px rgba(0,0,0,0.35);
          pointer-events: none; z-index: 2147483646;
          transform: translate(-120px, -120px);
          transition: transform 35ms linear, width 120ms ease, height 120ms ease;
        }
        #ccd-demo-cursor.down { width: 18px; height: 18px; background: #002D24; border-color: #B6FF7E; }
        html.ccd-demo-recording, html.ccd-demo-recording * { cursor: none !important; }
      `;
      document.documentElement.appendChild(style);
      document.documentElement.classList.add('ccd-demo-recording');
      const cur = document.createElement('div');
      cur.id = 'ccd-demo-cursor';
      document.documentElement.appendChild(cur);
      window.__ccdMoveCursor = (x, y, down) => {
        const el = document.getElementById('ccd-demo-cursor');
        if (!el) return;
        el.style.transform = `translate(${x}px, ${y}px)`;
        el.classList.toggle('down', !!down);
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
      --bg-forest: #002D24;
      --text: #FFFFFF;
      --accent: #B6FF7E;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 1920px; height: 1080px; overflow: hidden;
      background: var(--bg-deep); color: var(--text);
      font-family: "Source Sans 3", system-ui, sans-serif;
    }
    .frame {
      width: 1920px; height: 1080px; position: relative; overflow: hidden;
      /* Top padding clears absolute corner logo (48 + 88) so headlines stay legible. */
      padding: 160px 140px 110px;
      display: flex; flex-direction: column; justify-content: center;
    }
    .kb {
      position: absolute; inset: -10%;
      background:
        radial-gradient(ellipse 1200px 700px at 42% 28%, rgba(182,255,126,0.16), transparent 62%),
        linear-gradient(160deg, #05231e 0%, #002D24 52%, #05231e 100%);
      animation: kenBurns 9s ease-in-out forwards;
      z-index: 0;
    }
    /* Exclude .mark so corner logo stays absolute top-left (not in text flow). */
    .frame > *:not(.kb):not(.mark) { position: relative; z-index: 1; }
    .frame > .mark {
      position: absolute; top: 48px; left: 56px; z-index: 3;
      width: 88px; height: 88px; border-radius: 999px;
      border: 3px solid var(--accent); background: var(--bg-forest);
      display: grid; place-items: center;
      font-size: 28px; font-weight: 800; color: #FFFFFF;
      font-family: "Source Sans 3", system-ui, sans-serif;
      letter-spacing: -0.02em;
      opacity: 0; animation: fadeIn 0.7s ease 0.12s forwards;
      pointer-events: none;
    }
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
    <div class="mark">CCD</div>
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
    <div class="mark">CCD</div>
    <div class="eyebrow">For potential partners &amp; funding</div>
    <h1 class="compact">Demonstration only</h1>
    <p class="body">${PARTNER_DISCLAIMER_TEXT}</p>
    <div class="pill">Shown for potential partners and for funding</div>
  </div>
</body></html>`;
}

export function logoIntroHtml() {
  const fonts =
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Source+Sans+3:wght@600;700&display=swap';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<link href="${fonts}" rel="stylesheet" />
<style>
  * { box-sizing: border-box; margin: 0; }
  html, body { width: 1920px; height: 1080px; overflow: hidden; background: #05231e; }
  .stage { width: 1920px; height: 1080px; position: relative; overflow: hidden; display: grid; place-items: center; text-align: center; }
  .kb {
    position: absolute; inset: -12%;
    background:
      radial-gradient(ellipse 1300px 760px at 50% 40%, rgba(182,255,126,0.18), transparent 64%),
      linear-gradient(165deg, #05231e 0%, #002D24 55%, #05231e 100%);
    animation: kenBurns 8s ease-in-out forwards;
  }
  .content { position: relative; z-index: 1; }
  .logo-wrap {
    position: relative; width: 260px; height: 260px; margin: 0 auto 48px;
    opacity: 0; transform: scale(0.76);
    animation: logoIn 1.35s cubic-bezier(.2,.85,.2,1) 0.2s forwards;
  }
  .ring { position: absolute; inset: 0; border-radius: 50%; border: 3px solid rgba(182,255,126,0.45); animation: pulse 2.4s ease-in-out 1.25s infinite; }
  .ring.r2 { inset: -22px; border-color: rgba(182,255,126,0.22); animation-delay: 1.45s; }
  .mark {
    position: absolute; inset: 16px; border-radius: 50%;
    background: radial-gradient(circle at 50% 42%, #1a4038 0%, #002D24 55%, #05231e 100%);
    border: 3px solid #B6FF7E; display: grid; place-items: center;
    box-shadow: 0 0 60px rgba(182,255,126,0.28);
    font-weight: 800; font-size: 72px; letter-spacing: -0.04em; color: #FFFFFF;
    font-family: "Source Sans 3", system-ui, sans-serif;
  }
  .brand { opacity: 0; transform: translateY(18px); animation: fadeUp 0.95s ease 1.05s forwards; }
  .brand h1 {
    font-family: "Playfair Display", Georgia, serif;
    font-size: 108px; font-weight: 700; color: #FFFFFF;
  }
  .brand h1 span { color: #B6FF7E; }
  .brand p { margin-top: 22px; font-size: 36px; color: #FFFFFF; font-weight: 600; font-family: "Source Sans 3", system-ui, sans-serif; }
  .line {
    width: 0; height: 5px; margin: 34px auto 0;
    background: linear-gradient(90deg, transparent, #B6FF7E, transparent);
    animation: lineGrow 0.9s ease 1.5s forwards;
  }
  @keyframes logoIn { to { opacity: 1; transform: scale(1); } }
  @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
  @keyframes lineGrow { to { width: 260px; } }
  @keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.05);opacity:.55} }
  @keyframes kenBurns { from{transform:scale(1)} to{transform:scale(1.1) translate(1%, -.6%)} }
</style></head>
<body>
  <div class="stage">
    <div class="kb" aria-hidden="true"></div>
    <div class="content">
      <div class="logo-wrap">
        <div class="ring r2"></div><div class="ring"></div>
        <div class="mark">CCD</div>
      </div>
      <div class="brand">
        <h1>CC<span>Designer</span></h1>
        <p>Creative curriculum studio for schools &amp; arts partners</p>
        <div class="line"></div>
      </div>
    </div>
  </div>
</body></html>`;
}

export function heroConnectionHtml(heroImageUrl = HERO_IMAGE_URL) {
  const fonts =
    'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0;700;1;500&family=Source+Sans+3:wght@600;700&display=swap';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<link href="${fonts}" rel="stylesheet" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1920px; height: 1080px; overflow: hidden; background: #002D24; }
  .stage { width: 1920px; height: 1080px; position: relative; overflow: hidden; }
  .photo {
    position: absolute; inset: -8%;
    background: #002D24 url("${heroImageUrl}") center center / cover no-repeat;
    animation: kenBurns 10s ease-in-out forwards;
  }
  .veil {
    position: absolute; inset: 0;
    background:
      linear-gradient(90deg, rgba(0,45,36,0.86) 0%, rgba(0,45,36,0.58) 50%, rgba(0,45,36,0.78) 100%),
      linear-gradient(180deg, rgba(0,45,36,0.28) 0%, rgba(0,45,36,0.45) 45%, rgba(0,45,36,0.92) 100%);
  }
  .stage > .mark {
    position: absolute; top: 48px; left: 56px; z-index: 3;
    width: 88px; height: 88px; border-radius: 999px;
    border: 3px solid #B6FF7E; background: #002D24;
    display: grid; place-items: center; font-size: 28px; font-weight: 800; color: #fff;
    font-family: "Source Sans 3", system-ui, sans-serif; letter-spacing: -0.02em;
    opacity: 0; animation: fadeIn 0.7s ease 0.15s forwards;
    pointer-events: none;
  }
  .copy {
    position: relative; z-index: 1; height: 100%;
    padding: 120px 140px; display: flex; flex-direction: column; justify-content: center;
    max-width: 1280px;
  }
  h1 {
    font-family: "Playfair Display", Georgia, serif;
    font-size: 92px; line-height: 1.06; font-weight: 700; color: #FFFFFF;
    text-shadow: 0 4px 32px rgba(0,0,0,0.5);
    opacity: 0; transform: translateY(18px);
    animation: rise 0.95s cubic-bezier(.2,.8,.2,1) 0.3s forwards;
  }
  h1 em { font-style: italic; font-weight: 500; color: #B6FF7E; }
  p {
    margin-top: 40px; font-family: "Source Sans 3", system-ui, sans-serif;
    font-size: 38px; line-height: 1.35; font-weight: 600; color: #FFFFFF;
    max-width: 1100px; text-shadow: 0 2px 20px rgba(0,0,0,0.45);
    opacity: 0; transform: translateY(14px);
    animation: rise 0.95s cubic-bezier(.2,.8,.2,1) 0.5s forwards;
  }
  @keyframes rise { to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { to { opacity: 1; } }
  @keyframes kenBurns { from{transform:scale(1)} to{transform:scale(1.12) translate(-2%,1%)} }
</style></head>
<body>
  <div class="stage">
    <div class="photo" aria-hidden="true"></div>
    <div class="veil" aria-hidden="true"></div>
    <div class="mark">CCD</div>
    <div class="copy">
      <h1>Exceptional lessons start with <em>connection</em></h1>
      <p>Capture ideas. Build lessons. Connect with the best arts organisations. Share or sell your resources. Create inspiring learning experiences — EYFS to A-level.</p>
    </div>
  </div>
</body></html>`;
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
  .frame { width: 1920px; height: 1080px; position: relative; overflow: hidden; padding: 160px 140px 100px; display: flex; flex-direction: column; justify-content: center; }
  .kb {
    position: absolute; inset: -10%;
    background:
      radial-gradient(ellipse 1200px 700px at 70% 20%, rgba(182,255,126,0.18), transparent 58%),
      linear-gradient(155deg, #05231e 0%, #002D24 50%, #05231e 100%);
    animation: kenBurns 9s ease-in-out forwards;
  }
  .frame > *:not(.kb):not(.mark) { position: relative; z-index: 1; }
  .frame > .mark {
    position: absolute; top: 48px; left: 56px; z-index: 3;
    width: 88px; height: 88px; border-radius: 999px; border: 3px solid #B6FF7E; background: #002D24;
    display: grid; place-items: center; font-size: 28px; font-weight: 800; color: #fff;
    font-family: "Source Sans 3", system-ui, sans-serif; letter-spacing: -0.02em;
    opacity: 0; animation: fadeIn 0.7s ease 0.1s forwards;
    pointer-events: none;
  }
  .eyebrow {
    font-size: 28px; letter-spacing: 0.18em; text-transform: uppercase;
    color: #B6FF7E; font-weight: 700; margin-bottom: 24px;
    opacity: 0; transform: translateY(12px);
    animation: rise 0.85s cubic-bezier(.2,.8,.2,1) 0.2s forwards;
  }
  .eyebrow::after { content:""; display:block; width:100px; height:5px; background:#B6FF7E; margin-top:16px; }
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
  .contact .label { font-size: 22px; letter-spacing: 0.14em; text-transform: uppercase; color: #B6FF7E; font-weight: 700; min-width: 110px; }
  .contact .value { font-size: 44px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.01em; }
  .pill {
    margin-top: 40px; display: inline-block; padding: 16px 26px; border-radius: 999px;
    border: 2px solid rgba(182,255,126,0.65); color: #B6FF7E; font-size: 24px; font-weight: 700;
    opacity: 0; animation: fadeIn 0.9s ease 0.95s forwards;
  }
  .glow-line {
    position: absolute; left: 140px; right: 140px; bottom: 64px; height: 3px; z-index: 1;
    background: linear-gradient(90deg, transparent, #B6FF7E, transparent);
    opacity: 0; animation: fadeIn 1s ease 1.05s forwards;
  }
  @keyframes rise { to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { to { opacity: 1; } }
  @keyframes kenBurns { from{transform:scale(1)} to{transform:scale(1.08) translate(-1%, -.5%)} }
</style></head>
<body>
  <div class="frame">
    <div class="kb" aria-hidden="true"></div>
    <div class="mark">CCD</div>
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
    padding: 160px 140px 120px; display: flex; flex-direction: column; justify-content: center;
  }
  .kb {
    position: absolute; inset: -12%;
    background:
      radial-gradient(ellipse 1000px 600px at 70% 25%, rgba(182,255,126,0.2), transparent 55%),
      radial-gradient(ellipse 900px 500px at 15% 80%, rgba(182,255,126,0.08), transparent 50%),
      linear-gradient(155deg, #05231e 0%, #002D24 48%, #05231e 100%);
    animation: kenBurns 9s ease-in-out forwards;
  }
  .frame > *:not(.kb):not(.mark) { position: relative; z-index: 1; }
  .frame > .mark {
    position: absolute; top: 48px; left: 56px; z-index: 3;
    width: 88px; height: 88px; border-radius: 999px;
    border: 3px solid #B6FF7E; background: #002D24;
    display: grid; place-items: center; font-size: 28px; font-weight: 800; color: #fff;
    font-family: "Source Sans 3", system-ui, sans-serif; letter-spacing: -0.02em;
    opacity: 0; animation: fadeIn 0.7s ease 0.1s forwards;
    pointer-events: none;
  }
  .eyebrow {
    font-size: 28px; letter-spacing: 0.18em; text-transform: uppercase;
    color: #B6FF7E; font-weight: 700; margin-bottom: 36px;
    opacity: 0; transform: translateY(14px);
    animation: rise 0.8s cubic-bezier(.2,.8,.2,1) 0.25s forwards;
  }
  .eyebrow::after {
    content: ""; display: block; width: 100px; height: 5px;
    background: #B6FF7E; margin-top: 18px;
  }
  .hook {
    font-family: "Playfair Display", Georgia, serif;
    font-size: 72px; line-height: 1.1; font-weight: 700; color: #FFFFFF;
    max-width: 1500px;
    opacity: 0; transform: translateY(22px);
    animation: rise 0.9s cubic-bezier(.2,.8,.2,1) 0.4s forwards;
  }
  .hook em { font-style: italic; font-weight: 500; color: #B6FF7E; }
  .promise {
    margin-top: 40px;
    font-family: "Playfair Display", Georgia, serif;
    font-size: 56px; line-height: 1.15; font-weight: 700; color: #FFFFFF;
    max-width: 1400px;
    opacity: 0; transform: translateY(18px);
    animation: rise 0.95s cubic-bezier(.2,.8,.2,1) 0.7s forwards;
  }
  .promise strong {
    color: #B6FF7E; font-weight: 700;
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
    position: absolute; right: 160px; top: 180px;
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
    <div class="mark">CCD</div>
    <div class="spark" aria-hidden="true"></div>
    <div class="eyebrow">For every teacher</div>
    <p class="hook">Ever had an <em>excellent idea</em> — then felt it slip away?</p>
    <p class="promise">Keep every <strong>lightning moment</strong> in one place.</p>
    <p class="tag">A melting pot of ideas for arts planning.</p>
  </div>
</body></html>`;
}

export async function smoothClick(page, locator, { steps = 16, settle = 260 } = {}) {
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
    await hold(page, 70);
    await page.mouse.up();
  } catch {
    await target.click({ timeout: 5000 }).catch(() => {});
  }
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await ensureCursor(page).catch(() => {});
  await moveCursor(page, x, y, false);
  await hold(page, 180);
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
    await page.mouse.move(x, y, { steps: 12 }).catch(() => {});
    await moveCursor(page, x, y, false).catch(() => {});
    await hold(page, 200);
  }
  // Real Playwright click — mouse.down/up alone can miss Radix TabsTrigger
  await loc.click({ force: true, timeout: 8000 });
  await hold(page, 700);
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
  await hold(page, 400);
}

export async function snap(page, framesDir, id) {
  await page.screenshot({ path: path.join(framesDir, `${id}.png`), type: 'png' });
}

export async function typeSlow(page, locator, text, { delay = 36 } = {}) {
  await smoothClick(page, locator);
  await locator.fill('');
  await locator.type(text, { delay });
}
