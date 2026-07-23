import { useState } from 'react';
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
import { openActivityResource } from '../../utils/openActivityResource';
import {
  PartnerHubAddButton,
  PartnerHubFeaturedSection,
  PartnerHubResourceList,
  PartnerHubResourceRow,
} from './PartnerHubLayout';

interface DramaResourcePartnerHubProps {
  onAddedToApp?: (info: { sheetId: string }) => void;
  standalone?: boolean;
}

const DR_RESOURCES = [
  {
    id: 'games',
    title: 'Drama games',
    kind: 'Library',
    href: DR_DRAMA_GAMES,
    blurb: 'Warm-ups, improvisation, concentration and group dynamics.',
  },
  {
    id: 'strategies',
    title: 'Drama strategies',
    kind: 'Library',
    href: DR_STRATEGIES,
    blurb: 'Teacher-in-role, freeze-frames and classroom techniques.',
  },
  {
    id: 'lessons',
    title: 'Drama lesson plans',
    kind: 'Plans',
    href: DR_LESSON_PLANS,
    blurb: 'Downloadable units linked to stories, themes and practitioners.',
  },
  {
    id: 'just-add',
    title: 'Just Add Drama',
    kind: 'Toolkit',
    href: DR_JUST_ADD_DRAMA,
    blurb: 'Creative Teacher’s Toolkit — online course, videos and lesson plans.',
  },
  {
    id: 'cpd',
    title: 'Drama CPD / INSET',
    kind: 'CPD',
    href: DR_CPD,
    blurb: 'Courses and training with David Farmer.',
  },
] as const;

/** Drama Resource hub body — same LSO template: featured + resource list. */
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

      <PartnerHubResourceList
        title="Teacher resources"
        subtitle="Official Drama Resource libraries and CPD. Only Ten Second Objects is seeded in CCDesigner for now."
      >
        {DR_RESOURCES.map((item) => (
          <PartnerHubResourceRow
            key={item.id}
            eyebrow={item.kind}
            title={item.title}
            description={item.blurb}
            links={[{ href: item.href, label: 'Open resource', icon: 'external' }]}
            action={
              <button
                type="button"
                onClick={() => openActivityResource(item.href)}
                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-emerald-300 bg-white px-3 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
              >
                Open
              </button>
            }
          />
        ))}
      </PartnerHubResourceList>
    </div>
  );
}
