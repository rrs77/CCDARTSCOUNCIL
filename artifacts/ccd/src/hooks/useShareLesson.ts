import { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContextNew';
import { customObjectivesApi } from '../config/customObjectivesApi';
import type { CustomObjective, CustomObjectiveArea, CustomObjectiveYearGroup } from '../types/customObjectives';
import type { Activity } from '../contexts/DataContext';

export function useShareLesson() {
  const { allLessonsData, currentSheetInfo, lessonStandards, halfTerms, getTermSpecificLessonNumber, getLessonDisplayTitle } = useData();
  const { getCategoryColor, settings } = useSettings();
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [customObjectives, setCustomObjectives] = useState<CustomObjective[]>([]);
  const [customAreas, setCustomAreas] = useState<CustomObjectiveArea[]>([]);
  const [customYearGroups, setCustomYearGroups] = useState<CustomObjectiveYearGroup[]>([]);

  // Load custom objectives data
  useEffect(() => {
    const loadCustomObjectives = async () => {
      try {
        const [objectives, areas, yearGroups] = await Promise.all([
          customObjectivesApi.objectives.getAll(),
          customObjectivesApi.areas.getAll(),
          customObjectivesApi.yearGroups.getAll()
        ]);
        setCustomObjectives(objectives);
        setCustomAreas(areas);
        setCustomYearGroups(yearGroups);
      } catch (error) {
        console.warn('Failed to load custom objectives for PDF export:', error);
      }
    };
    loadCustomObjectives();
  }, []);

  // Get custom objectives for a lesson
  const getCustomObjectivesForLesson = (lessonNum: string) => {
    const lessonData = allLessonsData[lessonNum];
    if (!lessonData) return [];

    const lessonCustomObjectives: CustomObjective[] = [];
    
    if (lessonData.customObjectives && lessonData.customObjectives.length > 0) {
      lessonData.customObjectives.forEach(objectiveId => {
        const objective = customObjectives.find(obj => obj.id === objectiveId);
        if (objective) {
          lessonCustomObjectives.push(objective);
        }
      });
    }
    
    return lessonCustomObjectives;
  };

  // Get stored share URL for a lesson
  const getStoredShareUrl = (lessonNumber: string): string | null => {
    try {
      const stored = localStorage.getItem(`share-url-${lessonNumber}`);
      return stored ? JSON.parse(stored).url : null;
    } catch {
      return null;
    }
  };

  // Store share URL for a lesson
  const storeShareUrl = (lessonNumber: string, url: string) => {
    try {
      localStorage.setItem(`share-url-${lessonNumber}`, JSON.stringify({
        url,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to store share URL:', error);
    }
  };

  // Note: Bucket check removed - we're using Vercel Blob Storage now
  // Vercel Blob stores are automatically available when created in Vercel Dashboard
  // No need to check if they exist - the API will return an error if not configured

  // Generate HTML content for PDF (full lesson plan version)
  const generateHTMLContent = (lessonNumber: string) => {
    const lessonData = allLessonsData[lessonNumber];
    if (!lessonData) return ['', '', ''];

    const getLessonDisplayNumber = (num: string): string => {
      const numericPart = num.replace(/^lesson/i, '').replace(/[^0-9]/g, '');
      return numericPart || num;
    };
    
    const lessonDisplayNumber = getLessonDisplayNumber(lessonNumber);
    const lessonTitle = getLessonDisplayTitle(lessonNumber) || lessonData.title || `Lesson ${lessonDisplayNumber}`;
    
    // Get half-term info if available
    const halfTerm = halfTerms.find(ht => 
      ht.lessons && ht.lessons.includes(lessonNumber)
    );
    const halfTermName = halfTerm?.name || '';
    const termSpecificNumber = halfTerm ? getTermSpecificLessonNumber(lessonNumber, halfTerm.id) : lessonDisplayNumber;

    // Get EYFS statements for this lesson
    const lessonStandardsList = lessonStandards[lessonNumber] || [];
    
    // Group EYFS statements by area
    const groupedEyfs: Record<string, string[]> = {};
    lessonStandardsList.forEach(statement => {
      const parts = statement.split(':');
      const area = parts[0].trim();
      const detail = parts.length > 1 ? parts[1].trim() : statement;
      if (!groupedEyfs[area]) {
        groupedEyfs[area] = [];
      }
      groupedEyfs[area].push(detail);
    });

    // Get custom objectives for this lesson
    const lessonCustomObjectives = getCustomObjectivesForLesson(lessonNumber);
    
    // Group custom objectives by section, then by area
    const groupedCustomObjectives: Record<string, Record<string, CustomObjective[]>> = {};
    lessonCustomObjectives.forEach(objective => {
      const area = customAreas.find(a => a.id === objective.area_id);
      if (area) {
        const sectionName = area.section || 'Other';
        const areaName = area.name;
        if (!groupedCustomObjectives[sectionName]) {
          groupedCustomObjectives[sectionName] = {};
        }
        if (!groupedCustomObjectives[sectionName][areaName]) {
          groupedCustomObjectives[sectionName][areaName] = [];
        }
        groupedCustomObjectives[sectionName][areaName].push(objective);
      }
    });

    const hasCustomObjectives = Object.keys(groupedCustomObjectives).length > 0;
    const hasEyfsObjectives = lessonStandardsList.length > 0;
    const shouldShowCustom = hasCustomObjectives;
    const shouldShowEyfs = hasEyfsObjectives && !hasCustomObjectives;

    const headerTitle = lessonData.customHeader || `Lesson ${termSpecificNumber}, ${halfTermName || 'Autumn 1'} - ${currentSheetInfo.display}, Music`;
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${lessonTitle}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page { size: A4; margin: 12mm 15mm 25mm 15mm; }
          .lesson-pdf-content { width: 100%; max-width: 210mm; margin: 0 auto; padding: 0; background: white; }
          .lesson-header-teal {
            background: #0f766e;
            color: white;
            padding: 20px 24px;
            border-radius: 8px 8px 0 0;
            margin-bottom: 0;
          }
          .lesson-header-teal h3 { font-size: 22px; font-weight: 700; margin: 0 0 6px 0; color: white; }
          .lesson-header-teal .subtitle { font-size: 14px; opacity: 0.95; }
          .lesson-header-teal .meta { font-size: 11px; opacity: 0.9; margin-top: 8px; }
          .content-wrapper { border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; padding: 16px; background: #fff; }
          .activity-section { margin-top: 16px; }
          .category-group { break-inside: avoid; page-break-inside: avoid; margin-bottom: 10px; }
          .activity-category { font-size: 14px; font-weight: 700; color: #B8860B; padding: 8px 0; margin-bottom: 10px; border-bottom: none; }
          .activity-card {
            background: white; border: 1px solid #d1e7dd; border-radius: 6px; margin-bottom: 10px; overflow: hidden;
            border-left: 4px solid #0f766e; box-shadow: 0 1px 2px rgba(0,0,0,0.04);
            break-inside: avoid; page-break-inside: avoid;
          }
          .activity-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #E6F7ED; border-bottom: 1px solid #d1e7dd; }
          .activity-title { font-weight: 700; font-size: 12px; color: #0f766e; }
          .activity-time { background: #0f766e; color: white; padding: 4px 10px; border-radius: 9999px; font-size: 10px; font-weight: 600; }
          .activity-body { padding: 12px 14px; font-size: 11px; color: #1f2937; line-height: 1.5; }
          .activity-resources { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb; }
          .resource-tag { font-size: 10px; padding: 4px 10px; font-weight: 500; text-decoration: none; border-radius: 50px; display: inline-block; }
          .resource-video { color: #dc2626; border: 2px solid #dc2626; background: #fef2f2; }
          .resource-music { color: #16a34a; border: 2px solid #16a34a; background: #f0fdf4; }
          .resource-backing { color: #2563eb; border: 2px solid #2563eb; background: #eff6ff; }
          .resource-resource { color: #9333ea; border: 2px solid #9333ea; background: #faf5ff; }
          .resource-link { color: #6b7280; border: 2px solid #6b7280; background: #f9fafb; }
          .resource-vocals { color: #ea580c; border: 2px solid #ea580c; background: #fff7ed; }
          .resource-image { color: #db2777; border: 2px solid #db2777; background: #fdf2f8; }
          .resource-canva { color: #4f46e5; border: 2px solid #4f46e5; background: #eef2ff; }
          /* Prevent trailing blank page with only footer */
          .lesson-pdf-content { page-break-after: avoid; break-after: avoid; }
          .content-wrapper { page-break-after: avoid; break-after: avoid; }
          .pdf-end { page-break-after: avoid; break-after: avoid; height: 0; overflow: hidden; margin: 0; padding: 0; }
          @media print { body { background: white; } .lesson-pdf-content { background: white; } * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
        </style>
      </head>
      <body>
        <div class="lesson-pdf-content">
          <div class="lesson-header-teal">
            <h3>${headerTitle}</h3>
            <div class="subtitle">${halfTermName || 'Autumn 1'} - ${currentSheetInfo.display}</div>
            <div class="meta">${currentSheetInfo.display} • ${lessonData.totalTime || 45} mins • ${halfTermName || 'Term 1'}</div>
          </div>
          <div class="content-wrapper">
    `;

    // Add Learning Goals section if available
    if (shouldShowEyfs || shouldShowCustom) {
      htmlContent += `
        <div class="mb-4">
          <h3 class="text-base font-bold text-black mb-2 flex items-center space-x-2">
            <svg class="h-4 w-4 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
            </svg>
            <span>Learning Goals</span>
          </h3>
          <div class="grid grid-cols-2 gap-2">
      `;

      // Add EYFS objectives
      if (shouldShowEyfs) {
        Object.entries(groupedEyfs).forEach(([area, statements]) => {
          htmlContent += `
            <div class="rounded-lg p-2 border border-gray-800" style="background-color: #fffbeb;">
              <h4 class="font-bold text-black text-xs mb-1">${area}</h4>
              <ul class="space-y-0.5">
          `;
          statements.forEach(statement => {
            htmlContent += `
              <li class="flex items-start space-x-2 text-xs text-black">
                <span class="text-green-600 font-bold">✓</span>
                <span>${statement}</span>
              </li>
            `;
          });
          htmlContent += `</ul></div>`;
        });
      }

      // Add Custom objectives
      if (shouldShowCustom) {
        Object.entries(groupedCustomObjectives).forEach(([sectionName, areas]) => {
          Object.entries(areas).forEach(([areaName, objectives]) => {
            let displayTitle = areaName;
            if (sectionName && sectionName !== 'Other' && sectionName !== areaName) {
              if (!areaName.includes(sectionName)) {
                displayTitle = `${sectionName}, ${areaName}`;
              }
            }
            
            htmlContent += `
              <div class="rounded-lg p-2 border border-gray-800" style="background-color: #f3e8ff;">
                <h4 class="font-bold text-black text-xs mb-1">${displayTitle}</h4>
                <ul class="space-y-0.5">
            `;
            objectives.forEach(objective => {
              htmlContent += `
                <li class="flex items-start space-x-2 text-xs text-black">
                  <span class="text-purple-600 font-bold">✓</span>
                  <span>${objective.objective_text}</span>
                </li>
              `;
            });
            htmlContent += `</ul></div>`;
          });
        });
      }

      htmlContent += `</div></div>`;
    }

    // Add activities with full details
    const activitiesToPrint = lessonData.orderedActivities && lessonData.orderedActivities.length > 0
      ? lessonData.orderedActivities
      : (lessonData.categoryOrder || []).flatMap((category: string) => lessonData.grouped[category] || []);
    
    // Group activities by category for display
    const categoriesInOrder: string[] = [];
    const activitiesByCategory: Record<string, Activity[]> = {};
    
    activitiesToPrint.forEach((activity: Activity) => {
      if (!activitiesByCategory[activity.category]) {
        activitiesByCategory[activity.category] = [];
        categoriesInOrder.push(activity.category);
      }
      activitiesByCategory[activity.category].push(activity);
    });

    // Display activities by category (match Export PDF: category-group + activity-card for correct page breaks)
    if (categoriesInOrder.length > 0) {
      htmlContent += `<div class="activity-section"><div style="display: flex; align-items: center; margin-bottom: 12px;"><h3 style="font-size: 14px; font-weight: 700; color: #1f2937; margin: 0;">Activities from Library</h3></div>`;
      categoriesInOrder.forEach(category => {
        const activities = activitiesByCategory[category] || [];
        if (activities.length === 0) return;
        const categoryColor = getCategoryColor(category);
        htmlContent += `<div class="category-group"><div class="activity-category" style="color: ${categoryColor}; border-bottom-color: ${categoryColor};">${category}</div>`;
        activities.forEach(activity => {
          htmlContent += `
          <div class="activity-card" style="border-left-color: ${categoryColor};">
            <div class="activity-header">
              <span class="activity-title">${activity.activity}</span>
              ${activity.time > 0 ? `<span class="activity-time">${activity.time} min</span>` : ''}
            </div>
            <div class="activity-body">
              ${activity.activityText ? `<p style="font-weight: 500; margin-bottom: 6px;">${activity.activityText}</p>` : ''}
              <div>${activity.description.includes('<') ? activity.description : activity.description.replace(/\n/g, '<br>')}</div>`;
          const resources: { label: string; url: string; class: string }[] = [];
          if (activity.videoLink) resources.push({ label: 'Video', url: activity.videoLink, class: 'resource-video' });
          if (activity.musicLink) resources.push({ label: 'Music', url: activity.musicLink, class: 'resource-music' });
          if (activity.backingLink) resources.push({ label: 'Backing', url: activity.backingLink, class: 'resource-backing' });
          if (activity.resourceLink) resources.push({ label: 'Resource', url: activity.resourceLink, class: 'resource-resource' });
          if (activity.link) resources.push({ label: 'Link', url: activity.link, class: 'resource-link' });
          if (activity.vocalsLink) resources.push({ label: 'Vocals', url: activity.vocalsLink, class: 'resource-vocals' });
          if (activity.imageLink) resources.push({ label: 'Image', url: activity.imageLink, class: 'resource-image' });
          if ((activity as any).canvaLink) resources.push({ label: 'Canva', url: (activity as any).canvaLink, class: 'resource-canva' });
          if (resources.length > 0) {
            htmlContent += `<div class="activity-resources">`;
            resources.forEach(r => {
              htmlContent += `<a href="${r.url}" target="_blank" rel="noopener noreferrer" class="resource-tag ${r.class}">${r.label}</a>`;
            });
            htmlContent += `</div>`;
          }
          htmlContent += `</div></div>`;
        });
        htmlContent += `</div>`;
      });
      htmlContent += `</div>`;
    }

    // Add notes if available
    if (lessonData.notes) {
      htmlContent += `
        <div style="margin-top: 12px; padding: 10px 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; border-left: 4px solid #9ca3af;">
          <div style="font-size: 11px; font-weight: 600; color: #374151; margin-bottom: 6px;">Teacher Notes</div>
          <div style="font-size: 10px; color: #1f2937; line-height: 1.5;">${lessonData.notes}</div>
        </div>
      `;
    }

    htmlContent += `
          </div>
          <div class="pdf-end" aria-hidden="true"></div>
        </div>
      </body>
      </html>
    `;

    // Footer content
    const branding = settings?.branding || {};
    const productName = branding.loginTitle || 'Creative Curriculum Designer';
    const footerCompany = branding.footerCompanyName || 'Rhythmstix';
    const footerYear = branding.footerCopyrightYear || new Date().getFullYear().toString();
    const footerText = lessonData.customFooter || 
      [productName, `Lesson ${termSpecificNumber}`, currentSheetInfo.display, halfTermName, `© ${footerCompany} ${footerYear}`]
        .filter(Boolean)
        .join(' • ');
    
    const footerContent = `
      <div style="width: 100%; font-size: 11px; color: #000000; font-weight: bold;">
        <p style="text-align: center; margin: 0 0 2px 0;">${footerText}</p>
        <p style="text-align: center; margin: 0; font-size: 10px; font-weight: 600;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></p>
      </div>
    `;

    // No repeating header on each PDF page (date/title were removed per user request)
    const headerContent = '<div></div>';

    return [htmlContent, footerContent, headerContent];
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

  // Copy to clipboard (works best when called from a direct user gesture; may fail after async delay).
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
    // Fallback: execCommand works in more contexts and when clipboard API is blocked (e.g. after async)
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
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return !!successful;
    } catch (fallbackErr) {
      if (import.meta.env.DEV) console.warn('Fallback clipboard copy failed:', fallbackErr);
      return false;
    }
  };

  // Main share function
  const shareLesson = async (lessonNumber: string): Promise<string | null> => {
    // Prevent multiple simultaneous calls
    if (isSharing) {
      console.warn('Share already in progress, ignoring duplicate call');
      return null;
    }

    // Reuse stored URL only if it's already a short link (not the long blob URL)
    const storedUrl = getStoredShareUrl(lessonNumber);
    const isBlobUrl = storedUrl && /blob\.vercel-storage\.com|vercel-storage\.com/.test(storedUrl);
    if (storedUrl && !isBlobUrl) {
      console.log('✅ Found stored share URL for lesson', lessonNumber, '- reusing existing link');
      const clipboardSuccess = await copyToClipboard(storedUrl);
      if (clipboardSuccess) {
        setShareUrl(storedUrl);
        return storedUrl;
      }
    }
    if (storedUrl && isBlobUrl) {
      console.log('🔄 Stored URL is long blob link – regenerating to get short URL');
    } else if (!storedUrl) {
      console.log('🔄 No stored URL found for lesson', lessonNumber, '- generating new PDF');
    }

    // Proceed with PDF generation to get (or refresh) short URL
    setIsSharing(true);
    setShareUrl(null);
    setShareError(null);

    try {
      // Basic validation: need lesson data and some HTML (avoid sending completely empty body)
      const lessonData = allLessonsData[lessonNumber];
      if (!lessonData) {
        throw new Error('No lesson data. Save the lesson and try again.');
      }
      const [htmlContent, footerContent, headerContent] = generateHTMLContent(lessonNumber);
      if (htmlContent == null || String(htmlContent).length === 0) {
        throw new Error('Lesson has no content to export. Add activities or content first.');
      }
      const encodedHtml = encodeUnicodeBase64(htmlContent);
      const encodedFooter = encodeUnicodeBase64(footerContent || '');
      const encodedHeader = encodeUnicodeBase64(headerContent || '');

      // Generate filename
      const getLessonDisplayNumber = (num: string): string => {
        const numericPart = num.replace(/^lesson/i, '').replace(/[^0-9]/g, '');
        return numericPart || num;
      };
      
      const lessonDisplayNumber = getLessonDisplayNumber(lessonNumber);
      const timestamp = Date.now();
      const fileName = `shared-pdfs/${timestamp}_${currentSheetInfo.sheet}_Lesson_${lessonDisplayNumber}.pdf`;

      // Use Vercel API (bypasses CORS)
      const { getPdfApiUrl } = await import('../utils/pdfApi');
      const pdfApiUrl = getPdfApiUrl();
      
      console.log('Generating PDF via API:', pdfApiUrl);
      
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
            headerTemplate: encodedHeader,
            fileName: fileName,
            lessonNumber: lessonNumber
          })
        });
      } catch (fetchError: any) {
        console.error('Network error calling PDF API:', fetchError);
        console.error('API URL attempted:', pdfApiUrl);
        throw new Error(`Failed to connect to PDF generation service. This might be a network issue or the API may not be deployed. Error: ${fetchError.message || 'Network error'}`);
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
        
        // If it's a server configuration error, provide helpful message
        if (errorData.error === 'Server configuration error' || uploadResponse.status === 500) {
          // Check if it's a Blob token error
          if (errorData.error?.includes('BLOB_READ_WRITE_TOKEN') || errorData.error?.includes('Blob store')) {
            throw new Error(
              'Vercel Blob Storage not configured.\n\nSetup:\n1. Go to Vercel Dashboard → Your Project → Storage tab\n2. Click "Create Blob Store"\n3. Name it (e.g., "lesson-pdfs")\n4. Redeploy your project\n\nThe BLOB_READ_WRITE_TOKEN is automatically created by Vercel.'
            );
          }
          throw new Error(
            'PDF generation service error. ' +
            'Please check Vercel function logs for details. ' +
            'Ensure PDFBOLT_API_KEY and BLOB_READ_WRITE_TOKEN are set in Vercel environment variables.'
          );
        }
        
        // If API not found
        if (uploadResponse.status === 404) {
          const isDev = import.meta.env.DEV;
          const vercelUrl = import.meta.env.VITE_VERCEL_URL;
          
          let helpfulMessage: string;
          if (isDev) {
            if (!vercelUrl) {
              helpfulMessage = 'PDF API not found in development.\n\nTo test locally:\n1. Add VITE_VERCEL_URL=https://your-app.vercel.app to your .env file\n2. Restart the dev server\n\nOr test in production where the API route is automatically available.';
            } else {
              helpfulMessage = `PDF API not found at ${pdfApiUrl}.\n\nPlease ensure:\n1. Your Vercel app is deployed\n2. The api/generate-pdf.js route exists\n3. Environment variables are set in Vercel\n4. The deployment completed successfully`;
            }
          } else {
            helpfulMessage = 'PDF API not found. Please ensure:\n1. api/generate-pdf.js exists in your project\n2. The project is deployed on Vercel\n3. Environment variables (PDFBOLT_API_KEY, BLOB_READ_WRITE_TOKEN) are set in Vercel\n4. A Blob store is created in Vercel Dashboard → Storage\n5. The deployment completed successfully';
          }
          throw new Error(helpfulMessage);
        }
        
        throw new Error(errorData.error || `Upload failed: ${uploadResponse.status}`);
      }

      let responseData: { url?: string; publicUrl?: string; shortUrl?: string; error?: string };
      try {
        responseData = await uploadResponse.json();
      } catch (parseErr) {
        throw new Error(
          'PDF service returned an invalid response. The server may be misconfigured—check Vercel function logs.'
        );
      }
      const publicUrl = responseData?.url ?? responseData?.publicUrl;
      if (!publicUrl || typeof publicUrl !== 'string') {
        const serverMsg = responseData?.error ? ` Server: ${responseData.error}` : '';
        throw new Error(`No share URL was returned.${serverMsg}`);
      }
      // Prefer short URL (e.g. ccdesigner.co.uk/pdf/1) when the API registered one
      const displayUrl = (responseData?.shortUrl && typeof responseData.shortUrl === 'string') ? responseData.shortUrl : publicUrl;

      storeShareUrl(lessonNumber, displayUrl);
      setShareUrl(displayUrl);

      // Copy to clipboard (may fail after async when browser requires a user gesture)
      const clipboardSuccess = await copyToClipboard(displayUrl);
      if (!clipboardSuccess) {
        // Don't throw: URL is still shown; user can click the Copy button (fresh gesture) to copy
        if (import.meta.env.DEV) console.warn('Auto-copy failed; URL is shown for manual copy');
      }

      return displayUrl;
    } catch (error: any) {
      console.error('Share failed:', error);
      setShareError(error.message);
      throw error;
    } finally {
      setIsSharing(false);
    }
  };

  /**
   * Generate PDF via the same service as Copy Link and return the public URL (no clipboard).
   * Use this for "Download PDF" so the file is identical to the share link (teal styling, clickable links).
   */
  const getPdfUrl = async (lessonNumber: string): Promise<string | null> => {
    const storedUrl = getStoredShareUrl(lessonNumber);
    if (storedUrl) return storedUrl;

    if (isSharing) return null;
    setIsSharing(true);
    setShareError(null);
    try {
      // Note: Using Vercel Blob Storage - no bucket check needed
      // The API will handle errors if Blob store is not configured
      const [htmlContent, footerContent, headerContent] = generateHTMLContent(lessonNumber);
      const encodedHtml = encodeUnicodeBase64(htmlContent);
      const encodedFooter = encodeUnicodeBase64(footerContent);
      const encodedHeader = encodeUnicodeBase64(headerContent);
      const getLessonDisplayNumber = (num: string): string => {
        const n = num.replace(/^lesson/i, '').replace(/[^0-9]/g, '');
        return n || num;
      };
      const lessonDisplayNumber = getLessonDisplayNumber(lessonNumber);
      const timestamp = Date.now();
      const fileName = `shared-pdfs/${timestamp}_${currentSheetInfo.sheet}_Lesson_${lessonDisplayNumber}.pdf`;

      const { getPdfApiUrl } = await import('../utils/pdfApi');
      const pdfApiUrl = getPdfApiUrl();
      if (import.meta.env.DEV) console.log('[PDF] Using service:', pdfApiUrl);

      const uploadResponse = await fetch(pdfApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: encodedHtml,
          footerTemplate: encodedFooter,
          headerTemplate: encodedHeader,
          fileName,
          lessonNumber,
        }),
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        let errData: { error?: string } = {};
        try { errData = JSON.parse(errorText); } catch { errData = { error: errorText }; }
        if (uploadResponse.status === 404) {
          throw new Error('PDF service not found. Please ensure api/generate-pdf is deployed on Vercel.');
        }
        throw new Error(errData.error || `PDF service error: ${uploadResponse.status}`);
      }

      const responseData = await uploadResponse.json();
      const publicUrl = responseData.url || responseData.publicUrl;
      if (!publicUrl) throw new Error('No URL returned from PDF service');
      // Prefer short URL (e.g. yoursite.com/pdf/1) when the API registered one
      const displayUrl = (responseData.shortUrl && typeof responseData.shortUrl === 'string') ? responseData.shortUrl : publicUrl;
      storeShareUrl(lessonNumber, displayUrl);
      return displayUrl;
    } catch (error: any) {
      setShareError(error.message);
      throw error;
    } finally {
      setIsSharing(false);
    }
  };

  return {
    shareLesson,
    getPdfUrl,
    isSharing,
    shareUrl,
    shareError,
    getStoredShareUrl
  };
}

