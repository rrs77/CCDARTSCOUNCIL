import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { sanitizeHtml } from '../utils/sanitize';
import { X, Download, Edit3, Save, Check, Tag, Clock, Users, ExternalLink, FileText, Trash2, Share2, Target, Link, Loader2, Lock } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContextNew';
import { ActivityDetails } from './ActivityDetails';
import { EditableText } from './EditableText';
import { NestedStandardsBrowser } from './NestedStandardsBrowser';
import { LessonPrintModal } from './LessonPrintModal';
import { ResourceViewer } from './ResourceViewer';
import { useShareLesson } from '../hooks/useShareLesson';
import { useDemoMode } from '../hooks/useDemoMode';
import toast from 'react-hot-toast';
import type { Activity, LessonData } from '../contexts/DataContext';

interface LessonDetailsModalProps {
  lessonNumber: string;
  displayNumber?: number;
  onClose: () => void;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    gradient: string;
  };
  onExport?: () => void;
  onEdit?: () => void;
  unitId?: string;
  unitName?: string;
  halfTermId?: string;
  halfTermName?: string;
}

export function LessonDetailsModal({ 
  lessonNumber,
  displayNumber,
  onClose, 
  theme,
  onExport,
  onEdit,
  unitId,
  unitName,
  halfTermId,
  halfTermName
}: LessonDetailsModalProps) {
  const { allLessonsData, updateLessonTitle, lessonStandards, deleteLesson, updateHalfTerm, getLessonsForHalfTerm } = useData();
  const { getCategoryColor } = useSettings();
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [initialResource, setInitialResource] = useState<{url: string, title: string, type: string} | null>(null);
  const [selectedResource, setSelectedResource] = useState<{url: string, title: string, type: string} | null>(null);
  const [showEyfsSelector, setShowEyfsSelector] = useState(false);
  const [editingLessonTitle, setEditingLessonTitle] = useState(false);
  const [lessonTitleValue, setLessonTitleValue] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const { shareLesson, isSharing: isSharingLink } = useShareLesson();
  const { isDemo, showUpgradePrompt } = useDemoMode();

  // Keep the page behind from scrolling while this modal is open, and unlock on close.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const handleCopyLink = async () => {
    if (isDemo) {
      showUpgradePrompt('Lesson sharing');
      return;
    }
    try {
      const url = await shareLesson(lessonNumber);
      if (url) {
        toast.success('Link copied to clipboard', { duration: 3000, icon: '🔗' });
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to copy link';
      toast.error(msg, { duration: 8000 });
    }
  };

  const lessonData = allLessonsData[lessonNumber];

  // Handle resource clicks - open in ResourceViewer modal
  const handleResourceClick = (url: string, title: string, type: string) => {
    setSelectedResource({ url, title, type });
  };

  // Initialize lesson title when component mounts
  useEffect(() => {
    if (lessonData?.title) {
      setLessonTitleValue(lessonData.title);
    } else {
      setLessonTitleValue(`Lesson ${lessonNumber}`);
    }
  }, [lessonData, lessonNumber]);

  if (!lessonData) {
    return createPortal(
      <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/50 p-4">
        <div className="flex min-h-full items-center justify-center pb-24">
          <div className="bg-white rounded-card shadow-soft p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">Lesson data not found for lesson {lessonNumber}.</p>
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
      </div>,
      document.body,
    );
  }

  const handleSaveLessonTitle = () => {
    if (lessonTitleValue.trim()) {
      updateLessonTitle(lessonNumber, lessonTitleValue.trim());
      setEditingLessonTitle(false);
    }
  };

  const handleDeleteLesson = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    // If opened from UnitViewer (has halfTermId), only remove from term, don't delete permanently
    if (halfTermId) {
      try {
        const lessons = getLessonsForHalfTerm ? getLessonsForHalfTerm(halfTermId) : [];
        const newLessons = lessons.filter(num => num !== lessonNumber);
        
        if (updateHalfTerm) {
          updateHalfTerm(halfTermId, newLessons, false);
        }
        
        toast.success('Lesson removed from term', {
          duration: 3000,
          icon: '✅',
        });
      } catch (error) {
        console.error('Failed to remove lesson from term:', error);
        toast.error('Failed to remove lesson from term', {
          duration: 3000,
        });
      }
    } else {
      // Permanently delete lesson (only from Lesson Library)
      deleteLesson(lessonNumber);
    }
    onClose();
  };

  // Calculate total activities
  const totalActivities = React.useMemo(() => {
    try {
      if (!lessonData || !lessonData.grouped) return 0;
      return Object.values(lessonData.grouped).reduce(
        (sum, activities) => sum + (Array.isArray(activities) ? activities.length : 0),
        0
      );
    } catch (error) {
      console.error('Error calculating total activities:', error);
      return 0;
    }
  }, [lessonData]);

  // Get standards count
  const standardsCount = (lessonStandards[lessonNumber] || []).length;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] isolate overflow-y-auto overscroll-contain animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lesson-details-title"
    >
      {/* Backdrop — click to close; covers header/footer so nav labels cannot bleed through */}
      <div
        className="fixed inset-0 bg-black/75"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Scrollable shell: works at any viewport size; bottom padding clears the fixed site footer */}
      <div className="relative z-10 flex min-h-full items-start justify-center p-2 sm:p-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(6rem,calc(env(safe-area-inset-bottom)+5rem))] sm:items-center">
        <div
          className="relative bg-white rounded-card shadow-soft w-full max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[calc(100dvh-7rem)] sm:max-h-[calc(100dvh-6rem)] overflow-hidden flex flex-col animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header — shrink-0 so action menu never scrolls/clips off-screen */}
        <div 
          className="p-3 sm:p-4 text-white relative flex-shrink-0 z-10"
          style={{ 
            background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)'
          }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 pr-2">
              {editingLessonTitle ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={lessonTitleValue}
                    onChange={(e) => setLessonTitleValue(e.target.value)}
                    className="text-xl font-bold bg-white bg-opacity-20 text-white border border-white border-opacity-30 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveLessonTitle();
                      if (e.key === 'Escape') setEditingLessonTitle(false);
                    }}
                  />
                  <button
                    onClick={handleSaveLessonTitle}
                    className="p-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-white"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setEditingLessonTitle(false)}
                    className="p-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <h1 id="lesson-details-title" className="text-xl font-bold mb-1 flex items-center space-x-2">
                  <span className="truncate">{lessonData.title || `Lesson ${lessonNumber}`}</span>
                  <button
                    onClick={() => setEditingLessonTitle(true)}
                    className="p-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-white flex-shrink-0"
                    title="Edit lesson title"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </h1>
              )}
              <p className="text-white text-opacity-90 text-sm">
                {lessonData.totalTime} minutes • {lessonData.categoryOrder.length} categories
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {onEdit && (
                <button
                  onClick={() => {
                    onEdit();
                    onClose();
                  }}
                  className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200 group flex items-center space-x-2"
                  title="Edit Lesson"
                >
                  <Edit3 className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                  <span className="text-sm font-medium hidden sm:inline">Edit</span>
                </button>
              )}
              <button
                onClick={handleDeleteLesson}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200 group flex items-center space-x-2"
                title="Delete Lesson"
              >
                <Trash2 className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-sm font-medium hidden sm:inline">Delete</span>
              </button>
              <button
                onClick={() => setShowEyfsSelector(!showEyfsSelector)}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200 group flex items-center space-x-2"
                title="Manage Standards"
              >
                <Tag className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-sm font-medium hidden md:inline">Standards</span>
              </button>
              
              {/* Export PDF Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isDemo) {
                    showUpgradePrompt('PDF export');
                    return;
                  }
                  setShowPrintModal(true);
                }}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200 group flex items-center space-x-2"
                title={isDemo ? 'Export PDF (sign up to unlock)' : 'Export PDF'}
              >
                {isDemo ? (
                  <Lock className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                ) : (
                  <Download className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                )}
                <span className="text-sm font-medium hidden sm:inline">Export PDF</span>
              </button>
              {/* Copy Link Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCopyLink();
                }}
                disabled={isSharingLink}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200 group flex items-center space-x-2 disabled:opacity-60"
                title={isDemo ? 'Copy link (sign up to unlock)' : 'Copy link to lesson PDF'}
              >
                {isSharingLink ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" aria-hidden="true" />
                    <span className="text-sm font-medium hidden sm:inline">Creating link…</span>
                  </>
                ) : (
                  <>
                    {isDemo ? (
                      <Lock className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                    ) : (
                      <Link className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                    )}
                    <span className="text-sm font-medium hidden sm:inline">Copy Link</span>
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200 group"
                title="Close lesson view"
              >
                <X className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              </button>
            </div>
          </div>
        </div>

        {/* Content - Scrollable (flex-1 so header/footer stay on screen) */}
        <div className="p-4 sm:p-6 flex-1 min-h-0 overflow-y-auto">
          {/* Standards Selector (conditionally shown) */}
          {showEyfsSelector && (
            <div className="mb-6">
              <NestedStandardsBrowser lessonNumber={lessonNumber} />
            </div>
          )}

          {/* Lesson Plan Details Section - Match Full Lesson Preview Styling */}
          {(lessonData.learningOutcome || lessonData.successCriteria || lessonData.introduction || 
            lessonData.mainActivity || lessonData.plenary || lessonData.vocabulary || 
            lessonData.keyQuestions || lessonData.resources || lessonData.differentiation || 
            lessonData.assessment) && (
            <div className="mb-8 space-y-6">
              {/* Learning Outcome */}
              {lessonData.learningOutcome && (
                <div className="space-y-2">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <Target className="h-5 w-5 text-teal-600" />
                    <span>Learning Outcome</span>
                  </h4>
                  <div 
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-gray-700 prose prose-sm max-w-none overflow-hidden [&_ul]:list-none [&_ul]:pl-0 [&_ul]:ml-0 [&_ul]:my-0 [&_li]:list-none [&_li]:pl-0 [&_li]:ml-0 [&_li]:before:content-none [&_li]:before:hidden [&_ul_li]:pl-0 [&_ul_li]:ml-0"
                    style={{ listStyle: 'none', paddingLeft: '16px', paddingRight: '16px', overflow: 'hidden' }}
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(lessonData.learningOutcome) }}
                  />
                </div>
              )}

              {/* Success Criteria */}
              {lessonData.successCriteria && (
                <div className="space-y-2">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <Target className="h-5 w-5 text-teal-600" />
                    <span>Success Criteria</span>
                  </h4>
                  <div 
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-gray-700 prose prose-sm max-w-none overflow-hidden [&_ul]:list-none [&_ul]:pl-0 [&_ul]:ml-0 [&_ul]:my-0 [&_li]:list-none [&_li]:pl-0 [&_li]:ml-0 [&_li]:before:content-none [&_li]:before:hidden [&_ul_li]:pl-0 [&_ul_li]:ml-0"
                    style={{ listStyle: 'none', paddingLeft: '16px', paddingRight: '16px', overflow: 'hidden' }}
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(lessonData.successCriteria) }}
                  />
                </div>
              )}

              {/* Introduction */}
              {lessonData.introduction && (
                <div className="space-y-2">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900">Introduction</h4>
                  <div 
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-gray-700 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(lessonData.introduction) }}
                  />
                </div>
              )}

              {/* Main Activity */}
              {lessonData.mainActivity && (
                <div className="space-y-2">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900">Main Activity</h4>
                  <div 
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-gray-700 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(lessonData.mainActivity) }}
                  />
                </div>
              )}

              {/* Plenary */}
              {lessonData.plenary && (
                <div className="space-y-2">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900">Plenary</h4>
                  <div 
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-gray-700 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(lessonData.plenary) }}
                  />
                </div>
              )}

              {/* Vocabulary */}
              {lessonData.vocabulary && (
                <div className="space-y-2">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900">Vocabulary</h4>
                  <div 
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-gray-700 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(lessonData.vocabulary) }}
                  />
                </div>
              )}

              {/* Key Questions */}
              {lessonData.keyQuestions && (
                <div className="space-y-2">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900">Key Questions</h4>
                  <div 
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-gray-700 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(lessonData.keyQuestions) }}
                  />
                </div>
              )}

              {/* Resources */}
              {lessonData.resources && (
                <div className="space-y-2">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900">Resources</h4>
                  <div 
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-gray-700 prose prose-sm max-w-none break-words"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(lessonData.resources) }}
                  />
                </div>
              )}

              {/* Lesson-level web links (video / resource / additional) — show URL text for demos */}
              {(() => {
                const extra = Array.isArray(lessonData.additionalLinks)
                  ? (lessonData.additionalLinks as unknown as { url?: string; label?: string }[])
                  : [];
                const hasLinks =
                  Boolean(lessonData.videoLink) ||
                  Boolean(lessonData.resourceLink) ||
                  Boolean(lessonData.imageLink) ||
                  extra.some((l) => l?.url);
                if (!hasLinks) return null;
                return (
                  <div className="space-y-2">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center space-x-2">
                      <Link className="h-5 w-5 text-teal-600" />
                      <span>Links &amp; Resources</span>
                    </h4>
                    <div className="bg-teal-50 rounded-lg p-4 border border-teal-100 space-y-3">
                      {lessonData.videoLink && (
                        <div>
                          <div className="flex items-center gap-2 text-sm font-medium text-teal-900">
                            <span className="w-2.5 h-2.5 bg-red-500 rounded-full flex-shrink-0" />
                            Video
                          </div>
                          <a
                            href={lessonData.videoLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 block text-sm text-teal-700 hover:text-teal-900 hover:underline break-all"
                          >
                            {lessonData.videoLink}
                          </a>
                        </div>
                      )}
                      {lessonData.resourceLink && (
                        <div>
                          <div className="flex items-center gap-2 text-sm font-medium text-teal-900">
                            <FileText className="h-4 w-4 text-teal-600 flex-shrink-0" />
                            Resource pack
                          </div>
                          <a
                            href={lessonData.resourceLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 block text-sm text-teal-700 hover:text-teal-900 hover:underline break-all"
                          >
                            {lessonData.resourceLink}
                          </a>
                        </div>
                      )}
                      {lessonData.imageLink && (
                        <div>
                          <div className="text-sm font-medium text-teal-900">Image</div>
                          <a
                            href={lessonData.imageLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 block text-sm text-teal-700 hover:text-teal-900 hover:underline break-all"
                          >
                            {lessonData.imageLink}
                          </a>
                        </div>
                      )}
                      {extra.map((link, index) =>
                        link?.url ? (
                          <div key={`${link.url}-${index}`}>
                            <div className="text-sm font-medium text-teal-900">
                              {link.label || `Link ${index + 1}`}
                            </div>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-0.5 block text-sm text-teal-700 hover:text-teal-900 hover:underline break-all"
                            >
                              {link.url}
                            </a>
                          </div>
                        ) : null,
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Differentiation */}
              {lessonData.differentiation && (
                <div className="space-y-2">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900">Differentiation</h4>
                  <div 
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-gray-700 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(lessonData.differentiation) }}
                  />
                </div>
              )}

              {/* Assessment */}
              {lessonData.assessment && (
                <div className="space-y-2">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900">Assessment</h4>
                  <div 
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-gray-700 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(lessonData.assessment) }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Categories and Activities */}
          <div className="space-y-8">
            {lessonData.categoryOrder.map((category) => {
              const activities = lessonData.grouped[category] || [];
              
              return (
                <div key={category} className="bg-white rounded-card shadow-soft border border-gray-200 overflow-hidden">
                  {/* Category Header */}
                  <div 
                    className="p-4 border-b border-gray-200"
                    style={{ 
                      background: `linear-gradient(to right, ${getCategoryColor(category)}20, ${getCategoryColor(category)}05)`,
                      borderLeft: `4px solid ${getCategoryColor(category)}`
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900">{category}</h3>
                      <span className="bg-white px-3 py-1 rounded-full text-sm font-medium shadow-sm" style={{ color: getCategoryColor(category) }}>
                        {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Activities */}
                  <div className="p-4 space-y-6">
                    {activities.map((activity, index) => (
                      <div
                        key={`${category}-${index}`}
                        onClick={() => setSelectedActivity(activity)}
                        className="w-full text-left bg-gray-50 hover:bg-blue-50 rounded-card border border-gray-200 hover:border-blue-300 transition-all duration-200 shadow-soft hover:shadow-hover overflow-hidden cursor-pointer"
                      >
                        {/* Activity Header */}
                        <div className="p-4 border-b border-gray-200 bg-white">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-bold text-gray-900 text-base leading-tight">
                              {activity.activity || 'Untitled Activity'}
                            </h4>
                            {/* Time Badge - Simple and Clean */}
                            {activity.time > 0 && (
                              <span className="text-xs font-medium text-blue-800 bg-blue-100 px-2 py-1 rounded-full ml-3 flex-shrink-0">
                                {activity.time}m
                              </span>
                            )}
                          </div>
                          
                          {/* Level Badge */}
                          {activity.level && (
                            <span 
                              className="inline-block px-3 py-1 text-white text-xs font-medium rounded-full mb-2"
                              style={{ backgroundColor: theme.primary }}
                            >
                              {activity.level}
                            </span>
                          )}
                        </div>

                        {/* Activity Content */}
                        <div className="p-4">
                          {/* Activity Text (if available) */}
                          {activity.activityText && (
                            <div 
                              className="mb-3 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: sanitizeHtml(activity.activityText) }}
                            />
                          )}
                          
                          {/* Full Description */}
                          {(() => {
                            const raw = activity.description || '';
                            if (isDemo) {
                              const plain = raw.includes('<')
                                ? (() => { const d = document.createElement('div'); d.innerHTML = raw; return d.textContent || d.innerText || ''; })()
                                : raw;
                              const truncated = plain.length > 120 ? plain.substring(0, 120) + '...' : plain;
                              return (
                                <div className="relative select-none mb-3">
                                  <div className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none">
                                    {truncated}
                                  </div>
                                  {plain.length > 120 && (
                                    <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent" />
                                  )}
                                  <p className="mt-1 text-xs text-indigo-500 italic">
                                    Sign up for a free account to view full activity details.
                                  </p>
                                </div>
                              );
                            }
                            return (
                              <div 
                                className="text-sm text-gray-700 leading-relaxed mb-3 prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(raw.includes('<') ? raw : raw.replace(/\n/g, '<br>')) }}
                              />
                            );
                          })()}

                          {/* Unit Name */}
                          {activity.unitName && (
                            <div className="mb-3">
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Unit:</span>
                              <p className="text-sm text-gray-700 font-medium">{activity.unitName}</p>
                            </div>
                          )}

                          {/* Web Links Section — show clickable label + full URL for meetings/demos */}
                          {(activity.videoLink || activity.musicLink || activity.backingLink || 
                            activity.resourceLink || activity.link || activity.vocalsLink || 
                            activity.imageLink) && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                              <h5 className="text-base font-semibold text-blue-800 mb-3 flex items-center">
                                <FileText className="h-5 w-5 mr-2" />
                                Web Resources
                              </h5>
                              <div className="space-y-3">
                                {([
                                  { key: 'video', url: activity.videoLink, label: 'Video', dot: 'bg-red-500' },
                                  { key: 'music', url: activity.musicLink, label: 'Music', dot: 'bg-green-500' },
                                  { key: 'backing', url: activity.backingLink, label: 'Backing Track', dot: 'bg-blue-500' },
                                  { key: 'resource', url: activity.resourceLink, label: 'Resource', dot: 'bg-purple-500' },
                                  { key: 'link', url: activity.link, label: 'Web Link', dot: 'bg-gray-500' },
                                  { key: 'vocals', url: activity.vocalsLink, label: 'Vocals', dot: 'bg-orange-500' },
                                  { key: 'image', url: activity.imageLink, label: 'Image', dot: 'bg-pink-500' },
                                ] as const).filter((r) => r.url).map((r) => (
                                  <div key={r.key} className="min-w-0">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleResourceClick(r.url!, `${activity.activity} - ${r.label}`, r.key);
                                      }}
                                      className="text-sm font-medium text-blue-700 hover:text-blue-900 hover:underline flex items-center cursor-pointer"
                                    >
                                      <span className={`w-3 h-3 ${r.dot} rounded-full mr-2 flex-shrink-0`} />
                                      {r.label}
                                      <ExternalLink className="h-4 w-4 ml-2 flex-shrink-0" />
                                    </button>
                                    <a
                                      href={r.url!}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="mt-0.5 ml-5 block text-xs text-blue-600 hover:underline break-all"
                                    >
                                      {r.url}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Click to view resources message */}
                          <div className="text-xs text-blue-600 italic mt-2">
                            Click to view all details and resources
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Close
          </button>
        </div>
        </div>
      </div>

      {/* Activity Details Modal - SIMPLIFIED: Read-only mode */}
      {selectedActivity && (
        <ActivityDetails
          activity={selectedActivity}
          onClose={() => {
            setSelectedActivity(null);
            setInitialResource(null);
          }}
          initialResource={initialResource}
        />
      )}

      {/* ResourceViewer Modal */}
      {selectedResource && (
        <ResourceViewer
          url={selectedResource.url}
          title={selectedResource.title}
          type={selectedResource.type}
          onClose={() => setSelectedResource(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center p-4 pb-24 z-[110] overflow-y-auto">
          <div className="bg-white rounded-card shadow-soft max-w-md w-full p-6 my-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Delete Lesson</h3>
            <p className="text-gray-700 mb-6">
              {halfTermId ? (
                <>
                  Are you sure you want to remove Lesson {displayNumber || lessonNumber} from {halfTermName || 'this term'}? 
                  The lesson will remain in the Lesson Library and can be added back later.
                </>
              ) : (
                <>
                  Are you sure you want to delete Lesson {displayNumber || lessonNumber}? This action cannot be undone and will remove the lesson from all units.
                </>
              )}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>{halfTermId ? 'Remove from Term' : 'Delete Lesson'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Modal - pdfDownloadOnly: PDFBolt export (PDF with working hyperlinks), no modal UI */}
      {showPrintModal && (
        <LessonPrintModal
          lessonNumber={lessonNumber}
          onClose={() => setShowPrintModal(false)}
          unitId={unitId}
          unitName={unitName}
          halfTermId={halfTermId}
          halfTermName={halfTermName}
          pdfDownloadOnly
        />
      )}
    </div>,
    document.body,
  );
}
