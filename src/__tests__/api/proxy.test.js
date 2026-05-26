import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import handler from '../../../api/proxy';
import { makeReqRes } from '../helpers/mockReqRes';

function mockFetchOnce({ status = 200, body = '{}', contentType = 'application/json' } = {}) {
  let capturedUrl;
  let capturedInit;
  globalThis.fetch = vi.fn(async (url, init) => {
    capturedUrl = url;
    capturedInit = init;
    return {
      ok: status >= 200 && status < 300,
      status,
      headers: { get: (name) => (name.toLowerCase() === 'content-type' ? contentType : null) },
      text: async () => body,
    };
  });
  return () => ({ capturedUrl, capturedInit });
}

describe('api/proxy', () => {
  let originalEnv;
  let originalFetch;

  beforeEach(() => {
    originalEnv = { ...process.env };
    originalFetch = globalThis.fetch;
    process.env.TMDB_API_KEY = 'test-tmdb-key';
    process.env.OMDB_API_KEY = 'test-omdb-key';
    process.env.FANART_API_KEY = 'test-fanart-key';
    process.env.OPENSUBTITLES_API_KEY = 'test-os-key';
  });

  afterEach(() => {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
  });

  describe('method handling', () => {
    it('returns 405 + Allow:GET for non-GET methods', async () => {
      const { req, res } = makeReqRes({ method: 'POST', query: { service: 'tmdb', path: '/movie/1' } });
      await handler(req, res);
      expect(res.statusCode).toBe(405);
      expect(res.getHeader('Allow')).toBe('GET');
    });
  });

  describe('input validation', () => {
    it('returns 400 for an unknown service', async () => {
      const { req, res } = makeReqRes({ method: 'GET', query: { service: 'evil-corp', path: '/x' } });
      await handler(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/unknown service/i);
    });

    it('rejects path containing .. (path traversal)', async () => {
      const { req, res } = makeReqRes({ method: 'GET', query: { service: 'tmdb', path: '/movie/../../etc/passwd' } });
      await handler(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/invalid path/i);
    });

    it('rejects path containing :// (absolute URL hijack)', async () => {
      const { req, res } = makeReqRes({ method: 'GET', query: { service: 'tmdb', path: 'https://evil.com/whoami' } });
      await handler(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/invalid path/i);
    });

    it('rejects when path is not a string', async () => {
      const { req, res } = makeReqRes({ method: 'GET', query: { service: 'tmdb', path: ['/movie/1'] } });
      await handler(req, res);
      expect(res.statusCode).toBe(400);
    });
  });

  describe('configuration', () => {
    it('returns 503 when the required API key env is missing', async () => {
      delete process.env.TMDB_API_KEY;
      const { req, res } = makeReqRes({ method: 'GET', query: { service: 'tmdb', path: '/movie/1' } });
      await handler(req, res);
      expect(res.statusCode).toBe(503);
      expect(res.body.error).toContain('TMDB_API_KEY');
    });
  });

  describe('TMDB routing', () => {
    it('forwards to TMDB and injects api_key as a query param', async () => {
      const peek = mockFetchOnce({ body: '{"id":1}' });
      const { req, res } = makeReqRes({ method: 'GET', query: { service: 'tmdb', path: '/movie/123' } });
      await handler(req, res);
      const { capturedUrl, capturedInit } = peek();
      expect(capturedUrl).toContain('https://api.themoviedb.org/3/movie/123');
      expect(capturedUrl).toContain('api_key=test-tmdb-key');
      expect(capturedInit.headers).toEqual({});
      expect(res.statusCode).toBe(200);
      expect(res.body).toBe('{"id":1}');
    });

    it('preserves the upstream content-type header', async () => {
      mockFetchOnce({ body: '{}', contentType: 'application/json; charset=utf-8' });
      const { req, res } = makeReqRes({ method: 'GET', query: { service: 'tmdb', path: '/movie/1' } });
      await handler(req, res);
      expect(res.getHeader('Content-Type')).toBe('application/json; charset=utf-8');
    });

    it('sets a long Cache-Control for TMDB success responses', async () => {
      mockFetchOnce({ body: '{}' });
      const { req, res } = makeReqRes({ method: 'GET', query: { service: 'tmdb', path: '/movie/1' } });
      await handler(req, res);
      expect(res.getHeader('Cache-Control')).toContain('s-maxage=600');
    });

    it('does not cache 4xx/5xx responses', async () => {
      mockFetchOnce({ status: 404, body: '{}' });
      const { req, res } = makeReqRes({ method: 'GET', query: { service: 'tmdb', path: '/movie/0' } });
      await handler(req, res);
      expect(res.getHeader('Cache-Control')).toBe('no-store');
      expect(res.statusCode).toBe(404);
    });

    it('preserves existing query strings in path AND injects the api key', async () => {
      const peek = mockFetchOnce({ body: '{}' });
      const { req, res } = makeReqRes({
        method: 'GET',
        query: { service: 'tmdb', path: '/movie/1/images?include_image_language=en,null' },
      });
      await handler(req, res);
      const { capturedUrl } = peek();
      expect(capturedUrl).toContain('include_image_language=en%2Cnull');
      expect(capturedUrl).toContain('api_key=test-tmdb-key');
    });
  });

  describe('OMDB routing', () => {
    it('passes through the `query=` shape and injects apikey', async () => {
      const peek = mockFetchOnce({ body: '{}' });
      const { req, res } = makeReqRes({
        method: 'GET',
        query: { service: 'omdb', query: 'i=tt1234567&plot=short' },
      });
      await handler(req, res);
      const { capturedUrl } = peek();
      expect(capturedUrl).toContain('https://www.omdbapi.com');
      expect(capturedUrl).toContain('i=tt1234567');
      expect(capturedUrl).toContain('plot=short');
      expect(capturedUrl).toContain('apikey=test-omdb-key');
    });
  });

  describe('fanart routing', () => {
    it('sets Accept: application/json header and api_key query param', async () => {
      const peek = mockFetchOnce({ body: '{}' });
      const { req, res } = makeReqRes({
        method: 'GET',
        query: { service: 'fanart', path: '/movies/123' },
      });
      await handler(req, res);
      const { capturedUrl, capturedInit } = peek();
      expect(capturedUrl).toContain('webservice.fanart.tv/v3/movies/123');
      expect(capturedUrl).toContain('api_key=test-fanart-key');
      expect(capturedInit.headers.Accept).toBe('application/json');
    });
  });

  describe('opensubtitles routing', () => {
    it('injects the key as an Api-Key header, NOT as a query string', async () => {
      const peek = mockFetchOnce({ body: '{}' });
      const { req, res } = makeReqRes({
        method: 'GET',
        query: { service: 'opensubtitles', path: '/subtitles?imdb_id=12345' },
      });
      await handler(req, res);
      const { capturedUrl, capturedInit } = peek();
      // Key must NOT be on the URL
      expect(capturedUrl).not.toContain('test-os-key');
      // Key must be in the header
      expect(capturedInit.headers['Api-Key']).toBe('test-os-key');
      expect(capturedInit.headers.Accept).toBe('application/json');
      expect(capturedInit.headers['User-Agent']).toMatch(/Bynge/);
    });

    it('sets Cache-Control: no-store (results are user-specific)', async () => {
      mockFetchOnce({ body: '{}' });
      const { req, res } = makeReqRes({
        method: 'GET',
        query: { service: 'opensubtitles', path: '/subtitles' },
      });
      await handler(req, res);
      expect(res.getHeader('Cache-Control')).toBe('no-store');
    });
  });

  describe('upstream failure', () => {
    it('returns 502 when fetch throws', async () => {
      globalThis.fetch = vi.fn(async () => { throw new Error('econnreset'); });
      const { req, res } = makeReqRes({ method: 'GET', query: { service: 'tmdb', path: '/movie/1' } });
      await handler(req, res);
      expect(res.statusCode).toBe(502);
      expect(res.body.error).toMatch(/upstream/i);
    });
  });

  describe('case-insensitive service names', () => {
    it('accepts TMDB / Tmdb / tmdb equally', async () => {
      mockFetchOnce({ body: '{}' });
      const { req, res } = makeReqRes({ method: 'GET', query: { service: 'TMDB', path: '/movie/1' } });
      await handler(req, res);
      expect(res.statusCode).toBe(200);
    });
  });
});
