/**
 * In-app shared PDF viewer (`/shared/:userId/:fileId`).
 * Requires a signed-in session; loads the file with Authorization Bearer.
 * Share URLs never contain a JWT.
 */

import React, { useEffect, useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import {
  fetchSharedFileWithBearer,
  storagePathFromShareAppPath,
  toFileShareAppPath,
} from '../utils/fileShareAccess';
import { buildSignInHref } from '../utils/authReturn';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; blobUrl: string; fileName: string }
  | { status: 'error'; message: string; code?: number };

export function SharedFilePage({ path }: { path: string }) {
  const sharePath = toFileShareAppPath(path);
  const storagePath = storagePathFromShareAppPath(path);
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    if (!sharePath || !storagePath) {
      setState({ status: 'error', message: 'Invalid share link.', code: 400 });
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    (async () => {
      try {
        const res = await fetchSharedFileWithBearer(storagePath);
        if (cancelled) return;

        if (res.status === 401) {
          window.location.assign(buildSignInHref(sharePath));
          return;
        }
        if (res.status === 403) {
          setState({
            status: 'error',
            message: 'You do not have access to this file.',
            code: 403,
          });
          return;
        }
        if (res.status === 404) {
          setState({ status: 'error', message: 'File not found.', code: 404 });
          return;
        }
        if (!res.ok) {
          setState({
            status: 'error',
            message: 'Could not open this shared file.',
            code: res.status,
          });
          return;
        }

        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        const fileName = storagePath.split('/').pop() || 'shared.pdf';
        setState({ status: 'ready', blobUrl: objectUrl, fileName });
      } catch (err) {
        if (cancelled) return;
        const status = (err as { status?: number })?.status;
        if (status === 401) {
          window.location.assign(buildSignInHref(sharePath));
          return;
        }
        setState({
          status: 'error',
          message: err instanceof Error ? err.message : 'Could not open this shared file.',
        });
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [sharePath, storagePath]);

  if (!sharePath || !storagePath) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <p className="text-sm text-gray-700">Invalid share link.</p>
      </div>
    );
  }

  if (state.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50 p-6">
        <p className="text-sm text-gray-800">{state.message}</p>
        <a href="/" className="text-sm font-semibold text-[#4338E8] underline">
          Back to CCDesigner
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#EDECF2]">
      <header className="flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-gray-200">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Shared file
          </p>
          <p className="text-sm font-medium text-gray-900 truncate">{state.fileName}</p>
        </div>
        <a
          href={state.blobUrl}
          download={state.fileName}
          className="shrink-0 rounded-md bg-[#4338E8] px-3 py-1.5 text-xs font-semibold text-white"
        >
          Download
        </a>
      </header>
      <iframe
        title={state.fileName}
        src={state.blobUrl}
        className="flex-1 w-full border-0 bg-white"
      />
    </div>
  );
}

/** True when the current path is an in-app shared file route. */
export function isSharedFilePath(pathname: string): boolean {
  return Boolean(toFileShareAppPath(pathname));
}
