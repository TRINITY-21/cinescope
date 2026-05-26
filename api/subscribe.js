/**
 * Newsletter signup endpoint.
 *
 * POST { email, source? } → 200 { ok: true } | 4xx { error }
 *
 * Provider strategy: tries Buttondown first (the cleanest free-tier API for
 * indie newsletters), falls back to Mailchimp, then to a no-op "logged" mode
 * so the form keeps working in dev / before a provider is configured.
 *
 * Env (Vercel project settings, no VITE_ prefix):
 *   BUTTONDOWN_API_KEY        — preferred
 *   MAILCHIMP_API_KEY         — fallback
 *   MAILCHIMP_AUDIENCE_ID
 *   MAILCHIMP_SERVER_PREFIX   — e.g. "us12"
 *
 * Rate-limited via IP cache in memory (best-effort; resets per cold start).
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const recentByIp = new Map();
const RATE_WINDOW_MS = 30_000;
const RATE_MAX = 3;

function rateLimited(ip) {
  if (!ip) return false;
  const now = Date.now();
  const hits = (recentByIp.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_MAX) return true;
  hits.push(now);
  recentByIp.set(ip, hits);
  return false;
}

async function subscribeButtondown(email, source) {
  const key = process.env.BUTTONDOWN_API_KEY;
  if (!key) return null;
  const res = await fetch('https://api.buttondown.email/v1/subscribers', {
    method: 'POST',
    headers: {
      Authorization: `Token ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email_address: email,
      tags: source ? [source] : [],
    }),
  });
  // Buttondown returns 201 on create, 400 if already subscribed.
  if (res.status === 201) return { provider: 'buttondown', status: 'created' };
  if (res.status === 400) return { provider: 'buttondown', status: 'already-subscribed' };
  const detail = await res.text().catch(() => '');
  throw new Error(`buttondown ${res.status}: ${detail.slice(0, 200)}`);
}

async function subscribeMailchimp(email, source) {
  const key = process.env.MAILCHIMP_API_KEY;
  const audience = process.env.MAILCHIMP_AUDIENCE_ID;
  const server = process.env.MAILCHIMP_SERVER_PREFIX;
  if (!key || !audience || !server) return null;
  const res = await fetch(
    `https://${server}.api.mailchimp.com/3.0/lists/${audience}/members`,
    {
      method: 'POST',
      headers: {
        Authorization: `apikey ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        status: 'subscribed',
        tags: source ? [source] : [],
      }),
    },
  );
  if (res.ok) return { provider: 'mailchimp', status: 'created' };
  // 400 with "Member Exists" → treat as success.
  if (res.status === 400) {
    const body = await res.json().catch(() => ({}));
    if ((body.title || '').includes('Member Exists')) {
      return { provider: 'mailchimp', status: 'already-subscribed' };
    }
  }
  throw new Error(`mailchimp ${res.status}`);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method-not-allowed' });
  }

  const ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    '';
  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'too-many-requests' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const email = String(body?.email || '').trim().toLowerCase();
  const source = String(body?.source || 'newsletter-page').slice(0, 32);

  if (!EMAIL_RE.test(email) || email.length > 200) {
    return res.status(400).json({ error: 'invalid-email' });
  }

  // Honeypot — if the hidden 'website' field is filled, silently 200 the bot.
  if (body?.website) {
    return res.status(200).json({ ok: true });
  }

  try {
    let result = await subscribeButtondown(email, source);
    if (!result) result = await subscribeMailchimp(email, source);
    if (!result) {
      // No provider configured — don't log the email itself; Vercel function
      // logs are persisted and shouldn't carry PII.
      console.log(`[subscribe] no provider configured. source=${source}`);
      result = { provider: 'none', status: 'logged' };
    }
    return res.status(200).json({ ok: true, ...result });
  } catch (err) {
    console.error('[subscribe] error', err);
    return res.status(500).json({ error: 'provider-error' });
  }
}
