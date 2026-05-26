import { beforeEach, describe, expect, it } from 'vitest';
import {
  CURRENT_SCHEMA_VERSION,
  TRACKED_KEYS,
  clearUserData,
  exportUserData,
  getStoredSchemaVersion,
  importUserData,
  summarizeUserData,
} from './userData';

function seed(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

describe('exportUserData', () => {
  beforeEach(() => localStorage.clear());

  it('returns a versioned payload tagged for Bynge', () => {
    const result = exportUserData();
    expect(result.app).toBe('bynge');
    expect(result.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(typeof result.exportedAt).toBe('string');
    expect(result.data).toBeTypeOf('object');
  });

  it('captures every tracked key that has a value in localStorage', () => {
    seed('cinescope-watchlist', [{ id: 1, name: 'Show A' }]);
    seed('cinescope-movie-watchlist', [{ id: 99, title: 'Movie A' }]);
    seed('cinescope-stats', { totalEpisodesWatched: 42 });
    const { data } = exportUserData();
    expect(data['cinescope-watchlist']).toEqual([{ id: 1, name: 'Show A' }]);
    expect(data['cinescope-movie-watchlist']).toEqual([{ id: 99, title: 'Movie A' }]);
    expect(data['cinescope-stats']).toEqual({ totalEpisodesWatched: 42 });
  });

  it('skips corrupted JSON without throwing', () => {
    localStorage.setItem('cinescope-watchlist', 'not-json{{');
    seed('cinescope-stats', { totalEpisodesWatched: 5 });
    const { data } = exportUserData();
    expect(data['cinescope-watchlist']).toBeUndefined();
    expect(data['cinescope-stats']).toEqual({ totalEpisodesWatched: 5 });
  });
});

describe('importUserData', () => {
  beforeEach(() => localStorage.clear());

  function makeBackup(overrides = {}) {
    return {
      app: 'bynge',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      exportedAt: '2025-01-01T00:00:00Z',
      data: {
        'cinescope-watchlist': [{ id: 1, name: 'Restored Show' }],
        'cinescope-movie-watchlist': [{ id: 9, title: 'Restored Movie' }],
        'cinescope-stats': { totalEpisodesWatched: 7 },
        ...overrides,
      },
    };
  }

  it('rejects non-Bynge payloads', () => {
    const result = importUserData({ app: 'something-else', schemaVersion: 1, data: {} });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/not a Bynge backup/i);
  });

  it('rejects payloads missing schemaVersion', () => {
    const result = importUserData({ app: 'bynge', data: {} });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/schemaVersion/);
  });

  it('rejects null / non-object input', () => {
    expect(importUserData(null).ok).toBe(false);
    expect(importUserData('string').ok).toBe(false);
    expect(importUserData(42).ok).toBe(false);
  });

  it('rejects payloads from a newer schema than the app supports', () => {
    const result = importUserData({
      app: 'bynge',
      schemaVersion: CURRENT_SCHEMA_VERSION + 5,
      data: {},
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/newer/i);
  });

  it('restores keys in replace mode and reports which keys were restored', () => {
    const result = importUserData(makeBackup(), { mode: 'replace' });
    expect(result.ok).toBe(true);
    expect(result.restoredKeys).toContain('cinescope-watchlist');
    expect(JSON.parse(localStorage.getItem('cinescope-watchlist')))
      .toEqual([{ id: 1, name: 'Restored Show' }]);
  });

  it('replace mode clears keys that are absent from the backup', () => {
    seed('cinescope-watchlist', [{ id: 999, name: 'Existing' }]);
    // Backup payload has no watchlist
    importUserData({
      app: 'bynge',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      data: { 'cinescope-stats': { totalEpisodesWatched: 1 } },
    }, { mode: 'replace' });
    expect(localStorage.getItem('cinescope-watchlist')).toBeNull();
  });

  it('merge mode unions arrays by id without duplicates', () => {
    seed('cinescope-watchlist', [{ id: 1, name: 'Existing' }, { id: 2, name: 'Also Existing' }]);
    const backup = makeBackup({
      'cinescope-watchlist': [{ id: 2, name: 'Duplicate' }, { id: 3, name: 'New' }],
    });
    importUserData(backup, { mode: 'merge' });
    const merged = JSON.parse(localStorage.getItem('cinescope-watchlist'));
    const ids = merged.map((x) => x.id).sort();
    expect(ids).toEqual([1, 2, 3]);
  });

  it('merge mode shallow-merges plain objects', () => {
    seed('cinescope-stats', { totalEpisodesWatched: 10, firstTracked: '2020-01-01' });
    importUserData(makeBackup({
      'cinescope-stats': { totalEpisodesWatched: 50, totalMinutesWatched: 2000 },
    }), { mode: 'merge' });
    const stats = JSON.parse(localStorage.getItem('cinescope-stats'));
    expect(stats).toEqual({
      totalEpisodesWatched: 50,        // incoming wins on overlap
      firstTracked: '2020-01-01',       // existing preserved when not in backup
      totalMinutesWatched: 2000,        // new field added
    });
  });

  it('records the schema version after a successful import', () => {
    importUserData(makeBackup());
    expect(getStoredSchemaVersion()).toBe(CURRENT_SCHEMA_VERSION);
  });
});

describe('clearUserData', () => {
  it('removes every tracked key', () => {
    for (const key of TRACKED_KEYS) seed(key, { x: 1 });
    clearUserData();
    for (const key of TRACKED_KEYS) {
      expect(localStorage.getItem(key)).toBeNull();
    }
  });
});

describe('summarizeUserData', () => {
  beforeEach(() => localStorage.clear());

  it('returns zero counts when nothing is stored', () => {
    expect(summarizeUserData()).toEqual({
      shows: 0,
      movies: 0,
      episodes: 0,
      collections: 0,
      ratings: 0,
      historyEntries: 0,
    });
  });

  it('counts items across the relevant keys', () => {
    seed('cinescope-watchlist', [{ id: 1 }, { id: 2 }, { id: 3 }]);
    seed('cinescope-movie-watchlist', [{ id: 10 }, { id: 11 }]);
    seed('cinescope-watched', { 1: [101, 102], 2: [201] });
    seed('cinescope-collections', [{ id: 'favorites', shows: [] }]);
    seed('bynge-user-ratings', { 'show-1': 4.5, 'movie-10': 3 });
    seed('cinescope-watch-history', [{ date: '2025-01-01' }, { date: '2025-01-02' }]);

    expect(summarizeUserData()).toEqual({
      shows: 3,
      movies: 2,
      episodes: 3,
      collections: 1,
      ratings: 2,
      historyEntries: 2,
    });
  });
});
