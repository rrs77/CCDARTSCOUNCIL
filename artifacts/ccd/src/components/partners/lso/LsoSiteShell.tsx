import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import type { LsoSitePath } from '../../../utils/lsoSiteContent';
import { isLsoEditorUnlocked } from '../../../utils/lsoSiteContent';
import { LsoSiteProvider, useLsoSite } from './LsoSiteContext';
import { LsoEditGate } from './LsoEditGate';
import { LsoEditPanel } from './LsoEditPanel';
import { LsoCustomPageView } from './LsoCustomPageView';
import { LsoPartnerHubBody } from './LsoPartnerHubBody';

/**
 * Shell for `/lso`, `/lso/edit`, and `/lso/p/:slug` — provides site content + editor chrome.
 */
export function LsoSiteShell({
  path,
  onAddedToApp,
}: {
  path: LsoSitePath;
  onAddedToApp?: (info: { sheetId: string }) => void;
}) {
  const routeWantsEdit =
    path.view === 'edit' || (path.view === 'page' && path.editing);

  return (
    <LsoSiteProvider startEditing={routeWantsEdit && isLsoEditorUnlocked()}>
      <LsoSiteShellInner
        path={path}
        routeWantsEdit={routeWantsEdit}
        onAddedToApp={onAddedToApp}
      />
    </LsoSiteProvider>
  );
}

function LsoSiteShellInner({
  path,
  routeWantsEdit,
  onAddedToApp,
}: {
  path: LsoSitePath;
  routeWantsEdit: boolean;
  onAddedToApp?: (info: { sheetId: string }) => void;
}) {
  const { unlocked, editing, setEditing } = useLsoSite();
  const [gateOpen, setGateOpen] = useState(routeWantsEdit && !unlocked);
  const [panelOpen, setPanelOpen] = useState(true);

  useEffect(() => {
    if (routeWantsEdit && unlocked) setEditing(true);
    if (routeWantsEdit && !unlocked) setGateOpen(true);
  }, [routeWantsEdit, unlocked, setEditing]);

  const showEditEntry = path.view === 'hub' && !editing;

  return (
    <>
      {showEditEntry && (
        <div className="mb-4 flex justify-end">
          <a
            href="/lso/edit"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:border-teal-300 hover:text-teal-800"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Edit site
          </a>
        </div>
      )}

      {editing && (
        <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm text-teal-900">
          <strong className="font-semibold">Editing unlocked.</strong> Click dashed regions to
          change copy and images. Use the editing panel to add pages from 5 templates. Saves
          automatically in this browser.
        </div>
      )}

      {path.view === 'page' ? (
        <LsoCustomPageView pageSlug={path.pageSlug} editing={editing} />
      ) : (
        <LsoPartnerHubBody onAddedToApp={onAddedToApp} />
      )}

      <LsoEditGate
        open={gateOpen}
        onClose={() => {
          setGateOpen(false);
          if (path.view === 'edit') {
            window.location.assign('/lso');
          } else if (path.view === 'page' && path.editing) {
            window.location.assign(`/lso/p/${path.pageSlug}`);
          }
        }}
        onUnlocked={() => {
          setGateOpen(false);
          setEditing(true);
          if (path.view === 'hub') {
            window.history.replaceState({}, '', '/lso/edit');
          }
        }}
      />

      <LsoEditPanel open={panelOpen} onOpenChange={setPanelOpen} />
    </>
  );
}
