/**
 * URL-safe slug helper shared across SEO routes (/like, /compare, /watch-order…).
 *
 * Rules:
 *  - lowercase
 *  - strip diacritics, then drop non-alphanumeric except whitespace/dash
 *  - collapse whitespace to single dash
 *  - trim leading/trailing dashes
 */

export function slugify(input) {
  if (!input) return '';
  return String(input)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
