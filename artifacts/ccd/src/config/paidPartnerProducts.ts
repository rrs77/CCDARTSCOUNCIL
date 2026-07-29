/**
 * Dummy paid products for We Teach Drama, iCompose, and Drama Resource basket demo.
 * Prices are placeholders — no real payment is processed.
 */

export type PaidPartnerSlug =
  | 'weteachdrama'
  | 'icompose'
  | 'dramaresource'
  | 'ems'
  | 'triborough';

export interface PaidPartnerProduct {
  id: string;
  partnerSlug: PaidPartnerSlug;
  partnerName: string;
  title: string;
  pricePence: number;
  /** Short label for basket rows */
  meta?: string;
}

export const PAID_PARTNER_PRODUCTS: PaidPartnerProduct[] = [
  {
    id: 'wtd-blood-brothers',
    partnerSlug: 'weteachdrama',
    partnerName: 'We Teach Drama',
    title: 'Revise Blood Brothers Scheme of Learning & CPD',
    pricePence: 4500,
    meta: 'KS4 · GCSE Drama (AQA)',
  },
  {
    id: 'wtd-cover',
    partnerSlug: 'weteachdrama',
    partnerName: 'We Teach Drama',
    title: 'Drama Cover Lesson Pack (Ages 11–14)',
    pricePence: 2500,
    meta: 'KS3 · Ages 11–14',
  },
  {
    id: 'wtd-designer',
    partnerSlug: 'weteachdrama',
    partnerName: 'We Teach Drama',
    title: 'Think Like a Designer — Complete Collection',
    pricePence: 6500,
    meta: 'KS4 · Design workbooks',
  },
  {
    id: 'wtd-mats',
    partnerSlug: 'weteachdrama',
    partnerName: 'We Teach Drama',
    title: 'Theatre Design Challenge Mats',
    pricePence: 1800,
    meta: 'KS3–KS5 · Challenge mats',
  },
  {
    id: 'icc-fanfare',
    partnerSlug: 'icompose',
    partnerName: 'iCompose',
    title: 'How to Compose a Fanfare',
    pricePence: 1500,
    meta: '22 lessons · Beginner / Intermediate',
  },
  {
    id: 'dr-just-add-drama',
    partnerSlug: 'dramaresource',
    partnerName: 'Drama Resource',
    title: 'Just Add Drama — The Creative Teacher’s Toolkit',
    pricePence: 13500,
    meta: 'Online course · Primary / Secondary / EFL',
  },
  {
    id: 'dr-lesson-downloads',
    partnerSlug: 'dramaresource',
    partnerName: 'Drama Resource',
    title: 'Downloadable drama lesson units (bundle demo)',
    pricePence: 2500,
    meta: 'Story / curriculum units · demo price',
  },
  {
    id: 'ems-dj-workshop',
    partnerSlug: 'ems',
    partnerName: 'Essex Music Service',
    title: 'DJ Workshop (curriculum enhancement day)',
    pricePence: 25000,
    meta: 'Full day · EYFS–KS3 & SEND · public £250/day',
  },
  {
    id: 'ems-rap-it-workshop',
    partnerSlug: 'ems',
    partnerName: 'Essex Music Service',
    title: 'Rap-It! Workshop (curriculum enhancement day)',
    pricePence: 25000,
    meta: 'Full day · KS2–KS4 · literacy-linked · public £250/day',
  },
  {
    id: 'tbmh-groove-n-play',
    partnerSlug: 'triborough',
    partnerName: 'Tri-Borough Music Hub',
    title: "Groove'n'Play WCIL licence + teacher CPD",
    pricePence: 8500,
    meta: 'FREE school licence · CPD value £85 (public listing)',
  },
  {
    id: 'tbmh-music-makes-me',
    partnerSlug: 'triborough',
    partnerName: 'Tri-Borough Music Hub',
    title: 'Music Makes Me — Song-writing Resource',
    pricePence: 0,
    meta: 'FREE Teaching & Learning resource · 5 song strands',
  },
];

export function getPaidProduct(id: string): PaidPartnerProduct | undefined {
  return PAID_PARTNER_PRODUCTS.find((p) => p.id === id);
}

export function getPaidProductsForPartner(slug: PaidPartnerSlug): PaidPartnerProduct[] {
  return PAID_PARTNER_PRODUCTS.filter((p) => p.partnerSlug === slug);
}

export function formatPricePence(pence: number): string {
  return `£${(pence / 100).toFixed(pence % 100 === 0 ? 0 : 2)}`;
}
