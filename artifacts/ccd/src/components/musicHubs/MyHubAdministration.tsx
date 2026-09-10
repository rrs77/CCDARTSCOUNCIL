import { useEffect, useState } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { musicHubAdminHref, musicHubPublicHref } from '../../config/musicHubsDirectory';
import { listMyAdministeredHubs } from '../../utils/musicHubAdminAccess';

/** Shortcuts to hub admin dashboards for the signed-in user’s assigned areas. */
export function MyHubAdministration() {
  const { user, profile } = useAuth();
  const [hubs, setHubs] = useState(() => listMyAdministeredHubs(user?.id));

  useEffect(() => {
    const refresh = () => setHubs(listMyAdministeredHubs(user?.id));
    refresh();
    window.addEventListener('ccd:music-hub-admin-changed', refresh);
    return () => window.removeEventListener('ccd:music-hub-admin-changed', refresh);
  }, [user?.id, profile?.role]);

  if (!user?.id || hubs.length === 0) return null;

  return (
    <div className="rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
        <MapPin className="h-4 w-4 text-teal-700" />
        My Hub Administration
      </h3>
      <p className="mt-1 text-xs text-gray-600">
        Areas you can edit (drafts). Publishing requires a CCDesigner admin approval.
      </p>
      <ul className="mt-3 space-y-2">
        {hubs.map((h) => (
          <li
            key={h.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-teal-100 bg-white px-3 py-2"
          >
            <span className="text-sm font-medium text-gray-900">{h.name}</span>
            <span className="flex gap-2">
              <a
                href={musicHubPublicHref(h.path)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:underline"
              >
                View
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href={musicHubAdminHref(h.path)}
                className="inline-flex items-center gap-1 rounded-md bg-teal-700 px-2 py-1 text-xs font-semibold text-white hover:bg-teal-800"
              >
                Edit Hub
              </a>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
