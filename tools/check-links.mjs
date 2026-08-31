#!/usr/bin/env node
/**
 * Verifies every URL in data/resources.mjs actually resolves.
 *
 * Link rot is the failure mode this project is most exposed to — a curriculum
 * that points at dead documentation is worse than one that points nowhere. CI
 * runs this weekly.
 *
 * YouTube is checked through the oEmbed endpoint, not by fetching the watch
 * page: YouTube returns 200 with a "video unavailable" body for a dead id,
 * so a status check alone would pass a broken link. oEmbed 404s properly and
 * returns the channel, which is also how the `src` labels get verified.
 *
 * Usage:  node tools/check-links.mjs [--json]
 * Exit 1 if any link is broken.
 */
import { resources } from '../data/resources.mjs';
import { nodes } from '../data/curriculum.mjs';

const JSON_OUT = process.argv.includes('--json');
const CONCURRENCY = 6;
const log = (...a) => console.error(...a);

const entries = [];
for (const [node, list] of Object.entries(resources)) {
  for (const r of list) entries.push({ node, ...r });
}
// One request per distinct URL, however many nodes cite it.
const byUrl = new Map();
for (const e of entries) (byUrl.get(e.u) ?? byUrl.set(e.u, []).get(e.u)).push(e);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function check(url) {
  const yt = url.match(/youtube\.com\/watch\?v=([\w-]+)/);
  const target = yt
    ? `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    : url;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(target, {
        redirect: 'follow',
        headers: { 'user-agent': 'progression-web-linkcheck/1.0' },
        signal: AbortSignal.timeout(30_000),
      });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (yt) {
        if (res.status === 404) return { ok: false, status: 404, note: 'video unavailable' };
        if (!res.ok) return { ok: false, status: res.status };
        const meta = await res.json();
        return { ok: true, status: 200, channel: meta.author_name };
      }
      return { ok: res.ok, status: res.status, final: res.url !== url ? res.url : undefined };
    } catch (err) {
      if (attempt === 2) return { ok: false, status: 0, note: String(err.message ?? err) };
      await sleep(1500 * 2 ** attempt);
    }
  }
}

const urls = [...byUrl.keys()];
const results = new Map();
let done = 0;

await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (urls.length) {
    const url = urls.shift();
    results.set(url, await check(url));
    if (!JSON_OUT && ++done % 20 === 0) log(`  …${done}/${byUrl.size}`);
  }
}));

const broken = [], redirected = [], mislabelled = [];
for (const [url, r] of results) {
  const cites = byUrl.get(url);
  if (!r.ok) broken.push({ url, ...r, nodes: cites.map(c => c.node) });
  else if (r.final) redirected.push({ url, final: r.final });
  // A talk's `src` must name the channel it is actually on.
  if (r.ok && r.channel && !cites.every(c => c.src === r.channel)) {
    mislabelled.push({ url, declared: cites[0].src, actual: r.channel });
  }
}

if (JSON_OUT) {
  console.log(JSON.stringify({
    checked: byUrl.size, broken, redirected, mislabelled,
    generated: new Date().toISOString(),
  }, null, 1));
} else {
  log(`\nchecked ${byUrl.size} unique urls across ${nodes.length} nodes`);
  if (redirected.length) {
    log(`\n→ ${redirected.length} redirect(s) (fine, but the canonical url is better):`);
    for (const r of redirected.slice(0, 10)) log(`   ${r.url}\n     → ${r.final}`);
  }
  if (mislabelled.length) {
    log(`\n! ${mislabelled.length} source label(s) do not match the real publisher:`);
    for (const m of mislabelled) log(`   ${m.url}\n     declared "${m.declared}" but is "${m.actual}"`);
  }
  if (broken.length) {
    log(`\n✗ ${broken.length} broken:`);
    for (const b of broken) log(`   [${b.status || 'ERR'}] ${b.url}\n     cited by: ${b.nodes.join(', ')}${b.note ? `\n     ${b.note}` : ''}`);
  } else {
    log('\n✓ every link resolves');
  }
}
process.exit(broken.length || mislabelled.length ? 1 : 0);
