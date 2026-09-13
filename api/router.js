/**
 * Combined Hub + Community Forum API router.
 *
 * Keeps Hub and Forum endpoints inside one Vercel Function so the
 * project remains within the Hobby plan Serverless Function limit.
 */

import * as forumCategories from '../server/api/forum/categories/index.js';
import * as forumCategory from '../server/api/forum/categories/[categoryId].js';
import * as forumMe from '../server/api/forum/me.js';
import * as forumModeration from '../server/api/forum/moderation.js';
import * as forumReports from '../server/api/forum/reports.js';
import * as forumTopics from '../server/api/forum/topics/index.js';
import * as forumTopic from '../server/api/forum/topics/[topicId].js';
import * as forumTopicPosts from '../server/api/forum/topics/[topicId]/posts.js';
import * as forumPost from '../server/api/forum/posts/[postId]/index.js';
import * as forumPostReact from '../server/api/forum/posts/[postId]/react.js';

import * as hubs from '../server/api/hubs/index.js';
import * as hubPublic from '../server/api/hubs/public/[slug].js';
import * as hub from '../server/api/hubs/[hubId]/index.js';
import * as hubAnalytics from '../server/api/hubs/[hubId]/analytics.js';
import * as hubAudit from '../server/api/hubs/[hubId]/audit.js';
import * as hubExport from '../server/api/hubs/[hubId]/export.js';
import * as hubMembers from '../server/api/hubs/[hubId]/members.js';
import * as hubResources from '../server/api/hubs/[hubId]/resources/index.js';
import * as hubResource from '../server/api/hubs/[hubId]/resources/[resourceId].js';

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...extraHeaders,
    },
  });
}

function moduleForPath(pathname) {
  const parts = pathname
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean);

  if (parts[0] !== 'api') return null;

  const area = parts[1];
  const rest = parts.slice(2);

  if (area === 'forum') {
    if (rest[0] === 'categories') {
      if (rest.length === 1) return forumCategories;
      if (rest.length === 2) return forumCategory;
    }

    if (rest.length === 1 && rest[0] === 'me') return forumMe;
    if (rest.length === 1 && rest[0] === 'moderation') return forumModeration;
    if (rest.length === 1 && rest[0] === 'reports') return forumReports;

    if (rest[0] === 'topics') {
      if (rest.length === 1) return forumTopics;
      if (rest.length === 2) return forumTopic;
      if (rest.length === 3 && rest[2] === 'posts') return forumTopicPosts;
    }

    if (rest[0] === 'posts') {
      if (rest.length === 2) return forumPost;
      if (rest.length === 3 && rest[2] === 'react') return forumPostReact;
    }

    return null;
  }

  if (area === 'hubs') {
    if (rest.length === 0) return hubs;

    if (rest[0] === 'public' && rest.length === 2) {
      return hubPublic;
    }

    if (rest.length === 1) return hub;

    if (rest.length === 2) {
      if (rest[1] === 'analytics') return hubAnalytics;
      if (rest[1] === 'audit') return hubAudit;
      if (rest[1] === 'export') return hubExport;
      if (rest[1] === 'members') return hubMembers;
      if (rest[1] === 'resources') return hubResources;
    }

    if (
      rest.length === 3 &&
      rest[1] === 'resources'
    ) {
      return hubResource;
    }

    return null;
  }

  return null;
}

async function rebuildOriginalRequest(request) {
  const url = new URL(request.url);
  let route = url.searchParams.get('__route');

  if (!route) return null;

  route = route.replace(/^\/+|\/+$/g, '');

  if (
    !/^(forum|hubs)(\/|$)/.test(route) ||
    route.includes('..')
  ) {
    return null;
  }

  url.pathname = `/api/${route}`;
  url.searchParams.delete('__route');

  const init = {
    method: request.method,
    headers: new Headers(request.headers),
    signal: request.signal,
  };

  if (!['GET', 'HEAD'].includes(request.method.toUpperCase())) {
    const body = await request.arrayBuffer();
    if (body.byteLength) {
      init.body = body;
    }
  }

  return new Request(url.toString(), init);
}

async function route(request) {
  try {
    const routedRequest = await rebuildOriginalRequest(request);

    if (!routedRequest) {
      return json({ error: 'API route not found.' }, 404);
    }

    const pathname = new URL(routedRequest.url).pathname;
    const target = moduleForPath(pathname);

    if (!target) {
      return json({ error: 'API route not found.' }, 404);
    }

    const method = request.method.toUpperCase();
    const handler = target[method];

    if (typeof handler !== 'function') {
      const allowed = [
        'GET',
        'POST',
        'PUT',
        'PATCH',
        'DELETE',
        'OPTIONS',
      ].filter((m) => typeof target[m] === 'function');

      return json(
        { error: 'Method not allowed.' },
        405,
        { Allow: allowed.join(', ') },
      );
    }

    return handler(routedRequest, {});
  } catch (error) {
    console.error('Combined API router error:', error);
    return json({ error: 'Internal server error.' }, 500);
  }
}

export async function GET(request) {
  return route(request);
}

export async function POST(request) {
  return route(request);
}

export async function PUT(request) {
  return route(request);
}

export async function PATCH(request) {
  return route(request);
}

export async function DELETE(request) {
  return route(request);
}

export async function OPTIONS(request) {
  return route(request);
}
