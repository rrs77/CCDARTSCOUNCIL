import React, { useState, useEffect } from 'react';
import { X, Package, Save } from 'lucide-react';
import { activityPacksApi } from '../../config/api';
import type { Profile } from '../../types/auth';
import type { ActivityPack } from '../../config/api';
import toast from 'react-hot-toast';

interface AssignPacksModalProps {
  user: Profile;
  onSave: (updates: Partial<Profile>) => Promise<void>;
  onClose: () => void;
}

export function AssignPacksModal({ user, onSave, onClose }: AssignPacksModalProps) {
  const [packs, setPacks] = useState<ActivityPack[]>([]);
  const [selectedPackIds, setSelectedPackIds] = useState<string[]>(user.admin_preset_activity_pack_ids ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    activityPacksApi.getAllPacksAdmin().then(setPacks).catch(() => setPacks([]));
  }, []);

  useEffect(() => {
    setSelectedPackIds(user.admin_preset_activity_pack_ids ?? []);
  }, [user.id, user.admin_preset_activity_pack_ids]);

  const togglePack = (packId: string) => {
    setSelectedPackIds(prev =>
      prev.includes(packId) ? prev.filter(id => id !== packId) : [...prev, packId]
    );
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      await onSave({
        admin_preset_activity_pack_ids: selectedPackIds.length > 0 ? selectedPackIds : null,
        updated_at: new Date().toISOString()
      });
      toast.success('Packs updated.');
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-teal-600" />
            Assign packs
          </h2>
          <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            Grant access to activity packs for <strong>{user.display_name || user.email || user.id}</strong>. They will see these packs without purchasing.
          </p>
          {packs.length === 0 ? (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              No packs available. Add packs in Settings → Admin → Activity Packs first.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {packs.map(pack => (
                <label
                  key={pack.pack_id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedPackIds.includes(pack.pack_id)}
                    onChange={() => togglePack(pack.pack_id)}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-2xl" aria-hidden>{pack.icon || '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-900 block truncate">{pack.name}</span>
                    <span className="text-xs text-gray-500">£{pack.price?.toFixed(2) ?? '0.00'}</span>
                  </div>
                </label>
              ))}
            </div>
          )}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || packs.length === 0}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
