import type { PartnerHubConfig } from '../../config/partnerHubs';
import {
  ResourceZoneHubPage,
  type ResourceZoneContent,
} from './ResourceZoneHubPage';

/** Free OmniMusic Resource Zone — mirrors omnimusic.org.uk/resources structure. */
export const OMNIMUSIC_RESOURCE_ZONE: ResourceZoneContent = {
  zoneHeading: 'Resource Zone',
  zoneIntro:
    'Take a look at our free downloadable resources developed by our team, to empower you to continue music making outside of our sessions and in your home.',
  heroSrc: '/partners/omnimusic/hero.png',
  heroAlt:
    'Inclusive music-making session — OmniMusic Learning Programme (official partner imagery)',
  hubLinksHeading: 'Explore our Assistive Music Technology Resource Hub & start-up guides',
  hubLinks: [
    {
      title: 'AMT Resource Hub',
      description:
        'A guide to some of our equipment and software, with quick start guides and links for further learning.',
      href: 'https://omnimusic.org.uk/wiki/',
      action: 'open',
      kind: 'Hub',
    },
  ],
  resourcesHeading: 'Download our free resources',
  downloads: [
    {
      title: 'Follow the Leader Session 1',
      description:
        'Develop listening skills with call and response games, and try out some percussion whilst using your voice.',
      href: 'https://omnimusic.org.uk/wp-content/uploads/2025/05/Follow-the-Leader-Session-1.pdf',
      action: 'download',
      kind: 'PDF',
    },
    {
      title: 'Follow the Leader Session 2',
      description:
        'Continue developing those listening and responding skills, with a chance for each participant to lead this session.',
      href: 'https://omnimusic.org.uk/wp-content/uploads/2025/05/Follow-the-Leader-Session-2.pdf',
      action: 'download',
      kind: 'PDF',
    },
    {
      title: 'Nature Soundscape',
      description:
        'Calming and low energy session, listening and responding to the sounds of nature.',
      href: 'https://omnimusic.org.uk/wp-content/uploads/2025/05/Nature-Soundscape-Session.pdf',
      action: 'download',
      kind: 'PDF',
    },
    {
      title: 'Our Perfect Song',
      description:
        'How to create your own original music by using songs you already love with ThumbJam — inspired by Poppy, a participant on the Learning Programme.',
      href: 'https://omnimusic.org.uk/wp-content/uploads/2026/08/Our-Perfect-Song-Poppys-ThumbJam-Exercise.pdf',
      action: 'download',
      kind: 'PDF',
    },
    {
      title: 'Teacher and TA Guide',
      description:
        'A friendly guide to help teachers and TAs spark creativity and support fun, inclusive music-making.',
      href: 'https://omnimusic.org.uk/wp-content/uploads/2025/05/Teacher-TA-Guide-One-Sheet-3.pdf',
      action: 'download',
      kind: 'PDF',
    },
  ],
  officialResourcesUrl: 'https://omnimusic.org.uk/resources/',
};

interface OmniMusicPartnerHubProps {
  hub: PartnerHubConfig;
}

export function OmniMusicPartnerHub({ hub }: OmniMusicPartnerHubProps) {
  return <ResourceZoneHubPage hub={hub} content={OMNIMUSIC_RESOURCE_ZONE} />;
}
