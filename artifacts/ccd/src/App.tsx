import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { SettingsProviderNew } from './contexts/SettingsContextNew';
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
import { initializeSupabaseKeepAlive } from './utils/supabaseKeepAlive';
import { isDemoModeActive } from './utils/demoMode';
import './utils/setupKS1Maths'; // Make setupKS1MathsExample available in browser console
import './utils/setupDanceObjectives'; // Make setupDanceObjectives available in browser console
import './utils/setupSecondaryDramaObjectives'; // Make setupSecondaryDramaObjectives available in browser console
import './utils/addForParentsToLKG'; // Make addForParentsToLKG available in browser console
import './utils/addLKGActivitiesToAllYearGroups'; // Make addLKGActivitiesToAllYearGroups available in browser console

function AppContent({ schoolHomepage }: { schoolHomepage: SchoolHomepageConfig | null }) {
  const { user, loading } = useAuth();

  // If an authenticated user lands on a school homepage URL (e.g. came back
  // via a bookmarked `/oakhill`), clean the URL back to `/` so a hard
  // refresh doesn't briefly flash the public homepage before resolving auth.
  useEffect(() => {
    if (
      user &&
      schoolHomepage &&
      typeof window !== 'undefined' &&
      window.location.pathname !== '/'
    ) {
      window.history.replaceState({}, '', '/');
    }
  }, [user, schoolHomepage]);
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [helpGuideSection, setHelpGuideSection] = useState<
    'activity' | 'lesson' | 'unit' | 'assign' | undefined
  >(undefined);

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
    if (schoolHomepage) {
      return <SchoolHomepage school={schoolHomepage} />;
    }
    return <LoginForm />;
  }

  const handleOpenGuide = (
    section?: 'activity' | 'lesson' | 'unit' | 'assign'
  ) => {
    setHelpGuideSection(section);
    setShowHelpGuide(true);
  };

  const inPreview = isDemoModeActive();

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
      {inPreview && <PreviewBanner />}
      <Header />
      <main className={`flex-1 pb-20 ${inPreview ? 'pt-[calc(3.5rem+var(--preview-banner-height,0px))] sm:pt-[calc(4rem+var(--preview-banner-height,0px))]' : 'pt-14 sm:pt-16'}`}>
        <Dashboard />
      </main>
      <Footer />
      <HelpGuide
        isOpen={showHelpGuide}
        onClose={() => setShowHelpGuide(false)}
        initialSection={helpGuideSection}
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

  // Detect a school-specific public homepage at `/<slug>`. The component is
  // only shown to logged-out visitors so authenticated users always land in
  // the main app regardless of which URL they originally arrived through.
  const schoolHomepage =
    typeof window !== 'undefined'
      ? getSchoolForPath(window.location.pathname)
      : null;

  return (
    <ErrorBoundary>
      <AuthProvider>
        <SettingsProviderNew>
          <DataProvider>
            <DndRoot>
              <AppContent schoolHomepage={schoolHomepage} />
            </DndRoot>
          </DataProvider>
        </SettingsProviderNew>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
