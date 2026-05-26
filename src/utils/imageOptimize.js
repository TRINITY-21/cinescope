/**
 * wsrv.nl image proxy/optimizer — free, no key, unlimited.
 *
 * Wraps any image URL so it can be resized, compressed, format-converted,
 * or blurred at the edge. Useful for:
 *   - Mobile bandwidth (smaller images)
 *   - WebP / AVIF for browsers that support it
 *   - Blurred poster backgrounds without a second download
 *
 * Docs: https://wsrv.nl/docs/
 *
 * Usage:
 *   optimize(url, { w: 500, output: 'webp' })
 *   blurred(url, { w: 1080, blur: 30 })
 */

const WSRV = 'https://wsrv.nl/';
const WSRV_BREAKER_KEY = 'bynge-wsrv-failed';

function isOptimizable(url) {
  if (!url) return false;
  if (url.startsWith('data:')) return false;
  if (url.startsWith('blob:')) return false;
  if (url.includes('wsrv.nl')) return false;
  return /^https?:\/\//.test(url);
}

/** Returns true once wsrv.nl has failed at least once this session. */
function wsrvBroken() {
  if (typeof sessionStorage === 'undefined') return false;
  try {
    return sessionStorage.getItem(WSRV_BREAKER_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Call from an <img onError> handler when wsrv.nl fails to load. Trips a
 * session-level breaker so subsequent optimize() calls return the raw URL,
 * preventing site-wide image breakage when wsrv.nl is down or rate-limiting.
 */
export function markWsrvFailed() {
  if (typeof sessionStorage === 'undefined') return;
  try { sessionStorage.setItem(WSRV_BREAKER_KEY, '1'); } catch { /* ignore */ }
}

/** Wraps a URL through wsrv.nl with the given transformation params. */
export function optimize(url, params = {}) {
  if (!isOptimizable(url)) return url;
  if (wsrvBroken()) return url;
  const query = new URLSearchParams({ url });
  for (const [k, v] of Object.entries(params)) {
    if (v != null) query.set(k, String(v));
  }
  return `${WSRV}?${query.toString()}`;
}

/** Heavily blurred thumbnail — useful as a backdrop placeholder. */
export function blurred(url, { w = 1080, blur = 40, brightness = -10 } = {}) {
  return optimize(url, { w, blur, output: 'webp', q: 60, bri: brightness });
}

/** Standard responsive image — webp, quality 80, capped width. */
export function responsive(url, { w = 800 } = {}) {
  return optimize(url, { w, output: 'webp', q: 80, fit: 'inside' });
}

/** Square avatar — center-cropped to a square. */
export function avatar(url, { size = 200 } = {}) {
  return optimize(url, { w: size, h: size, fit: 'cover', a: 'attention', output: 'webp', q: 85 });
}
