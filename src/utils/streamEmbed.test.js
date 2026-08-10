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
  // Probed dead: parked domains, frame-busting headers, dupe mirrors.
  const dead = [
    'vidsrc',
    'embedsu',
    'vidsrcxyz',
    'vidsrcicu',
    'vidjoy',
    'autoembedcc',
    'vidbinge',
    'vidsrcnl',
    'playerx',
    'hydrahd',
    'flicky',
    'vidsrcembed',
    'vidsrcme2',
    'vidsrcsu',
    // Explicitly removed after hands-on playback testing.
    'vidking',
    'multiembed',
    'moviesapi',
    'smashy',
    'nontongo',
  ];

  // Retired by preference, not because they failed probing. Asserted so they
  // don't quietly reappear; restore from git history if they're wanted back.
  const retired = [
    'vidcore',
    'vidzee',
    'anyembed',
    'vidapi',
    'vidsrcme',
    'mapple',
    // Bynge's own hls.js player — it lived outside STREAM_SERVERS but is
    // asserted here so it can't creep back into the picker unnoticed.
    'bynge',
  ];

  it('keeps a solid roster of unique providers', () => {
    expect(STREAM_SERVERS.length).toBeGreaterThanOrEqual(10);
    const ids = STREAM_SERVERS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('does not include dead or retired providers', () => {
    const ids = STREAM_SERVERS.map((s) => s.id);
    for (const id of [...dead, ...retired]) {
      expect(ids, id).not.toContain(id);
    }
  });

  it('includes the probed replacement providers', () => {
    const ids = STREAM_SERVERS.map((s) => s.id);
    for (const id of [
      'wave',
      'vidfast',
      'vidlink',
      'vidsrcto',
      'primesrc',
      'hexa',
      'twembedonline',
    ]) {
      expect(ids, id).toContain(id);
    }
  });

  it('keeps at least one server for imdb-only titles', () => {
    const imdbCapable = STREAM_SERVERS.filter((s) => s.accepts.includes('imdb'));
    expect(imdbCapable.length).toBeGreaterThan(0);
    for (const s of imdbCapable) {
      const url = buildStreamEmbedUrl({ server: s.id, imdbId: 'tt0137523' });
      expect(url, s.id).toBeTruthy();
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
    expect(buildStreamEmbedUrl({ server: 'twembedonline' })).toBeNull();
    expect(buildStreamEmbedUrl({ server: 'videasy' })).toBeNull();
  });

  it('defaults to vidnest, which also heads the picker order', () => {
    expect(STREAM_SERVERS[0].id).toBe('vidnest');
    expect(buildStreamEmbedUrl({ tmdbId: 1396, season: 1, episode: 1 })).toBe(
      'https://vidnest.fun/tv/1396/1/1'
    );
    expect(buildStreamEmbedUrl({ tmdbId: 550 })).toBe('https://vidnest.fun/movie/550');
  });

  it('VidEasy movie + TV', () => {
    expect(buildStreamEmbedUrl({ server: 'videasy', tmdbId: 1428857 })).toBe(
      'https://player.videasy.net/movie/1428857'
    );
    expect(
      buildStreamEmbedUrl({ server: 'videasy', tmdbId: 1396, season: 3, episode: 7 })
    ).toBe('https://player.videasy.net/tv/1396/3/7');
  });

  it('providers build correct URLs', () => {
    expect(buildStreamEmbedUrl({ server: 'vidsrcpm', tmdbId: 1396, season: 1, episode: 1 })).toBe(
      'https://vidsrc.pm/embed/tv/1396/1/1'
    );
    expect(buildStreamEmbedUrl({ server: 'wave', tmdbId: 1396, season: 1, episode: 1 })).toBe(
      'https://wavembed.lol/tv/1396/1/1'
    );
    expect(buildStreamEmbedUrl({ server: 'vidfast', tmdbId: 1396, season: 1, episode: 1 })).toBe(
      'https://vidfast.pro/tv/1396/1/1'
    );
    expect(buildStreamEmbedUrl({ server: 'vidlink', tmdbId: 1396, season: 1, episode: 1 })).toBe(
      'https://vidlink.pro/tv/1396/1/1'
    );
    expect(buildStreamEmbedUrl({ server: 'vidsrcto', tmdbId: 1396, season: 1, episode: 1 })).toBe(
      'https://vidsrc.to/embed/tv/1396/1/1'
    );
    expect(buildStreamEmbedUrl({ server: 'primesrc', tmdbId: 1396, season: 1, episode: 1 })).toBe(
      'https://primesrc.me/embed/tv?tmdb=1396&season=1&episode=1'
    );
    expect(buildStreamEmbedUrl({ server: 'hexa', tmdbId: 1396, season: 1, episode: 1 })).toBe(
      'https://hexa.su/tv/1396/1/1'
    );
    expect(
      buildStreamEmbedUrl({ server: 'twembedonline', tmdbId: 1396, season: 1, episode: 1 })
    ).toBe(
      'https://www.2embed.online/embed/tv/1396/1/1'
    );
    expect(buildStreamEmbedUrl({ server: 'vidnest', tmdbId: 1396, season: 1, episode: 1 })).toBe(
      'https://vidnest.fun/tv/1396/1/1'
    );
    expect(buildStreamEmbedUrl({ server: 'cinemaos', tmdbId: 1396, season: 1, episode: 1 })).toBe(
      'https://cinemaos.live/tv/1396-1-1'
    );
    expect(buildStreamEmbedUrl({ server: 'cinemaos', tmdbId: 27205 })).toBe(
      'https://cinemaos.live/movie/27205'
    );
    expect(buildStreamEmbedUrl({ server: 'vidrock', tmdbId: 1396, season: 1, episode: 1 })).toBe(
      'https://vidrock.net/tv/1396/1/1'
    );
    expect(buildStreamEmbedUrl({ server: 'movies111', tmdbId: 1396, season: 1, episode: 1 })).toBe(
      'https://111movies.com/tv/1396/1/1'
    );
  });

  it('tmdb-only providers return null without a tmdb id', () => {
    const tmdbOnly = STREAM_SERVERS.filter((s) => !s.accepts.includes('imdb'));
    expect(tmdbOnly.length).toBeGreaterThan(0);
    for (const s of tmdbOnly) {
      expect(buildStreamEmbedUrl({ server: s.id, imdbId: 'tt0903747' }), s.id).toBeNull();
    }
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

  it('every listed server builds a TV URL when given both ids', () => {
    for (const s of STREAM_SERVERS) {
      const tvUrl = buildStreamEmbedUrl({
        server: s.id,
        tmdbId: 1396,
        imdbId: 'tt0903747',
        season: 1,
        episode: 1,
      });
      expect(tvUrl, s.id).toBeTruthy();
      expect(tvUrl).toMatch(/^https:\/\//);
    }
  });

  it('retired server ids no longer resolve to their old hosts', () => {
    const oldHosts = {
      vidcore: 'vidcore.org',
      vidzee: 'vidzee.wtf',
      anyembed: 'smashystream.com',
      vidsrcme: 'vidsrcme.ru',
      mapple: 'mappletv.uk',
    };
    for (const [id, host] of Object.entries(oldHosts)) {
      const url = buildStreamEmbedUrl({ server: id, tmdbId: 1396, imdbId: 'tt0903747' });
      expect(url, id).not.toContain(host);
    }
  });

  it('falls back to vidnest when an unknown server id is passed', () => {
    expect(buildStreamEmbedUrl({ server: 'made-up', tmdbId: 1428857 })).toContain('vidnest.fun');
  });
});
