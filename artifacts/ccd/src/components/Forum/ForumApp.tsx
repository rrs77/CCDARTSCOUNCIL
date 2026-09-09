import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare, ArrowLeft, Search, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { SignInRequiredModal } from '../Auth/SignInRequiredModal';
import { ForumHome } from './ForumHome';
import { ForumCategoryPage } from './ForumCategoryPage';
import { ForumTopicPage } from './ForumTopicPage';
import { ForumAdminPage } from './ForumAdminPage';
import { ForumGuidelines } from './ForumGuidelines';
import { ForumSeoHead } from './ForumSeoHead';

export type ForumRoute =
  | { name: 'home' }
  | { name: 'search'; q: string }
  | { name: 'guidelines' }
  | { name: 'admin' }
  | { name: 'category'; slug: string }
  | { name: 'topic'; id: string }
  | { name: 'new'; category?: string };

function parseForumPath(pathname: string, search: string): ForumRoute {
  const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  // ['forum', ...]
  if (parts[0] !== 'forum') return { name: 'home' };
  if (parts.length === 1) {
    const q = new URLSearchParams(search).get('q');
    if (q) return { name: 'search', q };
    return { name: 'home' };
  }
  if (parts[1] === 'guidelines') return { name: 'guidelines' };
  if (parts[1] === 'admin') return { name: 'admin' };
  if (parts[1] === 'new') {
    return { name: 'new', category: new URLSearchParams(search).get('category') || undefined };
  }
  if (parts[1] === 'c' && parts[2]) return { name: 'category', slug: parts[2] };
  if (parts[1] === 't' && parts[2]) return { name: 'topic', id: parts[2] };
  if (parts[1] === 'search') {
    return { name: 'search', q: new URLSearchParams(search).get('q') || '' };
  }
  return { name: 'home' };
}

export function navigateForum(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/**
 * Community forum shell. Public browse works signed-out; contribute prompts sign-in.
 */
export function ForumApp({ embedded = false }: { embedded?: boolean }) {
  const { user } = useAuth();
  const [route, setRoute] = useState<ForumRoute>(() =>
    typeof window !== 'undefined'
      ? parseForumPath(window.location.pathname, window.location.search)
      : { name: 'home' },
  );
  const [signInOpen, setSignInOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  useEffect(() => {
    const onPop = () => {
      setRoute(parseForumPath(window.location.pathname, window.location.search));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const requireSignIn = (returnPath?: string) => {
    if (user) return false;
    if (returnPath) {
      try {
        sessionStorage.setItem('ccd_forum_return', returnPath);
      } catch {
        /* ignore */
      }
    }
    setSignInOpen(true);
    return true;
  };

  const returnUrl = useMemo(() => {
    if (typeof window === 'undefined') return '/forum';
    return `${window.location.pathname}${window.location.search}`;
  }, [route]);

  const chrome = (
    <div className={embedded ? '' : 'min-h-screen bg-[#f4f7f6]'}>
      <ForumSeoHead route={route} />
      <header className="border-b border-[#d5e0dc] bg-[#002D24] text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            {!embedded && (
              <a
                href="/"
                className="inline-flex items-center gap-1 text-sm text-teal-100 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                CCDesigner
              </a>
            )}
            <button
              type="button"
              onClick={() => navigateForum('/forum')}
              className="flex items-center gap-2 font-semibold tracking-tight"
            >
              <MessageSquare className="h-5 w-5 text-teal-200" />
              Community Forum
            </button>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2 sm:max-w-md">
            <form
              className="flex flex-1 items-center gap-1"
              onSubmit={(e) => {
                e.preventDefault();
                navigateForum(`/forum/search?q=${encodeURIComponent(searchQ.trim())}`);
              }}
            >
              <label className="sr-only" htmlFor="forum-search">
                Search forum
              </label>
              <input
                id="forum-search"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search topics…"
                className="w-full rounded-lg border-0 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-teal-100/70 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-teal-300"
              />
              <button
                type="submit"
                className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium hover:bg-teal-500"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>
            <button
              type="button"
              onClick={() => navigateForum('/forum/guidelines')}
              className="hidden rounded-lg px-2 py-2 text-sm text-teal-100 hover:bg-white/10 sm:inline"
            >
              Guidelines
            </button>
            {user && (
              <button
                type="button"
                onClick={() => navigateForum('/forum/admin')}
                className="rounded-lg p-2 text-teal-100 hover:bg-white/10"
                title="Forum admin"
                aria-label="Forum admin"
              >
                <Shield className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {route.name === 'home' && (
          <ForumHome requireSignIn={requireSignIn} navigate={navigateForum} />
        )}
        {route.name === 'search' && (
          <ForumHome
            requireSignIn={requireSignIn}
            navigate={navigateForum}
            searchQuery={route.q}
          />
        )}
        {route.name === 'category' && (
          <ForumCategoryPage
            slug={route.slug}
            requireSignIn={requireSignIn}
            navigate={navigateForum}
          />
        )}
        {route.name === 'topic' && (
          <ForumTopicPage
            topicId={route.id}
            requireSignIn={requireSignIn}
            navigate={navigateForum}
          />
        )}
        {route.name === 'new' && (
          <ForumCategoryPage
            slug={route.category || ''}
            requireSignIn={requireSignIn}
            navigate={navigateForum}
            compose
          />
        )}
        {route.name === 'guidelines' && <ForumGuidelines />}
        {route.name === 'admin' && (
          <ForumAdminPage requireSignIn={requireSignIn} navigate={navigateForum} />
        )}
      </main>

      <SignInRequiredModal
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
        returnUrl={returnUrl}
        message="Sign in with your CCDesigner account to post, reply, or react. You’ll return here afterwards."
      />
    </div>
  );

  return chrome;
}

/** True when pathname is under /forum */
export function isForumPath(pathname: string): boolean {
  return pathname === '/forum' || pathname.startsWith('/forum/');
}
