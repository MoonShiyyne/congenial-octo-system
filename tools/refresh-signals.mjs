#!/usr/bin/env node
/**
 * Refreshes data/signals.json from the feeds in data/sources.json.
 *
 * Every source is best-effort: a failure is recorded in `sourceStatus` and the
 * remaining sources still refresh, so one dead endpoint never empties the
 * sidebar. Items are scored against data/keywords.mjs to attach them to
 * curriculum nodes; items that also match an application cue are flagged as
 * candidate new applications and surfaced on the node they touch.
 *
 * Usage:  node tools/refresh-signals.mjs [--dry-run]
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry-run');

const MAX_ITEMS = 90;          // cap the committed file size
const MAX_AGE_DAYS = 120;      // drop anything older
const MATCH_THRESHOLD = 3;     // min keyword score to attach to a node
const MAX_NODES_PER_ITEM = 3;

const { nodeKeywords, applicationCues } = await import('../data/keywords.mjs');
const { nodes } = await import('../data/curriculum.mjs');
const nodeTitle = Object.fromEntries(nodes.map(n => [n.id, n.title]));
const nodeDisc  = Object.fromEntries(nodes.map(n => [n.id, n.d]));

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function get(url, { json = false, attempts = 3 } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': 'progression-web-signals/1.0 (+github actions)' },
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return json ? await res.json() : await res.text();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await sleep(2000 * 2 ** i);   // 2s, 4s
    }
  }
  throw lastErr;
}

const clean = s => String(s ?? '').replace(/\s+/g, ' ').trim();
const trunc = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
const hash = s => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
};

// ── parsers ────────────────────────────────────────────────────────────────

/** Markdown changelog: `## <version>` followed by `- entry` bullets. */
function parseChangelog(text, src) {
  const out = [];
  const sections = text.split(/^## +/m).slice(1, (src.maxVersions ?? 6) + 1);
  for (const section of sections) {
    const [head, ...rest] = section.split('\n');
    const version = clean(head).split(/\s/)[0];
    const bullets = rest.join('\n').match(/^[-*] +.+$/gm) ?? [];
    for (const b of bullets) {
      const title = clean(b.replace(/^[-*] +/, '').replace(/`/g, ''));
      if (title.length < 25) continue;
      out.push({
        title: trunc(title, 220),
        summary: '',
        url: src.url.replace('raw.githubusercontent.com', 'github.com')
                    .replace('/main/', '/blob/main/'),
        badge: version,
      });
    }
  }
  return out;
}

/** Hacker News via the Algolia API. */
function parseHN(data, src) {
  return (data.hits ?? [])
    .filter(h => (h.points ?? 0) >= (src.minPoints ?? 0) && h.title)
    .map(h => ({
      title: clean(h.title),
      summary: '',
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      date: h.created_at,
      badge: `${h.points ?? 0} pts`,
      discussion: `https://news.ycombinator.com/item?id=${h.objectID}`,
    }));
}

/** arXiv Atom feed — regex-parsed to avoid an XML dependency. */
function parseArxiv(xml) {
  const out = [];
  for (const entry of xml.split('<entry>').slice(1)) {
    const pick = tag => clean((entry.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`)) ?? [])[1] ?? '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    const title = pick('title');
    if (!title) continue;
    out.push({
      title: trunc(title, 200),
      summary: trunc(pick('summary'), 320),
      url: pick('id'),
      date: pick('published'),
      badge: 'preprint',
    });
  }
  return out;
}

// ── classification ─────────────────────────────────────────────────────────

function attachNodes(text) {
  const hay = text.toLowerCase();
  const scored = [];
  for (const [id, terms] of Object.entries(nodeKeywords)) {
    let score = 0;
    for (const [w, term] of terms) if (hay.includes(term)) score += w;
    if (score >= MATCH_THRESHOLD) scored.push({ id, score });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, MAX_NODES_PER_ITEM);
}

const isApplication = text => {
  const hay = text.toLowerCase();
  return applicationCues.some(c => hay.includes(c));
};

// ── main ───────────────────────────────────────────────────────────────────

const { sources } = JSON.parse(await readFile(join(ROOT, 'data/sources.json'), 'utf8'));
const items = [];
const sourceStatus = [];

for (const src of sources) {
  try {
    let raw;
    if (src.kind === 'hn-algolia') raw = parseHN(await get(src.url, { json: true }), src);
    else if (src.kind === 'arxiv') raw = parseArxiv(await get(src.url));
    else raw = parseChangelog(await get(src.url), src);

    let kept = 0;
    for (const r of raw) {
      const text = `${r.title} ${r.summary}`;
      const matches = attachNodes(text);
      if (!matches.length) continue;          // no node → not a signal for this web
      items.push({
        id: hash(r.url + r.title),
        title: r.title,
        summary: r.summary,
        url: r.url,
        discussion: r.discussion,
        source: src.label,
        sourceId: src.id,
        category: src.category,
        badge: r.badge,
        date: r.date ?? null,
        nodes: matches.map(m => m.id),
        relevance: matches[0].score * (src.weight ?? 1),
        application: isApplication(text),
      });
      kept++;
    }
    sourceStatus.push({ id: src.id, label: src.label, ok: true, fetched: raw.length, kept });
    console.error(`✓ ${src.label}: ${raw.length} fetched, ${kept} matched`);
  } catch (err) {
    sourceStatus.push({ id: src.id, label: src.label, ok: false, error: String(err.message ?? err) });
    console.error(`✗ ${src.label}: ${err.message ?? err}`);
  }
}

// Per-source quota, then merge. A single comparator across dated feeds and
// undated changelogs would be non-transitive and produce arbitrary ordering,
// so each source is ranked in its own terms and then capped.
const cutoff = Date.now() - MAX_AGE_DAYS * 864e5;
const limitFor = Object.fromEntries(sources.map(s => [s.id, s.limit ?? 10]));
const seen = new Set();
const bySource = new Map();

for (const i of items) {
  if (i.date && Date.parse(i.date) < cutoff) continue;
  if (seen.has(i.id)) continue;
  seen.add(i.id);
  (bySource.get(i.sourceId) ?? bySource.set(i.sourceId, []).get(i.sourceId)).push(i);
}

const ranked = [];
for (const [sourceId, list] of bySource) {
  list.sort((a, b) => {
    // Within one source every item is the same shape, so this is consistent.
    const ta = a.date ? Date.parse(a.date) : null;
    const tb = b.date ? Date.parse(b.date) : null;
    if (ta !== null && tb !== null && ta !== tb) return tb - ta;
    return b.relevance - a.relevance;
  });
  ranked.push(...list.slice(0, limitFor[sourceId] ?? 10));
}

// Present newest-first where dates exist; undated changelog entries follow,
// ordered by relevance. Two stable passes, never one mixed comparator.
const dated   = ranked.filter(i => i.date).sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
const undated = ranked.filter(i => !i.date).sort((a, b) => b.relevance - a.relevance);
const final   = [...dated, ...undated].slice(0, MAX_ITEMS);

// index: node → signal ids, so the graph can mark nodes with fresh activity
const byNode = {};
for (const i of final) for (const n of i.nodes) (byNode[n] ??= []).push(i.id);

const applications = final
  .filter(i => i.application && i.nodes.length)
  .slice(0, 24)
  .map(i => ({ id: i.id, node: i.nodes[0], nodeTitle: nodeTitle[i.nodes[0]],
               discipline: nodeDisc[i.nodes[0]], title: i.title, url: i.url }));

const payload = {
  generated: new Date().toISOString(),
  itemCount: final.length,
  sourceStatus,
  items: final,
  byNode,
  applications,
};

if (DRY) {
  console.error(`\n[dry run] ${final.length} items · ${Object.keys(byNode).length} nodes touched · ${applications.length} applications`);
} else {
  await writeFile(join(ROOT, 'data/signals.json'), JSON.stringify(payload, null, 1) + '\n');
  console.error(`\nwrote data/signals.json — ${final.length} items, ${Object.keys(byNode).length} nodes touched, ${applications.length} applications`);
}
