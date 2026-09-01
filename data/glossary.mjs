// Assumed background: vocabulary and systems a node uses without teaching.
//
// This is the complement to data/primers.mjs. A primer defines what a node IS
// ABOUT — cache_control, PreToolUse, SKILL.md. This defines what a node takes
// for granted: the words and systems you need to already know to follow the
// explanation at all.
//
// Entries attach to a node by matching its own text, so a term only appears
// where it is genuinely used. Matching is word-boundary anchored and
// case-sensitive for acronyms, because "CI" inside "efficiency" and "race"
// inside "trace" are the obvious way to get this wrong.
//
//   k = 'vocab'  a word or idea        'system'  a named thing, format or protocol
//   m = patterns that mean the node uses it
//
// An entry that never surfaces is not necessarily dead: several are correctly
// suppressed because the only nodes using them define them in their own primer.
// tools/validate.mjs tells those apart from entries nothing references at all.

const GV = (id, t, d, m) => ({ id, t, k: 'vocab', d, m });
const GS = (id, t, d, m) => ({ id, t, k: 'system', d, m });
// Foundational words. The rest of this file assumes you already write
// software — it defined `egress` and `p95` but not `API`. These fill that in,
// and are ranked below the specific terms so they take leftover slots rather
// than crowding out what a node is actually about.
const GB = (id, t, d, m) => ({ id, t, k: 'basic', d, m, b: 1 });

export const glossary = [
  // ── foundations · assumed by everything above ───────────────────────────
  GB('api', 'API', 'A way for one program to talk to another over the internet. "The Claude API" means writing software that sends Claude a request and gets an answer back, instead of typing into an app.', [/\bAPIs?\b/]),
  GB('model', 'Model', 'The trained system that produces the answers — Opus 5, Sonnet 5, Haiku 4.5. Choosing one trades capability against cost and speed.', [/\bmodels?\b/i]),
  GB('context', 'Context', 'Everything the model can see while answering: your message, the conversation so far, any files and instructions. It is finite and you pay for all of it, every turn.', [/\bcontext\b/i]),
  GB('prompt', 'Prompt', 'What you send the model — your question plus whatever instructions and material come with it.', [/\bprompts?\b/i]),
  GB('parameter', 'Parameter', 'A setting you pass with a request to change how it behaves, like effort or thinking. Named values, not prose.', [/\bparameters?\b/i]),
  GB('function', 'Function', 'A named piece of code that takes inputs and returns a result. A "tool" you give Claude is usually one of these.', [/\bfunctions?\b/i]),
  GB('string', 'String', 'Text, as a program stores it. "An exact string" means the characters must match precisely — no extra spaces, no different capitalisation.', [/\bstrings?\b/i]),
  GB('array', 'Array / list', 'An ordered list of items in code, written in square brackets. Order matters, and position is how items are usually found.', [/\barrays?\b/i]),
  GB('library', 'Library / SDK', 'Pre-written code you install and call rather than writing yourself. An SDK is the library a company publishes for its own API.', [/\blibrar(y|ies)\b/i, /\bSDKs?\b/]),
  GB('dependency', 'Dependency', 'An outside package your project needs in order to run. Adding one means trusting its code as if you had written it.', [/\bdependenc(y|ies)\b/i]),
  GB('repo', 'Repository', 'A project\'s folder of code, with its full history of changes. "The repo" is where the work lives.', [/\brepositor(y|ies)\b/i, /\brepos?\b/i]),
  GB('branch', 'Branch', 'A parallel line of changes, so work in progress does not disturb the working version until it is merged back.', [/\bbranch(es|ed)?\b/i]),
  GB('commit', 'Commit', 'One saved, described change in a repository. Committing records it; pushing sends it somewhere others can see.', [/\bcommit(s|ted|ting)?\b/i, /\bpush(ed|ing)?\b/i]),
  GB('terminal', 'Terminal', 'The text window where you type commands instead of clicking. Where Claude Code runs.', [/\bterminals?\b/i, /\bcommand line\b/i]),
  GB('server', 'Server', 'A computer that runs continuously and answers requests from others, rather than sitting on your desk.', [/\bservers?\b/i]),
  GB('deploy', 'Deploy', 'Putting software somewhere it actually runs for real users, as opposed to on your own machine.', [/\bdeploy(ment|ments|ed|s|ing)?\b/i]),
  GB('tests', 'Test suite', 'Code that checks other code still behaves correctly. Running it is how an agent tells whether its change worked.', [/\btest suite\b/i, /\btests?\b/i, /\btesting\b/i]),
  GB('production', 'Production', 'The live system real people are using — as opposed to your laptop, where mistakes are cheap.', [/\bproduction\b/i]),

  // ── the units everything is counted in ──────────────────────────────────
  GV('token', 'Token', 'Roughly three-quarters of a word — the unit models read, write and bill in. "unbelievable" is about three tokens.', [/\btokens?\b/i]),
  GV('prefix', 'Prefix', 'The front portion of a string or a request. In caching it is compared from the first byte, so two requests match only up to their first difference; elsewhere it can simply mean a leading label, as in `anthropic.claude-opus-5`.', [/\bprefix(es|ed)?\b/i]),
  GV('byte', 'Byte-identical', 'Exactly the same characters, including spaces and ordering. A comparison that fails on a single changed character.', [/\bbyte-(stable|identical)\b/i, /\bbytes\b/i]),
  GS('mtok', 'MTok', 'One million tokens — the unit API pricing is quoted in. "$5 / $25 per MTok" means input and output prices per million.', [/\bMTok\b/]),
  GV('latency', 'Latency', 'How long one request takes end to end. Distinct from throughput, which is how many you can run at once.', [/\blatenc(y|ies)\b/i]),
  GV('p95', 'p95', 'The 95th percentile — the number 95% of requests come in under. A better health signal than an average, which one slow outlier can hide.', [/\bp95\b/i, /\bp50\b/i, /\bpercentile\b/i]),
  GV('throughput', 'Throughput', 'How much work completes per unit of time, as opposed to how fast any single piece of it is.', [/\bthroughput\b/i]),

  // ── how requests and replies are shaped ─────────────────────────────────
  GS('json-schema', 'JSON Schema', 'A standard way of describing the shape data must have — which fields exist, their types, which are required. Used here to constrain what a model may return.', [/\bJSON Schema\b/i, /\bjson_schema\b/, /\binput_schema\b/]),
  GV('schema', 'Schema', 'The declared shape of some data or of a database table. Changing one is a migration.', [/\bschemas?\b/i]),
  GV('payload', 'Payload', 'The actual content of a request or message, as opposed to its headers and routing information.', [/\bpayloads?\b/i]),
  GS('base64', 'Base64', 'A way of writing binary data — a PDF, an image — as plain text so it can travel inside JSON. Roughly a third larger than the original.', [/\bbase64\b/i]),
  GS('mime', 'MIME type', 'The label saying what kind of file something is: `application/pdf`, `image/png`. Mismatching it against the content block type is a common first error.', [/\bMIME\b/, /\bmedia_type\b/]),
  GS('http-status', 'HTTP status codes', 'The number a web request comes back with. 200 means success, 400 means your request was malformed, 403 forbidden, 429 rate-limited, 5xx a server-side failure. Only some are worth retrying.', [/\bHTTP \d{3}\b/, /\b(400|403|429|5xx)\b/, /\bHTTP status\b/i]),
  GS('sse', 'SSE', 'Server-Sent Events — a one-way stream where the server pushes updates over a single open connection. How long-running agent sessions report progress.', [/\bSSE\b/]),
  GV('endpoint', 'Endpoint', 'One addressable operation on a web API — a single URL and method that does one thing.', [/\bendpoints?\b/i]),
  GS('rest', 'REST', 'The common style of web API built around resources and HTTP verbs: `GET /customers/42`. Its granularity is the reason a direct proxy makes a poor tool surface.', [/\bREST\b/]),
  GV('crud', 'CRUD', 'Create, Read, Update, Delete — the four basic data operations. "CRUD endpoints" means an API that exposes raw table operations rather than tasks.', [/\bCRUD\b/]),
  GV('deserialisation', 'Deserialisation', 'Turning stored or transmitted bytes back into live objects. Doing it on untrusted input can execute code, which is why it appears on security checklists.', [/\bdeserialis|\bdeserializ/i]),

  // ── the model itself ────────────────────────────────────────────────────
  GV('system-prompt', 'System prompt', 'Instructions placed in front of a conversation that set standing rules, rather than asking for one specific thing.', [/\bsystem prompts?\b/i]),
  GV('inference', 'Inference', 'One run of a model producing output. "Where inference runs" is a data-residency question, not a quality one.', [/\binference\b/i]),
  GV('classifier', 'Classifier', 'A component that sorts input into fixed categories. Safety classifiers are what produce a refusal.', [/\bclassifiers?\b/i, /\bclassification\b/i]),
  GV('calibration', 'Calibration', 'Whether a stated confidence matches reality — a well-calibrated 70% is right about 70% of the time. Language-model scores are typically poorly calibrated.', [/\bcalibrat/i]),
  GS('beta-header', 'Beta header', 'An opt-in string you send to enable a feature that is not yet generally available. Features change or graduate, so the dated name is part of the contract.', [/\bbetas?\b(?!\s*=\s*\[\])/i, /\bbeta header\b/i]),
  GV('snapshot', 'Snapshot', 'A frozen, dated version of something — a model, a dataset — pinned so it does not change under you.', [/\bsnapshots?\b/i]),

  // ── running code somewhere ──────────────────────────────────────────────
  GS('shell', 'Shell / command line', 'The text interface where you type commands. A "shell command" is a line you could type yourself; its exit code is how the system reports success.', [/\bshell\b/i, /\bcommand line\b/i, /\bCLI\b/]),
  GV('exit-code', 'Exit code', 'The number a command returns when it finishes. Zero means success; anything else means failure — which is how a hook blocks an action.', [/\bexit code\b/i, /\bnon-zero\b/i]),
  GS('env-var', 'Environment variable', 'A named value the operating system hands to a program at startup. A common way to pass configuration and secrets — and a common way to leak them.', [/\benvironment variables?\b/i, /\bANTHROPIC_[A-Z_]+\b/]),
  GS('container', 'Container', 'An isolated packaged environment a program runs inside, with its own filesystem and network view. Cheap to create and destroy.', [/\bcontainers?\b/i]),
  GV('ephemeral', 'Ephemeral', 'Deliberately short-lived. An ephemeral container is discarded when the work ends, so nothing written inside survives; an ephemeral cache entry expires rather than persisting.', [/\bephemeral\b/i]),
  GV('sandbox', 'Sandbox', 'A restricted environment where code can run without reaching the rest of the system. The boundary is enforced, not requested.', [/\bsandbox(ed|ing)?\b/i]),
  GV('egress', 'Egress', 'Outbound network traffic leaving a machine. "Egress policy" is the rule about what a sandboxed process is allowed to reach.', [/\begress\b/i]),
  GV('blast-radius', 'Blast radius', 'How much breaks if this particular thing goes wrong. The question that ranks risks properly, separately from likelihood.', [/\bblast radius\b/i]),
  GV('cold-start', 'Cold start', 'Beginning with no accumulated context or warm cache, so the first run pays costs later ones do not.', [/\bcold\b/i, /\bstarts cold\b/i]),

  // ── source control and shipping ─────────────────────────────────────────
  GV('diff', 'Diff', 'The set of changes between two versions of code — what a reviewer actually reads.', [/\bdiffs?\b/i]),
  GV('merge-conflict', 'Merge conflict', 'What happens when two branches change the same lines and the tool cannot decide which wins. Someone must resolve it by hand.', [/\bmerge conflicts?\b/i, /\bconflicting diffs?\b/i]),
  GS('worktree', 'Git worktree', 'A second working copy of the same repository checked out to a different branch, so two people — or two agents — never fight over one set of files.', [/\bworktrees?\b/i]),
  GS('ci', 'CI', 'Continuous Integration — the automation that runs your tests on every push. "Gating on CI" means a failure blocks the merge.', [/\bCI\b/]),
  GV('flaky', 'Flaky test', 'A test that passes and fails on identical code, usually from a timing or environment dependency. Dangerous because it teaches people to ignore red.', [/\bflak(y|e|es)\b/i]),
  GV('typechecker', 'Type-checker', 'A tool that catches type mistakes before the code runs. Fast, mechanical, and worth wiring into an agent loop.', [/\btype-?check(er|ing)?\b/i]),
  GV('codegen', 'Generated code', 'Files produced by a tool rather than written by a person. Editing them by hand is silently undone the next time the generator runs.', [/\bcodegen\b/i, /\bgenerated (code|files|directories|directory)\b/i]),
  GV('monorepo', 'Monorepo', 'One repository holding many packages or services, rather than one repository each.', [/\bmonorepos?\b/i]),
  GS('symlink', 'Symlink', 'A file that points at another location. Security-relevant because following one can reach outside the directory you thought you were confined to.', [/\bsymlinks?\b/i, /\bsymlinked\b/i]),
  GS('codeowners', 'CODEOWNERS', 'A file mapping paths in a repository to the people responsible for them.', [/\bCODEOWNERS\b/]),
  GV('vendored', 'Vendored code', 'Third-party code copied into your repository. It lives with your code but is not yours to change.', [/\bvendor(ed)?\b/i]),
  GV('rollback', 'Rollback', 'Undoing a change after it has shipped. A plan that cannot say how to undo a step has not thought about that step.', [/\brollbacks?\b/i, /\brevert(ed|ible)?\b/i]),

  // ── data and storage ────────────────────────────────────────────────────
  GV('replica', 'Read replica', 'A copy of a database kept for reads, so analysis queries do not slow down the live system.', [/\breplicas?\b/i]),
  GV('migration', 'Migration', 'Moving from one thing to another and updating everything that depended on the old one — a model version, a service\'s storage, a database\'s structure. Usually the hardest step to reverse, which is why plans separate it out.', [/\bmigrations?\b/i, /\bschema change\b/i]),
  GV('transaction', 'Transaction', 'A group of database operations that all succeed or all fail together.', [/\btransactions?\b/i]),
  GV('race', 'Race condition', 'A bug where the result depends on which of two concurrent things finishes first. Adding a sleep hides it; fixing the synchronisation removes it.', [/\brace condition\b/i, /\bthe race\b/i]),
  GV('deadlock', 'Deadlock', 'Two operations each waiting for something the other holds, so neither ever proceeds.', [/\bdeadlocks?\b/i]),
  GV('idempotent', 'No-op', 'An operation that changes nothing when it runs — safe to apply twice. A ported fix "no-ops" once the base branch already carries it.', [/\bno-ops?\b/i]),

  // ── security ────────────────────────────────────────────────────────────
  GV('prompt-injection', 'Prompt injection', 'Text inside content the model reads that tries to issue it instructions. The defence is treating all external content as data, never commands.', [/\bprompt injection\b/i, /\binjection\b/i]),
  GV('path-traversal', 'Path traversal', 'Using `../` or a symlink to reach files outside an allowed directory.', [/\bpath traversal\b/i]),
  GV('authz', 'Authz gap', 'Authorisation — checking whether this particular user may do this particular thing. Distinct from authentication, which is who they are.', [/\bauthz\b/i, /\bauthorisation\b/i, /\bauthorization\b/i]),
  GV('allowlist', 'Allowlist / denylist', 'An explicit list of what is permitted, or of what is forbidden. Deny beats allow where they overlap.', [/\ballow-?list(ed|ing)?\b/i, /\bdeny-?list\b/i]),
  GS('jwt', 'JWT', 'A signed, short-lived token proving identity. The basis of federation schemes that replace long-lived API keys.', [/\bJWT\b/]),
  GS('wif-adc', 'Federated credentials', 'Short-lived credentials issued by your cloud provider instead of a permanent key — Workload Identity Federation, or Application Default Credentials on Google Cloud.', [/\bADC\b/, /\bWorkload Identity Federation\b/i, /\bWIF\b/]),
  GV('data-residency', 'Data residency', 'A requirement that data be processed in a particular country or region, usually for legal reasons.', [/\bdata residency\b/i, /\binference_geo\b/]),

  // ── the web platform ────────────────────────────────────────────────────
  GS('cdn', 'CDN', 'A network serving common files — libraries, fonts — from servers near the reader. Published pages may only load scripts from an approved list of them.', [/\bCDNs?\b/]),
  GS('data-uri', 'Data URI', 'A file embedded directly inside the page as text, rather than fetched from a URL. How images and fonts get inlined when external requests are blocked.', [/\bdata:? URIs?\b/i, /\bdata URI\b/i]),
  GS('svg', 'SVG', 'Images described as shapes and coordinates rather than pixels, so they stay sharp at any size and can be styled with CSS.', [/\bSVG\b/]),
  GS('css-tokens', 'CSS custom property', 'A named value defined once and reused everywhere — `--accent: #6b57d2`. The mechanism that makes one design system hold across a page.', [/\bCSS variables?\b/i, /\bdesign tokens?\b/i, /\btokens on :root\b/i, /--[a-z-]+:/]),
  GV('contrast-ratio', 'Contrast ratio', 'A number describing how readable text is against its background. 7:1 is a strict standard; below about 4.5:1 body text becomes hard work.', [/\bcontrast ratio\b/i]),
  GV('greyscale', 'Greyscale-safe', 'Still readable when colour is removed — by a printer, or by a reader who cannot distinguish the hues you chose.', [/\bgreyscale\b/i, /\bcolour-blind/i, /\bcolor-blind/i]),
  GS('localstorage', 'Browser storage', 'A small store belonging to one site in one browser. Private to that viewer, and it can throw rather than return empty.', [/\blocalStorage\b/, /\bbrowser storage\b/i]),

  // ── formats and tooling ─────────────────────────────────────────────────
  GS('markdown', 'Markdown', 'Plain text with light formatting marks — `#` for headings, `-` for lists. The format most agent configuration is written in.', [/\bmarkdown\b/i, /\b\.md\b/]),
  GS('frontmatter', 'Frontmatter', 'A small configuration block fenced by `---` at the top of a markdown file, holding fields like name and description.', [/\bfrontmatter\b/i]),
  GS('yaml', 'YAML', 'An indentation-based configuration format, common for version-controlled settings.', [/\bYAML\b/]),
  GS('regex', 'Regular expression', 'A pattern language for matching text. Used here for tool matchers and for searching a codebase.', [/\bregexe?s?\b/i, /\bregular expressions?\b/i]),
  GS('cron', 'Cron expression', 'Five fields describing a repeating schedule — minute, hour, day of month, month, day of week. Evaluated in UTC here, so convert local times first.', [/\bcron\b/i]),
  GS('bm25', 'Keyword ranking', 'Classic search scoring by word overlap, with no embeddings or vector database needed. Often enough to pick which whole documents to send.', [/\bBM25\b/i, /\bkeyword ranking\b/i]),
  GS('matplotlib', 'Charting libraries', 'The plotting packages preinstalled in the code sandbox — matplotlib for charts, python-docx and python-pptx for Office files, pypdf for PDFs.', [/\bmatplotlib\b/i, /\bpython-docx\b/i, /\bpython-pptx\b/i, /\bpypdf\b/i]),

  GS('noise-fn', 'Noise function', 'A generator of smooth, repeatable randomness — nearby inputs give nearby outputs. What makes generative form look organic rather than static.', [/\bnoise\b/i]),
  GV('param-space', 'Parameter space', 'The set of all outputs a system can produce as its knobs vary. You explore it by sweeping one axis at a time.', [/\bparameter space\b/i, /\bcoefficients?\b/i]),
  GV('particle-system', 'Particle system', 'Many small elements each following the same simple rule, whose combined paths make the image. Flow fields are the common case.', [/\bparticle systems?\b/i, /\bflow fields?\b/i, /\breaction-diffusion\b/i]),

  // ── working practices ───────────────────────────────────────────────────
  GV('triage', 'Triage', 'Sorting incoming work by urgency and owner without fixing any of it. Deliberately a separate step from the fix.', [/\btriage\b/i, /\btriaging\b/i]),
  GV('severity', 'Severity', 'How bad an issue is, on a fixed scale — S1 or SEV-1 being the worst. A shared scale is what makes prioritisation arguable rather than personal.', [/\bseverit(y|ies)\b/i, /\bS[1-4]\b/, /\bSEV-?[12]\b/i]),
  GV('postmortem', 'Postmortem / RCA', 'The write-up after an incident: what broke, why, and what changes. "Blameless" means it examines the system rather than the person.', [/\bpostmortems?\b/i, /\bRCA\b/, /\bincident report\b/i]),
  GV('oncall', 'On-call', 'The rota of whoever gets woken when production breaks. A useful audience to write for: they are scanning, not reading.', [/\bon-call\b/i, /\bpaged?\b/i, /\bpager\b/i]),
  GV('baseline', 'Baseline', 'The normal range you compare today against. Without one, an "anomaly" is just a number someone finds surprising.', [/\bbaselines?\b/i]),
  GV('anomaly', 'Anomaly', 'A measurement outside the expected range. Worth alerting on, unlike a completed run.', [/\banomal(y|ies|ous)\b/i]),
  GV('regression', 'Regression', 'Something that used to work and now does not. What a gate exists to catch before it ships.', [/\bregressions?\b/i, /\bregressed\b/i]),
  GV('stack-trace', 'Stack trace', 'The chain of function calls printed when a program crashes, showing where it failed and how it got there.', [/\bstack traces?\b/i]),
  GV('provenance', 'Provenance', 'The record of where a piece of information came from. What lets a later reader tell an established fact from something read on the internet.', [/\bprovenance\b/i]),
];

const gnorm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Terms a node assumes you already know: glossary entries its own text uses,
 * minus anything its primer already defines, in the order they first appear.
 */
export function assumedFor(node, primer, limit = 9) {
  const text = [node.hook, node.what, node.insight, node.example?.label, node.example?.code]
    .filter(Boolean).join('\n');
  const defined = new Set((primer?.items ?? []).map(i => gnorm(i.n)));

  const found = [];
  for (const g of glossary) {
    if (defined.has(gnorm(g.t)) || defined.has(gnorm(g.id))) continue;
    let at = Infinity;
    for (const rx of g.m) {
      const m = text.match(rx);
      if (m) at = Math.min(at, text.indexOf(m[0]));
    }
    if (at !== Infinity) found.push({ g, at });
  }
  const byPos = (a, b) => a.at - b.at;
  const specific = found.filter(x => !x.g.b).sort(byPos);
  const basic = found.filter(x => x.g.b).sort(byPos);
  // Reserve a few slots for foundations so a dense node still defines "API"
  // for someone who needs it, without burying what the node is about.
  const reserved = Math.min(basic.length, 3);
  const picked = [
    ...specific.slice(0, Math.max(0, limit - reserved)),
    ...basic.slice(0, reserved),
  ];
  if (picked.length < limit) {
    for (const x of [...specific.slice(Math.max(0, limit - reserved)), ...basic.slice(reserved)]) {
      if (picked.length >= limit) break;
      if (!picked.includes(x)) picked.push(x);
    }
  }
  return picked.sort(byPos).map(x => x.g);
}
