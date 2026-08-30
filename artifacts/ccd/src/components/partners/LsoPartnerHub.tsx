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
const LSO_TES = 'https://www.tes.com/member/lsodiscovery';

/**
 * Official LSO Discovery resources from
 * https://www.lso.co.uk/learn-and-discover/digital-activities-and-resources/
 * Only HTBAO seeds into CCDesigner.
 */
const LSO_PROJECTS = [
  {
    id: 'htbao',
    name: 'How to Build an Orchestra',
    band: 'KS2',
    interactive: true,
    href: HTBAO_PAGE,
    blurb:
      'Ages 7–12 — classroom film with Sir Simon Rattle & Rachel Leach, family videos and creative projects inspired by Mary Auld’s book.',
  },
  {
    id: 'planets',
    name: 'The Planets',
    band: 'KS2 · Featured on LSO',
    interactive: false,
    href: 'https://lso.co.uk/planets',
    blurb:
      'Ages 7–12 — Holst suite with videos, games and lesson plans featuring Rachel Leach, Sir Antonio Pappano and Tim Peake.',
  },
  {
    id: 'alice',
    name: 'The Alice Sound',
    band: 'KS2',
    interactive: false,
    href: 'https://www.thealicesound.com/',
    blurb: 'Ages 7–12 — Wonderland cross-curricular resources with Paul Rissmann’s suites and free downloads.',
  },
  {
    id: 'space',
    name: 'Space … but not as we know it',
    band: 'KS2',
    interactive: false,
    href: 'https://www.lso.co.uk/learn-and-discover/digital-activities-and-resources/space-but-not-as-we-know-it/',
    blurb: 'Ages 7–12 — online concert and classroom packs on how sound travels around an orchestra.',
  },
  {
    id: 'leon',
    name: 'Leon and the Place Between',
    band: 'KS2',
    interactive: false,
    href: 'https://www.lso.co.uk/learn-and-discover/digital-activities-and-resources/leon-and-the-place-between/',
    blurb: 'Ages 7–12 — interactive concert plus downloadable classroom and family resources.',
  },
  {
    id: 'lso-play',
    name: 'LSO Play',
    band: 'KS2',
    interactive: false,
    href: 'https://play.lso.co.uk/',
    blurb: 'Ages 7–12 — multi-angle performances, instrument exploration and masterclasses.',
  },
  {
    id: 'lockdown-listening',
    name: "Rachel Leach's Lockdown Listening",
    band: 'KS2 · YouTube',
    interactive: false,
    href: 'https://youtube.com/playlist?list=PLTjZ3o6K-BOn25PsSiEZRbZ6wrNlw-wgv',
    blurb: 'Ages 7–12 — listening playlist from the LSO digital resources grid.',
  },
  {
    id: 'olivia',
    name: 'Olivia Forms a Band',
    band: 'KS1',
    interactive: false,
    href: 'https://www.lso.co.uk/learn-and-discover/digital-activities-and-resources/olivia-forms-a-band/',
    blurb: 'Age 5+ — story-led classroom and family activities.',
  },
  {
    id: 'simon',
    name: "Where's Simon?",
    band: 'KS1–2',
    interactive: false,
    href: 'https://www.lso.co.uk/wheres-simon/',
    blurb: 'Ages 5–12 — find-the-conductor style discovery resource.',
  },
  {
    id: 'jemma',
    name: "Jemma's Journey",
    band: 'EYFS',
    interactive: false,
    href: 'https://www.lso.co.uk/learn-and-discover/digital-activities-and-resources/jemmas-journey/',
    blurb: 'Under-5s — Early Years Foundation Stage listening and movement resource.',
  },
  {
    id: 'fergal',
    name: 'Fergal is Fuming!',
    band: 'EYFS',
    interactive: false,
    href: 'https://www.lso.co.uk/learn-and-discover/digital-activities-and-resources/fergal-is-fuming/',
    blurb: 'Under-5s — Early Years story and music activities.',
  },
  {
    id: 'a-level-seminars',
    name: 'A-Level Seminars',
    band: 'KS5 · YouTube',
    interactive: false,
    href: 'https://youtube.com/playlist?list=PLTjZ3o6K-BOmGAKJx_tOf63vDkQJ7I9ME',
    blurb: 'Age 16+ — seminar playlist for A-Level / Key Stage 5 students.',
  },
  {
    id: 'a-level-shorts',
    name: 'A-Level Revision Shorts',
    band: 'KS5 · YouTube',
    interactive: false,
    href: 'https://youtube.com/playlist?list=PLTjZ3o6K-BOnKsd0GLdhTLy2Rt5WxBK67',
    blurb: 'Age 16+ — short revision videos from the LSO Discovery grid.',
  },
  {
    id: 'tes',
    name: 'LSO resources on TES',
    band: 'Teaching platforms',
    interactive: false,
    href: LSO_TES,
    blurb: 'Teacher resource packs and LSO Play listening tasks for KS2–3 on TES.com.',
  },
] as const;

interface LsoPartnerHubProps {
  onAddedToApp?: (info: { sheetId: string }) => void;
  standalone?: boolean;
}

/**
 * LSO hub body — collapsed logo / description / contact live in PartnerHubPage.
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
        subtitle="From the official Activities and Resources for Families and Schools page. Only How to Build an Orchestra is seeded in CCDesigner for now."
      >
        {LSO_PROJECTS.map((project) => (
          <PartnerHubResourceRow
            key={project.id}
            eyebrow={project.interactive ? `In CCDesigner · ${project.band}` : project.band}
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
