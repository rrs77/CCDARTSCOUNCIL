import { PROTOTYPE_NOTICE } from './prototypeCopy';

/**
 * Full-width notice bar — sits above login/landing content without overlapping it.
 */
export function PrototypeNoticeBar() {
  return (
    <div
      role="status"
      data-ccd-prototype-chrome="notice"
      className="flex w-full shrink-0 items-center justify-center border-b border-[#E2E0EF] px-4 py-2 sm:px-6 sm:py-2.5"
      style={{
        backgroundColor: '#F4F3FA',
      }}
    >
      <p className="max-w-5xl text-center text-[11px] font-medium leading-snug text-[#77738F] sm:text-xs sm:leading-relaxed">
        {PROTOTYPE_NOTICE}
      </p>
    </div>
  );
}
