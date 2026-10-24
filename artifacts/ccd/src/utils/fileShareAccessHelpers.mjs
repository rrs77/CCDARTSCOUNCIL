/**
 * Pure share-path helpers (plain ESM for Node tests without TS strip).
 */

import { safeReturnPath } from './authReturnHelpers.mjs';

const UUID =
  '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const SHARE_PATH_RE = new RegExp(
  `^/shared/(${UUID})/(${UUID})(?:\\.pdf)?/?$`,
  'i',
);
const API_FILES_RE = new RegExp(
  `^/api/files/(${UUID})/(${UUID})\\.pdf$`,
  'i',
);

export function isFileShareAppPath(path) {
  const safe = safeReturnPath(path);
  if (!safe) return false;
  const pathname = safe.split('?')[0] || '';
  return SHARE_PATH_RE.test(pathname);
}

/** Legacy clipboard / return URLs that pointed at the API proxy. */
export function isFileShareApiPath(path) {
  const safe = safeReturnPath(path);
  if (!safe) return false;
  const pathname = safe.split('?')[0] || '';
  return API_FILES_RE.test(pathname);
}

/**
 * Normalise a share or legacy API path to `/shared/{userId}/{fileId}`.
 * Never appends access_token.
 */
export function toFileShareAppPath(path) {
  const safe = safeReturnPath(path);
  if (!safe) return null;
  const pathname = safe.split('?')[0] || '';

  let m = pathname.match(SHARE_PATH_RE);
  if (m) return `/shared/${m[1]}/${m[2]}`;

  m = pathname.match(API_FILES_RE);
  if (m) return `/shared/${m[1]}/${m[2]}`;

  return null;
}

export function storagePathFromShareAppPath(path) {
  const share = toFileShareAppPath(path);
  if (!share) return null;
  const m = share.match(SHARE_PATH_RE);
  if (!m) return null;
  return `${m[1]}/${m[2]}.pdf`;
}

export function fileProxyApiPathFromStorage(storagePath) {
  return `/api/files/${storagePath}`;
}
