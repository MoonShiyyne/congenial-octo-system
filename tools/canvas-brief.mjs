#!/usr/bin/env node
/**
 * Canvas prep briefs — reads a Canvas LMS account and writes a short brief for
 * every course and every assignment, plus one cross-course index.
 *
 * The problem it solves is not that Canvas hides things. It is that Canvas
 * shows each thing on its own page: the weighting is on the grades tab, the
 * rubric is behind a link, the readings are in Modules, the deadline change is
 * in Announcements, and the only place they are ever assembled is in a
 * student's head at 11pm. This assembles them on disk instead.
 *
 * Usage
 *   node tools/canvas-brief.mjs --demo
 *   node tools/canvas-brief.mjs --host school.instructure.com --token $CANVAS_TOKEN
 *   node tools/canvas-brief.mjs --snapshot out/canvas/snapshot.json     # re-render, no network
 *
 * Options
 *   --host <host>          Canvas host, e.g. school.instructure.com
 *   --token <token>        API token (or set CANVAS_TOKEN / CANVAS_API_TOKEN)
 *   --out <dir>            output directory (default out/canvas)
 *   --snapshot <file>      analyse a saved snapshot instead of fetching
 *   --save-snapshot        keep the raw pull alongside the briefs
 *   --course <text>        only courses whose name or code contains this
 *   --term <text>          only courses in a term whose name contains this
 *   --include-concluded    include finished terms
 *   --horizon <days>       how far ahead the radar looks (default 21)
 *   --demo                 run against the bundled sample course data
 *   --no-html              skip the dashboard, write markdown only
 *   --quiet                errors only
 *
 * Getting a token: Canvas → Account → Settings → New Access Token. It grants
 * everything your account can see, so treat it like a password: pass it in an
 * environment variable, never on a shared machine's command line, and delete
 * it from Canvas when you are done.
 */
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { fetchSnapshot } from './canvas/fetch.mjs';
import { analyse } from './canvas/analyse.mjs';
import { courseBrief, assignmentBrief, indexBrief } from './canvas/render.mjs';
import { dashboard } from './canvas/dashboard.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ── arguments ──────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const flag = name => argv.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};

if (flag('help') || flag('h')) {
  const header = await readFile(fileURLToPath(import.meta.url), 'utf8');
  console.log(header.match(/\/\*\*([\s\S]*?)\*\//)[1].replace(/^ \* ?/gm, '').trim());
  process.exit(0);
}

const QUIET = flag('quiet');
const log = (...a) => { if (!QUIET) console.error(...a); };
const OUT = join(ROOT, opt('out', 'out/canvas'));
const HORIZON = Number(opt('horizon', 21)) || 21;

// ── the snapshot ───────────────────────────────────────────────────────────

let snapshot;
if (flag('demo')) {
  log('Running on the bundled sample data — three courses, no network, nothing personal.\n');
  snapshot = JSON.parse(await readFile(join(ROOT, 'data/canvas-demo.json'), 'utf8'));
} else if (opt('snapshot')) {
  const path = join(ROOT, opt('snapshot'));
  log(`Re-reading ${opt('snapshot')} — no network.\n`);
  snapshot = JSON.parse(await readFile(path, 'utf8'));
} else {
  const host = opt('host', process.env.CANVAS_HOST);
  const token = opt('token', process.env.CANVAS_TOKEN ?? process.env.CANVAS_API_TOKEN);
  if (!host || !token) {
    console.error(`Needs a Canvas host and an API token.

  export CANVAS_HOST=school.instructure.com
  export CANVAS_TOKEN=...        # Canvas → Account → Settings → New Access Token
  node tools/canvas-brief.mjs

Or try it with no account at all:

  node tools/canvas-brief.mjs --demo
`);
    process.exit(2);
  }
  if (argv.includes('--token')) {
    log('Note: a token on the command line lands in your shell history. CANVAS_TOKEN is safer.\n');
  }
  snapshot = await fetchSnapshot({
    host, token,
    termFilter: opt('term'), courseFilter: opt('course'),
    includeConcluded: flag('include-concluded'), log,
  });
}

// ── analyse and write ──────────────────────────────────────────────────────

const result = analyse(snapshot, { horizonDays: HORIZON });

await rm(join(OUT, 'courses'), { recursive: true, force: true });
await mkdir(join(OUT, 'courses'), { recursive: true });

const written = [];
const write = async (rel, body) => {
  await mkdir(dirname(join(OUT, rel)), { recursive: true });
  await writeFile(join(OUT, rel), body);
  written.push(rel);
};

await write('README.md', indexBrief(result));

for (const course of result.courses) {
  const dir = `courses/${slug(course.code)}`;
  await write(`${dir}/course-brief.md`, courseBrief(course));
  for (const a of course.assignments) {
    await write(`${dir}/assignments/${dueKey(a)}${slug(a.name)}.md`, assignmentBrief(a));
  }
}

if (!flag('no-html')) await write('dashboard.html', dashboard(result));
if (flag('save-snapshot') || flag('demo')) {
  await write('snapshot.json', JSON.stringify(snapshot, null, 1) + '\n');
}
await write('briefs.json', JSON.stringify(result, null, 1) + '\n');

// ── report ─────────────────────────────────────────────────────────────────

const { counts, radar } = result;
log('');
log(`wrote ${written.length} files to ${opt('out', 'out/canvas')}/`);
log(`  ${counts.courses} course briefs · ${counts.assignments} assignment briefs`);
if (radar.overdue.length) log(`  ${radar.overdue.length} past due and unsubmitted`);
if (radar.startNow.length) log(`  ${radar.startNow.length} worth starting today`);
if (result.announcements.needsAttention.length) {
  log(`  ${result.announcements.needsAttention.length} announcement(s) that may have moved a deadline`);
}
if (result.schedule.conflicts.length) log(`  ${result.schedule.conflicts.length} timetable clash(es)`);
const gaps = result.courses.reduce((s, c) => s + c.health.length, 0);
if (gaps) log(`  ${gaps} thing(s) the briefs could not establish — each course brief lists its own`);
log('');
log(`  start here → ${opt('out', 'out/canvas')}/README.md`);
if (!flag('no-html')) log(`  or open   → ${opt('out', 'out/canvas')}/dashboard.html`);

// ── helpers ────────────────────────────────────────────────────────────────

function slug(s) {
  return String(s ?? 'untitled').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'untitled';
}

/** Due date first, so the directory sorts into the order you will do them. */
function dueKey(a) {
  if (!a.due) return 'zz-undated-';
  const d = new Date(a.due);
  return Number.isNaN(d.getTime()) ? 'zz-undated-' : `${d.toISOString().slice(0, 10)}-`;
}
