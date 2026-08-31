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
console.error(`✓ ${nodes.length} nodes, ${disciplines.length} disciplines, ${levels.length} levels — valid`);
