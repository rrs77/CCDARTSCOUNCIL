import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, X, Check, Tag, ChevronDown, Share2, Copy, Link2, Target, Loader2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import type { Activity } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContextNew';
import { customObjectivesApi } from '../config/customObjectivesApi';
import type { CustomObjective, CustomObjectiveArea, CustomObjectiveYearGroup } from '../types/customObjectives';
import { supabase } from '../config/supabase';
import { getPdfApiUrl } from '../utils/pdfApi';
import { useShareLesson } from '../hooks/useShareLesson';
import toast from 'react-hot-toast';

// A4 dimensions and PDFBolt margin settings
// These MUST match the PDFBolt API settings exactly for accurate preview
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MM_TO_PX = 3.7795275591; // 1mm = 3.7795275591 pixels at 96 DPI

// A4 dimensions in pixels at 96 DPI
const A4_WIDTH_PX = A4_WIDTH_MM * MM_TO_PX; // ~794px
const A4_HEIGHT_PX = A4_HEIGHT_MM * MM_TO_PX; // ~1122px

// PDFBolt margin settings (in pixels) - MUST match API call
const PDFBOLT_MARGIN_TOP_PX = 15;
const PDFBOLT_MARGIN_BOTTOM_PX = 55; // Includes footer space
const PDFBOLT_MARGIN_LEFT_PX = 20;
const PDFBOLT_MARGIN_RIGHT_PX = 20;

// Available content area height (A4 height minus top and bottom margins)
const PAGE_CONTENT_HEIGHT_PX = A4_HEIGHT_PX - PDFBOLT_MARGIN_TOP_PX - PDFBOLT_MARGIN_BOTTOM_PX; // ~1052px

interface LessonPrintModalProps {
  lessonNumber?: string;
  onClose: () => void;
  halfTermId?: string;
  halfTermName?: string;
  unitId?: string;
  unitName?: string;
  lessonNumbers?: string[];
  isUnitPrint?: boolean;
  /** When true, modal runs PDF export once and then closes (no preview). */
  autoDownload?: boolean;
  /** When true, no modal UI; open system print dialog immediately with lesson content, then close. */
  systemPrintOnly?: boolean;
  /** When true, no modal UI; run PDFBolt export (PDF with working hyperlinks) and download, then close. */
  pdfDownloadOnly?: boolean;
}

export function LessonPrintModal({
                                   lessonNumber,
                                   onClose,
                                   halfTermId,
                                   halfTermName,
                                   unitId,
                                   unitName,
                                   lessonNumbers,
                                   isUnitPrint = false,
                                   autoDownload = false,
                                   systemPrintOnly = false,
                                   pdfDownloadOnly = false
                                 }: LessonPrintModalProps) {
  const { 
    allLessonsData, 
    currentSheetInfo, 
    lessonStandards, 
    halfTerms,
    getTermSpecificLessonNumber,
    getLessonDisplayTitle
  } = useData();
  const { getCategoryColor, settings } = useSettings();
  const branding = settings?.branding || {};
  const productName = branding.loginTitle || 'Creative Curriculum Designer';
  const footerCompany = branding.footerCompanyName || 'Rhythmstix';
  const footerYear = branding.footerCopyrightYear || new Date().getFullYear().toString();
  const { shareLesson: shareSingleLesson, isSharing: isSharingSingle, getStoredShareUrl } = useShareLesson();
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [customObjectives, setCustomObjectives] = useState<CustomObjective[]>([]);
  const [customAreas, setCustomAreas] = useState<CustomObjectiveArea[]>([]);
  const [customYearGroups, setCustomYearGroups] = useState<CustomObjectiveYearGroup[]>([]);
  const [showEyfs, setShowEyfs] = useState(true);
  // exportMode: 'single' if lessonNumber is provided (takes priority), otherwise 'unit' if unitId/halfTermId/isUnitPrint
  const [exportMode, setExportMode] = useState<'single' | 'unit'>(
      lessonNumber ? 'single' : (isUnitPrint || unitId || halfTermId ? 'unit' : 'single')
  );
  // Custom header/footer for export (restored from previous behaviour)
  const [exportUseCustomHeaderFooter, setExportUseCustomHeaderFooter] = useState(false);
  const [exportCustomHeader, setExportCustomHeader] = useState('');
  const [exportCustomFooter, setExportCustomFooter] = useState('');
  
  // Determine which lessons to print (MUST be declared before useEffect that uses it)
  const lessonsToRender = React.useMemo(() => {
    let lessons: string[] = [];

    // Priority 1: If lessonNumber is explicitly provided, use only that lesson (single lesson view)
    // This takes precedence even if unitId or halfTermId are also passed
    if (lessonNumber) {
      lessons = [lessonNumber];
    } 
    // Priority 2: If lessonNumbers array is provided, use those
    else if (lessonNumbers && lessonNumbers.length > 0) {
      lessons = [...lessonNumbers];
    } 
    // Priority 3: If unitId is provided and no specific lesson, get all lessons from unit
    else if (unitId) {
      const units = JSON.parse(localStorage.getItem(`units-${currentSheetInfo.sheet}`) || '[]');
      const unit = units.find((u: any) => u.id === unitId);
      lessons = unit?.lessonNumbers || [];
    } 
    // Priority 4: If halfTermId is provided and no specific lesson, get all lessons from half-term
    else if (halfTermId) {
      const halfTerm = halfTerms.find(term => term.id === halfTermId);
      lessons = halfTerm?.lessons || [];
    }

    // Sort lessons numerically
    return lessons.sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      return numA - numB;
    });
  }, [lessonNumber, lessonNumbers, unitId, halfTermId, halfTerms, currentSheetInfo.sheet]);
  
  // Sync from first lesson when lessons change (uses lessonsToRender, so must come after its declaration)
  React.useEffect(() => {
    if (lessonsToRender.length === 0) return;
    const first = allLessonsData[lessonsToRender[0]];
    if (first?.customHeader !== undefined || first?.customFooter !== undefined) {
      setExportCustomHeader(first.customHeader || '');
      setExportCustomFooter(first.customFooter || '');
      setExportUseCustomHeaderFooter(!!(first.customHeader || first.customFooter));
    }
  }, [lessonsToRender.join(','), allLessonsData]);

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

  // Get custom objectives for a lesson (now stored at lesson level like EYFS statements)
  const getCustomObjectivesForLesson = (lessonNum: string) => {
    const lessonData = allLessonsData[lessonNum];
    if (!lessonData) {
      console.log('🔍 No lesson data found for:', lessonNum);
      return [];
    }

    console.log('🔍 Getting custom objectives for lesson:', lessonNum);
    console.log('🔍 Lesson customObjectives:', lessonData.customObjectives);
    console.log('🔍 Lesson curriculumType:', lessonData.curriculumType);
    console.log('🔍 Available customObjectives count:', customObjectives.length);
    if (customObjectives.length > 0) {
      console.log('🔍 Available customObjectives IDs (first 10):', customObjectives.slice(0, 10).map(obj => obj.id));
      console.log('🔍 Available customObjectives codes (first 10):', customObjectives.slice(0, 10).map(obj => obj.objective_code));
    }
    
    // Get custom objectives stored at lesson level
    const lessonCustomObjectives: CustomObjective[] = [];
    
    if (lessonData.customObjectives && lessonData.customObjectives.length > 0) {
      // Find the custom objectives by their IDs or codes
      // Lesson might store either database IDs or objective codes (e.g., 'eyfs-psed-sr-3')
      lessonData.customObjectives.forEach(objectiveIdOrCode => {
        // Try to find by objective_code first (most common case)
        let objective = customObjectives.find(obj => obj.objective_code === objectiveIdOrCode);
        
        // If not found by code, try to find by ID
        if (!objective) {
          objective = customObjectives.find(obj => obj.id === objectiveIdOrCode);
        }
        
        if (objective) {
          lessonCustomObjectives.push(objective);
        } else {
          console.warn('⚠️ Objective not found:', objectiveIdOrCode);
          if (customObjectives.length > 0) {
            console.warn('   Available IDs (first 5):', customObjectives.slice(0, 5).map(obj => obj.id));
            console.warn('   Available codes (first 5):', customObjectives.slice(0, 5).map(obj => obj.objective_code));
          } else {
            console.warn('   ⚠️ Custom objectives array is empty - they may not be loaded yet');
          }
        }
      });
    }

    console.log('🔍 Total custom objectives found for lesson:', lessonCustomObjectives.length);
    if (lessonCustomObjectives.length > 0) {
      console.log('🔍 Found objectives:', lessonCustomObjectives.map(obj => ({ 
        id: obj.id, 
        code: obj.objective_code,
        text: obj.objective_text?.substring(0, 50) 
      })));
    }
    return lessonCustomObjectives;
  };

  // PDFBolt API configuration (used for unit/half-term Copy Link in this modal; single-lesson Export uses PDF service)
  const PDFBOLT_API_KEY = import.meta.env.VITE_PDFBOLT_API_KEY || '146bdd01-146f-43f8-92aa-26201c38aa11';
  const PDFBOLT_API_URL = 'https://api.pdfbolt.com/v1/direct';

  // Get the title for the print
  const printTitle = React.useMemo(() => {
    if (exportMode === 'single' && lessonNumber) {
      const lessonData = allLessonsData[lessonNumber];
      return lessonData?.title || `Lesson ${lessonNumber}`;
    } else if (unitName) {
      return `Unit: ${unitName}`;
    } else if (halfTermName) {
      return `Half-Term: ${halfTermName}`;
    }
    return 'Lesson Plan';
  }, [exportMode, lessonNumber, unitName, halfTermName, allLessonsData]);

  // Generate HTML content for PDFBolt with custom styling (no Tailwind dependency)
  const generateHTMLContent = async () => {
    // Ensure custom objectives are loaded before generating PDF
    // Use local variables to avoid closure issues with state
    let objectivesToUse = customObjectives;
    let areasToUse = customAreas;
    let yearGroupsToUse = customYearGroups;
    
    if (objectivesToUse.length === 0 || areasToUse.length === 0) {
      console.log('⏳ Custom objectives not loaded yet, loading now...');
      try {
        const [objectives, areas, yearGroups] = await Promise.all([
          customObjectivesApi.objectives.getAll(),
          customObjectivesApi.areas.getAll(),
          customObjectivesApi.yearGroups.getAll()
        ]);
        objectivesToUse = objectives;
        areasToUse = areas;
        yearGroupsToUse = yearGroups;
        // Also update state for future use
        setCustomObjectives(objectives);
        setCustomAreas(areas);
        setCustomYearGroups(yearGroups);
        console.log('✅ Custom objectives loaded:', { objectives: objectives.length, areas: areas.length });
      } catch (error) {
        console.warn('⚠️ Failed to load custom objectives during PDF generation:', error);
        // Continue anyway - PDF will be generated without custom objectives
      }
    }
    
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${printTitle}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #1a1a1a;
            background: #fff;
          }
          
          @page {
            size: A4;
            margin: 12mm 15mm 25mm 15mm;
          }
          
          .lesson-page {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            padding: 0;
            position: relative;
            min-height: calc(100vh - 25mm);
          }
          
          /* Header Section - dark teal-green banner (preview style) */
          .lesson-header {
            background: #0f766e;
            color: white;
            padding: 20px 24px;
            border-radius: 8px 8px 0 0;
            margin-bottom: 0;
          }
          
          .lesson-header h1 {
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 6px;
            letter-spacing: -0.02em;
            color: white;
          }
          
          .lesson-header .subtitle {
            font-size: 14px;
            opacity: 0.95;
            font-weight: 500;
            margin-bottom: 10px;
          }
          
          .lesson-header .meta {
            display: flex;
            gap: 20px;
            margin-top: 8px;
            font-size: 11px;
            opacity: 0.9;
          }
          
          .lesson-header .meta-item {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          /* Content Container - clean white */
          .content-wrapper {
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 8px 8px;
            padding: 16px;
            background: #fff;
          }
          
          /* Section Cards */
          .section-card {
            background: white;
            border-radius: 6px;
            margin-bottom: 10px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06);
            page-break-inside: avoid;
          }
          
          .section-header {
            padding: 8px 12px;
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            border-bottom: 1px solid rgba(0,0,0,0.08);
          }
          
          .section-content {
            padding: 10px 12px;
            font-size: 10px;
            line-height: 1.5;
          }
          
          .section-content ul {
            margin: 0;
            padding-left: 20px;
            list-style-type: disc;
          }
          
          .section-content ul li {
            margin-bottom: 3px;
            list-style-type: disc;
            display: list-item;
          }
          
          .section-content ol {
            margin: 0;
            padding-left: 20px;
            list-style-type: decimal;
          }
          
          .section-content ol li {
            margin-bottom: 3px;
            list-style-type: decimal;
            display: list-item;
          }
          
          .section-content p {
            margin-bottom: 6px;
          }
          
          .section-content p:last-child {
            margin-bottom: 0;
          }
          
          /* Two Column Layout */
          .two-col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 10px;
          }
          
          .two-col .section-card {
            margin-bottom: 0;
          }
          
          /* Simplified Color Themes - Teal, Blue, and Muted tones */
          .theme-teal .section-header { background: #f0fdfa; color: #0f766e; border-left: 4px solid #0d9488; }
          .theme-teal-dark .section-header { background: #ccfbf1; color: #115e59; border-left: 4px solid #0f766e; }
          .theme-blue .section-header { background: #eff6ff; color: #1e40af; border-left: 4px solid #3b82f6; }
          .theme-blue-light .section-header { background: #f0f9ff; color: #0369a1; border-left: 4px solid #0ea5e9; }
          .theme-slate .section-header { background: #f8fafc; color: #475569; border-left: 4px solid #64748b; }
          .theme-gray .section-header { background: #f9fafb; color: #4b5563; border-left: 4px solid #6b7280; }
          
          /* Activity Section - preview style */
          .activity-section {
            margin-top: 16px;
          }
          
          /* Category wrapper - prevents heading from appearing alone */
          .category-group {
            break-inside: avoid;
            page-break-inside: avoid;
            margin-bottom: 10px;
          }
          
          /* Section headings (Welcome, Introduce Bailey, etc.) - orange-brown/gold */
          .activity-category {
            font-size: 14px;
            font-weight: 700;
            color: #B8860B;
            padding: 8px 0;
            margin-bottom: 10px;
            border-bottom: none;
          }
          
          /* Activity card - light mint green header bar and left border */
          .activity-card {
            background: white;
            border: 1px solid #d1e7dd;
            border-radius: 6px;
            margin-bottom: 10px;
            overflow: hidden;
            border-left: 4px solid #0f766e;
            box-shadow: 0 1px 2px rgba(0,0,0,0.04);
            break-inside: avoid;
            page-break-inside: avoid;
          }
          
          .activity-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 14px;
            background: #E6F7ED;
            border-bottom: 1px solid #d1e7dd;
          }
          
          .activity-title {
            font-weight: 700;
            font-size: 12px;
            color: #0f766e;
          }
          
          .activity-time {
            background: #0f766e;
            color: white;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 10px;
            font-weight: 600;
          }
          
          .activity-body {
            padding: 12px 14px;
            font-size: 11px;
            color: #1f2937;
            line-height: 1.5;
          }
          
          .activity-body ul {
            list-style-type: disc;
            padding-left: 20px;
            margin: 4px 0;
          }
          
          .activity-body ul li {
            list-style-type: disc;
            display: list-item;
            margin-bottom: 2px;
          }
          
          .activity-body ol {
            list-style-type: decimal;
            padding-left: 20px;
            margin: 4px 0;
          }
          
          .activity-body ol li {
            list-style-type: decimal;
            display: list-item;
            margin-bottom: 2px;
          }
          
          .activity-resources {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #e5e7eb;
          }
          
          .resource-tag {
            font-size: 10px;
            padding: 4px 10px;
            font-weight: 500;
            text-decoration: none;
            border-radius: 50px;
            display: inline-block;
            transition: all 0.2s;
          }
          
          /* Video - Red */
          .resource-tag.resource-video {
            color: #dc2626;
            border: 2px solid #dc2626;
            background: #fef2f2;
          }
          
          /* Music - Green */
          .resource-tag.resource-music {
            color: #16a34a;
            border: 2px solid #16a34a;
            background: #f0fdf4;
          }
          
          /* Backing - Blue */
          .resource-tag.resource-backing {
            color: #2563eb;
            border: 2px solid #2563eb;
            background: #eff6ff;
          }
          
          /* Resource - Purple */
          .resource-tag.resource-resource {
            color: #9333ea;
            border: 2px solid #9333ea;
            background: #faf5ff;
          }
          
          /* Link - Gray */
          .resource-tag.resource-link {
            color: #6b7280;
            border: 2px solid #6b7280;
            background: #f9fafb;
          }
          
          /* Vocals - Orange */
          .resource-tag.resource-vocals {
            color: #ea580c;
            border: 2px solid #ea580c;
            background: #fff7ed;
          }
          
          /* Image - Pink */
          .resource-tag.resource-image {
            color: #db2777;
            border: 2px solid #db2777;
            background: #fdf2f8;
          }
          
          /* Canva - Indigo */
          .resource-tag.resource-canva {
            color: #4f46e5;
            border: 2px solid #4f46e5;
            background: #eef2ff;
          }
          
          .resource-tag:hover {
            opacity: 0.8;
          }
          
          /* Learning Goals boxes - ensure bullets stay inside */
          .learning-outcome-content,
          .success-criteria-content {
            overflow: hidden;
            box-sizing: border-box;
          }
          
          .learning-outcome-content ul,
          .learning-outcome-content ol,
          .success-criteria-content ul,
          .success-criteria-content ol {
            list-style: none !important;
            padding-left: 0 !important;
            margin-left: 0 !important;
            margin-top: 0 !important;
            margin-bottom: 0 !important;
          }
          
          .learning-outcome-content li,
          .success-criteria-content li {
            list-style: none !important;
            padding-left: 0 !important;
            margin-left: 0 !important;
          }
          
          .learning-outcome-content li::before,
          .success-criteria-content li::before {
            content: none !important;
          }
          
          /* Print styles */
          @media print {
            body { background: white; }
            .lesson-page { box-shadow: none; min-height: auto; }
            .content-wrapper { background: white; }
          }
        </style>
      </head>
      <body>
        <div class="lesson-page">
    `;

    lessonsToRender.forEach((lessonNum, lessonIndex) => {
      const lessonData = allLessonsData[lessonNum];
      if (!lessonData) return;

      // Extract numeric lesson number (handle "lesson1" format)
      const getLessonDisplayNumber = (num: string): string => {
        const numericPart = num.replace(/^lesson/i, '').replace(/[^0-9]/g, '');
        return numericPart || num;
      };
      
      const lessonDisplayNumber = getLessonDisplayNumber(lessonNum);
      const termSpecificNumber = halfTermId ? getTermSpecificLessonNumber(lessonNum, halfTermId) : lessonDisplayNumber;


      // Get standards from multiple possible locations
      const lessonStandardsList = lessonData.lessonStandards || 
                                  lessonStandards[lessonNum] || 
                                  lessonStandards[lessonIndex + 1] || 
                                  lessonStandards[(lessonIndex + 1).toString()] || 
                                  [];

      // Group EYFS statements by area
      const groupedEyfs: Record<string, string[]> = {};
      lessonStandardsList.forEach(statement => {
        if (statement && typeof statement === 'string') {
          const parts = statement.split(':');
          const area = parts[0].trim();
          const detail = parts.length > 1 ? parts.slice(1).join(':').trim() : statement;
          if (area && detail) {
            if (!groupedEyfs[area]) groupedEyfs[area] = [];
            groupedEyfs[area].push(detail);
          }
        }
      });

      // Lesson title
      const lessonTitle = lessonData.title || `Lesson ${termSpecificNumber}`;
      const lessonSubtitle = lessonData.lessonName || `${halfTermName || unitName || 'Autumn 1'} - ${currentSheetInfo.display}`;

      htmlContent += `
          <!-- Lesson Header -->
          <div class="lesson-header">
            <h1>${(exportUseCustomHeaderFooter && exportCustomHeader) ? exportCustomHeader : (lessonData.customHeader || lessonTitle)}</h1>
            <div class="subtitle">${lessonSubtitle}</div>
            <div class="meta">
              <span class="meta-item">📚 ${currentSheetInfo.display}</span>
              <span class="meta-item">⏱ ${lessonData.totalTime || 45} mins</span>
              <span class="meta-item">📅 ${halfTermName || unitName || 'Term 1'}</span>
            </div>
          </div>
          
          <div class="content-wrapper">
      `;

      // Get custom objectives for this lesson (needed for Learning Goals)
      // Use a local version that uses the loaded objectives
      const getCustomObjectivesForLessonLocal = (lessonNum: string) => {
        const lessonData = allLessonsData[lessonNum];
        if (!lessonData) return [];
        
        const lessonCustomObjectives: CustomObjective[] = [];
        if (lessonData.customObjectives && lessonData.customObjectives.length > 0) {
          lessonData.customObjectives.forEach(objectiveIdOrCode => {
            // Try to find by objective_code first (most common case)
            let objective = objectivesToUse.find(obj => obj.objective_code === objectiveIdOrCode);
            // If not found by code, try to find by ID
            if (!objective) {
              objective = objectivesToUse.find(obj => obj.id === objectiveIdOrCode);
            }
            if (objective) {
              lessonCustomObjectives.push(objective);
            }
          });
        }
        return lessonCustomObjectives;
      };
      
      const lessonCustomObjectives = getCustomObjectivesForLessonLocal(lessonNum);
      
      // Group custom objectives by section, then by area
      const groupedCustomObjectives: Record<string, Record<string, CustomObjective[]>> = {};
      lessonCustomObjectives.forEach(objective => {
        const area = areasToUse.find(a => a.id === objective.area_id);
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

      // Add Learning Goals at the very top (EYFS or Custom Objectives, grouped by area like example)
      console.log('🔍 Learning Goals Debug:', {
        lessonNum,
        lessonDataLessonStandards: lessonData.lessonStandards,
        lessonStandardsFromContext: lessonStandards[lessonNum],
        lessonStandardsListLength: lessonStandardsList.length,
        lessonStandardsList,
        groupedEyfsKeys: Object.keys(groupedEyfs).length,
        groupedEyfs,
        customObjectivesCount: lessonCustomObjectives.length,
        groupedCustomObjectivesKeys: Object.keys(groupedCustomObjectives).length,
        groupedCustomObjectives
      });
      
      // Show Learning Goals if there are EYFS standards OR custom objectives
      const hasEyfsStandards = lessonStandardsList.length > 0 && Object.keys(groupedEyfs).length > 0;
      const hasCustomObjectives = Object.keys(groupedCustomObjectives).length > 0;
      
      if (hasEyfsStandards || hasCustomObjectives) {
        htmlContent += `
          <div style="margin-bottom: 20px;">
            <div style="display: flex; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
              <svg style="width: 18px; height: 18px; color: #0f766e; margin-right: 8px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
              </svg>
              <h3 style="font-size: 16px; font-weight: 700; color: #111827; margin: 0;">Learning Goals</h3>
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
        `;
        
        // Show EYFS Learning Goals if they exist
        if (hasEyfsStandards) {
          // If grouping failed, use raw standards
          if (Object.keys(groupedEyfs).length === 0) {
            groupedEyfs['Learning Goals'] = lessonStandardsList.map(s => {
              const parts = s.split(':');
              return parts.length > 1 ? parts.slice(1).join(':').trim() : s;
            });
          }
          
          Object.entries(groupedEyfs).forEach(([area, statements]) => {
            if (statements && statements.length > 0) {
              htmlContent += `
                <div style="background-color: #fffbeb; border: 1px solid #1f2937; border-radius: 8px; padding: 12px;">
                  <h4 style="font-size: 12px; font-weight: 700; color: #1f2937; margin: 0 0 8px 0;">${area}</h4>
                  <ul style="list-style: none; padding: 0; margin: 0;">
              `;
              statements.forEach(statement => {
                if (statement && statement.trim()) {
                  htmlContent += `
                    <li style="display: flex; align-items: flex-start; margin-bottom: 6px; font-size: 11px; color: #1f2937; line-height: 1.4;">
                      <span style="color: #16a34a; font-weight: 700; margin-right: 6px; flex-shrink: 0;">✓</span>
                      <span>${statement}</span>
                    </li>
                  `;
                }
              });
              htmlContent += `</ul></div>`;
            }
          });
        }
        
        // Show Custom Objectives Learning Goals if they exist (and no EYFS)
        if (hasCustomObjectives && !hasEyfsStandards) {
          Object.entries(groupedCustomObjectives).forEach(([sectionName, areas]) => {
            Object.entries(areas).forEach(([areaName, objectives]) => {
              let displayTitle = areaName;
              if (sectionName && sectionName !== 'Other' && sectionName !== areaName) {
                if (!areaName.includes(sectionName)) {
                  displayTitle = `${sectionName}, ${areaName}`;
                }
              }
              
              htmlContent += `
                <div style="background-color: #fffbeb; border: 1px solid #1f2937; border-radius: 8px; padding: 12px;">
                  <h4 style="font-size: 12px; font-weight: 700; color: #1f2937; margin: 0 0 8px 0;">${displayTitle}</h4>
                  <ul style="list-style: none; padding: 0; margin: 0;">
              `;
              objectives.forEach(objective => {
                if (objective.objective_text && objective.objective_text.trim()) {
                  htmlContent += `
                    <li style="display: flex; align-items: flex-start; margin-bottom: 6px; font-size: 11px; color: #1f2937; line-height: 1.4;">
                      <span style="color: #16a34a; font-weight: 700; margin-right: 6px; flex-shrink: 0;">✓</span>
                      <span>${objective.objective_text}</span>
                    </li>
                  `;
                }
              });
              htmlContent += `</ul></div>`;
            });
          });
        }
        
        htmlContent += `</div></div>`;
      }

      // Add Learning Goals from lesson builder (learningOutcome and successCriteria)
      if (lessonData.learningOutcome || lessonData.successCriteria) {
        htmlContent += `
          <div style="margin-bottom: 20px;">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <svg style="width: 18px; height: 18px; color: #0f766e; margin-right: 8px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <h3 style="font-size: 16px; font-weight: 700; color: #111827; margin: 0;">Learning Goals</h3>
            </div>
        `;
        
        // Helper function to remove bullet points from HTML (convert <ul><li> to line breaks)
        const removeBulletPoints = (html: string): string => {
          // Replace <li> tags with line breaks, then remove <ul> and </ul> tags
          return html
            .replace(/<li[^>]*>/gi, '<br/>')
            .replace(/<\/li>/gi, '')
            .replace(/<ul[^>]*>/gi, '')
            .replace(/<\/ul>/gi, '')
            .replace(/\n/g, '<br>');
        };
        
        if (lessonData.learningOutcome) {
          htmlContent += `
            <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 12px; margin-bottom: 10px; overflow: hidden; box-sizing: border-box;">
              <h4 style="font-size: 12px; font-weight: 600; color: #92400e; margin: 0 0 6px 0;">
                Lesson Outcomes
              </h4>
              <div class="learning-outcome-content" style="font-size: 11px; color: #1f2937; line-height: 1.5; overflow: hidden; box-sizing: border-box;">
                ${removeBulletPoints(lessonData.learningOutcome)}
              </div>
            </div>
          `;
        }
        
        if (lessonData.successCriteria) {
          htmlContent += `
            <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 12px; overflow: hidden; box-sizing: border-box;">
              <h4 style="font-size: 12px; font-weight: 600; color: #166534; margin: 0 0 6px 0;">
                Success Criteria
              </h4>
              <div class="success-criteria-content" style="font-size: 11px; color: #1f2937; line-height: 1.5; overflow: hidden; box-sizing: border-box;">
                ${removeBulletPoints(lessonData.successCriteria)}
              </div>
            </div>
          `;
        }
        
        htmlContent += `</div>`;
      }

      // Add Standards section at the top (as tags/pills like in UI)
      if (lessonStandardsList.length > 0) {
        htmlContent += `
          <div style="margin-bottom: 16px;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <svg style="width: 16px; height: 16px; color: #0f766e; margin-right: 8px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
              </svg>
              <h3 style="font-size: 14px; font-weight: 600; color: #111827; margin: 0;">Standards (${lessonStandardsList.length})</h3>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px; background: #f0fdfa; border: 1px solid #0f766e; border-radius: 8px; padding: 10px;">
        `;
        lessonStandardsList.forEach((standard, index) => {
          // Extract the text after the colon if present, otherwise use full text
          const standardText = standard.includes(':') ? standard.split(':').slice(1).join(':').trim() : standard;
          htmlContent += `
            <span style="display: inline-block; padding: 4px 10px; background: white; border: 1px solid #0f766e; border-radius: 50px; font-size: 10px; color: #0f766e; font-weight: 500;">
              ${standardText.length > 50 ? standardText.substring(0, 47) + '...' : standardText}
            </span>
          `;
        });
        htmlContent += `</div></div>`;
      }

      // Note: Learning Goals (EYFS or Custom Objectives) are now shown at the very top (above)

      // CLEAN LESSON PLAN LAYOUT - Matching preview style
      // Simple headers with rounded content boxes
      
      const hasLessonPlanDetails = lessonData.learningOutcome || lessonData.successCriteria || 
        lessonData.introduction || lessonData.mainActivity || lessonData.plenary ||
        lessonData.vocabulary || lessonData.keyQuestions || lessonData.resources ||
        lessonData.differentiation || lessonData.assessment;

      if (hasLessonPlanDetails) {
        
        // Helper function for clean section rendering - matching Full Lesson Preview
        const renderCleanSection = (title: string, content: string, iconSvg?: string) => {
          return `
            <div style="margin-bottom: 12px;">
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                ${iconSvg ? `<span style="margin-right: 8px; color: #0d9488; display: inline-flex; align-items: center;">${iconSvg}</span>` : ''}
                <h3 style="font-size: 13px; font-weight: 600; color: #111827; margin: 0;">${title}</h3>
              </div>
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">
                <div style="font-size: 10px; color: #374151; line-height: 1.5;">${content}</div>
              </div>
            </div>
          `;
        };

        // Target icon SVG (matching Full Lesson Preview)
        const targetIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>';

        // Note: Learning Outcome and Success Criteria are now shown at the top as "Learning Goals"
        // They are not repeated here in the lesson plan details section

        // Assessment Objectives (if any)
        if (lessonData.assessmentObjectives && lessonData.assessmentObjectives.length > 0) {
          const objectivesList = lessonData.assessmentObjectives.map((obj: string, i: number) => 
            `<div style="margin-bottom: 6px;"><strong style="color: #7c3aed;">${i + 1}.</strong> ${obj}</div>`
          ).join('');
          htmlContent += renderCleanSection('Assessment Objectives', objectivesList);
        }

        // Introduction
        if (lessonData.introduction) {
          htmlContent += renderCleanSection('Introduction', lessonData.introduction);
        }

        // Main Activity
        if (lessonData.mainActivity) {
          htmlContent += renderCleanSection('Main Activity', lessonData.mainActivity);
        }

        // Plenary
        if (lessonData.plenary) {
          htmlContent += renderCleanSection('Plenary', lessonData.plenary);
        }

        // Vocabulary
        if (lessonData.vocabulary) {
          // Format vocabulary with bold terms
          const formattedVocab = lessonData.vocabulary.replace(/^([^-:]+)(\s*[-:]\s*)/gm, '<strong>$1</strong>$2');
          htmlContent += renderCleanSection('Vocabulary', formattedVocab);
        }

        // Key Questions
        if (lessonData.keyQuestions) {
          htmlContent += renderCleanSection('Key Questions', lessonData.keyQuestions);
        }

        // Resources
        if (lessonData.resources) {
          htmlContent += renderCleanSection('Resources', lessonData.resources);
        }

        // Differentiation
        if (lessonData.differentiation) {
          // Format with bold Support/Challenge labels
          const formattedDiff = lessonData.differentiation
            .replace(/Support:/gi, '<strong>Support:</strong>')
            .replace(/Challenge:/gi, '<strong>Challenge:</strong>');
          htmlContent += renderCleanSection('Differentiation', formattedDiff);
        }

        // Assessment
        if (lessonData.assessment) {
          htmlContent += renderCleanSection('Assessment', lessonData.assessment);
        }
      }

      // Add activities - use orderedActivities if available for correct order, otherwise fall back to categoryOrder
      console.log(`🖨️ Print Debug for Lesson ${lessonNum}:`, {
        hasOrderedActivities: !!(lessonData.orderedActivities && lessonData.orderedActivities.length > 0),
        orderedActivitiesCount: lessonData.orderedActivities?.length || 0,
        orderedActivities: lessonData.orderedActivities?.map((a: Activity) => a.activity) || [],
        categoryOrderCount: lessonData.categoryOrder?.length || 0,
        categoryOrder: lessonData.categoryOrder || []
      });
      
      const activitiesToPrint = lessonData.orderedActivities && lessonData.orderedActivities.length > 0
        ? lessonData.orderedActivities
        : lessonData.categoryOrder.flatMap(category => lessonData.grouped[category] || []);
      
      console.log(`🖨️ Activities to print (${activitiesToPrint.length}):`, activitiesToPrint.map((a: Activity) => a.activity));

      // Group activities by category for display
      const categoriesInOrder: string[] = [];
      const activitiesByCategory: Record<string, Activity[]> = {};
      
      activitiesToPrint.forEach(activity => {
        if (!activitiesByCategory[activity.category]) {
          activitiesByCategory[activity.category] = [];
          categoriesInOrder.push(activity.category);
        }
        activitiesByCategory[activity.category].push(activity);
      });

      // Display activities by category with clean styling
      if (categoriesInOrder.length > 0) {
        htmlContent += `
          <div class="activity-section">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <h3 style="font-size: 14px; font-weight: 700; color: #1f2937; margin: 0;">Activities from Library</h3>
            </div>
        `;
        
        categoriesInOrder.forEach(category => {
          const activities = activitiesByCategory[category] || [];
          if (activities.length === 0) return;

          const categoryColor = getCategoryColor(category);

          // Wrap category heading with first activity to prevent orphaned headings
          // This ensures at least one activity follows the heading on the same page
          htmlContent += `<div class="category-group">`;
          
          htmlContent += `
            <div class="activity-category" style="color: ${categoryColor}; border-bottom-color: ${categoryColor};">
              ${category}
            </div>
          `;

          // Render first activity within the category-group wrapper
          if (activities.length > 0) {
            const firstActivity = activities[0];
            htmlContent += `
              <div class="activity-card" style="border-left: 3px solid ${categoryColor};">
                <div class="activity-header">
                  <span class="activity-title">${firstActivity.activity}</span>
                  ${firstActivity.time > 0 ? `<span class="activity-time">${firstActivity.time} min</span>` : ''}
                </div>
                <div class="activity-body">
                  ${firstActivity.activityText ? `<p style="font-weight: 500; margin-bottom: 6px;">${firstActivity.activityText}</p>` : ''}
                  <div>${firstActivity.description.includes('<') ? firstActivity.description : firstActivity.description.replace(/\n/g, '<br>')}</div>
            `;

            // Resources for first activity
            const firstResources: { label: string; url: string; class: string }[] = [];
            if (firstActivity.videoLink) firstResources.push({ label: 'Video', url: firstActivity.videoLink, class: 'resource-video' });
            if (firstActivity.musicLink) firstResources.push({ label: 'Music', url: firstActivity.musicLink, class: 'resource-music' });
            if (firstActivity.backingLink) firstResources.push({ label: 'Backing', url: firstActivity.backingLink, class: 'resource-backing' });
            if (firstActivity.resourceLink) firstResources.push({ label: 'Resource', url: firstActivity.resourceLink, class: 'resource-resource' });
            if (firstActivity.link) firstResources.push({ label: 'Link', url: firstActivity.link, class: 'resource-link' });
            if (firstActivity.vocalsLink) firstResources.push({ label: 'Vocals', url: firstActivity.vocalsLink, class: 'resource-vocals' });
            if (firstActivity.imageLink) firstResources.push({ label: 'Image', url: firstActivity.imageLink, class: 'resource-image' });
            if (firstActivity.canvaLink) firstResources.push({ label: 'Canva', url: firstActivity.canvaLink, class: 'resource-canva' });

            if (firstResources.length > 0) {
              htmlContent += `<div class="activity-resources">`;
              firstResources.forEach(r => {
                htmlContent += `<a href="${r.url}" target="_blank" rel="noopener noreferrer" class="resource-tag ${r.class}">${r.label}</a>`;
              });
              htmlContent += `</div>`;
            }

            htmlContent += `</div></div>`;
          }
          
          // Close category-group wrapper
          htmlContent += `</div>`;

          // Render remaining activities (if any) outside the wrapper - they can break normally
          if (activities.length > 1) {
            activities.slice(1).forEach(activity => {
              htmlContent += `
                <div class="activity-card" style="border-left: 3px solid ${categoryColor};">
                  <div class="activity-header">
                    <span class="activity-title">${activity.activity}</span>
                    ${activity.time > 0 ? `<span class="activity-time">${activity.time} min</span>` : ''}
                  </div>
                  <div class="activity-body">
                    ${activity.activityText ? `<p style="font-weight: 500; margin-bottom: 6px;">${activity.activityText}</p>` : ''}
                    <div>${activity.description.includes('<') ? activity.description : activity.description.replace(/\n/g, '<br>')}</div>
              `;

              // Resources - clickable shortcuts at bottom of each activity (original export style)
              const resources: { label: string; url: string; class: string }[] = [];
              if (activity.videoLink) resources.push({ label: 'Video', url: activity.videoLink, class: 'resource-video' });
              if (activity.musicLink) resources.push({ label: 'Music', url: activity.musicLink, class: 'resource-music' });
              if (activity.backingLink) resources.push({ label: 'Backing', url: activity.backingLink, class: 'resource-backing' });
              if (activity.resourceLink) resources.push({ label: 'Resource', url: activity.resourceLink, class: 'resource-resource' });
              if (activity.link) resources.push({ label: 'Link', url: activity.link, class: 'resource-link' });
              if (activity.vocalsLink) resources.push({ label: 'Vocals', url: activity.vocalsLink, class: 'resource-vocals' });
              if (activity.imageLink) resources.push({ label: 'Image', url: activity.imageLink, class: 'resource-image' });
              if (activity.canvaLink) resources.push({ label: 'Canva', url: activity.canvaLink, class: 'resource-canva' });

              if (resources.length > 0) {
                htmlContent += `<div class="activity-resources">`;
                resources.forEach(r => {
                  htmlContent += `<a href="${r.url}" target="_blank" rel="noopener noreferrer" class="resource-tag ${r.class}">${r.label}</a>`;
                });
                htmlContent += `</div>`;
              }

              htmlContent += `</div></div>`;
            });
          }
        });
        
        htmlContent += `</div>`;
      }

      // Add notes if available
      if (lessonData.notes) {
        htmlContent += `
          <div class="section-card" style="margin-top: 12px;">
            <div class="section-header" style="background: #f3f4f6; color: #374151; border-left: 4px solid #9ca3af;">
              Teacher Notes
            </div>
            <div class="section-content">${lessonData.notes}</div>
          </div>
        `;
      }

      // Close content wrapper
      htmlContent += `</div>`;
    });

    htmlContent += `
        </div>
      </body>
      </html>
    `;

    // Header template - empty to avoid header on first page
    // PDFBolt doesn't support hiding header on first page, so we use empty header
    const headerContent = '<div></div>';

    // Create footer template for PDFBolt (use custom footer when set)
    // Match design: Left (product name), Center (Curriculum • Copyright), Right (Lesson • Page in pill)
    const footerCenterText = (exportUseCustomHeaderFooter && exportCustomFooter)
      ? exportCustomFooter
      : [currentSheetInfo.display || '', `© ${footerCompany} ${footerYear}`].filter(Boolean).join(' • ');
    
    // Get lesson number for footer (first lesson if multiple)
    const firstLessonNum = lessonsToRender[0];
    const getLessonDisplayNumber = (num: string): string => {
      const numericPart = num.replace(/^lesson/i, '').replace(/[^0-9]/g, '');
      return numericPart || num;
    };
    const lessonDisplayNum = firstLessonNum ? (halfTermId ? getTermSpecificLessonNumber(firstLessonNum, halfTermId) : getLessonDisplayNumber(firstLessonNum)) : '1';
    
    const footerContent = `
      <div style="width: 100%; font-size: 9px; padding: 8px 20px; display: flex; justify-content: space-between; align-items: center; color: #5F6368; font-family: 'Inter', sans-serif;">
        <span style="color: #5F6368;">${productName.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
        <span style="color: #5F6368;">${footerCenterText}</span>
        <span style="background: #E8EAEF; color: #0f766e; padding: 4px 12px; border-radius: 50px; font-weight: 500;">Lesson ${lessonDisplayNum} • Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `;

    return [htmlContent, footerContent, headerContent];
  };

  if (lessonsToRender.length === 0) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-card shadow-soft p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">No lessons found to print.</p>
            <div className="flex justify-end">
              <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
    );
  }

  // PDFBolt API requires HTML content to be base64 encoded
  const encodeUnicodeBase64 = function (str: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);

    let binaryString = '';
    for (let i = 0; i < data.length; i++) {
      binaryString += String.fromCharCode(data[i]);
    }
    return btoa(binaryString);
  };

  const getLessonDisplayNumber = (num: string): string => {
    const n = num.replace(/^lesson/i, '').replace(/[^0-9]/g, '');
    return n || num;
  };

  // Export PDF: use PDFBolt when key is set, otherwise Vercel API (returnPdfBlob) for download
  const handleExport = async () => {
    const downloadFileName = exportMode === 'single' && lessonNumber
      ? `${currentSheetInfo.sheet}_Lesson_${getLessonDisplayNumber(lessonNumber)}.pdf`
      : `${currentSheetInfo.sheet}_${(unitName || halfTermName || 'Unit').replace(/\s+/g, '_')}.pdf`;

    const useApiFallback = !PDFBOLT_API_KEY || PDFBOLT_API_KEY === 'd089165b-e1da-43bb-a7dc-625ce514ed1b';

    setIsExporting(true);
    try {
      const [htmlRaw, footerRaw, headerRaw] = await generateHTMLContent();
      const htmlContent = encodeUnicodeBase64(htmlRaw);
      const footerContent = encodeUnicodeBase64(footerRaw);
      const headerContent = encodeUnicodeBase64(headerRaw);

      let pdfBlob: Blob;

      if (useApiFallback) {
        const apiUrl = getPdfApiUrl();
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            html: htmlContent,
            footerTemplate: footerContent,
            headerTemplate: headerContent,
            returnPdfBlob: true,
            fileName: `downloads/${downloadFileName}`,
          }),
        });
        if (!res.ok) {
          const errText = await res.text();
          let msg = errText;
          try {
            const data = JSON.parse(errText || '{}');
            if (data.error) msg = data.error;
          } catch (_) {}
          throw new Error(msg || `Export failed: ${res.status}`);
        }
        pdfBlob = await res.blob();
      } else {
        const response = await fetch(PDFBOLT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'API_KEY': PDFBOLT_API_KEY },
          body: JSON.stringify({
            html: htmlContent,
            printBackground: true,
            waitUntil: 'networkidle',
            format: 'A4',
            margin: { top: '15px', right: '20px', left: '20px', bottom: '55px' },
            displayHeaderFooter: true,
            footerTemplate: footerContent,
            headerTemplate: headerContent,
            emulateMediaType: 'screen',
          }),
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`PDFBolt: ${response.status} - ${errorText}`);
        }
        pdfBlob = await response.blob();
      }

      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportSuccess(true);
      toast.success('PDF exported.', { duration: 3000, icon: '📄' });
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error: any) {
      console.error('Export failed:', error);
      toast.error(error?.message || 'Failed to export PDF', { duration: 5000 });
    } finally {
      setIsExporting(false);
    }
  };

  // Check and create bucket if it doesn't exist
  const ensureBucketExists = async () => {
    const bucketName = 'lesson-pdfs';
    
    // Try to access the bucket directly instead of listing all buckets
    // This works with anon key if bucket exists and is public
    try {
      // Try to list files in the bucket (empty list is fine, just checking access)
      const { data: files, error: accessError } = await supabase.storage
        .from(bucketName)
        .list('', { limit: 1 });
      
      // If we can access the bucket (even if empty), it exists
      if (!accessError) {
        console.log('✅ Bucket exists and is accessible');
        return { exists: true, created: false };
      }
      
      // If error is "Bucket not found", bucket doesn't exist
      if (accessError.message?.includes('not found') || accessError.message?.includes('Bucket not found')) {
        console.log('Bucket does not exist, attempting to create...');
        // Try to create the bucket (will fail with anon key, but we'll show helpful message)
        const { data: newBucket, error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 52428800,
          allowedMimeTypes: ['application/pdf']
        });
        
        if (createError) {
          console.error('Error creating bucket:', createError);
          return { exists: false, error: createError.message, requiresManualSetup: true };
        }
        
        console.log('Bucket created successfully:', newBucket);
        return { exists: true, created: true };
      }
      
      // Other errors (permissions, etc.)
      console.error('Error accessing bucket:', accessError);
      return { exists: false, error: accessError.message, requiresManualSetup: true };
      
    } catch (error: any) {
      console.error('Unexpected error checking bucket:', error);
      return { exists: false, error: error.message || 'Unknown error', requiresManualSetup: true };
    }
  };

  const handleShare = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    console.log('🔗 Copy Link button clicked!');
    console.log('🔗 Current state:', { exportMode, lessonNumber, isSharing, isSharingSingle });
    
    // Prevent default behavior and event propagation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Prevent multiple simultaneous calls
    if (isSharing || isSharingSingle) {
      console.log('Share already in progress, ignoring duplicate call');
      return;
    }

    // For single lesson, use the useShareLesson hook
    // The hook already checks localStorage internally and will reuse existing URLs
    if (exportMode === 'single' && lessonNumber) {
      // Show spinner immediately so user knows the action started
      setIsSharing(true);
      setShareSuccess(false);
      try {
        console.log('🔄 Starting share process for single lesson:', lessonNumber);
        
        // Check if URL already exists in localStorage before calling shareSingleLesson
        const storedUrl = getStoredShareUrl ? getStoredShareUrl(lessonNumber) : null;
        const wasStored = !!storedUrl;
        
        console.log('📦 Stored URL check:', { wasStored, storedUrl });
        
        // shareSingleLesson will check localStorage internally and return immediately if found
        const url = await shareSingleLesson(lessonNumber);
        console.log('✅ Share function returned URL:', url);
        
        if (url) {
          setShareUrl(url);
          setShareSuccess(true);
          
          if (wasStored) {
            // URL was retrieved from localStorage - no PDF generation happened
            toast.success('Share link retrieved! URL copied to clipboard.', {
              duration: 4000,
              icon: '🔗',
            });
          } else {
            // New PDF was generated
            toast.success('Share link created! URL copied to clipboard.', {
              duration: 4000,
              icon: '🔗',
            });
            
            // Scroll to the share URL display area after a brief delay
            setTimeout(() => {
              const shareUrlElement = document.querySelector('[data-share-url]');
              if (shareUrlElement) {
                shareUrlElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            }, 100);
          }
        } else {
          console.warn('⚠️ Share function returned null/undefined URL');
          toast.error('Failed to generate share link. Please check console for details.', {
            duration: 5000,
          });
        }
      } catch (error: any) {
        console.error('❌ Share error:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        setShareSuccess(false);
        
        // Map known API/server errors to user-friendly messages; otherwise show the real error
        let errorMessage = error.message || 'Failed to create share link';
        const msg = error.message ?? '';
        if (msg.includes('BLOB_READ_WRITE_TOKEN') || msg.includes('Blob store')) {
          errorMessage = 'Vercel Blob Storage not set up. In Vercel Dashboard: Storage → Create Blob Store, then redeploy.';
        } else if (msg.includes('PDFBOLT_API_KEY') || msg.includes('VITE_PDFBOLT_API_KEY')) {
          errorMessage = 'PDF API key missing. Set PDFBOLT_API_KEY (or VITE_PDFBOLT_API_KEY) in Vercel environment variables, then redeploy.';
        } else if (msg.includes('bucket')) {
          errorMessage = 'Storage not configured. Create a Blob store in Vercel Dashboard → Storage.';
        } else if (msg.includes('Service role key') || msg.includes('SUPABASE_SERVICE_ROLE')) {
          errorMessage = 'Set SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables and redeploy.';
        } else if (msg.includes('Network error') || msg.includes('Failed to connect') || msg.includes('fetch')) {
          errorMessage = 'Cannot reach the PDF service. Check your connection and that the app is deployed (Create Link works on the live site, not always in local dev).';
        } else if (msg.includes('404') || msg.includes('not found')) {
          errorMessage = 'PDF API not found. Deploy the project to Vercel and ensure api/generate-pdf is deployed. In local dev, set VITE_VERCEL_URL in .env to your deployed URL.';
        }
        toast.error(errorMessage, { duration: 10000 });
      } finally {
        setIsSharing(false);
        // Note: isSharingSingle is managed by the useShareLesson hook internally
      }
      return;
    }

    // For unit/half-term sharing, use custom implementation
    if (!PDFBOLT_API_KEY || PDFBOLT_API_KEY === 'd089165b-e1da-43bb-a7dc-625ce514ed1b') {
      toast.error('Please set your PDFBolt API key in the environment variables (VITE_PDFBOLT_API_KEY)', {
        duration: 5000,
      });
      return;
    }

    setIsSharing(true);
    setShareUrl(null);
    setShareSuccess(false);

    try {
      // Ensure bucket exists before proceeding
      const bucketCheck = await ensureBucketExists();
      if (!bucketCheck.exists) {
        const setupUrl = 'https://supabase.com/dashboard/project/wiudrzdkbpyziaodqoog/storage/buckets';
        const errorMsg = bucketCheck.requiresManualSetup
          ? `The 'lesson-pdfs' storage bucket needs to be created.\n\nQuick Setup:\n1. Go to: ${setupUrl}\n2. Click "New bucket"\n3. Name: "lesson-pdfs"\n4. Enable "Public bucket"\n5. Click "Create bucket"`
          : `Storage bucket 'lesson-pdfs' does not exist. Error: ${bucketCheck.error || 'Unknown error'}`;
        
        toast.error(errorMsg, {
          duration: 8000,
        });
        throw new Error('Storage bucket not configured');
      }

      // Generate PDF using PDFBolt API (same as export)
      const [htmlRaw, footerRaw, headerRaw] = await generateHTMLContent();
      const htmlContent = encodeUnicodeBase64(htmlRaw);
      const footerContent = encodeUnicodeBase64(footerRaw);
      const headerContent = encodeUnicodeBase64(headerRaw);

      const response = await fetch(PDFBOLT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'API_KEY': PDFBOLT_API_KEY
        },
        body: JSON.stringify({
          html: htmlContent,
          printBackground: true,
          waitUntil: "networkidle",
          format: "A4",
          margin: {
            "top": "15px",
            "right": "20px",
            "left": "20px",
            "bottom": "55px"
          },
          displayHeaderFooter: true,
          footerTemplate: footerContent,
          headerTemplate: headerContent,
          emulateMediaType: 'screen'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PDFBolt API Error: ${response.status} - ${errorText}`);
      }

      // Get the PDF as a blob
      const pdfBlob = await response.blob();

      // Generate filename
      const getLessonDisplayNumber = (num: string): string => {
        const numericPart = num.replace(/^lesson/i, '').replace(/[^0-9]/g, '');
        return numericPart || num;
      };
      
      const timestamp = Date.now();
      const fileName = exportMode === 'single'
          ? (() => {
              const lessonDisplayNumber = getLessonDisplayNumber(lessonNumber!);
              return `${timestamp}_${currentSheetInfo.sheet}_Lesson_${lessonDisplayNumber}.pdf`;
            })()
          : `${timestamp}_${currentSheetInfo.sheet}_${(unitName || halfTermName || 'Unit').replace(/\s+/g, '_')}.pdf`;

      // Convert blob to base64 for Vercel API
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Upload via Vercel API to bypass RLS
      const uploadResponse = await fetch('/api/upload-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          fileData: base64
        })
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({ error: 'Upload failed' }));
        console.error('Upload error:', errorData);
        throw new Error(errorData.error || `Failed to upload PDF: ${uploadResponse.status}`);
      }

      const { url: publicUrl } = await uploadResponse.json();
      
      if (!publicUrl) {
        throw new Error('No URL returned from upload');
      }
      
      // Set share URL and success state immediately so it appears right away
      setShareUrl(publicUrl);
      setShareSuccess(true);
      
      // Scroll to the share URL display area after a brief delay
      setTimeout(() => {
        const shareUrlElement = document.querySelector('[data-share-url]');
        if (shareUrlElement) {
          shareUrlElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);

      // Copy to clipboard (may fail after async; user can click Copy button for a fresh gesture)
      const clipboardSuccess = await copyToClipboard(publicUrl);
      if (clipboardSuccess) {
        toast.success('Shareable URL copied to clipboard!', { duration: 3000, icon: '📋' });
      } else {
        toast('Link ready! Click the Copy button below to copy the URL.', {
          duration: 6000,
          icon: '🔗',
        });
      }

      // Store the URL for future retrieval
      try {
        localStorage.setItem(`share-url-unit-${unitId || halfTermId || 'unknown'}`, JSON.stringify({
          url: publicUrl,
          timestamp: Date.now()
        }));
      } catch (storageError) {
        console.warn('Failed to store share URL:', storageError);
      }
      
    } catch (error: any) {
      console.error('Share failed:', error);
      toast.error(error.message || 'Failed to create share link', {
        duration: 5000,
      });
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (!text) return false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        toast.success('URL copied to clipboard!', { duration: 3000, icon: '📋' });
        return true;
      }
    } catch (_) {}
    // Fallback when clipboard API is blocked (e.g. after async, or non-HTTPS)
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '0';
      ta.style.width = '2em';
      ta.style.height = '2em';
      ta.style.padding = '0';
      ta.style.border = 'none';
      ta.style.outline = 'none';
      ta.style.boxShadow = 'none';
      ta.style.background = 'transparent';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, text.length);
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      if (ok) {
        toast.success('URL copied to clipboard!', { duration: 3000, icon: '📋' });
        return true;
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Clipboard fallback failed:', err);
    }
    toast('Could not copy automatically. Please select and copy the URL above.', {
      duration: 6000,
      icon: '🔗',
    });
    return false;
  };

  // When autoDownload is true, run export once then close (no preview)
  const autoDownloadDone = useRef(false);
  useEffect(() => {
    if (!autoDownload || lessonsToRender.length === 0 || isExporting || autoDownloadDone.current) return;
    autoDownloadDone.current = true;
    handleExport()
      .then(() => onClose())
      .catch(() => { autoDownloadDone.current = false; });
  }, [autoDownload, lessonsToRender.length, isExporting]);

  // When systemPrintOnly is true, open system print dialog immediately (no modal UI)
  const systemPrintDone = useRef(false);
  useEffect(() => {
    if (!systemPrintOnly || lessonsToRender.length === 0 || systemPrintDone.current) return;
    systemPrintDone.current = true;
    const run = async () => {
      try {
        const [fullHtml] = await generateHTMLContent();
        const printWin = window.open('', '_blank');
        if (!printWin) {
          toast.error('Please allow pop-ups to use Print');
          onClose();
          return;
        }
        printWin.document.write(fullHtml);
        printWin.document.close();
        printWin.focus();
        // Small delay so content is painted before print dialog
        setTimeout(() => {
          printWin.print();
          onClose();
          setTimeout(() => printWin.close(), 500);
        }, 150);
      } catch (e) {
        toast.error('Failed to open print dialog');
        onClose();
      }
    };
    const t = setTimeout(run, 100);
    return () => clearTimeout(t);
  }, [systemPrintOnly, lessonsToRender.length]);

  // When pdfDownloadOnly is true, run PDFBolt export (PDF with working hyperlinks) and download, no modal UI
  const pdfDownloadDone = useRef(false);
  useEffect(() => {
    if (!pdfDownloadOnly || lessonsToRender.length === 0 || pdfDownloadDone.current) return;
    pdfDownloadDone.current = true;
    handleExport()
      .then(() => onClose())
      .catch(() => { pdfDownloadDone.current = false; });
  }, [pdfDownloadOnly, lessonsToRender.length]);

  if (systemPrintOnly || pdfDownloadOnly) {
    return null;
  }

  return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
        <div className="bg-white rounded-card shadow-soft w-full max-w-md flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isUnitPrint ? "Export Half-Term Plans" : "Export Lesson Plan"}
              </h2>
              <p className="text-sm text-gray-600">
                {printTitle} - {currentSheetInfo.display} ({lessonsToRender.length} lesson{lessonsToRender.length !== 1 ? 's' : ''})
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* REMOVED: No toggle buttons when printing from Unit Viewer (isUnitPrint = true) */}
              {!isUnitPrint && (halfTermId || (lessonNumbers && lessonNumbers.length > 1)) && (
                  <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setExportMode('single')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                            exportMode === 'single'
                                ? 'bg-white shadow-sm text-gray-900'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      Single Lesson
                    </button>
                    <button
                        onClick={() => setExportMode('unit')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                            exportMode === 'unit'
                                ? 'bg-white shadow-sm text-gray-900'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      {halfTermName ? 'Entire Half-Term' : 'All Lessons'}
                    </button>
                  </div>
              )}

              {/* Show unit info when printing from Unit Viewer */}
              {unitId && unitName && (
                  <div className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                    <span className="font-medium text-blue-800">Unit Print:</span> {unitName}
                  </div>
              )}

              <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Options - no preview, export via external PDF service only */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  Lessons: {lessonsToRender.length}
                </div>
              </div>
            </div>
            {/* Header & Footer customisation (restored) */}
            <div className="mb-4 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportUseCustomHeaderFooter}
                  onChange={(e) => setExportUseCustomHeaderFooter(e.target.checked)}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm font-medium text-gray-700">Use custom header & footer</span>
              </label>
              {exportUseCustomHeaderFooter && (
                <div className="pl-6 space-y-2 border-l-2 border-teal-200">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Custom header</label>
                    <input
                      type="text"
                      value={exportCustomHeader}
                      onChange={(e) => setExportCustomHeader(e.target.value)}
                      placeholder="e.g. Lesson 3, Autumn 1 - Year 2 Music"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Custom footer</label>
                    <input
                      type="text"
                      value={exportCustomFooter}
                      onChange={(e) => setExportCustomFooter(e.target.value)}
                      placeholder={`e.g. ${productName} • Lesson 3 • © ${footerYear}`}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex space-x-3">
                <button
                    onClick={handleExport}
                    disabled={isExporting || isSharing}
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2 disabled:bg-blue-400"
                >
                  {isExporting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        <span>Exporting…</span>
                      </>
                  ) : exportSuccess ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Exported!</span>
                      </>
                  ) : (
                      <>
                        <Download className="h-4 w-4" />
                        <span>Export PDF</span>
                      </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    console.log('🔗 Copy Link button onClick fired!');
                    e.preventDefault();
                    if (!isExporting && !isSharing && !isSharingSingle) {
                      handleShare(e);
                    }
                  }}
                  disabled={isExporting || isSharing || isSharingSingle}
                  aria-label="Copy share link to clipboard"
                  className={`px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2 ${
                    isExporting || isSharing || isSharingSingle ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {(isSharing || isSharingSingle) ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        <span>Creating link…</span>
                      </>
                  ) : shareSuccess ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Copied!</span>
                      </>
                  ) : (
                      <>
                        <Link2 className="h-4 w-4" aria-hidden="true" />
                        <span>Copy Link</span>
                      </>
                  )}
                </button>
              </div>
          </div>

          {/* Share URL Display - Show immediately when share is successful */}
          {shareUrl && shareSuccess && (
            <div 
              data-share-url
              className="p-4 border-t border-teal-200 bg-teal-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-teal-900 mb-1">Shareable URL:</p>
                  <p className="text-xs text-teal-700 break-all">{shareUrl}</p>
                </div>
                <button
                    onClick={() => copyToClipboard(shareUrl)}
                    className="ml-3 p-2 text-teal-600 hover:text-teal-800 hover:bg-teal-100 rounded-lg transition-colors"
                    title="Copy URL"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
