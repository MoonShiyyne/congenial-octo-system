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
console.error(`✓ ${nodes.length} nodes, ${disciplines.length} disciplines, ${levels.length} levels, ${refCount} references, ${primerCount} primer entries — valid`);
