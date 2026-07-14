interface PrototypePreviewBadgeProps {
  className?: string;
}

export function PrototypePreviewBadge({ className = '' }: PrototypePreviewBadgeProps) {
  return (
    <div
      className={`rounded-full border border-[#002D24]/12 bg-[#f4f7f5] px-3.5 py-2 ${className}`}
      role="status"
    >
      <p className="text-[0.7rem] font-semibold leading-tight text-[#002D24] sm:text-xs">
        Prototype Preview
      </p>
      <p className="mt-0.5 text-[0.65rem] leading-snug text-gray-500 sm:text-[0.7rem]">
        Not a live partner platform
      </p>
    </div>
  );
}
