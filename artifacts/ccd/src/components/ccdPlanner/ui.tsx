/**
 * Planner UI primitives — ported from artifacts/planner-mock/src/components/ui.tsx
 * (feat/planner-mock). ModalShell keeps a11y enhancements in ./ModalShell.tsx.
 */
import { Check, X } from 'lucide-react';
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';

export {
  ModalShell,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalConfirm,
  MODAL_SHELL_SIZE,
} from './ModalShell';

export function IconButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-11 min-h-[44px] min-w-[44px] w-11 items-center justify-center rounded-full text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
        className,
      )}
      {...props}
    />
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft';
  size?: 'sm' | 'md' | 'lg';
}) {
  const variants = {
    primary:
      'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700',
    secondary:
      'bg-white text-indigo-700 border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50',
    ghost: 'bg-transparent text-slate-600 hover:bg-white/70 hover:text-indigo-700',
    soft: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
    danger: 'bg-rose-50 text-rose-700 hover:bg-rose-100',
  };
  const sizes = {
    sm: 'h-11 min-h-[44px] px-3 text-xs rounded-full gap-1.5',
    md: 'h-11 min-h-[44px] px-4 text-sm rounded-full gap-2',
    lg: 'h-12 min-h-[44px] px-5 text-sm rounded-2xl gap-2',
  };
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Pill({
  children,
  color,
  className,
}: {
  children: ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold',
        className,
      )}
      style={
        color
          ? {
              backgroundColor: `${color}1F`,
              color,
              borderColor: `${color}55`,
            }
          : undefined
      }
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
      {hint ? <span className="block text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

export function TextInput(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'w-full resize-y rounded-2xl border border-indigo-100 bg-indigo-50/30 px-3.5 py-3 text-base text-[#1F1B4D] outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus-visible:ring-2 focus-visible:ring-indigo-400',
        props.className,
      )}
    />
  );
}

export function TextField(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full rounded-2xl border border-indigo-100 bg-white px-3.5 py-2.5 text-base text-[#1F1B4D] outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 focus-visible:ring-2 focus-visible:ring-indigo-400',
        props.className,
      )}
    />
  );
}

export function SavedBadge({ time, className }: { time: string | null; className?: string }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600',
        className,
      )}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
      Saved{time ? ` ${time}` : ' automatically'}
    </div>
  );
}

export function CloseX({ onClick }: { onClick: () => void }) {
  return (
    <IconButton onClick={onClick} aria-label="Close">
      <X className="h-5 w-5" />
    </IconButton>
  );
}

export function SubjectBar({ color, className }: { color: string; className?: string }) {
  return (
    <span
      className={cn('inline-block w-1.5 shrink-0 rounded-full', className)}
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-indigo-50 p-1" role="tablist">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            'min-h-[44px] rounded-full px-3.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
            value === o.id
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-500 hover:text-indigo-600',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyIllustration() {
  return (
    <svg viewBox="0 0 280 160" className="mx-auto h-40 w-auto text-indigo-300" aria-hidden>
      <rect x="30" y="28" width="90" height="110" rx="18" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="2" />
      <rect x="48" y="48" width="54" height="10" rx="5" fill="#C7D2FE" />
      <rect x="48" y="68" width="40" height="8" rx="4" fill="#E0E7FF" />
      <rect x="48" y="86" width="48" height="8" rx="4" fill="#E0E7FF" />
      <rect x="130" y="40" width="120" height="96" rx="22" fill="white" stroke="#C7D2FE" strokeWidth="2" />
      <circle cx="160" cy="72" r="14" fill="#DDD6FE" />
      <rect x="186" y="64" width="44" height="8" rx="4" fill="#C7D2FE" />
      <rect x="148" y="96" width="84" height="10" rx="5" fill="#EEF2FF" />
      <rect x="148" y="114" width="64" height="8" rx="4" fill="#F5F3FF" />
      <path
        d="M108 90c18-22 36-10 54 8"
        fill="none"
        stroke="#818CF8"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="4 6"
      />
    </svg>
  );
}
