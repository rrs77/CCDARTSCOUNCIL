import React, { useState } from 'react';
import { Plus, Save, Trash2, Palette } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettings, Category } from '../../contexts/SettingsContextNew';
import { ColorPickerWithFavorites } from '../ColorPickerWithFavorites';
import { DEFAULT_SYSTEM_CATEGORIES } from '../../utils/systemCategories';

/**
 * Super-admin / admin: edit the shared app category catalog.
 * Stored in branding_settings key `system:categories` — does not delete activities.
 */
export function SystemCategoriesAdmin() {
  const { systemCategoryCatalog, updateSystemCategoryCatalog } = useSettings();
  const [draft, setDraft] = useState<Category[]>(() =>
    (systemCategoryCatalog?.length ? systemCategoryCatalog : DEFAULT_SYSTEM_CATEGORIES).map((c: Category | typeof DEFAULT_SYSTEM_CATEGORIES[number], i: number) => ({
      name: c.name,
      color: c.color,
      position: c.position ?? i,
      yearGroups: { ...(c.yearGroups || {}) },
      source: 'system' as const,
      hidden: 'hidden' in c ? c.hidden : undefined,
    }))
  );
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6B7280');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (systemCategoryCatalog?.length) {
      setDraft(
        systemCategoryCatalog.map((c: Category, i: number) => ({
          name: c.name,
          color: c.color,
          position: c.position ?? i,
          yearGroups: { ...(c.yearGroups || {}) },
          source: 'system' as const,
          hidden: c.hidden,
        }))
      );
    }
  }, [systemCategoryCatalog]);

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    if (draft.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      toast.error('That category name already exists in the system catalog');
      return;
    }
    setDraft((prev) => [
      ...prev,
      {
        name,
        color: newColor,
        position: prev.length,
        yearGroups: {},
        source: 'system',
      },
    ]);
    setNewName('');
    setNewColor('#6B7280');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSystemCategoryCatalog(draft);
      toast.success('System categories saved — users will see updates on next load/refresh');
    } catch (e) {
      console.error(e);
      toast.error('Failed to save system categories');
    } finally {
      setSaving(false);
    }
  };

  const handleSeedDefaults = () => {
    if (!confirm('Reset draft to built-in defaults? Unsaved edits will be lost. Click Save to publish.')) return;
    setDraft(
      DEFAULT_SYSTEM_CATEGORIES.map((c, i) => ({
        name: c.name,
        color: c.color,
        position: i,
        yearGroups: {},
        source: 'system' as const,
      }))
    );
  };

  return (
    <div className="border border-slate-200 bg-white rounded-lg p-6 shadow-sm space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Palette className="h-6 w-6 text-slate-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">System categories</h3>
            <p className="text-sm text-gray-600 mt-1 max-w-2xl">
              Shared app catalog for all schools. Teachers customise year-group assignments in Settings → Categories;
              they cannot delete these rows. Saving does not recreate or delete activities.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSeedDefaults}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Load built-in defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-lg flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save catalog'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-end border border-dashed border-slate-200 rounded-lg p-4 bg-slate-50">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">New system category</label>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div className="w-24">
          <label className="block text-xs font-medium text-gray-600 mb-1">Colour</label>
          <ColorPickerWithFavorites
            id="system-cat-color"
            value={newColor}
            onChange={setNewColor}
            className="w-full h-10 rounded-lg border border-gray-300"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg flex items-center gap-2 text-sm"
        >
          <Plus className="h-4 w-4" />
          Add to draft
        </button>
      </div>

      <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
        {draft.map((cat, index) => (
          <li key={`${cat.name}-${index}`} className="flex items-center gap-3 px-4 py-3 bg-white">
            <input
              type="color"
              value={cat.color}
              onChange={(e) => {
                const color = e.target.value;
                setDraft((prev) => prev.map((c, i) => (i === index ? { ...c, color } : c)));
              }}
              className="w-9 h-9 rounded border border-gray-200 cursor-pointer"
              title="Colour"
            />
            <input
              value={cat.name}
              onChange={(e) => {
                const name = e.target.value;
                setDraft((prev) => prev.map((c, i) => (i === index ? { ...c, name } : c)));
              }}
              className="flex-1 px-2 py-1.5 border border-gray-200 rounded-md text-sm font-medium"
            />
            <label className="flex items-center gap-1.5 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={cat.hidden === true}
                onChange={(e) => {
                  const hidden = e.target.checked;
                  setDraft((prev) => prev.map((c, i) => (i === index ? { ...c, hidden } : c)));
                }}
              />
              Hidden
            </label>
            <button
              type="button"
              onClick={() => {
                if (!confirm(`Remove “${cat.name}” from the system catalog draft? Existing activities keep this category name.`)) return;
                setDraft((prev) => prev.filter((_, i) => i !== index).map((c, i) => ({ ...c, position: i })));
              }}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              title="Remove from catalog"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
