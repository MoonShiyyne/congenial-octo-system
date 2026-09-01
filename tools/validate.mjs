#!/usr/bin/env node
/**
 * Guards the two files the page depends on. Run in CI after a refresh so a
 * malformed or empty payload never lands on the site.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const fail = [];
const check = (cond, msg) => { if (!cond) fail.push(msg); };

// ── curriculum ───────────────────────────────────────────────────────────
const { disciplines, levels, nodes } = await import('../data/curriculum.mjs');
const ids = new Set(nodes.map(n => n.id));
const discIds = new Set(disciplines.map(d => d.id));
const lvlNums = new Set(levels.map(l => l.n));

check(ids.size === nodes.length, 'duplicate node ids');
for (const n of nodes) {
  for (const f of ['title', 'tag', 'hook', 'what', 'insight']) {
    check(typeof n[f] === 'string' && n[f].length > 0, `${n.id}: missing ${f}`);
  }
  check(n.example?.code && n.example?.lang && n.example?.label, `${n.id}: incomplete example`);
  check(discIds.has(n.d), `${n.id}: unknown discipline "${n.d}"`);
  check(lvlNums.has(n.lvl), `${n.id}: unknown level ${n.lvl}`);
  for (const p of n.prereq ?? []) {
    check(ids.has(p), `${n.id}: prereq "${p}" does not exist`);
    const parent = nodes.find(x => x.id === p);
    check(!parent || parent.lvl <= n.lvl, `${n.id}: prereq "${p}" is at a higher level`);
  }
}
// every discipline needs at least one entry point, or its sector floats free
for (const d of discIds) {
  check(nodes.some(n => n.d === d && !(n.prereq ?? []).length),
        `discipline "${d}" has no level-1 entry point`);
}

// ── resources ────────────────────────────────────────────────────────────
const { resources } = await import('../data/resources.mjs');
for (const key of Object.keys(resources)) check(ids.has(key), `resources: unknown node "${key}"`);
for (const n of nodes) {
  const list = resources[n.id];
  check(Array.isArray(list) && list.length > 0, `${n.id}: no reference material`);
  for (const r of list ?? []) {
    check(r.t && r.u && r.k && r.src, `${n.id}: incomplete resource entry`);
    check(/^https:\/\//.test(r.u ?? ''), `${n.id}: resource url is not https — ${r.u}`);
    check(['docs', 'post', 'guide', 'talk'].includes(r.k), `${n.id}: unknown resource kind "${r.k}"`);
  }
}

// ── primers ──────────────────────────────────────────────────────────────
const { primers } = await import('../data/primers.mjs');
for (const [key, p] of Object.entries(primers)) {
  check(ids.has(key), `primers: unknown node "${key}"`);
  check(typeof p.lead === 'string' && p.lead.length > 0, `${key}: primer has no lead`);
  check(Array.isArray(p.items) && p.items.length >= 3, `${key}: primer needs at least 3 items`);
  for (const i of p.items ?? []) {
    check(i.n && i.d, `${key}: primer item missing name or description`);
    check((i.d ?? '').length < 240, `${key}: primer item "${i.n}" is too long to be plain terms`);
  }
}

// ── scenarios ────────────────────────────────────────────────────────────
const { scenarios } = await import('../data/scenarios.mjs');
const seenScenario = new Set();
for (const q of scenarios) {
  check(ids.has(q.n), `scenario: unknown node "${q.n}"`);
  for (const f of ['s', 'why', 'vs']) check(q[f]?.length > 0, `scenario for ${q.n}: missing ${f}`);
  check(!seenScenario.has(q.s), `duplicate scenario text under ${q.n}`);
  seenScenario.add(q.s);
  // Distractors are what make the question teach; random ones would not.
  check((q.near ?? []).length > 0, `scenario for ${q.n}: no distractors`);
  for (const p of q.near ?? []) {
    check(ids.has(p), `scenario for ${q.n}: unknown distractor "${p}"`);
    check(p !== q.n, `scenario for ${q.n}: lists itself as a distractor`);
  }
  check(new Set(q.near).size === (q.near ?? []).length, `scenario for ${q.n}: duplicate distractors`);
}
for (const n of nodes) {
  check(scenarios.some(q => q.n === n.id), `${n.id}: no tutor scenario`);
}

// ── capstones ────────────────────────────────────────────────────────────
const { capstones } = await import('../data/capstones.mjs');
check(capstones.length === disciplines.length, 'every discipline needs a capstone');
for (const cap of capstones) {
  check(discIds.has(cap.d), `capstone: unknown discipline "${cap.d}"`);
  for (const f of ['title', 'tagline', 'brief']) check(cap[f]?.length > 0, `capstone ${cap.d}: missing ${f}`);
  check(cap.proof?.length >= 4, `capstone ${cap.d}: needs at least 4 proof criteria`);
  check(cap.traps?.length >= 4, `capstone ${cap.d}: needs at least 4 traps`);
  check(cap.stages?.length >= 4, `capstone ${cap.d}: needs at least 4 stages`);

  // Anchors must sit at the discipline's highest tier — a capstone that caps
  // something below the summit is not capping the line.
  const top = Math.max(...nodes.filter(n => n.d === cap.d).map(n => n.lvl));
  for (const a of cap.anchors ?? []) {
    check(ids.has(a), `capstone ${cap.d}: unknown anchor "${a}"`);
    const an = nodes.find(n => n.id === a);
    check(!an || an.d === cap.d, `capstone ${cap.d}: anchor "${a}" is in another discipline`);
    check(!an || an.lvl === top, `capstone ${cap.d}: anchor "${a}" is not at the top tier (${top})`);
  }

  // The check-for-understanding only works if it exercises the whole line.
  const exercised = new Set((cap.stages ?? []).flatMap(st => st.nodes ?? []));
  for (const n of exercised) check(ids.has(n), `capstone ${cap.d}: unknown node "${n}" in a stage`);
  for (const n of nodes.filter(n => n.d === cap.d)) {
    check(exercised.has(n.id), `capstone ${cap.d}: never exercises ${n.id}`);
  }
  for (const st of cap.stages ?? []) {
    check(st.n?.length > 0 && st.d?.length > 0, `capstone ${cap.d}: a stage is missing its name or description`);
    check((st.nodes ?? []).length > 0, `capstone ${cap.d}: stage "${st.n}" exercises no nodes`);
  }
}

// ── glossary ─────────────────────────────────────────────────────────────
const { glossary, assumedFor } = await import('../data/glossary.mjs');
const gIds = new Set();
for (const g of glossary) {
  check(!gIds.has(g.id), `glossary: duplicate id "${g.id}"`);
  gIds.add(g.id);
  check(g.t?.length > 0 && g.d?.length > 0, `glossary ${g.id}: missing term or definition`);
  check(['vocab', 'system'].includes(g.k), `glossary ${g.id}: unknown kind "${g.k}"`);
  check(Array.isArray(g.m) && g.m.length > 0 && g.m.every(r => r instanceof RegExp),
        `glossary ${g.id}: patterns must be a non-empty array of RegExp`);
  check((g.d ?? '').length < 260, `glossary ${g.id}: definition is too long to be a quick explainer`);
}

// An entry that surfaces nowhere is either a broken pattern or clutter. One
// that matches a node but is suppressed by that node's primer is working
// correctly — distinguish them, and only fail on the first.
const gnorm = x => String(x).toLowerCase().replace(/[^a-z0-9]/g, '');
for (const g of glossary) {
  const matchesSomething = nodes.some(n => {
    const text = [n.hook, n.what, n.insight, n.example?.label, n.example?.code].filter(Boolean).join('\n');
    return g.m.some(rx => rx.test(text));
  });
  check(matchesSomething, `glossary ${g.id}: matches no node text — broken pattern or unused entry`);
}
// Nothing may be defined twice on the same node.
for (const n of nodes) {
  const defined = new Set((primers[n.id]?.items ?? []).map(i => gnorm(i.n)));
  for (const g of assumedFor(n, primers[n.id])) {
    check(!defined.has(gnorm(g.t)), `${n.id}: "${g.t}" appears in both its primer and its assumed background`);
  }
}

// ── diagrams ─────────────────────────────────────────────────────────────
const { diagrams } = await import('../data/diagrams.mjs');
const markerIds = new Set();
for (const [id, fig] of Object.entries(diagrams)) {
  check(ids.has(id), `diagram: unknown node "${id}"`);
  check(fig.caption?.length > 0, `diagram ${id}: no caption`);
  check(fig.alt?.length > 0, `diagram ${id}: no alt text`);
  check(/^<svg /.test(fig.svg?.trim() ?? ''), `diagram ${id}: does not start with <svg`);
  check(/viewBox="0 0 \d+ \d+"/.test(fig.svg ?? ''), `diagram ${id}: missing a numeric viewBox`);
  check(/role="img"/.test(fig.svg ?? ''), `diagram ${id}: missing role="img"`);
  check(/aria-label="/.test(fig.svg ?? ''), `diagram ${id}: missing aria-label`);
  // Self-contained: no script, style, foreignObject or external references.
  for (const banned of ['<script', '<style', '<foreignObject', 'xlink:href', 'http://', 'https://']) {
    check(!(fig.svg ?? '').includes(banned), `diagram ${id}: contains "${banned}"`);
  }
  // Every figure lands in the same document, so a bare id="arrow" would collide.
  for (const m of (fig.svg ?? '').matchAll(/id="([^"]+)"/g)) {
    check(!markerIds.has(m[1]), `diagram ${id}: marker id "${m[1]}" collides with another figure`);
    markerIds.add(m[1]);
  }
}

// ── signals ──────────────────────────────────────────────────────────────
try {
  const s = JSON.parse(await readFile(join(ROOT, 'data/signals.json'), 'utf8'));
  check(Array.isArray(s.items), 'signals.items is not an array');
  check(s.items.length > 0, 'signals.items is empty — every source failed');
  check(!Number.isNaN(Date.parse(s.generated)), 'signals.generated is not a date');
  check((s.sourceStatus ?? []).some(r => r.ok), 'no source succeeded');
  for (const i of s.items) {
    check(typeof i.url === 'string' && /^https?:\/\//.test(i.url), `signal ${i.id}: bad url`);
    for (const n of i.nodes ?? []) check(ids.has(n), `signal ${i.id}: unknown node "${n}"`);
  }
  for (const n of Object.keys(s.byNode ?? {})) check(ids.has(n), `byNode: unknown node "${n}"`);
} catch (err) {
  fail.push(`signals.json unreadable: ${err.message}`);
}

if (fail.length) {
  console.error('✗ validation failed:\n' + fail.map(f => '  · ' + f).join('\n'));
  process.exit(1);
}
const refCount = Object.values(resources).flat().length;
const primerCount = Object.values(primers).reduce((a, p) => a + p.items.length, 0);
console.error(`✓ ${nodes.length} nodes, ${disciplines.length} disciplines, ${levels.length} levels, ${refCount} references, ${primerCount} primer entries, ${scenarios.length} scenarios, ${capstones.length} capstones, ${glossary.length} glossary entries, ${Object.keys(diagrams).length} diagrams — valid`);
