/**
 * Client helpers for community forum APIs.
 */

import { supabase } from '../config/supabase';
import { getVercelApiUrl } from './apiUrl';
import type {
  ForumCategory,
  ForumPost,
  ForumReport,
  ForumTopicListItem,
} from '../types/forum';

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(getVercelApiUrl(path), {
    ...init,
    headers: {
      ...(await authHeaders()),
      ...(init?.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json as { error?: string }).error || `Request failed (${res.status})`);
  }
  return json as T;
}

export function listCategories(params?: { include_drafts?: boolean; hub_id?: string }) {
  const qs = new URLSearchParams();
  if (params?.include_drafts) qs.set('include_drafts', '1');
  if (params?.hub_id) qs.set('hub_id', params.hub_id);
  const q = qs.toString();
  return apiFetch<{ categories: ForumCategory[]; caps: string[]; anonymous: boolean }>(
    `/api/forum/categories${q ? `?${q}` : ''}`,
  );
}

export function getCategory(idOrSlug: string) {
  return apiFetch<{ category: ForumCategory; caps: string[] }>(
    `/api/forum/categories/${encodeURIComponent(idOrSlug)}`,
  );
}

export function createCategory(body: Partial<ForumCategory> & { title: string }) {
  return apiFetch<{ category: ForumCategory }>('/api/forum/categories', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updateCategory(id: string, body: Partial<ForumCategory>) {
  return apiFetch<{ category: ForumCategory }>(`/api/forum/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function listTopics(params: {
  category?: string;
  category_id?: string;
  q?: string;
  sort?: string;
  filter?: string;
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params.category) qs.set('category', params.category);
  if (params.category_id) qs.set('category_id', params.category_id);
  if (params.q) qs.set('q', params.q);
  if (params.sort) qs.set('sort', params.sort);
  if (params.filter) qs.set('filter', params.filter);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  return apiFetch<{
    topics: ForumTopicListItem[];
    page: number;
    limit: number;
    total: number;
    caps: string[];
    anonymous: boolean;
  }>(`/api/forum/topics?${qs.toString()}`);
}

export function createTopic(body: { category_id: string; title: string; body_md: string }) {
  return apiFetch<{ topic: { id: string; slug: string }; post: ForumPost }>(
    '/api/forum/topics',
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export function getTopic(topicId: string, page = 1) {
  return apiFetch<{
    topic: ForumTopicListItem & {
      body_html: string;
      body_md: string;
      category: ForumCategory;
      subscribed: boolean;
      indexable: boolean;
    };
    posts: ForumPost[];
    page: number;
    total: number;
    caps: string[];
    anonymous: boolean;
    robots: string;
  }>(`/api/forum/topics/${topicId}?page=${page}`);
}

export function updateTopic(topicId: string, body: Record<string, unknown>) {
  return apiFetch(`/api/forum/topics/${topicId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function replyToTopic(topicId: string, body_md: string) {
  return apiFetch<{ post: ForumPost }>(`/api/forum/topics/${topicId}/posts`, {
    method: 'POST',
    body: JSON.stringify({ body_md }),
  });
}

export function reactToPost(postId: string, reaction = 'like') {
  return apiFetch<{ reacted: boolean }>(`/api/forum/posts/${postId}/react`, {
    method: 'POST',
    body: JSON.stringify({ reaction }),
  });
}

export function updatePost(postId: string, body: Record<string, unknown>) {
  return apiFetch(`/api/forum/posts/${postId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function submitReport(body: {
  topic_id?: string;
  post_id?: string;
  reason: string;
  details?: string;
}) {
  return apiFetch<{ report: ForumReport; message: string }>('/api/forum/reports', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function listReports(params?: { status?: string; safeguarding?: boolean }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.safeguarding) qs.set('safeguarding', '1');
  return apiFetch<{ reports: ForumReport[] }>(`/api/forum/reports?${qs.toString()}`);
}

export function updateReport(body: {
  id: string;
  status: string;
  resolution_note?: string;
}) {
  return apiFetch('/api/forum/reports', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function getForumMe() {
  return apiFetch<{
    caps: string[];
    prefs: Record<string, boolean>;
    display_name: string;
    forum_status: unknown;
  }>('/api/forum/me');
}

export function updateForumPrefs(prefs: Record<string, boolean>) {
  return apiFetch('/api/forum/me', { method: 'PATCH', body: JSON.stringify(prefs) });
}

export function forumSubscribe(topicId: string) {
  return apiFetch('/api/forum/me', {
    method: 'POST',
    body: JSON.stringify({ action: 'subscribe', topic_id: topicId }),
  });
}

export function forumUnsubscribe(topicId: string) {
  return apiFetch('/api/forum/me', {
    method: 'POST',
    body: JSON.stringify({ action: 'unsubscribe', topic_id: topicId }),
  });
}

export function moderationAction(body: Record<string, unknown>) {
  return apiFetch('/api/forum/moderation', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function listModerationActions() {
  return apiFetch<{ actions: unknown[] }>('/api/forum/moderation');
}
