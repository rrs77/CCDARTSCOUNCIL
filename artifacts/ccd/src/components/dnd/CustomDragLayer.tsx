import React from 'react';
import { useDragLayer, type XYCoord } from 'react-dnd';
import { GripVertical, BookOpen, Tag, GraduationCap, Target } from 'lucide-react';

const layerStyles: React.CSSProperties = {
  position: 'fixed',
  pointerEvents: 'none',
  zIndex: 9999,
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
};

function getItemStyles(
  initialOffset: XYCoord | null,
  currentOffset: XYCoord | null,
): React.CSSProperties {
  if (!initialOffset || !currentOffset) {
    return { display: 'none' };
  }
  const { x, y } = currentOffset;
  return {
    transform: `translate(${x}px, ${y}px)`,
    WebkitTransform: `translate(${x}px, ${y}px)`,
  };
}

interface DragPreviewProps {
  itemType: string | symbol | null;
  item: any;
}

function DragPreview({ itemType, item }: DragPreviewProps) {
  if (!item) return null;

  const baseClass =
    'inline-flex items-center gap-2 px-3 py-2 rounded-lg shadow-2xl ring-2 ring-teal-500 bg-white text-sm font-medium text-gray-800 max-w-xs';

  switch (itemType) {
    case 'activity': {
      const a = item.activity ?? item;
      const label =
        (a && (a.activity || a.name || a.title)) || 'Activity';
      return (
        <div className={baseClass}>
          <BookOpen className="h-4 w-4 text-teal-600 flex-shrink-0" />
          <span className="truncate">{label}</span>
        </div>
      );
    }
    case 'activity-stack': {
      const stack = item.stack ?? item;
      const count = Array.isArray(stack?.activities) ? stack.activities.length : 0;
      return (
        <div className={baseClass}>
          <BookOpen className="h-4 w-4 text-teal-600 flex-shrink-0" />
          <span className="truncate">
            {stack?.name || 'Activity stack'}
          </span>
          {count > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded text-xs">
              {count}
            </span>
          )}
        </div>
      );
    }
    case 'lesson-activity':
      return (
        <div className={baseClass}>
          <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="truncate">Reordering activity…</span>
        </div>
      );
    case 'category': {
      const name = item?.name || 'Category';
      return (
        <div className={baseClass}>
          <Tag className="h-4 w-4 text-teal-600 flex-shrink-0" />
          <span className="truncate">{name}</span>
        </div>
      );
    }
    case 'yearGroup':
      return (
        <div className={baseClass}>
          <GraduationCap className="h-4 w-4 text-teal-600 flex-shrink-0" />
          <span className="truncate">Year group</span>
        </div>
      );
    case 'objective':
      return (
        <div className={baseClass}>
          <Target className="h-4 w-4 text-teal-600 flex-shrink-0" />
          <span className="truncate">{item?.code || 'Objective'}</span>
        </div>
      );
    case 'lesson':
    case 'lesson-card': {
      const title = item?.title || item?.name || 'Lesson';
      return (
        <div className={baseClass}>
          <BookOpen className="h-4 w-4 text-teal-600 flex-shrink-0" />
          <span className="truncate">{title}</span>
        </div>
      );
    }
    case 'timetable-block': {
      const cls = item?.class;
      const label = cls?.className || 'Class';
      const time = cls?.startTime || '';
      return (
        <div
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg shadow-2xl ring-2 ring-white/40 text-xs font-medium text-white max-w-xs"
          style={{ backgroundColor: cls?.color || '#0d9488' }}
        >
          {time && <span className="font-semibold text-white/90 shrink-0">{time}</span>}
          <span className="truncate">{label}</span>
        </div>
      );
    }
    default:
      // Generic fallback so every drag has *some* visible ghost.
      return (
        <div className={baseClass}>
          <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="truncate">Dragging…</span>
        </div>
      );
  }
}

/**
 * Renders a custom ghost preview that follows the pointer/finger during any
 * drag in the app. The native HTML5 drag image is invisible on touch devices
 * and inconsistent across browsers, so we draw our own.
 *
 * Because this is a single layer mounted at the root, it works for every
 * useDrag in the app without each component needing to opt in.
 */
export function CustomDragLayer() {
  const { itemType, isDragging, item, initialOffset, currentOffset } =
    useDragLayer((monitor) => ({
      item: monitor.getItem(),
      itemType: monitor.getItemType(),
      initialOffset: monitor.getInitialSourceClientOffset(),
      currentOffset: monitor.getSourceClientOffset(),
      isDragging: monitor.isDragging(),
    }));

  if (!isDragging) return null;

  return (
    <div style={layerStyles} aria-hidden="true">
      <div style={getItemStyles(initialOffset, currentOffset)}>
        <DragPreview itemType={itemType} item={item} />
      </div>
    </div>
  );
}
