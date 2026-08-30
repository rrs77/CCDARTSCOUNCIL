import { useState } from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  TBMH_ABOUT,
  TBMH_CURRICULUM_GUIDANCE,
  TBMH_SERVICES_2026,
  TBMH_SITE,
  TBMH_VIRTUAL_MUSIC_SCHOOL,
} from '../../utils/tbmhBranding';
import {
  TBMH_PROGRAMME_SHOWCASES,
  setupTBMHProgramme,
  type TbmhProgrammeId,
} from '../../utils/setupTBMHProgrammes';
import { openActivityResource } from '../../utils/openActivityResource';
import {
  PartnerHubAddButton,
  PartnerHubFeaturedSection,
} from './PartnerHubLayout';
import { AddToBasketButton } from './AddToBasketButton';
import { formatPricePence, getPaidProduct } from '../../config/paidPartnerProducts';

interface TriBoroughPartnerHubProps {
  onAddedToApp?: (info: { sheetId: string }) => void;
  standalone?: boolean;
}

const FREE_LINKS = [
  {
    title: 'TBMH Virtual Music School',
    blurb: '1,500+ online resources for schools.',
    href: TBMH_VIRTUAL_MUSIC_SCHOOL,
  },
  {
    title: 'Curriculum guidance for schools',
    blurb: 'Free support documents and teaching materials (birth–25).',
    href: TBMH_CURRICULUM_GUIDANCE,
  },
  {
    title: 'Music Hub services 2026–2027',
    blurb: 'Free services vs charged-for traded tuition and WCIL delivery.',
    href: TBMH_SERVICES_2026,
  },
  {
    title: 'About Tri-Borough Music Hub',
    blurb: 'Kensington & Chelsea, Hammersmith & Fulham, Westminster.',
    href: TBMH_ABOUT,
  },
] as const;

/**
 * Tri-Borough Music Hub — EMS-style mock product pages for Groove'n'Play
 * and Music Makes Me (course notes PDF + Add showcase lesson).
 */
export function TriBoroughPartnerHub({ onAddedToApp }: TriBoroughPartnerHubProps) {
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const gnpProduct = getPaidProduct('tbmh-groove-n-play');
  const mmmProduct = getPaidProduct('tbmh-music-makes-me');
  const gnp = TBMH_PROGRAMME_SHOWCASES['groove-n-play'];
  const mmm = TBMH_PROGRAMME_SHOWCASES['music-makes-me'];

  const markAdded = (id: string) => setAdded((prev) => ({ ...prev, [id]: true }));

  const handleAdd = async (id: TbmhProgrammeId) => {
    setAdding(id);
    try {
      const result = await setupTBMHProgramme(id, {
        force: true,
        registerPartnerPlanning: true,
      });
      const label = id === 'groove-n-play' ? "Groove'n'Play" : 'Music Makes Me';
      if (result.skipped) {
        toast.success(`${label} is already in your library`);
      } else {
        toast.success(
          `Added ${result.lessons} detailed lesson · ${result.activities} activities — export PDF from Lesson Library (${result.sheetId})`,
        );
      }
      markAdded(id);
      onAddedToApp?.({ sheetId: result.sheetId });
    } catch (e) {
      console.error(e);
      toast.error('Could not add Tri-Borough prototype. Please try again.');
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="space-y-6">
      <PartnerHubFeaturedSection
        eyebrow="Featured programme · mock product"
        title={gnp.title}
        description={
          <>
            {gnp.summary}
            {gnpProduct && (
              <span className="mt-1 block font-medium text-[#3F6212]">
                Demo basket shows FREE licence (CPD value {formatPricePence(gnpProduct.pricePence)}
                ). No payment is taken in this prototype.
              </span>
            )}
          </>
        }
        accentClassName="border-[#A3E635]/70 bg-[#F7FEE7]/80"
        eyebrowClassName="text-[#3F6212]"
        links={[
          { href: TBMH_SERVICES_2026, label: 'Official school services page', icon: 'external' },
          { href: gnp.pdfUrl, label: 'Example course notes PDF', icon: 'file' },
        ]}
        action={
          <div className="flex flex-col gap-2">
            <AddToBasketButton productId="tbmh-groove-n-play" />
            <PartnerHubAddButton
              busy={adding === 'groove-n-play'}
              done={!!added['groove-n-play']}
              onClick={() => void handleAdd('groove-n-play')}
              className="bg-[#1a1a1a] text-white hover:opacity-95"
              label="Add Groove'n'Play showcase lesson"
            />
          </div>
        }
      >
        <ul className="mt-3 grid gap-1 text-sm text-gray-700 sm:grid-cols-2">
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F5E827]" aria-hidden />
            {gnp.agesLabel}
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F5E827]" aria-hidden />
            {gnp.durationLabel}
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F5E827]" aria-hidden />
            Pulse · groove · class band · dynamics
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F5E827]" aria-hidden />
            Full plan fields for PDF export
          </li>
        </ul>
        <p className="mt-3 text-xs text-gray-500">
          After Add: Year 4 Music → Lesson Library → export the Groove&apos;n&apos;Play lesson to PDF.
        </p>
      </PartnerHubFeaturedSection>

      <PartnerHubFeaturedSection
        eyebrow="Featured resource · mock product"
        title={mmm.title}
        description={
          <>
            {mmm.summary}
            {mmmProduct && (
              <span className="mt-1 block font-medium text-[#3F6212]">
                Demo basket lists this as a FREE hub resource (
                {formatPricePence(mmmProduct.pricePence)}). No payment is taken.
              </span>
            )}
          </>
        }
        accentClassName="border-[#F5E827]/80 bg-[#F5E827]/15"
        eyebrowClassName="text-[#1a1a1a]"
        links={[
          { href: TBMH_CURRICULUM_GUIDANCE, label: 'Curriculum guidance page', icon: 'external' },
          { href: mmm.pdfUrl, label: 'Example course notes PDF', icon: 'file' },
        ]}
        action={
          <div className="flex flex-col gap-2">
            <AddToBasketButton productId="tbmh-music-makes-me" />
            <PartnerHubAddButton
              busy={adding === 'music-makes-me'}
              done={!!added['music-makes-me']}
              onClick={() => void handleAdd('music-makes-me')}
              className="bg-[#1a1a1a] text-[#F5E827] hover:opacity-95"
              label="Add Music Makes Me showcase lesson"
            />
          </div>
        }
      >
        <ul className="mt-3 grid gap-1 text-sm text-gray-700 sm:grid-cols-2">
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1a1a1a]" aria-hidden />
            {mmm.agesLabel}
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1a1a1a]" aria-hidden />
            {mmm.durationLabel}
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1a1a1a]" aria-hidden />
            Social Story · Transition · Wellbeing · Topic · Celebration
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1a1a1a]" aria-hidden />
            Co-create a class / school anthem
          </li>
        </ul>
        <p className="mt-3 text-xs text-gray-500">
          After Add: Year 5 Music → Lesson Library → export the Music Makes Me lesson to PDF.
        </p>
      </PartnerHubFeaturedSection>

      <section>
        <h3 className="text-lg font-semibold text-gray-900">More free TBMH links</h3>
        <p className="mt-1 text-sm text-gray-600">
          Official Tri-Borough Music Hub pages for schools and the Virtual Music School.
        </p>
        <ul className="mt-3 space-y-2">
          {FREE_LINKS.map((item) => (
            <li key={item.href} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-[#1a1a1a] hover:underline"
              >
                {item.title}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
              <p className="mt-1 text-sm text-gray-600">{item.blurb}</p>
              <button
                type="button"
                onClick={() => openActivityResource(item.href)}
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:underline"
              >
                <FileText className="h-3.5 w-3.5" aria-hidden />
                Open
              </button>
            </li>
          ))}
        </ul>
        <a
          href={TBMH_SITE}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:underline"
        >
          triboroughmusichub.org
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </section>
    </div>
  );
}
