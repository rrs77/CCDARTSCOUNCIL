import { useState } from 'react';
import { ExternalLink, FileText, Loader2, PlusCircle, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  JN_CONTACT,
  JN_EDUCATORS_FORUM,
  JN_JAZZ_CAMP,
  JN_LEARNING_RESOURCES,
  JN_MR_BIG,
  JN_NEW_NORTHERN,
  JN_NORTHERN_LINE,
  JN_PINK,
  JN_PLAYLIST_PDF,
  JN_PLAYLIST_PROJECT,
  JN_PROGRAMME_GALLERY,
  JN_SHOWCASE_LESSON_PDF,
  JN_SITE,
} from '../../utils/jazzNorthBranding';
import {
  JN_PLAYLIST_SHOWCASE,
  JN_SHOWCASE,
  setupJazzNorthExample,
  setupJazzNorthPlaylistExample,
} from '../../utils/setupJazzNorthExample';
import { openActivityResource } from '../../utils/openActivityResource';
import {
  PartnerHubAddButton,
  PartnerHubFeaturedSection,
} from './PartnerHubLayout';
import { AddToBasketButton } from './AddToBasketButton';
import { formatPricePence, getPaidProduct } from '../../config/paidPartnerProducts';

interface JazzNorthPartnerHubProps {
  onAddedToApp?: (info: { sheetId: string }) => void;
  standalone?: boolean;
}

const OTHER_PACKS = [
  {
    id: 'mr-big',
    title: 'Mr Big scheme of work',
    meta: 'KS1 · Active listening · Optional PSHE',
    href: JN_MR_BIG,
    basketId: 'jn-learning-resources' as string | null,
    seed: 'mr-big' as const,
    pdfUrl: JN_SHOWCASE_LESSON_PDF,
  },
  {
    id: 'playlist',
    title: 'Playlist Project — Milestones',
    meta: 'KS2 · Listening pathway · No jazz experience needed',
    href: JN_PLAYLIST_PROJECT,
    basketId: 'jn-playlist-milestones' as string | null,
    seed: 'playlist' as const,
    pdfUrl: JN_PLAYLIST_PDF,
  },
  {
    id: 'jazz-camp',
    title: 'Jazz Camp for Girls',
    meta: 'Learning & participation · Improvisation camps',
    href: JN_JAZZ_CAMP,
    basketId: null as string | null,
    seed: null,
    pdfUrl: null,
  },
  {
    id: 'educators',
    title: 'Educators’ Forum',
    meta: 'Termly online CPD · Improvisation pedagogy',
    href: JN_EDUCATORS_FORUM,
    basketId: 'jn-educators-forum' as string | null,
    seed: null,
    pdfUrl: null,
  },
  {
    id: 'northern-line',
    title: 'Northern Line',
    meta: 'Live talent development · Northern artists',
    href: JN_NORTHERN_LINE,
    basketId: null as string | null,
    seed: null,
    pdfUrl: null,
  },
  {
    id: 'new-northern',
    title: 'New Northern',
    meta: 'Promoter bursary · Emerging talent',
    href: JN_NEW_NORTHERN,
    basketId: null as string | null,
    seed: null,
    pdfUrl: null,
  },
] as const;

/**
 * Jazz North hub — Drama Resource–style premium template.
 * Each Add seeds Activity Library activities + a Lesson Library plan via prototypeLocalSeed.
 */
export function JazzNorthPartnerHub({ onAddedToApp }: JazzNorthPartnerHubProps) {
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const learningPack = getPaidProduct('jn-learning-resources');

  const markAdded = (id: string) => setAdded((prev) => ({ ...prev, [id]: true }));

  const runSeed = async (kind: 'mr-big' | 'playlist') => {
    setAdding(kind);
    try {
      const result =
        kind === 'playlist'
          ? await setupJazzNorthPlaylistExample({
              force: true,
              registerPartnerPlanning: true,
            })
          : await setupJazzNorthExample({
              force: true,
              registerPartnerPlanning: true,
            });
      const label = kind === 'playlist' ? JN_PLAYLIST_SHOWCASE.title : JN_SHOWCASE.title;
      if (result.skipped) {
        toast.success(`${label} is already in your library`);
      } else {
        toast.success(
          `Added ${result.lessons} lesson · ${result.activities} activities — check Lesson Library & Activity Library`,
        );
      }
      markAdded(kind);
      if (kind === 'mr-big') markAdded('showcase');
      onAddedToApp?.({ sheetId: result.sheetId });
    } catch (e) {
      console.error(e);
      toast.error('Could not add Jazz North prototype. Please try again.');
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="space-y-6">
      <PartnerHubFeaturedSection
        eyebrow="Featured · Learning & Participation"
        title="Learning Resources Area — Improvisation for every classroom"
        description={
          <>
            Free downloadable pathways for curriculum teachers (KS1–4), instrumental tutors and
            lifetime learners. Create a free account on jazznorth.org. Showcase seed:{' '}
            {JN_SHOWCASE.title}.
            {learningPack && (
              <span className="mt-1 block font-medium text-pink-800">
                Demo price {formatPricePence(learningPack.pricePence)} — Add to basket is local only.
              </span>
            )}
            <span className="mt-1 block text-sm text-gray-600">{JN_SHOWCASE.summary}</span>
          </>
        }
        accentClassName="border-pink-200/80 bg-pink-50/70"
        eyebrowClassName="text-pink-800"
        links={[
          { href: JN_LEARNING_RESOURCES, label: 'Learning Resources Area', icon: 'external' },
          { href: JN_SHOWCASE_LESSON_PDF, label: 'Prototype lesson PDF', icon: 'file' },
          { href: JN_SITE, label: 'jazznorth.org', icon: 'external' },
        ]}
        action={
          <div className="flex flex-col gap-2">
            <AddToBasketButton productId="jn-learning-resources" />
            <PartnerHubAddButton
              busy={adding === 'mr-big'}
              done={!!added.showcase || !!added['mr-big']}
              onClick={() => void runSeed('mr-big')}
              className="bg-[#1A0A14] text-white hover:opacity-95"
              label="Add showcase lesson to CCDesigner"
            />
          </div>
        }
      >
        <ul className="mt-3 grid gap-1 text-sm text-gray-700 sm:grid-cols-2">
          {[
            JN_SHOWCASE.title,
            `${JN_SHOWCASE.durationLabel} · full plan for PDF export`,
            'Activities appear in Activity Library',
            'Lesson plan appears in Lesson Library',
          ].map((text) => (
            <li key={text} className="flex gap-2">
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: JN_PINK }}
                aria-hidden
              />
              {text}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-gray-500">
          After Add: open Year 2 Music → Lesson Library and Activity Library, then export PDF.
        </p>
      </PartnerHubFeaturedSection>

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
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Other Jazz North examples (basket demo + Add lesson)
        </h3>
        <ul className="grid gap-3 sm:grid-cols-2">
          {OTHER_PACKS.map((pack) => (
            <li
              key={pack.id}
              className={`flex flex-col justify-between rounded-xl border bg-white p-4 ${
                pack.basketId ? 'border-pink-200 ring-1 ring-pink-100' : 'border-gray-200'
              }`}
            >
              <div>
                <p className="text-xs font-medium text-gray-500">
                  {pack.meta}
                  {pack.basketId && (
                    <span className="ml-1.5 font-semibold text-pink-800">· Demo</span>
                  )}
                </p>
                <h4 className="mt-0.5 font-semibold text-gray-900">{pack.title}</h4>
                <p className="mt-1 text-sm text-gray-600">
                  {pack.seed
                    ? 'Seeds activities + a full lesson plan into CCDesigner (local prototype).'
                    : 'Opens the official Jazz North page — materials stay on their site.'}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={pack.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-pink-800 hover:underline"
                >
                  View on site
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
                {pack.pdfUrl && (
                  <a
                    href={pack.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-gray-600 hover:underline"
                  >
                    <FileText className="h-3.5 w-3.5" aria-hidden />
                    Mock PDF
                  </a>
                )}
                {pack.basketId && (
                  <AddToBasketButton productId={pack.basketId} variant="secondary" />
                )}
                {pack.seed ? (
                  <button
                    type="button"
                    onClick={() => void runSeed(pack.seed)}
                    disabled={adding !== null}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    {adding === pack.seed ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : added[pack.seed] || (pack.seed === 'mr-big' && added.showcase) ? (
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <PlusCircle className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {added[pack.seed] || (pack.seed === 'mr-big' && added.showcase)
                      ? 'Added'
                      : 'Add to CCDesigner'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openActivityResource(pack.href)}
                    className="inline-flex items-center gap-1 rounded-md border border-pink-300 px-2.5 py-1 text-sm font-medium text-pink-900 hover:bg-pink-50"
                  >
                    Open
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
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
          . Playlist showcase: {JN_PLAYLIST_SHOWCASE.title}.
        </p>
      </section>
    </div>
  );
}
