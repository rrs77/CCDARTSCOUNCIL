/**
 * Combined CCDesigner API router.
 *
 * Forum, organisation Hub and Music Hub handlers are kept outside /api
 * and routed through this single Vercel Function so the project remains
 * within the Hobby-plan Serverless Function limit.
 */

/* Community Forum */
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

/* Organisation Hubs */
import * as hubs from '../server/api/hubs/index.js';
import * as hubPublic from '../server/api/hubs/public/[slug].js';
import * as hub from '../server/api/hubs/[hubId]/index.js';
import * as hubAnalytics from '../server/api/hubs/[hubId]/analytics.js';
import * as hubAudit from '../server/api/hubs/[hubId]/audit.js';
import * as hubExport from '../server/api/hubs/[hubId]/export.js';
import * as hubMembers from '../server/api/hubs/[hubId]/members.js';
import * as hubResources from '../server/api/hubs/[hubId]/resources/index.js';
import * as hubResource from '../server/api/hubs/[hubId]/resources/[resourceId].js';
import * as hubProducts from '../server/api/hubs/[hubId]/products/index.js';
import * as hubSales from '../server/api/hubs/[hubId]/sales.js';

/* Hub shop (Stripe checkout + catalogue) — routed to stay within Hobby function limit */
import * as shopCheckout from '../server/api/shop/checkout.js';
import * as shopWebhook from '../server/api/shop/webhook.js';
import * as shopProducts from '../server/api/shop/products.js';
import * as shopMine from '../server/api/shop/mine.js';
import * as shopAdminCustomers from '../server/api/shop/admin-customers.js';

/* Music Hub subscriber/admin routes */
import * as musicHubPassword from '../server/api/music-hubs/admin/password.js';
import * as musicHubResource from '../server/api/music-hubs/resource.js';
import * as musicHubUnlock from '../server/api/music-hubs/unlock.js';

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...headers,
    },
  });
}

function targetFor(pathname) {
  const parts = pathname
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean);

  if (parts[0] !== 'api') return null;

  const area = parts[1];
  const rest = parts.slice(2);

  /* ---------- Forum ---------- */

  if (area === 'forum') {
    if (rest[0] === 'categories') {
      if (rest.length === 1) return forumCategories;
      if (rest.length === 2) return forumCategory;
    }

    if (rest.length === 1 && rest[0] === 'me') {
      return forumMe;
    }

    if (rest.length === 1 && rest[0] === 'moderation') {
      return forumModeration;
    }

    if (rest.length === 1 && rest[0] === 'reports') {
      return forumReports;
    }

    if (rest[0] === 'topics') {
      if (rest.length === 1) return forumTopics;
      if (rest.length === 2) return forumTopic;

      if (
        rest.length === 3 &&
        rest[2] === 'posts'
      ) {
        return forumTopicPosts;
      }
    }

    if (rest[0] === 'posts') {
      if (rest.length === 2) return forumPost;

      if (
        rest.length === 3 &&
        rest[2] === 'react'
      ) {
        return forumPostReact;
      }
    }

    return null;
  }

  /* ---------- Organisation Hubs ---------- */

  if (area === 'hubs') {
    if (rest.length === 0) return hubs;

    if (
      rest.length === 2 &&
      rest[0] === 'public'
    ) {
      return hubPublic;
    }

    if (rest.length === 1) {
      return hub;
    }

    if (rest.length === 2) {
      if (rest[1] === 'analytics') return hubAnalytics;
      if (rest[1] === 'audit') return hubAudit;
      if (rest[1] === 'export') return hubExport;
      if (rest[1] === 'members') return hubMembers;
      if (rest[1] === 'resources') return hubResources;
      if (rest[1] === 'products') return hubProducts;
      if (rest[1] === 'sales') return hubSales;
    }

    if (
      rest.length === 3 &&
      rest[1] === 'resources'
    ) {
      return hubResource;
    }

    if (
      rest.length === 3 &&
      rest[1] === 'products'
    ) {
      return hubProducts;
    }

    return null;
  }

  /* ---------- Shop (Stripe + catalogue) ---------- */

  if (area === 'shop') {
    if (rest.length === 1 && rest[0] === 'checkout') return shopCheckout;
    if (rest.length === 1 && rest[0] === 'webhook') return shopWebhook;
    if (rest.length === 1 && rest[0] === 'products') return shopProducts;
    if (rest.length === 1 && rest[0] === 'mine') return shopMine;
    if (
      rest.length === 2 &&
      rest[0] === 'admin' &&
      rest[1] === 'customers'
    ) {
      return shopAdminCustomers;
    }
    return null;
  }

  /* ---------- Music Hubs ---------- */

  if (area === 'music-hubs') {
    if (
      rest.length === 2 &&
      rest[0] === 'admin' &&
      rest[1] === 'password'
    ) {
      return musicHubPassword;
    }

    if (
      rest.length === 1 &&
      rest[0] === 'resource'
    ) {
      return musicHubResource;
    }

    if (
      rest.length === 1 &&
      rest[0] === 'unlock'
    ) {
      return musicHubUnlock;
    }

    return null;
  }

  return null;
}

async function rebuildOriginalRequest(request) {
  const incomingUrl = new URL(request.url);

  let route = incomingUrl.searchParams.get('__route');

  if (!route) return null;

  route = route.replace(/^\/+|\/+$/g, '');

  if (
    !/^(forum|hubs|music-hubs|shop)(\/|$)/.test(route) ||
    route.includes('..')
  ) {
    return null;
  }

  incomingUrl.pathname = `/api/${route}`;
  incomingUrl.searchParams.delete('__route');

  const init = {
    method: request.method,
    headers: new Headers(request.headers),
    signal: request.signal,
  };

  const method = request.method.toUpperCase();

  if (!['GET', 'HEAD'].includes(method)) {
    const body = await request.arrayBuffer();

    if (body.byteLength) {
      init.body = body;
    }
  }

  return new Request(incomingUrl.toString(), init);
}

async function dispatch(request) {
  try {
    const originalRequest =
      await rebuildOriginalRequest(request);

    if (!originalRequest) {
      return json(
        { error: 'API route not found.' },
        404,
      );
    }

    const pathname =
      new URL(originalRequest.url).pathname;

    const target = targetFor(pathname);

    if (!target) {
      return json(
        { error: 'API route not found.' },
        404,
      );
    }

    const method =
      request.method.toUpperCase();

    const handler = target[method];

    if (typeof handler !== 'function') {
      const allowed = [
        'GET',
        'POST',
        'PUT',
        'PATCH',
        'DELETE',
        'OPTIONS',
      ].filter(
        (candidate) =>
          typeof target[candidate] === 'function',
      );

      return json(
        { error: 'Method not allowed.' },
        405,
        {
          Allow: allowed.join(', '),
        },
      );
    }

    /*
     * Hub handlers accept an optional context object.
     * Their own URL parsing remains the fallback, so an
     * empty context is safe here.
     */
    return handler(originalRequest, {});
  } catch (error) {
    console.error(
      'Combined API router error:',
      error,
    );

    return json(
      { error: 'Internal server error.' },
      500,
    );
  }
}

export async function GET(request) {
  return dispatch(request);
}

export async function POST(request) {
  return dispatch(request);
}

export async function PUT(request) {
  return dispatch(request);
}

export async function PATCH(request) {
  return dispatch(request);
}

export async function DELETE(request) {
  return dispatch(request);
}

export async function OPTIONS(request) {
  return dispatch(request);
}
