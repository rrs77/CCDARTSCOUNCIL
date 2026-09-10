import { useEffect, useMemo, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Profile } from '../../types/auth';
import {
  collectDescendantNodeIds,
  getAssignedHubNodeIdsForUser,
  getInheritParentsForUser,
  listAdministerableHubNodes,
  setMusicHubAccessForUser,
} from '../../utils/musicHubAdminAccess';

/**
 * Settings → Users → Manage Access — assign Music Hub areas to an existing user.
 * Does not redesign Users UI; opens from the Actions menu.
 */
export function ManageMusicHubAccessModal({
  user,
  onClose,
}: {
  user: Profile;
  onClose: () => void;
}) {
  const hubs = useMemo(() => listAdministerableHubNodes(), []);
  const [selected, setSelected] = useState<string[]>(() => getAssignedHubNodeIdsForUser(user.id));
  const [inheritEmsChildren, setInheritEmsChildren] = useState(
    () => getInheritParentsForUser(user.id).includes('ems'),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelected(getAssignedHubNodeIdsForUser(user.id));
    setInheritEmsChildren(getInheritParentsForUser(user.id).includes('ems'));
  }, [user.id]);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSave = () => {
    setSaving(true);
    try {
      let nodeIds = [...selected];
      const inherit: string[] = [];
      if (inheritEmsChildren) {
        inherit.push('ems');
        if (!nodeIds.includes('ems')) nodeIds.push('ems');
        // Persist expanded children so assignments survive without re-checking inherit
        for (const id of collectDescendantNodeIds('ems')) {
          if (!nodeIds.includes(id)) nodeIds.push(id);
        }
      }
      setMusicHubAccessForUser(user.id, nodeIds, inherit);
      toast.success('Music Hub access updated');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const parents = hubs.filter((h) => h.kind === 'service' || h.kind === 'music-hub' || h.kind === 'national-service');
  const districts = hubs.filter((h) => h.kind === 'district' || h.kind === 'borough');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <MapPin className="h-5 w-5 text-teal-600" />
              Manage Access
            </h2>
            <p className="mt-0.5 text-sm text-gray-600">
              Music Hub areas for {user.display_name || user.email || user.id}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:text-gray-600" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <p className="text-xs text-gray-500">
            Extends this CCDesigner user — no separate hub login. Assigned admins can edit drafts;
            only system admins approve & publish.
          </p>

          <label className="flex items-start gap-2 rounded-lg border border-teal-200 bg-teal-50/60 px-3 py-2.5">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={inheritEmsChildren}
              onChange={(e) => setInheritEmsChildren(e.target.checked)}
            />
            <span className="text-sm text-gray-800">
              <strong>EMS + all Essex areas</strong>
              <span className="block text-xs text-gray-600">
                Administer Essex Music Service and every district (Chelmsford, Colchester, …).
              </span>
            </span>
          </label>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-800">Services / hubs</p>
            <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto">
              {parents.map((h) => (
                <label
                  key={h.id}
                  className="inline-flex items-center gap-1.5 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-sm"
                >
                  <input type="checkbox" checked={selected.includes(h.id)} onChange={() => toggle(h.id)} />
                  {h.name}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-800">Districts / boroughs</p>
            <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
              {districts.map((h) => (
                <label
                  key={h.id}
                  className="inline-flex items-center gap-1.5 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs sm:text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(h.id) || (inheritEmsChildren && h.organisationId === 'ems')}
                    disabled={inheritEmsChildren && h.organisationId === 'ems'}
                    onChange={() => toggle(h.id)}
                  />
                  {h.name}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save access'}
          </button>
        </div>
      </div>
    </div>
  );
}
