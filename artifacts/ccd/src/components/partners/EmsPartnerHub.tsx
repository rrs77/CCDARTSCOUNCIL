import { useState } from 'react';
import { ChevronRight, Download, ExternalLink, FileText, Youtube } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  EMS_CONTACT_PAGE,
  EMS_CURRICULUM_PAGE,
  EMS_SCHOOLS_BROCHURE_PDF,
  EMS_SCHOOLS_BROCHURE_TITLE,
  EMS_SITE,
  EMS_WORKSHOPS_PAGE,
  EMS_YOUTUBE,
} from '../../utils/emsBranding';
import {
  EMS_WORKSHOP_SHOWCASES,
  setupEMSWorkshop,
  type EmsWorkshopId,
} from '../../utils/setupEMSWorkshops';
import { openActivityResource } from '../../utils/openActivityResource';
import {
  PartnerHubAddButton,
  PartnerHubFeaturedSection,
} from './PartnerHubLayout';
import { AddToBasketButton } from './AddToBasketButton';
import { formatPricePence, getPaidProduct } from '../../config/paidPartnerProducts';

interface EmsPartnerHubProps {
  onAddedToApp?: (info: { sheetId: string }) => void;
  standalone?: boolean;
}

const CURRICULUM_PLATFORM = [
  {
    name: 'Charanga',
    blurb: 'Online music platform for curriculum and extra-curricular learning across primary, secondary and SEND.',
    href: 'https://charanga.com/',
  },
  {
    name: 'YuStudio',
    blurb: 'Cloud-based DAW with unlimited users — work at school or home (KS2–5).',
    href: 'https://www.yustudio.com/',
  },
  {
    name: 'Focus on Sound',
    blurb: 'Curriculum and assessment support, including GCSE and A Level (KS3–5).',
    href: 'https://portal.focusonsound.com',
  },
] as const;

const OTHER_WORKSHOPS = [
  'Drumming Workshop (West African Djembe, Indian Dhol/Dholak, Samba or Didgeridoo)',
  'Singing Workshop / Sing-It!',
  'Create a Song / Create-It!',
  'Conductive Music (2-day STEAM project)',
  'Music Technology',
  'Ableton Move',
  'Bespoke Workshops',
] as const;

/**
 * Essex Music Service hub — brochure PDF plus Drama Resource–style mock product pages
 * for DJ Workshop and Rap-It! (course notes PDF + add lesson to planner).
 */
export function EmsPartnerHub({ onAddedToApp }: EmsPartnerHubProps) {
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Record<string, boolean>>({});
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
    <div className="space-y-6">
      <section
        className="rounded-xl border border-[#002D24]/15 bg-white px-4 py-4 shadow-sm sm:px-5"
        aria-labelledby="eoe-other-hubs-heading"
      >
        <h3
          id="eoe-other-hubs-heading"
          className="text-base font-semibold tracking-tight text-[#002D24] sm:text-lg"
        >
          Other hubs in East of England
        </h3>
        <p className="mt-1 text-sm text-[#002D24]/70">
          Greater Essex Music Hub brings together Essex Music Service, Music-on-Sea (Southend) and
          Thurrock Music Service. Open sibling hubs below, or return to Partner Hubs for EMS.
        </p>
        <ul className="mt-3 space-y-1.5" aria-label="Greater Essex hubs">
          <li>
            <div className="rounded-xl border border-[#330968]/35 bg-[#F5F0FF] px-3 py-2.5">
              <p className="text-sm font-semibold text-[#330968]">Essex Music Service</p>
              <p className="mt-0.5 text-xs text-[#330968]/75">
                Lead delivery partner · you are here
              </p>
            </div>
          </li>
          <li>
            <a
              href="https://www.musiconsea.co.uk/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start justify-between gap-3 rounded-xl border border-[#002D24]/12 bg-[#E8F0EA]/35 px-3 py-2.5 hover:border-[#002D24]/35 hover:bg-[#E8F0EA]"
            >
              <span>
                <span className="block text-sm font-semibold text-[#002D24]">
                  Music-on-Sea (Southend)
                </span>
                <span className="mt-0.5 block text-xs text-[#002D24]/60">
                  Southend-on-Sea music education · official site
                </span>
              </span>
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-[#002D24]/45" aria-hidden />
            </a>
          </li>
          <li>
            <a
              href="https://www.thurrock.gov.uk/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start justify-between gap-3 rounded-xl border border-[#002D24]/12 bg-[#E8F0EA]/35 px-3 py-2.5 hover:border-[#002D24]/35 hover:bg-[#E8F0EA]"
            >
              <span>
                <span className="block text-sm font-semibold text-[#002D24]">
                  Thurrock Music Service
                </span>
                <span className="mt-0.5 block text-xs text-[#002D24]/60">
                  Thurrock schools and young people · Thurrock Council
                </span>
              </span>
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-[#002D24]/45" aria-hidden />
            </a>
          </li>
          <li>
            <a
              href="/?tab=our-partners"
              className="flex items-start justify-between gap-3 rounded-xl border border-[#002D24]/12 bg-[#E8F0EA]/35 px-3 py-2.5 hover:border-[#002D24]/35 hover:bg-[#E8F0EA]"
            >
              <span>
                <span className="block text-sm font-semibold text-[#002D24]">
                  Greater Essex / Partner Hubs
                </span>
                <span className="mt-0.5 block text-xs text-[#002D24]/60">
                  Back to Partner Hubs (EMS card)
                </span>
              </span>
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[#002D24]/45" aria-hidden />
            </a>
          </li>
        </ul>
      </section>

      <PartnerHubFeaturedSection
        eyebrow="Featured workshop · mock product"
        title={dj.title}
        description={
          <>
            {dj.summary}
            {djProduct && (
              <span className="mt-1 block font-medium text-[#3F6212]">
                Demo booking price {formatPricePence(djProduct.pricePence)} — matches EMS public
                £250/day listing. No payment is taken in this prototype.
              </span>
            )}
          </>
        }
        accentClassName="border-[#A3E635]/70 bg-[#F7FEE7]/80"
        eyebrowClassName="text-[#3F6212]"
        links={[
          { href: EMS_WORKSHOPS_PAGE, label: 'Official workshops page', icon: 'external' },
          { href: dj.pdfUrl, label: 'Example course notes PDF', icon: 'file' },
        ]}
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
      >
        <ul className="mt-3 grid gap-1 text-sm text-gray-700 sm:grid-cols-2">
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7a00df]" aria-hidden />
            {dj.agesLabel}
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7a00df]" aria-hidden />
            {dj.durationLabel}
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7a00df]" aria-hidden />
            Hands-on decks · beat matching · mini mix
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7a00df]" aria-hidden />
            Full plan fields for PDF export
          </li>
        </ul>
        <p className="mt-3 text-xs text-gray-500">
          After Add: Year 6 Music → Lesson Library → export the DJ Workshop lesson to PDF.
        </p>
      </PartnerHubFeaturedSection>

      <PartnerHubFeaturedSection
        eyebrow="Featured workshop · mock product"
        title={rap.title}
        description={
          <>
            {rap.summary}
            {rapProduct && (
              <span className="mt-1 block font-medium text-[#3F6212]">
                Demo booking price {formatPricePence(rapProduct.pricePence)} — matches EMS public
                £250/day listing. No payment is taken in this prototype.
              </span>
            )}
          </>
        }
        accentClassName="border-[#7a00df]/35 bg-[#7a00df]/5"
        eyebrowClassName="text-[#7a00df]"
        links={[
          { href: EMS_WORKSHOPS_PAGE, label: 'Official workshops page', icon: 'external' },
          { href: rap.pdfUrl, label: 'Example course notes PDF', icon: 'file' },
        ]}
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
      >
        <ul className="mt-3 grid gap-1 text-sm text-gray-700 sm:grid-cols-2">
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#330968]" aria-hidden />
            {rap.agesLabel}
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#330968]" aria-hidden />
            {rap.durationLabel}
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#330968]" aria-hidden />
            Rap · hip-hop · grime · spoken word
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#330968]" aria-hidden />
            Confidence + literacy links (English)
          </li>
        </ul>
        <p className="mt-3 text-xs text-gray-500">
          After Add: Year 6 Music → Lesson Library → export the Rap-It! lesson to PDF.
        </p>
      </PartnerHubFeaturedSection>

      <PartnerHubFeaturedSection
        eyebrow="Featured brochure · PDF"
        title={EMS_SCHOOLS_BROCHURE_TITLE}
        description="Essex Music Service Schools digital brochure — overview of Play-It!, Learn-It! Together, Band-It!, singing schools, curriculum resources, workshops, CPD and more."
        accentClassName="border-[#7a00df]/40 bg-[#7a00df]/5"
        eyebrowClassName="text-[#7a00df]"
        links={[
          { href: EMS_SCHOOLS_BROCHURE_PDF, label: 'Open brochure PDF', icon: 'file' },
          { href: EMS_CURRICULUM_PAGE, label: 'Curriculum & CPD page', icon: 'external' },
        ]}
      >
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openActivityResource(EMS_SCHOOLS_BROCHURE_PDF)}
            className="inline-flex items-center gap-2 rounded-lg border border-[#330968]/30 bg-white px-3 py-2 text-sm font-semibold text-[#330968] hover:bg-[#330968]/5"
          >
            <FileText className="h-4 w-4" aria-hidden />
            View PDF in app
          </button>
          <a
            href={EMS_SCHOOLS_BROCHURE_PDF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#330968] px-3 py-2 text-sm font-semibold text-white hover:opacity-95"
          >
            <Download className="h-4 w-4" aria-hidden />
            Download brochure
          </a>
        </div>
      </PartnerHubFeaturedSection>

      <section>
        <h3 className="text-lg font-semibold text-gray-900">Other workshops</h3>
        <p className="mt-1 text-sm text-gray-600">
          Also listed on the EMS curriculum enhancement page (£250/day). DJ and Rap-It! have full
          mock product pages above.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
          {OTHER_WORKSHOPS.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
        <a
          href={EMS_WORKSHOPS_PAGE}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:underline"
        >
          All workshops on EMS site
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900">Curriculum resources</h3>
        <p className="mt-1 text-sm text-gray-600">
          Annual subscription platforms (training &amp; CPD included on the public EMS page).
        </p>
        <ul className="mt-3 space-y-2">
          {CURRICULUM_PLATFORM.map((p) => (
            <li key={p.name} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
              <a
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-[#330968] hover:underline"
              >
                {p.name}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
              <p className="mt-1 text-sm text-gray-600">{p.blurb}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white px-5 py-4">
        <h3 className="text-base font-semibold text-gray-900">Video &amp; contact</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          <a
            href={EMS_YOUTUBE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
          >
            <Youtube className="h-4 w-4" aria-hidden />
            Essex Music Service on YouTube
          </a>
          <a
            href={EMS_SITE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:underline"
          >
            essexmusicservice.org.uk
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
          <a
            href={EMS_CONTACT_PAGE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:underline"
          >
            Contact form
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </div>
      </section>
    </div>
  );
}
