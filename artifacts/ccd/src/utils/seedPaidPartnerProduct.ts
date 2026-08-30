/**
 * Map paid-basket / premium demo product IDs → prototype seed helpers.
 * Ensures “Add” (hub or partners list) creates Activity Library rows + real lessons.
 */

import { setupWTDBloodBrothers } from './setupWTDBloodBrothers';
import { setupWeTeachDramaPack, type WtdPackId } from './setupWeTeachDramaPacks';
import { setupICCGettingStarted } from './setupICCGettingStarted';
import { setupICCFanfare } from './setupICCFanfare';
import { setupDramaResourceExample } from './setupDramaResourceExample';
import { setupEMSWorkshop, type EmsWorkshopId } from './setupEMSWorkshops';
import { setupTBMHProgramme, type TbmhProgrammeId } from './setupTBMHProgrammes';
import {
  setupJazzNorthExample,
  setupJazzNorthPlaylistExample,
} from './setupJazzNorthExample';

export type SeedPaidResult = {
  productId: string;
  sheetId: string;
  skipped: boolean;
  activities?: number;
  lessons?: number;
};

const WTD_PACK_BY_PRODUCT: Record<string, WtdPackId> = {
  'wtd-cover': 'cover',
  'wtd-designer': 'designer',
  'wtd-mats': 'mats',
};

const EMS_BY_PRODUCT: Record<string, EmsWorkshopId> = {
  'ems-dj-workshop': 'dj',
  'ems-rap-it-workshop': 'rap-it',
};

const TBMH_BY_PRODUCT: Record<string, TbmhProgrammeId> = {
  'tbmh-groove-n-play': 'groove-n-play',
  'tbmh-music-makes-me': 'music-makes-me',
};

/** Product IDs that have a CCDesigner seed path. */
export function canSeedPaidProduct(productId: string): boolean {
  return (
    productId === 'wtd-blood-brothers' ||
    productId in WTD_PACK_BY_PRODUCT ||
    productId === 'icc-getting-started' ||
    productId === 'icc-fanfare' ||
    productId === 'dr-just-add-drama' ||
    productId === 'dr-lesson-downloads' ||
    productId in EMS_BY_PRODUCT ||
    productId in TBMH_BY_PRODUCT ||
    productId === 'jn-learning-resources' ||
    productId === 'jn-playlist-milestones' ||
    productId === 'jn-educators-forum'
  );
}

/**
 * Seed activities + lesson(s) for a paid demo product.
 * Always uses registerPartnerPlanning so Lesson Library / Partner Planning update.
 */
export async function seedPaidPartnerProduct(
  productId: string,
  options?: { force?: boolean },
): Promise<SeedPaidResult | null> {
  const force = options?.force !== false;
  const opts = { force, registerPartnerPlanning: true as const };

  if (productId === 'wtd-blood-brothers') {
    const r = await setupWTDBloodBrothers(opts);
    return {
      productId,
      sheetId: r.sheetId,
      skipped: Boolean(r.skipped),
      activities: (r as any).activities,
      lessons: (r as any).lessons,
    };
  }

  const wtdPack = WTD_PACK_BY_PRODUCT[productId];
  if (wtdPack) {
    const r = await setupWeTeachDramaPack(wtdPack, opts);
    return {
      productId,
      sheetId: r.sheetId,
      skipped: Boolean(r.skipped),
      activities: (r as any).activities,
      lessons: (r as any).lessons,
    };
  }

  if (productId === 'icc-getting-started') {
    const r = await setupICCGettingStarted(opts);
    return {
      productId,
      sheetId: r.sheetId,
      skipped: Boolean(r.skipped),
      activities: (r as any).activities,
      lessons: (r as any).lessons,
    };
  }

  if (productId === 'icc-fanfare') {
    const r = await setupICCFanfare(opts);
    return {
      productId,
      sheetId: r.sheetId,
      skipped: Boolean(r.skipped),
      activities: (r as any).activities,
      lessons: (r as any).lessons,
    };
  }

  if (productId === 'dr-just-add-drama' || productId === 'dr-lesson-downloads') {
    const r = await setupDramaResourceExample(opts);
    return {
      productId,
      sheetId: r.sheetId,
      skipped: Boolean(r.skipped),
      activities: (r as any).activities,
      lessons: (r as any).lessons,
    };
  }

  const emsId = EMS_BY_PRODUCT[productId];
  if (emsId) {
    const r = await setupEMSWorkshop(emsId, opts);
    return {
      productId,
      sheetId: r.sheetId,
      skipped: Boolean(r.skipped),
      activities: (r as any).activities,
      lessons: (r as any).lessons,
    };
  }

  const tbmhId = TBMH_BY_PRODUCT[productId];
  if (tbmhId) {
    const r = await setupTBMHProgramme(tbmhId, opts);
    return {
      productId,
      sheetId: r.sheetId,
      skipped: Boolean(r.skipped),
      activities: (r as any).activities,
      lessons: (r as any).lessons,
    };
  }

  // Jazz North — Learning Resources / Educators Forum share Mr Big showcase;
  // Playlist Project has its own KS2 lesson seed.
  if (productId === 'jn-playlist-milestones') {
    const r = await setupJazzNorthPlaylistExample(opts);
    return {
      productId,
      sheetId: r.sheetId,
      skipped: Boolean(r.skipped),
      activities: (r as any).activities,
      lessons: (r as any).lessons,
    };
  }

  if (productId === 'jn-learning-resources' || productId === 'jn-educators-forum') {
    const r = await setupJazzNorthExample(opts);
    return {
      productId,
      sheetId: r.sheetId,
      skipped: Boolean(r.skipped),
      activities: (r as any).activities,
      lessons: (r as any).lessons,
    };
  }

  return null;
}
