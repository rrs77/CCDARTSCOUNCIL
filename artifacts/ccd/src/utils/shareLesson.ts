import { supabase } from '../config/supabase';
import { getVercelApiUrl } from './apiUrl';

const PDFBOLT_API_URL = 'https://api.pdfbolt.com/v1/direct';
const PDFBOLT_API_KEY = import.meta.env.VITE_PDFBOLT_API_KEY;

interface ShareLessonOptions {
  lessonNumber: string;
  currentSheetInfo: { sheet: string; display: string };
  allLessonsData: Record<string, any>;
  generateHTMLContent: () => string[];
}

/**
 * Check if storage bucket exists and is accessible
 */
export async function ensureBucketExists() {
  const bucketName = 'lesson-pdfs';

  try {
    const { data: files, error: accessError } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 1 });

    if (!accessError) {
      return { exists: true };
    }

    if (accessError.message?.includes('not found') || accessError.message?.includes('Bucket not found')) {
      return { exists: false, requiresManualSetup: true };
    }

    return { exists: false, error: accessError.message, requiresManualSetup: true };
  } catch (error: any) {
    return { exists: false, error: error.message || 'Unknown error', requiresManualSetup: true };
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      headers.Authorization = `Bearer ${data.session.access_token}`;
    }
  } catch {
    /* server rejects unauthenticated */
  }
  return headers;
}

/**
 * Upload a PDF blob via the authenticated /api/upload-pdf route (DreamHost).
 * Never sends DreamHost API keys from the browser.
 */
async function uploadPdfViaApi(pdfBlob: Blob): Promise<string> {
  const arrayBuffer = await pdfBlob.arrayBuffer();
  const base64Data = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''),
  );

  const response = await fetch(getVercelApiUrl('/api/upload-pdf'), {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ fileData: base64Data }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let msg = errorText;
    try {
      const d = JSON.parse(errorText || '{}') as { error?: string };
      if (d.error) msg = d.error;
    } catch {
      /* keep raw */
    }
    throw new Error(msg || `Upload failed: ${response.status}`);
  }

  const result = (await response.json()) as { success?: boolean; url?: string; error?: string };
  if (!result.url) {
    throw new Error(result.error || 'Upload failed - no URL returned');
  }
  return result.url;
}

/**
 * Share a lesson by generating PDF and uploading via authenticated API → DreamHost.
 * Falls back to Supabase Storage when DreamHost is not configured on the server.
 */
export async function shareLesson(options: ShareLessonOptions): Promise<string> {
  const { lessonNumber, currentSheetInfo, generateHTMLContent } = options;

  if (!PDFBOLT_API_KEY || PDFBOLT_API_KEY === 'd089165b-e1da-43bb-a7dc-625ce514ed1b') {
    throw new Error('Please set your PDFBolt API key in the environment variables (VITE_PDFBOLT_API_KEY)');
  }

  const encodeUnicodeBase64 = (str: string): string => {
    return btoa(unescape(encodeURIComponent(str)));
  };

  const htmlContent = encodeUnicodeBase64(generateHTMLContent()[0]);
  const footerContent = encodeUnicodeBase64(generateHTMLContent()[1]);

  const response = await fetch(PDFBOLT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      API_KEY: PDFBOLT_API_KEY,
    },
    body: JSON.stringify({
      html: htmlContent,
      printBackground: true,
      waitUntil: 'networkidle',
      format: 'A4',
      margin: {
        top: '15px',
        right: '20px',
        left: '20px',
        bottom: '55px',
      },
      displayHeaderFooter: true,
      footerTemplate: footerContent,
      headerTemplate: encodeUnicodeBase64(`<div></div>`),
      emulateMediaType: 'screen',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PDFBolt API Error: ${response.status} - ${errorText}`);
  }

  const pdfBlob = await response.blob();

  try {
    console.log('📤 Uploading PDF via /api/upload-pdf (DreamHost)…');
    return await uploadPdfViaApi(pdfBlob);
  } catch (dreamHostErr) {
    console.warn('DreamHost upload unavailable, falling back to Supabase:', dreamHostErr);
  }

  const bucketCheck = await ensureBucketExists();
  if (!bucketCheck.exists) {
    throw new Error(
      bucketCheck.error ||
        "Storage bucket 'lesson-pdfs' is missing and DreamHost upload is not configured.",
    );
  }

  const getLessonDisplayNumber = (num: string): string => {
    const numericPart = num.replace(/^lesson/i, '').replace(/[^0-9]/g, '');
    return numericPart || num;
  };

  const lessonDisplayNumber = getLessonDisplayNumber(lessonNumber);
  const fileName = `${currentSheetInfo.sheet}_Lesson_${lessonDisplayNumber}.pdf`;
  const timestamp = Date.now();
  const storageFileName = `shared-pdfs/${timestamp}_${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('lesson-pdfs')
    .upload(storageFileName, pdfBlob, {
      contentType: 'application/pdf',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload PDF: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage.from('lesson-pdfs').getPublicUrl(storageFileName);
  return urlData.publicUrl;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}
