import { useState } from 'react';
import { Download, ExternalLink, FileText, Youtube } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  EMS_CONTACT_PAGE,
  EMS_CURRICULUM_PAGE,
  EMS_SCHOOLS_BROCHURE_PDF,
  EMS_SCHOOLS_BROCHURE_TITLE,
  EMS_SITE,
  EMS_YOUTUBE,
} from '../../utils/emsBranding';
import { setupEMSSchoolsExample } from '../../utils/setupEMSSchoolsExample';
import { openActivityResource } from '../../utils/openActivityResource';
import { PartnerHubAddButton, PartnerHubFeaturedSection } from './PartnerHubLayout';

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

const BROCHURE_SECTIONS = [
  'Serving our schools',
  'Play-It!',
  'Learn-It! Together',
  'Band-It!',
  'Musical nurture groups',
  'Be a singing school!',
  'Curriculum resources',
  'Workshops',
  'School Music CPD',
  'Beyond the School Day',
  'Further information',
] as const;

const WORKSHOPS = [
  'Drumming Workshop (West African Djembe, Indian Dhol/Dholak, Samba or Didgeridoo)',
  'Singing Workshop',
  'Create a Song',
  'Rap-It! Workshop',
  'Conductive Music (2-day STEAM project)',
  'DJ Workshop',
  'Music Technology',
  'Ableton Move',
  'Bespoke Workshops',
] as const;

const NETWORKS = [
  'EYFS Network',
  'Primary Music Coordinators',
  'Secondary Music Teachers',
  'A Level Music Teachers',
  'SEND Music Network',
] as const;

export function EmsPartnerHub({ onAddedToApp }: EmsPartnerHubProps) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = async () => {
    setAdding(true);
    try {
      const result = await setupEMSSchoolsExample({
        force: true,
        registerPartnerPlanning: true,
      });
      if (result.skipped) {
        toast.success('Essex Music Service example is already in your local library');
      } else {
        toast.success(
          `Added ${result.lessons} lessons and ${result.activities} activities (local prototype only)`,
        );
      }
      setAdded(true);
      onAddedToApp?.({ sheetId: result.sheetId });
    } catch (e) {
      console.error(e);
      toast.error('Could not add EMS prototype. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
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
        action={
          <PartnerHubAddButton
            busy={adding}
            done={added}
            onClick={() => void handleAdd()}
            className="bg-[#330968] text-white hover:opacity-95"
          />
        }
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
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {BROCHURE_SECTIONS.map((s) => (
            <li
              key={s}
              className="rounded-full bg-[#330968]/8 px-2.5 py-1 text-xs font-medium text-[#330968]"
            >
              {s}
            </li>
          ))}
        </ul>
      </PartnerHubFeaturedSection>

      <section>
        <h3 className="text-lg font-semibold text-gray-900">Curriculum resources</h3>
        <p className="mt-1 text-sm text-gray-600">
          From the EMS Music curriculum and CPD resources page — annual subscription platforms
          (training &amp; CPD included).
        </p>
        <ul className="mt-3 space-y-2">
          {CURRICULUM_PLATFORM.map((p) => (
            <li
              key={p.name}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3"
            >
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
        <a
          href={EMS_CURRICULUM_PAGE}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:underline"
        >
          Full curriculum &amp; CPD page
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900">Workshops</h3>
        <p className="mt-1 text-sm text-gray-600">
          Practical workshops that enhance the music curriculum (£275 per day on the public page).
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
          {WORKSHOPS.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900">CPD, networks &amp; support</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
          <li>Music Improvement, Development and Support (MIDAS)</li>
          <li>Trust-wide and strategic support</li>
          <li>EYFS Music Training</li>
          <li>Arts Award &amp; Artsmark support</li>
        </ul>
        <p className="mt-3 text-sm font-medium text-gray-800">Networks</p>
        <ul className="mt-1 flex flex-wrap gap-1.5">
          {NETWORKS.map((n) => (
            <li
              key={n}
              className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
            >
              {n}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white px-5 py-4">
        <h3 className="text-base font-semibold text-gray-900">Video &amp; social</h3>
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
            href="https://youtu.be/vu2oe0_OBT0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:underline"
          >
            Embedded video on curriculum page
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
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
