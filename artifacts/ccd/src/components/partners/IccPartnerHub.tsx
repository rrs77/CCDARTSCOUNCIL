import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  ICC_COURSES,
  ICC_KS3_TRACK,
  ICC_TEACHER_RESOURCES,
} from '../../utils/iccBranding';
import { setupICCGettingStarted } from '../../utils/setupICCGettingStarted';
import { openActivityResource } from '../../utils/openActivityResource';
import {
  PartnerHubAddButton,
  PartnerHubFeaturedSection,
  PartnerHubResourceList,
  PartnerHubResourceRow,
} from './PartnerHubLayout';
import { AddToBasketButton } from './AddToBasketButton';
import { formatPricePence, getPaidProduct } from '../../config/paidPartnerProducts';

interface IccPartnerHubProps {
  onAddedToApp?: (info: { sheetId: string }) => void;
  standalone?: boolean;
}

const KS3_COURSES = [
  {
    id: 'getting-started',
    title: 'Composition – how to get started!',
    interactive: true,
    paid: false,
    basketProductId: null as string | null,
    meta: 'FREE · 12 lessons · ~30 min · Beginner · GCSE, KS3, MYP 4/5',
    href: 'https://www.icancompose.com/course/getting-started-with-composition/',
  },
  {
    id: 'fanfare',
    title: 'How to Compose a Fanfare',
    interactive: false,
    paid: true,
    basketProductId: 'icc-fanfare',
    meta: '£15 · 22 lessons · ~2.5 hours · Beginner / Intermediate · GCSE, KS3, MYP 4/5',
    href: 'https://www.icancompose.com/course/how-to-compose-a-fanfare/',
  },
  {
    id: 'video-game',
    title: 'How to Compose Video Game Music Mini Course',
    interactive: false,
    paid: false,
    basketProductId: null as string | null,
    meta: 'FREE · 11 lessons · ~45 min · Intermediate · GCSE, KS3, MYP 4/5',
    href: 'https://www.icancompose.com/course/video-game-music-free-mini-course/',
  },
  {
    id: 'teacher-resources',
    title: 'Teacher resources',
    interactive: false,
    paid: false,
    basketProductId: null as string | null,
    meta: 'Posters, listening packs and downloadable student booklets',
    href: ICC_TEACHER_RESOURCES,
  },
  {
    id: 'catalogue',
    title: 'All courses catalogue',
    interactive: false,
    paid: false,
    basketProductId: null as string | null,
    meta: 'Browse the full iCompose course list',
    href: ICC_COURSES,
  },
] as const;

/** iCompose hub body — same LSO template: featured + resource list. */
export function IccPartnerHub({ onAddedToApp }: IccPartnerHubProps) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const fanfare = getPaidProduct('icc-fanfare');

  const handleAdd = async () => {
    setAdding(true);
    try {
      const result = await setupICCGettingStarted({
        force: true,
        registerPartnerPlanning: true,
      });
      if (result.skipped) {
        toast.success('Getting Started composition example is already in your library');
      } else {
        toast.success(
          `Added ${result.lessons} lessons and ${result.activities} activities (local prototype only)`,
        );
      }
      setAdded(true);
      onAddedToApp?.({ sheetId: result.sheetId });
    } catch (e) {
      console.error(e);
      toast.error('Could not add iCompose prototype. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <PartnerHubFeaturedSection
        eyebrow="Featured · Free KS3 course track"
        title="Composition – how to get started!"
        description="Free beginner course from the KS3 track. Prototype Add seeds local planning stubs that link out to the official course page. Paid courses below include Add to basket (demo)."
        accentClassName="border-sky-200 bg-sky-50/70"
        eyebrowClassName="text-sky-800"
        links={[
          { href: ICC_KS3_TRACK, label: 'KS3 course track', icon: 'external' },
          {
            href: 'https://www.icancompose.com/course/getting-started-with-composition/',
            label: 'Course page',
            icon: 'external',
          },
        ]}
        action={
          <PartnerHubAddButton
            busy={adding}
            done={added}
            onClick={() => void handleAdd()}
            className="bg-[#0a1628] text-white hover:opacity-95"
            label="Add unit to CCDesigner"
          />
        }
      />

      <section
        className="rounded-2xl border border-[#A3E635]/60 bg-[#F7FEE7]/70 px-5 py-5 sm:px-6"
        aria-labelledby="icc-paid-heading"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3F6212]">
          Paid course example
        </p>
        <h3 id="icc-paid-heading" className="mt-1 text-lg font-semibold text-gray-900 sm:text-xl">
          How to Compose a Fanfare
        </h3>
        <p className="mt-1.5 max-w-2xl text-sm text-gray-600">
          Official paid course on icancompose.com.
          {fanfare && (
            <>
              {' '}
              Demo basket price {formatPricePence(fanfare.pricePence)} — no payment is taken in
              this prototype.
            </>
          )}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <AddToBasketButton productId="icc-fanfare" />
          <a
            href="https://www.icancompose.com/course/how-to-compose-a-fanfare/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg border border-[#002D24]/20 bg-white px-3.5 py-2.5 text-sm font-semibold text-[#002D24] hover:bg-white/80"
          >
            View on iCompose
          </a>
        </div>
      </section>

      <PartnerHubResourceList
        title="iCompose courses & resources"
        subtitle="Official course and teacher links. Only Getting Started is seeded in CCDesigner for now. Paid rows include Add to basket (demo)."
      >
        {KS3_COURSES.map((c) => (
          <PartnerHubResourceRow
            key={c.id}
            eyebrow={
              c.paid
                ? 'Paid · demo basket'
                : c.interactive
                  ? 'In CCDesigner'
                  : 'On iCompose'
            }
            title={c.title}
            description={c.meta}
            links={[{ href: c.href, label: 'Open resource', icon: 'external' }]}
            action={
              c.interactive ? (
                <PartnerHubAddButton
                  busy={adding}
                  done={added}
                  onClick={() => void handleAdd()}
                  variant="secondary"
                  label="Add to CCDesigner"
                />
              ) : c.basketProductId ? (
                <div className="flex flex-col gap-2">
                  <AddToBasketButton productId={c.basketProductId} variant="secondary" />
                  <button
                    type="button"
                    onClick={() => openActivityResource(c.href)}
                    className="inline-flex shrink-0 items-center justify-center rounded-lg border border-sky-300 bg-white px-3 py-2.5 text-sm font-semibold text-sky-900 hover:bg-sky-50"
                  >
                    Open
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openActivityResource(c.href)}
                  className="inline-flex shrink-0 items-center justify-center rounded-lg border border-sky-300 bg-white px-3 py-2.5 text-sm font-semibold text-sky-900 hover:bg-sky-50"
                >
                  Open
                </button>
              )
            }
          />
        ))}
      </PartnerHubResourceList>
    </div>
  );
}
