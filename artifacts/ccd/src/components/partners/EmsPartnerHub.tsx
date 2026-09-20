import { lazy, Suspense, useState } from 'react';
import { ExternalLink, Youtube } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  EMS_CONTACT_PAGE,
  EMS_CURRICULUM_PAGE,
  EMS_SITE,
  EMS_WORKSHOPS_PAGE,
  EMS_YOUTUBE,
} from '../../utils/emsBranding';
import {
  EMS_WORKSHOP_SHOWCASES,
  setupEMSWorkshop,
  type EmsWorkshopId,
} from '../../utils/setupEMSWorkshops';
import {
  PartnerHubAddButton,
  PartnerHubFeaturedSection,
} from './PartnerHubLayout';
import { AddToBasketButton } from './AddToBasketButton';
import { formatPricePence, getPaidProduct } from '../../config/paidPartnerProducts';
import { musicHubPublicHref, openMusicHubPath } from '../../config/musicHubsDirectory';
import type { EssexDistrictSlug } from '../../config/musicHubsDirectory';
import { GreaterEssexRegionNav } from '../musicHubs/GreaterEssexRegionNav';

const EssexDistrictMap = lazy(() =>
  import('../musicHubs/EssexDistrictMap').then((m) => ({ default: m.EssexDistrictMap })),
);

interface EmsPartnerHubProps {
  onAddedToApp?: (info: { sheetId: string }) => void;
  standalone?: boolean;
}

const CHELMSFORD_HREF = musicHubPublicHref(
  'england/east-of-england/greater-essex/essex-music-service/chelmsford',
);

/**
 * Essex Music Service hub — East of England hubs list + district map first.
 * Workshops / brochure / curriculum packs live on district (borough) pages,
 * not on this service landing page.
 */
export function EmsPartnerHub({ onAddedToApp }: EmsPartnerHubProps) {
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [showWorkshops, setShowWorkshops] = useState(false);
  const djProduct = getPaidProduct('ems-dj-workshop');
  const rapProduct = getPaidProduct('ems-rap-it-workshop');
  const dj = EMS_WORKSHOP_SHOWCASES.dj;
  const rap = EMS_WORKSHOP_SHOWCASES['rap-it'];

  const markAdded = (id: string) => setAdded((prev) => ({ ...prev, [id]: true }));

  const handleAddWorkshop = async (id: EmsWorkshopId) => {
    setAdding(id);
    try {
      const result = await setupEMSWorkshop(id, {
        force: true,
        registerPartnerPlanning: true,
      });
      if (result.skipped) {
        toast.success(`${id === 'dj' ? 'DJ' : 'Rap-It!'} workshop is already in your library`);
      } else {
        toast.success(
          `Added ${result.lessons} detailed lesson · ${result.activities} activities — export PDF from Lesson Library (Year 6 Music)`,
        );
      }
      markAdded(id);
      onAddedToApp?.({ sheetId: result.sheetId });
    } catch (e) {
      console.error(e);
      toast.error('Could not add EMS workshop prototype. Please try again.');
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="space-y-8">
      <p className="text-sm leading-relaxed text-[#002D24]/80">
        <a href="/music-hubs" className="font-semibold text-[#002D24] hover:underline">
          Music Hubs
        </a>
        <span aria-hidden> · </span>
        <a href="/music-hubs/england/east-of-england" className="font-medium hover:underline">
          East of England
        </a>
        <span aria-hidden> · </span>
        <a
          href="/music-hubs/england/east-of-england/greater-essex"
          className="font-medium hover:underline"
        >
          Greater Essex
        </a>
        <span aria-hidden> · </span>
        <span className="font-semibold text-[#330968]">Essex Music Service</span>
      </p>

      <header className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight text-[#002D24] sm:text-2xl">
          Essex Music Service
        </h2>
        <p className="max-w-3xl text-base leading-relaxed text-[#002D24]/80">
          Lead delivery partner for Greater Essex Music Hub. Use the list below to open the East of
          England hubs, then choose a district on the map for local resources — packs and workshops
          are listed on district pages, not here.
        </p>
      </header>

      <GreaterEssexRegionNav
        current="ems"
        title="Hubs in East of England"
        showDistrictEntry={false}
        hubsOnly
      />

      <section
        id="essex-districts"
        className="scroll-mt-6 rounded-2xl border border-[#002D24]/15 bg-white px-4 py-5 shadow-sm sm:px-6 sm:py-6"
      >
        <h3 className="text-lg font-semibold tracking-tight text-[#002D24] sm:text-xl">
          Essex districts map
        </h3>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#002D24]/75 sm:text-base">
          Click a district to open its page. Sample resources (brochure, DJ Workshop, Rap-It!) are
          on the{' '}
          <a href={CHELMSFORD_HREF} className="font-semibold text-[#330968] hover:underline">
            Chelmsford district page
          </a>
          .
        </p>
        <div className="mt-5">
          <Suspense
            fallback={
              <p className="rounded-xl bg-[#E8F0EA]/60 px-4 py-8 text-center text-sm text-[#002D24]/70">
                Loading map…
              </p>
            }
          >
            <EssexDistrictMap
              onSelect={(_slug: EssexDistrictSlug, path: string) => openMusicHubPath(path)}
            />
          </Suspense>
        </div>
      </section>

      <section className="rounded-xl border border-[#002D24]/12 bg-[#E8F0EA]/40 px-4 py-4 sm:px-5">
        <h3 className="text-base font-semibold text-[#002D24]">Official EMS links</h3>
        <p className="mt-1 text-sm leading-relaxed text-[#002D24]/70">
          Booking and the latest programmes live on the Essex Music Service website.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <a
            href={EMS_SITE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#330968] px-3.5 py-2 text-sm font-semibold text-white hover:opacity-95"
          >
            essexmusicservice.org.uk
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
          <a
            href={EMS_WORKSHOPS_PAGE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#330968]/30 bg-white px-3.5 py-2 text-sm font-semibold text-[#330968] hover:bg-[#330968]/5"
          >
            Workshops
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
          <a
            href={EMS_CURRICULUM_PAGE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#330968]/30 bg-white px-3.5 py-2 text-sm font-semibold text-[#330968] hover:bg-[#330968]/5"
          >
            Curriculum &amp; CPD
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
          <a
            href={EMS_YOUTUBE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
          >
            <Youtube className="h-4 w-4" aria-hidden />
            YouTube
          </a>
          <a
            href={EMS_CONTACT_PAGE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-teal-800 hover:underline"
          >
            Contact form
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </div>
      </section>

      <section className="rounded-xl border border-dashed border-[#002D24]/25 bg-white px-4 py-4 sm:px-5">
        <button
          type="button"
          onClick={() => setShowWorkshops((v) => !v)}
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={showWorkshops}
        >
          <span>
            <span className="block text-base font-semibold text-[#002D24]">
              Planner demos (optional)
            </span>
            <span className="mt-0.5 block text-sm text-[#002D24]/65">
              Prefer district pages for resources. These Add-to-planner demos stay available here if
              needed.
            </span>
          </span>
          <span className="shrink-0 text-sm font-semibold text-[#330968]">
            {showWorkshops ? 'Hide' : 'Show'}
          </span>
        </button>

        {showWorkshops && (
          <div className="mt-4 space-y-4 border-t border-[#002D24]/10 pt-4">
            <p className="text-sm text-[#002D24]/70">
              Or open{' '}
              <a href={CHELMSFORD_HREF} className="font-semibold text-[#330968] hover:underline">
                Chelmsford
              </a>{' '}
              for the same packs on a district page.
            </p>
            <PartnerHubFeaturedSection
              eyebrow="Demo · also on Chelmsford district"
              title={dj.title}
              description={
                <>
                  {dj.summary}
                  {djProduct && (
                    <span className="mt-1 block font-medium text-[#3F6212]">
                      Demo booking price {formatPricePence(djProduct.pricePence)}. No payment in
                      this prototype.
                    </span>
                  )}
                </>
              }
              accentClassName="border-[#A3E635]/70 bg-[#F7FEE7]/80"
              eyebrowClassName="text-[#3F6212]"
              links={[{ href: EMS_WORKSHOPS_PAGE, label: 'Official workshops page', icon: 'external' }]}
              action={
                <div className="flex flex-col gap-2">
                  <AddToBasketButton productId="ems-dj-workshop" />
                  <PartnerHubAddButton
                    busy={adding === 'dj'}
                    done={!!added.dj}
                    onClick={() => void handleAddWorkshop('dj')}
                    className="bg-[#330968] text-white hover:opacity-95"
                    label="Add lesson to your planner"
                    doneLabel="Lesson added to your planner"
                  />
                </div>
              }
            />
            <PartnerHubFeaturedSection
              eyebrow="Demo · also on Chelmsford district"
              title={rap.title}
              description={
                <>
                  {rap.summary}
                  {rapProduct && (
                    <span className="mt-1 block font-medium text-[#3F6212]">
                      Demo booking price {formatPricePence(rapProduct.pricePence)}. No payment in
                      this prototype.
                    </span>
                  )}
                </>
              }
              accentClassName="border-[#7a00df]/35 bg-[#7a00df]/5"
              eyebrowClassName="text-[#7a00df]"
              links={[{ href: EMS_WORKSHOPS_PAGE, label: 'Official workshops page', icon: 'external' }]}
              action={
                <div className="flex flex-col gap-2">
                  <AddToBasketButton productId="ems-rap-it-workshop" />
                  <PartnerHubAddButton
                    busy={adding === 'rap-it'}
                    done={!!added['rap-it']}
                    onClick={() => void handleAddWorkshop('rap-it')}
                    className="bg-[#7a00df] text-white hover:opacity-95"
                    label="Add lesson to your planner"
                    doneLabel="Lesson added to your planner"
                  />
                </div>
              }
            />
          </div>
        )}
      </section>
    </div>
  );
}
