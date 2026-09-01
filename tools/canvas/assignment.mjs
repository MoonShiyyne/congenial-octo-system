/**
 * Turns one Canvas assignment into a brief you can act on.
 *
 * The assignment page in Canvas shows a description, a due date and a point
 * value. What it never shows is the three things that actually decide how you
 * should spend the evening:
 *
 *   - **What this is worth.** 100 points means nothing on its own. In a
 *     weighted course it is a share of its group's weight, and a 100-point
 *     assignment in a 10%-weighted group matters less than a 20-point one in a
 *     40% group. That arithmetic is done here.
 *   - **Where the points are.** The rubric is on a separate tab, and it is the
 *     grading function in plain sight: the criterion worth 40% of the rubric is
 *     where the evening should go.
 *   - **What surrounds it.** The readings, slides and pages sitting above it in
 *     its own module are the intended inputs, and an announcement posted after
 *     the assignment was written can silently overrule its due date.
 */
import { toText, summarise, extractLinks, extractListItems, sentences, dedupe } from './html.mjs';

const DAY = 864e5;

// ── weight ─────────────────────────────────────────────────────────────────

/**
 * Share of the final grade, as a percentage.
 *
 * Weighted course: the assignment's points as a share of its group's total
 * points, times the group weight. Unweighted: points as a share of all points
 * in the course. Ungraded and zero-point work returns 0 rather than dividing
 * by zero — and `omitted` work (not_graded, or excluded from the final grade)
 * is reported as such, because "worth nothing" and "worth little" are
 * different pieces of advice.
 */
export function gradeImpact(assignment, { groups, groupTotals, groupCounts, courseTotal, weighted }) {
  const points = Number(assignment.points_possible) || 0;
  if (assignment.grading_type === 'not_graded' || assignment.omit_from_final_grade) {
    return { percent: 0, points, omitted: true, basis: 'not counted toward the final grade' };
  }
  if (weighted) {
    const group = groups.find(g => g.id === assignment.assignment_group_id);
    const groupWeight = Number(group?.group_weight) || 0;
    const total = groupTotals.get(assignment.assignment_group_id) || 0;
    if (!total || !groupWeight) return { percent: 0, points, omitted: false, basis: 'no weight resolvable' };
    return {
      percent: round((points / total) * groupWeight),
      points, omitted: false,
      group: group?.name ?? null,
      groupWeight,
      shareOfGroup: round((points / total) * 100),
      // Early in a term a group often holds one published assignment, which
      // makes it look like it carries the group's whole weight. It does, for
      // now — and the number will drop as the rest are posted. Saying so is
      // the difference between a useful figure and a misleading one.
      provisional: (groupCounts?.get(assignment.assignment_group_id) ?? 0) <= 1,
      basis: `${points} of ${total} pts in “${group?.name}” (${groupWeight}% of the grade)`,
    };
  }
  if (!courseTotal) return { percent: 0, points, omitted: false, basis: 'no points in the course yet' };
  return {
    percent: round((points / courseTotal) * 100), points, omitted: false,
    basis: `${points} of ${courseTotal} pts across the course (points-based grading)`,
  };
}

// ── what you actually have to hand in ──────────────────────────────────────

const IMPERATIVE = /^(write|submit|include|answer|complete|create|build|implement|design|analy[sz]e|compare|describe|explain|discuss|argue|engage|cite|upload|attach|prepare|present|record|read|review|solve|prove|derive|plot|graph|test|document|reflect|summari[sz]e|choose|select|identify|evaluate|demonstrate|show|list|draft|revise|propose|outline|critique|apply|collect|measure|calculate|compute|run|deploy|sketch|support|defend|turn in|hand in|bring)\b/i;
const OBLIGATION = /\b(you (?:must|should|will|need to|are (?:required|expected) to)|must (?:be|include|contain|submit)|is required|are required|required to|be sure to|make sure (?:you|to)|do not forget)\b/i;

/**
 * The deliverables, pulled out of the prose. Explicit list items first — an
 * instructor who bulleted the requirements has already done this work — and
 * only if there are none does it fall back to scanning sentences for
 * imperatives and obligations.
 */
export function extractDeliverables(html) {
  const items = extractListItems(html)
    .filter(t => t.length >= 12 && t.length <= 300)
    .filter(t => IMPERATIVE.test(t) || OBLIGATION.test(t) || /\b(section|part|question|problem|page|paragraph)\b/i.test(t));
  if (items.length >= 2) {
    return { items: dedupe(items).slice(0, 12).map(t => clip(t, 200)), from: 'the assignment’s own list' };
  }
  const found = sentences(toText(html))
    .filter(s => s.length >= 20 && s.length <= 300 && (IMPERATIVE.test(s) || OBLIGATION.test(s)));
  return { items: dedupe(found).slice(0, 8).map(s => clip(s, 200)), from: 'sentences that state a requirement' };
}

/** Hard constraints — the ones that get marks taken off for their own sake. */
export function extractConstraints(html) {
  const text = toText(html);
  const out = [];
  const push = (kind, value, evidence) => out.push({ kind, value, evidence: clip(evidence, 120) });

  for (const m of text.matchAll(/\b(\d{2,5})\s*(?:-|–|to)\s*(\d{2,5})\s*words?\b/gi)) push('length', `${m[1]}–${m[2]} words`, m[0]);
  if (!out.some(o => o.kind === 'length')) {
    for (const m of text.matchAll(/\b(?:at least|minimum of|no less than|maximum of|no more than|up to|about|approximately|roughly)?\s*(\d{2,5})\s*words?\b/gi)) push('length', `${m[0].trim()}`, m[0]);
  }
  for (const m of text.matchAll(/\b(\d{1,3})\s*(?:-|–|to)?\s*(\d{1,3})?\s*pages?\b/gi)) push('length', m[0].trim(), m[0]);
  for (const m of text.matchAll(/\b(APA|MLA|Chicago|IEEE|Harvard|Vancouver)\b(?:\s+(?:style|format|citation))?/gi)) push('citation', m[1].toUpperCase(), m[0]);
  for (const m of text.matchAll(/\b(double|single|1\.5)[-\s]spac(?:ed|ing)\b/gi)) push('format', m[0], m[0]);
  for (const m of text.matchAll(/\b(\d{1,2})[-\s]?(?:pt|point)\s+(?:font|type)|\b(Times New Roman|Arial|Calibri|Helvetica|Garamond)\b/gi)) push('format', m[0].trim(), m[0]);
  for (const m of text.matchAll(/\b(?:as a|in|submit(?:ted)? as|export(?:ed)? (?:to|as))\s+(?:a\s+)?(PDF|DOCX?|\.pdf|\.docx?|\.ipynb|\.zip|Jupyter notebook|Markdown)\b/gi)) push('file', m[1].replace(/^\./, '').toUpperCase(), m[0]);
  for (const m of text.matchAll(/\b(?:at least|minimum of|no fewer than)\s+(\d{1,2})\s+(sources?|references?|citations?|articles?|examples?)\b/gi)) push('sources', `${m[1]} ${m[2]}`, m[0]);
  return dedupe(out, o => `${o.kind}|${o.value.toLowerCase()}`).slice(0, 8);
}

/** Rubric criteria ranked by weight — the marking scheme, sorted by payoff. */
export function readRubric(assignment) {
  const rows = assignment.rubric ?? [];
  if (!rows.length) return null;
  const total = rows.reduce((s, r) => s + (Number(r.points) || 0), 0);
  const criteria = rows
    .map(r => ({
      name: (r.description ?? '').replace(/\s+/g, ' ').trim() || 'Criterion',
      points: Number(r.points) || 0,
      share: total ? round(((Number(r.points) || 0) / total) * 100) : 0,
      detail: summarise(r.long_description ?? '', 180) || null,
      top: (r.ratings ?? []).slice().sort((a, b) => (b.points ?? 0) - (a.points ?? 0))[0]?.description ?? null,
    }))
    .sort((a, b) => b.points - a.points);
  return { total: round(total), criteria, freeform: !!assignment.rubric_settings?.free_form_criterion_comments };
}

// ── how it is handed in ────────────────────────────────────────────────────

const SUBMISSION_LABEL = {
  online_text_entry: 'text typed into Canvas',
  online_url: 'a URL',
  online_upload: 'a file upload',
  online_quiz: 'a Canvas quiz',
  media_recording: 'a media recording',
  student_annotation: 'an annotated document',
  discussion_topic: 'a discussion post',
  on_paper: 'on paper, in class',
  external_tool: 'an external tool',
  none: 'nothing submitted through Canvas',
  not_graded: 'nothing — this is ungraded',
};

export function describeSubmission(a) {
  const types = (a.submission_types ?? []).map(t => SUBMISSION_LABEL[t] ?? t);
  return {
    types,
    label: types.length ? types.join(' or ') : 'not specified',
    extensions: a.allowed_extensions ?? [],
    attempts: a.allowed_attempts && a.allowed_attempts > 0 ? a.allowed_attempts : null,
    group: !!a.group_category_id,
    peerReviews: !!a.peer_reviews,
    anonymous: !!a.anonymous_submissions,
    turnitin: !!a.turnitin_enabled,
    onPaper: (a.submission_types ?? []).includes('on_paper'),
  };
}

// ── effort and when to start ───────────────────────────────────────────────

/**
 * An hours estimate, and the date to start on to hit the due date without a
 * final-night scramble.
 *
 * There is no honest way to know how long a given assignment takes, so this is
 * explicitly a planning prior, not a prediction: a base by assignment type,
 * scaled by weight and by how many things it asks for, capped at a working
 * week. It is stated as a range and labelled as an estimate in the output —
 * the useful output is the *start date*, which is wrong by a day at worst and
 * still beats starting the night before.
 */
export function estimateEffort(a, { impact, deliverables, constraints, rubric }) {
  const text = `${a.name ?? ''} ${toText(a.description ?? '')}`.toLowerCase();
  let hours =
    /\b(final|term|research)\s+(paper|project|essay|report)\b|capstone|thesis/.test(text) ? 12
    : /\b(essay|paper|report|memo|case study|literature review)\b/.test(text) ? 5
    : /\b(exam|midterm|test)\b/.test(text) ? 6
    : /\b(project|build|implement|prototype)\b/.test(text) ? 8
    : /\b(presentation|slides?|poster|talk)\b/.test(text) ? 4
    : /\b(lab|problem set|pset|homework|exercise)\b/.test(text) ? 3
    : /\b(quiz|reading|response|reflection|journal|discussion|post)\b/.test(text) ? 1.5
    : 3;

  // A word count is the one honest signal in the description: roughly 250
  // finished words an hour including reading, drafting and revision.
  const words = constraints.find(c => c.kind === 'length' && /word/.test(c.value));
  const wordN = Number((words?.value.match(/(\d{3,5})\s*words?$/) ?? words?.value.match(/(\d{3,5})/) ?? [])[1]);
  if (Number.isFinite(wordN) && wordN >= 250) hours = Math.max(hours, wordN / 250);

  hours *= 1 + Math.min(deliverables.length, 8) * 0.06;
  hours *= impact.percent >= 20 ? 1.4 : impact.percent >= 10 ? 1.15 : 1;
  if (rubric?.criteria?.length >= 5) hours *= 1.1;
  hours = Math.min(Math.max(hours, 0.5), 40);

  // Sittings, not hours: how many days before the deadline to begin.
  const lead = hours <= 2 ? 1 : hours <= 5 ? 3 : hours <= 10 ? 6 : 10;
  return { hours: round1(hours), range: `${round1(hours * 0.7)}–${round1(hours * 1.5)} h`, leadDays: lead };
}

export function startBy(dueISO, leadDays, unlockISO) {
  if (!dueISO) return null;
  const due = Date.parse(dueISO);
  if (Number.isNaN(due)) return null;
  let start = due - leadDays * DAY;
  const unlock = unlockISO ? Date.parse(unlockISO) : NaN;
  // Never advise starting before the work exists.
  if (Number.isFinite(unlock) && unlock > start) start = unlock;
  return new Date(start).toISOString();
}

// ── context from the rest of the course ────────────────────────────────────

/**
 * The module the assignment sits in, and the items immediately above it —
 * the readings and slides the instructor put there as its inputs. This is the
 * join Canvas's own UI never makes: the assignment page has no idea it lives
 * in a module at all.
 */
export function moduleContext(a, modules = [], lookBack = 5) {
  for (const mod of modules) {
    const items = mod.items ?? [];
    const idx = items.findIndex(i => i.type === 'Assignment' && String(i.content_id) === String(a.id));
    if (idx === -1) continue;
    const before = items.slice(Math.max(0, idx - lookBack), idx)
      .filter(i => ['File', 'Page', 'ExternalUrl', 'Discussion', 'Quiz'].includes(i.type))
      .map(i => ({ title: i.title, type: i.type, url: i.html_url ?? i.external_url ?? null }));
    return { module: mod.name, position: idx + 1, of: items.length, prerequisite: !!mod.prerequisite_module_ids?.length, materials: before };
  }
  return null;
}

const STOP = new Set(('a an the and or of for to in on at is are be with your you this that from as by we i it its will can if not but into about over under'.split(' ')));
const tokens = s => String(s ?? '').toLowerCase().match(/[a-z][a-z0-9'-]{2,}/g)?.filter(w => !STOP.has(w)) ?? [];

/** Announcements that name this assignment, or that landed while it was open. */
export function relatedAnnouncements(a, announcements = [], { window = 10 } = {}) {
  const nameTokens = new Set(tokens(a.name));
  const due = a.due_at ? Date.parse(a.due_at) : NaN;
  const out = [];
  for (const an of announcements) {
    const hay = `${an.title ?? ''} ${toText(an.message ?? '')}`;
    const lower = hay.toLowerCase();
    const named = String(a.name ?? '').length > 6 && lower.includes(String(a.name).toLowerCase());
    const shared = [...nameTokens].filter(t => lower.includes(t)).length;
    const posted = Date.parse(an.posted_at ?? an.created_at ?? '');
    const nearDue = Number.isFinite(due) && Number.isFinite(posted) &&
      posted <= due && due - posted <= window * DAY;
    const changesDeadline = CHANGE_CUE.test(hay);

    if (!named && shared < 2 && !(nearDue && changesDeadline)) continue;
    out.push({
      id: an.id,
      title: an.title ?? '(untitled)',
      posted: an.posted_at ?? an.created_at ?? null,
      url: an.html_url ?? null,
      summary: summarise(an.message ?? '', 200),
      changesDeadline,
      why: named ? 'names this assignment' : shared >= 2 ? 'overlaps this assignment’s title' : 'posted while this was open, and mentions a change',
      confidence: named ? 'high' : shared >= 3 ? 'medium' : 'low',
    });
  }
  return out.sort((x, y) => Date.parse(y.posted ?? 0) - Date.parse(x.posted ?? 0)).slice(0, 4);
}

/**
 * Wording that means a deadline moved. Worth flagging loudly: an announcement
 * that changes a due date is the single most expensive thing to miss in
 * Canvas, and Canvas itself will not update the assignment page for it.
 */
export const CHANGE_CUE = /\b(extend(?:ed|ing)?|postpon|push(?:ed)? (?:back|to)|moved to|new due date|deadline (?:is now|has (?:been )?(?:changed|moved))|rescheduled?|cancell?ed|no class|due (?:date )?(?:is )?now|instead of)\b/i;

// ── the whole thing ────────────────────────────────────────────────────────

export function analyseAssignment(a, ctx) {
  const impact = gradeImpact(a, ctx);
  const deliverables = extractDeliverables(a.description ?? '');
  const constraints = extractConstraints(a.description ?? '');
  const rubric = readRubric(a);
  const effort = estimateEffort(a, { impact, deliverables: deliverables.items, constraints, rubric });
  const announcements = relatedAnnouncements(a, ctx.announcements ?? []);

  return {
    id: a.id,
    courseId: ctx.courseId,
    course: ctx.courseName,
    name: a.name ?? '(untitled assignment)',
    url: a.html_url ?? null,
    due: a.due_at ?? null,
    unlock: a.unlock_at ?? null,
    lock: a.lock_at ?? null,
    published: a.published !== false,
    oneLine: summarise(a.description ?? '', 200) || 'No description on the Canvas page.',
    impact,
    deliverables: deliverables.items,
    deliverablesFrom: deliverables.from,
    constraints,
    rubric,
    submission: describeSubmission(a),
    effort,
    startBy: startBy(a.due_at, effort.leadDays, a.unlock_at),
    context: moduleContext(a, ctx.modules ?? []),
    links: extractLinks(a.description ?? '').slice(0, 8),
    announcements,
    flags: flagsFor(a, { impact, announcements, rubric }),
  };
}

/** Short warnings, in the order they would cost you marks. */
function flagsFor(a, { impact, announcements, rubric }) {
  const f = [];
  if (announcements.some(x => x.changesDeadline)) f.push('an announcement may have changed this deadline — check before you plan around the date below');
  if (a.lock_at && a.due_at && Date.parse(a.lock_at) <= Date.parse(a.due_at)) f.push('locks at the due date — no late submission possible in Canvas');
  else if (a.lock_at) f.push(`locks ${when(a.lock_at)} — nothing can be submitted after that`);
  if (impact.percent >= 15) f.push(`worth ${impact.percent}% of the final grade on its own`);
  if (a.group_category_id) f.push('group assignment — one submission covers the group, so agree who submits');
  if (a.peer_reviews) f.push('peer review required — there is work due after the deadline too');
  if (!rubric) f.push('no rubric published — ask what is being marked before you commit an approach');
  if (a.allowed_attempts > 0) f.push(`${a.allowed_attempts} submission attempt${a.allowed_attempts === 1 ? '' : 's'} allowed`);
  if ((a.submission_types ?? []).includes('on_paper')) f.push('handed in on paper — nothing to upload, bring it to class');
  if (!a.due_at) f.push('no due date set in Canvas — confirm it against the syllabus');
  return f;
}

const when = iso => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso
    : d.toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
};
const clip = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1).trimEnd() + '…' : String(s));
const round = n => Math.round(n * 10) / 10;
const round1 = n => Math.round(n * 10) / 10;
