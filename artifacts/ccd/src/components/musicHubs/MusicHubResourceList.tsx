import { useState } from 'react';
import { ExternalLink, Lock, PlusCircle, Unlock } from 'lucide-react';
import toast from 'react-hot-toast';
import type { MusicHubResource } from '../../types/musicHubsDirectory';
import {
  fetchSubscriberResourceUrl,
  isOrganisationUnlocked,
  unlockMusicHubOrganisation,
} from '../../utils/musicHubSubscriberUnlock';
import { openActivityResource } from '../../utils/openActivityResource';

/**
 * FREE / EXTERNAL / SUBSCRIBER resource list.
 * Subscriber URLs are fetched only after org unlock — never from seed JSON.
 */
export function MusicHubResourceList({
  resources,
  organisationId,
  onAddToLibrary,
}: {
  resources: MusicHubResource[];
  organisationId?: string;
  onAddToLibrary?: (resource: MusicHubResource) => Promise<void>;
}) {
  const [unlocking, setUnlocking] = useState(false);
  const [password, setPassword] = useState('');
  const [unlockedTick, setUnlockedTick] = useState(0);
  const orgId = organisationId || 'ems';
  const unlocked = isOrganisationUnlocked(orgId) || unlockedTick > 0;

  if (!resources.length) return null;

  const handleUnlock = async () => {
    setUnlocking(true);
    const result = await unlockMusicHubOrganisation(orgId, password);
    setUnlocking(false);
    setPassword('');
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setUnlockedTick((n) => n + 1);
    toast.success('Organisation unlocked for this session');
  };

  const openResource = async (resource: MusicHubResource) => {
    if (resource.access === 'SUBSCRIBER') {
      if (!unlocked) {
        toast.error('Unlock with your organisation password first');
        return;
      }
      const got = await fetchSubscriberResourceUrl(resource.id, resource.organisationId || orgId);
      if (!got.ok) {
        toast.error(got.error);
        return;
      }
      window.open(got.url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (resource.href) {
      openActivityResource(resource.href);
    }
  };

  return (
    <div className="space-y-3">
      {resources.some((r) => r.access === 'SUBSCRIBER') && !unlocked && (
        <div className="rounded-xl border border-[#002D24]/15 bg-[#E8F0EA]/50 px-4 py-3">
          <p className="text-sm font-semibold text-[#002D24]">Subscriber resources</p>
          <p className="mt-1 text-xs text-[#002D24]/70">
            Enter your organisation password to unlock for this browser session. Passwords are
            verified on the server — never stored in the page.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor={`mh-unlock-${orgId}`}>
              Organisation password
            </label>
            <input
              id={`mh-unlock-${orgId}`}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-[#002D24]/20 bg-white px-3 py-2 text-sm text-[#002D24]"
              placeholder="Organisation password"
            />
            <button
              type="button"
              disabled={unlocking || !password}
              onClick={() => void handleUnlock()}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#002D24] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
            >
              <Unlock className="h-3.5 w-3.5" aria-hidden />
              Unlock
            </button>
          </div>
        </div>
      )}

      <ul className="space-y-2" aria-label="Music hub resources">
        {resources.map((resource) => {
          const locked = resource.access === 'SUBSCRIBER' && !unlocked;
          return (
            <li
              key={resource.id}
              className="flex flex-col gap-2 rounded-xl border border-[#002D24]/15 bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#002D24]">{resource.title}</p>
                {resource.description && (
                  <p className="mt-0.5 text-xs text-[#002D24]/65">{resource.description}</p>
                )}
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#002D24]/55">
                  {resource.access}
                  {resource.providedBy ? ` · ${resource.providedBy}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void openResource(resource)}
                  disabled={locked}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#002D24]/20 bg-white px-3 py-2 text-xs font-semibold text-[#002D24] hover:bg-[#E8F0EA] disabled:opacity-50"
                >
                  {locked ? (
                    <Lock className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {locked ? 'Locked' : resource.access === 'EXTERNAL' ? 'Open link' : 'Open'}
                </button>
                {onAddToLibrary && resource.access !== 'EXTERNAL' && (
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => void onAddToLibrary(resource)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#002D24] px-3 py-2 text-xs font-semibold text-white hover:opacity-95 disabled:opacity-50"
                  >
                    <PlusCircle className="h-3.5 w-3.5" aria-hidden />
                    Copy to My Resources
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
