#!/usr/bin/env node
/**
 * Bundles the site into one self-contained HTML file at dist/index.html.
 *
 * The multi-file site fetches data/signals.json at runtime so a scheduled
 * refresh appears without a rebuild. A single file cannot do that, so the
 * build inlines the current payload and marks it as a snapshot in the UI.
 *
 * Emits page content only — no <!doctype>/<html>/<head>/<body> — so the
 * output can be published directly as an Artifact, which supplies those.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = f => readFile(join(ROOT, f), 'utf8');

const [html, css, js, signalsRaw] = await Promise.all(
  ['index.html', 'assets/app.css', 'assets/app.js', 'data/signals.json'].map(read));
const { disciplines, levels, nodes } = await import('../data/curriculum.mjs');
const { resources } = await import('../data/resources.mjs');
const { primers } = await import('../data/primers.mjs');

// Body content only; the Artifact host supplies the document skeleton.
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1]
  .replace(/\n<script type="module"[\s\S]*?<\/script>/, '')
  .trim();
const title = html.match(/<title>(.*?)<\/title>/)[1];

// Replace the module import with the data inlined. A single-line swap, so
// nothing else in app.js has to know it is being bundled.
const inlined = js
  .replace(/^import \{[^}]*\} from '\.\.\/data\/curriculum\.mjs';$/m,
    `const { disciplines, levels, nodes } = ${JSON.stringify({ disciplines, levels, nodes })};`)
  .replace(/^import \{[^}]*\} from '\.\.\/data\/resources\.mjs';$/m,
    `const resources = ${JSON.stringify(resources)};`)
  .replace(/^import \{[^}]*\} from '\.\.\/data\/primers\.mjs';$/m,
    `const primers = ${JSON.stringify(primers)};`);

if (/^import /m.test(inlined)) throw new Error('an import survived bundling — the build would ship an unresolvable module');

const out = `<title>${title}</title>
<style>
${css}
</style>

${body}

<script>
globalThis.__CPW_SIGNALS__ = ${signalsRaw.trim()};
globalThis.__CPW_SNAPSHOT__ = true;
</script>
<script type="module">
${inlined}
</script>
`;

await mkdir(join(ROOT, 'dist'), { recursive: true });
await writeFile(join(ROOT, 'dist/index.html'), out);
console.error(`wrote dist/index.html — ${(Buffer.byteLength(out) / 1024).toFixed(0)} KB, ${nodes.length} nodes, snapshot of ${JSON.parse(signalsRaw).itemCount} signals`);
