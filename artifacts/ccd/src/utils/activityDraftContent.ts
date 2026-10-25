/**
 * Whether a create-activity form has enough content to persist as a draft.
 * Opening Create activity must not autosave an empty / untitled draft.
 */

function plainText(html: string): string {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function activityDraftHasContent(form: {
  activity?: string | null;
  description?: string | null;
  activityText?: string | null;
}): boolean {
  if ((form.activity || '').trim()) return true;
  if (plainText(form.description || '')) return true;
  if (plainText(form.activityText || '')) return true;
  return false;
}

export function activityDraftStorageKey(
  mode: 'create' | 'edit',
  form: { id?: string; _id?: string },
): string {
  return `ccd-activity-draft-${mode}-${form.id || form._id || 'new'}`;
}
