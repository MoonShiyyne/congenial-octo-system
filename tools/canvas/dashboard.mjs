/**
 * The whole result as one self-contained HTML file: no build, no network, no
 * fonts to fetch. It is written to disk next to the markdown and opened with a
 * double click, which matters because the data in it is the user's own
 * coursework and it should never need a server to read.
 *
 * The layout answers the questions in the order a student actually has them:
 * what is due, what should I start, what changed, when do I have to be
 * somewhere, and only then the per-course detail.
 */
import { DAY_ORDER } from './syllabus.mjs';
import { fmtDate, fmtDateTime, relative } from './render.mjs';

const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const link = (href, text) => href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(text)}</a>` : esc(text);

export function dashboard(result) {
  const { radar, schedule, announcements, workload, counts } = result;
  const now = Date.parse(result.generated);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Canvas prep briefs</title>
<style>${CSS}</style>
</head>
<body>
<header>
  <h1>Canvas prep briefs</h1>
  <p class="sub">${counts.courses} courses · ${counts.assignments} assignments · generated ${esc(fmtDateTime(result.generated))}${result.host ? ` from ${esc(hostname(result.host))}` : ''}</p>
</header>

<main>
${section('Past due, not submitted', radar.overdue.length ? table(
  ['Due', 'Course', 'Assignment', 'Worth'],
  radar.overdue.map(b => [
    `${esc(fmtDate(b.due))} <span class="rel late">${esc(relative(b.due, now))}</span>`,
    esc(b.course), link(b.url, b.name), pct(b.impact.percent),
  ]), ['', '', '', 'num']) : null, 'danger')}

${section(`Start these now`, radar.startNow.length ? `
  <p class="note">Their estimated start date has passed and they are still open. The estimate is a planning prior, not a prediction.</p>
  ${table(['Course', 'Assignment', 'Due', 'Worth', 'Est. work'],
    radar.startNow.slice(0, 12).map(b => [
      esc(b.course), link(b.url, b.name),
      `${esc(fmtDate(b.due))} <span class="rel">${esc(relative(b.due, now))}</span>`,
      pct(b.impact.percent), esc(b.effort.range),
    ]), ['', '', '', 'num', 'num'])}` : null, 'warn')}

${section('Announcements that may have moved a deadline', announcements.needsAttention.length ? `
  <p class="note">Flagged on wording, not read. Thirty seconds of your own eyes each.</p>
  <ul class="cards">${announcements.needsAttention.map(a => `
    <li><div class="card-head"><span class="pill">${esc(a.course)}</span> ${link(a.url, a.title)}</div>
    <div class="meta">${esc(fmtDate(a.posted))}</div>
    <p>${esc(a.summary)}</p></li>`).join('')}</ul>` : null, 'warn')}

${section(`Due in the next ${radar.horizonDays} days`, radar.upcoming.length ? table(
  ['Due', 'Course', 'Assignment', 'Worth', 'Start by'],
  radar.upcoming.map(b => [
    `${esc(fmtDate(b.due))} <span class="rel">${esc(relative(b.due, now))}</span>`,
    esc(b.course), link(b.url, b.name), pct(b.impact.percent),
    b.startBy ? esc(fmtDate(b.startBy)) : '—',
  ]), ['', '', '', 'num', '']) : '<p class="note">Nothing due in that window.</p>')}

${section('The week', weekGrid(schedule))}

${section('Where the term gets heavy', workloadChart(workload))}

${section('Fixed dates from every syllabus', result.termCalendar.length ? `
  <ul class="dates">${result.termCalendar.map(k => `
    <li><span class="pill">${esc(k.course)}</span> <b>${esc(k.date)}</b> ${esc(k.text)}
    <span class="tag ${k.kind === 'no class' ? 'muted' : ''}">${esc(k.kind)}</span></li>`).join('')}</ul>
  <p class="note">Read out of syllabus prose — confirm anything you would plan around.</p>` : null)}

<h2 class="rule">Courses</h2>
${result.courses.map(c => courseCard(c, now)).join('')}
</main>

<footer>
  <p>Generated from Canvas by <code>tools/canvas-brief.mjs</code>. Grade shares come from Canvas's own
  assignment-group weights where the course uses them, and are labelled where they do not. Effort
  and start dates are estimates. Nothing here replaces the assignment page.</p>
</footer>
</body>
</html>
`;
}

// ── pieces ─────────────────────────────────────────────────────────────────

const section = (title, body, tone = '') =>
  body == null ? '' : `<section class="${tone}"><h2>${esc(title)}</h2>${body}</section>`;

const pct = n => n ? `<b>${n}%</b>` : '<span class="muted">—</span>';

function table(head, rows, align = []) {
  return `<table>
<thead><tr>${head.map((h, i) => `<th class="${align[i] ?? ''}">${esc(h)}</th>`).join('')}</tr></thead>
<tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td class="${align[i] ?? ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody>
</table>`;
}

function weekGrid({ byDay, conflicts }) {
  const busy = DAY_ORDER.filter(d => byDay[d].length);
  if (!busy.length) return '<p class="note">No meeting time could be established for any course.</p>';
  return `<div class="week">${busy.map(d => `
    <div class="day"><h3>${d}</h3>${byDay[d].map(s => `
      <div class="slot"><b>${esc(s.course)}</b><span>${esc(s.time ?? '')}</span>
      ${s.location ? `<span class="muted">${esc(s.location)}</span>` : ''}
      <span class="tag muted">${esc(s.kind)}</span></div>`).join('')}</div>`).join('')}</div>
  ${conflicts.length ? `<p class="note warn-text"><b>Clashes:</b> ${conflicts.map(k => esc(`${k.day} — ${k.a} overlaps ${k.b}`)).join('; ')}</p>` : ''}`;
}

function workloadChart({ weeks, peak }) {
  const active = weeks.filter(w => w.count);
  if (!active.length) return '<p class="note">Nothing dated to chart.</p>';
  const max = Math.max(...active.map(w => w.hours), 1);
  return `<div class="bars">${weeks.map(w => `
    <div class="bar-row">
      <span class="bar-label">${esc(w.from.slice(5))}</span>
      <span class="bar-track"><span class="bar-fill${peak && w.from === peak.from ? ' peak' : ''}" style="width:${Math.round((w.hours / max) * 100)}%"></span></span>
      <span class="bar-val">${w.hours ? `${w.hours} h · ${w.weight}%` : ''}</span>
    </div>`).join('')}</div>
  <p class="note">Estimated hours per week, by due date, and the share of the final grade riding on that week.</p>`;
}

function courseCard(c, now) {
  const s = c.syllabus;
  const next = c.assignments.filter(a => a.due && Date.parse(a.due) >= now).slice(0, 5);
  return `<section class="course">
  <h3>${link(c.url, c.code)}${c.code !== c.name ? ` <span class="muted">${esc(c.name)}</span>` : ''}</h3>
  ${s.meetings.length ? `<p class="meet">${s.meetings.map(m =>
    `<span class="slot inline"><b>${esc(m.kind)}</b> ${esc(m.days.join(' '))} ${esc(m.time ?? '')}${m.location ? ` · ${esc(m.location)}` : ''}</span>`).join('')}</p>` : ''}

  <div class="cols">
    <div>
      <h4>Grade</h4>
      ${s.grading.rows.length ? `<ul class="weights">${[...s.grading.rows].sort((a, b) => b.weight - a.weight)
        .map(r => `<li><span class="wbar" style="width:${Math.min(r.weight, 100)}%"></span><span>${esc(r.label)}</span><b>${r.weight}%</b></li>`).join('')}</ul>
      <p class="note">Source: ${esc(sourceLabel(s.grading.source))}</p>` :
      `<p class="note">No weighting published — ${c.courseTotal} points across the course.</p>`}
      ${s.grading.conflicts.length ? `<p class="note warn-text"><b>Canvas and the syllabus disagree:</b>
        ${s.grading.conflicts.map(k => esc(`${k.label} — Canvas ${k.canvas}%, syllabus ${k.syllabus}%`)).join('; ')}. Worth one email.</p>` : ''}
    </div>
    <div>
      <h4>Policies with a cost</h4>
      ${s.policies.length ? `<ul class="policies">${s.policies.map(p => `
        <li><b>${esc(p.label)}</b>${p.teeth.length ? ` <span class="teeth">${p.teeth.map(t => `<code>${esc(t)}</code>`).join(' ')}</span>` : ''}
        <p>${esc(p.text)}</p></li>`).join('')}</ul>` : '<p class="note">None found in the syllabus text.</p>'}
    </div>
  </div>

  ${next.length ? `<h4>Next up</h4>${table(['Due', 'Assignment', 'Worth', 'Start by', 'Watch for'],
    next.map(a => [
      `${esc(fmtDate(a.due))} <span class="rel">${esc(relative(a.due, now))}</span>`,
      link(a.url, a.name), pct(a.impact.percent),
      a.startBy ? esc(fmtDate(a.startBy)) : '—',
      a.flags.length ? `<span class="muted">${esc(a.flags[0])}</span>` : '',
    ]), ['', '', 'num', '', ''])}` : ''}

  ${s.materials.items.length ? `<h4>What you need</h4><ul class="dates">${s.materials.items.map(m =>
    `<li>${m.required ? '' : '<span class="tag muted">optional</span> '}${esc(m.title)}</li>`).join('')}</ul>` : ''}

  ${c.health.length ? `<details><summary>What this brief could not establish (${c.health.length})</summary>
    <ul class="note">${c.health.map(h => `<li>${esc(h)}</li>`).join('')}</ul></details>` : ''}
</section>`;
}

const sourceLabel = src =>
  src === 'canvas' ? "Canvas's own group weights — this is what it computes with"
  : src === 'syllabus' ? 'scraped from the syllabus text — confirm it'
  : 'total points';

const hostname = h => { try { return new URL(h).hostname; } catch { return h; } };

// ── style ──────────────────────────────────────────────────────────────────

const CSS = `
:root {
  --bg: #fbfaf8; --fg: #1a1a19; --muted: #6d6a65; --line: #e2ded6;
  --card: #fff; --accent: #7a5cff; --warn: #b26a00; --warn-bg: #fff8ec;
  --danger: #b3261e; --danger-bg: #fdf0ef; --bar: #cfc6f5;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #16151a; --fg: #eceaf2; --muted: #9b96a5; --line: #2e2c36;
    --card: #1e1d24; --accent: #a996ff; --warn: #e8b060; --warn-bg: #241f16;
    --danger: #ff8f85; --danger-bg: #2a1917; --bar: #4a3f80;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0; background: var(--bg); color: var(--fg);
  font: 15px/1.55 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}
header, main, footer { max-width: 1080px; margin: 0 auto; padding: 0 24px; }
header { padding-top: 40px; padding-bottom: 8px; }
h1 { font-size: 26px; margin: 0 0 4px; letter-spacing: -0.02em; }
h2 { font-size: 17px; margin: 0 0 12px; letter-spacing: -0.01em; }
h3 { font-size: 15px; margin: 0 0 8px; }
h4 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.07em; color: var(--muted);
     margin: 18px 0 8px; font-weight: 600; }
.sub, .note, .meta { color: var(--muted); font-size: 13px; }
.note { margin: 8px 0 0; }
.muted { color: var(--muted); font-weight: 400; }
.warn-text { color: var(--warn); }
section { background: var(--card); border: 1px solid var(--line); border-radius: 10px;
          padding: 18px 20px; margin: 16px 0; }
section.warn { border-color: color-mix(in srgb, var(--warn) 40%, var(--line)); background: var(--warn-bg); }
section.danger { border-color: color-mix(in srgb, var(--danger) 40%, var(--line)); background: var(--danger-bg); }
h2.rule { max-width: 1080px; margin: 34px auto 4px; padding: 0; border-top: 1px solid var(--line);
          padding-top: 20px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); }
a { color: inherit; text-decoration: underline; text-decoration-color: color-mix(in srgb, currentColor 35%, transparent);
    text-underline-offset: 2px; }
a:hover { text-decoration-color: currentColor; }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th, td { text-align: left; padding: 7px 16px 7px 0; border-bottom: 1px solid var(--line); vertical-align: top; }
th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); font-weight: 600; }
td.num, th.num { text-align: right; white-space: nowrap; }
tr > :last-child { padding-right: 0; }
tbody tr:last-child td { border-bottom: 0; }
.rel { color: var(--muted); font-size: 12px; white-space: nowrap; }
.rel.late { color: var(--danger); }
.pill { display: inline-block; background: color-mix(in srgb, var(--accent) 14%, transparent);
        color: var(--accent); border-radius: 4px; padding: 1px 6px; font-size: 11px;
        font-weight: 600; letter-spacing: 0.02em; }
.tag { font-size: 11px; color: var(--muted); border: 1px solid var(--line); border-radius: 4px; padding: 0 5px; }
ul { margin: 0; padding-left: 0; list-style: none; }
.cards li { border-top: 1px solid var(--line); padding: 10px 0; }
.cards li:first-child { border-top: 0; }
.cards p { margin: 4px 0 0; font-size: 13px; }
.card-head { display: flex; gap: 8px; align-items: baseline; }
.dates li { padding: 4px 0; font-size: 14px; display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; }
.week { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; }
.day h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.07em; color: var(--muted); margin-bottom: 6px; }
.slot { display: flex; flex-direction: column; gap: 1px; font-size: 13px; padding: 7px 9px;
        border-radius: 7px; background: color-mix(in srgb, var(--accent) 8%, transparent);
        border: 1px solid var(--line); margin-bottom: 6px; }
.slot span { font-size: 12px; }
.slot .tag { align-self: flex-start; margin-top: 3px; }
.slot.inline { display: inline-flex; flex-direction: row; gap: 6px; align-items: baseline;
               margin: 0 6px 6px 0; padding: 4px 9px; }
.meet { margin: 4px 0 0; }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 26px; }
@media (max-width: 720px) { .cols { grid-template-columns: 1fr; gap: 10px; } }
.weights li { position: relative; display: flex; justify-content: space-between; gap: 10px;
              padding: 5px 8px; font-size: 14px; border-radius: 5px; overflow: hidden; margin-bottom: 3px; }
.weights li .wbar { position: absolute; inset: 0 auto 0 0; background: var(--bar); opacity: 0.5; z-index: 0; }
.weights li > span:not(.wbar), .weights li > b { position: relative; z-index: 1; }
.policies li { border-top: 1px solid var(--line); padding: 8px 0; }
.policies li:first-child { border-top: 0; }
.policies p { margin: 3px 0 0; font-size: 13px; color: var(--muted); }
.teeth code { font-size: 11px; background: color-mix(in srgb, var(--warn) 16%, transparent);
              color: var(--warn); border-radius: 3px; padding: 1px 4px; }
.bars { display: flex; flex-direction: column; gap: 4px; }
.bar-row { display: grid; grid-template-columns: 52px 1fr 110px; gap: 10px; align-items: center; font-size: 12px; }
.bar-label { color: var(--muted); font-variant-numeric: tabular-nums; }
.bar-track { background: color-mix(in srgb, var(--line) 60%, transparent); border-radius: 3px; height: 14px; }
.bar-fill { display: block; height: 100%; background: var(--bar); border-radius: 3px; min-width: 2px; }
.bar-fill.peak { background: var(--accent); }
.bar-val { color: var(--muted); font-variant-numeric: tabular-nums; }
.course { padding-bottom: 20px; }
details { margin-top: 14px; }
summary { cursor: pointer; font-size: 13px; color: var(--muted); }
details ul { margin-top: 8px; padding-left: 18px; list-style: disc; }
code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.92em; }
footer { padding: 28px 24px 48px; color: var(--muted); font-size: 12px; }
footer p { max-width: 62ch; }
`;
