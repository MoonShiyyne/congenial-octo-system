/**
 * Pulls one snapshot of everything the briefs need, in as few requests as
 * Canvas allows, and writes it to a plain JSON file.
 *
 * Fetching is deliberately separate from analysis. A snapshot can be re-read
 * offline any number of times while the extractors are being tuned, which
 * matters because tuning a syllabus parser against a live API means hammering
 * a rate-limited server owned by your university.
 *
 * Every per-course request is best-effort in the same way the rest of this
 * repo treats feeds: a course with the syllabus tab disabled, or modules
 * turned off, records the gap and keeps its other data rather than failing the
 * run. Partial is the normal case — courses differ in what they expose.
 */
import { createClient } from './client.mjs';

const CONCURRENCY = 4;      // polite against a shared university instance

export async function fetchSnapshot({ host, token, termFilter, courseFilter, includeConcluded = false, log = console.error }) {
  const api = createClient({ host, token, log: () => {} });

  const self = await api.get('/users/self/profile');
  log(`✓ signed in as ${self?.name ?? 'unknown user'} (${self?.primary_email ?? self?.login_id ?? 'no email'})`);

  const raw = await api.list('/courses', {
    'include[]': ['syllabus_body', 'term', 'teachers', 'total_students', 'course_image', 'public_description'],
    enrollment_state: includeConcluded ? undefined : 'active',
    enrollment_type: 'student',
    state: includeConcluded ? ['available', 'completed'] : ['available'],
  });

  const courses = raw
    .filter(c => c && c.id && !c.access_restricted_by_date)
    .filter(c => !termFilter || matches(c.term?.name, termFilter) || matches(c.enrollment_term_id, termFilter))
    .filter(c => !courseFilter || matches(c.name, courseFilter) || matches(c.course_code, courseFilter));

  log(`✓ ${courses.length} course${courses.length === 1 ? '' : 's'}${raw.length !== courses.length ? ` (of ${raw.length} enrolled)` : ''}`);
  if (!courses.length) {
    log('  nothing matched. Without --term/--course this lists active student enrolments only;');
    log('  add --include-concluded to see finished terms.');
  }

  const out = [];
  for (let i = 0; i < courses.length; i += CONCURRENCY) {
    out.push(...await Promise.all(courses.slice(i, i + CONCURRENCY).map(c => oneCourse(api, c, log))));
  }

  return {
    generated: new Date().toISOString(),
    host: api.base.replace(/\/api\/v1$/, ''),
    user: { id: self?.id ?? null, name: self?.name ?? null },
    courses: out,
  };
}

async function oneCourse(api, course, log) {
  const id = course.id;
  const gaps = [];

  /** Records what a course does not expose instead of failing the run. */
  const tryGet = async (label, fn, fallback) => {
    try {
      return await fn();
    } catch (err) {
      gaps.push(`${label}: ${err.message ?? err}`);
      return fallback;
    }
  };

  const [groups, assignments, announcements, modules, files, events, quizzes] = await Promise.all([
    tryGet('assignment groups', () => api.list(`/courses/${id}/assignment_groups`), []),
    tryGet('assignments', () => api.list(`/courses/${id}/assignments`, {
      'include[]': ['submission', 'all_dates', 'score_statistics'], order_by: 'due_at',
    }), []),
    tryGet('announcements', () => api.list('/announcements', {
      'context_codes[]': [`course_${id}`], start_date: since(120), end_date: until(30), active_only: true,
    }), []),
    tryGet('modules', () => api.list(`/courses/${id}/modules`, { 'include[]': ['items'] }), []),
    tryGet('files', () => api.list(`/courses/${id}/files`, { sort: 'updated_at', order: 'desc' }), []),
    tryGet('calendar', () => api.list('/calendar_events', {
      'context_codes[]': [`course_${id}`], type: 'event', all_events: true,
    }), []),
    tryGet('quizzes', () => api.list(`/courses/${id}/quizzes`), []),
  ]);

  // Canvas returns module items inline only sometimes; fill the gaps directly.
  for (const mod of modules) {
    if (Array.isArray(mod.items) || !mod.items_url) continue;
    mod.items = await tryGet(`module “${mod.name}” items`, () => api.list(`/courses/${id}/modules/${mod.id}/items`), []);
  }

  log(`  ${course.course_code ?? course.name}: ${assignments.length} assignments · ${announcements.length} announcements · ${modules.length} modules${gaps.length ? ` · ${gaps.length} gap(s)` : ''}`);

  return {
    id,
    name: course.name ?? `Course ${id}`,
    code: course.course_code ?? null,
    term: course.term?.name ?? null,
    start_at: course.start_at ?? course.term?.start_at ?? null,
    end_at: course.end_at ?? course.term?.end_at ?? null,
    url: `${api.base.replace(/\/api\/v1$/, '')}/courses/${id}`,
    syllabus_body: course.syllabus_body ?? '',
    public_description: course.public_description ?? '',
    apply_assignment_group_weights: !!course.apply_assignment_group_weights,
    teachers: course.teachers ?? [],
    groups, assignments, announcements, modules, quizzes,
    // Canvas file urls are signed and expire within the hour, so a snapshot
    // that stored them would be full of dead links by the time it was read.
    // The id is stable; the url is reconstructed from it when one is needed.
    files: files.slice(0, 200).map(f => ({
      id: f.id, name: f.display_name ?? f.filename, type: f.content_type,
      size: f.size, updated: f.updated_at, folder: f.folder_id,
    })),
    events: events.map(e => ({
      id: e.id, title: e.title, start_at: e.start_at, end_at: e.end_at,
      all_day_date: e.all_day_date, location_name: e.location_name,
      description: e.description ?? '',
    })),
    gaps,
  };
}

const matches = (value, needle) =>
  String(value ?? '').toLowerCase().includes(String(needle ?? '').toLowerCase());
const since = days => new Date(Date.now() - days * 864e5).toISOString();
const until = days => new Date(Date.now() + days * 864e5).toISOString();
