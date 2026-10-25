import { PROTOTYPE_NOTICE } from './prototypeCopy';

/**
 * Full-width notice bar — solid Studio Score indigo wash, no accent lines.
 */
export function PrototypeNoticeBar() {
  return (
    <div
      role="status"
      data-ccd-prototype-chrome="notice"
      className="flex w-full shrink-0 items-center justify-center bg-[#E9E6FF] px-4 py-2.5 sm:px-6 sm:py-3"
      style={{
        fontFamily: "var(--ss-font-ui, 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif)",
      }}
    >
      <p className="max-w-5xl text-center text-[13px] font-semibold leading-snug text-[#1F1B4D] sm:text-[13px] sm:leading-relaxed">
        {PROTOTYPE_NOTICE}
      </p>
    </div>
  );
}
