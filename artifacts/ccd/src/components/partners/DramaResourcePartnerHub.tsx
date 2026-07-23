import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
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
import { setupDramaResourceExample } from '../../utils/setupDramaResourceExample';
import {
  PartnerHubAddButton,
  PartnerHubFeaturedSection,
} from './PartnerHubLayout';

interface DramaResourcePartnerHubProps {
  onAddedToApp?: (info: { sheetId: string }) => void;
  standalone?: boolean;
}

const FEATURED_LINKS = [
  {
    id: 'games',
    title: 'Drama games',
    meta: 'Warm-ups, improvisation, concentration and group dynamics',
    href: DR_DRAMA_GAMES,
  },
  {
    id: 'strategies',
    title: 'Drama strategies',
    meta: 'Teacher-in-role, freeze-frames and classroom techniques',
    href: DR_STRATEGIES,
  },
  {
    id: 'lessons',
    title: 'Drama lesson plans',
    meta: 'Downloadable units linked to stories, themes and practitioners',
    href: DR_LESSON_PLANS,
  },
  {
    id: 'just-add',
    title: 'Just Add Drama',
    meta: 'Creative Teacher’s Toolkit — online course, videos and lesson plans',
    href: DR_JUST_ADD_DRAMA,
  },
  {
    id: 'cpd',
    title: 'Drama CPD / INSET',
    meta: 'Courses and training with David Farmer',
    href: DR_CPD,
  },
] as const;

/** Drama Resource hub body — logo / description / contact live in PartnerHubPage. */
export function DramaResourcePartnerHub({ onAddedToApp }: DramaResourcePartnerHubProps) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = async () => {
    setAdding(true);
    try {
      const result = await setupDramaResourceExample({
        force: true,
        registerPartnerPlanning: true,
      });
      if (result.skipped) {
        toast.success('Ten Second Objects example is already in your local library');
      } else {
        toast.success(
          `Added ${result.lessons} lessons and ${result.activities} activities (local prototype only)`,
        );
      }
      setAdded(true);
      onAddedToApp?.({ sheetId: result.sheetId });
    } catch (e) {
      console.error(e);
      toast.error('Could not add Drama Resource prototype. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <PartnerHubFeaturedSection
        eyebrow="Featured · Drama game"
        title="Ten Second Objects"
        description="Classic body-shape warm-up from David Farmer’s Drama Resource games library. Prototype Add seeds local planning stubs that link out to the official page."
        accentClassName="border-emerald-200 bg-emerald-50/70"
        eyebrowClassName="text-emerald-900"
        links={[
          { href: DR_TEN_SECOND_OBJECTS, label: 'Open Ten Second Objects', icon: 'external' },
          { href: DR_SITE, label: 'dramaresource.com', icon: 'external' },
        ]}
        action={
          <PartnerHubAddButton
            busy={adding}
            done={added}
            onClick={() => void handleAdd()}
            className="bg-[#0F3D2E] text-white hover:opacity-95"
          />
        }
      />

      <section>
        <h3 className="text-lg font-semibold text-gray-900">Teacher resources</h3>
        <ul className="mt-3 space-y-2">
          {FEATURED_LINKS.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h4 className="font-semibold text-gray-900">{item.title}</h4>
                <p className="mt-0.5 text-xs text-gray-500">{item.meta}</p>
              </div>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-[#0F3D2E] hover:underline"
              >
                Open
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
