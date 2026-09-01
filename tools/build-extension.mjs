#!/usr/bin/env node
/**
 * Assembles the browser extension into a loadable directory.
 *
 * The extension shares its analysis with the CLI rather than reimplementing
 * it, and an extension can only load files inside its own directory — so this
 * copies `tools/canvas/` to `extension/lib/`, stamps the version, and draws
 * the icons. `extension/lib/` and `extension/icons/` are generated and
 * gitignored; everything hand-written lives beside them.
 *
 * Usage:  node tools/build-extension.mjs [--zip]
 */
import { readFile, writeFile, mkdir, rm, copyFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { deflateSync } from 'node:zlib';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXT = join(ROOT, 'extension');

// Only the modules the extension actually runs. `client.mjs` and `fetch.mjs`
// come along because `fetch.mjs` drives the pull; `canvas.test.mjs` does not.
const SHARED = ['client.mjs', 'fetch.mjs', 'html.mjs', 'syllabus.mjs', 'assignment.mjs',
                'catalogue.mjs', 'analyse.mjs', 'render.mjs', 'dashboard.mjs'];

async function main() {
  await rm(join(EXT, 'lib'), { recursive: true, force: true });
  await mkdir(join(EXT, 'lib'), { recursive: true });
  for (const f of SHARED) await copyFile(join(ROOT, 'tools/canvas', f), join(EXT, 'lib', f));

  // A module the extension imports but the build forgot to copy fails at load
  // time with a bare "module not found" inside a service worker, where nobody
  // is looking. Cheaper to catch it here.
  const missing = [];
  for (const f of SHARED) {
    const src = await readFile(join(EXT, 'lib', f), 'utf8');
    for (const m of src.matchAll(/^import\s[^']*'\.\/([\w.-]+)'/gm)) {
      if (!SHARED.includes(m[1])) missing.push(`lib/${f} imports ./${m[1]}, which is not copied`);
    }
  }
  for (const f of ['background.js', 'viewer.js', 'content.js']) {
    const src = await readFile(join(EXT, f), 'utf8');
    for (const m of src.matchAll(/from\s+'\.\/lib\/([\w.-]+)'/g)) {
      if (!SHARED.includes(m[1])) missing.push(`${f} imports lib/${m[1]}, which is not copied`);
    }
  }
  if (missing.length) {
    for (const m of missing) console.error(`✗ ${m}`);
    process.exit(1);
  }

  await mkdir(join(EXT, 'icons'), { recursive: true });
  for (const size of [16, 32, 48, 128]) {
    await writeFile(join(EXT, 'icons', `${size}.png`), icon(size));
  }

  const manifest = JSON.parse(await readFile(join(EXT, 'manifest.json'), 'utf8'));
  console.error(`✓ extension/ built — ${SHARED.length} shared modules, 4 icons, v${manifest.version}`);
  console.error('');
  console.error('  Chrome  chrome://extensions → Developer mode → Load unpacked → select extension/');
  console.error('  Edge    edge://extensions → Developer mode → Load unpacked');
  console.error('');
  console.error('  Then open any Canvas page and click the toolbar icon.');

  if (process.argv.includes('--zip')) {
    const files = await walk(EXT);
    await mkdir(join(ROOT, 'dist'), { recursive: true });
    await writeFile(join(ROOT, 'dist/canvas-prep-briefs.zip'), await zip(EXT, files));
    console.error(`\n✓ dist/canvas-prep-briefs.zip — ${files.length} files`);
  }
}

// ── the icon ───────────────────────────────────────────────────────────────

/**
 * A rounded square with three bars — a brief. Drawn arithmetically and encoded
 * by hand rather than pulled from a graphics dependency, because four small
 * PNGs are not worth a toolchain, and a committed binary is not worth the
 * review it never gets.
 */
function icon(size) {
  const px = new Uint8Array(size * size * 4);
  const bg = [0x7a, 0x5c, 0xff];
  const r = size * 0.22;
  const bars = [[0.24, 0.30, 0.54], [0.24, 0.46, 0.40], [0.24, 0.62, 0.48]];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const a = roundedCoverage(x + 0.5, y + 0.5, size, r);
      if (a <= 0) continue;
      let [cr, cg, cb] = bg;
      for (const [bx, by, bw] of bars) {
        const x0 = bx * size, x1 = (bx + bw) * size;
        const y0 = by * size, y1 = y0 + Math.max(1.4, size * 0.085);
        if (x >= x0 && x < x1 && y >= y0 && y < y1) { cr = cg = cb = 0xff; }
      }
      px[i] = cr; px[i + 1] = cg; px[i + 2] = cb; px[i + 3] = Math.round(a * 255);
    }
  }
  return png(size, size, px);
}

/** 1 inside the rounded square, 0 outside, feathered over the last pixel. */
function roundedCoverage(x, y, size, r) {
  const dx = Math.max(r - x, x - (size - r), 0);
  const dy = Math.max(r - y, y - (size - r), 0);
  const d = Math.hypot(dx, dy) - r;
  return Math.min(Math.max(0.5 - d, 0), 1);
}

/** Minimal PNG: one IHDR, one deflated IDAT of filter-0 scanlines, one IEND. */
function png(w, h, rgba) {
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;                                   // filter: none
    Buffer.from(rgba.buffer, y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;        // bit depth
  ihdr[9] = 6;        // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** Built on first use; the table costs nothing to keep and less to skip. */
let crcTable;
function crc32(buf) {
  crcTable ||= (() => {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    return t;
  })();
  let c = -1;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

// ── zip (stored, no compression — a few hundred KB either way) ─────────────

async function walk(dir, prefix = '') {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...await walk(join(dir, e.name), rel));
    else out.push(rel);
  }
  return out.sort();
}

async function zip(base, names) {
  const locals = [], central = [];
  let offset = 0;
  for (const name of names) {
    const data = await readFile(join(base, name));
    const nameBuf = Buffer.from(name, 'utf8');
    const crc = crc32(data);
    const head = Buffer.alloc(30);
    head.writeUInt32LE(0x04034b50, 0);
    head.writeUInt16LE(20, 4);                       // version needed
    head.writeUInt16LE(0x0800, 6);                   // utf-8 names
    head.writeUInt32LE(crc, 14);
    head.writeUInt32LE(data.length, 18);
    head.writeUInt32LE(data.length, 22);
    head.writeUInt16LE(nameBuf.length, 26);
    locals.push(head, nameBuf, data);

    const dir = Buffer.alloc(46);
    dir.writeUInt32LE(0x02014b50, 0);
    dir.writeUInt16LE(20, 6);
    dir.writeUInt16LE(0x0800, 8);
    dir.writeUInt32LE(crc, 16);
    dir.writeUInt32LE(data.length, 20);
    dir.writeUInt32LE(data.length, 24);
    dir.writeUInt16LE(nameBuf.length, 28);
    dir.writeUInt32LE(offset, 42);
    central.push(dir, nameBuf);
    offset += 30 + nameBuf.length + data.length;
  }
  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(names.length, 8);
  end.writeUInt16LE(names.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralBuf, end]);
}

await main();
