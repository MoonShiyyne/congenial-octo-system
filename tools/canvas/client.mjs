/**
 * A small Canvas LMS REST client — no dependencies, no SDK.
 *
 * Three things about the Canvas API that a naive `fetch` loop gets wrong, and
 * that this file exists to handle:
 *
 *   1. Pagination is in the `Link` header, not the body. A course with 60
 *      assignments returns 10 by default and nothing in the payload says so,
 *      so a naive read silently loses most of the term.
 *   2. The rate limiter is a leaky bucket, reported in `X-Rate-Limit-Remaining`
 *      as a *cost budget*, not a request count. When it runs low Canvas starts
 *      answering 403 with a "Rate Limit Exceeded" body rather than 429, so a
 *      retry policy keyed on 429 alone will read that as an auth failure and
 *      give up on a token that is perfectly valid.
 *   3. Session-authenticated responses are prefixed with `while(1);` — Canvas's
 *      guard against a third-party site loading an API url as a `<script>` and
 *      reading the array literal. It is not JSON, and `JSON.parse` on it throws
 *      a syntax error that looks nothing like the "you are signed in with a
 *      cookie" that actually caused it.
 *
 * **Transport is injected.** The default one is `fetch`, which is what the CLI
 * uses with a bearer token. The browser extension supplies its own, which
 * relays each request to a content script so it goes out same-origin from the
 * Canvas tab and carries the session cookie the user already has. Same client,
 * same pagination and retry behaviour, two very different ways of proving who
 * you are — and no second implementation to keep in step.
 */

const USER_AGENT = 'canvas-prep-brief/1.0';

/** Canvas answers rate limiting with 403 + this body, not 429. */
const isRateLimitBody = body => /rate limit exceeded/i.test(body ?? '');

const sleep = ms => new Promise(r => setTimeout(r, ms));

/** `<https://…?page=2>; rel="next", …` → the next url, or null. */
export function nextLink(header) {
  for (const part of String(header ?? '').split(',')) {
    const m = part.match(/<([^>]+)>\s*;\s*rel="?next"?/i);
    if (m) return m[1];
  }
  return null;
}

/**
 * Canvas prefixes session-authenticated JSON with `while(1);` so that a hostile
 * page cannot load an API url in a `<script>` tag and read the result. Harmless
 * to strip when it is absent, fatal to leave when it is not.
 */
export function stripGuard(body) {
  return String(body ?? '').replace(/^\s*while\s*\(1\)\s*;?/, '');
}

const parse = body => JSON.parse(stripGuard(body));

/** The default transport: plain `fetch`, with headers flattened for the client. */
async function fetchTransport(url, { headers }) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(45_000) });
  const flat = {};
  res.headers.forEach((v, k) => { flat[k.toLowerCase()] = v; });
  return { status: res.status, ok: res.ok, body: await res.text(), headers: flat };
}

/** Strips a trailing slash and any `/api/v1` the user pasted in. */
export function normaliseHost(host) {
  let h = String(host ?? '').trim();
  if (!h) throw new Error('no Canvas host given');
  if (!/^https?:\/\//.test(h)) h = `https://${h}`;
  return h.replace(/\/+$/, '').replace(/\/api\/v1$/, '');
}

export function createClient({
  host, token, session = false, transport = fetchTransport,
  perPage = 100, maxPages = 40, log = () => {},
} = {}) {
  const base = `${normaliseHost(host)}/api/v1`;
  if (!token && !session) throw new Error('no Canvas API token given, and not in session mode');

  /** Budget left in the leaky bucket; used to slow down before we get cut off. */
  let remaining = Infinity;

  async function raw(url, { attempts = 4 } = {}) {
    let lastErr;
    for (let i = 0; i < attempts; i++) {
      if (remaining < 100) await sleep(1500);      // ease off before the wall
      let res;
      try {
        res = await transport(url, { headers: requestHeaders() });
      } catch (err) {
        lastErr = err;
        if (i < attempts - 1) await sleep(1000 * 2 ** i);
        continue;
      }
      const { status, body, headers = {} } = res;
      const ok = res.ok ?? (status >= 200 && status < 300);

      const budget = Number(headers['x-rate-limit-remaining']);
      if (Number.isFinite(budget)) remaining = budget;

      if (ok) return { body, headers };

      // 403 is ambiguous in Canvas: a real permission failure, or the rate
      // limiter. Only the body tells them apart, and only one is retryable.
      const throttled = status === 429 || (status === 403 && isRateLimitBody(body));
      if (throttled || status >= 500) {
        lastErr = new Error(`HTTP ${status}${throttled ? ' (rate limited)' : ''}`);
        if (i < attempts - 1) { await sleep(2000 * 2 ** i); continue; }
      } else {
        const err = new Error(`HTTP ${status} — ${firstLine(body)}`);
        err.status = status;
        throw err;
      }
    }
    throw lastErr ?? new Error('request failed');
  }

  /** Headers to send. In session mode the cookie is the credential. */
  function requestHeaders() {
    const h = { accept: 'application/json' };
    if (token) h.authorization = `Bearer ${token}`;
    // A content script cannot set user-agent, and the browser's own is right
    // there anyway; only the CLI has a reason to identify itself.
    if (!session) h['user-agent'] = USER_AGENT;
    return h;
  }

  /** One resource. Returns null on 404/403 rather than throwing. */
  async function get(path, params) {
    try {
      const { body } = await raw(url(path, params));
      return parse(body);
    } catch (err) {
      if (err.status === 404 || err.status === 403) return null;
      throw err;
    }
  }

  /** Every page of a list resource, concatenated. */
  async function list(path, params) {
    let target = url(path, { per_page: perPage, ...params });
    const out = [];
    for (let page = 0; page < maxPages && target; page++) {
      // 403/404 are not swallowed here: "the modules tab is turned off" and
      // "this course has no modules" produce identical empty arrays, and only
      // the caller can say which one belongs in the brief.
      const res = await raw(target);
      const chunk = parse(res.body);
      if (!Array.isArray(chunk)) return chunk;
      out.push(...chunk);
      target = nextLink(res.headers.link);
      if (target) log(`  …page ${page + 2} of ${path}`);
    }
    return out;
  }

  function url(path, params) {
    const u = new URL(base + path);
    for (const [k, v] of Object.entries(params ?? {})) {
      if (v == null) continue;
      // Canvas takes repeated `include[]` params, never a comma-joined list.
      if (Array.isArray(v)) for (const item of v) u.searchParams.append(k, item);
      else u.searchParams.set(k, String(v));
    }
    return u.toString();
  }

  return { get, list, base };
}

const firstLine = s => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, 160);
