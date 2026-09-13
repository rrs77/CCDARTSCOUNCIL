export type ForumScope =
  | 'public'
  | 'members'
  | 'hub'
  | 'announcement'
  | 'role_restricted';

export type ForumCategoryStatus = 'draft' | 'published' | 'archived';

export type ForumCapability =
  | 'forum.read'
  | 'forum.create_topic'
  | 'forum.reply'
  | 'forum.react'
  | 'forum.report'
  | 'forum.moderate'
  | 'forum.manage_categories'
  | 'forum.manage_settings'
  | 'forum.view_private_categories';

export interface ForumAuthor {
  id: string | null;
  display_name: string;
  role?: string | null;
}

export interface ForumCategory {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  sort_order: number;
  status: ForumCategoryStatus;
  scope: ForumScope;
  hub_id?: string | null;
  allowed_roles?: string[] | null;
  is_locked: boolean;
  topic_count: number;
  post_count: number;
  last_activity_at?: string | null;
}

export interface ForumTopicListItem {
  id: string;
  title: string;
  slug: string;
  category_id: string;
  category_slug?: string;
  category_title?: string;
  is_pinned: boolean;
  is_locked: boolean;
  is_announcement?: boolean;
  reply_count: number;
  view_count: number;
  last_reply_at?: string | null;
  created_at: string;
  author: ForumAuthor;
  indexable?: boolean;
  excerpt?: string;
}

export interface ForumPost {
  id: string;
  topic_id: string;
  author_id: string;
  body_md: string;
  body_html: string;
  is_hidden: boolean;
  is_topic_starter: boolean;
  reaction_count: number;
  created_at: string;
  updated_at: string;
  author: ForumAuthor;
}

export interface ForumReport {
  id: string;
  reason: string;
  details?: string | null;
  status: string;
  is_safeguarding: boolean;
  topic_id?: string | null;
  post_id?: string | null;
  created_at: string;
}
