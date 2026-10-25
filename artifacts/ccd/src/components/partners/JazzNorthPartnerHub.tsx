import { ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { getJazzNorthDefaultLayout } from '../../config/partnerOrgHubDefaults';
import { JAZZ_NORTH_DREAMHOST_BASE_USED } from '../../data/resourceRegistry';
import {
  JN_CONTACT,
  JN_PINK,
  JN_PROGRAMME_GALLERY,
  JN_SITE,
} from '../../utils/jazzNorthBranding';
import {
  setupJazzNorthExample,
  setupJazzNorthPlaylistExample,
  type JazzNorthSeedMode,
} from '../../utils/setupJazzNorthExample';
import { setupJazzNorthWorksheetPacks } from '../../utils/setupJazzNorthWorksheetPacks';
import { PartnerHubAddButton } from './PartnerHubLayout';
import {
  PartnerOrgHubTemplate,
  type PartnerOrgSeedMode,
} from './PartnerOrgHubTemplate';
import { useMemo, useState } from 'react';

interface JazzNorthPartnerHubProps {
  onAddedToApp?: (info: { sheetId: string }) => void;
  standalone?: boolean;
}

/**
 * Jazz North hub — shared PartnerOrgHubTemplate (Resources + Forums & information + Subscribe).
 */
export function JazzNorthPartnerHub({ onAddedToApp }: JazzNorthPartnerHubProps) {
  const defaults = useMemo(() => getJazzNorthDefaultLayout(), []);
  const [addingWorksheets, setAddingWorksheets] = useState(false);
  const [addedWorksheets, setAddedWorksheets] = useState(false);

  const handleSeed = async (seedKey: string, mode: PartnerOrgSeedMode) => {
    const seedMode: JazzNorthSeedMode = mode;
    try {
      const result =
        seedKey === 'playlist'
          ? await setupJazzNorthPlaylistExample({
              force: true,
              registerPartnerPlanning: true,
              mode: seedMode,
            })
          : await setupJazzNorthExample({
              force: true,
              registerPartnerPlanning: true,
              mode: seedMode,
            });
      const label = seedKey === 'playlist' ? 'Playlist Project' : 'Mr Big';
      if (result.skipped) {
        toast.success(`${label} (${mode}) is already in your library`);
      } else if (mode === 'activities') {
        toast.success(`Added ${result.activities} activities — check Activity Library`);
      } else if (mode === 'lesson') {
        toast.success(`Added ${result.lessons} lesson plan — check Lesson Library`);
      } else {
        toast.success(
          `Added ${result.lessons} lesson · ${result.activities} activities — check Lesson & Activity Library`,
        );
      }
      onAddedToApp?.({ sheetId: result.sheetId });
    } catch (e) {
      console.error(e);
      toast.error('Could not add Jazz North content. Please try again.');
      throw e;
    }
  };

  const runAddAllWorksheets = async () => {
    setAddingWorksheets(true);
    try {
      const result = await setupJazzNorthWorksheetPacks({
        force: true,
        registerPartnerPlanning: true,
      });
      if (result.skipped) {
        toast.success('Jazz North worksheet packs are already in your library');
      } else {
        toast.success(
          `Added ${result.lessons} lessons · ${result.activities} activities from Jazz North packs`,
        );
      }
      setAddedWorksheets(true);
      onAddedToApp?.({ sheetId: result.sheetIds[0] || 'Year 3 Music' });
    } catch (e) {
      console.error(e);
      toast.error('Could not add Jazz North worksheets. Please try again.');
    } finally {
      setAddingWorksheets(false);
    }
  };

  return (
    <PartnerOrgHubTemplate
      defaults={defaults}
      accentBorderClassName="border-pink-200"
      linkClassName="text-pink-800"
      featuredAccentClassName="border-pink-200/80 bg-pink-50/70"
      featuredEyebrowClassName="text-pink-800"
      onSeed={handleSeed}
      footerSlot={
        <div className="space-y-6">
          <section className="space-y-3 rounded-xl border border-pink-200 bg-pink-50/40 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-pink-900">
                  Add all classroom worksheet packs
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Seed every Jazz North worksheet pack (Can You Sing, Hello Song, 2 and 4, Improvisation)
                  into Lesson Library and Activity Library with DreamHost file links.
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Hosted at{' '}
                  <code className="rounded bg-white/80 px-1 text-[11px] text-gray-700">
                    {JAZZ_NORTH_DREAMHOST_BASE_USED}
                  </code>
                </p>
              </div>
              <PartnerHubAddButton
                busy={addingWorksheets}
                done={addedWorksheets}
                onClick={() => void runAddAllWorksheets()}
                className="shrink-0 bg-[#1A0A14] text-white hover:opacity-95"
                label="Add activities to your planner"
                doneLabel="Activities added to your planner"
              />
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Programmes &amp; pathways
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Official Jazz North highlights — click through to jazznorth.org.
                </p>
              </div>
              <a
                href={JN_SITE}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-pink-800 hover:underline"
              >
                jazznorth.org
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </div>
            <div
              className="flex gap-3 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory"
              role="list"
              aria-label="Jazz North programmes"
            >
              {JN_PROGRAMME_GALLERY.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  role="listitem"
                  className="group relative shrink-0 snap-start overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:border-pink-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
                  title={`Open ${item.title} on jazznorth.org`}
                >
                  <img
                    src={item.imageSrc}
                    alt={item.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="block h-36 w-44 object-cover sm:h-40 sm:w-48"
                  />
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2 pb-2 pt-8 text-left text-xs font-semibold leading-snug text-white">
                    {item.title}
                  </span>
                </a>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Contact:{' '}
              <a
                href={JN_CONTACT}
                className="text-pink-800 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                jazznorth.org/contact
              </a>
              {' · '}
              Jazz Camp / Learning:{' '}
              <a href="mailto:helena@jazznorth.org" className="text-pink-800 hover:underline">
                helena@jazznorth.org
              </a>
              . Accent{' '}
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: JN_PINK }} />
            </p>
          </section>
        </div>
      }
    />
  );
}
