import React, { useState, useEffect } from 'react';
import { X, Save, ChevronDown, ChevronRight, Layers, FileText } from 'lucide-react';
import { activityPacksApi } from '../config/api';
import { lessonStacksApi } from '../config/lessonStacksApi';
import type { ActivityPack } from '../config/api';
import type { Category } from '../contexts/SettingsContextNew';
import type { StackedLesson } from '../hooks/useLessonStacks';
import { PackIntroductionModal } from './PackIntroductionModal';
import toast from 'react-hot-toast';

const COMMON_ICONS = ['🎭', '📚', '🎵', '🎨', '📖', '✨', '🎪', '📦', '🎯', '🌟'];

interface AddSoftwarePackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  /** When set, modal is in edit mode for this pack. */
  editingPack?: Partial<ActivityPack> | null;
  categories: Category[];
  /** Set when creating a new pack so the pack is owned by this creator. */
  creatorEmail?: string;
}

export function AddSoftwarePackModal({
  isOpen,
  onClose,
  onSave,
  editingPack,
  categories,
  creatorEmail
}: AddSoftwarePackModalProps) {
  const isEditing = !!editingPack?.pack_id && !!editingPack?.id;
  const [packId, setPackId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [price, setPrice] = useState(19.99);
  const [icon, setIcon] = useState('📦');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [stackIds, setStackIds] = useState<string[]>([]);
  const [yearGroupSections, setYearGroupSections] = useState<string[]>([]);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [stacks, setStacks] = useState<StackedLesson[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showIntroductionModal, setShowIntroductionModal] = useState(false);

  /** Section ids for "Show in Lesson Library for" (EYFS, KS1–KS5, Other). Empty = all year groups. */
  const PACK_YEAR_GROUP_SECTIONS = [
    { id: 'eyfs', label: 'EYFS' },
    { id: 'ks1', label: 'KS1' },
    { id: 'ks2', label: 'KS2' },
    { id: 'ks3', label: 'KS3' },
    { id: 'ks4', label: 'KS4' },
    { id: 'ks5', label: 'KS5' },
    { id: 'other', label: 'Other' },
  ];

  useEffect(() => {
    if (!isOpen) return;
    if (editingPack) {
      setPackId(editingPack.pack_id ?? '');
      setName(editingPack.name ?? '');
      setDescription(editingPack.description ?? '');
      setIntroduction(editingPack.introduction ?? '');
      setPrice(editingPack.price ?? 19.99);
      setIcon(editingPack.icon ?? '📦');
      setCategoryIds(editingPack.category_ids ?? []);
      setStackIds(editingPack.stack_ids ?? []);
      setYearGroupSections(editingPack.year_group_sections ?? []);
      setIsActive(editingPack.is_active !== false);
    } else {
      setPackId('');
      setName('');
      setDescription('');
      setIntroduction('');
      setPrice(19.99);
      setIcon('📦');
      setCategoryIds([]);
      setStackIds([]);
      setYearGroupSections([]);
      setIsActive(true);
    }
  }, [isOpen, editingPack]);

  useEffect(() => {
    if (!isOpen) return;
    lessonStacksApi.getAll().then(setStacks).catch(() => setStacks([]));
  }, [isOpen]);

  const toggleCategory = (id: string) => {
    setCategoryIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleStack = (id: string) => {
    setStackIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleYearGroupSection = (id: string) => {
    setYearGroupSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const suggestPackId = () => {
    if (name.trim()) {
      const suggested = name
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
      setPackId(suggested || 'PACK');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = packId.trim().toUpperCase().replace(/\s/g, '_');
    const trimmedName = name.trim();
    if (!trimmedId || !trimmedName) {
      toast.error('Pack ID and Name are required');
      return;
    }
    setSaving(true);
    try {
      await activityPacksApi.upsertPack({
        ...(editingPack?.id && { id: editingPack.id }),
        pack_id: trimmedId,
        name: trimmedName,
        description: description.trim() || undefined,
        introduction: introduction.trim() || undefined,
        price: Number(price) || 0,
        icon: icon || '📦',
        category_ids: categoryIds,
        stack_ids: stackIds.length > 0 ? stackIds : undefined,
        year_group_sections: yearGroupSections.length > 0 ? yearGroupSections : undefined,
        is_active: isActive,
        ...(!isEditing && creatorEmail && { creator_email: creatorEmail })
      });
      toast.success(isEditing ? 'Pack updated.' : 'Resource pack added. It can now be purchased in the app.');
      onSave?.();
      onClose();
    } catch (err) {
      toast.error((err as Error).message || 'Failed to save pack');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const groupedCategories = categories.reduce((acc, cat) => {
    const group = (cat as Category & { group?: string }).group || 'Ungrouped';
    if (!acc[group]) acc[group] = [];
    acc[group].push(cat);
    return acc;
  }, {} as Record<string, Category[]>);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[80]" role="dialog" aria-modal="true" aria-labelledby="add-pack-title">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-teal-50">
          <div>
            <h2 id="add-pack-title" className="text-xl font-bold text-gray-900">
              {isEditing ? 'Edit resource pack' : 'Add resource pack'}
            </h2>
            <p className="text-sm text-gray-600 mt-0.5">
              Add content (lesson stacks from the database) and an optional introduction. Packs can be purchased or assigned to users.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/80 rounded-lg"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pack ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={packId}
                  onChange={(e) => setPackId(e.target.value.toUpperCase().replace(/\s/g, '_'))}
                  placeholder="e.g. COMMEDIA_KS3_DRAMA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  disabled={isEditing}
                />
                {!isEditing && (
                  <button
                    type="button"
                    onClick={suggestPackId}
                    className="text-xs text-teal-600 hover:underline mt-1"
                  >
                    Suggest from name
                  </button>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COMMON_ICONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setIcon(emoji)}
                      className={`text-2xl p-1 rounded border-2 transition-colors ${
                        icon === emoji ? 'border-teal-600 bg-teal-50' : 'border-transparent hover:bg-gray-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-14 px-2 py-1 border border-gray-300 rounded text-center text-xl"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pack name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Commedia dell'arte – KS3 Drama"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what's included so buyers know what they're getting..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (£)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <label className="flex items-center gap-2 pt-7">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">Available for purchase</span>
              </label>
            </div>

            {/* Show in Lesson Library for — which year group sections see this pack's stacks */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Show in Lesson Library for</h4>
              <p className="text-xs text-gray-600 mb-3">
                Choose which year group sections can see and add this pack’s units. Leave all unchecked to show for every year group.
              </p>
              <div className="flex flex-wrap gap-2">
                {PACK_YEAR_GROUP_SECTIONS.map((section) => {
                  const isSelected = yearGroupSections.includes(section.id);
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => toggleYearGroupSection(section.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-100 border border-gray-300 text-gray-700 hover:border-teal-400'
                      }`}
                    >
                      {section.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Add content: introduction + lesson stacks from database */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Add content to this pack</h4>

              {/* Introduction (rich text) — modal */}
              <div className="mb-4">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-teal-600" />
                    Introduction (optional)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowIntroductionModal(true)}
                    className="px-3 py-1.5 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100"
                  >
                    {introduction ? 'Edit introduction' : 'Add introduction'}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  A short overview or how-to shown when users view this pack. Opens in a rich-text editor.
                </p>
                {introduction && (() => {
                  const plain = introduction.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                  return (
                    <p className="mt-1 text-xs text-gray-600 line-clamp-2 overflow-hidden border-l-2 border-teal-200 pl-2">
                      {plain.slice(0, 120)}{plain.length > 120 ? '…' : ''}
                    </p>
                  );
                })()}
              </div>

              {/* Lesson stacks from database */}
              {stacks.length > 0 ? (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-teal-600" />
                    Lessons from the database (lesson stacks)
                  </p>
                  <p className="text-xs text-gray-600 mb-2">
                    Add lesson stacks so buyers can add these units to their calendar in one click.
                  </p>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {stacks.map((stack) => {
                      const isSelected = stackIds.includes(stack.id);
                      return (
                        <button
                          key={stack.id}
                          type="button"
                          onClick={() => toggleStack(stack.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                            isSelected
                              ? 'bg-teal-600 text-white'
                              : 'bg-gray-100 border border-gray-300 text-gray-700 hover:border-teal-400'
                          }`}
                        >
                          <span className="truncate max-w-[180px]" title={stack.name}>{stack.name}</span>
                          {stack.lessons?.length != null && (
                            <span className="text-xs opacity-80">({stack.lessons.length})</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  No lesson stacks in the database yet. Create stacks in Lesson Library (Lesson Stacks / Units) first, then they will appear here to add to this pack.
                </p>
              )}
            </div>

            {/* Link categories — minimised (collapsible) */}
            {Object.keys(groupedCategories).length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                  className="flex items-center gap-2 w-full text-left text-sm font-semibold text-gray-900 hover:text-teal-700"
                >
                  {categoriesExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  Link to categories (optional) — {categoryIds.length} selected
                </button>
                {categoriesExpanded && (
                  <>
                    <p className="text-xs text-gray-600 mt-2 mb-2">
                      Categories linked to this pack can be restricted to buyers only.
                    </p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {Object.entries(groupedCategories).map(([groupName, groupCats]) => (
                        <div key={groupName} className="bg-gray-50 rounded-lg p-2">
                          <h5 className="text-xs font-medium text-gray-700 mb-1">{groupName}</h5>
                          <div className="flex flex-wrap gap-1">
                            {groupCats.map((cat) => {
                              const id = (cat as Category & { id?: string }).id ?? cat.name;
                              const isSelected = categoryIds.includes(id);
                              return (
                                <button
                                  key={id}
                                  type="button"
                                  onClick={() => toggleCategory(id)}
                                  className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                                    isSelected ? 'bg-teal-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:border-teal-400'
                                  }`}
                                >
                                  {cat.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-60 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : isEditing ? 'Update pack' : 'Add resource pack'}
            </button>
          </div>
        </form>

        <PackIntroductionModal
          isOpen={showIntroductionModal}
          onClose={() => setShowIntroductionModal(false)}
          value={introduction}
          onChange={setIntroduction}
          onSave={() => {}}
          packName={name || undefined}
        />
      </div>
    </div>
  );
}
