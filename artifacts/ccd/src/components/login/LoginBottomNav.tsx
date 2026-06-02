import {
  BookOpen,
  FolderHeart,
  Handshake,
  HelpCircle,
  Home,
  Lightbulb,
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', sub: 'Your dashboard' },
  { icon: BookOpen, label: 'Lessons', sub: 'Plan & create' },
  { icon: Lightbulb, label: 'Activities', sub: 'Ideas & resources' },
  { icon: Handshake, label: 'Partners', sub: 'Creative organisations' },
  { icon: FolderHeart, label: 'Collections', sub: 'Saved inspiration' },
  { icon: HelpCircle, label: 'Support', sub: 'Help & guidance' },
] as const;

interface LoginBottomNavProps {
  onPartnersClick?: () => void;
  onSupportClick?: () => void;
  onPreviewClick?: () => void;
}

export function LoginBottomNav({ onPartnersClick, onSupportClick, onPreviewClick }: LoginBottomNavProps) {
  return (
    <>
      {/* Desktop / tablet: full bar */}
      <nav
        className="hidden border-t border-gray-200 bg-white md:flex"
        aria-label="Platform overview"
      >
        {NAV_ITEMS.map((item, index) => {
          const Icon = item.icon;
          const isPartners = item.label === 'Partners';
          const isSupport = item.label === 'Support';
          const isHome = item.label === 'Home';

          return (
            <button
              key={item.label}
              type="button"
              onClick={
                isPartners
                  ? onPartnersClick
                  : isSupport
                    ? onSupportClick
                    : isHome
                      ? onPreviewClick
                      : undefined
              }
              className={`group flex flex-1 flex-col items-center justify-center gap-0.5 px-3 py-4 text-center transition-colors hover:bg-gray-50 ${
                index > 0 ? 'border-l border-gray-200' : ''
              }`}
            >
              <Icon className="h-5 w-5 text-[#002D24]" strokeWidth={1.75} />
              <span className="text-sm font-semibold text-[#002D24]">{item.label}</span>
              <span className="text-[0.68rem] text-gray-500">{item.sub}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile: compact fixed tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-gray-200 bg-white/95 backdrop-blur-md md:hidden"
        aria-label="Platform overview"
      >
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isPartners = item.label === 'Partners';

          return (
            <button
              key={item.label}
              type="button"
              onClick={isPartners ? onPartnersClick : item.label === 'Home' ? onPreviewClick : undefined}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[#002D24]"
            >
              <Icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.75} />
              <span className="text-[0.62rem] font-semibold leading-none">{item.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={onSupportClick}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[#002D24]"
        >
          <HelpCircle className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.75} />
          <span className="text-[0.62rem] font-semibold leading-none">Support</span>
        </button>
      </nav>
    </>
  );
}
