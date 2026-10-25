import { useState } from 'react';
import { supabase } from '../config/supabase';
import { buildTimetableShareHtml, type TimetableClass } from '../utils/timetableShareHtml';


export function useShareTimetable() {
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  // Check if bucket exists
  const ensureBucketExists = async () => {
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
  };


  // Encode to base64
  const encodeUnicodeBase64 = (str: string): string => {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    let binaryString = '';
    for (let i = 0; i < data.length; i++) {
      binaryString += String.fromCharCode(data[i]);
    }
    return btoa(binaryString);
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (!text) return false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Clipboard API failed, trying fallback:', err);
    }
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.setAttribute('readonly', '');
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      textArea.style.opacity = '0';
      textArea.style.pointerEvents = 'none';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, text.length);
      const ok = document.execCommand('copy');
      document.body.removeChild(textArea);
      return !!ok;
    } catch (fallbackErr) {
      if (import.meta.env.DEV) console.warn('Fallback clipboard failed:', fallbackErr);
      return false;
    }
  };

  // Main share function
  const shareTimetable = async (timetableClasses: TimetableClass[], className: string): Promise<string | null> => {
    setIsSharing(true);
    setShareUrl(null);
    setShareError(null);

    try {
      // Check bucket exists
      const bucketCheck = await ensureBucketExists();
      if (!bucketCheck.exists) {
        const setupUrl = 'https://supabase.com/dashboard/project/wiudrzdkbpyziaodqoog/storage/buckets';
        const errorMsg = bucketCheck.requiresManualSetup
          ? `The 'lesson-pdfs' storage bucket needs to be created.\n\nQuick Setup:\n1. Go to: ${setupUrl}\n2. Click "New bucket"\n3. Name: "lesson-pdfs"\n4. Enable "Public bucket"\n5. Click "Create bucket"`
          : `Storage bucket 'lesson-pdfs' does not exist. Error: ${bucketCheck.error || 'Unknown error'}`;
        
        throw new Error(errorMsg);
      }

      // Generate HTML content
      const [htmlContent, footerContent] = buildTimetableShareHtml(timetableClasses, className);
      const encodedHtml = encodeUnicodeBase64(htmlContent);
      const encodedFooter = encodeUnicodeBase64(footerContent);

      // Generate filename
      const timestamp = Date.now();
      const sanitizedClassName = className.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `shared-pdfs/${timestamp}_${sanitizedClassName}_Timetable.pdf`;

      const { generateAndUploadSharePdf } = await import('../utils/pdfApi');
      console.log('Generating timetable PDF via PDFBolt proxy + Supabase upload');

      const { url: publicUrl } = await generateAndUploadSharePdf({
        html: encodedHtml,
        footerTemplate: encodedFooter,
        fileName,
      });
      if (!publicUrl) {
        throw new Error('No URL returned from PDF service');
      }

      setShareUrl(publicUrl);

      // Copy to clipboard
      const clipboardSuccess = await copyToClipboard(publicUrl);
      if (!clipboardSuccess && import.meta.env.DEV) {
        console.warn('Auto-copy failed; URL is shown for manual copy');
      }

      return publicUrl;
    } catch (error: any) {
      console.error('Share failed:', error);
      setShareError(error.message);
      throw error;
    } finally {
      setIsSharing(false);
    }
  };

  return {
    shareTimetable,
    isSharing,
    shareUrl,
    shareError
  };
}

