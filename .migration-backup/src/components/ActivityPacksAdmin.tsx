import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, Package, DollarSign, Tag, Receipt, UserPlus } from 'lucide-react';
import { activityPacksApi, ActivityPack, UserPurchase } from '../config/api';
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
  
  // Purchase management
  const [purchases, setPurchases] = useState<UserPurchase[]>([]);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'packs' | 'purchases'>('packs');
  const [newPurchase, setNewPurchase] = useState({
    user_email: '',
    pack_id: '',
    paypal_transaction_id: '',
    amount: 0
  });

  useEffect(() => {
    loadPacks();
    if (isAdmin) loadPurchases();
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

  const loadPurchases = async () => {
    try {
      const data = await activityPacksApi.getAllPurchases();
      setPurchases(data);
    } catch (error) {
      console.error('Failed to load purchases:', error);
      toast.error('Failed to load purchases');
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

  const handleRecordPurchase = async () => {
    try {
      // Validation
      if (!newPurchase.user_email || !newPurchase.pack_id) {
        toast.error('User email and pack are required');
        return;
      }

      const selectedPack = packs.find(p => p.pack_id === newPurchase.pack_id);
      const purchaseData = {
        user_email: newPurchase.user_email,
        pack_id: newPurchase.pack_id,
        paypal_transaction_id: newPurchase.paypal_transaction_id || null,
        amount: newPurchase.amount || selectedPack?.price || 0,
        status: 'active' as const
      };

      await activityPacksApi.recordPurchase(purchaseData);
      toast.success(`Purchase recorded for ${newPurchase.user_email}!`);
      
      setShowPurchaseForm(false);
      setNewPurchase({
        user_email: '',
        pack_id: '',
        paypal_transaction_id: '',
        amount: 0
      });
      loadPurchases();
    } catch (error) {
      console.error('Failed to record purchase:', error);
      toast.error('Failed to record purchase: ' + (error as Error).message);
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

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('packs')}
          className={`px-4 py-2 font-medium text-sm transition-all ${
            activeTab === 'packs'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-gray-600 hover:text-teal-600'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Activity Packs</span>
          </div>
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-4 py-2 font-medium text-sm transition-all ${
              activeTab === 'purchases'
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-gray-600 hover:text-teal-600'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Receipt className="h-4 w-4" />
              <span>Purchases ({purchases.length})</span>
            </div>
          </button>
        )}
      </div>

      {/* Packs Tab */}
      {activeTab === 'packs' && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Package className="h-6 w-6 text-teal-600" />
                <span>Manage Activity Packs</span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Share and sell your lesson plans: add resource packs (with lesson stacks and an optional introduction) that others can purchase or you can assign. Link categories to control access.
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
                  <span className="flex items-center space-x-1 text-green-600 font-semibold">
                    <DollarSign className="h-4 w-4" />
                    <span>£{pack.price.toFixed(2)}</span>
                  </span>
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
        </>
      )}

      {/* Purchases Tab */}
      {activeTab === 'purchases' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Receipt className="h-6 w-6 text-teal-600" />
                <span>Purchase Records</span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                View all purchases and manually record new purchases.
              </p>
            </div>
            <button
              onClick={() => setShowPurchaseForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              <span>Record Purchase</span>
            </button>
          </div>

          {/* Purchases List */}
          <div className="space-y-3">
            {purchases.map((purchase) => {
              const pack = packs.find(p => p.pack_id === purchase.pack_id);
              return (
                <div
                  key={purchase.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-teal-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{pack?.icon || '📦'}</span>
                        <div>
                          <h4 className="font-semibold text-gray-900">{purchase.user_email}</h4>
                          <p className="text-sm text-gray-600">{pack?.name || purchase.pack_id}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>£{purchase.amount.toFixed(2)}</span>
                        <span>•</span>
                        <span>{new Date(purchase.purchase_date).toLocaleDateString()}</span>
                        {purchase.paypal_transaction_id && (
                          <>
                            <span>•</span>
                            <span>Transaction: {purchase.paypal_transaction_id}</span>
                          </>
                        )}
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded ${
                          purchase.status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {purchase.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {purchases.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No purchases recorded yet</p>
                <p className="text-sm text-gray-500 mt-1">Click "Record Purchase" to add one</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Record Purchase Form Modal */}
      {showPurchaseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[80]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-xl font-bold text-gray-900">Record Purchase</h3>
              <button
                onClick={() => setShowPurchaseForm(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newPurchase.user_email}
                  onChange={(e) => setNewPurchase({ ...newPurchase, user_email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Activity Pack <span className="text-red-500">*</span>
                </label>
                <select
                  value={newPurchase.pack_id}
                  onChange={(e) => {
                    const packId = e.target.value;
                    const pack = packs.find(p => p.pack_id === packId);
                    setNewPurchase({ 
                      ...newPurchase, 
                      pack_id: packId,
                      amount: pack?.price || 0
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">Select a pack...</option>
                  {packs.filter(p => p.is_active).map((pack) => (
                    <option key={pack.pack_id} value={pack.pack_id}>
                      {pack.icon} {pack.name} - £{pack.price.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newPurchase.amount}
                  onChange={(e) => setNewPurchase({ ...newPurchase, amount: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-filled from pack price</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PayPal Transaction ID (optional)
                </label>
                <input
                  type="text"
                  value={newPurchase.paypal_transaction_id}
                  onChange={(e) => setNewPurchase({ ...newPurchase, paypal_transaction_id: e.target.value })}
                  placeholder="e.g., 1AB23456CD789012E"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3 rounded-b-xl">
              <button
                onClick={() => setShowPurchaseForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPurchase}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Record Purchase</span>
              </button>
            </div>
          </div>
        </div>
      )}

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

