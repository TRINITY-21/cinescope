/**
 * Tiny mock of the Node-style (req, res) pair Vercel serverless functions
 * receive. Tracks status, body, and a single Set-Cookie header — which is all
 * our endpoints under test actually use.
 */
export function makeReqRes({
  method = 'GET',
  url = '/',
  query = {},
  body = null,
  headers = {},
} = {}) {
  const responseHeaders = {};

  const res = {
    statusCode: 200,
    body: null,
    ended: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      if (!responseHeaders['Content-Type']) responseHeaders['Content-Type'] = 'application/json';
      this.body = data;
      this.ended = true;
      return this;
    },
    send(data) {
      this.body = data;
      this.ended = true;
      return this;
    },
    setHeader(name, value) {
      responseHeaders[name] = value;
    },
    getHeader(name) {
      return responseHeaders[name];
    },
    getHeaders() {
      return { ...responseHeaders };
    },
  };

  const req = { method, url, query, body, headers };
  return { req, res };
}

/** Parse a Set-Cookie value into a flat object of name/value + flags. */
export function parseSetCookie(cookieStr) {
  if (!cookieStr) return null;
  const parts = cookieStr.split(';').map((p) => p.trim());
  const [head, ...flagParts] = parts;
  const eq = head.indexOf('=');
  const name = head.slice(0, eq);
  const value = head.slice(eq + 1);
  const flags = {};
  for (const flag of flagParts) {
    const fEq = flag.indexOf('=');
    if (fEq === -1) flags[flag] = true;
    else flags[flag.slice(0, fEq)] = flag.slice(fEq + 1);
  }
  return { name, value, flags };
}
