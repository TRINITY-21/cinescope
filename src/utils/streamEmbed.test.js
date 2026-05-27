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
  it('exposes all five public embed providers with stable ids', () => {
    const ids = STREAM_SERVERS.map((s) => s.id);
    expect(ids).toEqual(['vidsrcme', 'videasy', 'vidsrc', 'embedsu', 'autoembed']);
  });

  it('uses real provider names as labels (no opaque "Server N")', () => {
    const labels = STREAM_SERVERS.map((s) => s.label);
    expect(labels).toEqual(['VidSrc.me', 'VidEasy', 'VidSrc', 'Embed.su', 'AutoEmbed']);
  });

  it('declares which id types each server accepts', () => {
    const map = Object.fromEntries(STREAM_SERVERS.map((s) => [s.id, s.accepts]));
    expect(map.vidsrcme).toEqual(['imdb']);
    expect(map.videasy).toEqual(['tmdb']);
    expect(map.vidsrc).toEqual(['tmdb', 'imdb']);
    expect(map.embedsu).toEqual(['tmdb']);
    expect(map.autoembed).toEqual(['tmdb', 'imdb']);
  });
});

describe('buildStreamEmbedUrl', () => {
  it('returns null when neither id is provided', () => {
    expect(buildStreamEmbedUrl({ server: 'vidsrcme' })).toBeNull();
    expect(buildStreamEmbedUrl({ server: 'videasy' })).toBeNull();
  });

  describe('VidSrc.me (vidsrcme) — IMDB only', () => {
    it('builds a movie URL with an IMDB id', () => {
      const url = buildStreamEmbedUrl({ server: 'vidsrcme', imdbId: 'tt35663059' });
      expect(url).toBe('https://vidsrcme.ru/embed/movie/tt35663059');
    });

    it('builds a TV URL with season + episode', () => {
      const url = buildStreamEmbedUrl({
        server: 'vidsrcme',
        imdbId: 'tt0903747',
        season: 2,
        episode: 7,
      });
      expect(url).toBe('https://vidsrcme.ru/embed/tv/tt0903747/2/7');
    });

    it('normalizes a bare numeric imdb id to tt-prefixed form', () => {
      const url = buildStreamEmbedUrl({ server: 'vidsrcme', imdbId: '0111161' });
      expect(url).toContain('tt0111161');
    });

    it('returns null when only a TMDB id is available', () => {
      const url = buildStreamEmbedUrl({ server: 'vidsrcme', tmdbId: 1428857 });
      expect(url).toBeNull();
    });
  });

  describe('VidEasy (videasy) — TMDB only', () => {
    it('builds a movie URL with a TMDB id', () => {
      const url = buildStreamEmbedUrl({ server: 'videasy', tmdbId: 1428857 });
      expect(url).toBe('https://player.videasy.net/movie/1428857');
    });

    it('builds a TV URL with season + episode', () => {
      const url = buildStreamEmbedUrl({
        server: 'videasy',
        tmdbId: 1396,
        season: 3,
        episode: 7,
      });
      expect(url).toBe('https://player.videasy.net/tv/1396/3/7');
    });

    it('returns null when only an IMDB id is available', () => {
      const url = buildStreamEmbedUrl({ server: 'videasy', imdbId: 'tt35663059' });
      expect(url).toBeNull();
    });
  });

  describe('VidSrc (vidsrc.cc) — accepts either', () => {
    it('prefers TMDB when both ids are provided', () => {
      const url = buildStreamEmbedUrl({
        server: 'vidsrc',
        imdbId: 'tt35663059',
        tmdbId: 1428857,
      });
      expect(url).toBe('https://vidsrc.cc/v2/embed/movie/1428857');
    });

    it('falls back to IMDB when no TMDB id is given', () => {
      const url = buildStreamEmbedUrl({ server: 'vidsrc', imdbId: 'tt35663059' });
      expect(url).toBe('https://vidsrc.cc/v2/embed/movie/tt35663059');
    });

    it('builds a TV URL with season + episode', () => {
      const url = buildStreamEmbedUrl({
        server: 'vidsrc',
        tmdbId: 1396,
        season: 3,
        episode: 7,
      });
      expect(url).toBe('https://vidsrc.cc/v2/embed/tv/1396/3/7');
    });
  });

  describe('Embed.su (embedsu) — TMDB only', () => {
    it('builds a movie URL', () => {
      const url = buildStreamEmbedUrl({ server: 'embedsu', tmdbId: 12345 });
      expect(url).toBe('https://embed.su/embed/movie/12345');
    });

    it('builds a TV URL with season + episode', () => {
      const url = buildStreamEmbedUrl({
        server: 'embedsu',
        tmdbId: 1396,
        season: 1,
        episode: 2,
      });
      expect(url).toBe('https://embed.su/embed/tv/1396/1/2');
    });

    it('returns null when only an IMDB id is available', () => {
      const url = buildStreamEmbedUrl({ server: 'embedsu', imdbId: 'tt0111161' });
      expect(url).toBeNull();
    });
  });

  describe('AutoEmbed (autoembed) — TMDB preferred, IMDB fallback', () => {
    it('uses tmdb path when a TMDB id is given', () => {
      const url = buildStreamEmbedUrl({ server: 'autoembed', tmdbId: 12345 });
      expect(url).toBe('https://autoembed.co/movie/tmdb/12345');
    });

    it('uses imdb path when only an IMDB id is given', () => {
      const url = buildStreamEmbedUrl({ server: 'autoembed', imdbId: 'tt0111161' });
      expect(url).toBe('https://autoembed.co/movie/imdb/tt0111161');
    });

    it('builds a TV URL with the s/e suffix on the tmdb path', () => {
      const url = buildStreamEmbedUrl({
        server: 'autoembed',
        tmdbId: 1396,
        season: 4,
        episode: 9,
      });
      expect(url).toBe('https://autoembed.co/tv/tmdb/1396-4-9');
    });
  });

  it('falls back to vidsrcme when an unknown server id is passed', () => {
    const url = buildStreamEmbedUrl({ server: 'made-up', imdbId: 'tt0111161' });
    expect(url).toContain('vidsrcme.ru');
  });
});
