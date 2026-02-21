/**
 * Share content using Web Share API with clipboard fallback.
 * @param {{ title: string, text: string, url: string }} params
 * @returns {Promise<'shared'|'copied'|'failed'>}
 */
export async function shareContent({ title, text, url }) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (err) {
      if (err.name === 'AbortError') return 'failed';
    }
  }

  const fallbackText = `${title}\n${text}\n${url}`;
  try {
    await navigator.clipboard.writeText(fallbackText);
    return 'copied';
  } catch {
    return 'failed';
  }
}
