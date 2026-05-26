import { describe, expect, it } from 'vitest';
import { STREAM_SERVERS, buildStreamEmbedUrl, formatImdbId } from './streamEmbed';

describe('formatImdbId', () => {
  it('returns null for falsy inputs', () => {
    expect(formatImdbId(null)).toBeNull();
    expect(formatImdbId(undefined)).toBeNull();
    expect(formatImdbId('')).toBeNull();
    expect(formatImdbId(0)).toBeNull();
  });

  it('passes through already-prefixed tt ids untouched', () => {
    expect(formatImdbId('tt0111161')).toBe('tt0111161');
  });

  it('adds the tt prefix to bare numeric ids', () => {
    expect(formatImdbId('0111161')).toBe('tt0111161');
    expect(formatImdbId(111161)).toBe('tt111161');
  });

  it('returns non-numeric / non-tt strings unchanged', () => {
    expect(formatImdbId('weird-id')).toBe('weird-id');
  });

  it('trims surrounding whitespace before checking', () => {
    expect(formatImdbId('  tt1234567  ')).toBe('tt1234567');
  });
});

describe('STREAM_SERVERS', () => {
  it('exposes both Server 1 and Server 2 with stable ids', () => {
    const ids = STREAM_SERVERS.map((s) => s.id);
    expect(ids).toContain('vsembed');
    expect(ids).toContain('superembed');
    // Labels must be neutral (no provider names exposed in UI)
    const labels = STREAM_SERVERS.map((s) => s.label);
    expect(labels).toEqual(['Server 1', 'Server 2']);
  });
});

describe('buildStreamEmbedUrl', () => {
  it('returns null when videoId is missing', () => {
    expect(buildStreamEmbedUrl({ videoId: null })).toBeNull();
    expect(buildStreamEmbedUrl({ videoId: '' })).toBeNull();
  });

  it('builds a movie embed URL for vsembed using an IMDb id', () => {
    const url = buildStreamEmbedUrl({ server: 'vsembed', videoId: 'tt0111161' });
    expect(url).toBe('https://vsembed.ru/embed/movie/tt0111161');
  });

  it('builds a TV embed URL for vsembed when season/episode given', () => {
    const url = buildStreamEmbedUrl({ server: 'vsembed', videoId: 'tt0903747', season: 2, episode: 7 });
    expect(url).toBe('https://vsembed.ru/embed/tv/tt0903747/2/7');
  });

  it('normalizes bare numeric imdb ids to the tt-prefixed form', () => {
    const url = buildStreamEmbedUrl({ server: 'vsembed', videoId: '0111161' });
    expect(url).toContain('tt0111161');
  });

  it('passes through a numeric TMDB id when useTmdb is set', () => {
    const url = buildStreamEmbedUrl({ server: 'vsembed', videoId: 12345, useTmdb: true });
    expect(url).toContain('/movie/12345');
  });

  it('builds a superembed URL with the right query params', () => {
    const url = buildStreamEmbedUrl({ server: 'superembed', videoId: 'tt0111161' });
    expect(url).toContain('multiembed.mov');
    expect(url).toContain('video_id=tt0111161');
  });

  it('passes tmdb=1 to superembed when useTmdb is true', () => {
    const url = buildStreamEmbedUrl({ server: 'superembed', videoId: 999, useTmdb: true });
    expect(url).toContain('tmdb=1');
    expect(url).toContain('video_id=999');
  });

  it('includes s/e params on superembed for TV episodes', () => {
    const url = buildStreamEmbedUrl({ server: 'superembed', videoId: 'tt0903747', season: 1, episode: 1 });
    expect(url).toContain('s=1');
    expect(url).toContain('e=1');
  });

  it('falls back to vsembed when an unknown server id is passed', () => {
    const url = buildStreamEmbedUrl({ server: 'made-up', videoId: 'tt0111161' });
    expect(url).toContain('vsembed.ru');
  });
});
