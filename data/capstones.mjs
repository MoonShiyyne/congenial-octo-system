// Capstone projects — one per discipline, sitting at the summit of its sector.
//
// These are not exercises with an answer key. Each is a real project whose
// completion is the check: if you can ship it and satisfy `proof`, you can use
// the discipline. `traps` lists the mistakes that reveal you cannot, and each
// one is a failure someone actually makes rather than a hypothetical.
//
// `anchors` are the top-tier nodes the capstone caps. Note Context tops out at
// Architect while the other five reach Frontier, so its capstone anchors on two
// level-4 nodes rather than one level-5.

export const capstones = [
{
  d: 'reasoning',
  title: 'The Prompt Audit',
  tagline: 'Modernise a codebase of inherited prompts, and prove you did not break anything',
  anchors: ['r-archaeology'],
  brief: `You have inherited a service with about forty prompts, tool descriptions and skill files, written across two model generations by people who have left. Some carry scaffolding for problems that no longer exist. Some carry domain constraints that look exactly like scaffolding and are load-bearing. Nobody can tell you which is which.

Your job is to ship a modernised prompt layer with evidence that quality did not regress — not a conviction, evidence. The discipline being tested is whether you can tell a stale workaround from a real constraint, and whether you build the instrument before you start cutting.`,
  stages: [
    { n: 'Build the instrument first', nodes: ['r-judge', 's-evals'],
      d: 'Before deleting a single line, assemble twenty cases from real traffic and a binary rubric that scores them. Five true/false criteria, not a 1-10 score. Validate the judge against a handful you label by hand — an unvalidated judge is a random number generator with good prose.' },
    { n: 'Inventory and date the corpus', nodes: ['r-archaeology', 'r-ask'],
      d: 'Every prompt, tool description and skill file: when was it written, against which model, and what problem was it solving. Grep for the known dated patterns — fixed thinking budgets, assistant prefills, step-by-step scaffolding, superlative preambles, date-suffixed model ids.' },
    { n: 'Write the keep list', nodes: ['r-archaeology', 'r-critique'],
      d: 'The hard half. Domain constraints, safety rules and genuine downstream format requirements look like cruft and are not. Write them down explicitly before you touch anything, and run a critique pass over your own classification asking which entries you are least sure about.' },
    { n: 'Modernise the parameters', nodes: ['r-thinking', 'r-effort'],
      d: 'Fixed thinking budgets become adaptive thinking. Then set effort per route with a recorded reason — classification low, coding xhigh — rather than one global value inherited from older code.' },
    { n: 'Rewrite, one route at a time', nodes: ['r-ask', 'r-frame', 'r-examples'],
      d: 'Replace costume framing with the real situation and reader. Replace format instructions that structured outputs now guarantee. Where output shape matters, replace paragraphs of description with two or three real examples — varying everything you do not want learned.' },
    { n: 'Prove it and hand it over', nodes: ['r-judge', 'r-decompose'],
      d: 'Run the suite before and after. Produce a diff, a score comparison, and a written rationale a reviewer who never saw your reasoning can follow.' },
  ],
  proof: [
    'Every deletion is covered by an eval case that would have caught it — you can point at the case for any line you removed.',
    'Effort is set per route with a recorded reason. No global value.',
    'No `budget_tokens`, no assistant prefill, no date-suffixed model id survives anywhere in the repo.',
    'You can name three instructions you KEPT that look like cruft, and say what breaks without each.',
    'The before/after comparison is a reproducible number, not an impression.',
  ],
  traps: [
    'Deleting first and measuring afterwards. Without the eval built first, you are making untested edits to production behaviour and calling it cleanup.',
    'Accepting a 1-10 judge score as evidence. It will cluster around 7 and drift between runs.',
    'Removing a line because it is verbose, without asking what failure it was added in response to.',
    'Tuning effort globally because one route improved at a higher setting.',
  ],
},
{
  d: 'context',
  title: 'The Corpus Interrogator',
  tagline: 'Cited answers over 800 documents, under a stated budget, with the architecture chosen by measurement',
  anchors: ['c-editing', 'c-retrieval'],
  brief: `A compliance team has roughly 800 policy documents and contracts. They need answers they can check — every claim traceable to a span in a named document — and finance needs to know what a question costs before this gets approved.

The discipline being tested is restraint. A million-token window makes it easy to send everything and call it an architecture. The work is deciding what to put in front of the model, proving that choice with a number, and keeping the cost of a repeat question near zero.`,
  stages: [
    { n: 'Ingest once', nodes: ['c-files'],
      d: 'Upload through the Files API and reference by id. Stop re-transmitting documents on every request — this is the cheapest win available and it happens before any modelling decision.' },
    { n: 'Decide the architecture with a measurement', nodes: ['c-retrieval', 'c-longctx'],
      d: 'Build both paths on the same twenty questions: coarse retrieval of whole documents into a cached window, and fine-grained chunk retrieval. Compare accuracy and cost. Write down the number that decided it — "it fits" is not a finding.' },
    { n: 'Lay the request out for the cache', nodes: ['c-cache', 'c-projects'],
      d: 'Stable content first, volatile last, breakpoint between. Standing instructions frozen — no timestamps, no request ids, deterministic tool order. Then assert on `cache_read_input_tokens` in your tests so a future invalidator fails loudly instead of quietly costing money.' },
    { n: 'Make every claim checkable', nodes: ['c-citations'],
      d: 'Enable citations and render a real jump-to-source affordance from `page_location`. Discover early, not late, that citations and structured outputs cannot be combined in one call — design the two-call shape deliberately.' },
    { n: 'Survive a long session', nodes: ['c-editing', 'c-memory'],
      d: 'A reviewer works through forty questions in one sitting. Clear stale tool results, let compaction summarise the conversation — and append the whole `response.content` back each turn, or compaction state vanishes with no error. Persist decisions to memory, tagged with provenance.' },
    { n: 'Publish the numbers', nodes: ['c-longctx', 'c-cache'],
      d: 'Cost per question, cold and warm. Latency at p95. The measured accuracy difference between the two architectures. Finance gets a number, not an assurance.' },
  ],
  proof: [
    '`cache_read_input_tokens` is greater than zero on every repeat question, asserted in a test rather than checked by eye.',
    'Every factual claim in an answer carries a span, and the UI can jump to it.',
    'You can state cost per question cold and warm, and the ratio between them.',
    'You can say why you chose retrieval or the window, with the measurement that decided it.',
    'A forty-question session does not degrade — and you can say which history was cleared and which was summarised.',
  ],
  traps: [
    'Reaching for a vector database because that is what RAG means, without testing whether the corpus simply fits.',
    'Chunking at 500 tokens and then debugging answers that miss the second half of definitions.',
    'Combining citations with a JSON schema in one call and reading the 400 as a syntax error.',
    'Extracting `response.content[0].text` instead of appending the whole content — compaction dies silently.',
    'A timestamp near the front of the system prompt, which quietly makes every measurement above a lie.',
  ],
},
{
  d: 'code',
  title: 'The Self-Maintaining Repo',
  tagline: 'Make a real repository one where an agent can work overnight and you would merge the diff',
  anchors: ['k-remote'],
  brief: `Take a repository you actually work in. The goal is that a fresh agent session, given a bounded task and nobody watching, produces a branch you would review and merge — and that a new teammate gets the whole setup from one clone and one install.

The discipline being tested is whether you can encode what you know into the harness rather than into a conversation. Everything you would otherwise have to say out loud becomes a file, a rule, or an exit code.`,
  stages: [
    { n: 'Write down what the repo cannot tell you', nodes: ['k-claudemd'],
      d: 'Not the directory layout — the reverted decision from 2024, the flaky test with an infrastructural cause, the build step nothing enforces. Every line should be one a new teammate could violate on day one. Nest per-package files rather than growing one.' },
    { n: 'Bound the autonomy', nodes: ['k-permissions'],
      d: 'Allowlist the read-only noise so prompts stop being reflexive, deny secrets absolutely, and keep confirmation for writes and pushes. The test is that the next prompt you see makes you actually read it.' },
    { n: 'Turn a procedure into a Skill', nodes: ['k-skills', 'k-slash'],
      d: 'Take a workflow your team gets subtly wrong from memory. Ship it as a Skill whose description lists the literal words someone would say, with a script handling the mechanical half. Verify it fires on a realistic request rather than assuming it will.' },
    { n: 'Make the rules enforceable', nodes: ['k-hooks'],
      d: 'Format on write. Block edits to generated directories with a non-zero exit. Run the typechecker after a batch and feed failures back. Add a SessionStart hook so a fresh cloud session can run the tests on its first turn, not its tenth.' },
    { n: 'Package it', nodes: ['k-plugins'],
      d: 'Bundle the skill, its hook and your MCP servers into one versioned plugin. A new hire installs once and inherits the accumulated tooling instead of rediscovering it.' },
    { n: 'Run it unsupervised', nodes: ['k-remote', 'k-review', 'k-cli'],
      d: 'Four independent chores, four worktrees, four background sessions — each given a task with a machine-checkable definition of done, because nothing else will stop them. Review each diff with a pass that requires a concrete failure scenario per finding. The branches that come back are the exam.' },
  ],
  proof: [
    'A fresh clone plus one plugin install reproduces your entire setup — no verbal handover.',
    'You can demonstrate a hook blocking an edit, live. Not describe it; run it and show the non-zero exit.',
    'Four parallel background sessions produce four mergeable branches with no conflicts between them.',
    'A cloud session runs the test suite on its first turn.',
    'Your CLAUDE.md contains nothing the agent could have discovered by looking.',
  ],
  traps: [
    'A CLAUDE.md that restates the directory tree and asks for "high-quality code". Dilution makes the real rules invisible.',
    'A Skill with an elegant, abstract description that never matches a real request.',
    'Asking politely in an instruction file for something that must happen every time. That is a hook.',
    'Four parallel sessions on the same module — a merge conflict with extra steps.',
    'An allowlist so narrow that you approve on reflex, which is a worse posture than no prompts at all.',
  ],
},
{
  d: 'agents',
  title: 'The Overnight Analyst',
  tagline: 'An agent that runs at 6am, delegates its reading, and cannot cost more than five dollars',
  anchors: ['a-scheduled'],
  brief: `Build an agent that fires on a schedule, pulls yesterday's operational data through connectors you do not own, investigates anomalies against a baseline, and reports findings a program can act on. Nobody is watching it. Nobody will read a prose summary.

The discipline being tested is designing for absence. Every safeguard you were unconsciously providing — noticing weird output, stopping a thrashing loop, catching a wrong turn in the next message — has to become an explicit mechanism.`,
  stages: [
    { n: 'Design tools around intentions', nodes: ['a-tools'],
      d: 'Three task-shaped tools, not forty CRUD endpoints. Descriptions that say when NOT to use each. Strict schemas. Return every parallel result in one message — split them and you silently train the model out of parallelism.' },
    { n: 'Connect what you do not own', nodes: ['a-mcp', 'a-servertools'],
      d: 'Reach your dashboards and issue tracker over MCP. Where you use server tools, branch on the error object rather than assuming a raise — and remember search and fetch run on Anthropic servers, so environment network policy does not constrain them.' },
    { n: 'Move the reading somewhere else', nodes: ['a-subagents'],
      d: 'Log trawling is large input and small output — the ideal subagent shape. A read-only worker on a cheaper model at low effort returns a conclusion; the parent never carries the 200K tokens it read to get there.' },
    { n: 'Own the loop, then hand it over', nodes: ['a-runner', 'a-sdk', 'a-managed'],
      d: 'Write the nine-line loop by hand once so you know what you are delegating. Then choose deliberately: Tool Runner if your tools are all API calls, the Agent SDK if it needs a filesystem, Managed Agents if you want the container hosted too. Create the agent config once and store its id.' },
    { n: 'Make it safe to be absent', nodes: ['a-scheduled'],
      d: 'A hard budget in dollars. Structured output a program checks. Cron in UTC. Notification on anomaly only — a green run must be silent, so an alert always means something. Secrets in a vault, never inside the sandbox.' },
    { n: 'Graduate it', nodes: ['a-scheduled', 'a-teams'],
      d: 'Two weeks read-only. Read what it would have done. Only then let it act, and only on the actions the reports showed you actually wanted. If you add a second agent, write the handoff contract before the code.' },
  ],
  proof: [
    'A runaway loop costs at most a stated dollar figure, and you can point at the cap that enforces it.',
    'A healthy run sends nothing. You have not muted it — it has nothing to say.',
    'Output is machine-checkable, with an explicit "insufficient_data" branch it actually uses.',
    'You can state how many tokens the subagent read and how many reached the parent.',
    'The agent config is created once and referenced by id — not created per run.',
    'No credential is readable from inside the sandbox.',
  ],
  traps: [
    'Calling `agents.create()` in the request path, which discards versioning and leaves nobody able to say which config is live.',
    'Proxying your REST API as forty tools and watching the model compose them in the wrong order.',
    'Notifying on completion. You will stop reading within a week, and then it is unmonitored.',
    'Write access on day one, which means discovering your specification gaps in production.',
    'Treating a task budget as a spend cap — the advisory token budget is not the enforced dollar one.',
  ],
},
{
  d: 'craft',
  title: 'One Story, Four Surfaces',
  tagline: 'One analysis, four audiences, one visual system — and a cover nobody has seen before',
  anchors: ['f-generative'],
  brief: `You have one genuine analysis and four audiences: a team that wants a link, a board that wants a deck, an executive who wants a page they can mark up and forward, and a landing spot that needs an image. Produce all four so that a stranger can tell they came from the same organisation.

The discipline being tested is whether you can hold a system across surfaces. Four individually good, collectively unrelated artifacts is the common outcome and the failing one.`,
  stages: [
    { n: 'Build the system before the outputs', nodes: ['f-design'],
      d: 'Tokens and checkable rules, not adjectives. Five type steps, one spacing scale, three semantic colour roles, a stated contrast floor. Ship it as a Skill so it loads automatically — a style guide nobody pastes in does not exist.' },
    { n: 'Write the argument, then the chart', nodes: ['f-viz', 'f-longform'],
      d: 'Agree the outline of the analysis before any prose or any chart — structural problems are free to fix now and expensive later. Then for each chart write the sentence a reader should conclude in three seconds; if you cannot write it, you do not have a chart. Direct-label the series, keep the axis honest, encode redundantly, read gridline colour from tokens.' },
    { n: 'The shareable page', nodes: ['f-artifacts'],
      d: 'Publish it. Complete light palette on bare `:root`, tokens redefined for both dark paths, explicit background on `body`. Check it on a phone and in both themes before you send the link.' },
    { n: 'The files people open elsewhere', nodes: ['f-docs'],
      d: 'A real .docx and a real .pptx, built from your template so they arrive on-brand rather than in default Calibri. Same numbers as the page — reconciled, not retyped.' },
    { n: 'Make one surface answer back', nodes: ['f-capabilities'],
      d: 'Add a runtime capability to the page: it explains an anomaly on click, or collects a response everyone can see. Choose storage honestly — per-viewer convenience is browser storage; a shared tally is not.' },
    { n: 'Generate the cover', nodes: ['f-generative', 'f-canvas'],
      d: 'A seeded parameterised system, not a picture. Named knobs, one seed, variations by sweeping a single axis. Then refine the layout by direct manipulation rather than by describing nudges in sentences.' },
  ],
  proof: [
    'All four surfaces pass a token audit — no colour, size or spacing outside the system.',
    'Every chart has a written takeaway sentence, and the chart makes that sentence visible.',
    'The page is legible in light, dark and the un-stamped system default, and on a phone.',
    'The cover is reproducible: same seed, same image, and you can say what each knob controls.',
    'A stranger shown all four says they came from the same place, without being told.',
  ],
  traps: [
    'Producing the artifacts first and trying to unify them afterwards.',
    'A chart before a takeaway sentence — you get a default bar chart of the wrong comparison.',
    'Defining colours only inside a dark-mode media query, so half the audience gets unreadable text.',
    'Using browser storage for something several people are meant to share.',
    'An unseeded generator, which makes the good result you got twenty minutes ago unrecoverable.',
  ],
},
{
  d: 'scale',
  title: 'The Route to Production',
  tagline: 'Take one route from prototype to something you would put a pager on',
  anchors: ['s-deploy'],
  brief: `Pick one real route — a classifier, a summariser, an extraction step — and carry it all the way. Model and effort chosen by measurement, output your code can parse, cost you can defend, a gate that blocks regressions, every failure path handled, and enough capture that you can explain a change in behaviour three weeks later.

The discipline being tested is whether you treat a model call as production software. Most prototypes fail on the paths nobody exercises: the refusal, the truncation, the reordered batch.`,
  stages: [
    { n: 'Route on evidence', nodes: ['s-models', 'r-effort'],
      d: 'Measure the capable model at lower effort before reaching for a cheaper model — and remember caches are model-scoped, so a cascade forfeits reuse. Use exact model ids; a date suffix is a habit from older models that now fails outright.' },
    { n: 'Make the output parseable by construction', nodes: ['s-structured'],
      d: 'A schema whose field names instruct — `confidence_0_to_1`, `evidence_quote` — and an explicit "cannot determine" branch. Without the escape hatch you are compelling the model to invent a value your code will trust.' },
    { n: 'Take the free wins, in order', nodes: ['c-cache', 's-batch', 's-cost'],
      d: 'Caching, then input hygiene, then batching anything asynchronous at half price. Only then consider a tradeoff. Measure cost per completed task — a cheap request that needs three retries is not cheap.' },
    { n: 'Build the gate', nodes: ['s-evals', 'r-judge'],
      d: 'Twenty real cases. Deterministic checks first — schema, required fields, latency and cost bounds — and a binary-criteria judge only for the subjective axis. Wire it into CI so it blocks a merge, and gate on cost as well as quality.' },
    { n: 'Handle the paths nobody exercises', nodes: ['s-guardrails'],
      d: 'Check `stop_reason` before reading content, every time — a refusal is a 200 and nothing raises. Branch on truncation and continuation. Handle errors most-specific-first. Treat any external content as data, never as instructions.' },
    { n: 'Capture enough to explain the future', nodes: ['s-observability', 's-deploy'],
      d: 'Log model, effort, thinking config and hashes of the tool and system prompts alongside `usage` — most quality shifts are a config change nobody connected. Alert on cache hit rate. Then check which features you depend on survive the platform you might move to.' },
  ],
  proof: [
    'CI blocks on a quality regression AND a cost regression, and you can show both firing.',
    'You can produce cost per completed task, not per request.',
    'Every `stop_reason` has an explicit branch — including the refusal path, which you have tested.',
    'Batch results are keyed by `custom_id`, and you can show that positional matching would have corrupted data.',
    'You can name exactly what breaks if this moves to Vertex or Bedrock tomorrow.',
    'A cache hit rate collapse pages someone the day it lands.',
  ],
  traps: [
    'Reading `response.content[0].text` without checking `stop_reason` — the refusal path returns 200 and hands users a blank.',
    'Zipping batch results against inputs. It passes every small test and corrupts data at production volume.',
    'A cost audit that starts firing requests to measure things without asking first — every run spends real money.',
    'Assuming platform parity. Fast mode is first-party only; Vertex has no web fetch; Managed Agents is not on partner clouds.',
    'Shipping a change that improves scores two points and triples spend, and hearing about it from finance.',
  ],
},
];
