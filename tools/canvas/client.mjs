/**
 * A small Canvas LMS REST client — no dependencies, no SDK.
 *
 * Two things about the Canvas API that a naive `fetch` loop gets wrong, and
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

/** Strips a trailing slash and any `/api/v1` the user pasted in. */
export function normaliseHost(host) {
  let h = String(host ?? '').trim();
  if (!h) throw new Error('no Canvas host given');
  if (!/^https?:\/\//.test(h)) h = `https://${h}`;
  return h.replace(/\/+$/, '').replace(/\/api\/v1$/, '');
}

export function createClient({ host, token, perPage = 100, maxPages = 40, log = () => {} }) {
  const base = `${normaliseHost(host)}/api/v1`;
  if (!token) throw new Error('no Canvas API token given');

  /** Budget left in the leaky bucket; used to slow down before we get cut off. */
  let remaining = Infinity;

  async function raw(url, { attempts = 4 } = {}) {
    let lastErr;
    for (let i = 0; i < attempts; i++) {
      if (remaining < 100) await sleep(1500);      // ease off before the wall
      let res, body;
      try {
        res = await fetch(url, {
          headers: {
            authorization: `Bearer ${token}`,
            accept: 'application/json',
            'user-agent': USER_AGENT,
          },
          signal: AbortSignal.timeout(45_000),
        });
        body = await res.text();
      } catch (err) {
        lastErr = err;
        if (i < attempts - 1) await sleep(1000 * 2 ** i);
        continue;
      }

      const budget = Number(res.headers.get('x-rate-limit-remaining'));
      if (Number.isFinite(budget)) remaining = budget;

      if (res.ok) return { body, headers: res.headers };

      // 403 is ambiguous in Canvas: a real permission failure, or the rate
      // limiter. Only the body tells them apart, and only one is retryable.
      const throttled = res.status === 429 || (res.status === 403 && isRateLimitBody(body));
      if (throttled || res.status >= 500) {
        lastErr = new Error(`HTTP ${res.status}${throttled ? ' (rate limited)' : ''}`);
        if (i < attempts - 1) { await sleep(2000 * 2 ** i); continue; }
      } else {
        const err = new Error(`HTTP ${res.status} — ${firstLine(body)}`);
        err.status = res.status;
        throw err;
      }
    }
    throw lastErr ?? new Error('request failed');
  }

  /** One resource. Returns null on 404/403 rather than throwing. */
  async function get(path, params) {
    try {
      const { body } = await raw(url(path, params));
      return JSON.parse(body);
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
      const chunk = JSON.parse(res.body);
      if (!Array.isArray(chunk)) return chunk;
      out.push(...chunk);
      target = nextLink(res.headers.get('link'));
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
