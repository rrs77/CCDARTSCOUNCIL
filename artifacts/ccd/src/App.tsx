import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { AuthProvider } from './contexts/AuthContext';
import { ForcePasswordChangeGate } from './components/Auth/ForcePasswordChangeGate';
import {
  consumeDownloadIntent,
  startTrackedDownload,
} from './utils/trackedDownload';
import { DataProvider } from './contexts/DataContext';
import { SettingsProviderNew } from './contexts/SettingsContextNew';
import { PaidBasketProvider } from './contexts/PaidBasketContext';
import { DndRoot } from './components/dnd';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { LoginForm } from './components/LoginForm';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Footer } from './components/Footer';
import { useAuth } from './hooks/useAuth';
import { HelpGuide } from './components/HelpGuide';
import { SchoolHomepage } from './components/SchoolHomepage';
import { PreviewBanner } from './components/PreviewBanner';
import { getSchoolForPath, type SchoolHomepageConfig } from './config/schoolHomepages';
import { getPartnerHubForPath } from './config/partnerHubs';
import { initializeSupabaseKeepAlive } from './utils/supabaseKeepAlive';
import { isAuthorizedDemoMode, shouldShowPreviewBanner } from './utils/demoMode';
import './utils/setupKS1Maths'; // Make setupKS1MathsExample available in browser console
import './utils/setupDanceObjectives'; // Make setupDanceObjectives available in browser console
import './utils/setupSecondaryDramaObjectives'; // Make setupSecondaryDramaObjectives available in browser console
import './utils/addForParentsToLKG'; // Make addForParentsToLKG available in browser console
import './utils/addLKGActivitiesToAllYearGroups'; // Make addLKGActivitiesToAllYearGroups available in browser console
import './utils/setupLSOYear6'; // Seed LSO Year 6 example (categories, activities, lesson stack)
import './utils/setupROHRomeoJuliet'; // ROH Romeo and Juliet KS2 seed (on-demand + console)
import './utils/setupWTDBloodBrothers'; // We Teach Drama Blood Brothers GCSE seed
import './utils/setupWeTeachDramaPacks'; // We Teach Drama hub packs (cover, design, practitioners)
import './utils/setupKS3FourChords'; // KS3 4 Chords prototype seed
import './utils/setupOCRFilmComputerMusic'; // OCR Film & Computer Music prototype seed
import './utils/setupEMSSchoolsExample'; // Essex Music Service schools brochure seed
import './utils/setupEMSWorkshops'; // EMS DJ + Rap-It! workshop showcase seeds
import './utils/setupTBMHProgrammes'; // Tri-Borough Groove n Play + Music Makes Me seeds
import './utils/setupICCGettingStarted'; // iCompose Getting Started seed
import './utils/setupICCFanfare'; // iCompose Fanfare paid course seed
import './utils/setupDramaResourceExample'; // Drama Resource Ten Second Objects seed
import './utils/setupJazzNorthExample'; // Jazz North Mr Big + Playlist Project seeds
import { RohPartnerHub } from './components/partners/RohPartnerHub';
import { WtdPartnerHub } from './components/partners/WtdPartnerHub';
import { EmsPartnerHub } from './components/partners/EmsPartnerHub';
import { IccPartnerHub } from './components/partners/IccPartnerHub';
import { DramaResourcePartnerHub } from './components/partners/DramaResourcePartnerHub';
import { JazzNorthPartnerHub } from './components/partners/JazzNorthPartnerHub';
import { TriBoroughPartnerHub } from './components/partners/TriBoroughPartnerHub';
import { PartnerHubPage } from './components/partners/PartnerHubPage';
import { PartnerResourcesHub } from './components/partners/PartnerResourcesHub';
import { LsoPartnerHub } from './components/partners/LsoPartnerHub';
import { PrototypeWelcomeModal } from './components/login/PrototypeWelcomeModal';
import { TabsExplainerModal } from './components/login/TabsExplainerModal';
import {
  WELCOME_PROTOTYPE_STORAGE_KEY,
  type TabsExplainerTabId,
} from './components/login/prototypeCopy';
import { ForumApp, isForumPath } from './components/Forum/ForumApp';

function AppContent({ schoolHomepage }: { schoolHomepage: SchoolHomepageConfig | null }) {
  const { user, loading } = useAuth();
  const partnerHub =
    typeof window !== 'undefined' ? getPartnerHubForPath(window.location.pathname) : null;
  const onForum =
    typeof window !== 'undefined' ? isForumPath(window.location.pathname) : false;
  const [showPrototypeWelcome, setShowPrototypeWelcome] = useState(false);
  const [showTabsExplainer, setShowTabsExplainer] = useState(false);

  // After sign-in from a gated download or forum prompt, resume return URL.
  useEffect(() => {
    if (!user || loading) return;
    const { resourceId, returnUrl } = consumeDownloadIntent();
    if (resourceId) {
      void startTrackedDownload(resourceId);
      return;
    }
    let ret = returnUrl;
    if (!ret) {
      try {
        ret = sessionStorage.getItem('ccd_forum_return') || '';
        if (ret) sessionStorage.removeItem('ccd_forum_return');
      } catch {
        /* ignore */
      }
    }
    if (!ret && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('return');
      if (q && q.startsWith('/')) ret = q;
    }
    if (ret && ret.startsWith('/') && ret !== window.location.pathname + window.location.search) {
      window.history.replaceState({}, '', ret);
      window.dispatchEvent(new PopStateEvent('popstate'));
      if (isForumPath(ret.split('?')[0])) {
        window.location.assign(ret);
      }
    }
  }, [user, loading]);

  // Authenticated users on school homepage URLs rewrite to `/`. Partner hubs
  // (`/roh`, `/lso`, …) stay on their path so hubs are bookmarkable.
  useEffect(() => {
    if (
      user &&
      schoolHomepage &&
      !partnerHub &&
      typeof window !== 'undefined' &&
      window.location.pathname !== '/'
    ) {
      window.history.replaceState({}, '', '/');
    }
  }, [user, schoolHomepage, partnerHub]);
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [helpGuideSection, setHelpGuideSection] = useState<
    'activity' | 'lesson' | 'unit' | 'assign' | undefined
  >(undefined);

  // Demo / prototype entry only — welcome modal. Tabs explainer opens on
  // explicit click near the Dashboard tabs (not chained after welcome).
  // Real teacher logins must not see these popups.
  useEffect(() => {
    if (!user || partnerHub || !isAuthorizedDemoMode()) return;
    let welcomeSeen = false;
    try {
      welcomeSeen = sessionStorage.getItem(WELCOME_PROTOTYPE_STORAGE_KEY) === '1';
    } catch {
      // still show welcome
    }
    if (!welcomeSeen) {
      setShowPrototypeWelcome(true);
    }
  }, [user, partnerHub]);

  // Demo-only: Dashboard "About these tabs" button re-opens the explainer anytime.
  useEffect(() => {
    const openTabsExplainer = () => setShowTabsExplainer(true);
    window.addEventListener('ccd:open-tabs-explainer', openTabsExplainer);
    return () => window.removeEventListener('ccd:open-tabs-explainer', openTabsExplainer);
  }, []);

  const dismissPrototypeWelcome = () => {
    try {
      sessionStorage.setItem(WELCOME_PROTOTYPE_STORAGE_KEY, '1');
    } catch {
      // ignore
    }
    setShowPrototypeWelcome(false);
  };

  const dismissTabsExplainer = () => {
    setShowTabsExplainer(false);
  };

  const openDashboardTab = (tabId: TabsExplainerTabId) => {
    try {
      window.dispatchEvent(
        new CustomEvent('ccd:open-tab', { detail: { tab: tabId } }),
      );
    } catch {
      /* ignore */
    }
  };

  // Defer Supabase keep-alive so it doesn't compete with initial auth/data load
  useEffect(() => {
    let keepAliveCleanup: (() => void) | null = null;
    const t = setTimeout(() => {
      keepAliveCleanup = initializeSupabaseKeepAlive();
    }, 3000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        import('./utils/supabaseKeepAlive').then(({ checkAndPingSupabase }) => {
          checkAndPingSupabase();
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(t);
      keepAliveCleanup?.();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    if (onForum) {
      return <ForumApp />;
    }
    if (schoolHomepage) {
      return <SchoolHomepage school={schoolHomepage} />;
    }
    return <LoginForm />;
  }

  if (onForum) {
    return <ForumApp />;
  }

  const handleOpenGuide = (
    section?: 'activity' | 'lesson' | 'unit' | 'assign'
  ) => {
    setHelpGuideSection(section);
    setShowHelpGuide(true);
  };

  const showPreviewBanner = shouldShowPreviewBanner();

  // Mini partner hubs at /roh, /lso, /ems, etc. (signed-in) — school-homepage style chrome
  if (partnerHub) {
    const goHomeAfterAdd = (key: string, sheetId: string, tab = 'lesson-library') => {
      try {
        sessionStorage.setItem(key, JSON.stringify({ sheetId, tab }));
      } catch {
        /* ignore */
      }
      window.location.assign('/');
    };

    let body: React.ReactNode;
    switch (partnerHub.slug) {
      case 'roh':
        body = (
          <RohPartnerHub
            standalone
            onAddedToApp={({ sheetId }) => goHomeAfterAdd('ccd-open-after-roh', sheetId)}
          />
        );
        break;
      case 'lso':
        body = (
          <LsoPartnerHub
            standalone
            onAddedToApp={({ sheetId }) =>
              goHomeAfterAdd('ccd-open-after-partner', sheetId, 'lesson-library')
            }
          />
        );
        break;
      case 'weteachdrama':
      case 'wtd':
        body = (
          <WtdPartnerHub
            standalone
            onAddedToApp={({ sheetId }) => goHomeAfterAdd('ccd-open-after-partner', sheetId)}
          />
        );
        break;
      case 'ems':
        body = (
          <EmsPartnerHub
            standalone
            onAddedToApp={({ sheetId }) => goHomeAfterAdd('ccd-open-after-partner', sheetId)}
          />
        );
        break;
      case 'icompose':
      case 'icancompose':
        body = (
          <IccPartnerHub
            standalone
            onAddedToApp={({ sheetId }) => goHomeAfterAdd('ccd-open-after-partner', sheetId)}
          />
        );
        break;
      case 'dramaresource':
      case 'davidfarmer':
        body = (
          <DramaResourcePartnerHub
            standalone
            onAddedToApp={({ sheetId }) => goHomeAfterAdd('ccd-open-after-partner', sheetId)}
          />
        );
        break;
      case 'jazznorth':
      case 'jazz-north':
      case 'jn':
        body = (
          <JazzNorthPartnerHub
            standalone
            onAddedToApp={({ sheetId }) => goHomeAfterAdd('ccd-open-after-partner', sheetId)}
          />
        );
        break;
      case 'sadlerswells':
      case 'tate':
      case 'nationaltheatre':
      case 'bbctenpieces':
      case 'nationalgallery':
        body = <PartnerResourcesHub hub={partnerHub} />;
        break;
      case 'triborough':
      case 'tbmh':
        body = (
          <TriBoroughPartnerHub
            standalone
            onAddedToApp={({ sheetId }) => goHomeAfterAdd('ccd-open-after-partner', sheetId)}
          />
        );
        break;
      default:
        body = <PartnerResourcesHub hub={partnerHub} />;
    }

    return (
      <>
        <Toaster position="top-right" />
        {showPreviewBanner && <PreviewBanner />}
        <PartnerHubPage hub={partnerHub}>{body}</PartnerHubPage>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#333',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
          success: {
            iconTheme: {
              primary: '#0D9488',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#DC2626',
              secondary: '#fff',
            },
          },
        }}
      />
      {showPreviewBanner && <PreviewBanner />}
      <Header />
      <main className={`flex-1 pb-20 ${showPreviewBanner ? 'pt-[calc(3.5rem+var(--preview-banner-height,0px))] sm:pt-[calc(4rem+var(--preview-banner-height,0px))]' : 'pt-14 sm:pt-16'}`}>
        <Dashboard />
      </main>
      <Footer />
      <HelpGuide
        isOpen={showHelpGuide}
        onClose={() => setShowHelpGuide(false)}
        initialSection={helpGuideSection}
      />
      <PrototypeWelcomeModal
        isOpen={showPrototypeWelcome}
        onClose={dismissPrototypeWelcome}
        onOpenContactUs={() => {
          try {
            window.dispatchEvent(new CustomEvent('ccd:open-contact-us'));
          } catch {
            /* ignore */
          }
        }}
        onOpenPartnerHubs={() => {
          try {
            window.dispatchEvent(new CustomEvent('ccd:open-our-partners'));
          } catch {
            /* ignore */
          }
        }}
      />
      <TabsExplainerModal
        isOpen={showTabsExplainer && !showPrototypeWelcome}
        onClose={dismissTabsExplainer}
        onOpenTab={openDashboardTab}
      />
    </div>
  );
}

function App() {
  if (typeof window !== 'undefined' && window.location.pathname === '/reset-password') {
    return (
      <ErrorBoundary>
        <ResetPasswordPage />
      </ErrorBoundary>
    );
  }

  const partnerHub =
    typeof window !== 'undefined' ? getPartnerHubForPath(window.location.pathname) : null;

  // Detect a school-specific public homepage at `/<slug>`. Skip when the path
  // is a partner hub (`/roh`, …) so those routes are not treated as schools.
  const schoolHomepage =
    typeof window !== 'undefined' && !partnerHub && !isForumPath(window.location.pathname)
      ? getSchoolForPath(window.location.pathname)
      : null;

  return (
    <ErrorBoundary>
      <AuthProvider>
        <SettingsProviderNew>
          <DataProvider>
            <PaidBasketProvider>
              <DndRoot>
                <ForcePasswordChangeGate>
                  <AppContent schoolHomepage={schoolHomepage} />
                </ForcePasswordChangeGate>
              </DndRoot>
            </PaidBasketProvider>
          </DataProvider>
        </SettingsProviderNew>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
