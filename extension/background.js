/**
 * The service worker: all the thinking, none of the DOM.
 *
 * It imports the same analysis modules the CLI uses — `lib/` is a copy of
 * `tools/canvas/`, made by `tools/build-extension.mjs` — so a brief in the
 * browser and a brief on disk come from one implementation.
 *
 * The interesting part is how requests get out. The worker cannot usefully
 * fetch the Canvas API itself: its requests are cross-site, so the session
 * cookie is not attached, and it would need a token again — the exact setup
 * step the extension exists to remove. So it does not fetch. It builds each
 * request and hands it to the content script running *in the Canvas tab*,
 * where the same url is same-origin and the cookie the user already has goes
 * with it. The client's transport hook makes that a swap of one function.
 */
import { fetchSnapshot } from './lib/fetch.mjs';
import { analyse } from './lib/analyse.mjs';
import { dashboard } from './lib/dashboard.mjs';
import { indexBrief, courseBrief, assignmentBrief } from './lib/render.mjs';

const TTL_MS = 30 * 60 * 1000;          // a term does not change every minute
const cacheKey = origin => `briefs:${origin}`;

/** One pull per origin at a time; a second click joins the first. */
const inflight = new Map();

// ── the toolbar button ─────────────────────────────────────────────────────

chrome.action.onClicked.addListener(async tab => {
  if (!tab?.id) return;
  try {
    await ensureContentScript(tab.id);
    await chrome.tabs.sendMessage(tab.id, { type: 'toggle' });
  } catch (err) {
    // The one case worth explaining rather than failing silently: a page the
    // extension is not allowed to touch at all.
    await chrome.action.setBadgeText({ tabId: tab.id, text: '!' });
    console.warn('could not open the panel here:', err);
  }
});

/**
 * The static content script only matches `*.instructure.com`. Plenty of
 * universities host Canvas on their own domain, and `activeTab` grants access
 * to whatever tab the user just clicked on — so the script is injected on
 * demand there instead of the extension asking to read every site they visit.
 * That is the whole reason this extension does not request `<all_urls>`.
 */
async function ensureContentScript(tabId) {
  const alive = await chrome.tabs.sendMessage(tabId, { type: 'ping' }).catch(() => null);
  if (alive?.ok) return;
  await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
}

// ── messages from the panel ────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  handle(msg, sender)
    .then(reply)
    .catch(err => reply({ error: String(err?.message ?? err) }));
  return true;                           // keep the channel open for the await
});

async function handle(msg, sender) {
  const tabId = sender?.tab?.id;
  const origin = safeOrigin(sender?.tab?.url);

  switch (msg?.type) {
    case 'briefs': {
      if (!origin || !tabId) throw new Error('no Canvas tab in scope');
      // cacheOnly is how the assignment-page card stays free: it draws itself
      // if the data happens to be there and does nothing at all if it is not.
      // Landing on a page is not a request to go read someone's whole account.
      if (msg.cacheOnly) return { result: await cached(origin) };
      return { result: await briefsFor(origin, tabId, msg.force) };
    }
    case 'dashboard': {
      const { result } = await handle({ type: 'briefs' }, sender);
      await chrome.storage.local.set({ 'viewer:html': dashboard(result), 'viewer:at': Date.now() });
      await chrome.tabs.create({ url: chrome.runtime.getURL('viewer.html') });
      return { ok: true };
    }
    case 'markdown': {
      const { result } = await handle({ type: 'briefs' }, sender);
      return { text: allBriefs(result), name: `canvas-briefs-${today()}.md` };
    }
    case 'forget': {
      await chrome.storage.local.clear();
      return { ok: true };
    }
    default:
      throw new Error(`unknown message "${msg?.type}"`);
  }
}

// ── the pull ───────────────────────────────────────────────────────────────

async function cached(origin) {
  const hit = (await chrome.storage.local.get(cacheKey(origin)))[cacheKey(origin)];
  return hit && Date.now() - hit.at < TTL_MS ? hit.result : null;
}

async function briefsFor(origin, tabId, force) {
  if (!force) {
    const hit = await cached(origin);
    if (hit) return hit;
  }
  if (inflight.has(origin)) return inflight.get(origin);

  const job = (async () => {
    const transport = (url, { headers }) => {
      // Every request goes out from the Canvas tab, not from here.
      if (!url.startsWith(origin + '/')) throw new Error(`refusing to request ${url}`);
      return chrome.tabs.sendMessage(tabId, { type: 'http', url, headers });
    };

    const probe = await transport(`${origin}/api/v1/users/self`, { headers: { accept: 'application/json' } });
    if (probe.status === 401 || probe.status === 403) {
      throw new Error('Canvas says you are not signed in on this tab. Sign in, then try again.');
    }
    if (!probe.ok) throw new Error('This page does not look like Canvas — no API answered on it.');

    const snapshot = await fetchSnapshot({ host: origin, session: true, transport, log: () => {} });
    const result = analyse(snapshot);
    await chrome.storage.local.set({ [cacheKey(origin)]: { at: Date.now(), result } });
    return result;
  })().finally(() => inflight.delete(origin));

  inflight.set(origin, job);
  return job;
}

// ── helpers ────────────────────────────────────────────────────────────────

/** Every brief in one file, in the order you would read them. */
function allBriefs(result) {
  const parts = [indexBrief(result)];
  for (const course of result.courses) {
    parts.push(courseBrief(course));
    for (const a of course.assignments) parts.push(assignmentBrief(a));
  }
  return parts.join('\n\n<div style="page-break-after: always"></div>\n\n');
}

const safeOrigin = url => { try { return new URL(url).origin; } catch { return null; } };
const today = () => new Date().toISOString().slice(0, 10);
