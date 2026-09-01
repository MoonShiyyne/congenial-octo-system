/**
 * The briefs, as markdown.
 *
 * Two rules the format follows, both about being read at 11pm the night before
 * rather than admired:
 *
 *   - **A brief fits on a screen.** Everything here is capped. A brief that
 *     reproduces the syllabus is the syllabus, and the reason nobody reads the
 *     syllabus is that it is long.
 *   - **Derived numbers say where they came from.** "12% of your grade" is
 *     acted on; if it was inferred from a scraped table rather than read out of
 *     Canvas's own weighting, the line says so. Anything estimated is labelled
 *     an estimate, every time, with no exceptions for when it looks confident.
 */
import { DAY_ORDER } from './syllabus.mjs';

const DAY = 864e5;
const midnight = ms => { const d = new Date(ms); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); };

// ── dates ──────────────────────────────────────────────────────────────────

export const fmtDate = iso => {
  const d = new Date(iso ?? '');
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
};

export const fmtDateTime = iso => {
  const d = new Date(iso ?? '');
  if (Number.isNaN(d.getTime())) return '—';
  const time = d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
  return `${fmtDate(iso)}, ${time}`;
};

export function relative(iso, now = Date.now()) {
  const t = Date.parse(iso ?? '');
  if (!Number.isFinite(t)) return '';
  // Calendar days, not elapsed hours: something due at 23:59 last night is
  // "yesterday" at 06:33 this morning, and rounding elapsed time calls it
  // "today" — which reads as "you still have time".
  const days = Math.round((midnight(t) - midnight(now)) / DAY);
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}

// ── one assignment ─────────────────────────────────────────────────────────

export function assignmentBrief(b, { now = Date.now() } = {}) {
  const L = [];
  L.push(`# ${b.name}`);
  L.push(`*${b.course}${b.url ? ` · [open in Canvas](${b.url})` : ''}*`);
  L.push('');
  L.push(b.oneLine);
  L.push('');

  L.push('| | |');
  L.push('|---|---|');
  L.push(`| **Due** | ${b.due ? `${fmtDateTime(b.due)} (${relative(b.due, now)})` : 'not set in Canvas'} |`);
  if (b.startBy && b.due) L.push(`| **Start by** | ${fmtDate(b.startBy)} — ${b.effort.range} of work, estimated |`);
  L.push(`| **Worth** | ${worth(b)} |`);
  L.push(`| **Hand in** | ${b.submission.label}${b.submission.extensions.length ? ` (${b.submission.extensions.join(', ')} only)` : ''} |`);
  if (b.context) L.push(`| **Sits in** | ${b.context.module}, item ${b.context.position} of ${b.context.of} |`);
  L.push('');

  if (b.flags.length) {
    L.push('**Before you start**');
    for (const f of b.flags) L.push(`- ${f}`);
    L.push('');
  }

  if (b.deliverables.length) {
    L.push(`**What to hand in** — read off ${b.deliverablesFrom}, so check it against the assignment page.`);
    L.push('');
    for (const d of b.deliverables) L.push(`- [ ] ${d}`);
    L.push('');
  }

  if (b.constraints.length) {
    L.push('**Rules that cost marks on their own**');
    for (const c of b.constraints) L.push(`- ${c.kind}: **${c.value}**`);
    L.push('');
  }

  if (b.rubric) {
    L.push(`**Where the points are** — ${b.rubric.total} rubric points`);
    L.push('');
    L.push('| Criterion | Points | Share |');
    L.push('|---|---:|---:|');
    for (const c of b.rubric.criteria.slice(0, 10)) {
      L.push(`| ${esc(c.name)}${c.top ? `<br><sub>full marks: ${esc(clip(c.top, 90))}</sub>` : ''} | ${c.points} | ${c.share}% |`);
    }
    L.push('');
    const top = b.rubric.criteria[0];
    if (top && top.share >= 25) {
      L.push(`> ${top.share}% of the rubric is **${esc(top.name)}**. If the evening is short, that is where it goes.`);
      L.push('');
    }
  }

  if (b.context?.materials?.length) {
    L.push('**The material the module puts before this**');
    for (const m of b.context.materials) L.push(`- ${m.url ? `[${esc(m.title)}](${m.url})` : esc(m.title)} *(${m.type})*`);
    L.push('');
  }

  if (b.links.length) {
    L.push('**Linked from the assignment**');
    for (const l of b.links) L.push(`- [${esc(clip(l.text, 80))}](${l.href})`);
    L.push('');
  }

  if (b.announcements.length) {
    L.push('**Announcements that touch this**');
    for (const a of b.announcements) {
      L.push(`- ${a.changesDeadline ? '**⚠ possible deadline change** — ' : ''}${fmtDate(a.posted)} · ${a.url ? `[${esc(a.title)}](${a.url})` : esc(a.title)} <sub>(matched because it ${a.why}; ${a.confidence} confidence)</sub>`);
      if (a.summary) L.push(`  <br>${esc(clip(a.summary, 200))}`);
    }
    L.push('');
  }

  L.push('---');
  L.push(`<sub>Generated from Canvas. Effort and start dates are estimates from a planning prior, not predictions. Verify anything you would act on against the assignment page.</sub>`);
  return L.join('\n') + '\n';
}

const worth = b =>
  b.impact.omitted ? `${b.impact.points} pts — **not counted** toward the final grade`
  : b.impact.percent > 0 ? `**${b.impact.percent}% of the final grade** — ${b.impact.basis}${b.impact.provisional ? ' *(the only one posted in that group so far — if more are added, this share drops)*' : ''}`
  : `${b.impact.points} pts — ${b.impact.basis}`;

// ── one course ─────────────────────────────────────────────────────────────

export function courseBrief(c, { now = Date.now() } = {}) {
  const s = c.syllabus;
  const L = [];
  L.push(`# ${c.code}${c.code !== c.name ? ` — ${c.name}` : ''}`);
  L.push(`*${[c.term, c.url ? `[open in Canvas](${c.url})` : null].filter(Boolean).join(' · ')}*`);
  L.push('');
  if (c.blurb) { L.push(`> ${esc(c.blurb)}`); L.push(''); }

  L.push('## When it meets');
  L.push('');
  if (s.meetings.length) {
    for (const m of s.meetings) {
      L.push(`- **${m.kind}** — ${m.days.join(' ')} ${m.time ?? ''}${m.location ? ` · ${m.location}` : ''} <sub>(from the ${m.source})</sub>`);
    }
  } else {
    L.push('- No meeting time found in the syllabus text or the course calendar.');
  }
  L.push('');

  const contacts = s.contacts;
  if (contacts.staff.length || contacts.officeHours.length) {
    L.push('## Who to ask');
    L.push('');
    for (const p of contacts.staff) L.push(`- **${esc(p.name)}** (${p.role})${p.email ? ` — ${p.email}` : ''}`);
    for (const e of contacts.emails) L.push(`- ${e} <sub>(found in the syllabus text)</sub>`);
    for (const o of contacts.officeHours) {
      L.push(`- Office hours${o.who ? ` — ${esc(o.who)}` : ''}: ${[o.days.join(' '), o.time, o.location].filter(Boolean).join(' · ') || esc(o.evidence)}`);
    }
    L.push('');
  }

  L.push('## How the grade is computed');
  L.push('');
  if (s.grading.rows.length) {
    L.push(`Source: **${gradingSourceLabel(s.grading.source)}**.`);
    L.push('');
    L.push('| Category | Weight |');
    L.push('|---|---:|');
    for (const r of [...s.grading.rows].sort((a, b) => b.weight - a.weight)) L.push(`| ${esc(r.label)} | ${r.weight}% |`);
    L.push('');
    if (s.grading.conflicts.length) {
      L.push('**The syllabus and Canvas disagree.** Worth one email before you plan around either.');
      L.push('');
      L.push('| Category | Canvas | Syllabus |');
      L.push('|---|---:|---:|');
      for (const k of s.grading.conflicts) L.push(`| ${esc(k.label)} | ${k.canvas}% | ${k.syllabus}% |`);
      L.push('');
    }
  } else {
    L.push(`No weighting is published. The course totals **${c.courseTotal} points**, so every assignment's share below is its share of that.`);
    L.push('');
  }

  const heavy = c.assignments.filter(a => a.impact.percent > 0).sort((a, b) => b.impact.percent - a.impact.percent).slice(0, 5);
  if (heavy.length) {
    L.push('**The five that decide the grade**');
    L.push('');
    for (const a of heavy) L.push(`- ${a.impact.percent}% — ${esc(a.name)}${a.due ? ` *(due ${fmtDate(a.due)})*` : ''}`);
    L.push('');
  }

  if (s.policies.length) {
    L.push('## Policies with a cost attached');
    L.push('');
    for (const p of s.policies) {
      L.push(`**${p.label}**${p.teeth.length ? ` — ${p.teeth.map(t => `\`${t}\``).join(', ')}` : ''}`);
      L.push('');
      L.push(`> ${esc(p.text)}`);
      L.push('');
      L.push(`<sub>from the ${p.from}</sub>`);
      L.push('');
    }
  }

  if (s.materials.items.length || s.materials.links.length) {
    L.push('## What you need');
    L.push('');
    for (const m of s.materials.items) {
      L.push(`- ${m.required ? '' : '*(optional)* '}${esc(m.title)}${m.isbn ? ` — ISBN ${m.isbn}` : ''}`);
    }
    for (const l of s.materials.links) L.push(`- [${esc(clip(l.text, 80))}](${l.href}) *(${l.kind})*`);
    L.push('');
  }

  if (s.keyDates.length) {
    L.push('## Fixed points in the term');
    L.push('');
    for (const k of s.keyDates) L.push(`- **${k.date}** — ${esc(k.text)} <sub>(${k.kind}, read out of the syllabus)</sub>`);
    L.push('');
  }

  const upcoming = c.assignments.filter(a => a.due && Date.parse(a.due) >= now).slice(0, 8);
  if (upcoming.length) {
    L.push('## What is coming');
    L.push('');
    L.push('| Due | Assignment | Worth | Start by |');
    L.push('|---|---|---:|---|');
    for (const a of upcoming) {
      L.push(`| ${fmtDate(a.due)} | ${esc(a.name)} | ${a.impact.percent ? `${a.impact.percent}%` : '—'} | ${a.startBy ? fmtDate(a.startBy) : '—'} |`);
    }
    L.push('');
  }

  if (c.modules.length) {
    L.push(`## Modules — ${c.modules.length}, ${c.modules.reduce((s2, m) => s2 + m.materials, 0)} pieces of material`);
    L.push('');
    for (const m of c.modules.slice(0, 12)) L.push(`- ${esc(m.name)} — ${m.itemCount} items${m.materials ? `, ${m.materials} readings/pages` : ''}`);
    L.push('');
  }

  if (c.health.length) {
    L.push('## What this brief could not establish');
    L.push('');
    for (const h of c.health) L.push(`- ${h}`);
    L.push('');
  }

  L.push('---');
  L.push('<sub>Generated from Canvas. Extraction from syllabus prose is heuristic — treat anything sourced from "the syllabus" as a reading to confirm, not as a fact.</sub>');
  return L.join('\n') + '\n';
}

const gradingSourceLabel = src =>
  src === 'canvas' ? 'Canvas assignment-group weights (authoritative — this is what Canvas computes with)'
  : src === 'syllabus' ? 'the syllabus text (scraped, and the weights add to 100 — confirm it)'
  : 'total points (no weighting published)';

// ── the cross-course index ─────────────────────────────────────────────────

export function indexBrief(result, { now = Date.now() } = {}) {
  const L = [];
  L.push('# This week, across every course');
  L.push(`*${result.counts.courses} courses · ${result.counts.assignments} published assignments · generated ${fmtDateTime(result.generated)}*`);
  L.push('');

  const { overdue, startNow, upcoming } = result.radar;
  if (overdue.length) {
    L.push('## Past due, not submitted');
    L.push('');
    for (const b of overdue) L.push(`- **${fmtDate(b.due)}** (${relative(b.due, now)}) · ${b.course} — ${esc(b.name)} — ${b.impact.percent}%`);
    L.push('');
  }

  if (startNow.length) {
    L.push('## Start these now');
    L.push('');
    L.push('Everything whose estimated start date has passed and which is still open.');
    L.push('');
    L.push('| Course | Assignment | Due | Worth | Est. work |');
    L.push('|---|---|---|---:|---|');
    for (const b of startNow.slice(0, 12)) {
      L.push(`| ${b.course} | ${esc(b.name)} | ${fmtDate(b.due)} (${relative(b.due, now)}) | ${b.impact.percent}% | ${b.effort.range} |`);
    }
    L.push('');
  }

  L.push(`## Due in the next ${result.radar.horizonDays} days`);
  L.push('');
  if (upcoming.length) {
    L.push('| Due | Course | Assignment | Worth | Start by |');
    L.push('|---|---|---|---:|---|');
    for (const b of upcoming) {
      L.push(`| ${fmtDate(b.due)} | ${b.course} | ${esc(b.name)} | ${b.impact.percent ? `${b.impact.percent}%` : '—'} | ${b.startBy ? fmtDate(b.startBy) : '—'} |`);
    }
  } else L.push('Nothing due in that window.');
  L.push('');

  const attention = result.announcements.needsAttention;
  if (attention.length) {
    L.push('## Announcements that may have moved a deadline');
    L.push('');
    L.push('Keyword-flagged, not read. Each one is worth thirty seconds of your own eyes.');
    L.push('');
    for (const a of attention) {
      L.push(`- ${fmtDate(a.posted)} · **${a.course}** — ${a.url ? `[${esc(a.title)}](${a.url})` : esc(a.title)}`);
      if (a.summary) L.push(`  <br><sub>${esc(clip(a.summary, 200))}</sub>`);
    }
    L.push('');
  }

  L.push('## The week');
  L.push('');
  const { byDay, conflicts } = result.schedule;
  const busy = DAY_ORDER.filter(d => byDay[d].length);
  if (busy.length) {
    L.push('| Day | |');
    L.push('|---|---|');
    for (const d of busy) {
      L.push(`| **${d}** | ${byDay[d].map(s => `${s.course} ${s.time ?? ''}${s.location ? ` (${s.location})` : ''}${s.kind === 'Lecture' ? '' : ` — *${s.kind.toLowerCase()}*`}`).join('<br>')} |`);
    }
    L.push('');
  } else L.push('No meeting times could be established for any course.\n');
  if (conflicts.length) {
    L.push('**Timetable clashes**');
    for (const k of conflicts) L.push(`- ${k.day}: ${k.a} overlaps ${k.b}`);
    L.push('');
  }

  const peak = result.workload.peak;
  if (peak && peak.hours > 0) {
    L.push('## Where the term gets heavy');
    L.push('');
    L.push('| Week of | Items | Grade at stake | Est. work |');
    L.push('|---|---:|---:|---:|');
    for (const w of result.workload.weeks) {
      if (!w.count) continue;
      L.push(`| ${w.from}${w.from === peak.from ? ' **← peak**' : ''} | ${w.count} | ${w.weight}% | ${w.hours} h |`);
    }
    L.push('');
    L.push(`The week of **${peak.from}** carries ${peak.hours} estimated hours across ${peak.count} items. Anything on that list with an earlier start date is worth pulling forward.`);
    L.push('');
  }

  if (result.termCalendar.length) {
    L.push('## Fixed dates from every syllabus');
    L.push('');
    for (const k of result.termCalendar) L.push(`- **${k.date}** · ${k.course} — ${esc(k.text)}`);
    L.push('');
  }

  L.push('## Courses');
  L.push('');
  for (const c of result.courses) {
    L.push(`- **${c.code}** — ${c.assignments.length} assignments · ${c.syllabus.meetings.length ? c.syllabus.meetings.map(m => `${m.days.join('')} ${m.time}`).join(', ') : 'no meeting time found'}${c.health.length ? ` · <sub>${c.health.length} gap(s) noted in its brief</sub>` : ''}`);
  }
  L.push('');
  L.push('---');
  L.push('<sub>Generated from Canvas. Estimates are labelled where they appear; nothing here replaces the assignment page.</sub>');
  return L.join('\n') + '\n';
}

const esc = s => String(s ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ');
const clip = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1).trimEnd() + '…' : String(s));
