/**
 * Tests for the extraction layer.
 *
 * These are not tests that the code runs — the demo does that. They pin the
 * judgement calls: the cases where a plausible-looking parser reads a syllabus
 * wrongly, and where the wrong reading is silent. Every case here is one that
 * was actually got wrong while writing this.
 *
 *   node --test tools/canvas/
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { toText, sections, sentences, extractTableRows, decodeEntities } from './html.mjs';
import {
  parseDays, parseClock, meetingsFromText, meetingsFromEvents, gradingFromSyllabus,
  gradingFromCanvas, reconcileGrading, extractPolicies, extractMaterials,
  extractKeyDates, parseLooseDate, bestMatch, inlineWeights,
} from './syllabus.mjs';
import {
  gradeImpact, extractDeliverables, extractConstraints, readRubric,
  estimateEffort, startBy, moduleContext, relatedAnnouncements, CHANGE_CUE,
} from './assignment.mjs';
import { nextLink, normaliseHost } from './client.mjs';
import { analyse } from './analyse.mjs';
import { courseBrief, assignmentBrief, indexBrief, relative } from './render.mjs';
import { dashboard } from './dashboard.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const NOW = Date.parse('2026-09-01T12:00:00Z');

// ── html ───────────────────────────────────────────────────────────────────

test('source newlines inside a paragraph are whitespace, not sentence breaks', () => {
  // Word-pasted HTML wraps mid-sentence. Treating that wrap as a break splits
  // one policy into two fragments and truncates the half with the teeth in it.
  const html = '<p>Work loses 5% per day.\nYou have two late passes\nfor the term.</p>';
  assert.equal(sentences(toText(html)).length, 2);
  assert.match(sentences(toText(html))[1], /two late passes for the term\.$/);
});

test('plain text with no tags keeps its own line breaks', () => {
  assert.equal(toText('Line one\nLine two'), 'Line one\nLine two');
});

test('table cells keep their row alignment', () => {
  assert.deepEqual(
    extractTableRows('<table><tr><td>Homework</td><td>30%</td></tr></table>'),
    [['Homework', '30%']]);
});

test('entities decode, including numeric and hex forms', () => {
  assert.equal(decodeEntities('A&nbsp;&ndash;&#32;B&#x2014;C&amp;D'), 'A – B—C&D');
});

test('sections split on untagged heading-shaped lines', () => {
  const s = sections('Late Work\nDocked 10% a day.\nAttendance\nCome to class.');
  assert.deepEqual(s.map(x => x.heading), ['Late Work', 'Attendance']);
});

// ── meeting times ──────────────────────────────────────────────────────────

test('compact day codes: R is Thursday, U is Sunday', () => {
  assert.deepEqual(parseDays('MWF'), ['Mon', 'Wed', 'Fri']);
  assert.deepEqual(parseDays('TR'), ['Tue', 'Thu']);
  assert.deepEqual(parseDays('TTh'), ['Tue', 'Thu']);
  assert.deepEqual(parseDays('MU'), ['Mon', 'Sun']);
});

test('day names survive plurals and abbreviations', () => {
  for (const [text, want] of [
    ['Tuesdays and Thursdays', ['Tue', 'Thu']], ['Wednesday', ['Wed']],
    ['Saturdays', ['Sat']], ['Thurs.', ['Thu']], ['Mon/Wed', ['Mon', 'Wed']],
  ]) assert.deepEqual(parseDays(text), want, text);
});

test('days come back in week order, not mention order', () => {
  assert.deepEqual(parseDays('Friday and Monday'), ['Mon', 'Fri']);
});

test('a word that happens to be day letters is not a schedule', () => {
  // "WAR" is not Wednesday-Tuesday-Thursday, and "T. Nguyen" is not Tuesday.
  assert.deepEqual(parseDays('THE WAR OF 1812'), []);
  assert.deepEqual(meetingsFromText('Graded by T. Nguyen at 3:00 pm'), []);
});

test('a bare start time borrows the meridiem from the end of its range', () => {
  const [m] = meetingsFromText('Lecture: MW 9:30-10:45 am');
  assert.equal(m.time, '9:30 am–10:45 am');
});

test('an unqualified afternoon hour is read as the afternoon', () => {
  assert.equal(parseClock('2:00'), 14 * 60);       // no 2am classes
  assert.equal(parseClock('9:00'), 9 * 60);
  assert.equal(parseClock('12:30 am'), 30);
});

test('one paragraph can hold two meetings', () => {
  const got = meetingsFromText('Lecture meets TR 2:00-3:15 pm, Olsson 120. Lab: W 4:00-5:50 pm, Thornton A238.');
  assert.equal(got.length, 2);
  assert.deepEqual(got.map(m => m.kind), ['Lecture', 'Lab']);
  assert.deepEqual(got.map(m => m.location), ['Olsson 120', 'Thornton A238']);
});

test('a date is never mistaken for a room', () => {
  const got = meetingsFromText('Class on Monday, October 14 at 2:00 pm');
  assert.equal(got[0].location, null);
});

test('calendar events fold into a weekly pattern, and one-offs do not', () => {
  const at = (day, h) => ({ title: 'BIO 101 Lecture', start_at: `2026-09-0${day}T${h}:00:00Z`, end_at: `2026-09-0${day}T${h}:50:00Z` });
  const weekly = meetingsFromEvents([at(2, '09'), at(4, '09'), at(7, '09')]);
  assert.equal(weekly.length, 1);
  assert.deepEqual(weekly[0].days, ['Mon', 'Wed', 'Fri']);
  assert.equal(meetingsFromEvents([at(2, '09'), at(4, '09')]).length, 0, 'two events is not a pattern');
});

// ── grading ────────────────────────────────────────────────────────────────

test('a grading table is read as a scheme', () => {
  const g = gradingFromSyllabus('<table><tr><td>Homework</td><td>30%</td></tr><tr><td>Final</td><td>70%</td></tr></table>');
  assert.equal(g.total, 100);
  assert.ok(g.plausible);
});

test('weights stated inside one sentence are each labelled', () => {
  const rows = inlineWeights('quizzes are worth 20%, three unit exams are worth 45% total, and the final exam is worth 35%');
  assert.deepEqual(rows.map(r => r.label), ['quizzes', 'three unit exams', 'final exam']);
  assert.deepEqual(rows.map(r => r.weight), [20, 45, 35]);
});

test('a stray percentage in a policy is not a grading scheme', () => {
  // The single most dangerous false positive here: acting on a number that
  // was never a weighting at all.
  const g = gradingFromSyllabus('<p>Late work loses 10% per day.</p>');
  assert.equal(g.plausible, false);
});

test('scraped weights that do not add up are not trusted', () => {
  const g = gradingFromSyllabus('<table><tr><td>Homework</td><td>30%</td></tr><tr><td>Final</td><td>20%</td></tr></table>');
  assert.equal(g.plausible, false, '50% is not a whole grade');
});

test('Canvas group weights win over the syllabus, and the disagreement is kept', () => {
  const canvas = gradingFromCanvas([{ id: 1, name: 'Response Papers', group_weight: 25 }], true);
  const syllabus = gradingFromSyllabus('<table><tr><td>Short response papers</td><td>20%</td></tr><tr><td>Final</td><td>80%</td></tr></table>');
  const r = reconcileGrading(canvas, syllabus);
  assert.equal(r.source, 'canvas');
  assert.equal(r.rows[0].weight, 25);
  assert.equal(r.conflicts.length, 1, 'differently-worded names still match');
  assert.deepEqual(
    { canvas: r.conflicts[0].canvas, syllabus: r.conflicts[0].syllabus },
    { canvas: 25, syllabus: 20 });
});

test('an ambiguous category name makes no claim at all', () => {
  // "Final Exam" and "Unit Exams" both contain "exam". Guessing between them
  // would invent a conflict, so a tie has to resolve to nothing.
  const rows = [{ label: 'Final Exam', weight: 15 }, { label: 'Unit Exams', weight: 45 }];
  assert.equal(bestMatch('Exams', rows), null);
  assert.equal(bestMatch('Unit Exam', rows)?.weight, 45);
});

// ── policies and materials ─────────────────────────────────────────────────

test('policy numbers are extracted in digits and in words', () => {
  const [late] = extractPolicies(toText(
    '<h3>Late Work</h3><p>Work loses 5% per day. You have two late passes for the term.</p>'));
  assert.equal(late.id, 'late');
  assert.deepEqual(late.teeth, ['5% per day', '2 late passes']);
});

test('an AI policy is found under any of the names instructors give it', () => {
  const ids = extractPolicies(toText(
    '<h3>Generative AI</h3><p>You may use ChatGPT to brainstorm but not to write.</p>')).map(p => p.id);
  assert.ok(ids.includes('ai'));
});

test('a policy quote never stops mid-sentence', () => {
  const [p] = extractPolicies(toText(`<h3>Late Work</h3><p>${'Sentences run on and on. '.repeat(30)}</p>`));
  assert.match(p.text, /[.…]$/);
});

test('optional readings are marked, and the ISBN is not printed twice', () => {
  const { items } = extractMaterials(
    '<h3>Required Texts</h3><ul><li>Thornton, Africa and Africans ISBN 978-0521627245</li>' +
    '<li>Optional: Games, The Web of Empire ISBN 978-0195335507</li></ul>');
  assert.equal(items.length, 2);
  assert.equal(items[0].isbn, '9780521627245');
  assert.equal(items[1].required, false);
  assert.ok(!/ISBN|Optional/i.test(items[1].title), items[1].title);
});

test('a bare date takes its year from the term, and 12/31 parses either way', () => {
  assert.equal(parseLooseDate('Midterm on October 14', 2026), '2026-10-14');
  assert.equal(parseLooseDate('Due 3/9/27'), '2027-03-09');
  assert.equal(parseLooseDate('no date here'), null);
});

test('key dates separate assessments from days with no class', () => {
  const got = extractKeyDates('Midterm: October 14\nNo class November 25 - recess', 2026);
  assert.deepEqual(got.map(k => k.kind), ['assessment', 'no class']);
});

// ── assignments ────────────────────────────────────────────────────────────

const ctx = () => ({
  courseId: 1, courseName: 'X',
  groups: [{ id: 10, name: 'Essays', group_weight: 40 }],
  groupTotals: new Map([[10, 400]]), groupCounts: new Map([[10, 4]]),
  courseTotal: 1000, weighted: true,
});

test('grade impact is a share of the group weight, not of the points', () => {
  const a = { id: 1, assignment_group_id: 10, points_possible: 100 };
  assert.equal(gradeImpact(a, ctx()).percent, 10);      // 100/400 of 40%
});

test('a big assignment in a light group beats a small one in a heavy group', () => {
  const c = {
    groups: [{ id: 10, name: 'Homework', group_weight: 10 }, { id: 20, name: 'Exams', group_weight: 60 }],
    groupTotals: new Map([[10, 1000], [20, 200]]), groupCounts: new Map([[10, 10], [20, 2]]),
    courseTotal: 1200, weighted: true,
  };
  const big = gradeImpact({ assignment_group_id: 10, points_possible: 500 }, c);
  const small = gradeImpact({ assignment_group_id: 20, points_possible: 100 }, c);
  assert.equal(big.percent, 5);
  assert.equal(small.percent, 30);
  assert.ok(small.percent > big.percent, 'the 100-point one matters six times more');
});

test('ungraded work is called worthless rather than shown as 0%', () => {
  const r = gradeImpact({ assignment_group_id: 10, points_possible: 50, grading_type: 'not_graded' }, ctx());
  assert.equal(r.omitted, true);
});

test('an empty group does not divide by zero', () => {
  const c = { ...ctx(), groupTotals: new Map(), groupCounts: new Map() };
  const r = gradeImpact({ assignment_group_id: 10, points_possible: 0 }, c);
  assert.equal(r.percent, 0);
  assert.ok(Number.isFinite(r.percent));
});

test('the only assignment posted in its group is flagged provisional', () => {
  const c = { ...ctx(), groupCounts: new Map([[10, 1]]), groupTotals: new Map([[10, 100]]) };
  assert.equal(gradeImpact({ assignment_group_id: 10, points_possible: 100 }, c).provisional, true);
  assert.equal(gradeImpact({ assignment_group_id: 10, points_possible: 100 }, ctx()).provisional, false);
});

test('an authored list beats scraped sentences', () => {
  const d = extractDeliverables('<p>Write an essay.</p><ul><li>Submit a proposal by week 9.</li><li>Engage three secondary works.</li></ul>');
  assert.equal(d.items.length, 2);
  assert.match(d.from, /own list/);
});

test('constraints pick up length, citation style and file format', () => {
  const c = extractConstraints('<p>A 3000-4000 word essay in Chicago style, double-spaced, submitted as a PDF.</p>');
  const kinds = Object.fromEntries(c.map(x => [x.kind, x.value]));
  assert.equal(kinds.length, '3000–4000 words');
  assert.equal(kinds.citation, 'CHICAGO');
  assert.equal(kinds.file, 'PDF');
});

test('rubric criteria come back ranked by what they are worth', () => {
  const r = readRubric({ rubric: [
    { description: 'Prose', points: 10 }, { description: 'Argument', points: 40 }, { description: 'Sources', points: 30 }] });
  assert.deepEqual(r.criteria.map(c => c.name), ['Argument', 'Sources', 'Prose']);
  assert.equal(r.criteria[0].share, 50);
});

test('effort scales with the word count when there is one', () => {
  const base = { impact: { percent: 5 }, deliverables: [], rubric: null };
  const long = estimateEffort({ name: 'Essay', description: '<p>Write 4000 words.</p>' },
    { ...base, constraints: extractConstraints('<p>Write 4000 words.</p>') });
  const short = estimateEffort({ name: 'Essay', description: '<p>Write an essay.</p>' }, { ...base, constraints: [] });
  assert.ok(long.hours > short.hours, `${long.hours} should exceed ${short.hours}`);
  assert.ok(long.hours <= 40, 'and stay inside a working week');
});

test('the start date never lands before the assignment unlocks', () => {
  const s = startBy('2026-09-20T23:59:00Z', 10, '2026-09-18T00:00:00Z');
  assert.equal(s, '2026-09-18T00:00:00.000Z');
});

test('an assignment is located in its module, with the material above it', () => {
  const mods = [{ name: 'Week 4', items: [
    { type: 'File', title: 'Reading', html_url: 'u1' },
    { type: 'Assignment', content_id: 55, title: 'Essay' }] }];
  const c = moduleContext({ id: 55 }, mods);
  assert.equal(c.module, 'Week 4');
  assert.deepEqual(c.materials.map(m => m.title), ['Reading']);
  assert.equal(moduleContext({ id: 999 }, mods), null);
});

test('an announcement naming the assignment attaches with high confidence', () => {
  const a = { id: 1, name: 'Response Paper 2', due_at: '2026-09-05T23:59:00Z' };
  const [hit] = relatedAnnouncements(a, [{
    id: 9, title: 'Response Paper 2 deadline extended', posted_at: '2026-09-01T09:00:00Z',
    message: '<p>The deadline has been extended to Friday.</p>' }]);
  assert.equal(hit.confidence, 'high');
  assert.equal(hit.changesDeadline, true);
});

test('an unrelated announcement does not attach', () => {
  const a = { id: 1, name: 'Response Paper 2', due_at: '2026-09-05T23:59:00Z' };
  assert.equal(relatedAnnouncements(a, [{
    id: 9, title: 'Guest speaker Thursday', posted_at: '2026-09-01T09:00:00Z',
    message: '<p>A guest speaker will visit.</p>' }]).length, 0);
});

test('deadline-change wording is recognised in the forms instructors use', () => {
  for (const s of ['deadline has been moved', 'pushed back to Friday', 'the new due date is Monday',
                   'class is cancelled', 'extended to Friday', 'rescheduled for next week']) {
    assert.ok(CHANGE_CUE.test(s), s);
  }
  assert.ok(!CHANGE_CUE.test('remember to bring your textbook'));
});

// ── client ─────────────────────────────────────────────────────────────────

test('pagination follows the Link header, which is the only place it exists', () => {
  assert.equal(
    nextLink('<https://x/a?page=1>; rel="current",<https://x/a?page=2>; rel="next"'),
    'https://x/a?page=2');
  assert.equal(nextLink('<https://x/a?page=9>; rel="last"'), null);
  assert.equal(nextLink(undefined), null);
});

test('a pasted host is normalised however it arrives', () => {
  for (const h of ['school.instructure.com', 'https://school.instructure.com/',
                   'https://school.instructure.com/api/v1']) {
    assert.equal(normaliseHost(h), 'https://school.instructure.com', h);
  }
});

// ── end to end ─────────────────────────────────────────────────────────────

const snapshot = JSON.parse(await readFile(join(ROOT, 'data/canvas-demo.json'), 'utf8'));

test('the demo snapshot analyses without loss', () => {
  const r = analyse(snapshot, { now: NOW });
  assert.equal(r.counts.courses, 3);
  assert.equal(r.counts.assignments, snapshot.courses.reduce((s, c) => s + c.assignments.length, 0));
  for (const c of r.courses) {
    assert.ok(c.syllabus.meetings.length > 0, `${c.code} has no meeting time`);
    for (const a of c.assignments) {
      assert.ok(Number.isFinite(a.impact.percent), `${a.name} has a non-numeric weight`);
      assert.ok(a.impact.percent <= 100);
    }
  }
});

test('every course finds its meeting times, whichever source has them', () => {
  const r = analyse(snapshot, { now: NOW });
  const src = Object.fromEntries(r.courses.map(c => [c.code, c.syllabus.meetings[0].source]));
  assert.equal(src['HIST 210'], 'syllabus');
  assert.equal(src['BIO 101'], 'calendar', 'BIO states its times nowhere but the calendar');
});

test('the grade shares within a weighted course sum to that course', () => {
  const hist = analyse(snapshot, { now: NOW }).courses.find(c => c.code === 'HIST 210');
  const total = hist.assignments.reduce((s, a) => s + a.impact.percent, 0);
  assert.ok(Math.abs(total - 100) < 0.5, `HIST 210 shares sum to ${total}, not 100`);
});

test('overdue work stays visible instead of scrolling off', () => {
  const r = analyse(snapshot, { now: NOW });
  assert.ok(r.radar.overdue.some(b => /Lab Notebook/.test(b.name)));
});

test('the renderers produce output for every course and assignment', () => {
  const r = analyse(snapshot, { now: NOW });
  assert.match(indexBrief(r, { now: NOW }), /^# This week/);
  for (const c of r.courses) {
    const md = courseBrief(c, { now: NOW });
    assert.ok(md.includes(c.code) && md.length > 400, c.code);
    for (const a of c.assignments) {
      const brief = assignmentBrief(a, { now: NOW });
      assert.ok(brief.includes(a.name), a.name);
      assert.match(brief, /Generated from Canvas/);
    }
  }
});

test('a derived percentage is never printed without saying where it came from', () => {
  const r = analyse(snapshot, { now: NOW });
  for (const c of r.courses) {
    const md = courseBrief(c, { now: NOW });
    if (!c.syllabus.grading.rows.length) continue;
    assert.match(md, /Source: \*\*/, `${c.code} shows weights with no source`);
  }
});

test('the dashboard is one valid self-contained file with nothing to fetch', () => {
  const html = dashboard(analyse(snapshot, { now: NOW }));
  assert.match(html, /^<!doctype html>/);
  assert.equal(html.match(/<script/i), null, 'no scripts');
  assert.equal(html.match(/<link\b/i), null, 'no external stylesheets');
  assert.equal(html.match(/src=["']http/i), null, 'no remote assets');
  assert.ok(html.includes('</html>'));
});

test('user content is escaped into the dashboard, never interpolated', () => {
  const hostile = structuredClone(snapshot);
  hostile.courses[0].name = '<script>alert(1)</script>';
  hostile.courses[0].assignments[0].name = '"><img src=x onerror=alert(1)>';
  const html = dashboard(analyse(hostile, { now: NOW }));
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(!html.includes('onerror=alert(1)'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('relative dates count calendar days, not elapsed hours', () => {
  // Due 23:59 last night, read at 06:33 this morning: "today" would read as
  // "you still have time".
  assert.equal(relative('2026-08-31T23:59:00Z', Date.parse('2026-09-01T06:33:00Z')), 'yesterday');
  assert.equal(relative('2026-09-01T23:59:00Z', Date.parse('2026-09-01T06:33:00Z')), 'today');
});

test('a course with nothing in it still produces a brief that says so', () => {
  const empty = { generated: '2026-09-01T00:00:00Z', courses: [{
    id: 1, name: 'Empty', code: 'EMPTY', syllabus_body: '', assignments: [],
    groups: [], announcements: [], modules: [], events: [], teachers: [], files: [] }] };
  const r = analyse(empty, { now: NOW });
  const md = courseBrief(r.courses[0], { now: NOW });
  assert.match(md, /could not establish/);
  assert.match(md, /No meeting time found/);
  assert.doesNotThrow(() => dashboard(r));
});
