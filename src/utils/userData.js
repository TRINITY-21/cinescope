/**
 * User data export / import — covers every localStorage key the app writes.
 *
 * The backup file is a single JSON object versioned by `schemaVersion`.
 * When we change a key's shape, bump CURRENT_SCHEMA_VERSION and add a
 * migration step to `migrate()` below. That way old backups still restore.
 *
 * Schema v1 keys (current state of the app):
 *   - cinescope-watchlist            Show[]
 *   - cinescope-recent               Show[]                              (capped at 20)
 *   - cinescope-watched              Record<showId, episodeId[]>
 *   - cinescope-collections          Collection[]
 *   - cinescope-movie-watchlist      Movie[]
 *   - bynge-item-status              Record<`${kind}-${id}`, statusKey>
 *   - bynge-user-ratings             Record<`${kind}-${id}`, number>
 *   - cinescope-watch-history        { date, showId, episodeId }[]
 *   - cinescope-stats                { totalEpisodesWatched, totalMinutesWatched, genresWatched, firstTracked }
 */

export const CURRENT_SCHEMA_VERSION = 1;

export const TRACKED_KEYS = [
  'cinescope-watchlist',
  'cinescope-recent',
  'cinescope-watched',
  'cinescope-collections',
  'cinescope-movie-watchlist',
  'bynge-item-status',
  'bynge-user-ratings',
  'cinescope-watch-history',
  'cinescope-stats',
];

const SCHEMA_VERSION_KEY = 'bynge-schema-version';

/** Read schema version from storage. Defaults to 1 (everything before this
 *  feature shipped was implicitly v1). */
export function getStoredSchemaVersion() {
  try {
    const raw = localStorage.getItem(SCHEMA_VERSION_KEY);
    return raw ? Number(raw) || 1 : 1;
  } catch {
    return 1;
  }
}

export function setStoredSchemaVersion(v) {
  try {
    localStorage.setItem(SCHEMA_VERSION_KEY, String(v));
  } catch { /* private mode etc. — non-fatal */ }
}

/** Collect every tracked key into a single backup object. */
export function exportUserData() {
  const data = {};
  for (const key of TRACKED_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) data[key] = JSON.parse(raw);
    } catch {
      // Corrupted JSON — skip silently rather than blow up the backup.
    }
  }

  return {
    app: 'bynge',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
}

/** Trigger a browser download of the backup as a .json file. */
export function downloadUserData() {
  const payload = exportUserData();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bynge-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return payload;
}

/** Run forward-only migrations on a backup payload. Each step takes the
 *  data block and returns the upgraded version. Add steps as the schema
 *  evolves. */
function migrate(payload) {
  let { schemaVersion, data } = payload;
  // Future migrations land here, e.g.:
  // if (schemaVersion < 2) { data = migrateTo_v2(data); schemaVersion = 2; }
  return { ...payload, schemaVersion, data };
}

/**
 * Validate + apply a backup. Returns `{ ok, restoredKeys, error }`.
 * Does NOT reload the page — call site decides whether to do that.
 */
export function importUserData(rawPayload, { mode = 'replace' } = {}) {
  if (!rawPayload || typeof rawPayload !== 'object') {
    return { ok: false, error: 'Backup file is empty or malformed' };
  }
  if (rawPayload.app !== 'bynge') {
    return { ok: false, error: 'This file is not a Bynge backup' };
  }
  if (typeof rawPayload.schemaVersion !== 'number') {
    return { ok: false, error: 'Backup is missing schemaVersion' };
  }
  if (rawPayload.schemaVersion > CURRENT_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `Backup is from a newer app version (v${rawPayload.schemaVersion}). Update the app and try again.`,
    };
  }

  const upgraded = migrate(rawPayload);
  const data = upgraded.data || {};
  const restoredKeys = [];

  try {
    for (const key of TRACKED_KEYS) {
      const incoming = data[key];

      if (mode === 'replace') {
        if (incoming == null) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, JSON.stringify(incoming));
          restoredKeys.push(key);
        }
      } else if (mode === 'merge') {
        if (incoming == null) continue;
        // Best-effort merge: arrays union by id, plain objects shallow merge.
        const existingRaw = localStorage.getItem(key);
        const existing = existingRaw ? safeParse(existingRaw) : null;
        const merged = mergeShape(existing, incoming);
        localStorage.setItem(key, JSON.stringify(merged));
        restoredKeys.push(key);
      }
    }
    setStoredSchemaVersion(upgraded.schemaVersion);
    return { ok: true, restoredKeys };
  } catch (err) {
    return { ok: false, error: err?.message || 'Failed to write backup to storage' };
  }
}

function safeParse(raw) {
  try { return JSON.parse(raw); } catch { return null; }
}

function mergeShape(existing, incoming) {
  if (existing == null) return incoming;
  if (Array.isArray(existing) && Array.isArray(incoming)) {
    const seen = new Set(existing.map((x) => x?.id ?? JSON.stringify(x)));
    const merged = [...existing];
    for (const item of incoming) {
      const k = item?.id ?? JSON.stringify(item);
      if (!seen.has(k)) {
        merged.push(item);
        seen.add(k);
      }
    }
    return merged;
  }
  if (typeof existing === 'object' && typeof incoming === 'object') {
    return { ...existing, ...incoming };
  }
  // Scalar / mismatched shapes — incoming wins.
  return incoming;
}

/** Wipe every tracked key. Used by the "Clear all data" option. */
export function clearUserData() {
  for (const key of TRACKED_KEYS) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }
  try { localStorage.removeItem(SCHEMA_VERSION_KEY); } catch { /* ignore */ }
}

/** Lightweight stats about the current backup payload — used in UI to
 *  show "X shows, Y movies, Z episodes" before download. */
export function summarizeUserData() {
  const data = exportUserData().data;
  return {
    shows: (data['cinescope-watchlist'] || []).length,
    movies: (data['cinescope-movie-watchlist'] || []).length,
    episodes: Object.values(data['cinescope-watched'] || {}).reduce(
      (acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0
    ),
    collections: (data['cinescope-collections'] || []).length,
    ratings: Object.keys(data['bynge-user-ratings'] || {}).length,
    historyEntries: (data['cinescope-watch-history'] || []).length,
  };
}
