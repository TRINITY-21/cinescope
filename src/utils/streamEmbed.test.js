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
  const removed = [
    'vidsrc',
    'embedsu',
    'vidcore',
    'vidsrcxyz',
    'vidsrcicu',
    'moviesapi',
    'smashy',
    'vidjoy',
    'autoembedcc',
    'vidbinge',
  ];

  it('keeps a solid roster of unique providers', () => {
    expect(STREAM_SERVERS.length).toBeGreaterThanOrEqual(15);
    const ids = STREAM_SERVERS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('does not include the removed broken providers', () => {
    const ids = STREAM_SERVERS.map((s) => s.id);
    for (const id of removed) {
      expect(ids).not.toContain(id);
    }
  });

  it('includes probed replacement providers', () => {
    const ids = STREAM_SERVERS.map((s) => s.id);
    for (const id of ['vidsrcpm', 'vidsrcnl', 'playerx', 'vidsrcembed', 'hydrahd', 'flicky']) {
      expect(ids).toContain(id);
    }
  });

  it('declares which id types each server accepts', () => {
    for (const s of STREAM_SERVERS) {
      expect(Array.isArray(s.accepts)).toBe(true);
      expect(s.accepts.length).toBeGreaterThan(0);
    }
  });
});

describe('buildStreamEmbedUrl', () => {
  it('returns null when neither id is provided', () => {
    expect(buildStreamEmbedUrl({ server: 'vidsrcme' })).toBeNull();
    expect(buildStreamEmbedUrl({ server: 'videasy' })).toBeNull();
  });

  it('VidEasy movie + TV', () => {
    expect(buildStreamEmbedUrl({ server: 'videasy', tmdbId: 1428857 })).toBe(
      'https://player.videasy.net/movie/1428857'
    );
    expect(
      buildStreamEmbedUrl({ server: 'videasy', tmdbId: 1396, season: 3, episode: 7 })
    ).toBe('https://player.videasy.net/tv/1396/3/7');
  });

  it('VidSrc.me IMDB only', () => {
    expect(buildStreamEmbedUrl({ server: 'vidsrcme', imdbId: 'tt0903747', season: 1, episode: 1 })).toBe(
      'https://vidsrcme.ru/embed/tv/tt0903747/1/1'
    );
    expect(buildStreamEmbedUrl({ server: 'vidsrcme', tmdbId: 1396 })).toBeNull();
  });

  it('replacement providers build correct URLs', () => {
    expect(buildStreamEmbedUrl({ server: 'vidsrcpm', tmdbId: 1396, season: 1, episode: 1 })).toBe(
      'https://vidsrc.pm/embed/tv/1396/1/1'
    );
    expect(buildStreamEmbedUrl({ server: 'vidsrcnl', tmdbId: 1396, season: 1, episode: 1 })).toBe(
      'https://vidsrc.nl/embed/tv/1396/1/1'
    );
    expect(buildStreamEmbedUrl({ server: 'playerx', tmdbId: 1396, season: 1, episode: 1 })).toBe(
      'https://playerx.stream/embed/tv/1396/1/1'
    );
    expect(
      buildStreamEmbedUrl({ server: 'vidsrcembed', imdbId: 'tt0903747', season: 1, episode: 1 })
    ).toBe('https://vidsrc-embed.ru/embed/tv/tt0903747/1/1');
    expect(
      buildStreamEmbedUrl({ server: 'vidsrcme2', imdbId: 'tt0903747', season: 1, episode: 1 })
    ).toBe('https://vidsrc.me/embed/tv/tt0903747/1/1');
    expect(
      buildStreamEmbedUrl({ server: 'vidsrcsu', imdbId: 'tt0903747', season: 1, episode: 1 })
    ).toBe('https://vidsrc-embed.su/embed/tv/tt0903747/1/1');
    expect(buildStreamEmbedUrl({ server: 'hydrahd', tmdbId: 1396, season: 1, episode: 1 })).toBe(
      'https://hydrahd.ac/embed/tv/1396/1/1'
    );
    expect(buildStreamEmbedUrl({ server: 'flicky', tmdbId: 1396, season: 1, episode: 1 })).toBe(
      'https://flicky.host/embed/tv/?id=1396/1/1'
    );
    expect(buildStreamEmbedUrl({ server: 'flicky', tmdbId: 550 })).toBe(
      'https://flicky.host/embed/movie/?id=550'
    );
  });

  it('every listed server builds a movie URL when given both ids', () => {
    for (const s of STREAM_SERVERS) {
      const movieUrl = buildStreamEmbedUrl({
        server: s.id,
        tmdbId: 550,
        imdbId: 'tt0137523',
      });
      expect(movieUrl, s.id).toBeTruthy();
      expect(movieUrl).toMatch(/^https:\/\//);
    }
  });

  it('falls back to videasy when an unknown server id is passed', () => {
    expect(buildStreamEmbedUrl({ server: 'made-up', tmdbId: 1428857 })).toContain(
      'player.videasy.net'
    );
  });
});
