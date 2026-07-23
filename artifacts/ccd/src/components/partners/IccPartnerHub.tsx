import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  ICC_COURSES,
  ICC_KS3_TRACK,
  ICC_TEACHER_RESOURCES,
} from '../../utils/iccBranding';
import { setupICCGettingStarted } from '../../utils/setupICCGettingStarted';
import {
  PartnerHubAddButton,
  PartnerHubFeaturedSection,
} from './PartnerHubLayout';

interface IccPartnerHubProps {
  onAddedToApp?: (info: { sheetId: string }) => void;
  standalone?: boolean;
}

const KS3_COURSES = [
  {
    id: 'getting-started',
    title: 'Composition – how to get started!',
    meta: 'FREE · 12 lessons · ~30 min · Beginner · GCSE, KS3, MYP 4/5',
    href: 'https://www.icancompose.com/course/getting-started-with-composition/',
  },
  {
    id: 'fanfare',
    title: 'How to Compose a Fanfare',
    meta: '£15 · 22 lessons · ~2.5 hours · Beginner / Intermediate · GCSE, KS3, MYP 4/5',
    href: 'https://www.icancompose.com/course/how-to-compose-a-fanfare/',
  },
  {
    id: 'video-game',
    title: 'How to Compose Video Game Music Mini Course',
    meta: 'FREE · 11 lessons · ~45 min · Intermediate · GCSE, KS3, MYP 4/5',
    href: 'https://www.icancompose.com/course/video-game-music-free-mini-course/',
  },
] as const;

const TEACHER_HEADINGS = [
  { title: 'Teacher resources', href: ICC_TEACHER_RESOURCES },
  { title: 'Themed posters and calendars', href: ICC_TEACHER_RESOURCES },
  { title: 'Listening packs', href: ICC_TEACHER_RESOURCES },
  { title: 'Downloadable student booklets', href: ICC_TEACHER_RESOURCES },
  { title: 'All courses catalogue', href: ICC_COURSES },
] as const;

/** iCompose hub body — logo / description / contact live in PartnerHubPage. */
export function IccPartnerHub({ onAddedToApp }: IccPartnerHubProps) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

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
        eyebrow="Featured · KS3 course track"
        title="Composition – how to get started!"
        description="Free beginner course from the KS3 track. Prototype Add seeds local planning stubs that link out to the official course page."
        accentClassName="border-sky-200 bg-sky-50/70"
        eyebrowClassName="text-sky-800"
        links={[{ href: ICC_KS3_TRACK, label: 'KS3 course track', icon: 'external' }]}
        action={
          <PartnerHubAddButton
            busy={adding}
            done={added}
            onClick={() => void handleAdd()}
            className="bg-[#1F4B7A] text-white hover:opacity-95"
          />
        }
      />

      <section>
        <h3 className="text-lg font-semibold text-gray-900">KS3 course track</h3>
        <ul className="mt-3 space-y-2">
          {KS3_COURSES.map((c) => (
            <li
              key={c.id}
              className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h4 className="font-semibold text-gray-900">{c.title}</h4>
                <p className="mt-0.5 text-xs text-gray-500">{c.meta}</p>
              </div>
              <a
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-[#1F4B7A] hover:underline"
              >
                Open course
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900">Teacher resources</h3>
        <ul className="mt-2 space-y-1.5">
          {TEACHER_HEADINGS.map((h) => (
            <li key={h.title}>
              <a
                href={h.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:underline"
              >
                {h.title}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
