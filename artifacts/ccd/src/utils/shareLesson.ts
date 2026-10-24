import { supabase } from '../config/supabase';
import { generatePdfViaProxy } from './pdfApi';

interface ShareLessonOptions {
  lessonNumber: string;
  currentSheetInfo: { sheet: string; display: string };
  allLessonsData: Record<string, any>;
  generateHTMLContent: () => string[];
}

/**
 * Check if storage bucket exists and is accessible.
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

/**
 * Share a lesson by generating a PDF via the authenticated server route
 * (`/api/pdf/generate` — PDFBolt key stays server-side) and uploading to Supabase Storage.
 * No browser PDFBolt / VITE_PDFBOLT_API_KEY / DreamHost client uploads.
 */
export async function shareLesson(options: ShareLessonOptions): Promise<string> {
  const { lessonNumber, currentSheetInfo, generateHTMLContent } = options;

  const bucketCheck = await ensureBucketExists();
  if (!bucketCheck.exists) {
    const setupUrl = 'https://supabase.com/dashboard/project/wiudrzdkbpyziaodqoog/storage/buckets';
    const errorMsg = bucketCheck.requiresManualSetup
      ? `The 'lesson-pdfs' storage bucket needs to be created.\n\n` +
        `Quick Setup (2 minutes):\n` +
        `1. Go to: ${setupUrl}\n` +
        `2. Click "New bucket"\n` +
        `3. Name: "lesson-pdfs"\n` +
        `4. Enable "Public bucket"\n` +
        `5. Click "Create bucket"`
      : `Storage bucket 'lesson-pdfs' does not exist. Error: ${bucketCheck.error || 'Unknown error'}`;
    throw new Error(errorMsg);
  }

  const encodeUnicodeBase64 = (str: string): string => {
    return btoa(unescape(encodeURIComponent(str)));
  };

  const parts = generateHTMLContent();
  const htmlContent = encodeUnicodeBase64(parts[0] || '');
  const footerContent = encodeUnicodeBase64(parts[1] || '');
  const headerContent = encodeUnicodeBase64(parts[2] || '<div></div>');

  const pdfBlob = await generatePdfViaProxy({
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
    headerTemplate: headerContent,
    emulateMediaType: 'screen',
  });

  const getLessonDisplayNumber = (num: string): string => {
    const numericPart = num.replace(/^lesson/i, '').replace(/[^0-9]/g, '');
    return numericPart || num;
  };

  const lessonDisplayNumber = getLessonDisplayNumber(lessonNumber);
  const timestamp = Date.now();
  const fileName = `${currentSheetInfo.sheet}_Lesson_${lessonDisplayNumber}.pdf`;
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
  } catch (err) {
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
