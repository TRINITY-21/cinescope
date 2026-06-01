/**
 * Single source of truth for the "last updated" date on Terms and Privacy.
 * Bump this whenever either document changes — the date renders in the
 * page header and (importantly) in the JSON-LD `dateModified` field, which
 * is what Google trusts to decide whether to re-crawl.
 *
 * Format: YYYY-MM-DD (ISO 8601 date).
 */
export const LEGAL_LAST_UPDATED = '2026-06-02';

/** Human-readable display version. */
export function formatLegalDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' });
}
