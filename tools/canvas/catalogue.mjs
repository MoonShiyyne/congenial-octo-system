/**
 * The cross-course views. Canvas is organised by course — you click into one
 * at a time, and nothing in the interface tells you that three courses all
 * peak in the same week. These are the views that only exist once every course
 * is on one desk.
 */
import { toText, summarise, dedupe } from './html.mjs';
import { DAY_ORDER, clockLabel } from './syllabus.mjs';
import { CHANGE_CUE } from './assignment.mjs';

const DAY = 864e5;

/** Every meeting from every course, laid out as a week. */
export function weeklySchedule(courses) {
  const byDay = Object.fromEntries(DAY_ORDER.map(d => [d, []]));
  for (const c of courses) {
    for (const m of c.syllabus?.meetings ?? []) {
      for (const day of m.days) {
        if (!byDay[day]) continue;
        byDay[day].push({
          course: c.code ?? c.name, courseId: c.id, kind: m.kind,
          start: m.start, end: m.end, time: m.time,
          location: m.location, source: m.source,
        });
      }
    }
  }
  for (const day of DAY_ORDER) byDay[day].sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
  return { byDay, conflicts: findConflicts(byDay) };
}

/** Two courses in the same room-hour. Worth surfacing; registrars do miss it. */
function findConflicts(byDay) {
  const out = [];
  for (const day of DAY_ORDER) {
    const slots = byDay[day];
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const a = slots[i], b = slots[j];
        if (a.courseId === b.courseId) continue;
        // Office hours are drop-in; missing one is not a clash worth raising.
        if (a.kind === 'Office hours' || b.kind === 'Office hours') continue;
        const aEnd = a.end ?? a.start + 50, bEnd = b.end ?? b.start + 50;
        if (a.start < bEnd && b.start < aEnd) {
          out.push({ day, a: `${a.course} ${a.time}`, b: `${b.course} ${b.time}` });
        }
      }
    }
  }
  return out;
}

/**
 * Announcements from every course on one timeline, with the ones that appear
 * to change a deadline pulled to the top. `actionable` is a keyword judgement,
 * not a reading — the brief labels it that way.
 */
export function announcementFeed(courses, { days = 45, limit = 60 } = {}) {
  const cutoff = Date.now() - days * DAY;
  const items = [];
  for (const c of courses) {
    for (const an of c.announcements ?? []) {
      const posted = Date.parse(an.posted_at ?? an.created_at ?? '');
      if (Number.isFinite(posted) && posted < cutoff) continue;
      const body = `${an.title ?? ''} ${toText(an.message ?? '')}`;
      items.push({
        course: c.code ?? c.name, courseId: c.id,
        title: an.title ?? '(untitled)',
        posted: an.posted_at ?? an.created_at ?? null,
        url: an.html_url ?? null,
        summary: summarise(an.message ?? '', 260),
        changesDeadline: CHANGE_CUE.test(body),
        asksSomething: /\b(please|bring|submit|sign up|complete|rsvp|respond|fill (?:in|out)|register|vote|read before)\b/i.test(body),
      });
    }
  }
  items.sort((a, b) => Date.parse(b.posted ?? 0) - Date.parse(a.posted ?? 0));
  return {
    items: items.slice(0, limit),
    needsAttention: items.filter(i => i.changesDeadline).slice(0, 12),
  };
}

/**
 * What is due, across everything, ordered by date. Overdue work stays in the
 * list — a deadline that has passed is still information, and hiding it is how
 * Canvas's own dashboard loses a late assignment you could still hand in.
 */
export function radar(briefs, { days = 21, now = Date.now() } = {}) {
  const horizon = now + days * DAY;
  const dated = briefs.filter(b => b.due).map(b => ({ ...b, dueMs: Date.parse(b.due) })).filter(b => Number.isFinite(b.dueMs));
  const upcoming = dated.filter(b => b.dueMs >= now && b.dueMs <= horizon).sort((a, b) => a.dueMs - b.dueMs);
  const overdue = dated.filter(b => b.dueMs < now && b.dueMs >= now - 14 * DAY && !b.submitted)
    .sort((a, b) => b.dueMs - a.dueMs);
  const startNow = dated
    .filter(b => b.startBy && Date.parse(b.startBy) <= now && b.dueMs >= now)
    .sort((a, b) => a.dueMs - b.dueMs);
  const undated = briefs.filter(b => !b.due);
  return { upcoming, overdue, startNow, undated, horizonDays: days };
}

/**
 * Work per week, weighted by grade impact rather than by count. Five quizzes
 * and one term paper are not the same week, and a count-based view says they
 * are.
 */
export function workloadByWeek(briefs, { weeks = 8, now = Date.now() } = {}) {
  const start = startOfWeek(now);
  const buckets = [];
  for (let w = 0; w < weeks; w++) {
    const from = start + w * 7 * DAY;
    const to = from + 7 * DAY;
    const inWeek = briefs.filter(b => {
      const t = b.due ? Date.parse(b.due) : NaN;
      return Number.isFinite(t) && t >= from && t < to;
    });
    buckets.push({
      from: new Date(from).toISOString().slice(0, 10),
      to: new Date(to - DAY).toISOString().slice(0, 10),
      count: inWeek.length,
      weight: round(inWeek.reduce((s, b) => s + (b.impact?.percent ?? 0), 0)),
      hours: round(inWeek.reduce((s, b) => s + (b.effort?.hours ?? 0), 0)),
      items: inWeek.map(b => ({ course: b.course, name: b.name, due: b.due, percent: b.impact?.percent ?? 0 })),
    });
  }
  const peak = buckets.reduce((best, b) => (b.hours > (best?.hours ?? -1) ? b : best), null);
  return { weeks: buckets, peak };
}

const startOfWeek = ms => {
  const d = new Date(ms);
  const back = (d.getUTCDay() + 6) % 7;                  // Monday-based
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - back);
};

/** Fixed points in the term — exams and breaks — from every syllabus. */
export function termCalendar(courses) {
  const out = [];
  for (const c of courses) {
    for (const k of c.syllabus?.keyDates ?? []) {
      out.push({ ...k, course: c.code ?? c.name, courseId: c.id });
    }
  }
  return dedupe(out, k => `${k.course}|${k.date}|${k.text.slice(0, 40)}`)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Meetings today, in order — the "what do I have to be at" line. */
export function today(courses, now = Date.now()) {
  const day = DAY_ORDER[(new Date(now).getUTCDay() + 6) % 7];
  const { byDay } = weeklySchedule(courses);
  return { day, slots: byDay[day] ?? [] };
}

export { clockLabel };
const round = n => Math.round(n * 10) / 10;
