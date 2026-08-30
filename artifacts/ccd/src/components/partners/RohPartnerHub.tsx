import { useState } from 'react';
import toast from 'react-hot-toast';
import { ROH_RJ_COURSE, setupROHRomeoJuliet } from '../../utils/setupROHRomeoJuliet';
import {
  PartnerHubAddButton,
  PartnerHubFeaturedSection,
  PartnerHubResourceList,
  PartnerHubResourceRow,
} from './PartnerHubLayout';

interface RohPartnerHubProps {
  onBack?: () => void;
  onAddedToApp?: (info: { sheetId: string }) => void;
  standalone?: boolean;
}

/**
 * ROH hub body — logo / description / contact live in PartnerHubPage.
 */
export function RohPartnerHub({ onAddedToApp }: RohPartnerHubProps) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddAll = async () => {
    setAdding(true);
    try {
      const result = await setupROHRomeoJuliet({
        force: true,
        registerPartnerPlanning: true,
      });
      if (result.skipped) {
        toast.success('Romeo and Juliet is already in your library');
      } else {
        toast.success(
          `Added ${result.lessons} lessons and ${result.activities} activities to CCDesigner`,
        );
      }
      setAdded(true);
      onAddedToApp?.({ sheetId: result.sheetId || 'Year5' });
    } catch (e) {
      console.error(e);
      toast.error('Could not add ROH content. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <PartnerHubFeaturedSection
        eyebrow="Featured course · KS2"
        title={ROH_RJ_COURSE.title}
        description="Together with your dancers, explore Romeo and Juliet and work towards creating a dance to share. Five example lessons (~60 minutes), adaptable as bite-sized activities."
        accentClassName="border-violet-200 bg-violet-50/60"
        eyebrowClassName="text-violet-700"
        links={[
          { href: ROH_RJ_COURSE.courseUrl, label: 'Open course on RBO', icon: 'external' },
          { href: ROH_RJ_COURSE.curriculumMapPdf, label: 'Curriculum Map PDF', icon: 'file' },
          { href: ROH_RJ_COURSE.synopsisPdf, label: 'Synopsis & characters PDF', icon: 'file' },
          {
            href: ROH_RJ_COURSE.classroomResourcesUrl,
            label: 'Classroom resources',
            icon: 'external',
          },
          { href: ROH_RJ_COURSE.resourceBankUrl, label: 'Resource bank', icon: 'external' },
        ]}
        action={
          <PartnerHubAddButton
            busy={adding}
            done={added}
            onClick={() => void handleAddAll()}
            label="Add unit to CCDesigner"
          />
        }
      >
        <ul className="mt-3 grid gap-1 text-sm text-gray-700 sm:grid-cols-2">
          {ROH_RJ_COURSE.learningObjectives.map((obj) => (
            <li key={obj} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-600" aria-hidden />
              {obj}
            </li>
          ))}
        </ul>
      </PartnerHubFeaturedSection>

      <PartnerHubResourceList
        title="Romeo and Juliet lessons"
        subtitle="Each row links to official RBO Schools materials. Add seeds the full local unit."
      >
        {ROH_RJ_COURSE.lessons.map((lesson) => (
          <PartnerHubResourceRow
            key={lesson.number}
            eyebrow={`Lesson ${lesson.number} · 60 min`}
            title={lesson.title}
            description={lesson.summary}
            links={[
              { href: lesson.url, label: 'View on RBO Schools', icon: 'external' },
              { href: lesson.planPdf, label: 'Lesson plan', icon: 'file' },
              { href: lesson.cheatPdf, label: 'Cheat sheet', icon: 'file' },
              { href: lesson.slidesPptx, label: 'Slides', icon: 'external' },
            ]}
            action={
              <PartnerHubAddButton
                busy={adding}
                done={added}
                onClick={() => void handleAddAll()}
                label="Add to CCDesigner"
                doneLabel="Added"
                variant="secondary"
              />
            }
          />
        ))}
      </PartnerHubResourceList>
    </div>
  );
}
