import { PROTOTYPE_NOTICE } from './prototypeCopy';

/**
 * Full-width notice bar — sits above login/landing content without overlapping it.
 */
export function PrototypeNoticeBar() {
  return (
    <div
      role="status"
      className="flex w-full shrink-0 items-center justify-center px-4 py-3.5 sm:px-6 sm:py-4"
      style={{
        minHeight: '56px',
        backgroundColor: '#002D24',
      }}
    >
      <p className="max-w-5xl text-center text-xs font-medium leading-snug text-white sm:text-sm sm:leading-relaxed">
        {PROTOTYPE_NOTICE}
      </p>
    </div>
  );
}
