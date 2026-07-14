import { PROTOTYPE_NOTICE } from './prototypeCopy';

/**
 * Slim full-width bar — sits above login/landing content without overlapping it.
 */
export function PrototypeNoticeBar() {
  return (
    <div
      role="status"
      className="flex w-full shrink-0 items-center justify-center px-4 py-2.5 sm:px-6"
      style={{
        minHeight: '40px',
        backgroundColor: '#002D24',
      }}
    >
      <p className="max-w-6xl text-center text-[0.7rem] font-medium leading-snug text-white/95 sm:text-xs sm:leading-relaxed">
        {PROTOTYPE_NOTICE}
      </p>
    </div>
  );
}
