import { disciplines, levels, nodes } from '../data/curriculum.mjs';
import { resources } from '../data/resources.mjs';

const SVG_NS = 'http://www.w3.org/2000/svg';
const VB = 1000, C = VB / 2;            // geometry box, centre
const PAD = 96;                        // room outside the outer ring for labels
const HUB_R = 36;
const R = lvl => 112 + (lvl - 1) * 76;  // ring radius per level
const SECTOR = 360 / disciplines.length;
const ARC = SECTOR - 14;                // usable arc inside a sector
const STORE_KEY = 'cpw.learned.v1';

const el = id => document.getElementById(id);
const svg = el('web');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const discOf = id => disciplines.find(d => d.id === id);
const nodeOf = id => nodes.find(n => n.id === id);
const colour = d => `hsl(${discOf(d).hue} var(--disc-s) var(--disc-l))`;

/* ── state ────────────────────────────────────────────────────────────── */
const state = {
  active: new Set(disciplines.map(d => d.id)),
  query: '',
  lit: null,                 // node id whose lineage is highlighted
  signals: null,
  tab: 'all',
  learned: new Set(load()),
  view: { x: 0, y: 0, k: 1 },
};
function load() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) ?? []; } catch { return []; } }
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify([...state.learned])); } catch { /* private mode */ } }

/* ── layout ───────────────────────────────────────────────────────────── */
const pos = new Map();
// The wheel is rotated half a sector off the axes on purpose: a sector
// pointing due left or right puts every ring's label on the same horizontal
// line, and horizontal labels then overlap across rings. Off-axis sectors
// separate them vertically instead.
const ROT = SECTOR / 2;
disciplines.forEach((d, i) => {
  const centreAngle = -90 + i * SECTOR + SECTOR / 2 + ROT;
  for (const lvl of levels.map(l => l.n)) {
    const cell = nodes.filter(n => n.d === d.id && n.lvl === lvl);
    cell.forEach((n, j) => {
      // Spread the cell across the sector's full usable arc. Radius-scaled
      // separation looked tidier but left outer rings bunched, and bunched
      // nodes put their horizontal labels on top of each other.
      const k = cell.length;
      const sep = k < 2 ? 0 : (ARC * 0.8) / (k - 1);
      const off = (j - (k - 1) / 2) * sep;
      const a = (centreAngle + off) * Math.PI / 180;
      pos.set(n.id, { x: C + Math.cos(a) * R(lvl), y: C + Math.sin(a) * R(lvl), a: centreAngle + off });
    });
  }
});

/** Transitive prerequisite closure — the route from the centre to a node. */
const lineage = id => {
  const seen = new Set(), stack = [id];
  while (stack.length) {
    const cur = stack.pop();
    for (const p of nodeOf(cur)?.prereq ?? []) if (!seen.has(p)) { seen.add(p); stack.push(p); }
  }
  return seen;
};

/* ── svg helpers ──────────────────────────────────────────────────────── */
const mk = (tag, attrs = {}, parent) => {
  const n = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  parent?.appendChild(n);
  return n;
};

/* ── render the web ───────────────────────────────────────────────────── */
const root = mk('g', {}, svg);
svg.setAttribute('viewBox', `${-PAD} ${-PAD} ${VB + PAD * 2} ${VB + PAD * 2}`);
svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

// rings + ring labels
const gRings = mk('g', {}, root);
for (const l of levels) {
  mk('circle', { class: 'ring-circle', cx: C, cy: C, r: R(l.n) }, gRings);
  // Ring labels ride the due-east ray, which is a gap between sectors rather
  // than a sector's spine — the top of the circle is occupied by nodes.
  const label = l.name.toUpperCase();   // ring spacing is 76px; the number
                                        // would push the widest label past it
  mk('rect', { class: 'ring-label-bg', x: C + R(l.n) - (label.length * 2.9 + 7),
               y: C - 8, width: label.length * 5.8 + 14, height: 16, rx: 8 }, gRings);
  const t = mk('text', { class: 'ring-label', x: C + R(l.n), y: C,
                         'text-anchor': 'middle', 'dominant-baseline': 'middle' }, gRings);
  t.textContent = label;
}

// sector labels, curved along the outer edge
const gSect = mk('g', {}, root);
disciplines.forEach((d, i) => {
  const a = (-90 + i * SECTOR + SECTOR / 2 + ROT) * Math.PI / 180;
  const r = R(5) + 62;
  const t = mk('text', {
    class: 'sector-label', x: C + Math.cos(a) * r, y: C + Math.sin(a) * r,
    fill: colour(d.id), 'text-anchor': 'middle', 'dominant-baseline': 'middle',
  }, gSect);
  t.textContent = d.name.toUpperCase();
});

// edges
const gEdges = mk('g', {}, root);
const edgeEls = [];
for (const n of nodes) {
  const to = pos.get(n.id);
  for (const p of n.prereq ?? []) {
    const from = pos.get(p);
    const cross = nodeOf(p).d !== n.d;
    // Bend cross-discipline links toward the centre so they read as bridges.
    const mx = (from.x + to.x) / 2, my = (from.y + to.y) / 2;
    const pull = cross ? 0.34 : 0.09;
    const cx = mx + (C - mx) * pull, cy = my + (C - my) * pull;
    const path = mk('path', {
      class: 'edge' + (cross ? ' cross' : ''),
      d: `M${from.x} ${from.y} Q${cx} ${cy} ${to.x} ${to.y}`,
    }, gEdges);
    edgeEls.push({ el: path, from: p, to: n.id });
  }
  // level-1 nodes hang off the hub
  if (!(n.prereq ?? []).length) {
    const path = mk('path', { class: 'edge', d: `M${C} ${C} L${to.x} ${to.y}` }, gEdges);
    edgeEls.push({ el: path, from: '__hub', to: n.id });
  }
}

// hub
const gHub = mk('g', { class: 'hub' }, root);
mk('circle', { cx: C, cy: C, r: HUB_R }, gHub);
const hubText = mk('text', { x: C, y: C, 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, gHub);
hubText.textContent = 'CLAUDE';

// nodes
const gNodes = mk('g', {}, root);
const nodeEls = new Map();
for (const n of nodes) {
  const { x, y, a } = pos.get(n.id);
  const c = colour(n.d);
  const g = mk('g', { class: 'node', tabindex: '0', role: 'button',
                      'aria-label': `${n.title} — ${discOf(n.d).name}, level ${n.lvl}` }, gNodes);
  // generous invisible hit target — a 7px dot is not a usable tap target
  mk('circle', { class: 'hit', cx: x, cy: y, r: 14 }, g);
  mk('circle', { class: 'halo', cx: x, cy: y, r: 9, stroke: c }, g);
  mk('circle', { class: 'disc', cx: x, cy: y, r: 7.2, fill: c, stroke: c, 'fill-opacity': .22 }, g);

  // Label rides outward along this node's own radius, so siblings in one
  // cell separate instead of stacking at the same y.
  const rad = a * Math.PI / 180;
  // No dead zone at the vertical: siblings either side of a vertical sector
  // must anchor in opposite directions or their labels run into each other.
  const right = Math.cos(rad) >= 0;
  const label = mk('text', { class: 'lbl',
    x: x + Math.cos(rad) * 13 + (right ? 5 : -5),
    y: y + Math.sin(rad) * 13 + 3.4,
    'text-anchor': right ? 'start' : 'end' }, g);
  label.textContent = n.title;

  nodeEls.set(n.id, { g, label });
  g.addEventListener('pointerenter', () => hover(n.id));
  g.addEventListener('pointerleave', () => hover(null));
  g.addEventListener('focus', () => hover(n.id));
  g.addEventListener('blur', () => hover(null));
  g.addEventListener('click', () => openPanel(n.id));
  g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPanel(n.id); } });
  g.addEventListener('pointermove', e => moveTip(e, n.id));
}

/* ── highlight / filter ───────────────────────────────────────────────── */
function matches(n) {
  if (!state.active.has(n.d)) return false;
  const q = state.query.trim().toLowerCase();
  if (!q) return true;
  return (n.title + ' ' + n.tag + ' ' + n.hook + ' ' + n.what).toLowerCase().includes(q);
}

function paint() {
  const lit = state.lit ? new Set([state.lit, ...lineage(state.lit)]) : null;
  for (const n of nodes) {
    const { g } = nodeEls.get(n.id);
    const visible = matches(n);
    g.classList.toggle('dim', !visible || (lit && !lit.has(n.id)));
    g.classList.toggle('lit', !!lit && lit.has(n.id));
    g.classList.toggle('done', state.learned.has(n.id));
  }
  for (const e of edgeEls) {
    const on = lit && lit.has(e.to) && (e.from === '__hub' || lit.has(e.from));
    e.el.classList.toggle('lit', !!on);
    e.el.style.opacity = lit ? (on ? '' : '.08') : '';
  }
}

function hover(id) {
  state.lit = id;
  paint();
  if (id) showTip(id); else el('tooltip').hidden = true;
  el('stage-hint').style.opacity = id ? '0' : '';
}

/* ── tooltip ──────────────────────────────────────────────────────────── */
function showTip(id) {
  const n = nodeOf(id), tip = el('tooltip');
  const sig = state.signals?.byNode?.[id]?.length ?? 0;
  tip.innerHTML =
    `<div class="tt-title">${esc(n.title)}</div>` +
    `<div class="tt-meta">${esc(discOf(n.d).name)} · Level ${n.lvl} ${esc(levels[n.lvl - 1].name)}</div>` +
    `<div class="tt-hook">${esc(n.hook)}</div>` +
    (sig ? `<div class="tt-sig">${sig} recent signal${sig > 1 ? 's' : ''}</div>` : '');
  tip.hidden = false;
}
function moveTip(e, id) {
  const tip = el('tooltip'), stage = svg.parentElement.getBoundingClientRect();
  if (tip.hidden) showTip(id);
  const w = tip.offsetWidth, h = tip.offsetHeight;
  let x = e.clientX - stage.left + 16, y = e.clientY - stage.top + 16;
  if (x + w > stage.width - 8) x = e.clientX - stage.left - w - 16;
  if (y + h > stage.height - 8) y = e.clientY - stage.top - h - 16;
  tip.style.left = `${Math.max(6, x)}px`;
  tip.style.top = `${Math.max(6, y)}px`;
}

/* ── pan & zoom ───────────────────────────────────────────────────────── */
function applyView() {
  const { x, y, k } = state.view;
  root.setAttribute('transform', `translate(${x} ${y}) scale(${k})`);
}
svg.addEventListener('wheel', e => {
  e.preventDefault();
  const rect = svg.getBoundingClientRect();
  const scale = VB / Math.min(rect.width, rect.height);
  const px = (e.clientX - rect.left - (rect.width - Math.min(rect.width, rect.height)) / 2) * scale;
  const py = (e.clientY - rect.top - (rect.height - Math.min(rect.width, rect.height)) / 2) * scale;
  const k2 = Math.min(3.2, Math.max(0.55, state.view.k * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
  state.view.x = px - (px - state.view.x) * (k2 / state.view.k);
  state.view.y = py - (py - state.view.y) * (k2 / state.view.k);
  state.view.k = k2;
  applyView();
}, { passive: false });

let drag = null;
svg.addEventListener('pointerdown', e => {
  if (e.target.closest('.node')) return;
  drag = { x: e.clientX, y: e.clientY, vx: state.view.x, vy: state.view.y };
  svg.classList.add('dragging');
  svg.setPointerCapture(e.pointerId);
});
svg.addEventListener('pointermove', e => {
  if (!drag) return;
  const rect = svg.getBoundingClientRect();
  const scale = VB / Math.min(rect.width, rect.height);
  state.view.x = drag.vx + (e.clientX - drag.x) * scale;
  state.view.y = drag.vy + (e.clientY - drag.y) * scale;
  applyView();
});
const endDrag = () => { drag = null; svg.classList.remove('dragging'); };
svg.addEventListener('pointerup', endDrag);
svg.addEventListener('pointercancel', endDrag);

/* ── left rail ────────────────────────────────────────────────────────── */
el('node-count').textContent = String(nodes.length);

el('discipline-list').innerHTML = disciplines.map(d => `
  <li><button data-d="${d.id}" aria-pressed="true">
    <span class="swatch" style="background:${colour(d.id)}"></span>
    <span><span class="lg-name">${esc(d.name)}</span>
    <span class="lg-blurb">${esc(d.blurb)}</span></span>
  </button></li>`).join('');

el('discipline-list').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const id = b.dataset.d;
  // Clicking the only active discipline restores all — a solo toggle that undoes itself.
  if (state.active.size === 1 && state.active.has(id)) disciplines.forEach(d => state.active.add(d.id));
  else if (e.shiftKey) state.active.has(id) ? state.active.delete(id) : state.active.add(id);
  else { state.active.clear(); state.active.add(id); }
  if (!state.active.size) disciplines.forEach(d => state.active.add(d.id));
  [...el('discipline-list').querySelectorAll('button')]
    .forEach(x => x.setAttribute('aria-pressed', String(state.active.has(x.dataset.d))));
  paint();
});

el('level-list').innerHTML = levels.map(l => `
  <li><span class="lv-num">${l.n}</span>
    <span><span class="lv-name">${esc(l.name)}</span> —
    <span class="lv-note">${esc(l.note)}</span></span></li>`).join('');

function renderProgress() {
  el('progress-bars').innerHTML = disciplines.map(d => {
    const all = nodes.filter(n => n.d === d.id);
    const done = all.filter(n => state.learned.has(n.id)).length;
    return `<div class="prog-row">
      <span class="prog-label">${esc(d.name.split(' ')[0])}</span>
      <span class="prog-track"><span class="prog-fill" style="width:${done / all.length * 100}%;background:${colour(d.id)}"></span></span>
      <span class="prog-n">${done}/${all.length}</span></div>`;
  }).join('');
}
el('reset-progress').addEventListener('click', () => {
  state.learned.clear(); save(); renderProgress(); paint();
  if (!el('panel').hidden) openPanel(el('panel').dataset.node);
});

el('search').addEventListener('input', e => { state.query = e.target.value; paint(); });
el('theme-toggle').addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : cur === 'light' ? 'dark'
    : (matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark');
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem('cpw.theme', next); } catch { /* ignore */ }
});
try { const t = localStorage.getItem('cpw.theme'); if (t) document.documentElement.setAttribute('data-theme', t); } catch { /* ignore */ }

/* ── node panel ───────────────────────────────────────────────────────── */
// Inline formatting used in node prose. Bold must run before italic or the
// italic rule would eat the inner pair of a **bold** span.
const KIND = { docs: 'Docs', post: 'Write-up', guide: 'Guide', talk: 'Talk' };

const rich = s => esc(s)
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*([^*\n]+?)\*/g, '<em>$1</em>')
  .replace(/`([^`]+?)`/g, '<code>$1</code>');

function openPanel(id) {
  const n = nodeOf(id); if (!n) return;
  const d = discOf(n.d), lv = levels[n.lvl - 1];
  const sigs = (state.signals?.byNode?.[id] ?? [])
    .map(sid => state.signals.items.find(i => i.id === sid)).filter(Boolean);

  const prereqs = (n.prereq ?? []).map(nodeOf);
  const unlocks = nodes.filter(x => (x.prereq ?? []).includes(id));
  const chip = m => `<button data-goto="${m.id}"><span class="swatch" style="background:${colour(m.d)}"></span>${esc(m.title)}</button>`;

  el('panel-content').innerHTML = `
    <div class="p-crumb">
      <span class="swatch" style="background:${colour(n.d)}"></span>
      <span style="color:${colour(n.d)}">${esc(d.name)}</span>
      <span class="p-lvl">· Level ${n.lvl} · ${esc(lv.name)} — ${esc(lv.sub)}</span>
    </div>
    <h2 id="panel-title">${esc(n.title)}</h2>
    <p class="p-tag">${esc(n.tag)}</p>
    <p class="p-hook">${esc(n.hook)}</p>
    <div class="p-what">${n.what.split(/\n\n+/).map(p => `<p>${rich(p)}</p>`).join('')}</div>

    <div class="p-sec">
      <h3>Worked example — ${esc(n.example.label)}</h3>
      <div class="p-example">
        <div class="p-ex-head"><span>${esc(n.example.label)}</span><span class="p-ex-lang">${esc(n.example.lang)}</span></div>
        <pre><code>${esc(n.example.code)}</code></pre>
      </div>
    </div>

    <div class="p-sec">
      <h3>The non-obvious part</h3>
      <p class="p-insight">${rich(n.insight)}</p>
    </div>

    <div class="p-sec">
      <h3>Go deeper</h3>
      <ul class="p-refs">${(resources[id] ?? []).map(r => `
        <li><a href="${esc(r.u)}" target="_blank" rel="noopener">
          <span class="ref-kind ref-${esc(r.k)}">${esc(KIND[r.k] ?? r.k)}</span>
          <span class="ref-t">${esc(r.t)}</span>
          <span class="ref-src">${esc(r.src)}</span>
        </a></li>`).join('')}</ul>
    </div>

    ${prereqs.length ? `<div class="p-sec"><h3>Rests on</h3><div class="p-links">${prereqs.map(chip).join('')}</div></div>` : ''}
    ${unlocks.length ? `<div class="p-sec"><h3>Leads to</h3><div class="p-links">${unlocks.map(chip).join('')}</div></div>` : ''}

    <div class="p-sec p-sig">
      <h3>Live signals for this node</h3>
      ${sigs.length ? `<ul>${sigs.slice(0, 8).map(s => `
        <li><span class="sig-src">${esc(s.source)}${s.badge ? ' · ' + esc(s.badge) : ''}${s.application ? ' · new application' : ''}</span>
        <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a></li>`).join('')}</ul>`
      : `<p class="rail-note">No recent signals matched this node. The sidebar refreshes on a schedule; new ones attach here automatically.</p>`}
    </div>

    <div class="p-done">
      <button id="mark-done" aria-pressed="${state.learned.has(id)}">
        ${state.learned.has(id) ? '✓ Learned' : 'Mark as learned'}
      </button>
      <span>Saved in this browser only.</span>
    </div>`;

  el('panel').dataset.node = id;
  el('panel').hidden = false;
  el('panel-scrim').hidden = false;
  el('panel').scrollTop = 0;
  el('panel').focus();

  el('mark-done').addEventListener('click', () => {
    state.learned.has(id) ? state.learned.delete(id) : state.learned.add(id);
    save(); renderProgress(); paint(); openPanel(id);
  });
  el('panel-content').querySelectorAll('[data-goto]')
    .forEach(b => b.addEventListener('click', () => openPanel(b.dataset.goto)));

  state.lit = id; paint();
}

function closePanel() {
  el('panel').hidden = true;
  el('panel-scrim').hidden = true;
  state.lit = null; paint();
}
el('panel-close').addEventListener('click', closePanel);
el('panel-scrim').addEventListener('click', closePanel);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !el('panel').hidden) closePanel(); });

/* ── signals sidebar ──────────────────────────────────────────────────── */
const TABS = [
  { id: 'all', label: 'All' },
  { id: 'model', label: 'Model & API' },
  { id: 'tooling', label: 'Tooling' },
  { id: 'market', label: 'Market' },
  { id: 'research', label: 'Research' },
];
const CAT_HUE = { model: 190, tooling: 152, market: 36, research: 268 };

function renderTabs() {
  el('signal-tabs').innerHTML = TABS.map(t => {
    const n = t.id === 'all' ? state.signals.items.length
      : state.signals.items.filter(i => i.category === t.id).length;
    return `<button role="tab" data-tab="${t.id}" aria-selected="${state.tab === t.id}">${t.label} ${n}</button>`;
  }).join('');
}
el('signal-tabs').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  state.tab = b.dataset.tab; renderTabs(); renderSignals();
});

const ago = iso => {
  if (!iso) return '';
  const h = (Date.now() - Date.parse(iso)) / 36e5;
  if (h < 1) return 'just now';
  if (h < 24) return `${Math.round(h)}h ago`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d}d ago` : `${Math.round(d / 30)}mo ago`;
};

function renderSignals() {
  const list = state.signals.items.filter(i => state.tab === 'all' || i.category === state.tab);
  el('signal-list').innerHTML = list.length ? list.map(s => `
    <li class="signal">
      <div class="sig-top">
        <span class="sig-cat" style="background:hsl(${CAT_HUE[s.category]} var(--disc-s) var(--disc-l))"></span>
        <span class="sig-src">${esc(s.source)}</span>
        ${s.badge ? `<span class="sig-badge">${esc(s.badge)}</span>` : ''}
        ${s.date ? `<span class="sig-badge">${ago(s.date)}</span>` : ''}
      </div>
      <a class="sig-title" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>
      ${s.summary ? `<p class="sig-summary">${esc(s.summary)}</p>` : ''}
      <div class="sig-nodes">${s.nodes.map(id => nodeOf(id)
        ? `<button class="node-chip" data-goto="${id}">${esc(nodeOf(id).title)}</button>` : '').join('')}</div>
    </li>`).join('')
    : `<li class="empty">No signals in this lane right now.<br>The feed refreshes on a schedule.</li>`;
}

function renderApplications() {
  const apps = state.signals.applications ?? [];
  if (!apps.length) return;
  el('applications-block').hidden = false;
  el('applications-list').innerHTML = apps.slice(0, 6).map(a => `
    <li><button class="node-chip" data-goto="${esc(a.node)}">${esc(a.nodeTitle)}</button>
    <a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.title)}</a></li>`).join('');
}

document.querySelector('.signals').addEventListener('click', e => {
  const b = e.target.closest('[data-goto]'); if (!b) return;
  openPanel(b.dataset.goto);
});

function markSignalNodes() {
  for (const [id, ids] of Object.entries(state.signals.byNode ?? {})) {
    const entry = nodeEls.get(id); if (!entry) continue;
    const { x, y } = pos.get(id);
    mk('circle', { class: 'sig-ring', cx: x, cy: y, r: 12 }, entry.g);
    mk('circle', { class: 'sig', cx: x + 8.5, cy: y - 8.5, r: 2.6 }, entry.g);
    entry.g.setAttribute('aria-label',
      `${entry.g.getAttribute('aria-label')} — ${ids.length} recent signals`);
  }
}

function renderSourceStatus() {
  const s = state.signals;
  el('source-status').innerHTML =
    (s.sourceStatus ?? []).map(r => `<div class="src-row">
      <span class="${r.ok ? 'src-ok' : 'src-bad'}">${r.ok ? '●' : '○'}</span>
      <span>${esc(r.label)}</span>
      <span style="color:var(--ink-faint);margin-left:auto">${r.ok ? `${r.kept} matched` : esc(r.error ?? 'failed')}</span>
    </div>`).join('') +
    `<p class="src-note">Refreshed by a scheduled GitHub Action running
      <code class="p-inline-code">tools/refresh-signals.mjs</code>. Each item is keyword-matched
      against the ${nodes.length} nodes; matches attach to the node panel and put a dot on the web.</p>`;
}

async function loadSignals() {
  try {
    // A standalone build (tools/build-standalone.mjs) injects the payload so
    // the page works as a single file. The served site fetches it instead, so
    // a scheduled refresh shows up without a rebuild.
    if (globalThis.__CPW_SIGNALS__) {
      state.signals = globalThis.__CPW_SIGNALS__;
    } else {
      const res = await fetch('data/signals.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      state.signals = await res.json();
    }
  } catch (err) {
    state.signals = { items: [], byNode: {}, applications: [], sourceStatus: [], generated: null };
    el('signals-meta').textContent = 'Signal feed unavailable in this build. The web below is unaffected.';
  }
  const s = state.signals;
  if (s.generated) {
    const touched = Object.keys(s.byNode ?? {}).length;
    el('signals-meta').innerHTML =
      `${s.items.length} items · ${globalThis.__CPW_SNAPSHOT__ ? 'snapshot from' : 'updated'} ` +
      `${ago(s.generated)} · touching ${touched} of ${nodes.length} nodes` +
      (globalThis.__CPW_SNAPSHOT__
        ? ` · <span style="color:var(--ink-faint)">this build is a snapshot; the repo refreshes on a schedule</span>` : '');
  }
  renderTabs(); renderSignals(); renderApplications(); renderSourceStatus(); markSignalNodes(); paint();
}

/* ── boot ─────────────────────────────────────────────────────────────── */
renderProgress();
applyView();
paint();
loadSignals();
