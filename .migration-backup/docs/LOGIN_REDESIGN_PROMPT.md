# Login page redesign – Cursor prompt and reference

Use the prompt below in Cursor (or similar) to simplify the login screen. The chest image and heading currently feel too busy.

---

## Cursor prompt (copy and paste)

```
The login page in this app looks too busy: full-screen treasure-chest image plus logo and "Creative Curriculum Designer • Rhythmstix" makes it cluttered.

I like the idea of a chest (ideas/planning) but the current implementation doesn’t work.

Please:

1. Simplify the login screen so it feels calm and clear:
   - Either remove the full-screen chest background, or use it in a much subtler way (e.g. very low opacity, or a small motif instead of full-bleed).
   - Reduce visual competition: one clear focal point (the form), with minimal branding above it.

2. Keep the chest only if it can be subtle:
   - For example: small chest image/icon above the form, or a very faint background (e.g. background image at 10–15% opacity) so the chest is a hint, not the main visual.
   - If a subtle chest doesn’t work, remove it and use a simple solid or gradient background (teal is fine).

3. Heading/branding:
   - Either use only the logo (LogoSVG) above the form, or one short line (e.g. "Creative Curriculum Designer" only), not logo + long subtitle.
   - Goal: clean, minimal header so the form is the obvious focus.

4. Don’t change: form fields, forgot-password flow, install prompt, or auth logic. Only layout, background, and branding presentation.

Relevant files:
- Login UI: src/components/LoginForm.tsx
- Branding (titles, colours, optional logo URL): settings.branding in SettingsContextNew (loginTitle, loginSubtitle, loginLogoUrl, loginBackgroundColor, loginButtonColor)
- Current full-screen image: public/login-hero.png (treasure chest with CCPlanner / Great Activities)
```

---

## Code reference

**Login layout and branding (excerpt from `src/components/LoginForm.tsx`):**

- **Branding variables (around lines 28–35):**  
  `loginBgColor`, `loginButtonColor`, `logoLetters`, `loginTitle`, `loginSubtitle`, `loginHeroImageUrl` (from `settings.branding` or defaults).
- **Outer wrapper (around lines 125–134):**  
  Full-screen div with `backgroundImage: url(loginHeroImageUrl)`, `backgroundColor: loginBgColor`, and overlay `bg-black/40`.
- **Header (around lines 152–155):**  
  `LogoSVG` with `size="lg"`, `showText={true}`, `letters={logoLetters}`.
- **Footer (around lines 326–330):**  
  Displays `{loginTitle} • {loginSubtitle}` in light text.

**Image file:**

- **Path:** `public/login-hero.png`  
- **Content:** Treasure chest illustration with “CCPlanner” and “Great Activities” labels, notebook, and index cards (Brainstorm, Activities, Weekly Ideas, etc.). Colourful, detailed; used as full-screen background and currently makes the page feel busy.

---

## Image location

- **In repo:** `public/login-hero.png`
- **Original asset (if you need to replace it):**  
  `.cursor/projects/Users-robreich-storer-CCD2026/assets/ChatGPT_Image_Mar_4__2026__11_02_59_AM-a64d90e4-7db7-485c-8061-37bd769a89fc.png`

To use a different chest image, replace `public/login-hero.png` or set **Settings → Branding → Login logo URL** to another image URL.
