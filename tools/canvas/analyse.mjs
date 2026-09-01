/**
 * Snapshot → briefs. The join that makes the rest worth reading: each
 * assignment is analysed with its course's grading scheme, module layout and
 * announcement history in hand, so a brief can say what a thing is worth and
 * what was posted about it — neither of which is on the assignment's own page.
 */
import { analyseSyllabus } from './syllabus.mjs';
import { analyseAssignment } from './assignment.mjs';
import { weeklySchedule, announcementFeed, radar, workloadByWeek, termCalendar } from './catalogue.mjs';
import { summarise } from './html.mjs';

export function analyse(snapshot, { now = Date.now(), horizonDays = 21 } = {}) {
  const courses = (snapshot.courses ?? []).map(c => analyseCourse(c, now));
  const briefs = courses.flatMap(c => c.assignments);
  return {
    generated: new Date(now).toISOString(),
    host: snapshot.host ?? null,
    user: snapshot.user ?? null,
    courses,
    schedule: weeklySchedule(courses),
    announcements: announcementFeed(courses),
    radar: radar(briefs, { days: horizonDays, now }),
    workload: workloadByWeek(briefs, { now }),
    termCalendar: termCalendar(courses),
    counts: {
      courses: courses.length,
      assignments: briefs.length,
      graded: briefs.filter(b => !b.impact.omitted).length,
      withRubric: briefs.filter(b => b.rubric).length,
      withoutDue: briefs.filter(b => !b.due).length,
    },
  };
}

function analyseCourse(course, now) {
  const weighted = !!course.apply_assignment_group_weights &&
    (course.groups ?? []).some(g => Number(g.group_weight) > 0);

  // Group and course point totals, computed once and shared by every
  // assignment in the course — this is what turns "100 points" into "8% of
  // your grade", and it is the same denominator for all of them.
  const graded = (course.assignments ?? []).filter(
    a => a.grading_type !== 'not_graded' && !a.omit_from_final_grade && a.published !== false);
  const groupTotals = new Map();
  const groupCounts = new Map();
  for (const a of graded) {
    const k = a.assignment_group_id;
    groupTotals.set(k, (groupTotals.get(k) ?? 0) + (Number(a.points_possible) || 0));
    groupCounts.set(k, (groupCounts.get(k) ?? 0) + 1);
  }
  const courseTotal = graded.reduce((s, a) => s + (Number(a.points_possible) || 0), 0);

  const syllabus = analyseSyllabus({
    course, groups: course.groups ?? [], events: course.events ?? [],
    teachers: course.teachers ?? [], weighted,
  });

  const ctx = {
    courseId: course.id, courseName: course.code ?? course.name,
    groups: course.groups ?? [], groupTotals, groupCounts, courseTotal, weighted,
    modules: course.modules ?? [], announcements: course.announcements ?? [],
  };

  const assignments = (course.assignments ?? [])
    .filter(a => a.published !== false)
    .map(a => ({
      ...analyseAssignment(a, ctx),
      submitted: !!(a.submission && a.submission.workflow_state &&
                    a.submission.workflow_state !== 'unsubmitted'),
      score: a.submission?.score ?? null,
    }))
    .sort(byDue);

  return {
    id: course.id, name: course.name, code: course.code ?? course.name,
    term: course.term, url: course.url,
    blurb: summarise(course.public_description ?? course.syllabus_body ?? '', 220),
    weighted, courseTotal: round(courseTotal),
    syllabus, assignments,
    announcements: course.announcements ?? [],
    modules: (course.modules ?? []).map(m => ({
      name: m.name, itemCount: (m.items ?? []).length,
      unlock: m.unlock_at ?? null,
      materials: (m.items ?? []).filter(i => ['File', 'Page', 'ExternalUrl'].includes(i.type)).length,
    })),
    fileCount: (course.files ?? []).length,
    gaps: course.gaps ?? [],
    health: health(course, syllabus, assignments),
  };
}

/**
 * What the brief could not establish for this course, said plainly. A brief
 * that quietly omits the grading scheme reads the same as one for a course
 * with no scheme; this is the difference between the two.
 */
function health(course, syllabus, assignments) {
  const notes = [];
  if (!syllabus.hasSyllabus) notes.push('no syllabus text on the Canvas syllabus page — the course brief is built from assignments and the calendar alone');
  if (!syllabus.meetings.length) notes.push('no meeting time found in the syllabus or the course calendar');
  if (syllabus.grading.source === 'points') notes.push('the course is not using weighted groups, so grade shares below are point shares');
  if (syllabus.grading.conflicts.length) notes.push(`the syllabus and Canvas disagree on ${syllabus.grading.conflicts.length} weighting${syllabus.grading.conflicts.length === 1 ? '' : 's'} — worth one email`);
  if (!assignments.length) notes.push('no published assignments');
  if (syllabus.hasSyllabus && !syllabus.policies.length) notes.push('no late-work, attendance, integrity or AI policy could be found in the syllabus text — check the page yourself before assuming there is none');
  if (syllabus.hasSyllabus && !syllabus.materials.items.length) notes.push('no required materials identified in the syllabus');
  const undated = assignments.filter(a => !a.due).length;
  if (undated) notes.push(`${undated} assignment${undated === 1 ? ' has' : 's have'} no due date in Canvas`);
  for (const g of course.gaps ?? []) notes.push(`could not read ${g}`);
  return notes;
}

const byDue = (a, b) => {
  const ta = a.due ? Date.parse(a.due) : Infinity;
  const tb = b.due ? Date.parse(b.due) : Infinity;
  return ta === tb ? String(a.name).localeCompare(String(b.name)) : ta - tb;
};
const round = n => Math.round(n * 10) / 10;
