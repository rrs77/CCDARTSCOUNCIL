import { useState } from 'react';
import { ExternalLink, FileText, Loader2, PlusCircle, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  DR_CPD,
  DR_DRAMA_GAMES,
  DR_JUST_ADD_DRAMA,
  DR_LESSON_PLANS,
  DR_SITE,
  DR_STRATEGIES,
  DR_TEN_SECOND_OBJECTS,
} from '../../utils/dramaResourceBranding';
import {
  DR_SHOWCASE,
  setupDramaResourceExample,
} from '../../utils/setupDramaResourceExample';
import { openActivityResource } from '../../utils/openActivityResource';
import {
  PartnerHubAddButton,
  PartnerHubFeaturedSection,
} from './PartnerHubLayout';
import { AddToBasketButton } from './AddToBasketButton';
import { formatPricePence, getPaidProduct } from '../../config/paidPartnerProducts';

interface DramaResourcePartnerHubProps {
  onAddedToApp?: (info: { sheetId: string }) => void;
  standalone?: boolean;
}

const OTHER_PACKS = [
  {
    id: 'ten-second',
    title: 'Ten Second Objects (free game)',
    meta: 'Ages 6–adult · 10–20 min · Mime & co-operation',
    href: DR_TEN_SECOND_OBJECTS,
    basketId: null as string | null,
    interactive: true,
  },
  {
    id: 'games',
    title: 'Drama games library',
    meta: 'Warm-ups, improvisation, concentration, storytelling',
    href: DR_DRAMA_GAMES,
    basketId: null as string | null,
    interactive: false,
  },
  {
    id: 'strategies',
    title: 'Drama strategies',
    meta: 'Freeze-frames, teacher-in-role, thought-tracking, Whoosh!',
    href: DR_STRATEGIES,
    basketId: null as string | null,
    interactive: false,
  },
  {
    id: 'lessons',
    title: 'Downloadable lesson plans',
    meta: 'Story units, practitioners, curriculum themes',
    href: DR_LESSON_PLANS,
    basketId: 'dr-lesson-downloads' as string | null,
    interactive: false,
  },
  {
    id: 'cpd',
    title: 'Drama CPD / INSET',
    meta: 'Courses and training with David Farmer',
    href: DR_CPD,
    basketId: null as string | null,
    interactive: false,
  },
] as const;

/**
 * Drama Resource (David Farmer) hub — We Teach Drama–style paid template:
 * featured paid toolkit + basket + mock PDF + Add to CCDesigner showcase lesson.
 */
export function DramaResourcePartnerHub({ onAddedToApp }: DramaResourcePartnerHubProps) {
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const justAdd = getPaidProduct('dr-just-add-drama');

  const markAdded = (id: string) => setAdded((prev) => ({ ...prev, [id]: true }));

  const handleAddShowcase = async () => {
    setAdding('showcase');
    try {
      const result = await setupDramaResourceExample({
        force: true,
        registerPartnerPlanning: true,
      });
      if (result.skipped) {
        toast.success('Drama Resource showcase lesson is already in your library');
      } else {
        toast.success(
          `Added ${result.lessons} detailed lesson · ${result.activities} activities — export to PDF from Lesson Library`,
        );
      }
      markAdded('showcase');
      markAdded('ten-second');
      onAddedToApp?.({ sheetId: result.sheetId });
    } catch (e) {
      console.error(e);
      toast.error('Could not add Drama Resource prototype. Please try again.');
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="space-y-6">
      <PartnerHubFeaturedSection
        eyebrow="Featured paid · David Farmer"
        title="Just Add Drama — The Creative Teacher’s Toolkit"
        description={
          <>
            Online course, videos and lesson plans from Drama Resource (David Farmer) — practical
            strategies for primary, secondary and language teachers.
            {justAdd && (
              <span className="mt-1 block font-medium text-[#3F6212]">
                Demo price {formatPricePence(justAdd.pricePence)} — Add to basket is local only.
              </span>
            )}
            <span className="mt-1 block text-sm text-gray-600">
              {DR_SHOWCASE.summary}
            </span>
          </>
        }
        accentClassName="border-[#A3E635]/70 bg-[#F7FEE7]/80"
        eyebrowClassName="text-[#3F6212]"
        links={[
          { href: DR_JUST_ADD_DRAMA, label: 'Official product page', icon: 'external' },
          { href: DR_SHOWCASE.pdfUrl, label: 'Prototype lesson PDF', icon: 'file' },
          { href: DR_SITE, label: 'dramaresource.com', icon: 'external' },
        ]}
        action={
          <div className="flex flex-col gap-2">
            <AddToBasketButton productId="dr-just-add-drama" />
            <PartnerHubAddButton
              busy={adding === 'showcase'}
              done={!!added['showcase']}
              onClick={() => void handleAddShowcase()}
              className="bg-[#0F3D2E] text-white hover:opacity-95"
              label="Add showcase lesson to CCDesigner"
            />
          </div>
        }
      >
        <ul className="mt-3 grid gap-1 text-sm text-gray-700 sm:grid-cols-2">
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" aria-hidden />
            {DR_SHOWCASE.title}
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" aria-hidden />
            {DR_SHOWCASE.durationLabel} · full plan fields for PDF export
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" aria-hidden />
            Outcomes, criteria, differentiation, assessment
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" aria-hidden />
            Timed activities with teacher notes
          </li>
        </ul>
        <p className="mt-3 text-xs text-gray-500">
          After Add: open Year 5 Drama → Lesson Library → export the showcase lesson to PDF to see
          the full plan layout.
        </p>
      </PartnerHubFeaturedSection>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Other Drama Resource examples (basket demo + links)
        </h3>
        <ul className="grid gap-3 sm:grid-cols-2">
          {OTHER_PACKS.map((pack) => (
            <li
              key={pack.id}
              className={`flex flex-col justify-between rounded-xl border bg-white p-4 ${
                pack.basketId
                  ? 'border-[#A3E635]/50 ring-1 ring-[#A3E635]/25'
                  : 'border-gray-200'
              }`}
            >
              <div>
                <p className="text-xs font-medium text-gray-500">
                  {pack.meta}
                  {pack.basketId && (
                    <span className="ml-1.5 font-semibold text-[#3F6212]">· Paid</span>
                  )}
                </p>
                <h4 className="mt-0.5 font-semibold text-gray-900">{pack.title}</h4>
                <p className="mt-1 text-sm text-gray-600">
                  {pack.interactive
                    ? 'Seeds the full showcase lesson into CCDesigner (local prototype).'
                    : 'Opens the official Drama Resource page — purchase materials on site.'}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={pack.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:underline"
                >
                  View on site
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
                {pack.interactive && (
                  <a
                    href={DR_SHOWCASE.pdfUrl}
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
                {pack.interactive ? (
                  <button
                    type="button"
                    onClick={() => void handleAddShowcase()}
                    disabled={adding !== null}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    {adding === 'showcase' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : added[pack.id] || added['showcase'] ? (
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <PlusCircle className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {added[pack.id] || added['showcase'] ? 'Added' : 'Add to CCDesigner'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openActivityResource(pack.href)}
                    className="inline-flex items-center gap-1 rounded-md border border-emerald-300 px-2.5 py-1 text-sm font-medium text-emerald-900 hover:bg-emerald-50"
                  >
                    Open
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
