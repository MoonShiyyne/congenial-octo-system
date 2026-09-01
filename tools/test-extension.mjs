#!/usr/bin/env node
/**
 * Drives the built extension in a real Chromium against a stand-in Canvas.
 *
 * The unit tests cover the analysis; this covers the part that only exists in
 * a browser — the service worker importing `lib/`, the content script acting
 * as the way out to the API, the panel, the card on the assignment page, and
 * the viewer tab. It found a flexbox bug that no amount of reading the CSS
 * would have: without `min-height: 0` the scrolling pane grew to fit a long
 * brief and pushed the footer buttons off the bottom of the screen.
 *
 * Playwright is not a dependency of this repo. If it is not installed the
 * script says so and exits 0 — it is a check you can run, not one you must.
 *
 * Usage:  node tools/build-extension.mjs && node tools/test-extension.mjs
 */
import { createServer } from 'node:http';
import { mkdtemp, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8899;
const ORIGIN = `http://localhost:${PORT}`;

let chromium;
try {
  const require = createRequire(import.meta.url);
  ({ chromium } = require('playwright'));
} catch {
  console.error('playwright is not installed — skipping the browser test.');
  console.error('  npm i -D playwright && npx playwright install chromium');
  process.exit(0);
}

const fails = [];
const check = (cond, msg) => { console.error(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) fails.push(msg); };

// ── a stand-in Canvas ──────────────────────────────────────────────────────

/**
 * Serves data/canvas-demo.json in the shapes the real API uses, and
 * reproduces the three behaviours the client claims to handle: the `while(1);`
 * guard on session-authenticated JSON, pagination carried in the Link header,
 * and a 403 on an endpoint one course does not expose.
 */
const snap = JSON.parse(await readFile(join(ROOT, 'data/canvas-demo.json'), 'utf8'));
const byId = new Map(snap.courses.map(c => [String(c.id), c]));
const hits = [];
const apiHits = () => hits.filter(h => h.startsWith('/api/')).length;

const server = createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  hits.push(u.pathname);

  const send = (data, extra = {}) => {
    res.writeHead(200, { 'content-type': 'application/json', 'x-rate-limit-remaining': '600', ...extra });
    res.end('while(1);' + JSON.stringify(data));
  };
  const deny = code => { res.writeHead(code, { 'content-type': 'application/json' }); res.end('{"errors":["nope"]}'); };

  if (u.pathname === '/api/v1/users/self') return send({ id: 4242, name: 'Demo Student' });
  if (u.pathname === '/api/v1/users/self/profile') return send({ id: 4242, name: 'Demo Student' });
  if (u.pathname === '/api/v1/courses') {
    return send(snap.courses.map(c => ({
      id: c.id, name: c.name, course_code: c.code, term: { name: c.term },
      start_at: c.start_at, end_at: c.end_at, syllabus_body: c.syllabus_body,
      public_description: c.public_description, teachers: c.teachers,
      apply_assignment_group_weights: c.apply_assignment_group_weights,
    })));
  }

  const m = u.pathname.match(/^\/api\/v1\/courses\/(\d+)\/(\w+)$/);
  if (m) {
    const c = byId.get(m[1]);
    if (!c) return deny(404);
    if (m[2] === 'assignment_groups') return send(c.groups);
    if (m[2] === 'modules') return send(c.modules);
    if (m[2] === 'quizzes') return send(c.quizzes);
    if (m[2] === 'files') return c.id === 102 ? deny(403) : send(c.files);   // a real denial
    if (m[2] === 'assignments') {
      // Two pages, so the Link header is load-bearing: a client that ignores
      // it silently loses the back half of the term.
      const half = Math.ceil(c.assignments.length / 2);
      const page = Number(u.searchParams.get('page') ?? 1);
      const link = page === 1 ? `<${ORIGIN}/api/v1/courses/${c.id}/assignments?page=2>; rel="next"` : '';
      return send(page === 1 ? c.assignments.slice(0, half) : c.assignments.slice(half),
                  link ? { link } : {});
    }
    return deny(404);
  }
  const codes = key => u.searchParams.getAll(key).map(s => s.replace('course_', ''));
  if (u.pathname === '/api/v1/announcements') {
    return send(codes('context_codes[]').flatMap(id => byId.get(id)?.announcements ?? []));
  }
  if (u.pathname === '/api/v1/calendar_events') {
    return send(codes('context_codes[]').flatMap(id => byId.get(id)?.events ?? []));
  }

  // Anything else is a page of the LMS, so the extension has somewhere to run.
  res.writeHead(200, { 'content-type': 'text/html' });
  res.end(`<!doctype html><title>Canvas</title><div id="application" class="ic-app">
    <div id="content"><h1 class="title">Research Essay</h1>
    <div id="assignment_show"><p>The assignment page body.</p></div></div></div>`);
});
await new Promise(r => server.listen(PORT, r));

// ── load the extension ─────────────────────────────────────────────────────

// The shipped manifest matches *.instructure.com. The stand-in is on
// localhost, so the test copy widens the match — and only the match.
const extDir = await mkdtemp(join(tmpdir(), 'canvas-ext-'));
await cp(join(ROOT, 'extension'), extDir, { recursive: true });
const mf = JSON.parse(await readFile(join(extDir, 'manifest.json'), 'utf8'));
mf.content_scripts[0].matches = [`${ORIGIN}/*`];
mf.host_permissions = [`${ORIGIN}/*`];
await writeFile(join(extDir, 'manifest.json'), JSON.stringify(mf, null, 2));

const ctx = await chromium.launchPersistentContext(await mkdtemp(join(tmpdir(), 'canvas-prof-')), {
  headless: true,
  args: [`--disable-extensions-except=${extDir}`, `--load-extension=${extDir}`],
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
});

const errors = [];
let [worker] = ctx.serviceWorkers();
if (!worker) worker = await ctx.waitForEvent('serviceworker', { timeout: 15_000 });
for (let i = 0; i < 40; i++) {
  if (await worker.evaluate(() => !!globalThis.chrome?.tabs).catch(() => false)) break;
  await new Promise(r => setTimeout(r, 250));
}
check(!!worker, 'service worker started — every lib/ import resolved');

const page = await ctx.newPage();
page.on('pageerror', e => errors.push(String(e)));
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
await page.goto(`${ORIGIN}/courses/101/assignments/9104`, { waitUntil: 'domcontentloaded' });

/**
 * Stands in for the toolbar click, which cannot be dispatched from a test.
 * Waits for the content script the way background.js does: it runs at
 * document_idle, which is after the navigation resolves.
 */
const clickToolbar = () => worker.evaluate(async origin => {
  const [tab] = await chrome.tabs.query({ url: `${origin}/*` });
  for (let i = 0; i < 60; i++) {
    if ((await chrome.tabs.sendMessage(tab.id, { type: 'ping' }).catch(() => null))?.ok) break;
    await new Promise(r => setTimeout(r, 250));
  }
  await chrome.tabs.sendMessage(tab.id, { type: 'toggle' });
}, ORIGIN);

// ── the checks ─────────────────────────────────────────────────────────────

const panel = page.locator('#canvas-prep-briefs');
const thisTab = () => panel.getByRole('button', { name: 'This assignment' });

await clickToolbar();
await thisTab().waitFor({ timeout: 30_000 });
check(true, 'panel opened, pull finished, and it opened on the assignment being viewed');

// innerText reports *rendered* text, and the headings are uppercased in CSS.
const shown = await panel.locator('.pane').innerText();
check(/of the final grade/i.test(shown), 'the brief states a real grade impact');
check(/where the points are/i.test(shown), 'rubric criteria ranked by weight');
check(/what to hand in/i.test(shown), 'deliverables checklist rendered');
check(!/undefined|NaN|\[object/.test(shown), 'nothing undefined leaked into the panel');

check(hits.includes('/api/v1/users/self'), 'probes the session before pulling anything');
check(hits.filter(h => h.endsWith('/assignments')).length >= 2,
      'follows the Link header past page 1 — otherwise half the term goes missing');

const before = apiHits();
await page.reload({ waitUntil: 'domcontentloaded' });
const card = page.locator('#canvas-prep-brief-card');
await card.waitFor({ state: 'attached', timeout: 15_000 });
// innerText on a shadow host does not reach the shadow tree; locators do.
const cardText = await card.locator('.card').innerText();
check(/of the final grade/i.test(cardText), 'the card renders on the assignment page itself');
check(/start by/i.test(cardText), 'the card carries a start-by date');
check(/40%/.test(cardText), 'the card shows the weight with nothing opened');
check(apiHits() === before, 'the card came from cache — opening a page pulls nothing');

await clickToolbar();
await thisTab().waitFor({ timeout: 20_000 });
const viewerOpens = ctx.waitForEvent('page', { timeout: 20_000 });
await panel.getByRole('button', { name: 'Full dashboard' }).click();
const viewer = await viewerOpens;
await viewer.waitForLoadState('domcontentloaded');
const srcdoc = await viewer.locator('#frame').getAttribute('srcdoc', { timeout: 15_000 });
check((srcdoc ?? '').length > 5000, `the viewer renders the dashboard (${(srcdoc ?? '').length} bytes)`);
check(!/<script/i.test(srcdoc ?? ''), 'the dashboard has no script, so the sandboxed frame shows all of it');

// The stand-in denies course 102's files on purpose — that gap is the test.
const real = errors.filter(e => !/favicon|ERR_FILE_NOT_FOUND/i.test(e) && !/403 \(Forbidden\)/.test(e));
check(real.length === 0, `no page or worker errors${real.length ? ` — ${real.slice(0, 3).join(' | ')}` : ''}`);

await ctx.close();
await new Promise(r => server.close(r));
await rm(extDir, { recursive: true, force: true });
console.error(fails.length ? `\n${fails.length} failed` : '\nall checks passed');
process.exit(fails.length ? 1 : 0);
