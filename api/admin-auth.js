/**
 * Admin auth endpoint — replaces the previous client-side password check
 * (which compared against a VITE_ env var that was bundled into the public JS).
 *
 * Flow:
 *   POST /api/admin-auth         { password }   → sets HTTP-only cookie, returns { ok: true }
 *   GET  /api/admin-auth                        → returns { authed: boolean }
 *   DELETE /api/admin-auth                      → clears cookie
 *
 * Server env (no VITE_ prefix):
 *   ADMIN_PASSWORD            plain admin password
 *   ADMIN_SESSION_SECRET      random ≥32-char string used to sign session tokens
 *
 * The session is stateless: a signed token `<expires>.<hmac>` in an HttpOnly
 * cookie. No database, no token store.
 */

import crypto from 'node:crypto';

const COOKIE_NAME = 'bynge_admin';
const SESSION_HOURS = 8;

function timingSafeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

function makeToken(secret) {
  const expires = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const payload = String(expires);
  return `${payload}.${sign(payload, secret)}`;
}

function verifyToken(token, secret) {
  if (!token || typeof token !== 'string') return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expected = sign(payload, secret);
  if (!timingSafeEqual(sig, expected)) return false;
  const expires = Number(payload);
  if (!Number.isFinite(expires) || expires < Date.now()) return false;
  return true;
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k) out[k] = decodeURIComponent(rest.join('='));
  }
  return out;
}

function setCookie(res, value, maxAgeSeconds) {
  const parts = [
    `${COOKIE_NAME}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Secure',
    `Max-Age=${maxAgeSeconds}`,
  ];
  res.setHeader('Set-Cookie', parts.join('; '));
}

export default async function handler(req, res) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;

  if (!adminPassword || !sessionSecret) {
    return res.status(503).json({ error: 'Admin auth not configured' });
  }

  const cookies = parseCookies(req.headers.cookie);
  const currentToken = cookies[COOKIE_NAME];

  if (req.method === 'GET') {
    return res.status(200).json({ authed: verifyToken(currentToken, sessionSecret) });
  }

  if (req.method === 'DELETE') {
    setCookie(res, '', 0);
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    const submitted = body?.password ?? '';
    if (!timingSafeEqual(submitted, adminPassword)) {
      // Small constant delay to discourage brute-force timing
      await new Promise((r) => setTimeout(r, 250));
      return res.status(401).json({ error: 'Invalid password' });
    }
    const token = makeToken(sessionSecret);
    setCookie(res, token, SESSION_HOURS * 60 * 60);
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
