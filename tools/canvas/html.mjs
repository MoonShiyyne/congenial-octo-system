/**
 * Canvas stores syllabi, assignment descriptions and announcements as
 * instructor-pasted HTML — usually straight out of Word or Google Docs. This
 * turns that into text the extractors can read, keeping the structure that
 * carries meaning and dropping the structure that carries formatting.
 *
 * What is deliberately preserved: block boundaries become newlines, list items
 * keep a leading marker, table rows become tab-separated lines, headings keep a
 * `#` so a "Late Work" heading can still be told apart from the phrase "late
 * work" in a paragraph. A grading table pasted from Word is the single most
 * common way a syllabus states its weights, and flattening it to a word soup
 * loses the row alignment that makes it parseable at all.
 */

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–',
  mdash: '—', hellip: '…', rsquo: '’', lsquo: '‘', ldquo: '“',
  rdquo: '”', middot: '·', bull: '•', deg: '°', times: '×', frac12: '½',
};

export function decodeEntities(s) {
  return String(s ?? '')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => safeChar(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeChar(Number(d)))
    .replace(/&([a-z][a-z0-9]*);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);
}

const safeChar = code =>
  Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';

/** HTML → plain text, block structure intact. */
export function toText(html) {
  if (!html) return '';
  let s = String(html);
  s = s.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  // A newline in HTML source is whitespace, not a break — it is wherever the
  // author's editor happened to wrap. Collapsing them first means every
  // newline after this point is one this function put there deliberately,
  // which is what lets sentence splitting downstream be trusted. Input with
  // no tags at all is real plain text, so its own line breaks are kept.
  if (/<[a-z!/][^>]*>/i.test(s)) s = s.replace(/\r?\n/g, ' ');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/(p|div|section|article|h[1-6]|tr|li|blockquote|table|ul|ol)>/gi, '\n');
  s = s.replace(/<(h[1-6])\b[^>]*>/gi, '\n# ');
  s = s.replace(/<li\b[^>]*>/gi, '\n• ');
  s = s.replace(/<\/t[dh]>\s*(?=<t[dh])/gi, '\t');     // keep cell boundaries in a row
  s = s.replace(/<[^>]+>/g, '');
  s = decodeEntities(s);
  return s
    .replace(/ /g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ ]{2,}/g, ' ')
    .trim();
}

/**
 * One-line summary: text, collapsed and cut at a word boundary.
 *
 * Stops at the first list. An assignment description is almost always a
 * sentence of framing followed by the requirements as bullets, and flattening
 * the bullets into the summary buries the framing under half a checklist that
 * is about to be printed properly two inches further down.
 */
export function summarise(html, max = 220) {
  const lead = String(html ?? '').split(/<(?:ul|ol|table)\b/i)[0];
  const t = (toText(lead).trim() || toText(html)).replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ') > max * 0.6 ? cut.lastIndexOf(' ') : max).trimEnd() + '…';
}

/** Links, with Canvas's own file/page links marked so materials can be found. */
export function extractLinks(html) {
  const out = [];
  const re = /<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;
  for (const m of String(html ?? '').matchAll(re)) {
    const href = decodeEntities(m[2]);
    const text = toText(m[3]).replace(/\s+/g, ' ').trim();
    if (!href || href.startsWith('#')) continue;
    out.push({ href, text: text || href, kind: linkKind(href) });
  }
  return dedupe(out, l => l.href);
}

const linkKind = href =>
  /\/files\/|\/courses\/\d+\/files/.test(href) ? 'file'
  : /\/pages\//.test(href) ? 'page'
  : /\/assignments\//.test(href) ? 'assignment'
  : /\/modules\//.test(href) ? 'module'
  : /^mailto:/i.test(href) ? 'email'
  : 'external';

/** List items, flattened across every ul/ol in the fragment. */
export function extractListItems(html) {
  return [...String(html ?? '').matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
    .map(m => toText(m[1]).replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

/** Table rows as arrays of cells. The shape a grading breakdown arrives in. */
export function extractTableRows(html) {
  const rows = [];
  for (const m of String(html ?? '').matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...m[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)]
      .map(c => toText(c[1]).replace(/\s+/g, ' ').trim());
    if (cells.some(Boolean)) rows.push(cells);
  }
  return rows;
}

/**
 * Splits text into `{ heading, body }` sections on `#` markers and on lines
 * that are heading-shaped without being tagged as one — a short bare line, no
 * terminal punctuation, often ALL CAPS or "Title:". Instructors mark sections
 * that way far more often than they use a real <h2>.
 */
export function sections(text) {
  const lines = String(text ?? '').split('\n');
  const out = [{ heading: '', body: [] }];
  for (const line of lines) {
    const t = line.trim();
    if (!t) { out.at(-1).body.push(''); continue; }
    const tagged = t.startsWith('# ');
    const bare = !tagged && t.length <= 60 && !/[.!?,;]$/.test(t) &&
      (/^[A-Z0-9][^a-z]*$/.test(t) || /^[A-Z][\w' &/-]*:?$/.test(t) || /^[A-Z][\w' &/-]+(\s+[A-Z][\w' &/-]+){0,4}:$/.test(t));
    if (tagged || bare) out.push({ heading: t.replace(/^#\s*/, '').replace(/:$/, ''), body: [] });
    else out.at(-1).body.push(t);
  }
  return out
    .map(s => ({ heading: s.heading, body: s.body.join('\n').trim() }))
    .filter(s => s.heading || s.body);
}

/** Sentences, good enough for text where "Dr." and "3 p.m." are common. */
export function sentences(text) {
  return String(text ?? '')
    .replace(/\b(Dr|Prof|Mr|Mrs|Ms|Sr|Jr|vs|etc|i\.e|e\.g|a\.m|p\.m|St|Ave|No)\./gi, '$1<DOT>')
    .split(/(?<=[.!?])\s+|\n+/)
    .map(s => s.replace(/<DOT>/g, '.').replace(/\s+/g, ' ').trim())
    .filter(s => s.length > 1);
}

export function dedupe(list, key = x => x) {
  const seen = new Set();
  return list.filter(x => {
    const k = key(x);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
