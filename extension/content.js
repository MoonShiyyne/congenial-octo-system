/**
 * Runs inside the Canvas tab. Two jobs, and deliberately no third:
 *
 *   1. **Be the way out.** The service worker hands it a url; it fetches it
 *      from here, where the request is same-origin and carries the session
 *      cookie the user already has. That is the whole reason this extension
 *      needs no access token.
 *   2. **Draw the panel**, and — on an assignment page — a card above the
 *      assignment itself, which is the moment the brief is actually wanted.
 *
 * All analysis happens in the worker. This file has no opinion about what an
 * assignment is worth; it renders what it is given.
 *
 * Everything is built with `document.createElement` and `textContent`, never
 * with innerHTML. The strings passing through here are instructor-written
 * course text, and the one thing that must never happen is a syllabus that
 * runs as script because it was interpolated into a template.
 */
(() => {
  if (window.__canvasPrepBriefs) return;            // injected twice: no-op
  window.__canvasPrepBriefs = true;

  const ORIGIN = location.origin;
  let state = { result: null, loading: false, error: null, tab: null };
  let host, root;

  // ── message handling ─────────────────────────────────────────────────────

  chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
    if (msg?.type === 'ping') { reply({ ok: true }); return false; }
    if (msg?.type === 'toggle') { toggle(); reply({ ok: true }); return false; }
    if (msg?.type === 'http') { proxy(msg).then(reply); return true; }
    return false;
  });

  /**
   * The fetch the worker cannot do itself. Same-origin only: this function
   * takes a url from another context and puts the user's cookies on it, so it
   * must never be usable as a general-purpose request forwarder.
   */
  async function proxy({ url, headers }) {
    if (!url.startsWith(ORIGIN + '/')) return { status: 0, ok: false, body: '', headers: {} };
    try {
      const res = await fetch(url, {
        headers, credentials: 'same-origin', redirect: 'follow',
        signal: AbortSignal.timeout(45_000),
      });
      const flat = {};
      res.headers.forEach((v, k) => { flat[k.toLowerCase()] = v; });
      return { status: res.status, ok: res.ok, body: await res.text(), headers: flat };
    } catch (err) {
      return { status: 0, ok: false, body: String(err?.message ?? err), headers: {} };
    }
  }

  const ask = msg => new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, res => {
      const err = chrome.runtime.lastError;
      if (err) return reject(new Error(err.message));
      if (res?.error) return reject(new Error(res.error));
      resolve(res);
    });
  });

  // ── where are we ─────────────────────────────────────────────────────────

  const context = () => ({
    courseId: Number((location.pathname.match(/\/courses\/(\d+)/) ?? [])[1]) || null,
    assignmentId: Number((location.pathname.match(/\/assignments\/(\d+)/) ?? [])[1]) || null,
  });

  const findCourse = () => state.result?.courses.find(c => c.id === context().courseId) ?? null;
  const findAssignment = () => {
    const { assignmentId } = context();
    if (!assignmentId) return null;
    for (const c of state.result?.courses ?? []) {
      const hit = c.assignments.find(a => a.id === assignmentId);
      if (hit) return hit;
    }
    return null;
  };

  // ── tiny DOM helper ──────────────────────────────────────────────────────

  function el(tag, props = {}, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2).toLowerCase(), v);
      else n.setAttribute(k, v);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      n.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return n;
  }

  const a = (href, text) => href
    ? el('a', { href, target: '_blank', rel: 'noopener', text })
    : document.createTextNode(text);

  // ── panel shell ──────────────────────────────────────────────────────────

  function mount() {
    if (host) return;
    host = el('div', { id: 'canvas-prep-briefs' });
    host.style.cssText = 'all: initial; position: fixed; z-index: 2147483647;';
    root = host.attachShadow({ mode: 'open' });
    root.append(el('style', { text: CSS }), el('div', { class: 'wrap', id: 'wrap' }));
    document.documentElement.append(host);
  }

  function toggle() {
    mount();
    const wrap = root.getElementById('wrap');
    const open = wrap.classList.toggle('open');
    if (open && !state.result && !state.loading) load(false);
    else render();
  }

  async function load(force) {
    state = { ...state, loading: true, error: null };
    render();
    try {
      const { result } = await ask({ type: 'briefs', force });
      state = { ...state, result, loading: false };
    } catch (err) {
      state = { ...state, loading: false, error: String(err.message ?? err) };
    }
    render();
    inlineCard();
  }

  function render() {
    if (!root) return;
    const wrap = root.getElementById('wrap');
    wrap.replaceChildren(header(), body());
  }

  function header() {
    return el('header', {},
      el('div', { class: 'title' },
        el('b', { text: 'Prep briefs' }),
        state.result && el('span', { class: 'muted',
          text: ` ${state.result.counts.courses} courses · ${state.result.counts.assignments} assignments` })),
      el('div', { class: 'acts' },
        el('button', { class: 'ghost', title: 'Pull from Canvas again', onclick: () => load(true), text: '↻' }),
        el('button', { class: 'ghost', title: 'Close',
          onclick: () => root.getElementById('wrap').classList.remove('open'), text: '✕' })));
  }

  function body() {
    if (state.loading) return el('div', { class: 'pad' }, el('p', { class: 'muted', text: 'Reading your courses…' }));
    if (state.error) {
      return el('div', { class: 'pad' },
        el('p', { class: 'err', text: state.error }),
        el('button', { class: 'primary', onclick: () => load(true), text: 'Try again' }));
    }
    if (!state.result) {
      return el('div', { class: 'pad' }, el('button', { class: 'primary', onclick: () => load(false), text: 'Read my courses' }));
    }

    const tabs = availableTabs();
    const current = tabs.find(t => t.id === state.tab) ?? tabs[0];
    return el('div', { class: 'main' },
      el('nav', {}, tabs.map(t => el('button', {
        class: t.id === current.id ? 'tab on' : 'tab',
        onclick: () => { state.tab = t.id; render(); }, text: t.label,
      }))),
      el('div', { class: 'pane' }, current.view()),
      footer());
  }

  function availableTabs() {
    const t = [];
    if (findAssignment()) t.push({ id: 'this', label: 'This assignment', view: viewAssignment });
    if (findCourse()) t.push({ id: 'course', label: 'This course', view: viewCourse });
    t.push({ id: 'now', label: 'Now', view: viewNow });
    t.push({ id: 'week', label: 'Week', view: viewWeek });
    t.push({ id: 'notices', label: 'Notices', view: viewNotices });
    return t;
  }

  function footer() {
    return el('footer', {},
      el('button', { class: 'ghost', onclick: () => ask({ type: 'dashboard' }).catch(showError), text: 'Full dashboard' }),
      el('button', { class: 'ghost', onclick: downloadMarkdown, text: 'Download .md' }),
      el('button', { class: 'ghost danger', title: 'Delete everything this extension has stored',
        onclick: forget, text: 'Forget data' }));
  }

  const showError = err => { state.error = String(err.message ?? err); render(); };

  async function downloadMarkdown() {
    try {
      const { text, name } = await ask({ type: 'markdown' });
      const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown' }));
      // The anchor goes in the page, not the shadow root: a download started
      // from inside a closed-over shadow tree is not reliably honoured.
      const link = el('a', { href: url, download: name });
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (err) { showError(err); }
  }

  async function forget() {
    await ask({ type: 'forget' });
    state = { result: null, loading: false, error: null, tab: null };
    document.getElementById('canvas-prep-brief-card')?.remove();
    render();
  }

  // ── views ────────────────────────────────────────────────────────────────

  const fmt = iso => {
    const d = new Date(iso ?? '');
    return Number.isNaN(d.getTime()) ? '—'
      : d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  };
  const rel = iso => {
    const t = Date.parse(iso ?? '');
    if (!Number.isFinite(t)) return '';
    const day = ms => { const d = new Date(ms); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); };
    const n = Math.round((day(t) - day(Date.now())) / 864e5);
    return n === 0 ? 'today' : n === 1 ? 'tomorrow' : n === -1 ? 'yesterday'
      : n > 0 ? `in ${n} days` : `${-n} days ago`;
  };
  const worth = p => (p ? `${p}%` : '—');

  function row(...kids) { return el('div', { class: 'row' }, ...kids); }

  function dueLine(b) {
    return el('div', { class: 'item' },
      el('div', { class: 'item-top' },
        el('span', { class: 'pill', text: b.course }),
        a(b.url, b.name)),
      el('div', { class: 'meta' },
        `${fmt(b.due)} · ${rel(b.due)} · ${worth(b.impact.percent)}`,
        b.startBy ? ` · start ${fmt(b.startBy)}` : '',
        b.effort ? ` · ~${b.effort.range}` : ''));
  }

  function viewNow() {
    const { radar } = state.result;
    const out = [];
    if (radar.overdue.length) {
      out.push(el('h3', { class: 'danger', text: 'Past due, not submitted' }),
        ...radar.overdue.map(dueLine));
    }
    if (radar.startNow.length) {
      out.push(el('h3', { text: 'Start these now' }),
        el('p', { class: 'muted small', text: 'Their estimated start date has passed. The estimate is a planning prior, not a prediction.' }),
        ...radar.startNow.slice(0, 10).map(dueLine));
    }
    out.push(el('h3', { text: `Due in the next ${radar.horizonDays} days` }));
    out.push(radar.upcoming.length
      ? el('div', {}, radar.upcoming.map(dueLine))
      : el('p', { class: 'muted', text: 'Nothing due in that window.' }));
    return el('div', {}, out);
  }

  function viewAssignment() {
    const b = findAssignment();
    if (!b) return el('p', { class: 'muted', text: 'Open an assignment to see its brief.' });
    const out = [el('h3', { text: b.name }), el('p', { class: 'small', text: b.oneLine })];

    out.push(el('dl', {},
      el('dt', { text: 'Due' }), el('dd', { text: b.due ? `${fmt(b.due)} · ${rel(b.due)}` : 'not set in Canvas' }),
      b.startBy && el('dt', { text: 'Start by' }),
      b.startBy && el('dd', { text: `${fmt(b.startBy)} — ${b.effort.range}, estimated` }),
      el('dt', { text: 'Worth' }),
      el('dd', {}, el('b', { text: b.impact.omitted ? 'not counted' : `${b.impact.percent}% of the final grade` }),
        el('span', { class: 'muted small', text: ` ${b.impact.basis}` }),
        b.impact.provisional && el('span', { class: 'muted small', text: ' — the only one posted in that group so far, so this share drops as more appear' })),
      el('dt', { text: 'Hand in' }), el('dd', { text: b.submission.label }),
      b.context && el('dt', { text: 'Sits in' }),
      b.context && el('dd', { text: `${b.context.module}, item ${b.context.position} of ${b.context.of}` })));

    if (b.flags.length) {
      out.push(el('h4', { text: 'Before you start' }),
        el('ul', { class: 'flags' }, b.flags.map(f => el('li', { text: f }))));
    }
    if (b.deliverables.length) {
      out.push(el('h4', { text: 'What to hand in' }),
        el('p', { class: 'muted small', text: `Read off ${b.deliverablesFrom} — check it against the page.` }),
        el('ul', { class: 'check' }, b.deliverables.map(d => el('li', { text: d }))));
    }
    if (b.constraints.length) {
      out.push(el('h4', { text: 'Rules that cost marks on their own' }),
        el('ul', { class: 'chips' }, b.constraints.map(c =>
          el('li', {}, el('span', { class: 'muted', text: `${c.kind} ` }), el('b', { text: c.value })))));
    }
    if (b.rubric) {
      out.push(el('h4', { text: `Where the points are — ${b.rubric.total} rubric points` }),
        el('ul', { class: 'weights' }, b.rubric.criteria.map(c => el('li', {},
          el('span', { class: 'wbar', style: `width:${Math.min(c.share, 100)}%` }),
          el('span', { text: c.name }), el('b', { text: `${c.share}%` })))));
    }
    if (b.context?.materials?.length) {
      out.push(el('h4', { text: 'The material the module puts before this' }),
        el('ul', { class: 'links' }, b.context.materials.map(m => el('li', {}, a(m.url, m.title)))));
    }
    if (b.announcements.length) {
      out.push(el('h4', { text: 'Announcements that touch this' }),
        el('ul', { class: 'links' }, b.announcements.map(an => el('li', {},
          an.changesDeadline && el('b', { class: 'danger', text: '⚠ possible deadline change — ' }),
          a(an.url, an.title),
          el('div', { class: 'meta', text: `${fmt(an.posted)} · matched because it ${an.why}` })))));
    }
    return el('div', {}, out);
  }

  function viewCourse() {
    const c = findCourse();
    if (!c) return el('p', { class: 'muted', text: 'Open a course to see its brief.' });
    const s = c.syllabus;
    const out = [el('h3', { text: c.code })];

    out.push(el('h4', { text: 'When it meets' }));
    out.push(s.meetings.length
      ? el('ul', { class: 'links' }, s.meetings.map(m => el('li', { text:
          `${m.kind} — ${m.days.join(' ')} ${m.time ?? ''}${m.location ? ` · ${m.location}` : ''}` })))
      : el('p', { class: 'muted', text: 'No meeting time found.' }));

    out.push(el('h4', { text: 'How the grade is computed' }));
    if (s.grading.rows.length) {
      out.push(el('ul', { class: 'weights' }, [...s.grading.rows].sort((x, y) => y.weight - x.weight)
        .map(r => el('li', {}, el('span', { class: 'wbar', style: `width:${Math.min(r.weight, 100)}%` }),
          el('span', { text: r.label }), el('b', { text: `${r.weight}%` })))));
      out.push(el('p', { class: 'muted small', text: `Source: ${sourceLabel(s.grading.source)}` }));
    } else {
      out.push(el('p', { class: 'muted', text: `No weighting published — ${c.courseTotal} points across the course.` }));
    }
    if (s.grading.conflicts.length) {
      out.push(el('p', { class: 'warn small' }, el('b', { text: 'Canvas and the syllabus disagree: ' }),
        s.grading.conflicts.map(k => `${k.label} — Canvas ${k.canvas}%, syllabus ${k.syllabus}%`).join('; '),
        '. Worth one email.'));
    }

    if (s.policies.length) {
      out.push(el('h4', { text: 'Policies with a cost' }));
      for (const p of s.policies) {
        out.push(el('div', { class: 'policy' },
          el('div', {}, el('b', { text: p.label }),
            p.teeth.map(t => el('code', { text: t }))),
          el('p', { class: 'muted small', text: p.text })));
      }
    }
    if (s.materials.items.length) {
      out.push(el('h4', { text: 'What you need' }),
        el('ul', { class: 'links' }, s.materials.items.map(m => el('li', {},
          !m.required && el('span', { class: 'tag', text: 'optional' }), ' ', m.title))));
    }
    if (c.health.length) {
      out.push(el('h4', { text: 'What this brief could not establish' }),
        el('ul', { class: 'flags' }, c.health.map(h => el('li', { text: h }))));
    }
    return el('div', {}, out);
  }

  const sourceLabel = src =>
    src === 'canvas' ? "Canvas's own group weights — this is what it computes with"
    : src === 'syllabus' ? 'scraped from the syllabus text — confirm it'
    : 'total points, no weighting published';

  function viewWeek() {
    const { byDay, conflicts } = state.result.schedule;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].filter(d => byDay[d]?.length);
    if (!days.length) return el('p', { class: 'muted', text: 'No meeting time could be established for any course.' });
    return el('div', {},
      days.map(d => el('div', { class: 'day' }, el('h4', { text: d }),
        byDay[d].map(s => el('div', { class: 'slot' },
          el('b', { text: s.course }), ' ', s.time ?? '',
          s.location ? el('span', { class: 'muted', text: ` · ${s.location}` }) : null,
          el('span', { class: 'tag', text: s.kind }))))),
      conflicts.length ? el('p', { class: 'warn small' }, el('b', { text: 'Clashes: ' }),
        conflicts.map(k => `${k.day} — ${k.a} overlaps ${k.b}`).join('; ')) : null);
  }

  function viewNotices() {
    const { needsAttention, items } = state.result.announcements;
    const out = [];
    if (needsAttention.length) {
      out.push(el('h3', { class: 'danger', text: 'May have moved a deadline' }),
        el('p', { class: 'muted small', text: 'Flagged on wording, not read. Thirty seconds of your own eyes each.' }),
        ...needsAttention.map(noticeLine));
    }
    out.push(el('h3', { text: 'Everything recent' }));
    out.push(items.length ? el('div', {}, items.map(noticeLine))
      : el('p', { class: 'muted', text: 'No announcements in the last 45 days.' }));
    return el('div', {}, out);
  }

  function noticeLine(n) {
    return el('div', { class: 'item' },
      el('div', { class: 'item-top' }, el('span', { class: 'pill', text: n.course }), a(n.url, n.title)),
      el('div', { class: 'meta', text: fmt(n.posted) }),
      n.summary ? el('p', { class: 'small muted', text: n.summary }) : null);
  }

  // ── the card on the assignment page ──────────────────────────────────────

  /**
   * The panel is opt-in; this is not. On an assignment page the brief goes
   * directly above the assignment, because that is where the question "what is
   * this actually worth, and where do the marks are" is being asked.
   */
  function inlineCard() {
    document.getElementById('canvas-prep-brief-card')?.remove();
    const b = findAssignment();
    if (!b) return;

    const anchor = document.querySelector(
      '.assignment-title, #assignment_show > h1, #content h1.title, #breadcrumbs + div h1, #content h1');
    if (!anchor?.parentNode) return;

    const cardHost = el('div', { id: 'canvas-prep-brief-card' });
    cardHost.style.cssText = 'all: initial; display: block; margin: 12px 0;';
    const shadow = cardHost.attachShadow({ mode: 'open' });

    const top = b.rubric?.criteria?.[0];
    shadow.append(el('style', { text: CSS }), el('div', { class: 'card' },
      el('div', { class: 'card-row' },
        stat(b.impact.omitted ? 'not counted' : `${b.impact.percent}%`, 'of the final grade'),
        stat(b.startBy ? fmt(b.startBy) : '—', 'start by'),
        stat(b.effort ? b.effort.range : '—', 'estimated work'),
        top ? stat(`${top.share}%`, `rubric: ${top.name}`) : null),
      b.flags.length ? el('ul', { class: 'flags' }, b.flags.slice(0, 3).map(f => el('li', { text: f }))) : null,
      el('button', { class: 'primary small', onclick: () => { state.tab = 'this'; mount(); root.getElementById('wrap').classList.add('open'); render(); },
        text: 'Open the full brief' })));

    anchor.parentNode.insertBefore(cardHost, anchor.nextSibling);
  }

  const stat = (value, label) => el('div', { class: 'stat' },
    el('b', { text: value }), el('span', { text: label }));

  // ── styles (inside the shadow root, so Canvas's CSS cannot reach them) ───

  const CSS = `
  :host, * { box-sizing: border-box; }
  .wrap {
    position: fixed; top: 0; right: 0; height: 100vh; width: 420px; max-width: 92vw;
    transform: translateX(100%); transition: transform .18s ease; display: flex;
    flex-direction: column; background: #fbfaf8; color: #1a1a19; border-left: 1px solid #e2ded6;
    box-shadow: -8px 0 32px rgba(0,0,0,.12);
    font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }
  .wrap.open { transform: none; }
  .main { display: flex; flex-direction: column; flex: 1; min-height: 0; }
  @media (prefers-color-scheme: dark) {
    .wrap { background: #16151a; color: #eceaf2; border-color: #2e2c36; }
    header, footer, nav { border-color: #2e2c36 !important; }
    .tab.on { background: #1e1d24; }
    .card { background: #1e1d24; border-color: #2e2c36; color: #eceaf2; }
    .item, .policy, .day { border-color: #2e2c36 !important; }
    .wbar { background: #4a3f80; }
    .slot { background: rgba(169,150,255,.10); border-color: #2e2c36; }
    code { background: rgba(232,176,96,.16); color: #e8b060; }
    .pill { background: rgba(169,150,255,.16); color: #a996ff; }
  }
  header { display: flex; justify-content: space-between; align-items: center; gap: 8px;
           padding: 12px 14px; border-bottom: 1px solid #e2ded6; }
  .title b { font-size: 15px; }
  .acts { display: flex; gap: 4px; }
  nav { display: flex; gap: 2px; padding: 6px 8px 0; border-bottom: 1px solid #e2ded6; overflow-x: auto; }
  .tab { border: 0; background: transparent; font: inherit; font-size: 12px; padding: 6px 10px;
         border-radius: 6px 6px 0 0; cursor: pointer; color: inherit; white-space: nowrap; opacity: .65; }
  .tab.on { opacity: 1; font-weight: 600; background: rgba(122,92,255,.10); }
  /* min-height:0 is load-bearing: without it this flex child grows to fit its
     content instead of scrolling, and a long brief pushes the footer off the
     bottom of the screen where its buttons cannot be reached. */
  .pane { flex: 1; min-height: 0; overflow-y: auto; padding: 12px 14px; }
  .pad { padding: 16px; }
  footer { display: flex; gap: 6px; padding: 8px 10px; border-top: 1px solid #e2ded6; flex-wrap: wrap; }
  button { font: inherit; cursor: pointer; }
  .ghost { background: transparent; border: 1px solid #e2ded6; border-radius: 6px; padding: 4px 9px;
           font-size: 12px; color: inherit; }
  .ghost:hover { border-color: #7a5cff; }
  .ghost.danger:hover { border-color: #b3261e; color: #b3261e; }
  .primary { background: #7a5cff; color: #fff; border: 0; border-radius: 6px; padding: 7px 12px; font-size: 13px; }
  .primary.small { padding: 5px 10px; font-size: 12px; margin-top: 8px; }
  h3 { font-size: 14px; margin: 16px 0 6px; }
  h3:first-child { margin-top: 0; }
  h4 { font-size: 11px; text-transform: uppercase; letter-spacing: .07em; opacity: .6;
       margin: 16px 0 6px; font-weight: 600; }
  p { margin: 4px 0; }
  .small { font-size: 12px; }
  .muted { opacity: .65; }
  .danger { color: #b3261e; }
  .warn { color: #b26a00; }
  .err { color: #b3261e; margin-bottom: 10px; }
  a { color: inherit; text-decoration: underline; text-underline-offset: 2px; }
  .item { border-top: 1px solid #e2ded6; padding: 8px 0; }
  .item:first-of-type { border-top: 0; }
  .item-top { display: flex; gap: 6px; align-items: baseline; }
  .meta { font-size: 12px; opacity: .65; margin-top: 2px; }
  .pill { background: rgba(122,92,255,.12); color: #5b3fd6; border-radius: 4px; padding: 1px 6px;
          font-size: 11px; font-weight: 600; white-space: nowrap; }
  .tag { font-size: 10px; opacity: .6; border: 1px solid currentColor; border-radius: 3px;
         padding: 0 4px; margin-left: 6px; }
  dl { display: grid; grid-template-columns: auto 1fr; gap: 3px 10px; margin: 10px 0; font-size: 13px; }
  dt { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; opacity: .55; padding-top: 2px; }
  dd { margin: 0; }
  ul { margin: 4px 0; padding-left: 0; list-style: none; }
  .flags li { font-size: 12px; padding: 3px 0 3px 14px; position: relative; }
  .flags li::before { content: "•"; position: absolute; left: 2px; opacity: .5; }
  .check li { font-size: 13px; padding: 3px 0 3px 20px; position: relative; }
  .check li::before { content: "☐"; position: absolute; left: 0; opacity: .55; }
  .links li { font-size: 13px; padding: 3px 0; }
  .chips li { display: inline-block; font-size: 12px; border: 1px solid #e2ded6; border-radius: 5px;
              padding: 2px 7px; margin: 0 4px 4px 0; }
  .weights li { position: relative; display: flex; justify-content: space-between; gap: 8px;
                font-size: 13px; padding: 4px 7px; border-radius: 4px; overflow: hidden; margin-bottom: 2px; }
  .weights li .wbar { position: absolute; inset: 0 auto 0 0; background: #cfc6f5; opacity: .5; z-index: 0; }
  .weights li > span:not(.wbar), .weights li > b { position: relative; z-index: 1; }
  .policy { border-top: 1px solid #e2ded6; padding: 7px 0; }
  .policy:first-of-type { border-top: 0; }
  code { font-family: ui-monospace, Menlo, monospace; font-size: 11px; background: rgba(178,106,0,.14);
         color: #b26a00; border-radius: 3px; padding: 1px 5px; margin-left: 5px; }
  .day { border-top: 1px solid #e2ded6; padding-bottom: 4px; }
  .day:first-child { border-top: 0; }
  .slot { font-size: 12px; padding: 5px 8px; border-radius: 5px; margin-bottom: 4px;
          background: rgba(122,92,255,.07); border: 1px solid #e2ded6; }
  .card { border: 1px solid #e2ded6; border-radius: 10px; padding: 12px 14px; background: #fff;
          font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
          color: #1a1a19; }
  .card-row { display: flex; gap: 22px; flex-wrap: wrap; }
  .stat { display: flex; flex-direction: column; }
  .stat b { font-size: 19px; letter-spacing: -.02em; }
  .stat span { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; opacity: .55; }
  `;

  // On an assignment page, draw the card if the data is already cached. Never
  // fetch for it: opening a page is not the same as asking for a pull, and an
  // extension that reads your whole account because you clicked a link is not
  // one worth installing.
  if (context().assignmentId) {
    ask({ type: 'briefs', cacheOnly: true })
      .then(({ result }) => { if (result) { state.result = result; inlineCard(); } })
      .catch(() => {});   // no worker yet, or not Canvas: the panel will say so
  }
})();
