/**
 * Run an existing Vercel-style `(req, res)` API handler inside a Netlify
 * Functions v2 `(Request) => Response` function.
 *
 * Keeping the adapter generic means the API implementation and its security
 * checks remain in one place instead of drifting between hosting platforms.
 */
export async function runVercelHandler(handler, request) {
  const url = new URL(request.url);
  const responseHeaders = new Headers();
  let statusCode = 200;
  let responseBody = '';

  const req = {
    method: request.method,
    query: Object.fromEntries(url.searchParams.entries()),
    headers: Object.fromEntries(request.headers.entries()),
  };

  const res = {
    status(code) {
      statusCode = code;
      return res;
    },
    setHeader(name, value) {
      responseHeaders.set(name, String(value));
      return res;
    },
    getHeader(name) {
      return responseHeaders.get(name);
    },
    json(data) {
      if (!responseHeaders.has('Content-Type')) {
        responseHeaders.set('Content-Type', 'application/json; charset=utf-8');
      }
      responseBody = JSON.stringify(data);
      return res;
    },
    send(data) {
      responseBody =
        typeof data === 'string' || data instanceof Uint8Array
          ? data
          : JSON.stringify(data);
      return res;
    },
    end(data = '') {
      responseBody = data;
      return res;
    },
  };

  await handler(req, res);

  return new Response(responseBody, {
    status: statusCode,
    headers: responseHeaders,
  });
}
