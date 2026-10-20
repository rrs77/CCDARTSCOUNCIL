import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Clock,
  Users,
  Calendar,
  Copy,
  MoreHorizontal,
} from 'lucide-react';
import type { LessonData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContextNew';
import { AssignToHalfTermModal } from './AssignToHalfTermModal';
import { useShareLesson } from '../hooks/useShareLesson';
import toast from 'react-hot-toast';

interface HalfTerm {
  id: string;
  name: string;
  months: string;
  lessons: string[];
  isComplete: boolean;
}

interface LessonLibraryCardProps {
  lessonNumber: string;
  displayNumber: number;
  lessonData: LessonData;
  viewMode: 'grid' | 'list' | 'compact';
  onClick: () => void;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    gradient: string;
  };
  onAssignToUnit?: (lessonNumber: string, halfTermId: string) => void;
  halfTerms?: HalfTerm[];
  onEdit?: () => void;
  onDuplicate?: () => void;
  onShare?: () => void;
  onCopyToYear?: () => void;
  onDelete?: () => void;
}

/** C3: Open + Assign visible; everything else in ⋯ */
function LessonOverflowMenu({
  items,
}: {
  items: { key: string; label: string; danger?: boolean; disabled?: boolean; onClick: () => void }[];
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        className="grid h-9 w-9 place-items-center rounded-lg border border-[#E2E0EF] bg-white text-[#77738F] hover:border-[#bcb7f4] hover:text-[#1F1B4D]"
        aria-label="More actions"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen((v) => !v);
        }}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full z-30 mt-1 min-w-[180px] rounded-xl border border-[#E2E0EF] bg-white py-1 shadow-lg"
          role="menu"
        >
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm disabled:opacity-50 ${
                item.danger ? 'text-red-600 hover:bg-red-50' : 'text-[#1F1B4D] hover:bg-[#F4F3FA]'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setOpen(false);
                item.onClick();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function LessonLibraryCard({
  lessonNumber,
  displayNumber,
  lessonData,
  viewMode,
  onClick,
  onEdit,
  onDuplicate,
  onCopyToYear,
  onDelete,
  theme,
  onAssignToUnit,
  halfTerms = [],
}: LessonLibraryCardProps) {
  const { getCategoryColor } = useSettings();
  const { shareLesson, isSharing, shareUrl, getStoredShareUrl } = useShareLesson();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);
  const [localShareUrl, setLocalShareUrl] = useState<string | null>(null);

  const isAssigned = halfTerms.some((halfTerm) =>
    Array.isArray(halfTerm?.lessons) && halfTerm.lessons.includes(lessonNumber),
  );

  const totalActivities = useMemo(() => {
    try {
      if (!lessonData || !lessonData.grouped) return 0;
      return Object.values(lessonData.grouped).reduce(
        (sum, activities) => sum + (Array.isArray(activities) ? activities.length : 0),
        0,
      );
    } catch {
      return 0;
    }
  }, [lessonData]);

  if (!lessonData) {
    console.warn(`❌ LessonLibraryCard: No lesson data for lesson ${lessonNumber}`);
    return null;
  }

  const isUserCreated = lessonData.isUserCreated === true;

  const safeLessonData = {
    ...lessonData,
    title: lessonData.title || `Lesson ${displayNumber}`,
    categoryOrder: lessonData.categoryOrder || [],
    grouped: lessonData.grouped || {},
    totalTime: lessonData.totalTime || 0,
  };

  const handleAssignClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowAssignModal(true);
  };

  const handleAssignToHalfTerm = (halfTermId: string) => {
    if (onAssignToUnit) {
      onAssignToUnit(lessonNumber, halfTermId);
      setShowAssignModal(false);
    }
  };

  const handleDuplicateConfirm = () => {
    if (onDuplicate) {
      onDuplicate();
      setShowDuplicateConfirm(false);
    }
  };

  const runShare = async () => {
    try {
      const storedUrl = getStoredShareUrl ? getStoredShareUrl(lessonNumber) : null;
      const wasStored = !!storedUrl;
      const url = await shareLesson(lessonNumber);
      if (url) {
        setLocalShareUrl(url);
        toast.success(
          wasStored
            ? 'Share link retrieved! URL copied to clipboard.'
            : 'Share link created! URL copied to clipboard.',
          { duration: 4000, icon: '🔗' },
        );
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create share link', { duration: 5000 });
    }
  };

  const overflowItems = [
    {
      key: 'copy-link',
      label: isSharing ? 'Copying…' : localShareUrl || shareUrl ? 'Link copied' : 'Copy link',
      disabled: isSharing,
      onClick: () => {
        void runShare();
      },
    },
    onDuplicate
      ? {
          key: 'duplicate',
          label: 'Duplicate',
          onClick: () => setShowDuplicateConfirm(true),
        }
      : null,
    onCopyToYear
      ? {
          key: 'to-year',
          label: 'Move to year',
          onClick: () => onCopyToYear(),
        }
      : null,
    onEdit
      ? {
          key: 'edit',
          label: 'Edit',
          onClick: () => onEdit(),
        }
      : null,
    onDelete
      ? {
          key: 'delete',
          label: 'Delete',
          danger: true,
          onClick: () => {
            if (confirm('Delete this lesson?')) onDelete();
          },
        }
      : null,
  ].filter(Boolean) as {
    key: string;
    label: string;
    danger?: boolean;
    disabled?: boolean;
    onClick: () => void;
  }[];

  const primaryActions = (
    <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onClick();
        }}
        className="inline-flex min-h-[36px] items-center rounded-lg bg-[#4338E8] px-3 text-xs font-bold text-white hover:bg-[#3529d1]"
      >
        Open
      </button>
      {onAssignToUnit && halfTerms.length > 0 && (
        <button
          type="button"
          onClick={handleAssignClick}
          className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-[#E2E0EF] bg-white px-3 text-xs font-bold text-[#1F1B4D] hover:border-[#bcb7f4]"
          title={isAssigned ? 'Reassign to half-term' : 'Assign to half-term'}
        >
          <Calendar className="h-3.5 w-3.5 text-[#4338E8]" />
          {isAssigned ? 'Reassign' : 'Assign'}
        </button>
      )}
      <LessonOverflowMenu items={overflowItems} />
    </div>
  );

  const assignModal = showAssignModal ? (
    <AssignToHalfTermModal
      isOpen={showAssignModal}
      onClose={() => setShowAssignModal(false)}
      onAssign={handleAssignToHalfTerm}
      lessonNumber={lessonNumber}
      displayNumber={displayNumber}
      halfTerms={halfTerms}
    />
  ) : null;

  const duplicateModal = showDuplicateConfirm ? (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="p-6">
          <div className="mb-4 flex items-center">
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
              <Copy className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Duplicate Lesson</h3>
          </div>
          <p className="mb-6 text-gray-600">
            Are you sure you want to duplicate <strong>Lesson {displayNumber}</strong>? This will
            create a new lesson with all the same activities and content.
          </p>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setShowDuplicateConfirm(false)}
              className="flex-1 rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDuplicateConfirm}
              className="flex-1 rounded-lg bg-[#4338E8] px-4 py-2 font-medium text-white hover:bg-[#3529d1]"
            >
              Duplicate Lesson
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  if (viewMode === 'compact') {
    return (
      <div className="relative group">
        <div
          className={`h-full cursor-pointer rounded-card border-l-4 bg-white p-3 shadow-soft transition-all duration-200 hover:shadow-hover ${
            isUserCreated ? 'border-blue-400' : ''
          }`}
          style={isUserCreated ? { borderLeftColor: '#60A5FA' } : { borderLeftColor: theme.primary }}
          onClick={onClick}
        >
          <div className="flex h-full items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="truncate text-sm font-medium text-gray-900" dir="ltr">
                  {safeLessonData.title}
                </h4>
                {isUserCreated && (
                  <span className="flex-shrink-0 whitespace-nowrap rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                    Custom
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>{safeLessonData.totalTime} mins</span>
                <span>{totalActivities} activities</span>
              </div>
            </div>
            {primaryActions}
          </div>
        </div>
        {assignModal}
        {duplicateModal}
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="relative group">
        <div
          className={`cursor-pointer rounded-card border bg-white p-4 shadow-soft transition-all duration-200 hover:shadow-hover ${
            isUserCreated
              ? 'border-l-4 border-blue-300 hover:border-blue-400'
              : 'border-gray-200 hover:border-blue-300'
          }`}
          style={isUserCreated ? { borderLeftColor: '#60A5FA' } : {}}
          onClick={onClick}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1">
              <div
                className="mr-4 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold text-white"
                style={{ backgroundColor: theme.primary }}
              >
                {displayNumber}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="truncate text-base font-semibold text-gray-900" dir="ltr">
                    {safeLessonData.title}
                  </h4>
                  {isUserCreated && (
                    <span className="whitespace-nowrap rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      Custom
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center space-x-3 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{safeLessonData.totalTime} mins</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>{totalActivities} activities</span>
                  </div>
                </div>
                <p className="mt-2 line-clamp-1 text-sm text-gray-600" dir="ltr">
                  {(safeLessonData as any).description || ''}
                </p>
              </div>
            </div>
            {primaryActions}
          </div>
        </div>
        {assignModal}
        {duplicateModal}
      </div>
    );
  }

  // Default grid view
  return (
    <div className="relative group">
      <div
        className="flex h-full cursor-pointer flex-col overflow-hidden rounded-card border border-gray-300 bg-white shadow-soft transition-all duration-300 hover:scale-[1.02] hover:shadow-hover"
        onClick={onClick}
      >
        <div
          className="relative overflow-hidden p-4 text-white"
          style={{ backgroundColor: isUserCreated ? '#60A5FA' : '#4580ED' }}
        >
          <div className="absolute right-0 top-0 h-20 w-20 translate-x-10 -translate-y-10 rounded-full bg-white bg-opacity-10" />
          <div className="relative z-10">
            <div className="mb-2 flex items-start justify-between pr-12">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold">Lesson {displayNumber}</h3>
                {isUserCreated && (
                  <span className="mt-1 inline-block rounded-full bg-white bg-opacity-20 px-2 py-0.5 text-xs font-medium">
                    Custom
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm font-medium text-gray-100" dir="ltr">
              {safeLessonData.title}
            </p>
          </div>
        </div>

        <div className="flex flex-grow flex-col p-4">
          <div className="mb-3 flex items-center space-x-4 text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{safeLessonData.totalTime} mins</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span className="text-sm">{totalActivities} activities</span>
            </div>
          </div>

          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {safeLessonData.categoryOrder.slice(0, 4).map((category) => (
                <span
                  key={category}
                  className="rounded-full border px-2 py-1 text-sm font-medium shadow-sm"
                  style={{
                    backgroundColor: `${getCategoryColor(category)}20`,
                    color: getCategoryColor(category),
                    borderColor: `${getCategoryColor(category)}40`,
                  }}
                >
                  {category}
                </span>
              ))}
              {safeLessonData.categoryOrder.length > 4 && (
                <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-1 text-sm font-medium text-gray-600 shadow-sm">
                  +{safeLessonData.categoryOrder.length - 4} more
                </span>
              )}
            </div>
          </div>

          <p className="mt-2 line-clamp-1 text-sm text-gray-600" dir="ltr">
            {(safeLessonData as any).description || ''}
          </p>
        </div>

        <div className="absolute right-2 top-2 z-20">{primaryActions}</div>
      </div>

      {assignModal}
      {duplicateModal}
    </div>
  );
}
