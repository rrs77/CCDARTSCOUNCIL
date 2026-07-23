import { PARTNER_DISCLAIMER, PARTNER_DISCLAIMER_FRAMING } from './prototypeCopy';

/**
 * Prominent demonstration disclaimer — sits under the prototype notice bar
 * on the login/landing page so it is visible on first view.
 */
export function DemonstrationDisclaimerBand() {
  return (
    <div
      role="note"
      aria-label="Demonstration disclaimer"
      className="flex w-full shrink-0 items-center justify-center border-t border-white/15 px-4 py-3.5 sm:px-6 sm:py-4"
      style={{ backgroundColor: '#002D24' }}
    >
      <div className="max-w-5xl text-center">
        <p className="text-sm font-bold leading-snug text-white sm:text-base">
          {PARTNER_DISCLAIMER_FRAMING}
        </p>
        <p className="mt-1.5 text-xs font-semibold leading-relaxed text-white sm:text-sm sm:leading-snug">
          {PARTNER_DISCLAIMER}
        </p>
      </div>
    </div>
  );
}
