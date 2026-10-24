import { generateAndUploadSharePdf } from './pdfApi';

interface ShareLessonOptions {
  lessonNumber: string;
  currentSheetInfo: { sheet: string; display: string };
  allLessonsData: Record<string, any>;
  generateHTMLContent: () => string[];
}

/**
 * Share a lesson by generating a PDF on the authenticated server route
 * (PDFBolt key stays server-side) and returning the stored file URL.
 */
export async function shareLesson(options: ShareLessonOptions): Promise<string> {
  const { lessonNumber, currentSheetInfo, generateHTMLContent } = options;

  const encodeUnicodeBase64 = (str: string): string => {
    return btoa(unescape(encodeURIComponent(str)));
  };

  const [htmlRaw, footerRaw, headerRaw = '<div></div>'] = generateHTMLContent();
  const htmlContent = encodeUnicodeBase64(htmlRaw);
  const footerContent = encodeUnicodeBase64(footerRaw || '');
  const headerContent = encodeUnicodeBase64(headerRaw || '<div></div>');

  const getLessonDisplayNumber = (num: string): string => {
    const numericPart = num.replace(/^lesson/i, '').replace(/[^0-9]/g, '');
    return numericPart || num;
  };

  const lessonDisplayNumber = getLessonDisplayNumber(lessonNumber);
  // Display hint only — server builds the real storage path.
  const fileName = `${currentSheetInfo.sheet}_Lesson_${lessonDisplayNumber}.pdf`;

  const { url } = await generateAndUploadSharePdf({
    html: htmlContent,
    footerTemplate: footerContent,
    headerTemplate: headerContent,
    fileName,
    lessonNumber,
  });

  return url;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    // Fallback for older browsers
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
