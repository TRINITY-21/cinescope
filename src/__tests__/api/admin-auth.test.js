import crypto from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import handler from '../../../api/admin-auth';
import { makeReqRes, parseSetCookie } from '../helpers/mockReqRes';

const VALID_PASSWORD = 'sup3r-secret-pw';
const SECRET = 'a-fixed-test-secret-string-for-hmac-32';

function sign(value) {
  return crypto.createHmac('sha256', SECRET).update(value).digest('hex');
}

describe('api/admin-auth', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.ADMIN_PASSWORD = VALID_PASSWORD;
    process.env.ADMIN_SESSION_SECRET = SECRET;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.useRealTimers();
  });

  describe('configuration', () => {
    it('returns 503 when ADMIN_PASSWORD is missing', async () => {
      delete process.env.ADMIN_PASSWORD;
      const { req, res } = makeReqRes({ method: 'GET' });
      await handler(req, res);
      expect(res.statusCode).toBe(503);
      expect(res.body.error).toMatch(/not configured/i);
    });

    it('returns 503 when ADMIN_SESSION_SECRET is missing', async () => {
      delete process.env.ADMIN_SESSION_SECRET;
      const { req, res } = makeReqRes({ method: 'GET' });
      await handler(req, res);
      expect(res.statusCode).toBe(503);
    });
  });

  describe('GET /api/admin-auth', () => {
    it('returns { authed: false } when no cookie is sent', async () => {
      const { req, res } = makeReqRes({ method: 'GET' });
      await handler(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ authed: false });
    });

    it('returns { authed: true } when a valid token cookie is sent', async () => {
      const future = String(Date.now() + 60_000);
      const token = `${future}.${sign(future)}`;
      const { req, res } = makeReqRes({
        method: 'GET',
        headers: { cookie: `bynge_admin=${encodeURIComponent(token)}` },
      });
      await handler(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ authed: true });
    });

    it('rejects a token with a tampered HMAC signature', async () => {
      const future = String(Date.now() + 60_000);
      const tampered = `${future}.${'0'.repeat(64)}`;
      const { req, res } = makeReqRes({
        method: 'GET',
        headers: { cookie: `bynge_admin=${tampered}` },
      });
      await handler(req, res);
      expect(res.body).toEqual({ authed: false });
    });

    it('rejects an expired token', async () => {
      const past = String(Date.now() - 1000);
      const expired = `${past}.${sign(past)}`;
      const { req, res } = makeReqRes({
        method: 'GET',
        headers: { cookie: `bynge_admin=${encodeURIComponent(expired)}` },
      });
      await handler(req, res);
      expect(res.body).toEqual({ authed: false });
    });

    it('rejects a malformed token (no dot separator)', async () => {
      const { req, res } = makeReqRes({
        method: 'GET',
        headers: { cookie: 'bynge_admin=notatoken' },
      });
      await handler(req, res);
      expect(res.body).toEqual({ authed: false });
    });
  });

  describe('POST /api/admin-auth (login)', () => {
    it('returns 401 for the wrong password (and is rate-delayed)', async () => {
      vi.useFakeTimers();
      const { req, res } = makeReqRes({ method: 'POST', body: { password: 'wrong-password' } });
      const promise = handler(req, res);
      // The handler awaits a 250ms penalty before responding
      await vi.advanceTimersByTimeAsync(250);
      await promise;
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toMatch(/invalid/i);
    });

    it('returns 401 when no password is supplied', async () => {
      vi.useFakeTimers();
      const { req, res } = makeReqRes({ method: 'POST', body: {} });
      const promise = handler(req, res);
      await vi.advanceTimersByTimeAsync(250);
      await promise;
      expect(res.statusCode).toBe(401);
    });

    it('returns 401 even when a different-length password is sent (avoids timing leak)', async () => {
      vi.useFakeTimers();
      const { req, res } = makeReqRes({ method: 'POST', body: { password: 'short' } });
      const promise = handler(req, res);
      await vi.advanceTimersByTimeAsync(250);
      await promise;
      expect(res.statusCode).toBe(401);
    });

    it('accepts JSON-stringified body for environments that don\'t auto-parse', async () => {
      vi.useFakeTimers();
      const { req, res } = makeReqRes({
        method: 'POST',
        body: JSON.stringify({ password: 'wrong-password' }),
      });
      const promise = handler(req, res);
      await vi.advanceTimersByTimeAsync(250);
      await promise;
      expect(res.statusCode).toBe(401);
    });

    it('issues a signed HttpOnly cookie on correct password', async () => {
      const { req, res } = makeReqRes({
        method: 'POST',
        body: { password: VALID_PASSWORD },
      });
      await handler(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ ok: true });

      const cookie = parseSetCookie(res.getHeader('Set-Cookie'));
      expect(cookie).not.toBeNull();
      expect(cookie.name).toBe('bynge_admin');
      expect(cookie.value).toMatch(/^\d+\.[a-f0-9]{64}$/);
      expect(cookie.flags.HttpOnly).toBe(true);
      expect(cookie.flags.Secure).toBe(true);
      expect(cookie.flags.SameSite).toBe('Lax');
      expect(Number(cookie.flags['Max-Age'])).toBeGreaterThan(0);
    });

    it('issues a token whose payload is a valid future timestamp', async () => {
      const { req, res } = makeReqRes({
        method: 'POST',
        body: { password: VALID_PASSWORD },
      });
      await handler(req, res);
      const cookie = parseSetCookie(res.getHeader('Set-Cookie'));
      const [payload] = cookie.value.split('.');
      const expires = Number(payload);
      expect(expires).toBeGreaterThan(Date.now());
      // ~8 hours ahead (allow ±2s drift)
      expect(expires).toBeLessThan(Date.now() + (8 * 60 * 60 + 5) * 1000);
    });

    it('issued token is recognized by a subsequent GET', async () => {
      // Login
      const post = makeReqRes({ method: 'POST', body: { password: VALID_PASSWORD } });
      await handler(post.req, post.res);
      const cookie = parseSetCookie(post.res.getHeader('Set-Cookie'));

      // Then re-use the cookie on GET
      const get = makeReqRes({
        method: 'GET',
        headers: { cookie: `bynge_admin=${cookie.value}` },
      });
      await handler(get.req, get.res);
      expect(get.res.body).toEqual({ authed: true });
    });
  });

  describe('DELETE /api/admin-auth (logout)', () => {
    it('returns ok + sets an expiring cookie that clears the session', async () => {
      const { req, res } = makeReqRes({ method: 'DELETE' });
      await handler(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ ok: true });
      const cookie = parseSetCookie(res.getHeader('Set-Cookie'));
      expect(cookie.name).toBe('bynge_admin');
      expect(cookie.value).toBe('');
      expect(Number(cookie.flags['Max-Age'])).toBe(0);
    });
  });

  describe('method handling', () => {
    it('returns 405 + Allow header for unsupported methods', async () => {
      const { req, res } = makeReqRes({ method: 'PUT' });
      await handler(req, res);
      expect(res.statusCode).toBe(405);
      expect(res.getHeader('Allow')).toContain('GET');
      expect(res.getHeader('Allow')).toContain('POST');
      expect(res.getHeader('Allow')).toContain('DELETE');
    });
  });
});
