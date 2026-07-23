/**
 * Official partner contact details for hub footers.
 * Sourced from each organisation’s public contact pages — do not invent.
 */

export type PartnerContactInfo = {
  orgId: string;
  lines: string[];
  phone?: string;
  fax?: string;
  email?: string;
  web?: string;
  webLabel?: string;
  sourceUrl: string;
};

export const PARTNER_CONTACTS: Record<string, PartnerContactInfo> = {
  roh: {
    orgId: 'roh',
    lines: ['Royal Opera House', 'Bow Street, Covent Garden, London'],
    phone: '020 7304 4000',
    email: 'boxoffice@roh.org.uk',
    web: 'https://www.rbo.org.uk/schools/',
    webLabel: 'rbo.org.uk/schools',
    sourceUrl: 'https://www.rbo.org.uk/contact',
  },
  lso: {
    orgId: 'lso',
    lines: ['London Symphony Orchestra', 'Barbican Centre, Silk Street, London EC2Y 8DS'],
    phone: '020 7870 2500',
    email: 'admin@lso.co.uk',
    web: 'https://www.lso.co.uk/',
    webLabel: 'lso.co.uk',
    sourceUrl: 'https://www.lso.co.uk/contact/',
  },
  weteachdrama: {
    orgId: 'weteachdrama',
    lines: ['We Teach Drama'],
    email: 'info@weteachdrama.com',
    web: 'https://www.weteachdrama.com/',
    webLabel: 'weteachdrama.com',
    sourceUrl: 'https://www.weteachdrama.com/contact',
  },
  ems: {
    orgId: 'ems',
    lines: ['Essex Music Service', 'Greater Essex Music Hub'],
    phone: '0333 013 8953',
    fax: '0333 013 3937',
    email: 'musichub@essex.gov.uk',
    web: 'https://www.essexmusicservice.org.uk/',
    webLabel: 'essexmusicservice.org.uk',
    sourceUrl: 'https://www.essexmusicservice.org.uk/site/contact/',
  },
  triborough: {
    orgId: 'triborough',
    lines: ['Tri-Borough Music Hub'],
    web: 'https://www.triboroughmusichub.org/',
    webLabel: 'triboroughmusichub.org',
    sourceUrl: 'https://www.triboroughmusichub.org/about-us/',
  },
  icompose: {
    orgId: 'icompose',
    lines: ['iCompose'],
    web: 'https://www.icancompose.com/contact-us/',
    webLabel: 'icancompose.com/contact-us',
    sourceUrl: 'https://www.icancompose.com/contact-us/',
  },
  dramaresource: {
    orgId: 'dramaresource',
    lines: [
      'Drama Resource',
      'Director: David Farmer',
      '23 Trafford Road, Norwich, Norfolk NR1 2QW',
    ],
    phone: '+44 (0)7973 217876',
    web: 'https://dramaresource.com/contact/',
    webLabel: 'dramaresource.com/contact',
    sourceUrl: 'https://dramaresource.com/contact/',
  },
};
