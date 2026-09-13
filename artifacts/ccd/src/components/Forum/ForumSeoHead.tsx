import { useEffect } from 'react';
import type { ForumRoute } from './ForumApp';

/**
 * Lightweight SEO helpers for SPA forum routes.
 * Private / hub / draft content must stay noindex.
 */
export function ForumSeoHead({
  route,
  title,
  description,
  robots = 'index,follow',
}: {
  route: ForumRoute;
  title?: string;
  description?: string;
  robots?: string;
}) {
  useEffect(() => {
    const prevTitle = document.title;
    const pageTitle = title
      ? `${title} · CCDesigner Forum`
      : route.name === 'guidelines'
        ? 'Community guidelines · CCDesigner Forum'
        : route.name === 'admin'
          ? 'Forum admin · CCDesigner'
          : 'Community Forum · CCDesigner';
    document.title = pageTitle;

    const ensureMeta = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      let el = document.head.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    const forceNoIndex =
      route.name === 'admin' ||
      robots.includes('noindex') ||
      route.name === 'new';

    ensureMeta('robots', forceNoIndex ? 'noindex,nofollow' : robots);
    ensureMeta('description', description || 'CCDesigner community forum for arts educators.');
    ensureMeta('og:title', pageTitle, 'property');

    let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!forceNoIndex) {
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = `${window.location.origin}${window.location.pathname}`;
    } else if (canonical) {
      canonical.remove();
    }

    return () => {
      document.title = prevTitle;
    };
  }, [route, title, description, robots]);

  return null;
}
