import { useState } from 'react';
import { ExternalLink, FileText, Loader2, PlusCircle, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { setupWTDBloodBrothers, WTD_BB_COURSE } from '../../utils/setupWTDBloodBrothers';
import {
  listWeTeachDramaPacks,
  setupWeTeachDramaPack,
  type WtdPackId,
} from '../../utils/setupWeTeachDramaPacks';
import {
  PartnerHubAddButton,
  PartnerHubFeaturedSection,
} from './PartnerHubLayout';
import { AddToBasketButton } from './AddToBasketButton';
import { formatPricePence, getPaidProduct } from '../../config/paidPartnerProducts';

interface WtdPartnerHubProps {
  onBack?: () => void;
  onAddedToApp?: (info: { sheetId: string }) => void;
  standalone?: boolean;
}

const BLOOD_BROTHERS_PRODUCT =
  'https://www.weteachdrama.com/product-page/revise-blood-brothers-scheme-of-learning';

const PACK_BASKET_IDS: Partial<Record<WtdPackId, string>> = {
  cover: 'wtd-cover',
  designer: 'wtd-designer',
  mats: 'wtd-mats',
};

/**
 * We Teach Drama hub body — logo / description / contact live in PartnerHubPage.
 * Paid packs include Add to basket (demo) alongside Add to CCDesigner.
 */
export function WtdPartnerHub({ onAddedToApp }: WtdPartnerHubProps) {
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const packs = listWeTeachDramaPacks();
  const bbProduct = getPaidProduct('wtd-blood-brothers');

  const markAdded = (id: string) => setAdded((prev) => ({ ...prev, [id]: true }));

  const handleAddBloodBrothers = async () => {
    setAdding('blood-brothers');
    try {
      const result = await setupWTDBloodBrothers({
        force: true,
        registerPartnerPlanning: true,
      });
      if (result.skipped) {
        toast.success('Blood Brothers is already in your local library');
      } else {
        toast.success(
          `Added ${result.lessons} lessons · KS4 GCSE Drama (AQA) standards attached`,
        );
      }
      markAdded('blood-brothers');
      onAddedToApp?.({ sheetId: result.sheetId });
    } catch (e) {
      console.error(e);
      toast.error('Could not add Blood Brothers prototype. Please try again.');
    } finally {
      setAdding(null);
    }
  };

  const handleAddPack = async (packId: WtdPackId) => {
    setAdding(packId);
    try {
      const result = await setupWeTeachDramaPack(packId, {
        force: true,
        registerPartnerPlanning: true,
      });
      if (result.skipped) {
        toast.success('Pack already in your local library');
      } else {
        toast.success(
          `Added ${result.lessons} lessons · ${result.keyStage} curriculum standards attached`,
        );
      }
      markAdded(packId);
      onAddedToApp?.({ sheetId: result.sheetId });
    } catch (e) {
      console.error(e);
      toast.error('Could not add pack prototype. Please try again.');
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="space-y-6">
      <PartnerHubFeaturedSection
        eyebrow="Featured paid · KS4 GCSE Drama (AQA)"
        title={WTD_BB_COURSE.title}
        description={
          <>
            Inspired by the publicly listed <em>Revise Blood Brothers Scheme of Learning &amp; CPD
            Video</em>. Lessons use the AQA GCSE Drama objective bank (
            <code className="text-xs">demo-aqa-dr-*</code> + Year 11 Drama standards).
            {bbProduct && (
              <span className="mt-1 block font-medium text-[#3F6212]">
                Demo price {formatPricePence(bbProduct.pricePence)} — Add to basket is local only.
              </span>
            )}
          </>
        }
        accentClassName="border-[#A3E635]/70 bg-[#F7FEE7]/80"
        eyebrowClassName="text-[#3F6212]"
        links={[
          { href: BLOOD_BROTHERS_PRODUCT, label: 'Official product page', icon: 'external' },
          { href: WTD_BB_COURSE.pdfUrl, label: 'Prototype overview PDF', icon: 'file' },
        ]}
        action={
          <div className="flex flex-col gap-2">
            <AddToBasketButton productId="wtd-blood-brothers" />
            <PartnerHubAddButton
              busy={adding === 'blood-brothers'}
              done={added['blood-brothers']}
              onClick={() => void handleAddBloodBrothers()}
              className="bg-[#5B21B6] text-white hover:opacity-95"
            />
          </div>
        }
      >
        <ul className="mt-3 grid gap-1 text-sm text-gray-700 sm:grid-cols-2">
          {WTD_BB_COURSE.lessons.map((lesson) => (
            <li key={lesson.number} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#65A30D]" aria-hidden />
              L{lesson.number}: {lesson.title}
            </li>
          ))}
        </ul>
        <div className="mt-4 overflow-hidden rounded-lg border border-[#A3E635]/40 bg-white">
          <img
            src={WTD_BB_COURSE.shopImage}
            alt="We Teach Drama shop product collage (reference)"
            className="h-auto max-h-56 w-full object-cover object-top"
            loading="lazy"
            decoding="async"
          />
          <p className="px-3 py-2 text-xs text-gray-500">
            Reference image of We Teach Drama shop products (including Revise Blood Brothers).
          </p>
        </div>
      </PartnerHubFeaturedSection>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Other shop examples (basket demo + prototype seed)
        </h3>
        <ul className="grid gap-3 sm:grid-cols-2">
          {packs.map((pack) => {
            const basketId = PACK_BASKET_IDS[pack.id];
            return (
              <li
                key={pack.id}
                className={`flex flex-col justify-between rounded-xl border bg-white p-4 ${
                  basketId
                    ? 'border-[#A3E635]/50 ring-1 ring-[#A3E635]/25'
                    : 'border-gray-200'
                }`}
              >
                <div>
                  <p className="text-xs font-medium text-gray-500">
                    {pack.agesLabel} · {pack.keyStage} standards
                    {basketId && (
                      <span className="ml-1.5 font-semibold text-[#3F6212]">· Paid</span>
                    )}
                  </p>
                  <h4 className="mt-0.5 font-semibold text-gray-900">{pack.title}</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    Seeds mock lessons/activities with curriculumType CUSTOM and pre-set objectives for
                    this age range. Official paid pack stays on We Teach Drama.
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={pack.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:underline"
                  >
                    View on site
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                  <a
                    href={pack.pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-gray-600 hover:underline"
                  >
                    <FileText className="h-3.5 w-3.5" aria-hidden />
                    Mock PDF
                  </a>
                  {basketId && (
                    <AddToBasketButton productId={basketId} variant="secondary" />
                  )}
                  <button
                    type="button"
                    onClick={() => void handleAddPack(pack.id)}
                    disabled={adding !== null}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    {adding === pack.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : added[pack.id] ? (
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <PlusCircle className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {added[pack.id] ? 'Added' : 'Add to CCDesigner'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
