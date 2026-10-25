/**
 * PDF upload helpers: ≤3 MB via Vercel JSON; larger via signed direct DreamHost.
 * Max direct size: 100 MB. Client never chooses the storage path.
 */

import { supabase } from '../config/supabase';

export const MAX_VERCEL_PDF_UPLOAD_BYTES = 3 * 1024 * 1024;
export const MAX_DIRECT_PDF_UPLOAD_BYTES = 100 * 1024 * 1024;

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      headers.Authorization = `Bearer ${data.session.access_token}`;
    }
  } catch {
    /* server returns 401 */
  }
  return headers;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read PDF'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Upload a PDF blob. Routes by size:
 * - ≤ 3 MB: POST /api/upload-pdf (Vercel JSON)
 * - ≤ 100 MB: upload-token → DreamHost raw POST → upload-complete
 * - > 100 MB: throws with a clear message
 */
export async function uploadLessonPdf(pdfBlob: Blob): Promise<{ url: string; path: string }> {
  const size = pdfBlob.size;
  if (!size) {
    throw new Error('Empty PDF.');
  }
  if (size > MAX_DIRECT_PDF_UPLOAD_BYTES) {
    throw new Error(
      `This PDF is too large to upload (max ${MAX_DIRECT_PDF_UPLOAD_BYTES / (1024 * 1024)} MB). Try fewer pages or a lower print quality.`,
    );
  }

  if (size > MAX_VERCEL_PDF_UPLOAD_BYTES) {
    return uploadViaDirectToken(pdfBlob);
  }

  const headers = await authHeaders();
  const fileData = await blobToBase64(pdfBlob);
  const uploadResponse = await fetch('/api/upload-pdf', {
    method: 'POST',
    headers,
    body: JSON.stringify({ fileData }),
  });

  if (!uploadResponse.ok) {
    const errorData = await uploadResponse.json().catch(() => ({ error: 'Upload failed' }));
    if (uploadResponse.status === 413 || errorData?.code === 'USE_DIRECT_UPLOAD') {
      return uploadViaDirectToken(pdfBlob);
    }
    throw new Error(errorData.error || `Failed to upload PDF: ${uploadResponse.status}`);
  }

  const { url, path } = await uploadResponse.json();
  if (!url) throw new Error('No URL returned from upload');
  return { url, path };
}

async function uploadViaDirectToken(pdfBlob: Blob): Promise<{ url: string; path: string }> {
  const headers = await authHeaders();
  const intentRes = await fetch('/api/files/upload-token', {
    method: 'POST',
    headers,
    body: JSON.stringify({ byteLength: pdfBlob.size }),
  });

  if (!intentRes.ok) {
    const errorData = await intentRes.json().catch(() => ({ error: 'Upload token failed' }));
    if (intentRes.status === 503) {
      throw new Error(
        `This PDF is over ${MAX_VERCEL_PDF_UPLOAD_BYTES / (1024 * 1024)} MB and direct upload is not configured yet. Maximum via the app server is ${MAX_VERCEL_PDF_UPLOAD_BYTES / (1024 * 1024)} MB.`,
      );
    }
    throw new Error(errorData.error || `Failed to start direct upload: ${intentRes.status}`);
  }

  const intent = await intentRes.json();
  const { token, uploadUrl, path } = intent;
  if (!token || !uploadUrl || !path) {
    throw new Error('Invalid upload token response.');
  }

  const dhRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/pdf',
      'X-Upload-Token': token,
    },
    body: pdfBlob,
  });

  if (!dhRes.ok) {
    const errorData = await dhRes.json().catch(() => ({ error: 'Direct upload failed' }));
    throw new Error(errorData.error || `Direct upload failed: ${dhRes.status}`);
  }

  const completeRes = await fetch('/api/files/upload-complete', {
    method: 'POST',
    headers,
    body: JSON.stringify({ token }),
  });

  if (!completeRes.ok) {
    const errorData = await completeRes.json().catch(() => ({ error: 'Upload confirmation failed' }));
    throw new Error(errorData.error || `Upload confirmation failed: ${completeRes.status}`);
  }

  const { url, path: confirmedPath } = await completeRes.json();
  if (!url) throw new Error('No URL returned from upload confirmation');
  return { url, path: confirmedPath || path };
}
