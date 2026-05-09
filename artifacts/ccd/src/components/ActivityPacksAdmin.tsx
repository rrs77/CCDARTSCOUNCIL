import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Package, Tag } from 'lucide-react';
import { activityPacksApi, ActivityPack } from '../config/api';
import { useSettings } from '../contexts/SettingsContextNew';
import { AddSoftwarePackModal } from './AddSoftwarePackModal';
import toast from 'react-hot-toast';

interface ActivityPacksAdminProps {
  userEmail: string;
  /** User is a creator (can add packs and edit only their own). */
  isCreator: boolean;
  /** User is admin/superuser (can see and edit all packs). */
  isAdmin: boolean;
}

export const ActivityPacksAdmin: React.FC<ActivityPacksAdminProps> = ({ userEmail, isCreator, isAdmin }) => {
  const { categories } = useSettings();
  const [packs, setPacks] = useState<ActivityPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingPack, setEditingPack] = useState<Partial<ActivityPack> | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const canAddPack = isCreator || isAdmin;
  const canEditPack = (pack: ActivityPack) => isAdmin || (isCreator && pack.creator_email === userEmail);

  useEffect(() => {
    loadPacks();
  }, [isAdmin, isCreator, userEmail]);

  const loadPacks = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = isAdmin
        ? await activityPacksApi.getAllPacksAdmin()
        : isCreator
          ? await activityPacksApi.getPacksForCreator(userEmail)
          : [];
      setPacks(data);
    } catch (error) {
      console.error('Failed to load packs:', error);
      const message = error instanceof Error ? error.message : 'Failed to load packs';
      setLoadError(message);
      setPacks([]);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePack = () => {
    setEditingPack(null);
    setShowCreateForm(true);
  };

  const handleDeletePack = async (packId: string) => {
    if (!confirm('Are you sure you want to delete this pack? This cannot be undone.')) {
      return;
    }

    try {
      await activityPacksApi.deletePack(packId);
      toast.success('Pack deleted successfully!');
      loadPacks();
    } catch (error) {
      console.error('Failed to delete pack:', error);
      toast.error('Failed to delete pack');
    }
  };

  if (loading && packs.length === 0 && !loadError) {
    return <div className="p-6 text-center text-gray-600">Loading activity packs...</div>;
  }

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-amber-800">Failed to load packs</p>
            <p className="text-sm text-amber-700 mt-1">{loadError}</p>
            <p className="text-xs text-amber-600 mt-2">
              Check that Supabase is configured and the activity_packs table exists. If you added the introduction column, run the migration activity_packs_add_introduction.sql.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadPacks()}
            className="px-3 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 whitespace-nowrap"
          >
            Retry
          </button>
        </div>
      )}

      {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Package className="h-6 w-6 text-teal-600" />
                <span>Manage Activity Packs</span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Share your lesson plans: add resource packs (with lesson stacks and an optional introduction) that you can assign to users. Link categories to control access.
              </p>
            </div>
            {canAddPack && (
              <button
                onClick={handleCreatePack}
                className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add resource pack</span>
              </button>
            )}
          </div>

      {/* Existing Packs */}
      <div className="space-y-4">
        {packs.map((pack) => (
          <div
            key={pack.id}
            className="bg-white border border-gray-200 rounded-lg p-5 hover:border-teal-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-3xl">{pack.icon}</span>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">{pack.name}</h4>
                    <p className="text-sm text-gray-500">ID: {pack.pack_id}</p>
                  </div>
                  {!pack.is_active && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 mb-3">{pack.description}</p>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center space-x-1 text-gray-600">
                    <Tag className="h-4 w-4" />
                    <span>{pack.category_ids?.length || 0} categories linked</span>
                  </span>
                </div>
              </div>
              {(canEditPack(pack) && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setEditingPack(pack);
                      setShowCreateForm(true);
                    }}
                    className="px-3 py-1.5 text-teal-600 border border-teal-600 rounded hover:bg-teal-50 transition-colors text-sm"
                    aria-label={`Edit ${pack.name}`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeletePack(pack.pack_id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )) || (isCreator && pack.creator_email !== userEmail && (
                <span className="text-xs text-gray-500">Created by another creator</span>
              ))}
            </div>

            {pack.category_ids && pack.category_ids.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-2">Linked Categories:</p>
                <div className="flex flex-wrap gap-2">
                  {pack.category_ids.map((catId) => {
                    const category = categories.find(c => c.id === catId);
                    return category ? (
                      <span
                        key={catId}
                        className="px-2 py-1 rounded text-xs text-white"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        ))}

        {packs.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No activity packs created yet</p>
            <p className="text-sm text-gray-500 mt-1">Click "Create Pack" to get started</p>
          </div>
        )}
      </div>

      {/* Add / Edit resource pack modal */}
      <AddSoftwarePackModal
        isOpen={showCreateForm}
        onClose={() => {
          setShowCreateForm(false);
          setEditingPack(null);
        }}
        onSave={loadPacks}
        editingPack={editingPack}
        categories={categories}
        creatorEmail={userEmail}
      />
    </div>
  );
};

