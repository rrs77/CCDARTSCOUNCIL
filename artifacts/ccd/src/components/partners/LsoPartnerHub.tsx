import { useState } from 'react';
import toast from 'react-hot-toast';
import { setupLSOYear6Example } from '../../utils/setupLSOYear6';
import { openActivityResource } from '../../utils/openActivityResource';
import {
  PartnerHubAddButton,
  PartnerHubFeaturedSection,
  PartnerHubResourceList,
  PartnerHubResourceRow,
} from './PartnerHubLayout';

const HTBAO_PAGE =
  'https://www.lso.co.uk/learn-and-discover/digital-activities-and-resources/how-to-build-an-orchestra/';
const LSO_DIGITAL_HUB =
  'https://www.lso.co.uk/learn-and-discover/digital-activities-and-resources/';
const LSO_SCHOOLS =
  'https://www.lso.co.uk/learn-and-discover/activities-for-schools-and-teachers/';

/** Official LSO Discovery projects — only HTBAO seeds into CCDesigner. */
const LSO_PROJECTS = [
  {
    id: 'htbao',
    name: 'How to Build an Orchestra',
    interactive: true,
    href: HTBAO_PAGE,
    blurb:
      'KS1–2 classroom film, family videos and creative projects with Sir Simon Rattle and Rachel Leach.',
  },
  {
    id: 'planets',
    name: 'The Planets',
    interactive: false,
    href: 'https://www.lso.co.uk/learn-and-discover/digital-activities-and-resources/the-planets/',
    blurb: 'KS2 Holst series — videos, lesson plans and quizzes with Rachel Leach and Tim Peake.',
  },
  {
    id: 'alice',
    name: 'The Alice Sound',
    interactive: false,
    href: 'https://thealicesound.com/',
    blurb: 'Wonderland cross-curricular resources with Paul Rissmann’s suites and free downloads.',
  },
  {
    id: 'space',
    name: 'Space … but not as we know it',
    interactive: false,
    href: 'https://www.lso.co.uk/learn-and-discover/digital-activities-and-resources/space-but-not-as-we-know-it/',
    blurb: 'KS2 online concert and classroom packs on how sound travels around an orchestra.',
  },
  {
    id: 'leon',
    name: 'Leon and the Place Between',
    interactive: false,
    href: 'https://www.lso.co.uk/learn-and-discover/digital-activities-and-resources/leon-and-the-place-between/',
    blurb: 'Interactive concert plus downloadable classroom and family resources.',
  },
  {
    id: 'lso-play',
    name: 'LSO Play',
    interactive: false,
    href: 'https://play.lso.co.uk/',
    blurb: 'Multi-angle performances, instrument exploration and masterclasses.',
  },
  {
    id: 'rachel-leach',
    name: 'Rachel Leach listening activities',
    interactive: false,
    href: LSO_DIGITAL_HUB,
    blurb: 'Browse LSO digital resources for listening packs and related activities.',
  },
] as const;

interface LsoPartnerHubProps {
  onAddedToApp?: (info: { sheetId: string }) => void;
  standalone?: boolean;
}

/**
 * LSO hub body — logo / description / contact live in PartnerHubPage.
 */
export function LsoPartnerHub({ onAddedToApp }: LsoPartnerHubProps) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddHtbao = async () => {
    setAdding(true);
    try {
      const result = await setupLSOYear6Example({
        force: true,
        registerPartnerPlanning: true,
      });
      toast.success(
        result.skipped
          ? 'How to Build an Orchestra is already in your library'
          : 'Added How to Build an Orchestra to CCDesigner',
      );
      setAdded(true);
      onAddedToApp?.({ sheetId: result.sheetId || 'Year6' });
    } catch (e) {
      console.error(e);
      toast.error('Could not add LSO content. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <PartnerHubFeaturedSection
        eyebrow="Featured · KS2"
        title="How to Build an Orchestra"
        description="Year 6 classroom unit based on the Hachette / LSO project packs and Mary Auld’s book. Instrument families, classroom film, Beethoven storm and Ravel Boléro."
        accentClassName="border-teal-200 bg-teal-50/60"
        eyebrowClassName="text-teal-800"
        links={[
          { href: HTBAO_PAGE, label: 'LSO resource page', icon: 'external' },
          { href: LSO_DIGITAL_HUB, label: 'All digital resources', icon: 'external' },
          { href: LSO_SCHOOLS, label: 'Schools & teachers', icon: 'external' },
        ]}
        action={
          <PartnerHubAddButton
            busy={adding}
            done={added}
            onClick={() => void handleAddHtbao()}
            label="Add unit to CCDesigner"
          />
        }
      />

      <PartnerHubResourceList
        title="LSO Discovery projects"
        subtitle="Official classroom and family resources. Only How to Build an Orchestra is seeded in CCDesigner for now."
      >
        {LSO_PROJECTS.map((project) => (
          <PartnerHubResourceRow
            key={project.id}
            eyebrow={project.interactive ? 'In CCDesigner' : 'On LSO'}
            title={project.name}
            description={project.blurb}
            links={[{ href: project.href, label: 'Open resource', icon: 'external' }]}
            action={
              project.interactive ? (
                <PartnerHubAddButton
                  busy={adding}
                  done={added}
                  onClick={() => void handleAddHtbao()}
                  variant="secondary"
                  label="Add to CCDesigner"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => openActivityResource(project.href)}
                  className="inline-flex shrink-0 items-center justify-center rounded-lg border border-teal-300 bg-white px-3 py-2.5 text-sm font-semibold text-teal-800 hover:bg-teal-50"
                >
                  Open on LSO
                </button>
              )
            }
          />
        ))}
      </PartnerHubResourceList>
    </div>
  );
}
