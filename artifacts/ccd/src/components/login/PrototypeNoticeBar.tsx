import { PROTOTYPE_NOTICE } from './prototypeCopy';

/**
 * Full-width notice bar — sits above login/landing content without overlapping it.
 * Uses a slightly deeper green than the page surround so it still reads as a distinct strip.
 */
export function PrototypeNoticeBar() {
  return (
    <div
      role="status"
      className="flex w-full shrink-0 items-center justify-center border-b border-white/10 px-4 py-3.5 sm:px-6 sm:py-4"
      style={{
        minHeight: '56px',
        backgroundColor: '#001F19',
      }}
    >
      <p className="max-w-5xl text-center text-xs font-medium leading-snug text-white sm:text-sm sm:leading-relaxed">
        {PROTOTYPE_NOTICE}
      </p>
    </div>
  );
}
