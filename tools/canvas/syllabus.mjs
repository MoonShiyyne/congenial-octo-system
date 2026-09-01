/**
 * Reads a syllabus the way a student does on the first day: when does this
 * meet, how is the grade actually computed, what will get me penalised, and
 * what do I have to buy.
 *
 * Everything here is heuristic — a syllabus is prose, not a schema — so each
 * extraction carries where it came from. A weighting read out of Canvas's own
 * assignment groups is authoritative; the same weighting scraped from a
 * sentence is a guess, and the brief says which one it is showing. Where the
 * two disagree the brief reports the disagreement rather than picking a side:
 * a syllabus that says 30% and a Canvas group set to 25% is a real thing that
 * happens, and it is worth an email to the instructor, not a silent choice.
 */
import { toText, sections, sentences, extractTableRows, extractLinks, dedupe } from './html.mjs';

// ── meeting times ──────────────────────────────────────────────────────────

/* Keyed on the first three letters, because the day-name pattern captures
   whatever prefix the writer used — "Tues", "Thurs", "Wednes" all arrive here. */
const DAY_NAMES = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
/** Compact codes as registrars write them: R is Thursday, U is Sunday. */
const DAY_CODES = { M: 'Mon', T: 'Tue', W: 'Wed', R: 'Thu', F: 'Fri', S: 'Sat', U: 'Sun' };
export const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TIME = /(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s*m\.?/i;
const TIME_RANGE = new RegExp(
  `(\\d{1,2}(?::\\d{2})?\\s*(?:[ap]\\.?\\s*m\\.?)?)\\s*(?:-|–|—|to|until)\\s*(\\d{1,2}(?::\\d{2})?\\s*[ap]?\\.?\\s*m?\\.?)`, 'i');

/** "3:15 pm" → minutes since midnight. `borrow` supplies a missing am/pm. */
export function parseClock(raw, borrow) {
  const s = String(raw ?? '').trim();
  const m = s.match(TIME) ?? s.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  if (h > 23 || min > 59) return null;
  const mer = (m[3] ?? borrow ?? '').toLowerCase();
  if (mer === 'p' && h < 12) h += 12;
  if (mer === 'a' && h === 12) h = 0;
  // No meridiem anywhere: a bare 1–7 in a class schedule means the afternoon.
  if (!mer && h >= 1 && h <= 7) h += 12;
  return h * 60 + min;
}

export const clockLabel = mins => {
  if (mins == null) return null;
  const h = Math.floor(mins / 60), m = mins % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
};

/** Day tokens out of a fragment like "Tues/Thurs" or "MWF" or "M W F". */
export function parseDays(raw) {
  const s = String(raw ?? '');
  const named = [...s.matchAll(/\b(mon|tues?|wed(?:nes)?|thur?s?|fri|sat(?:ur)?|sun)(?:day)?s?\b/gi)]
    .map(m => DAY_NAMES[m[1].toLowerCase().slice(0, 3)])
    .filter(Boolean);
  if (named.length) return orderDays(named);

  // Compact codes only where the token is *entirely* day letters, so "MW" is a
  // schedule and "WAR" is a word. TR/MWF/TTh are the common shapes.
  const codes = [];
  for (const m of s.matchAll(/\b((?:Th|[MTWRFSU]){1,7})\b/g)) {
    const tok = m[1];
    if (!/^(?:Th|[MTWRFSU])+$/.test(tok) || tok.length < 2) continue;
    let i = 0;
    while (i < tok.length) {
      if (tok.slice(i, i + 2) === 'Th') { codes.push('Thu'); i += 2; }
      else { codes.push(DAY_CODES[tok[i]]); i += 1; }
    }
  }
  return orderDays(codes.filter(Boolean));
}

const orderDays = list => DAY_ORDER.filter(d => list.includes(d));

const MEETING_CUE = /\b(lecture|lab|laboratory|discussion|section|seminar|studio|recitation|class|meets?|meeting time|when)\b/i;
const MONTH_WORD = /^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i;
/* Three shapes, in descending confidence: keyed ("in Rice Hall 130"), named
   ("Wilson Hall 214"), and the bare trailing form a timetable line ends with
   ("… 2:00-3:15 pm, Olsson 120"). The last one is only read at the end of a
   clause, and never off a month name, or every "October 14" becomes a room. */
const ROOM_PATTERNS = [
  /\b(?:in|at|room|rm\.?|location|bldg|building|hall)[:\s]+([A-Z][\w.'-]*(?:\s+[A-Z][\w.'-]*){0,3}\s*\d{1,4}[A-Z]?)\b/,
  /\b([A-Z][a-z]+\s+(?:Hall|Center|Centre|Building|Library|Lab|Auditorium)\s*\d{0,4}[A-Z]?)\b/,
  /,\s*([A-Z][A-Za-z.'-]{2,}(?:\s+[A-Z][A-Za-z.'-]+)?\s+[A-Z]?\d{1,4}[A-Z]?)\s*\.?\s*$/,
];

function findRoom(text) {
  for (const re of ROOM_PATTERNS) {
    const m = String(text).match(re);
    const hit = m?.[1]?.trim();
    if (hit && !MONTH_WORD.test(hit)) return hit;
  }
  return null;
}

/**
 * Meeting patterns from syllabus prose. Only lines that carry both days and a
 * time survive: "Monday" alone in a policy sentence is not a class meeting.
 */
export function meetingsFromText(text) {
  const out = [];
  // "Lecture meets TR 2-3:15. Lab: W 4-5:50." is one paragraph and two
  // meetings, so clauses are the unit here, not lines.
  const clauses = String(text ?? '').split('\n').flatMap(l => l.split(/(?<=[.;])\s+/));
  for (const line of clauses) {
    const t = line.trim();
    if (!t || t.length > 200) continue;
    let days = parseDays(t);
    // A single letter is a day only when a clock time follows it immediately —
    // "T 2:00 pm" is Tuesday, the T in "Final: T. Nguyen" is not.
    if (!days.length) {
      const lone = t.match(/\b([MTWRFSU])\.?\s+(?=\d{1,2}(?::\d{2})?\s*(?:[ap]\.?m|[-\u2013\u2014]))/);
      if (lone && MEETING_CUE.test(t)) days = [DAY_CODES[lone[1]]];
    }
    if (!days.length) continue;
    const range = t.match(TIME_RANGE);
    const single = !range && t.match(TIME);
    if (!range && !single) continue;

    // Borrow the end meridiem for a bare start: "9:30–10:45 am".
    const endMer = (range?.[2] ?? '').match(/([ap])\.?\s*m/i)?.[1];
    const start = parseClock(range ? range[1] : single[0], endMer);
    const end = range ? parseClock(range[2]) : null;
    if (start == null) continue;

    out.push({
      kind: labelFor(t),
      days,
      start, end,
      time: end != null ? `${clockLabel(start)}–${clockLabel(end)}` : clockLabel(start),
      location: findRoom(t),
      source: 'syllabus',
      evidence: t.slice(0, 160),
    });
  }
  return dedupe(out, m => `${m.kind}|${m.days.join('')}|${m.start}`);
}

const labelFor = t =>
  /\blab\b|laborator/i.test(t) ? 'Lab'
  : /\bdiscussion|recitation|section\b/i.test(t) ? 'Discussion'
  : /\bseminar\b/i.test(t) ? 'Seminar'
  : /\bstudio\b/i.test(t) ? 'Studio'
  : /\boffice hours?\b/i.test(t) ? 'Office hours'
  : 'Lecture';

/**
 * Recurring meetings from the course calendar. Canvas events are individual
 * dated occurrences, so a weekly class shows up as ~15 of them; they are
 * folded back into one pattern per (weekday, start time).
 */
export function meetingsFromEvents(events = []) {
  const buckets = new Map();
  for (const e of events) {
    const startAt = e.start_at ?? e.all_day_date;
    if (!startAt) continue;
    const d = new Date(startAt);
    if (Number.isNaN(d.getTime())) continue;
    const day = DAY_ORDER[(d.getUTCDay() + 6) % 7];
    const start = d.getUTCHours() * 60 + d.getUTCMinutes();
    const key = `${start}|${(e.title ?? '').toLowerCase()}`;
    const end = e.end_at ? (() => {
      const x = new Date(e.end_at);
      return Number.isNaN(x.getTime()) ? null : x.getUTCHours() * 60 + x.getUTCMinutes();
    })() : null;
    const b = buckets.get(key) ?? { days: new Set(), count: 0, start, end, title: e.title ?? '', location: e.location_name || null };
    b.days.add(day);
    b.count++;
    b.location ??= e.location_name || null;
    buckets.set(key, b);
  }
  return [...buckets.values()]
    .filter(b => b.count >= 3)                       // three or more: a pattern, not a one-off
    .map(b => ({
      kind: labelFor(b.title),
      days: DAY_ORDER.filter(d => b.days.has(d)),
      start: b.start, end: b.end,
      time: b.end != null ? `${clockLabel(b.start)}–${clockLabel(b.end)}` : clockLabel(b.start),
      location: b.location,
      source: 'calendar',
      evidence: `${b.count} calendar events titled “${b.title}”`,
    }));
}

// ── grading ────────────────────────────────────────────────────────────────

const PCT_LABEL = /^(.{2,48}?)[\s.:–—-]*\(?(\d{1,3}(?:\.\d)?)\s?%\)?$/;
const LABEL_PCT = /^\(?(\d{1,3}(?:\.\d)?)\s?%\)?[\s.:–—-]*(.{2,48})$/;

/** Weightings stated in the syllabus, from tables first and then prose. */
export function gradingFromSyllabus(html) {
  const found = [];
  for (const row of extractTableRows(html)) {
    const cells = row.filter(Boolean);
    if (cells.length < 2) continue;
    const pctCell = cells.find(c => /^\(?\d{1,3}(\.\d)?\s?%\)?$/.test(c.trim()));
    const label = cells.find(c => c !== pctCell && /[a-z]{3}/i.test(c));
    if (pctCell && label) found.push({ label: tidy(label), weight: Number(pctCell.replace(/[^\d.]/g, '')) });
  }
  if (!found.length) {
    for (const line of toText(html).split('\n')) {
      const t = line.replace(/^[•\-*\d.)\s]+/, '').trim();
      // A line that is exactly "Homework 30%" or "30% Homework" — a list.
      const whole = t.match(PCT_LABEL) ?? t.match(LABEL_PCT);
      if (whole) {
        const [label, pct] = PCT_LABEL.test(t) ? [whole[1], whole[2]] : [whole[2], whole[1]];
        if (/[a-z]{3}/i.test(label)) { found.push({ label: tidy(label), weight: Number(pct) }); continue; }
      }
      // A sentence that lists several at once: "quizzes are worth 20%, the
      // exams 45%, and the notebook 20%". Common, and invisible to a
      // line-anchored pattern, so each percentage is read with the words in
      // front of it as its label.
      if ((t.match(/\d{1,3}\s?%/g) ?? []).length >= 2) found.push(...inlineWeights(t));
    }
  }
  const rows = dedupe(found.filter(f => f.weight > 0 && f.weight <= 100), f => f.label.toLowerCase());
  const total = rows.reduce((s, r) => s + r.weight, 0);
  // Only trust a scrape that adds up. A stray "worth 10% of your final grade"
  // in a policy paragraph is a percentage, not a grading scheme.
  return { rows, total: round(total), plausible: rows.length >= 2 && total >= 90 && total <= 110 };
}

/** Percentages inside one sentence, each labelled from the words before it. */
const FILLER = /^(?:are|is|was|were|will|be|worth|counts?|count|makes?|make|up|for|comprises?|constitutes?|of|the|a|an|your|and|each|total|combined|together|at|about|approximately|roughly|to|following|composed|grade|remaining|rest)$/i;

export function inlineWeights(sentence) {
  const out = [];
  const re = /(\d{1,3}(?:\.\d)?)\s?%/g;
  let cursor = 0;
  for (const m of sentence.matchAll(re)) {
    // Anything before the last colon is the lead-in ("composed of the
    // following:"), not a label for this percentage.
    const before = sentence.slice(cursor, m.index).split(/[:]/).pop();
    cursor = m.index + m[0].length;
    const words = before.split(/[\s,;:—–-]+/).filter(Boolean);
    // Trim the connective words from both ends: what is left is the thing
    // being weighted. "total, the lab notebook is worth" → "lab notebook".
    let end = words.length, start = 0;
    while (end > start && FILLER.test(words[end - 1])) end--;
    while (start < end && FILLER.test(words[start])) start++;
    const label = words.slice(Math.max(start, end - 4), end).join(' ');
    if (!/[a-z]{3}/i.test(label)) continue;
    out.push({ label: tidy(label), weight: Number(m[1]) });
  }
  return out;
}

/** Weightings Canvas itself is using — authoritative when groups are weighted. */
export function gradingFromCanvas(groups = [], weighted = true) {
  if (!weighted) return { rows: [], weighted: false, total: 0 };
  const rows = groups
    .filter(g => Number(g.group_weight) > 0)
    .map(g => ({ label: tidy(g.name ?? ''), weight: Number(g.group_weight), id: g.id }));
  return { rows, weighted: rows.length > 0, total: round(rows.reduce((s, r) => s + r.weight, 0)) };
}

/**
 * The same category, named two ways. "Response Papers" in Canvas is "Short
 * response papers" in the syllabus, and neither is a prefix of the other, so
 * this matches on shared words rather than on leading characters.
 *
 * The tie rule matters more than the matcher: within one course, "Final Exam"
 * and "Unit Exams" both contain "exam", and guessing between them would invent
 * a conflict that does not exist. A match is only accepted when one candidate
 * beats every other outright.
 */
const GENERIC = new Set(['grade', 'grades', 'total', 'course', 'work', 'other', 'your']);
const stems = label => String(label).toLowerCase().match(/[a-z]{3,}/g)?.filter(w => !GENERIC.has(w)).map(w => w.replace(/s$/, '')) ?? [];

const sharedWords = (a, b) => {
  const A = stems(a), B = stems(b);
  return A.filter(x => B.some(y => x === y || (x.length >= 4 && y.startsWith(x)) || (y.length >= 4 && x.startsWith(y)))).length;
};

export function bestMatch(label, candidates) {
  const scored = candidates.map(c => ({ row: c, score: sharedWords(label, c.label) }))
    .sort((a, b) => b.score - a.score);
  if (!scored.length || scored[0].score === 0) return null;
  if (scored[1] && scored[1].score === scored[0].score) return null;   // ambiguous → no claim
  return scored[0].row;
}

export function reconcileGrading(canvas, syllabus) {
  const conflicts = [];
  if (canvas.weighted && syllabus.plausible) {
    for (const c of canvas.rows) {
      const s = bestMatch(c.label, syllabus.rows);
      if (s && Math.abs(s.weight - c.weight) >= 1) {
        conflicts.push({ label: c.label, canvas: c.weight, syllabus: s.weight, syllabusLabel: s.label });
      }
    }
  }
  const source = canvas.weighted ? 'canvas' : syllabus.plausible ? 'syllabus' : 'points';
  return { source, rows: canvas.weighted ? canvas.rows : syllabus.rows, conflicts, canvas, syllabus };
}

// ── policies ───────────────────────────────────────────────────────────────

/**
 * The policies that change what you do. Everything else in a syllabus is
 * context; these five are the ones with a cost attached.
 */
const POLICY_KINDS = [
  { id: 'late', label: 'Late work', heading: /late|deadline|due date|extension/i,
    cue: /\b(late|past the deadline|after the due date|extension|penalt|docked|deducted|no credit|will not be accepted|grace period)\b/i },
  { id: 'attendance', label: 'Attendance', heading: /attendance|absence|participation/i,
    cue: /\b(attendance|absent|absences|miss(?:ing|ed)? (?:more than |a )?class|participation grade|excused)\b/i },
  { id: 'integrity', label: 'Academic integrity', heading: /integrity|plagiar|honest|cheat|misconduct/i,
    cue: /\b(academic (?:integrity|honesty|dishonesty|misconduct)|plagiaris|cheating|your own work|cite your sources)\b/i },
  { id: 'ai', label: 'AI and LLM use', heading: /\b(ai|a\.i\.|artificial intelligence|chatgpt|generative)\b/i,
    cue: /\b(chatgpt|generative ai|large language model|\bllms?\b|\bai tools?\b|artificial intelligence|copilot|claude)\b/i },
  { id: 'regrade', label: 'Regrades and disputes', heading: /regrade|dispute|appeal|grade challenge/i,
    cue: /\b(regrade|re-grade|dispute a grade|grade appeal|within \d+ (?:hours|days) of (?:receiving|the grade))\b/i },
];

export function extractPolicies(text) {
  const secs = sections(text);
  const all = sentences(text);
  const out = [];
  for (const kind of POLICY_KINDS) {
    // A section headed for the policy wins: its body is the whole rule.
    const sec = secs.find(s => s.heading && kind.heading.test(s.heading) && s.body);
    let quote, from;
    if (sec) {
      quote = budget(sentences(sec.body), 4, 400);
      from = `“${sec.heading}” section`;
    } else {
      const hits = all.filter(s => kind.cue.test(s) && s.length > 25).slice(0, 2);
      if (!hits.length) continue;
      quote = budget(hits, 2, 400);
      from = 'syllabus text';
    }
    out.push({ id: kind.id, label: kind.label, text: quote, from, teeth: teeth(quote) });
  }
  return out;
}

/**
 * As many whole sentences as fit. A policy cut mid-clause — "…no questions
 * asked;" — reads as though the rule ends there, which is worse than one
 * sentence less.
 */
function budget(list, maxCount, maxChars) {
  const out = [];
  for (const s of list.slice(0, maxCount)) {
    if (out.length && out.join(' ').length + s.length + 1 > maxChars) break;
    out.push(s);
  }
  return out.join(' ') || clip(list[0] ?? '', maxChars);
}

/**
 * The number in a policy is the part you need: "10% per day", "3 absences",
 * "two late passes". Syllabi spell small numbers as words at least as often as
 * they use digits, and "two late passes for the term" is exactly the clause a
 * student wants pulled out, so both forms are read.
 */
const WORD_NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const numeral = w => (/^\d+$/.test(w) ? Number(w) : WORD_NUM[String(w).toLowerCase()]);

function teeth(s) {
  const bits = [];
  for (const m of String(s).matchAll(/(\d{1,3}(?:\.\d)?%)\s*(?:per|a|each|\/)\s*(day|hour|class|week|calendar day|business day)/gi)) {
    bits.push(`${m[1]} per ${m[2]}`);
  }
  const COUNT = new RegExp(`\\b(\\d{1,2}|${Object.keys(WORD_NUM).join('|')})\\s+(?:unexcused\\s+)?(absences?|late (?:days?|passes|submissions?)|extensions?|drops?|lowest scores?|attempts?)\\b`, 'gi');
  for (const m of String(s).matchAll(COUNT)) {
    const n = numeral(m[1]);
    if (n != null) bits.push(`${n} ${m[2].toLowerCase()}`);
  }
  const WITHIN = new RegExp(`\\bwithin\\s+(\\d{1,3}|${Object.keys(WORD_NUM).join('|')})\\s+(hours?|days?|weeks?)\\b`, 'gi');
  for (const m of String(s).matchAll(WITHIN)) {
    const n = numeral(m[1]);
    if (n != null) bits.push(`within ${n} ${m[2].toLowerCase()}`);
  }
  if (/\bnot\s+be\s+accepted\b|\bno\s+late\b|\bzero\b/i.test(s)) bits.push('no late credit');
  return dedupe(bits).slice(0, 4);
}

// ── materials, contacts, key dates ────────────────────────────────────────

const ISBN = /\b(?:ISBN(?:-1[03])?:?\s*)?((?:97[89][-\s]?)?[\d][-\s\d]{8,14}[\dXx])\b/;

export function extractMaterials(html) {
  const text = toText(html);
  const secs = sections(text);
  const out = [];
  const bookish = /textbook|required text|required material|readings?|course pack|materials|supplies|edition|isbn/i;
  for (const s of secs) {
    if (!(s.heading && bookish.test(s.heading))) continue;
    for (const line of s.body.split('\n')) {
      const t = line.replace(/^[•\-*\d.)\s]+/, '').trim();
      if (t.length < 8 || t.length > 220) continue;
      const required = !/^\s*(optional|recommended|suggested)\b|\((?:optional|recommended)\)/i.test(t);
      const isbn = t.match(ISBN)?.[1]?.replace(/[\s-]/g, '') ?? null;
      out.push({ title: cleanTitle(t, { required, isbn }), isbn, required });
    }
  }
  if (!out.length) {
    for (const line of text.split('\n')) {
      if (!ISBN.test(line)) continue;
      const t = line.replace(/^[•\-*\d.)\s]+/, '').trim();
      if (t.length <= 8) continue;
      const isbn = t.match(ISBN)[1].replace(/[\s-]/g, '');
      out.push({ title: cleanTitle(t, { required: true, isbn }), isbn, required: true });
    }
  }
  const links = extractLinks(html).filter(l => l.kind === 'file' || l.kind === 'page');
  return { items: dedupe(out, m => m.title.toLowerCase()).slice(0, 12), links: links.slice(0, 12) };
}

/** The title with what the row already carries in its own columns taken out. */
function cleanTitle(raw, { required, isbn }) {
  let t = String(raw);
  if (!required) t = t.replace(/^\s*(optional|recommended|suggested)\s*[:.\-–]?\s*/i, '');
  if (isbn) t = t.replace(/[,;.]?\s*\(?ISBN(?:-1[03])?:?\s*[\d][-\s\d]{8,14}[\dXx]\)?/i, '');
  return t.replace(/\s{2,}/g, ' ').replace(/[\s,;.]+$/, '').trim();
}

const EMAIL = /\b[\w.+-]+@[\w-]+\.[\w.-]{2,}\b/g;

export function extractContacts(text, teachers = []) {
  const emails = dedupe([...String(text ?? '').matchAll(EMAIL)].map(m => m[0].toLowerCase()));
  const officeHours = [];
  for (const line of String(text ?? '').split('\n')) {
    if (!/office hours?/i.test(line) || line.length > 220) continue;
    const days = parseDays(line);
    const range = line.match(TIME_RANGE);
    officeHours.push({
      who: line.match(/^([^:]{2,40}?)\s*(?:office hours)/i)?.[1]?.trim() || null,
      days, time: range ? `${clockLabel(parseClock(range[1], (range[2].match(/([ap])/i) ?? [])[1]))}–${clockLabel(parseClock(range[2]))}` : null,
      location: findRoom(line),
      evidence: line.trim().slice(0, 160),
    });
  }
  const staff = teachers.map(t => ({
    name: t.display_name ?? t.short_name ?? t.name ?? 'Instructor',
    email: (t.email ?? '').toLowerCase() || null,
    role: t.enrollments?.[0]?.type === 'TaEnrollment' ? 'TA' : 'Instructor',
  }));
  return { staff, emails: emails.filter(e => !staff.some(s => s.email === e)).slice(0, 4), officeHours: officeHours.slice(0, 4) };
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const DATE_RE = new RegExp(
  `\\b(${MONTHS.join('|')})[a-z]*\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s*(\\d{4}))?|\\b(\\d{1,2})/(\\d{1,2})(?:/(\\d{2,4}))?\\b`, 'i');

/** A date in prose → ISO, with the year inferred from the term when omitted. */
export function parseLooseDate(raw, refYear = new Date().getUTCFullYear()) {
  const m = String(raw ?? '').match(DATE_RE);
  if (!m) return null;
  let y, mo, d;
  if (m[1]) {
    mo = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
    d = Number(m[2]);
    y = m[3] ? Number(m[3]) : refYear;
  } else {
    mo = Number(m[4]) - 1; d = Number(m[5]);
    y = m[6] ? (m[6].length === 2 ? 2000 + Number(m[6]) : Number(m[6])) : refYear;
  }
  if (mo < 0 || mo > 11 || d < 1 || d > 31) return null;
  const iso = new Date(Date.UTC(y, mo, d, 12));
  return Number.isNaN(iso.getTime()) ? null : iso.toISOString().slice(0, 10);
}

const EXAM_CUE = /\b(midterm|final exam|final\b|exam|quiz|test|presentation|defen[cs]e|practical|oral)\b/i;
const NO_CLASS = /\b(no class|holiday|break|recess|cancell?ed)\b/i;

/** Dated lines that look like a fixed point in the term, not an assignment. */
export function extractKeyDates(text, refYear) {
  const out = [];
  for (const line of String(text ?? '').split('\n')) {
    const t = line.replace(/^[•\-*\s]+/, '').replace(/\s+/g, ' ').trim();
    if (t.length < 8 || t.length > 200) continue;
    const isExam = EXAM_CUE.test(t), isBreak = NO_CLASS.test(t);
    if (!isExam && !isBreak) continue;
    const date = parseLooseDate(t, refYear);
    if (!date) continue;
    out.push({ date, kind: isBreak ? 'no class' : 'assessment', text: clip(t, 140) });
  }
  return dedupe(out, k => `${k.date}|${k.kind}`).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 20);
}

// ── the whole thing ────────────────────────────────────────────────────────

export function analyseSyllabus({ course, groups = [], events = [], teachers = [], weighted }) {
  const html = course.syllabus_body ?? '';
  const text = toText(html);
  const refYear = new Date(course.start_at ?? course.created_at ?? Date.now()).getUTCFullYear();

  const fromEvents = meetingsFromEvents(events);
  const fromText = meetingsFromText(text);
  // The calendar is fact; syllabus prose only fills in what the calendar misses.
  const meetings = [...fromEvents,
    ...fromText.filter(t => !fromEvents.some(e => e.start === t.start && overlap(e.days, t.days)))];

  return {
    hasSyllabus: text.length > 40,
    words: text.split(/\s+/).filter(Boolean).length,
    meetings,
    grading: reconcileGrading(gradingFromCanvas(groups, weighted ?? groups.some(g => Number(g.group_weight) > 0)),
                              gradingFromSyllabus(html)),
    policies: extractPolicies(text),
    materials: extractMaterials(html),
    contacts: extractContacts(text, teachers),
    keyDates: extractKeyDates(text, refYear),
  };
}

const overlap = (a, b) => a.some(x => b.includes(x));
const tidy = s => String(s).replace(/\s+/g, ' ').replace(/[:–—-]+$/, '').trim();
const clip = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1).trimEnd() + '…' : String(s));
const round = n => Math.round(n * 10) / 10;
