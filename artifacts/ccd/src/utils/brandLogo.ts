/**
 * The CCDesigner colour master logo (public/ccdesigner-logo-colour.png, 784×192,
 * transparent), trimmed from the brand file CCDesigner_logo_transparent.png.
 * The ONE path for the logo on user-visible screens (Rob, 25 Oct 2026: "A: yes,
 * switch them all"). Plan outputs embed the same artwork via utils/planLogo.ts.
 * The old public/ccdesigner-logo.png (a redrawn wordmark) stays in the repo but
 * must not be used by any screen (guarded in exportLogoGuard.test.ts).
 * Tiny module on purpose: no embedded image data.
 */
export const CCD_LOGO_COLOUR_PATH = '/ccdesigner-logo-colour.png';
export const CCD_LOGO_ALT = 'CCDesigner';
