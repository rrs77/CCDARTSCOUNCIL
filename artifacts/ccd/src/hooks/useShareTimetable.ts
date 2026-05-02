import { useState } from 'react';
import { supabase } from '../config/supabase';

interface TimetableClass {
  id: string;
  day: number; // 0-6 for Sunday-Saturday
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  className: string;
  location: string;
  color: string;
  recurringUnitId?: string;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

  // Generate HTML content for timetable PDF
  const generateHTMLContent = (timetableClasses: TimetableClass[], className: string) => {
    // Group classes by day
    const classesByDay: { [day: number]: TimetableClass[] } = {};
    DAY_NAMES.forEach((_, dayIndex) => {
      classesByDay[dayIndex] = timetableClasses.filter(tClass => tClass.day === dayIndex);
    });

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Class Timetable - ${className}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>  
          @page {
            size: A4;
            margin: 1cm;
          }
          
          .timetable-page {
            width: 21cm;
            min-height: 29.7cm;
            padding: 1cm;
            margin: 0 auto 2cm auto;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            page-break-after: always;
            break-after: always;
          }
          
          .timetable-page:last-child {
            margin-bottom: 0;
          }
          
          @media print {
            .timetable-page {
              box-shadow: none;
              margin: 0;
              padding: 0;
              width: 100%;
              min-height: auto;
            }
            
            .timetable-page:not(:last-child) {
              page-break-after: always;
              break-after: always;
            }
            
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }

          .day-section {
            margin-bottom: 1.5rem;
            page-break-inside: avoid;
          }

          .class-item {
            border-left: 4px solid;
            padding: 0.75rem;
            margin-bottom: 0.5rem;
            background: #f9fafb;
            border-radius: 0.25rem;
          }
        </style>
      </head>
      <body>
        <div class="timetable-page">
          <div class="mb-6">
            <h1 class="text-3xl font-bold mb-2">Class Timetable</h1>
            <p class="text-gray-600 text-lg">${className}</p>
          </div>
    `;

    // Add classes grouped by day
    DAY_NAMES.forEach((dayName, dayIndex) => {
      const classesForDay = classesByDay[dayIndex];
      if (classesForDay && classesForDay.length > 0) {
        // Sort by start time
        const sortedClasses = [...classesForDay].sort((a, b) => {
          const aTime = a.startTime.split(':').map(Number);
          const bTime = b.startTime.split(':').map(Number);
          const aMinutes = aTime[0] * 60 + aTime[1];
          const bMinutes = bTime[0] * 60 + bTime[1];
          return aMinutes - bMinutes;
        });

        htmlContent += `
          <div class="day-section">
            <h2 class="text-xl font-semibold mb-3 pb-2 border-b-2 border-teal-500">
              ${dayName}
            </h2>
            <div class="space-y-2">
        `;
        
        sortedClasses.forEach((tClass) => {
          htmlContent += `
            <div class="class-item" style="border-left-color: ${tClass.color};">
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-semibold text-gray-900">${tClass.className}</div>
                  <div class="text-sm text-gray-600 mt-1">
                    <span>${tClass.startTime} - ${tClass.endTime}</span>
                    ${tClass.location ? `<span class="ml-3">📍 ${tClass.location}</span>` : ''}
                  </div>
                </div>
                <div 
                  class="w-4 h-4 rounded-full"
                  style="background-color: ${tClass.color};"
                ></div>
              </div>
            </div>
          `;
        });
        
        htmlContent += `
            </div>
          </div>
        `;
      }
    });

    htmlContent += `
        </div>
      </body>
      </html>
    `;

    // Footer content
    const footerContent = `
      <div style="font-size: 10px; text-align: center; width: 100%; padding: 10px 0; color: #666;">
        <span>${className} - Class Timetable</span>
        <span style="margin: 0 10px;">|</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `;

    return [htmlContent, footerContent];
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
      const [htmlContent, footerContent] = generateHTMLContent(timetableClasses, className);
      const encodedHtml = encodeUnicodeBase64(htmlContent);
      const encodedFooter = encodeUnicodeBase64(footerContent);

      // Generate filename
      const timestamp = Date.now();
      const sanitizedClassName = className.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `shared-pdfs/${timestamp}_${sanitizedClassName}_Timetable.pdf`;

      // Use Vercel API to generate PDF and upload (bypasses CORS)
      const pdfApiUrl = '/api/generate-pdf';
      
      console.log('Generating timetable PDF via Vercel API:', pdfApiUrl);
      
      let uploadResponse;
      try {
        uploadResponse = await fetch(pdfApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            html: encodedHtml,
            footerTemplate: encodedFooter,
            fileName: fileName
          })
        });
      } catch (fetchError: any) {
        console.error('Network error calling Vercel API:', fetchError);
        throw new Error(`Failed to connect to PDF generation service. Error: ${fetchError.message || 'Network error'}`);
      }

      if (!uploadResponse.ok) {
        let errorText;
        try {
          errorText = await uploadResponse.text();
        } catch (textError) {
          throw new Error(`Upload failed with status ${uploadResponse.status}. Unable to read error message.`);
        }
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Upload failed' };
        }
        
        if (errorData.error === 'Server configuration error' || uploadResponse.status === 500) {
          throw new Error('Server configuration error: Please ensure SUPABASE_SERVICE_ROLE_KEY is set in Vercel environment variables.');
        }
        
        if (uploadResponse.status === 404) {
          throw new Error('Upload function not found. Please ensure the Vercel API route is deployed correctly.');
        }
        
        throw new Error(errorData.error || `Upload failed: ${uploadResponse.status}`);
      }

      const responseData = await uploadResponse.json();
      const publicUrl = responseData.url || responseData.publicUrl;
      
      if (!publicUrl) {
        throw new Error('No URL returned from upload function');
      }
      setShareUrl(publicUrl);

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

