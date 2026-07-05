// Single source of truth for the CORS allowlist, shared by the Express CORS layer,
// Socket.io, and the kitchen SSE stream (which sets CORS headers on its own response).
//
// Allow: any *.deliverydepartment.am (and the apex), any localhost port, plus any origins
// listed in the CORS_ORIGINS env (comma-separated).
const extraOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export function isAllowedOrigin(origin) {
  return (
    !!origin &&
    (extraOrigins.includes(origin) ||
      /^https?:\/\/localhost(:\d+)?$/i.test(origin) ||
      /^https?:\/\/([a-z0-9-]+\.)*deliverydepartment\.am$/i.test(origin))
  );
}

// Set the CORS response headers manually (reflecting the request origin when allowed).
// Used for the SSE stream, where a reverse proxy may not carry the cors() middleware's
// headers through a long-lived streaming response.
export function applyCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
}
