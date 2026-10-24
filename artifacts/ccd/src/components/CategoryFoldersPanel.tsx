import React, { useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { ChevronDown, ChevronRight, Folder, GripVertical, Plus, Trash2, X } from 'lucide-react';
import { useSettings, CategoryFolder } from '../contexts/SettingsContextNew';
import { ColorPickerWithFavorites } from './ColorPickerWithFavorites';
import { useDropZoneStyle, useDropFlash } from './dnd';

/** Session-only: which folders the user expanded. Default = all collapsed. */
const EXPANDED_SESSION_KEY = 'category-folders-expanded-session';

type CategoryDropItem = { categoryName?: string; index?: number };

function loadExpanded(): Set<string> {
  try {
    const raw = sessionStorage.getItem(EXPANDED_SESSION_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {
    /* ignore */
  }
  return new Set();
}

function saveExpanded(set: Set<string>) {
  try {
    sessionStorage.setItem(EXPANDED_SESSION_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}

interface DraggableFolderProps {
  folder: CategoryFolder;
  index: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onReorder: (dragIndex: number, hoverIndex: number) => void;
  onAssignCategory: (categoryName: string, folderName: string | null) => void;
  categoryCount: number;
  onRename: (id: string, name: string) => void;
  onColorChange: (id: string, color: string) => void;
  onDelete: (id: string) => void;
}

function DraggableFolderRow({
  folder,
  index,
  isCollapsed,
  onToggleCollapse,
  onReorder,
  onAssignCategory,
  categoryCount,
  onRename,
  onColorChange,
  onDelete,
}: DraggableFolderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(folder.name);
  const { flashClass, triggerFlash } = useDropFlash();

  const [{ isOver, canDrop }, drop] = useDrop<
    CategoryDropItem,
    void,
    { isOver: boolean; canDrop: boolean }
  >({
    accept: ['category', 'category-folder'],
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
    hover(item, monitor) {
      if (monitor.getItemType() !== 'category-folder') return;
      if (item.index === undefined) return;
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      const rect = ref.current.getBoundingClientRect();
      const middleY = (rect.bottom - rect.top) / 2;
      const offset = monitor.getClientOffset();
      if (!offset) return;
      const hoverY = offset.y - rect.top;
      if (dragIndex < hoverIndex && hoverY < middleY) return;
      if (dragIndex > hoverIndex && hoverY > middleY) return;
      onReorder(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    drop: (item) => {
      triggerFlash();
      if (item.categoryName) {
        onAssignCategory(item.categoryName, folder.name);
      }
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'category-folder',
    item: () => ({ index }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  drag(drop(ref));

  const dropZoneClass = useDropZoneStyle({ isOver, canDrop, variant: 'inline' });

  return (
    <div
      ref={ref}
      className={`rounded-lg border border-gray-200 bg-white transition-all ${
        isDragging ? 'opacity-50 ring-2 ring-[#a9a3ff]' : ''
      } ${dropZoneClass} ${flashClass}`}
    >
      <div className="flex items-center gap-2 p-2.5">
        <button type="button" className="cursor-grab active:cursor-grabbing p-1 text-gray-400" aria-label="Drag to reorder folder">
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1 text-gray-500 hover:text-gray-700"
          aria-label={isCollapsed ? 'Expand folder' : 'Collapse folder'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <Folder className="h-4 w-4 shrink-0" style={{ color: folder.color }} />
        {isEditing ? (
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={() => {
              onRename(folder.id, draftName.trim() || folder.name);
              setIsEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onRename(folder.id, draftName.trim() || folder.name);
                setIsEditing(false);
              } else if (e.key === 'Escape') {
                setDraftName(folder.name);
                setIsEditing(false);
              }
            }}
            className="flex-1 min-w-0 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#4338E8] outline-none"
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex-1 min-w-0 text-left text-sm font-semibold text-gray-900 truncate"
          >
            {folder.name}
          </button>
        )}
        <span className="text-xs text-gray-500 shrink-0">{categoryCount}</span>
        <ColorPickerWithFavorites
          value={folder.color}
          onChange={(color) => onColorChange(folder.id, color)}
          className="w-8 h-8 rounded border border-gray-300 cursor-pointer shrink-0"
          swatchClassName="w-6 h-6 rounded border border-gray-200"
        />
        <button
          type="button"
          onClick={() => {
            if (confirm(`Delete folder "${folder.name}"? Categories inside will move to Uncategorised.`)) {
              onDelete(folder.id);
            }
          }}
          className="p-1.5 text-red-500 hover:bg-red-50 rounded"
          aria-label={`Delete folder ${folder.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

interface UncategorisedDropZoneProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  categoryCount: number;
  onAssignCategory: (categoryName: string, folderName: string | null) => void;
}

function UncategorisedDropZone({
  isCollapsed,
  onToggleCollapse,
  categoryCount,
  onAssignCategory,
}: UncategorisedDropZoneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { flashClass, triggerFlash } = useDropFlash();

  const [{ isOver, canDrop }, drop] = useDrop<
    CategoryDropItem,
    void,
    { isOver: boolean; canDrop: boolean }
  >({
    accept: 'category',
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
    drop: (item) => {
      triggerFlash();
      if (item.categoryName) {
        onAssignCategory(item.categoryName, null);
      }
    },
  });

  drop(ref);
  const dropZoneClass = useDropZoneStyle({ isOver, canDrop, variant: 'inline' });

  return (
    <div ref={ref} className={`rounded-lg border border-dashed border-gray-300 bg-gray-50 ${dropZoneClass} ${flashClass}`}>
      <div className="flex items-center gap-2 p-2.5">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1 text-gray-500 hover:text-gray-700"
          aria-label={isCollapsed ? 'Expand uncategorised' : 'Collapse uncategorised'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <span className="text-sm font-semibold text-gray-700">Uncategorised</span>
        <span className="text-xs text-gray-500">{categoryCount}</span>
      </div>
    </div>
  );
}

interface CategoryFoldersPanelProps {
  getCategoryCount: (folderName: string | null) => number;
  onAssignCategory: (categoryName: string, folderName: string | null) => void;
  renderFolderCategories: (folderName: string | null, isCollapsed: boolean) => React.ReactNode;
}

export function CategoryFoldersPanel({
  getCategoryCount,
  onAssignCategory,
  renderFolderCategories,
}: CategoryFoldersPanelProps) {
  const {
    categoryFolders,
    addCategoryFolder,
    removeCategoryFolder,
    renameCategoryFolder,
    updateCategoryFolderColor,
    reorderCategoryFolders,
  } = useSettings();

  // Opt-in expand: nothing in the set ⇒ every folder starts collapsed on open.
  const [expanded, setExpanded] = useState<Set<string>>(() => loadExpanded());
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#4338E8');

  const sortedFolders = [...categoryFolders].sort((a, b) => a.position - b.position);

  const toggleExpanded = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      saveExpanded(next);
      return next;
    });
  };

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    addCategoryFolder(name, newFolderColor);
    setNewFolderName('');
    setNewFolderColor('#4338E8');
    setShowNewFolder(false);
  };

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-600">
          Organise categories with the Folder dropdown. Drag only to reorder within a folder.
        </p>
        <button
          type="button"
          onClick={() => setShowNewFolder((v) => !v)}
          className="inline-flex min-h-[36px] items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[#4338E8] hover:bg-[#3529d1] text-white rounded-lg"
        >
          <Plus className="h-4 w-4" />
          New Folder
        </button>
      </div>

      {showNewFolder && (
        <div className="p-3 bg-white border border-[#E2E0EF] rounded-lg flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Folder name</label>
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. Kodály"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4338E8] outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Colour</label>
            <ColorPickerWithFavorites value={newFolderColor} onChange={setNewFolderColor} />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
              className="px-3 py-2 text-sm bg-[#4338E8] hover:bg-[#3529d1] disabled:opacity-50 text-white rounded-lg"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowNewFolder(false)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {sortedFolders.map((folder, index) => {
          const key = folder.id;
          const isCollapsed = !expanded.has(key);
          return (
            <div key={folder.id} className="space-y-0">
              <DraggableFolderRow
                folder={folder}
                index={index}
                isCollapsed={isCollapsed}
                onToggleCollapse={() => toggleExpanded(key)}
                onReorder={reorderCategoryFolders}
                onAssignCategory={onAssignCategory}
                categoryCount={getCategoryCount(folder.name)}
                onRename={renameCategoryFolder}
                onColorChange={updateCategoryFolderColor}
                onDelete={removeCategoryFolder}
              />
              {!isCollapsed && (
                <div className="ml-2 border-l border-gray-200 pl-2 sm:ml-4">
                  {renderFolderCategories(folder.name, false)}
                </div>
              )}
            </div>
          );
        })}

        <div className="space-y-0">
          <UncategorisedDropZone
            isCollapsed={!expanded.has('__uncategorised__')}
            onToggleCollapse={() => toggleExpanded('__uncategorised__')}
            categoryCount={getCategoryCount(null)}
            onAssignCategory={onAssignCategory}
          />
          {expanded.has('__uncategorised__') && (
            <div className="ml-2 border-l border-dashed border-gray-200 pl-2 sm:ml-4">
              {renderFolderCategories(null, false)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
