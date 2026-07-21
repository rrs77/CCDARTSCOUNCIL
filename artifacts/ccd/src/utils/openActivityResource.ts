/**
 * Open activity / lesson resource URLs in a new browser tab.
 * Prefer this over in-app ResourceViewer for external packs (LSO, Hachette, etc.)
 * so teachers are not trapped without a clear escape path.
 */
export function openActivityResource(url: string): void {
  const trimmed = (url || '').trim();
  if (!trimmed) return;

  const newWindow = window.open(trimmed, '_blank', 'noopener,noreferrer');

  // Fallback if popup blocked
  if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
    const link = document.createElement('a');
    link.href = trimmed;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
  }
}

/**
 * Prefer a new browser tab for activity/lesson media.
 * Canva may still use ResourceViewer when the caller opts in via `preferEmbed`.
 */
export function shouldOpenResourceInNewTab(url: string, type?: string, preferEmbed = false): boolean {
  if (!url?.trim()) return false;
  if (preferEmbed && (type === 'canva' || url.toLowerCase().includes('canva.com'))) return false;
  return true;
}
