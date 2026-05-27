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
});

describe('buildStreamEmbedUrl', () => {
  it('returns null when videoId is missing', () => {
    expect(buildStreamEmbedUrl({ videoId: null })).toBeNull();
    expect(buildStreamEmbedUrl({ videoId: '' })).toBeNull();
  });

  it('builds a movie embed URL for vidsrcme using an IMDb id', () => {
    const url = buildStreamEmbedUrl({ server: 'vidsrcme', videoId: 'tt35663059' });
    expect(url).toBe('https://vidsrcme.ru/embed/movie/tt35663059');
  });

  it('builds a TV embed URL for vidsrcme when season/episode given', () => {
    const url = buildStreamEmbedUrl({ server: 'vidsrcme', videoId: 'tt0903747', season: 2, episode: 7 });
    expect(url).toBe('https://vidsrcme.ru/embed/tv/tt0903747/2/7');
  });

  it('normalizes bare numeric imdb ids to the tt-prefixed form', () => {
    const url = buildStreamEmbedUrl({ server: 'vidsrcme', videoId: '0111161' });
    expect(url).toContain('tt0111161');
  });

  it('passes through a numeric TMDB id when useTmdb is set', () => {
    const url = buildStreamEmbedUrl({ server: 'vidsrcme', videoId: 12345, useTmdb: true });
    expect(url).toContain('/movie/12345');
  });

  it('builds a videasy movie URL with a TMDB id', () => {
    const url = buildStreamEmbedUrl({ server: 'videasy', videoId: 1428857, useTmdb: true });
    expect(url).toBe('https://player.videasy.net/movie/1428857');
  });

  it('builds a videasy TV URL with season + episode', () => {
    const url = buildStreamEmbedUrl({ server: 'videasy', videoId: 1396, useTmdb: true, season: 3, episode: 7 });
    expect(url).toBe('https://player.videasy.net/tv/1396/3/7');
  });

  it('builds a vidsrc.cc movie URL', () => {
    const url = buildStreamEmbedUrl({ server: 'vidsrc', videoId: 12345, useTmdb: true });
    expect(url).toBe('https://vidsrc.cc/v2/embed/movie/12345');
  });

  it('builds a vidsrc.cc TV URL with season + episode', () => {
    const url = buildStreamEmbedUrl({ server: 'vidsrc', videoId: 1396, useTmdb: true, season: 3, episode: 7 });
    expect(url).toBe('https://vidsrc.cc/v2/embed/tv/1396/3/7');
  });

  it('builds an embed.su movie URL', () => {
    const url = buildStreamEmbedUrl({ server: 'embedsu', videoId: 12345, useTmdb: true });
    expect(url).toBe('https://embed.su/embed/movie/12345');
  });

  it('builds an embed.su TV URL with season + episode', () => {
    const url = buildStreamEmbedUrl({ server: 'embedsu', videoId: 1396, useTmdb: true, season: 1, episode: 2 });
    expect(url).toBe('https://embed.su/embed/tv/1396/1/2');
  });

  it('builds an autoembed.co movie URL with tmdb path when useTmdb is true', () => {
    const url = buildStreamEmbedUrl({ server: 'autoembed', videoId: 12345, useTmdb: true });
    expect(url).toBe('https://autoembed.co/movie/tmdb/12345');
  });

  it('builds an autoembed.co movie URL with imdb path by default', () => {
    const url = buildStreamEmbedUrl({ server: 'autoembed', videoId: 'tt0111161' });
    expect(url).toBe('https://autoembed.co/movie/imdb/tt0111161');
  });

  it('builds an autoembed.co TV URL with s/e suffix', () => {
    const url = buildStreamEmbedUrl({
      server: 'autoembed',
      videoId: 1396,
      useTmdb: true,
      season: 4,
      episode: 9,
    });
    expect(url).toBe('https://autoembed.co/tv/tmdb/1396-4-9');
  });

  it('falls back to vidsrcme when an unknown server id is passed', () => {
    const url = buildStreamEmbedUrl({ server: 'made-up', videoId: 'tt0111161' });
    expect(url).toContain('vidsrcme.ru');
  });
});
