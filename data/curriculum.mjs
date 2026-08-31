// Curriculum graph for the Claude Progression Web.
// Authored as an ES module so long prose can be written without JSON escaping.
// Consumed by the browser (assets/app.js) and by tools/refresh-signals.mjs.

export const disciplines = [
  { id: 'reasoning', name: 'Reasoning & Dialogue', hue: 268,
    blurb: 'How you talk to the model, and how it thinks back. Everything else is built on this.' },
  { id: 'context',   name: 'Context & Knowledge',  hue: 212,
    blurb: 'What Claude can see. Getting the right bytes in front of the model at the right cost.' },
  { id: 'code',      name: 'Code & Engineering',   hue: 152,
    blurb: 'Claude Code as a working environment: permissions, memory, extensibility.' },
  { id: 'agents',    name: 'Agents & Automation',  hue: 36,
    blurb: 'Handing Claude the loop. Tools, protocols, delegation, and autonomy.' },
  { id: 'craft',     name: 'Creation & Craft',     hue: 340,
    blurb: 'Claude as a maker of artifacts people actually look at, read, and use.' },
  { id: 'scale',     name: 'Platform & Scale',     hue: 190,
    blurb: 'Running Claude in production: models, money, evaluation, and failure modes.' },
];

export const levels = [
  { n: 1, name: 'Ground',    sub: 'First contact',      note: 'You can get a good answer on purpose rather than by luck.' },
  { n: 2, name: 'Fluent',    sub: 'Daily practitioner', note: 'You shape the interaction instead of accepting the default one.' },
  { n: 3, name: 'Builder',   sub: 'Composes systems',   note: 'You assemble Claude into something that runs without you watching.' },
  { n: 4, name: 'Architect', sub: 'Designs for others', note: 'You make decisions other people and other agents depend on.' },
  { n: 5, name: 'Frontier',  sub: 'Pushes the edge',    note: 'You work where the documentation runs out.' },
];

export const nodes = [

// ── REASONING & DIALOGUE ────────────────────────────────────────────────────
{
  id: 'r-ask', d: 'reasoning', lvl: 1, title: 'Precise Asking',
  tag: 'the four-part request', prereq: [],
  hook: 'Most "bad Claude answers" are well-executed answers to a question nobody actually asked.',
  what: `A request that reliably works carries four things: the **task** (what to produce), the **context** (what the model cannot see from where it sits), the **constraints** (length, format, what to avoid), and the **audience** (who reads the output). Drop any one and the model fills the gap with a plausible average — which is exactly the generic output people complain about.

The counterintuitive part is that vagueness is not neutral. When you say "improve this function," the model must silently guess whether you mean speed, readability, safety, or API surface. It will pick one, commit, and be confidently wrong about your intent. Naming the axis costs six words and removes the entire failure mode.

The second habit is stating the *negative space*: what a good answer should not do. "Don't restructure the module" or "no new dependencies" prevents the single most common category of unusable output — technically excellent work aimed at the wrong target.

This node is level one because it never stops paying. Every advanced technique on this web — thinking budgets, agent loops, evals — amplifies whatever intent you encoded. Amplifying a vague intent just gets you to the wrong place faster.`,
  insight: 'Specify the axis of improvement, not just the object. "Improve X" is under-specified; "reduce allocations in X without changing its signature" is a task.',
  example: { label: 'Vague vs. specified', lang: 'text', code: `✗  "Improve this SQL query."

✓  "This query backs a dashboard tile and times out at ~8s on a
    40M-row orders table (Postgres 16, index on created_at only).

    Task:        cut p95 latency under 1s
    Constraints: no schema migrations, no new indexes this sprint,
                 result set must stay byte-identical
    Audience:    a reviewer who did not write the original query —
                 explain each rewrite in one line
    Format:      revised SQL, then a short EXPLAIN-based rationale"` },
},
{
  id: 'r-frame', d: 'reasoning', lvl: 1, title: 'Framing & Register',
  tag: 'set the room, not the mask', prereq: ['r-ask'],
  hook: 'You are not casting a character. You are telling the model which body of knowledge and which quality bar to reach for.',
  what: `Older prompting advice said to write "You are a world-class expert…". On current models that framing does very little on its own, and can actively hurt: it invites a *performance* of expertise — confident register, hedge-free tone — rather than actual care.

What still works is describing the **situation** instead of the costume. "This is going into a security review that a skeptical staff engineer will read line by line" changes the output substantially, because it tells the model the real stakes, the real reader, and the real failure mode. "You are a senior security engineer" mostly changes the vocabulary.

Register is the second half. Ask for the shape of the prose you want — terse and technical, or explanatory and warm — and the model will hold it far more consistently than if you correct tone after the fact. Tone corrections mid-conversation are expensive: they invalidate cached prefixes and often bleed into the substance.

A useful test: if your framing sentence would still make sense written on a ticket by a human colleague, it is a good frame. If it only makes sense as stage direction to an actor, it is probably decoration.`,
  insight: 'Describe the reader and the consequences. Those two facts do more work than any number of superlatives about who the model is pretending to be.',
  example: { label: 'Costume vs. situation', lang: 'text', code: `✗  "You are a brilliant, world-renowned technical writer."

✓  "This paragraph goes in the migration guide. The reader is an
    on-call engineer at 3am who has already hit the error and is
    scanning for the fix. They will not read the second paragraph.
    Lead with the remedy; put the cause after it."` },
},
{
  id: 'r-examples', d: 'reasoning', lvl: 2, title: 'Exemplars & Few-Shot',
  tag: 'show the target', prereq: ['r-frame'],
  hook: 'One good example is worth roughly a paragraph of adjectives — and unlike adjectives, it cannot be misread.',
  what: `When output *shape* matters more than output *content* — a commit message convention, a changelog voice, a triage label, a code style — description is a lossy channel and demonstration is not. Two or three real examples pin down a dozen implicit rules you would never think to write down: where the line breaks fall, whether you capitalise after the colon, how much hedging is acceptable.

The technique has sharp edges. Examples teach *everything* they contain, including accidents. If all three of your examples happen to be about authentication, the model learns "and it is usually about auth." Vary the surface features you do not want copied, and hold constant only the ones you do.

Order matters too: models weight the final example most heavily, so put your most representative case last, not first. And prefer examples drawn from your actual corpus over invented ones — invented examples tend to be cleaner than reality, which sets a standard the model then applies to messy real inputs by "tidying" them.

Counter-example pairs are the strongest form. A single ✗/✓ pair with the same input teaches the boundary, not just the target — the model learns what the rule *excludes*, which is the part pure demonstration leaves ambiguous.`,
  insight: 'Vary everything you do NOT want learned. Examples that share an accidental trait will teach that trait as if it were the rule.',
  example: { label: 'A ✗/✓ pair pins the boundary', lang: 'text', code: `Label support tickets. Use the exact tags shown.

✗  "The app is slow"                    → [performance]
✓  "The app is slow"                    → [needs-repro]
   (no version, no endpoint, no numbers — unactionable)

✓  "Checkout p95 went 200ms→3s after v4.2, EU only"
                                        → [performance, regression]

Now label: "Login takes forever on mobile"` },
},
{
  id: 'r-critique', d: 'reasoning', lvl: 2, title: 'Critique & Revision Loops',
  tag: 'the second pass is cheap', prereq: ['r-examples'],
  hook: 'Asking Claude to find the three weakest points in its own answer costs one turn and routinely beats a better first prompt.',
  what: `Generation and evaluation are different cognitive jobs, and models are noticeably better at the second. A draft produced under the pressure of "write this" contains compromises the model made silently; a separate pass whose only job is "find what is wrong here" surfaces them, because nothing is being defended.

The loop that works is narrow and adversarial: *"List the three specific claims in this answer most likely to be wrong, and what evidence would settle each."* Open-ended "review this" produces flattering summaries. A capped, ranked, falsifiable request produces findings.

Do the critique in a fresh context when you can. If the same conversation wrote the draft, its own reasoning is sitting there acting as justification, and the critique inherits the draft's framing. A subagent (see *Subagents*) or a new session reading only the artifact is a genuinely harsher reader — this is the same reason code review works better across people than within one head.

Know when to stop. Revision loops have a real ceiling, usually two or three passes; past that the model starts trading substance for polish, softening strong claims and adding hedges. If pass three is only changing adjectives, the loop is done.`,
  insight: 'Cap and rank the critique. "The three most likely errors" gets findings; "any thoughts?" gets a compliment.',
  example: { label: 'A critique pass that finds things', lang: 'text', code: `Here is the migration plan you just wrote.

Act as the engineer who will be paged if it fails.

1. Name the 3 steps most likely to fail in production, ranked
   by blast radius — not by likelihood.
2. For each: the precise failure signature we would observe,
   and the cheapest check that would have caught it beforehand.
3. Name one assumption the plan makes that is NOT written down.

Do not restate the plan. Do not reassure me.` },
},
{
  id: 'r-thinking', d: 'reasoning', lvl: 3, title: 'Adaptive Thinking',
  tag: 'reasoning as a first-class parameter', prereq: ['r-critique'],
  hook: 'The model can spend tokens thinking before it answers — and on current models you no longer budget that by hand.',
  what: `Extended thinking gives the model room to reason before producing its visible answer. The important recent change is architectural: the old fixed-budget style — \`thinking: {type: "enabled", budget_tokens: N}\` — is **deprecated on Opus 4.6 / Sonnet 4.6 and rejected with a 400 on Fable 5, Sonnet 5, and Opus 5 / 4.8 / 4.7**. The current form is \`thinking: {type: "adaptive"}\`, where the model decides how much reasoning a given request warrants.

That is a genuine shift in mental model. You are no longer pre-paying a fixed reasoning allowance for every request in a route, including the trivial ones. You are declaring reasoning *available* and letting depth vary per request, then controlling the overall envelope with **effort** (next node).

Two details bite people. First, on Claude Opus 5 thinking is **on by default** if you omit the parameter — unlike Opus 4.8/4.7, which run without it unless you ask. Second, \`display\` defaults to \`"omitted"\` on Fable 5, Opus 5/4.8/4.7 and Sonnet 5: thinking blocks stream with empty text. If you show reasoning to users, that default looks like a long silent pause, so set \`display: "summarized"\` deliberately. Thinking is billed identically under every display setting — display controls visibility, not work. The raw chain of thought is never exposed on any model.

When continuing a conversation on the same model, echo thinking blocks back unchanged. Other models ignore them silently.`,
  insight: 'Disabling thinking on Opus 5 has two real failure modes — tool calls leaking into visible text, and stray <thinking> tags. If you want it cheaper, keep thinking on and lower effort instead.',
  example: { label: 'Adaptive thinking, reasoning shown to the user', lang: 'python', code: `resp = client.messages.create(
    model="claude-opus-5",
    max_tokens=16000,
    thinking={"type": "adaptive", "display": "summarized"},
    output_config={"effort": "high"},
    messages=[{"role": "user", "content": "..."}],
)

# ✗ 400 on Opus 5 / Sonnet 5 / Fable 5 / Opus 4.8 / 4.7:
#   thinking={"type": "enabled", "budget_tokens": 8000}
# The fixed-budget concept is gone; use effort to shape spend.` },
},
{
  id: 'r-effort', d: 'reasoning', lvl: 3, title: 'The Effort Dial',
  tag: 'low → medium → high → xhigh → max', prereq: ['r-thinking'],
  hook: 'One parameter trades thoroughness against spend inside a single model — and it is the lever people reach for last instead of first.',
  what: `\`output_config: {effort: "low"|"medium"|"high"|"xhigh"|"max"}\` — note that it lives *inside* \`output_config\`, not at the top level. The default is \`high\`. It controls reasoning depth and overall token spend, and it is the first quality-trading lever you should touch after the free wins like caching.

The behaviour is not just "thinks longer." Lower effort produces fewer and more consolidated tool calls, less preamble, and terser confirmations. That makes \`low\` genuinely good for subagents and simple classification, not merely cheap — a chatty subagent that narrates its work is worse *and* more expensive.

\`xhigh\` sits between \`high\` and \`max\` and is the sweet spot for most coding and agentic work on Fable 5, Opus 5, Opus 4.7/4.8 and Sonnet 5. Effort matters far more on these models than on any earlier generation, which means an effort setting inherited from older code is very likely mistuned — re-tune it as part of any migration.

The strategic point: before you build a multi-model cost cascade, measure the newest model at *lower effort* on the same tasks. Lower effort on a current model often matches or beats a previous generation at high effort, and one model means one cache namespace — a cascade forfeits cache reuse across its models, because caches are model-scoped. Measure cost per *completed task*, not per request; a cheap request that needs three retries is not cheap.`,
  insight: 'Effort is a per-route decision, never a global one. Coding and long-horizon agentic work repay high effort; chat and classification usually do not and run fine at low.',
  example: { label: 'Per-route effort, one model', lang: 'python', code: `ROUTE_EFFORT = {
    "ticket_triage":   "low",     # classification; depth adds nothing
    "chat_reply":      "medium",
    "code_review":     "xhigh",   # sweet spot for coding work
    "migration_plan":  "max",     # correctness > cost, rarely run
}

client.messages.create(
    model="claude-opus-5",
    max_tokens=16000,
    thinking={"type": "adaptive"},
    output_config={"effort": ROUTE_EFFORT[route]},
    messages=msgs,
)
# Changing effort mid-conversation invalidates the message cache.` },
},
{
  id: 'r-decompose', d: 'reasoning', lvl: 4, title: 'Decomposition & Plan-Then-Act',
  tag: 'separate deciding from doing', prereq: ['r-effort'],
  hook: 'The plan is the artifact you can review before any irreversible work happens.',
  what: `For anything with real consequences — a refactor, a migration, a multi-file change — splitting the work into an explicit planning turn and a separate execution turn changes the economics of being wrong. A bad plan costs one cheap turn to discard. A bad execution costs a revert, and sometimes a production incident.

The mechanism is not just "think first." A written plan is a *reviewable object*: you can hand it to a human, diff it against the ticket, or feed it to a second model that never saw the original reasoning. That review step is impossible when planning happens invisibly inside a single generation.

Good decomposition names the seams — the points where the work could stop safely. "Step 3 lands the schema change; steps 4-6 are reversible and can ship separately" is far more useful than an eight-item to-do list, because it tells you where the risk actually concentrates.

Give the full task specification up front rather than dribbling it in. Long-horizon agentic runs at \`high\`/\`xhigh\` effort do markedly better with the whole spec available at planning time; incremental reveals cause the model to commit to an architecture that the later requirements then break. In Claude Code this is what plan mode formalises — the agent proposes, you approve, and only then does it touch the filesystem.`,
  insight: 'Ask for the rollback story as part of the plan. A plan that cannot say how to undo step 3 has not actually thought about step 3.',
  example: { label: 'Planning turn with an explicit stop-gate', lang: 'text', code: `Plan only. Change nothing yet.

Produce a numbered plan to move sessions from in-memory to Redis.
For each step give:
  · files touched
  · whether it is independently revertible (yes/no + how)
  · the observable signal that it worked

Then, before the list, state in one line the LAST step after which
we could stop and still be in a consistent, shippable state.

Flag any step where you had to guess at our infrastructure.` },
},
{
  id: 'r-judge', d: 'reasoning', lvl: 4, title: 'Claude as Evaluator',
  tag: 'rubrics, not vibes', prereq: ['r-decompose'],
  hook: 'The moment you have two prompts and no way to say which is better, you have stopped engineering and started guessing.',
  what: `Using a model to grade model output — LLM-as-judge — is what makes iteration measurable. It is also the technique most often implemented badly, in one specific way: asking for a 1-10 score. Scalar scores from language models are poorly calibrated, drift between runs, and cluster around 7. They feel like measurement and are not.

What works is **binary, independently-checkable criteria**. Not "rate the accuracy," but "does the answer cite a line number for every claim about the code? yes/no." Five binary checks give you a 0-5 score that is reproducible and, critically, *debuggable* — when the number drops you know which check failed.

Guard against the known biases. Judges prefer longer answers, prefer answers that match their own style, and prefer whichever candidate is presented second. Randomise position, strip length cues where you can, and — the strongest fix — have the judge evaluate one output at a time against the rubric rather than comparing two.

Use a capable model as the judge even when a cheap model generates. Judging is the step where an error propagates silently into every downstream decision you make. And always keep a small human-labelled set to check the judge against: an unvalidated judge is a random number generator with good prose.`,
  insight: 'Never let the judge see which prompt or model produced a candidate. Provenance leaks into scores even when you tell it not to.',
  example: { label: 'A binary rubric with structured output', lang: 'python', code: `RUBRIC = """Evaluate the ANSWER against the SOURCE.
For each criterion output true/false and a one-line justification.

1. grounded      every factual claim traceable to SOURCE
2. complete      addresses every part of the question
3. no_invention  introduces no entity absent from SOURCE
4. format        valid JSON matching the requested schema
5. scoped        does not answer questions that were not asked
"""

client.messages.create(
    model="claude-opus-5",              # judge with a strong model
    max_tokens=2000,
    output_config={
        "effort": "high",
        "format": {"type": "json_schema", "schema": RUBRIC_SCHEMA},
    },
    system=RUBRIC,
    messages=[{"role": "user", "content": f"SOURCE:\\n{src}\\n\\nANSWER:\\n{ans}"}],
)
# Score = count of true. Reproducible, and you can see WHICH check broke.` },
},

{
  id: 'r-archaeology', d: 'reasoning', lvl: 5, title: 'Prompt Archaeology',
  tag: 'finding what stopped being true', prereq: ['r-judge'],
  hook: 'The most expensive prompts in your codebase are the ones that worked perfectly two model generations ago.',
  what: `Prompts accumulate cruft, and cruft does not announce itself. A workaround written for a model that struggled with JSON is still there, still costing tokens, still constraining a model that has not had that problem in a year. Nothing fails; the output just quietly gets worse than it needed to be.

The dated patterns are recognisable once you know the shapes. Elaborate "think step by step" scaffolding, now redundant against adaptive thinking. Fixed \`budget_tokens\` reasoning allowances, which are deprecated on 4.6-era models and **rejected with a 400** on Fable 5, Sonnet 5 and Opus 5/4.8/4.7. Assistant prefills to force a format — removed across the current generation, and a 400 today. Defensive instructions against failure modes that no longer occur. Few-shot examples teaching a format that structured outputs now guarantees. Verbose "you are an expert" preambles doing nothing but consuming a cache prefix.

The cost is doubled: you pay for the tokens, *and* over-prescriptive prompting measurably reduces output quality on current models. Instructions written for a weaker model constrain a stronger one — the thing you added to help is now the thing holding it back.

Do this as a real audit, not a vibe. Inventory every prompt, tool description and skill; establish when each was written and against which model; scan for the known patterns; then produce findings with \`file:line\` and a proposed diff. Crucially, keep a *keep list* — domain constraints, safety rules and genuine formatting requirements look like cruft and are not. The eval suite is what makes the deletions safe.`,
  insight: 'Deleting a stale instruction is a change like any other. Without an eval you are not cleaning up — you are making an untested edit to production behaviour.',
  example: { label: 'Greppable signals of a prompt written for an older model', lang: 'bash', code: `# Fixed reasoning budgets — 400 on Fable 5 / Opus 5 / 4.8 / 4.7 / Sonnet 5
rg -n 'budget_tokens'

# Assistant prefills — removed across the current generation
rg -n --multiline '"role":\\s*"assistant".*\\n\\s*\\]' -g '*.py' -g '*.ts'

# Scaffolding that adaptive thinking now handles
rg -ni "think step by step|take a deep breath|let's think about this"

# Superlative preambles occupying a cache prefix
rg -ni "you are a (world-class|brilliant|expert|senior)"

# Date-suffixed model ids — IDs are complete as written
rg -n 'claude-[a-z]+-[0-9-]+-20[0-9]{6}'

# KEEP LIST — these look like cruft and are not:
#   · domain constraints  ("never quote a price without the disclaimer")
#   · safety rules        ("refuse requests to identify people in images")
#   · real format needs   (a downstream parser genuinely requires it)
# Every deletion goes through the eval suite before it ships.` },
},

// ── CONTEXT & KNOWLEDGE ─────────────────────────────────────────────────────
{
  id: 'c-files', d: 'context', lvl: 1, title: 'Files, PDFs & Vision',
  tag: 'stop pasting, start attaching', prereq: [],
  hook: 'A screenshot of a failing dashboard is a better bug report than the paragraph you were about to write about it.',
  what: `Claude reads images and PDFs natively, in the same request as your text. A PDF goes in as a \`document\` content block — base64 for one-offs, or a \`file_id\` from the Files API when the same document will be used across many requests. Images go in as \`image\` blocks. The content-block type must match the file's MIME type; mismatches are a common first error.

Placement matters more than people expect: put the document block **before** the text block in the user message. The model reads in order, and a question asked before the evidence arrives gets answered from priors and then retrofitted. Base64 strings must have no newlines. The hard limits are 32 MB per request and 600 pages (100 on 200K-context models).

Vision is not only for screenshots. Architecture diagrams, whiteboard photos, a chart whose underlying CSV you have lost, a rendering bug that is impossible to describe in words — all of these move faster as pixels. For UI work specifically, attaching the broken screenshot alongside the code is dramatically more effective than describing the visual defect, because the description is where the information gets lost.

The Files API is the scaling step: upload once, reference by \`file_id\` in many requests, and stop paying to re-upload a 200-page spec on every turn.`,
  insight: 'Document block before text block. The order is not cosmetic — the model answers in reading order.',
  example: { label: 'Upload once, reference many times', lang: 'python', code: `f = client.files.upload(file=open("spec-v4.pdf", "rb"))

for question in questions:                 # many turns, one upload
    client.messages.create(
        model="claude-opus-5", max_tokens=4000,
        messages=[{"role": "user", "content": [
            {"type": "document",                   # ← document FIRST
             "source": {"type": "file", "file_id": f.id}},
            {"type": "text", "text": question},    # ← question SECOND
        ]}],
    )` },
},
{
  id: 'c-projects', d: 'context', lvl: 1, title: 'Standing Instructions',
  tag: 'say it once, not every time', prereq: ['c-files'],
  hook: 'If you have typed the same preference three times, it belongs somewhere durable — not in your next message.',
  what: `Every surface has a place for instructions that persist across conversations: Projects in the Claude apps, \`CLAUDE.md\` in Claude Code, the \`system\` prompt on the API, an agent config in Managed Agents. They all solve the same problem — the recurring preamble you are tired of retyping — and they all fail in the same way when overloaded.

The failure is dilution. A 2,000-word standing instruction file where everything is important means nothing is. Instructions that survive contact are **specific, testable, and few**: "use \`pnpm\`, never \`npm\`" survives; "write high-quality code" does not, because it has no observable violation.

Write them as constraints and corrections, not aspirations. The highest-value entries are the ones that encode a mistake already made — the non-obvious build step, the deprecated helper everyone still reaches for, the directory that looks like source but is generated. Those are things the model genuinely cannot infer from the repository.

The prompt-caching connection is the reason this is a level-one skill with level-four consequences. Standing instructions sit at the *front* of the request, which makes them the ideal cache prefix — but only if they are byte-stable. A standing instruction file with a timestamp or a rotating tip in it silently destroys cache hits on every request that follows it.`,
  insight: 'Every line should be one a new teammate could violate on their first day. If it cannot be violated, it is decoration and it is costing you attention.',
  example: { label: 'A CLAUDE.md that earns its tokens', lang: 'text', code: `# Conventions

- pnpm only. \`npm install\` corrupts the workspace symlinks.
- \`src/generated/**\` is codegen output — never hand-edit; run
  \`pnpm gen\` instead.
- Tests: \`pnpm vitest run <path>\`. Never \`--watch\` in an agent
  session; it never exits.
- We use \`Result<T,E>\`, not thrown errors, below \`src/api/\`.
  Throwing there breaks the error boundary contract.

# Gotchas
- \`db.query\` auto-opens a transaction. Nesting it deadlocks.` },
},
{
  id: 'c-memory', d: 'context', lvl: 2, title: 'Memory',
  tag: 'state that outlives the window', prereq: ['c-projects'],
  hook: 'Context is what the model is holding. Memory is what it can go and fetch. Confusing the two is the most expensive mistake in agent design.',
  what: `The memory tool (\`memory_20250818\`) gives Claude a persistent store it reads from and writes to across turns and sessions. Unlike context, memory does not consume the window until it is retrieved — which makes it the correct home for facts that are *occasionally* relevant: a user's preferences, decisions made three sessions ago, the shape of a codebase learned the hard way.

The design question is what deserves to be remembered. Naive implementations write everything, and the store becomes a landfill that retrieval cannot navigate. Good ones write **decisions and their reasons**, not transcripts: "chose Postgres over DynamoDB because of the reporting query shape, 2026-03" is worth a hundred turns of the discussion that produced it.

Memory is a security surface, and this is underappreciated. Anything written to memory will be read back later and treated as established fact by a future session. If untrusted content — a web page, a PR comment, an email — can reach the write path, you have built a persistent prompt-injection channel with a delay fuse. Sanitise at write time, and record provenance so a later session can tell "the user told me this" from "I read this on the internet."

Pair it with context editing, not against it: memory persists what matters, context editing clears what does not.`,
  insight: 'Write decisions with dates and reasons, never transcripts. A memory store you cannot audit is one you cannot trust after month two.',
  example: { label: 'Declaring the memory tool', lang: 'python', code: `client.messages.create(
    model="claude-opus-5", max_tokens=8000,
    tools=[{"type": "memory_20250818", "name": "memory"}],
    system=(
        "Before answering, check memory for prior decisions on this "
        "project. Record only DECISIONS (what, why, date) and durable "
        "user preferences. Never record raw conversation. Tag every "
        "entry with its source: user | observed | external."
    ),
    messages=msgs,
)
# Python/TS ship BetaAbstractMemoryTool / betaMemoryTool helpers
# for implementing the storage backend.` },
},
{
  id: 'c-citations', d: 'context', lvl: 2, title: 'Citations & Grounding',
  tag: 'claims you can check', prereq: ['c-files'],
  hook: 'An answer you cannot verify is a rumour with good formatting.',
  what: `Set \`citations: {enabled: true}\` on a \`document\` content block and Claude returns its answer split into multiple \`text\` blocks, where the cited ones carry a \`citations\` array pointing back at exact source spans. It is either all documents in the request or none.

The location shape depends on the source type: \`char_location\` (with \`start_char_index\`/\`end_char_index\`) for plain text, \`page_location\` (1-indexed page numbers) for PDFs, and \`content_block_location\` for custom content. That means you can render a real "jump to source" affordance, not just a footnote — which is the difference between a citation feature and a citation *interface*.

The deeper value is behavioural. Requiring citations changes what the model is willing to assert. Claims that cannot be anchored to a span tend not to get made, and the ones that do get made are visibly separated from the ones that are inference. For anything touching compliance, legal, medical or financial review, this is the difference between usable and unusable output.

One hard constraint: citations are **incompatible with \`output_config.format\`** and return a 400 if you combine them. If you need both structure and provenance, run structured extraction and cited synthesis as two calls, or have the schema carry citation fields you populate from the cited blocks yourself.`,
  insight: 'Citations and structured outputs cannot be combined in one call — a 400, not a warning. Plan the two-call shape before you build the feature.',
  example: { label: 'Cited answers over a contract', lang: 'python', code: `resp = client.messages.create(
    model="claude-opus-5", max_tokens=4000,
    messages=[{"role": "user", "content": [
        {"type": "document",
         "source": {"type": "base64", "media_type": "application/pdf",
                    "data": pdf_b64},
         "title": "MSA v3",
         "citations": {"enabled": True}},          # all-or-none
        {"type": "text", "text": "What is the termination notice period?"},
    ]}],
)

for block in resp.content:
    if block.type == "text" and getattr(block, "citations", None):
        for c in block.citations:
            print(f"p.{c.start_page_number}: {c.cited_text[:80]}")` },
},
{
  id: 'c-longctx', d: 'context', lvl: 3, title: 'The 1M Window',
  tag: 'capacity is not a strategy', prereq: ['c-memory', 'c-citations'],
  hook: 'A million tokens of context means you can put the whole repository in. It does not mean you should.',
  what: `Current models carry 1M-token context windows (Haiku 4.5 is the exception at 200K). That changes what is architecturally possible: whole codebases, full document sets, entire conversation histories, no chunking pipeline.

But context is not free in three separate ways. It costs **money** — every token is billed on every turn, so a 400K-token conversation pays for 400K tokens on turn 40 as well as turn 4. It costs **latency**, linearly and visibly. And it costs **attention**: a needle stays findable, but *judgement* over a saturated window degrades — the model has more plausible-looking material to be distracted by, and irrelevant context actively competes with relevant context.

So the discipline is curation, not capacity. The best-performing long-context setups are usually the ones that put *less* in: the four files that matter rather than the eighty that mention the symbol. "It fits" is not the same as "it helps."

Practical consequence: use the window for things that genuinely need to be seen *together* — cross-file refactors, a contract compared against its amendments, a long trace analysed as a whole. For lookup-shaped work, retrieval remains both cheaper and more accurate. And check \`max_input_tokens\` from the Models API rather than hard-coding limits; the field is live and models differ.`,
  insight: 'Irrelevant context is not neutral padding — it is competition. Measure quality against a curated window before assuming a bigger one is better.',
  example: { label: 'Ask the API, do not hard-code', lang: 'python', code: `m = client.models.retrieve("claude-opus-5")
print(m.max_input_tokens)   # context window  (NOT m.context_window)
print(m.max_tokens)         # output cap
print(m.capabilities)

# Budget deliberately rather than filling the window:
#   system + standing instructions   ~2K   (cached, stable)
#   curated source files            ~40K   (the 4 that matter)
#   conversation                    ~20K   (compacted past this)
#   headroom for output             ~64K
# → ~126K of a 1M window, on purpose.` },
},
{
  id: 'c-cache', d: 'context', lvl: 3, title: 'Prompt Caching',
  tag: 'the highest-leverage free win', prereq: ['c-longctx'],
  hook: 'Reordering your request can cut its cost by an order of magnitude without changing a single word of it.',
  what: `Caching is a **prefix match**. The request renders in a fixed order — \`tools\` → \`system\` → \`messages\` — and any byte that changes anywhere in the prefix invalidates everything after it. That single sentence explains nearly every caching bug.

So the layout rule is: stable content first, volatile content last. Frozen system prompt, deterministic tool list, immutable documents at the front; timestamps, request IDs, and the user's actual question after the final \`cache_control\` breakpoint. You get at most 4 breakpoints per request, and the minimum cacheable prefix is model-dependent (512-4096 tokens) — shorter prefixes silently do not cache at all, with no error to tell you.

Verify, always, with \`usage.cache_read_input_tokens\`. If it is zero across repeated similar requests, something is silently invalidating: \`datetime.now()\` in the system prompt, a dict serialised in non-deterministic key order, a tool list built by iterating a set, a per-request user ID injected at the top.

The mid-conversation trap has a clean fix: to add an operator instruction partway through a conversation, append \`{"role": "system", ...}\` to \`messages[]\` rather than editing the top-level \`system\` field. Editing \`system\` invalidates the entire cached history. (Available on Opus 5, Opus 4.8, Fable 5 and Mythos 5 — not Sonnet 5 — with no beta header.) It is also the injection-safe operator channel.`,
  insight: 'Caches are model-scoped and effort-scoped. A multi-model cost cascade forfeits cache reuse across its models, and changing effort mid-conversation invalidates the message cache.',
  example: { label: 'Stable prefix, volatile tail', lang: 'python', code: `client.messages.create(
    model="claude-opus-5", max_tokens=8000,
    tools=TOOLS,                      # ← sorted, deterministic order
    system=[
        {"type": "text", "text": STANDING_INSTRUCTIONS},   # frozen
        {"type": "text", "text": CODEBASE_MAP,
         "cache_control": {"type": "ephemeral"}},          # breakpoint
    ],
    messages=[
        *history,
        {"role": "user", "content": question},  # volatile — after it
    ],
)

assert resp.usage.cache_read_input_tokens > 0, "silent invalidator!"

# ✗ f"Today is {datetime.now()}"  in system → 0% hit rate, forever.` },
},
{
  id: 'c-editing', d: 'context', lvl: 4, title: 'Context Editing & Compaction',
  tag: 'clear vs. summarise', prereq: ['c-cache'],
  hook: 'Two features, two different verbs, and using the wrong one quietly destroys the state your agent needs.',
  what: `These are constantly conflated and they do opposite things.

**Context editing** *clears*. With beta \`context-management-2025-06-27\` you pass \`context_management.edits\` with a strategy: \`clear_tool_uses_20250919\` drops old tool results (optionally their inputs too, with \`clear_tool_inputs\`), and \`clear_thinking_20251015\` drops thinking blocks. Nothing is preserved — the content is gone. That is exactly right for a 40-turn agent loop where turn 3's directory listing is dead weight, and exactly wrong if turn 3 held a decision.

**Compaction** *summarises*. With beta \`compact-2026-01-12\` the API automatically condenses earlier context as you approach a threshold (default 150K tokens). Available on Fable 5, Opus 5/4.8/4.7/4.6, Sonnet 5 and Sonnet 4.6.

Compaction has one critical implementation rule that causes silent, baffling failures: **append \`response.content\` — the whole thing — back to your messages every turn, not just the extracted text**. Compaction blocks live in that content and the API uses them to replace the compacted history on the next request. Pull out only the text string and you lose the compaction state without any error.

Do not mix the names: \`compact_20260112\` is compaction and does not belong in \`context_management.edits\`.`,
  insight: 'Clear tool results, summarise reasoning, and persist decisions to memory. Those are three different tools for three different kinds of history.',
  example: { label: 'Clearing tool noise in a long loop', lang: 'python', code: `resp = client.beta.messages.create(
    model="claude-opus-5", max_tokens=16000,
    betas=["context-management-2025-06-27"],
    context_management={"edits": [
        {"type": "clear_tool_uses_20250919", "clear_tool_inputs": True},
    ]},
    tools=TOOLS, messages=msgs,
)

# Compaction is a DIFFERENT beta — and this line is the one that
# breaks people:
messages.append({"role": "assistant", "content": resp.content})
#                                                 ^^^^^^^^^^^^
# not resp.content[0].text — compaction blocks live in there.` },
},
{
  id: 'c-retrieval', d: 'context', lvl: 4, title: 'Retrieval vs. Context',
  tag: 'the architecture decision', prereq: ['c-editing'],
  hook: 'With a 1M window, the question stopped being "how do I chunk this?" and became "do I need a retrieval system at all?"',
  what: `The honest current answer: for most corpora under a few hundred thousand tokens, a vector database is now optional infrastructure that you may be maintaining out of habit. Loading the relevant documents directly is simpler, more accurate, and often cheaper once caching is in play — a cached 100K-token corpus costs a fraction of its first read on every subsequent request.

Retrieval still wins decisively in three cases. **Scale**: corpora far beyond the window, where nothing fits. **Freshness**: content that changes faster than you would want to re-cache. **Access control**: when different users must see different subsets, retrieval is where you enforce that boundary — you cannot filter a context window per-user after the fact.

There is a strong middle path that is underused: retrieve *coarsely* and let the long window do the fine-grained work. Instead of returning 8 tightly-scoped 500-token chunks, return the 5 whole documents that matter and let the model read them. Chunk-boundary errors — the answer split across two chunks, the definition separated from its use — disappear entirely, and the model sees enough surrounding material to notice when a passage is qualified elsewhere.

Whatever you choose, keep provenance. Combine retrieval with citations so the answer stays checkable, and so a retrieval failure looks like a missing citation rather than a confident invention.`,
  insight: 'Retrieve documents, not fragments. Coarse retrieval plus a long window beats fine chunking, and eliminates the chunk-boundary failure class outright.',
  example: { label: 'Coarse retrieval into a cached window', lang: 'python', code: `# ✗ classic RAG: 8 × 500-token fragments, boundaries cut mid-clause
# ✓ coarse: pick whole documents, let the window do comprehension

doc_ids = bm25_top_k(query, k=5)          # cheap, whole documents
docs    = [store.get(i) for i in doc_ids]  # ~60K tokens total

client.messages.create(
    model="claude-opus-5", max_tokens=8000,
    system=[{"type": "text", "text": render(docs),
             "cache_control": {"type": "ephemeral"}}],  # reused across
    messages=[{"role": "user", "content": query}],      # follow-ups
)
# Second question over the same 5 docs is a cache read, not a re-read.` },
},

// ── CODE & ENGINEERING ──────────────────────────────────────────────────────
{
  id: 'k-cli', d: 'code', lvl: 1, title: 'Claude Code',
  tag: 'the agent in your repo', prereq: [],
  hook: 'The difference between a chat window and Claude Code is that one of them can run the test suite and read the failure.',
  what: `Claude Code is an agentic coding tool that runs where your code lives — terminal, desktop app, web (claude.ai/code), and IDE extensions for VS Code and JetBrains. It reads files, edits them, runs commands, searches the tree, and iterates against real output rather than against your description of the output.

That feedback loop is the whole point. A chat assistant proposes a change and you find out it was wrong. Claude Code proposes a change, runs the tests, sees the stack trace, and fixes it before you ever look. The unit of work shifts from "a suggested patch" to "a verified change."

The starting posture that works: point it at a real, bounded task with a checkable outcome. "Make \`test_auth.py::test_refresh\` pass" is a good first task because success is unambiguous. "Refactor the auth module" is a poor one, because neither of you can tell when it is done.

The surfaces share one session model, which matters more than it sounds. A session started on the web can be picked up elsewhere; work can move to the background and be re-attached with \`claude attach <id>\`; and remote sessions run in an ephemeral cloud container where the repo is cloned fresh — so anything worth keeping must be committed and pushed before the container is reclaimed.`,
  insight: 'Give it a task with a machine-checkable definition of done. The agent loop is only as good as the signal it can iterate against.',
  example: { label: 'Tasks framed for an agent loop', lang: 'bash', code: `# ✗ no stopping condition — it will stop somewhere arbitrary
claude "clean up the auth module"

# ✓ a signal it can iterate against
claude "make 'pnpm vitest run src/auth' pass. Do not change the
        tests. If a test looks wrong, stop and tell me instead."

# resume a long-running background session later
claude attach sess_01H...` },
},
{
  id: 'k-claudemd', d: 'code', lvl: 1, title: 'CLAUDE.md',
  tag: 'repo memory that ships', prereq: ['k-cli'],
  hook: 'The file where you write down the thing you have now explained to three different people.',
  what: `\`CLAUDE.md\` is loaded automatically into Claude Code sessions in that repository. Because it is committed, it is the one form of AI configuration that travels with the project, gets code-reviewed, and improves through pull requests like anything else.

Its value is inversely proportional to how much of it Claude could have worked out alone. A description of your directory layout is wasted — the agent can look. What is genuinely unavailable to it: the build step that is not in \`package.json\`, the test that is flaky for a known infrastructural reason, the "obvious" refactor that was tried in 2024 and reverted, the internal helper that supersedes the standard library one.

Nest it. A root \`CLAUDE.md\` for repo-wide conventions, and a \`packages/api/CLAUDE.md\` for that package's peculiarities, keeps each file short and loads the specific rules only when relevant.

Treat it as a living record of corrections. The best maintenance loop is: whenever you correct Claude on something it could not have known, that correction goes in the file. After a month of that, the file is a genuinely valuable artifact for human onboarding too — which is the tell that you wrote it right.

Run \`/init\` to bootstrap one from an existing codebase, then prune hard.`,
  insight: 'Write down what the repo cannot tell you: reverted decisions, known flakes, undocumented build steps. Everything else is a re-implementation of `ls`.',
  example: { label: 'Nested, and mostly about history', lang: 'text', code: `# packages/api/CLAUDE.md

## Do not
- Do not switch \`serialize()\` to \`orjson\`. Tried in #4412 —
  it reorders keys and breaks the signed-payload check.
- Do not add retries in \`client.py\`; the gateway already retries
  and doubling it caused the Feb incident.

## Known flakes
- \`test_websocket_reconnect\` fails ~1/20 on CI runners with
  <2 cores. Re-run once before investigating.

## Undocumented
- \`make proto\` must run before tests after ANY .proto change.
  Nothing enforces this and the failure looks unrelated.` },
},
{
  id: 'k-permissions', d: 'code', lvl: 2, title: 'Permissions & Sandboxing',
  tag: 'autonomy you can bound', prereq: ['k-claudemd'],
  hook: 'The right question is not "should the agent be allowed to run commands" but "which commands, and what happens on the ones you did not think of".',
  what: `Claude Code gates tool use behind permission modes, from prompting on every action through to broadly autonomous operation, with an allowlist in \`settings.json\` for the calls you have decided are safe. The productive setup is not maximum restriction — it is a well-chosen allowlist that eliminates prompt fatigue on read-only operations so that the prompts you *do* get carry signal.

The specific failure to design against is habituation. If the agent asks permission forty times an hour for \`git status\` and \`ls\`, you will start approving reflexively, and the one prompt that mattered gets approved the same way. Allowlist the boring reads; keep the confirmations for writes, network calls, and anything destructive.

Settings are layered — user, project, and managed/enterprise — with managed settings able to constrain what lower scopes may enable. That layering is what makes agent autonomy defensible in an organisation: an individual cannot widen a boundary the org has set.

Sandboxing is the second axis and it is real isolation, not just prompting. Remote and background sessions run in ephemeral containers whose network egress follows the environment's policy. Worth knowing: file tools resolve symlinks *before* the permission check now, and grep/glob deny rules apply through symlinked search paths — both were hardened specifically because a symlink swapped inside the working directory could otherwise reach outside the approved location.`,
  insight: 'Allowlist the noise so the prompts keep meaning something. Habituated approval is a worse security posture than a well-chosen allowlist.',
  example: { label: 'Project settings that reduce prompt fatigue', lang: 'json', code: `{
  "permissions": {
    "allow": [
      "Bash(git status)", "Bash(git diff:*)", "Bash(git log:*)",
      "Bash(pnpm vitest run:*)",
      "Bash(rg:*)", "Read(src/**)"
    ],
    "deny": [
      "Read(.env)", "Read(**/*.pem)", "Read(secrets/**)",
      "Bash(git push:*)"
    ]
  }
}
// Reads are free and silent. Pushes still stop and ask —
// so when it asks, you actually read the prompt.` },
},
{
  id: 'k-slash', d: 'code', lvl: 2, title: 'Slash Commands & Output Styles',
  tag: 'your workflow, named', prereq: ['k-permissions'],
  hook: 'The prompt you retype every Friday should have a name and live in the repo.',
  what: `A slash command is a markdown file in \`.claude/commands/\` that becomes \`/your-command\`. That is the whole mechanism, and its modesty is the point: a repeated multi-paragraph prompt becomes a versioned, reviewable, shareable artifact that a new teammate gets for free on clone.

Good candidates are the prompts with real structure that you get subtly wrong when retyping — the release checklist, the incident write-up format, the "prepare this branch for review" sequence. They accept arguments, so \`/triage 4471\` can pull in the issue and apply your team's actual triage rubric rather than a generic one.

Output styles are the complementary axis: they change the *register* of a session rather than its task. An explanatory style that narrates reasoning is right when you are learning an unfamiliar codebase; a terse style that just does the work is right when you know exactly what you want. Both are wrong in the other situation, which is why it is a setting rather than a default.

The progression here is the same one that leads to Skills and Plugins: notice a repeated pattern, name it, put it in the repo, and it stops being tribal knowledge. A slash command is the smallest possible version of that move, which makes it the right first one.`,
  insight: 'The best slash commands encode a sequence you get wrong from memory — not a prompt you could type from scratch just as well.',
  example: { label: '.claude/commands/triage.md', lang: 'text', code: `---
description: Triage an issue against our severity rubric
---

Read issue #$1 with the GitHub tools.

Classify it using ONLY these severities:
  S1 data loss or auth bypass
  S2 core flow broken, no workaround
  S3 broken with a workaround
  S4 cosmetic

Then output, in this order:
1. Severity + the single sentence that decided it
2. The smallest reproduction you can construct from the report
3. What information is MISSING to reproduce it (or "none")
4. Which of us owns it, per CODEOWNERS

Do not propose a fix. Triage only.` },
},
{
  id: 'k-skills', d: 'code', lvl: 3, title: 'Skills',
  tag: 'expertise loaded on demand', prereq: ['k-slash', 'r-ask'],
  hook: 'A skill is the difference between an assistant that knows about your domain and one that knows your domain.',
  what: `A Skill is a folder containing a \`SKILL.md\` plus optional scripts and assets. Claude loads it **on demand**, when its description matches the task at hand — which is the architectural insight that makes the format work. Ten thousand words of specialist procedure cost nothing until the moment they are relevant, so you can ship deep expertise without paying for it on every unrelated request.

That makes the \`description\` field the most important line in the file. It is the retrieval key: it decides whether the skill fires at all. Descriptions that enumerate concrete triggers ("use when the user mentions .docx, Word documents, or asks for a formatted report") vastly outperform abstract ones ("helps with documents"). A brilliant skill with a vague description is a skill that never runs.

Skills can bundle executable scripts, which is what separates them from long prompts. A document-generation skill ships the library code that actually produces the file; a review skill ships the checklist *and* the linter that enforces the mechanical half of it. The model handles judgement, the scripts handle determinism, and the split is explicit.

They compose across the ecosystem: the same folder format works in Claude Code, ships inside plugins, and runs on the API through \`container.skills\` with the code execution tool. Write once, run on every surface.`,
  insight: 'Optimise the description for retrieval, not for elegance. List the literal words a user would say — that field is a matcher, not a summary.',
  example: { label: 'SKILL.md — trigger-rich frontmatter', lang: 'text', code: `---
name: incident-report
description: >
  Write or review a postmortem / incident report / RCA. Use when the
  user mentions postmortem, incident review, RCA, outage write-up,
  SEV-1/SEV-2, or asks "what do we tell customers about the outage".
  Enforces our blameless format and the 5-whys depth check.
---

# Incident reports

## Required sections (in order)
1. Customer impact — duration, scope, in customer-visible terms
2. Timeline — UTC, detection → mitigation → resolution
...

## Mechanical checks
Run \`scripts/lint_report.py <file>\` — it verifies every "why" has
a verifiable cause, and rejects passive-voice blame attribution.` },
},
{
  id: 'k-hooks', d: 'code', lvl: 3, title: 'Hooks',
  tag: 'determinism around a probabilistic core', prereq: ['k-skills'],
  hook: 'Instructions ask. Hooks enforce. When something must happen every single time, it cannot be a sentence in a prompt.',
  what: `Hooks run your own commands on session and tool lifecycle events — around tool use, on notifications, at session start, on compaction, and (recently) on model switches via \`PreModelSwitch\`/\`PostModelSwitch\`, which can block, confirm, or annotate the switch. Because they are shell commands with exit codes, they are deterministic: a \`PreToolUse\` hook that exits non-zero *blocks the call*. No amount of persuasion in the transcript gets around it.

That distinction is the whole design principle. "Please run the formatter after editing" is a request the model will usually honour. A \`PostToolUse\` hook that runs the formatter is a guarantee. Anything with a compliance, safety, or correctness requirement belongs in the second category — not because the model is unreliable, but because "usually" is not a security property.

The highest-value hooks in practice are unglamorous: format on write, block edits to generated directories, run the type-checker after a batch of changes and feed failures straight back into the conversation, log every tool call for audit. That last one turns an agent session into something you can actually review after the fact.

\`SessionStart\` is the one most teams miss. It is where you make an ephemeral environment usable — install dependencies, start the database, seed fixtures — so a fresh cloud session can run the tests on its first turn instead of its tenth.`,
  insight: 'If a rule matters, a non-zero exit code enforces it and a paragraph does not. Hooks are where "should" becomes "will".',
  example: { label: '.claude/settings.json — enforce, do not ask', lang: 'json', code: `{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{ "type": "command",
                  "command": "pnpm biome format --write \\"$FILE\\"" }]
    }],
    "PreToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{ "type": "command",
                  "command": ".claude/deny-generated.sh \\"$FILE\\"" }]
    }],
    "SessionStart": [{
      "hooks": [{ "type": "command", "command": "pnpm i && docker compose up -d db" }]
    }]
  }
}
// deny-generated.sh exits 1 for src/generated/** → the edit is BLOCKED.` },
},
{
  id: 'k-plugins', d: 'code', lvl: 4, title: 'Plugins & Marketplaces',
  tag: 'ship your setup to everyone', prereq: ['k-hooks'],
  hook: 'The point at which your personal configuration becomes your organisation\'s baseline.',
  what: `A plugin is a versioned bundle that ships skills, subagents, slash commands, hooks, output styles, and MCP server definitions together as one installable unit. It is the packaging layer for everything on this branch of the web, and it exists because those pieces are usually only useful together — a review skill needs its lint hook and its MCP connection to the issue tracker, or it is half a workflow.

Marketplaces distribute them. A team marketplace means a new engineer clones the repo, installs one plugin, and inherits the accumulated tooling of everyone who came before instead of rediscovering it. That is the real return: not the individual components, but the elimination of per-person setup drift.

Versioning is the part that turns this from convenience into infrastructure. A plugin has a version, so you can pin it, upgrade deliberately, and roll back when a new skill starts misfiring — the same lifecycle you already have for libraries, applied to agent configuration.

Security is a real consideration and has been treated as one: plugin commands declared in a marketplace entry can no longer point outside the plugin directory — such paths are rejected as path traversal. Treat installing a third-party plugin with the same seriousness as adding a dependency, because that is exactly what it is: code and instructions that will run in your repository with your permissions.`,
  insight: 'Bundle the pieces that are useless apart. A skill without its enforcing hook is advice; with it, it is a workflow.',
  example: { label: 'Plugin layout', lang: 'text', code: `my-team-plugin/
├── .claude-plugin/plugin.json     # name, version, description
├── skills/
│   ├── incident-report/SKILL.md
│   └── api-review/SKILL.md
├── commands/
│   ├── triage.md
│   └── release.md
├── agents/
│   └── security-reviewer.md       # a subagent definition
├── hooks/hooks.json               # format-on-write, deny generated
└── .mcp.json                      # our Jira + Grafana servers

# One install; a new hire gets the whole workflow, pinned to a version.` },
},
{
  id: 'k-review', d: 'code', lvl: 4, title: 'Review & Security Review',
  tag: 'the tireless first pass', prereq: ['k-plugins', 'r-critique'],
  hook: 'Not a replacement for human review — a way to make sure humans spend their attention on the parts that need a human.',
  what: `Automated review works because the failure modes are complementary. Humans miss mechanical things at scale — the unhandled error path on line 340 of a 900-line diff, the third place a pattern was copied — and are irreplaceable at intent, architecture, and "this is technically fine but we will regret it." Point the model at the first category and the humans get their attention back for the second.

The quality of a review is set by the *specificity* of what you ask for. "Review this PR" yields a summary. Effort-scaled, targeted review — correctness bugs with a concrete failure scenario, reuse and simplification opportunities, missing test coverage — yields findings you can act on. Requiring a failure scenario for every claimed bug is the single best filter: a "bug" whose author cannot describe inputs that trigger it is usually a false positive, and demanding that description makes the model discard its own weak findings before you ever see them.

Security review is a distinct pass, not a section of the general one. It looks for a different catalogue — injection, authz gaps, unsafe deserialisation, secret handling, path traversal — and it should run adversarially, assuming the input is hostile rather than merely malformed.

The operational trick is placement. Review at the point of *authoring*, in the branch, before the PR exists. Findings there cost minutes; the same findings after review has started cost a round trip and someone else's context switch.`,
  insight: 'Require a concrete failure scenario for every finding. It is the cheapest false-positive filter there is, and the model applies it to itself.',
  example: { label: 'A review request that produces findings', lang: 'bash', code: `claude "Review the diff against origin/main at high effort.

For each finding give exactly:
  file:line · one-sentence defect
  · FAILURE SCENARIO: concrete inputs/state → wrong output or crash

Discard anything where you cannot write that scenario.
Rank most-severe first. Ignore style — the formatter owns that.

Then, separately: any input in this diff that reaches a shell,
a SQL string, a file path, or a deserialiser without validation."` },
},
{
  id: 'k-remote', d: 'code', lvl: 5, title: 'Remote, Background & Parallel Sessions',
  tag: 'work that continues without you', prereq: ['k-review'],
  hook: 'Once a session no longer needs your terminal open, the constraint on throughput stops being Claude and becomes how many tasks you can specify.',
  what: `Claude Code sessions can run in the background, in the cloud, and in parallel. Background sessions detach from the terminal and are re-attached later with \`claude attach <id>\`, with \`logs\`, \`stop\`, \`respawn\` and \`rm\` for lifecycle. Remote sessions run in an ephemeral managed container, started from the web or an integration, with the repository cloned fresh and network egress governed by the environment's policy. Git worktrees let several sessions work the same repository on different branches without fighting over the working tree.

The shift is from *supervision* to *specification*. When you are watching, an underspecified task is fine — you course-correct. When four sessions run unattended, the specification is all they have, and any ambiguity becomes four divergent interpretations you discover an hour later. Everything in the Reasoning discipline gets more valuable exactly here.

Match the parallelism to the coupling. Independent tasks — a dependency bump, a flaky test, a docs pass — parallelise cleanly. Tasks touching the same modules produce conflicting diffs that cost more to reconcile than sequential work would have cost.

Two operational realities of the ephemeral container: writable disk is a fixed per-session allowance (so "no space left on device" means the allowance is spent, and deleting build artifacts genuinely frees it), and anything not committed and pushed is gone when the container is reclaimed.`,
  insight: 'Parallelism is bounded by task independence, not by session count. Four agents on one module is a merge conflict with extra steps.',
  example: { label: 'Fan out over independent work', lang: 'bash', code: `# separate worktrees → no shared working tree, no collisions
git worktree add ../wt-deps  -b chore/deps
git worktree add ../wt-flake -b fix/flaky-ws

(cd ../wt-deps  && claude --background \\
   "Bump minor+patch deps. Run the full suite. If any test fails,
    revert THAT dep only and note why in the commit body.")

(cd ../wt-flake && claude --background \\
   "test_websocket_reconnect fails ~1/20. Find the race. Do not add
    sleeps or retries — fix the synchronisation or explain why not.")

claude logs   sess_01H...      # check in
claude attach sess_01H...      # take over` },
},

// ── AGENTS & AUTOMATION ─────────────────────────────────────────────────────
{
  id: 'a-tools', d: 'agents', lvl: 1, title: 'Tool Use',
  tag: 'the model asks, your code answers', prereq: [],
  hook: 'Tool use is the moment Claude stops describing what it would do and starts asking you to do it.',
  what: `You declare tools with a name, a description, and a JSON input schema. The model responds with \`stop_reason: "tool_use"\` and a \`tool_use\` block; you execute the function; you send back a \`tool_result\` and loop. Everything agentic is built on this one exchange.

The description is where quality is decided, and it is consistently under-invested. It is not documentation for a human who has other ways to find out — it is the *only* thing the model knows about when to reach for that tool. State what it does, when to use it, when explicitly *not* to, and what the result looks like. A tool called \`search\` with the description "searches" will be called constantly and wrongly.

Parallel tool use is on by default: one assistant message may contain several \`tool_use\` blocks. Execute them concurrently, then return **all** the \`tool_result\` blocks in a **single** user message. Splitting results across multiple messages silently teaches the model to stop making parallel calls at all — a quiet performance regression with no error attached. Failed tools still need a result, with \`is_error: true\`; dropping one leaves a dangling call.

For guaranteed-valid inputs, set \`strict: true\` at the top level of the tool definition (not on \`tool_choice\`), with \`additionalProperties: false\` and \`required\` in the schema. And always parse inputs with \`json.loads\`/\`JSON.parse\` — never string-match the serialised form; escaping varies across models.`,
  insight: 'Return every parallel tool_result in ONE user message. Splitting them trains the model out of parallelism, with no error to tell you.',
  example: { label: 'A description that governs behaviour', lang: 'python', code: `{
  "name": "query_orders",
  "description": (
      "Run a read-only SQL SELECT against the orders replica. "
      "USE FOR: order counts, revenue, per-customer history. "
      "DO NOT USE FOR: writes, schema questions, or anything about "
      "users — call query_users for those. "
      "Returns at most 500 rows as JSON; a truncated flag is set "
      "when the result was capped, and you should then narrow the "
      "query rather than paginate."
  ),
  "strict": True,
  "input_schema": {
      "type": "object",
      "properties": {"sql": {"type": "string"}},
      "required": ["sql"],
      "additionalProperties": False,
  },
}` },
},
{
  id: 'a-servertools', d: 'agents', lvl: 2, title: 'Server Tools',
  tag: 'capability with no loop to write', prereq: ['a-tools'],
  hook: 'Web search, web fetch and code execution run on Anthropic\'s infrastructure — you declare them and read the results out of the same response.',
  what: `Server tools need no client-side execution loop. You put them in \`tools\` and the results come back as content blocks in the same response.

Prefer the newest type variant your model supports. Web search is \`web_search_20260209\` and web fetch is \`web_fetch_20260209\` — both with built-in dynamic filtering — on Opus 5/4.8/4.7/4.6, Sonnet 5 and Sonnet 4.6. Older models take the basic \`web_search_20250305\` / \`web_fetch_20250910\`; on Vertex AI only basic web search is available and web fetch is not offered at all. A specific trap: the \`_20260209\` variants run code execution under the hood, so do **not** separately declare \`code_execution\` alongside them — a second execution environment confuses the model.

Code execution (\`code_execution_20260521\`) gives Claude a real Python sandbox, which is how it does arithmetic that is actually correct, parses a real CSV, and generates files. The sandbox ships \`python-docx\`, \`python-pptx\`, \`matplotlib\`, \`pillow\` and \`pypdf\`, so "produce a report" can mean a real DOCX or chart returned through the Files API rather than text describing one. Note the result block is \`bash_code_execution_tool_result\` with \`.content.stdout\` — not the legacy bare type.

The error model catches everyone once: **server tool errors do not raise**. They return HTTP 200 with a result block whose \`content\` is an error object like \`{error_code: "max_uses_exceeded"}\`. For web search, success \`content\` is a *list* and error \`content\` is an *object* — branch on that before indexing.`,
  insight: 'Web fetch only retrieves URLs already present in the conversation. It cannot discover a link; pair it with search.',
  example: { label: 'Search + fetch, with the error branch', lang: 'python', code: `resp = client.messages.create(
    model="claude-opus-5", max_tokens=8000,
    tools=[
        {"type": "web_search_20260209", "name": "web_search",
         "max_uses": 5, "allowed_domains": ["docs.claude.com"]},
        {"type": "web_fetch_20260209", "name": "web_fetch",
         "max_uses": 3, "citations": {"enabled": True}},
    ],
    messages=[{"role": "user", "content": "What changed in the API this month?"}],
)

for b in resp.content:
    if b.type == "web_search_tool_result":
        if isinstance(b.content, list):        # success → list
            for r in b.content: print(r.title, r.url)
        else:                                   # error → object, HTTP 200
            print("search failed:", b.content.error_code)` },
},
{
  id: 'a-mcp', d: 'agents', lvl: 2, title: 'MCP',
  tag: 'one protocol, every integration', prereq: ['a-tools'],
  hook: 'Write the connector once and it works in Claude Code, the desktop app, the API, and every other MCP client — including ones that do not exist yet.',
  what: `The Model Context Protocol is an open standard for exposing tools, resources and prompts to language models. Its value is combinatorial: without it, N tools × M clients means N×M bespoke integrations. With it, a server you write for your internal deploy system works in every MCP-speaking client, and every MCP server anyone else wrote works in yours.

In Claude Code, servers are configured in \`.mcp.json\` — committed, so the whole team gets the same connections. On the API, the connector needs **both halves** or it fails validation: \`mcp_servers=[{type: "url", url, name}]\` *and* a matching \`tools=[{type: "mcp_toolset", mcp_server_name: <same name>}]\`, with beta \`mcp-client-2025-11-20\`. Passing only the server list is a validation error, and it is the most common first mistake.

Design servers around *tasks*, not around your REST endpoints. A thin proxy that exposes 40 CRUD operations forces the model to compose them and gets it wrong. Three well-named task-level tools — \`find_customer\`, \`summarize_account_health\`, \`open_refund_case\` — outperform it substantially, because each maps to something a user actually wants.

When a server exposes many tools, use tool search (\`tool_search_tool_regex_20251119\` or the BM25 variant) with \`defer_loading: true\` on the bulk of them, so definitions load on demand instead of consuming context up front. One rule: the search tool itself must not be deferred, and at least one tool must be non-deferred, or you get a 400.

Treat third-party servers as dependencies with real trust implications — their tool descriptions enter your model's context and can attempt to steer it.`,
  insight: 'Model tools on user intentions, not on your API surface. Forty CRUD endpoints is a worse tool surface than three task-shaped ones.',
  example: { label: 'Both halves, or a validation error', lang: 'python', code: `client.beta.messages.create(
    model="claude-opus-5", max_tokens=8000,
    betas=["mcp-client-2025-11-20"],
    mcp_servers=[{"type": "url", "url": "https://mcp.internal/deploy",
                  "name": "deploy"}],
    tools=[{"type": "mcp_toolset",
            "mcp_server_name": "deploy"}],      # ← required second half
    messages=msgs,
)

# .mcp.json in the repo — everyone gets the same connections:
# { "mcpServers": {
#     "grafana": { "command": "npx", "args": ["-y", "@org/grafana-mcp"] }
#   } }` },
},
{
  id: 'a-subagents', d: 'agents', lvl: 3, title: 'Subagents',
  tag: 'context isolation as a design tool', prereq: ['a-mcp', 'k-cli'],
  hook: 'The real product of a subagent is not parallelism — it is that the mess stays in someone else\'s context window.',
  what: `A subagent is a forked Claude instance with its own context window, its own tool set, and often its own model and effort level. It does a job and returns a conclusion; the intermediate reading, the false starts, the eighty files it grepped, never enter the parent's context.

That is the main event. A search across a large repository might read 200K tokens to answer one question. Done inline, the parent now carries all of it forever, at cost, on every subsequent turn, competing for attention. Done in a subagent, the parent receives three sentences. Delegate the work whose *byproduct* is context pollution, not merely the work that is slow.

Give each subagent a narrow charter and the minimum tools for it. A read-only explorer with no write tools cannot damage anything, which means you can run several without supervising any. Match model and effort to the job: \`low\` effort on a cheap model for mechanical search is not a downgrade, it is correct sizing — and lower effort also means less preamble and fewer scattered tool calls.

The cost is real: a subagent starts cold. It re-derives context the parent already has, so a task needing deep shared state is usually worse delegated than done inline. The heuristic that holds: delegate when the *output* is small and the *reading* is large.`,
  insight: 'Delegate by information ratio: large input, small output is the ideal subagent task. Small input, large output should stay inline.',
  example: { label: 'A read-only explorer that returns a conclusion', lang: 'text', code: `---
name: dependency-tracer
description: Trace every call site of a symbol across the monorepo
tools: Read, Grep, Glob          # no Write, no Bash — cannot break things
model: sonnet
---

You trace symbol usage. You do NOT modify code.

Search exhaustively — direct calls, re-exports, dynamic access by
string name, and test files.

Return ONLY:
  · a table: file:line → call context (one phrase)
  · call sites whose behaviour would CHANGE if the signature changed
  · anything you could not resolve statically, listed explicitly

Do not paste file contents. The caller has a budget; you are spending it.` },
},
{
  id: 'a-runner', d: 'agents', lvl: 3, title: 'The Agent Loop & Tool Runner',
  tag: 'own the loop, or do not', prereq: ['a-subagents'],
  hook: 'Every agent framework is, underneath, a while-loop over one API call. Knowing that tells you when you need a framework.',
  what: `The manual loop is nine lines: send messages, check \`stop_reason == "tool_use"\`, execute the requested tools, append the results, repeat until the model stops asking. Write it once by hand. Everything marketed as an agent framework is a wrapper around it, and you cannot evaluate the wrappers without knowing the shape of the thing being wrapped.

The SDK's **Tool Runner** (\`client.beta.messages.tool_runner\` with \`@beta_tool\` in Python or \`betaZodTool\` in TypeScript) drives that loop for you over tools *you* define. It is the right default for custom-tool agents: you write the functions, it handles the cycle. Crucially it keeps per-turn hooks, so you still get approval gates, error interception, result modification (adding \`cache_control\`, for instance), retries and compaction — you are not trading control for convenience.

Know the four options and what each one supplies, because two independent questions separate them: who provides the *harness*, and who provides the *deployment*. Manual loop: neither. Tool Runner: harness only, you host. **Claude Agent SDK**: a much bigger harness — Claude Code as a library, with built-in file/bash/search tools — still hosted by you. **Managed Agents**: harness *and* hosting.

The name collision is worth pinning down: Tool Runner is part of the regular Anthropic SDK and has no built-in tools; the Claude Agent SDK is a separate package with the whole Claude Code toolset. They are not substitutes.`,
  insight: 'Harness and deployment are separate questions. Manual loop supplies neither; Tool Runner and the Agent SDK supply a harness; only Managed Agents supplies both.',
  example: { label: 'The loop, then the runner that replaces it', lang: 'python', code: `# The whole thing, by hand — write this once so you know the shape:
while True:
    resp = client.messages.create(model="claude-opus-5", max_tokens=8000,
                                  tools=TOOLS, messages=msgs)
    msgs.append({"role": "assistant", "content": resp.content})
    if resp.stop_reason != "tool_use":
        break
    results = [                          # ALL results, ONE message
        {"type": "tool_result", "tool_use_id": b.id,
         "content": dispatch(b.name, b.input)}
        for b in resp.content if b.type == "tool_use"
    ]
    msgs.append({"role": "user", "content": results})

# Same loop, handled for you, hooks intact:
from anthropic import beta_tool

@beta_tool
def query_orders(sql: str) -> str:
    """Read-only SELECT against the orders replica."""
    return run_readonly(sql)

runner = client.beta.messages.tool_runner(
    model="claude-opus-5", max_tokens=8000,
    tools=[query_orders], messages=msgs)
final = runner.until_done()` },
},
{
  id: 'a-teams', d: 'agents', lvl: 4, title: 'Agent Teams & Orchestration',
  tag: 'many agents, one outcome', prereq: ['a-runner'],
  hook: 'Multi-agent systems fail at the seams, not at the nodes. The handoff is the hard part.',
  what: `Once you have subagents, the next step is several working toward one outcome — a lead that decomposes and delegates, workers that specialise, results that reconcile. Claude Code supports agent teams directly, and Managed Agents supports multiagent sessions where an agent delegates to copies of itself (\`{"type": "self"}\` in the roster) or to cheaper worker agents referenced by ID.

The failure mode is almost never a bad worker. It is the interface: the lead hands over an underspecified task, the worker interprets it reasonably but differently, and nothing detects the divergence until integration. The discipline that fixes it is exactly what fixes it between humans — the handoff must carry the *contract*, not just the goal: what to return, in what shape, what is explicitly out of scope, and what to do when blocked rather than guessing.

Fan out when sub-tasks are genuinely independent and reading-heavy — research across sources, per-file or per-record work, anything where one loop would fill its context just by reading. Move the reading-heavy sub-tasks to a cheaper worker (Haiku 4.5 is well-sized for this) and reserve the expensive model for the synthesis, where the judgement actually lives.

Resist orchestration for its own sake. Two agents with a clean contract beat six with fuzzy ones, every time. Each additional agent adds a handoff, and handoffs are where the information is lost.`,
  insight: 'Cost the coordination, not just the work. If specifying the handoff takes longer than doing the task, do the task.',
  example: { label: 'A handoff that carries a contract', lang: 'text', code: `TO: security-reviewer     (worker: haiku, effort low, read-only)

SCOPE      Only files changed in this branch vs origin/main.
           Do NOT review src/vendor/** — third party, out of scope.

FIND       Injection · authz gaps · unsafe deserialisation ·
           secrets in code · path traversal.
           NOT style, NOT performance, NOT test coverage.

RETURN     JSON array, most severe first. Each item:
           {file, line, class, failure_scenario, fix_sketch}
           Omit any finding you cannot write a failure_scenario for.

BLOCKED    If a file needs context outside SCOPE to judge, emit
           {"needs": "<path>", "why": "..."} — do NOT read it,
           and do NOT guess. The lead resolves it.

BUDGET     Return under 2000 tokens. Summarise; do not paste code.` },
},
{
  id: 'a-sdk', d: 'agents', lvl: 4, title: 'Claude Agent SDK',
  tag: 'Claude Code as a library', prereq: ['a-runner'],
  hook: 'When you want a coding agent inside your own product, and you would rather not rebuild file editing, permissions and context management.',
  what: `The Claude Agent SDK (\`claude-agent-sdk\` / \`@anthropic-ai/claude-agent-sdk\`) is Claude Code packaged as a library. It ships the full harness: built-in Read/Write/Edit/Bash/Glob/Grep/WebSearch/WebFetch tools, the agent loop, context management, hooks, subagents, permissions and sessions. You call \`query(prompt, options)\` and it drives everything.

Reach for it when your product needs an agent that operates on a filesystem and runs commands — a CI bot that fixes its own build, an internal tool that migrates services, a review system that reads a whole repository. Rebuilding that stack on raw tool use is months of work whose hard parts (permission modelling, context compaction, safe file editing) are exactly the parts that are easy to get subtly wrong.

Do not reach for it when your agent's tools are all API calls to your own services. There, the SDK's built-in filesystem tools are unused weight and the Tool Runner is a better fit.

The important boundary, again: the Agent SDK supplies a *harness*, not a deployment. You still host it, secure it, scale it, and decide where the code it runs is allowed to run. If you want Anthropic to host the loop and the sandbox too, that is Managed Agents. And note this is a genuinely different package from the API SDK's Tool Runner despite the similar-sounding name — they have separate documentation and are not interchangeable.`,
  insight: 'Choose it for filesystem-and-shell agents. If every tool is an HTTP call to your own backend, the built-in toolset is dead weight.',
  example: { label: 'A harness you host', lang: 'python', code: `from claude_agent_sdk import query, ClaudeAgentOptions

async for msg in query(
    prompt="The build fails on main. Find the cause and fix it. "
           "Do not touch CI config; if the fix requires that, "
           "stop and explain why.",
    options=ClaudeAgentOptions(
        cwd="/srv/checkout",
        allowed_tools=["Read", "Edit", "Bash", "Grep", "Glob"],
        permission_mode="acceptEdits",
        system_prompt="Never modify .github/**. Never push.",
    ),
):
    log(msg)

# Built-in file + shell tools, loop, permissions, compaction: included.
# Hosting, secrets, network policy, blast radius: still yours.` },
},
{
  id: 'a-managed', d: 'agents', lvl: 4, title: 'Managed Agents',
  tag: 'harness and hosting', prereq: ['a-sdk', 'c-memory'],
  hook: 'The only option where Anthropic runs the agent loop *and* hosts the container the tools execute in.',
  what: `Managed Agents is a distinct API surface. You create a persisted, versioned **Agent** config once (\`POST /v1/agents\` — or, better, as version-controlled YAML applied with the \`ant\` CLI), then start **Sessions** that reference it. Each session provisions a container as the agent's workspace: bash, file operations and code execution run there, while the loop itself runs on Anthropic's orchestration layer.

Get the split right or nothing works: \`model\`, \`system\` and \`tools\` live on the **agent**, never on the session. Agents are persistent objects — create once, store the ID, reference it forever. Calling \`agents.create()\` in your request path is the classic mistake; it creates a new agent per request and discards versioning entirely. The beta header is \`managed-agents-2026-04-01\`, set automatically by the SDKs.

What you get for that structure: sessions that outlive a request, file mounts, an SSE event stream, Skills and MCP, multiagent rosters, hard dollar-denominated **session budgets** (distinct from the advisory, token-denominated task budgets on the Messages API), and scheduled deployments.

Credentials have a first-class answer now: **vault \`environment_variable\` credentials** are stored by Anthropic and substituted at egress, so secrets never enter the sandbox at all. That supersedes the old pattern of keeping secrets host-side behind custom tools, which remains the fallback for self-hosted sandboxes.

One gotcha worth internalising: web search and web fetch run on Anthropic's servers and therefore **ignore the environment's \`networking\` setting**. Restrict them per-tool with \`allowed_domains\` or \`blocked_domains\` (never both).`,
  insight: 'Agent config is durable and versioned; sessions are disposable. Creating an agent per request throws away the entire point of the surface.',
  example: { label: 'Create once, reference forever', lang: 'python', code: `# ── control plane: ONCE (ideally YAML + the \`ant\` CLI) ──────────
agent = client.beta.agents.create(
    name="nightly-triage",
    model={"model": "claude-opus-5"},
    system="Triage yesterday's exceptions. Never modify production.",
    tools=[{"type": "bash"}, {"type": "mcp_toolset",
                              "mcp_server_name": "sentry"}],
)
store(agent.id)          # ← persist this. Never re-create per request.

# ── data plane: EVERY RUN ──────────────────────────────────────
session = client.beta.sessions.create(
    agent_id=load_agent_id(),           # no model/system/tools here
    budget={"type": "usd", "total": 5.00},   # hard, enforced cap
)` },
},
{
  id: 'a-scheduled', d: 'agents', lvl: 5, title: 'Scheduled & Autonomous Work',
  tag: 'agents that start themselves', prereq: ['a-managed', 'a-teams'],
  hook: 'The last constraint to fall is that a human has to be the one who presses go.',
  what: `Scheduled deployments fire Managed Agent sessions on a cron cadence, with per-firing run records and lifecycle controls (pause, unpause, archive). No client-side scheduler, no server you maintain to hold a crontab. In Claude Code, the equivalent is triggers and routines that resume a session, wake a named session, or spawn a fresh one per firing.

The design change is that nobody is watching. Every assumption you were making implicitly — that a human notices the weird output, that someone stops the loop when it thrashes, that a wrong turn gets caught in the next message — has to become an explicit mechanism. In practice: hard budget caps so a runaway loop is bounded in dollars, not in patience; structured output so results can be checked by a program rather than read by a person; explicit success and failure signals so a silent no-op is distinguishable from success; and a notification path that fires on *anomaly*, not on completion.

Choose the firing shape deliberately. A run that should build on history binds to a persistent session; a run that must start clean — the nightly report, the fresh audit — spawns a new session each time and needs a fully standalone prompt, because there is no prior conversation to lean on.

Start read-only. An autonomous agent that observes and reports for two weeks earns the right to act, and the report tells you exactly which actions you would have wanted it to take. That sequencing is not timidity; it is how you find out what the specification was actually missing.`,
  insight: 'The graduation path is observe → propose → act-with-approval → act. Skipping to the end means discovering your spec gaps in production.',
  example: { label: 'A nightly agent designed for nobody watching', lang: 'text', code: `Schedule   0 6 * * 1-5   (UTC — convert from local first)
Shape      fresh session per firing → prompt must be standalone
Budget     hard cap $3.00/run  (enforced, not advisory)

PROMPT
  Read yesterday's error-rate dashboard via the Grafana MCP server.
  Compare against the trailing 14-day baseline.

  Emit JSON only:
    { "status": "ok" | "anomaly" | "insufficient_data",
      "findings": [ {metric, baseline, observed, z, likely_cause} ],
      "confidence": 0.0-1.0 }

  Take NO action. Open no tickets. Change nothing.

NOTIFY  only when status != "ok"  — a green run is silent, so a
        notification always means something.
ESCALATE if confidence < 0.6 → route to a human, do not guess.` },
},

// ── CREATION & CRAFT ────────────────────────────────────────────────────────
{
  id: 'f-artifacts', d: 'craft', lvl: 1, title: 'Artifacts',
  tag: 'output with a URL', prereq: [],
  hook: 'The gap between "Claude explained it to me" and "I sent the team a link" is one tool call wide.',
  what: `An artifact is a rendered, hosted page — an app, a document, a dashboard, a game — that lives at its own URL instead of scrolling away in a transcript. It starts private and the author decides whether to share it, which is what makes publishing a reasonable default for your own work product rather than an act of exposure.

The mental shift is about *deliverables*. Analysis that stays in a conversation has to be re-explained to everyone who needs it. The same analysis as a page can be sent, bookmarked, revisited and commented on. A report, a plan other people will follow, a reference doc, the case for a decision — none of those are finished while they exist only in scrollback.

Mechanically: each artifact is served from its own origin, so its \`localStorage\` is private to it and survives republishing to the same URL. Republishing the same file path updates in place and keeps the link stable, which means an artifact is a living document rather than a snapshot — you can iterate on it for weeks without anyone's bookmark breaking.

The constraints are worth knowing before you design: external scripts load only from an allowlist of CDNs, stylesheets only from Google Fonts, and everything else — images, fetches, other hosts — must be inlined or embedded as data URIs. Pages render in the viewer's theme, so a design that only defines its colours inside a dark-mode media query will look broken for half its audience.`,
  insight: 'Publishing to the same file path redeploys to the same URL. Design for a document you will revise, not a snapshot you will replace.',
  example: { label: 'Theme-aware tokens — the thing most pages get wrong', lang: 'text', code: `:root {                    /* complete LIGHT palette on bare :root */
  --bg: #fbfaf8; --fg: #1a1a1a; --accent: #6b57d2;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {      /* system dark */
    --bg: #14131a; --fg: #ece9f5; --accent: #a897ff;
  }
}
:root[data-theme="dark"] {               /* explicit toggle wins */
  --bg: #14131a; --fg: #ece9f5; --accent: #a897ff;
}
body { background: var(--bg); color: var(--fg); }

/* ✗ Defining a colour ONLY inside the media query, or leaving body
   transparent, borrows the host theme and breaks in one of the modes. */` },
},
{
  id: 'f-docs', d: 'craft', lvl: 1, title: 'Real Documents',
  tag: 'docx, pptx, xlsx, pdf', prereq: ['f-artifacts'],
  hook: 'Some audiences will never open a web page. They want a file, with your letterhead, that opens in the app they already have.',
  what: `Claude produces genuine office files — Word, PowerPoint, Excel, PDF — not markdown that resembles them. The code execution sandbox ships \`python-docx\`, \`python-pptx\`, \`matplotlib\`, \`pillow\` and \`pypdf\`, so a request for "a report" can return an actual formatted document via the Files API rather than text about one.

It reads them too, which is the half people forget. Extracting structure from a hundred-page PDF, pulling tables out of a deck, restructuring a messy spreadsheet where the headers start on row 7 and three columns are dates stored as text — these are ordinary tasks now, and they were miserable before.

Templates are the professional move. Provide a \`.dotx\` or \`.potx\` and the output inherits your organisation's actual styling instead of default Calibri, which is the difference between a document someone forwards and one they quietly reformat first. The same applies to xlsx: preserving formulas and formatting rather than flattening to values is what keeps the file *usable* rather than merely correct.

Choose the format by the reader, not by convenience. An artifact is right for something to be explored and shared by link; a docx is right for something that will be tracked-changed, printed, filed, or sent to someone outside your organisation; a pptx is right when it has to be presented from someone else's laptop.`,
  insight: 'Supply a template file and the output arrives already on-brand. It is the cheapest quality upgrade available in this whole discipline.',
  example: { label: 'Format follows reader', lang: 'text', code: `"Take Q3-raw.xlsx (headers start row 7; 'date' is text; three
 duplicate-ish customer columns).

 1. Clean it: real headers, parsed dates, deduped customers.
    Keep the existing formulas in columns K:N working.
 2. Build the board deck from brand-template.potx — do not
    restyle it; use its layouts and its colours.
 3. One-page exec summary as .docx on our letterhead.
 4. Also publish the interactive cut as an artifact so the
    regional leads can filter it themselves.

 Same numbers in all four. Flag any row you had to guess about
 rather than silently dropping it."` },
},
{
  id: 'f-viz', d: 'craft', lvl: 2, title: 'Data Visualisation',
  tag: 'charts that survive scrutiny', prereq: ['f-artifacts'],
  hook: 'A chart is an argument. Most bad charts are bad because nobody decided what the argument was.',
  what: `Claude will produce charts in any medium — inline SVG, an HTML or React artifact, matplotlib, plotly, d3, Recharts. Getting good ones is less about the library and more about deciding, before any code, what a reader should conclude in three seconds.

State the comparison in the request. "Chart this data" produces a default bar chart. "Show whether EU latency regressed relative to US after the v4.2 deploy" produces a chart with the right encoding, the right baseline, and an annotated deploy line — because the comparison determines the form.

The systematic failures are consistent and fixable: a categorical rainbow palette that implies an ordering that does not exist; a sequential ramp used for unordered categories; a truncated y-axis that manufactures drama; colour as the sole channel, which fails for colour-blind readers and in greyscale printouts; and dual axes, which can be arranged to support almost any conclusion and should be treated as a last resort.

Two habits carry most of the quality. Label directly on the series instead of forcing a legend round-trip — the reader's eye should not have to travel. And design for both themes: a chart whose gridlines are hard-coded \`#eee\` disappears entirely on a dark background, which is where a large fraction of your readers are.

Where the destination renders live charts from data, hand it the rows rather than a rendered image — a picture of a chart loses hover, inspection and per-value comments.`,
  insight: 'Write the takeaway sentence first, then build the chart that makes it visible. If you cannot write the sentence, you do not yet have a chart.',
  example: { label: 'Specify the argument, not the chart type', lang: 'text', code: `✗  "Make a chart of this latency data."

✓  "Reader should conclude in 3s: EU p95 regressed after v4.2
    while US did not.

    · two series, direct-labelled at the line ends — no legend
    · annotate the v4.2 deploy as a vertical rule with a date
    · y-axis from zero; do NOT truncate to dramatise
    · distinguish series by colour AND dash pattern (greyscale-safe)
    · theme-aware: read gridline/text colour from CSS variables,
      never hard-coded #eee
    · call out the 3 outlier points; do not silently smooth them"` },
},
{
  id: 'f-design', d: 'craft', lvl: 2, title: 'Design Systems & Brand',
  tag: 'consistency without a designer', prereq: ['f-viz'],
  hook: 'Give the model your constraints and it will hold them across fifty pages more reliably than a team of humans will.',
  what: `Consistency is a memory problem, and that is a problem models are unusually good at. Hand over a real design system — the colour tokens, the type scale, the spacing rhythm, the component patterns — and every artifact, deck and document that follows will sit inside it. Do not hand it over and you get fifty individually reasonable designs that visibly do not belong together.

Encode the system as *tokens and rules*, not adjectives. "Modern and clean" means nothing operationally. A type scale with five steps, a spacing scale in multiples of 4, three semantic colour roles and a rule that says body copy is never lighter than a stated contrast ratio — those are checkable, and checkable constraints survive.

Constraint beats abundance in a specific way that matters here. A palette of four colours and two typefaces produces more coherent work than a palette of twenty, because every additional option is a decision that can be made inconsistently across documents. The same logic applies to spacing: a rhythm you can violate in eight places will be violated in eight places.

Put the system where it loads automatically — a skill, a plugin, a standing instruction — rather than pasting it each time. That is the move that turns "I have a style guide" into "our output is on-brand by default," and it is the same on-demand loading pattern that makes skills work at all.`,
  insight: 'Ship the design system as a skill so it loads on demand. A style guide nobody pastes in is a style guide that does not exist.',
  example: { label: 'Tokens and rules, not adjectives', lang: 'text', code: `# Design tokens (skill: brand-system)

TYPE   display 40/1.1/600 · h1 28/1.25/600 · h2 20/1.35/600
       body 15/1.6/400   · meta 13/1.5/400
       Never introduce a sixth step. Never bold body copy.

SPACE  4 8 12 16 24 32 48 64 only. No arbitrary values.

COLOUR ink #16151a · paper #fbfaf8 · accent #6b57d2
       muted #6c6a78 · line #e6e3dd
       Exactly one accent per view. Never accent-on-accent.

RULES  · body text contrast ≥ 7:1 against its own background
       · radius is 8px everywhere, or 0 — never both in one view
       · every colour defined as a token on :root, both themes` },
},
{
  id: 'f-canvas', d: 'craft', lvl: 3, title: 'Visual Iteration',
  tag: 'from prompt to direct manipulation', prereq: ['f-design'],
  hook: 'Describing a layout change in words is slow and lossy. At some point you should be able to just move the thing.',
  what: `Some design work is faster to *do* than to describe. Nudging a headline, tightening a column, swapping two panels — a sentence for each of these is a poor interface, and the round-trip cost dominates the actual change.

The pattern that solves it: the model drafts structure, and a visual surface handles refinement. Claude produces multiple artboards on a single pan-and-zoom canvas — screen flows, landing pages, posters, a memo as one flowing artboard — and where saving is enabled, elements are refined directly: click to select, edit text inline, adjust properties, undo, then publish a new version for everyone.

This inverts the usual division of labour productively. The model is fast at generating *variations* — five headline treatments, three layout skeletons — which is exactly the expensive part of early design. Humans are fast at *judging* and at the last ten percent of adjustment, which is exactly what direct manipulation is for. Prompting to generate, manipulating to refine, plays to both.

The workflow lesson generalises past design: use the model where breadth is expensive and use direct control where precision is expensive. Ask for options at the start, not one polished answer — a single "best" draft hides the space of alternatives, and the alternative you would have picked is usually the one you never saw.`,
  insight: 'Ask for variations early and refinement late. The model\'s cheapest superpower is breadth, and a single polished draft throws it away.',
  example: { label: 'Generate breadth, then manipulate', lang: 'text', code: `"Four artboards on one canvas, same content, genuinely different
 structural takes — not four colourways of one layout:

   A  hero-led, single column, big type
   B  split hero, product shot right
   C  dense above-the-fold with three proof points
   D  editorial — long headline, no image at all

 Same copy in each so I'm judging structure, not wording.
 Use the brand tokens. Do not polish — I'll refine the winner
 directly on the canvas."` },
},
{
  id: 'f-capabilities', d: 'craft', lvl: 3, title: 'Live Artifacts',
  tag: 'pages that remember and react', prereq: ['f-canvas', 'a-tools'],
  hook: 'A published page can read live data, remember what visitors did, and ask Claude questions of its own.',
  what: `Static HTML has a ceiling, and runtime capabilities are how a page goes past it. Depending on what is enabled, a published artifact can read the author's live or connected data, persist state shared across viewers, know who is viewing, store files people upload, hand a viewer a file to save — and call Claude at runtime, from inside the page.

That last one is the qualitative jump. The page stops being a rendering of an answer and becomes a thing that can answer. A dashboard that explains its own anomaly when clicked; a document that drafts a section on request; a triage tool where the model classifies as you type. The model is no longer upstream of the artifact, it is *inside* it.

Shared state is the other jump. A poll, a sign-up sheet, a checklist several people tick, a document edited in place and re-saved — these need durable state across viewers, which browser storage cannot provide. \`localStorage\` remains the right tool for per-viewer conveniences (a remembered tab, a collapsed section, an unsent draft) and the wrong tool for anything that must be shared or read back later.

One consequence to design for: a page that saves new versions of itself means your local copy can fall behind. When that happens, re-read the published version and merge onto it rather than overwriting — the same discipline as a shared branch.

Always wrap storage access in try/catch. It can be empty, and in some contexts it throws outright.`,
  insight: 'Per-viewer convenience → localStorage. Anything shared, durable, or readable later → a real state capability. Choosing wrong loses data silently.',
  example: { label: 'Per-viewer vs. shared state', lang: 'text', code: `// ✓ per-viewer convenience — localStorage is correct here
try {
  const tab = localStorage.getItem('activeTab') ?? 'overview';
  render(tab);
} catch { render('overview'); }        // private windows THROW

// ✗ wrong tool: everyone would see only their own votes,
//   and they'd vanish on a different device
// localStorage.setItem('votes', JSON.stringify(votes));

// ✓ shared, durable state → a runtime state capability, so all
//   viewers see one tally and it survives a republish.` },
},
{
  id: 'f-longform', d: 'craft', lvl: 4, title: 'Long-form Co-authoring',
  tag: 'documents with an argument', prereq: ['f-capabilities'],
  hook: 'Ask for a finished document and you get an average one. The good work happens in the structure, before any prose exists.',
  what: `For anything substantial — a design doc, a proposal, a spec, a strategy memo — going straight to prose is the mistake. Prose is the most expensive thing to change and the hardest thing to evaluate, so committing to it first means every structural problem gets discovered late and fixed by rewriting.

The workflow that works inverts it. Transfer context first — the constraints, the decisions already made, the audience, the thing that must not be misread. Then agree an *outline*, and argue about that: whether the claims are in the right order, whether the objection you know is coming is answered before it is raised, what is missing. Structural disagreement costs a sentence to fix at this stage and a rewrite later. Only then, prose. Then a verification pass against the original goal, ideally with fresh eyes that never saw the drafting.

The model's most valuable contribution here is often not writing at all. It is being the reader who has not been living inside the problem for three weeks: "you use 'tenant' in two different senses," "this assumes I know why option B was rejected," "the third section answers a question the second one never raised."

Watch for a specific drift: over successive revisions, models soften. Strong claims accumulate hedges, the sharp sentence becomes the safe one. Periodically ask which claims got weaker and whether any of that weakening was actually justified.`,
  insight: 'Argue about the outline. Structural problems are free to fix before prose exists and expensive after.',
  example: { label: 'Structure before prose', lang: 'text', code: `Stage 1 — context dump, no writing yet:
  "Here's the constraint set, the two decisions already locked,
   and who reads this (VP Eng, skeptical, 5 minutes)."

Stage 2 — outline only:
  "Section headings + the ONE claim each section must land.
   Then tell me: which claim is weakest, what objection does a
   skeptical reader raise that this order doesn't answer, and
   what am I assuming they already know?"

Stage 3 — prose, section by section, against the agreed outline.

Stage 4 — fresh-eyes pass (new session, doc only):
  "You've never seen this. Where do you lose the thread? Which
   term is used in two senses? What question does §3 answer that
   §2 never raised?"

Stage 5 — "Which claims got softer since draft 1? Was that earned?"` },
},
{
  id: 'f-generative', d: 'craft', lvl: 5, title: 'Generative & Algorithmic Work',
  tag: 'code as the medium', prereq: ['f-longform'],
  hook: 'Write the system, not the artwork — then explore the space it defines.',
  what: `In algorithmic art the deliverable is a *generator*: a program whose parameters and seeded randomness define a space of outputs rather than one output. Flow fields, particle systems, tiling and subdivision, reaction-diffusion, noise-driven form. Claude is unusually well suited to this because the medium is code and the iteration loop is tight — change a coefficient, look, change it again.

Seeded randomness is the technical requirement that makes it work as a practice rather than a slot machine. With a seed, a result you liked is reproducible, a variation is a controlled experiment, and "that one from twenty minutes ago" is recoverable. Without one, every render is a one-way door and you spend the session mourning outputs you cannot get back.

The productive division: you set the constraints and judge, the model explores the parameter space and implements the mechanics you would not want to hand-derive. Ask for a *parameterised system* with named, meaningful controls rather than a finished image — then explore by turning knobs, which is both faster and more likely to find something you would not have specified.

This is also the clearest place to see a rule that applies to all creative work with models: generate original systems rather than reproducing a named living artist's style. Beyond the copyright question, imitation caps the output at approximation, whereas a genuine system produces things nobody has seen — which was the point.`,
  insight: 'Seed everything. Irreproducible output is not a practice, it is a slot machine — you cannot iterate toward something you cannot get back.',
  example: { label: 'A parameterised, seeded system', lang: 'javascript', code: `// Seed FIRST — every run reproducible, every change a real experiment
let SEED = 20260831;
const rng = mulberry32(SEED);

const P = {                 // named, meaningful knobs — not magic numbers
  fieldScale:   0.0032,     // noise zoom: wisps ↔ broad currents
  stepLen:      1.4,        // integration step: crisp ↔ smeared
  particles:    9000,
  lifespan:     420,
  turnBias:     0.18,       // curl asymmetry → drift direction
  paletteShift: 0.62,
};

// Explore by sweeping ONE axis at a time and keeping the seed fixed:
//   for (const s of [0.001, 0.002, 0.004, 0.008]) render({...P, fieldScale: s})
// Same seed + one varied knob = you can actually SEE what it controls.` },
},

// ── PLATFORM & SCALE ────────────────────────────────────────────────────────
{
  id: 's-models', d: 'scale', lvl: 1, title: 'Choosing a Model',
  tag: 'the first architectural decision', prereq: [],
  hook: 'Model choice is a routing decision, not a loyalty one — and the default should be the most capable one until measurement says otherwise.',
  what: `The current line-up: **Claude Fable 5** (\`claude-fable-5\`, $10/$50 per MTok) is the most capable widely released model, for the most demanding reasoning and long-horizon agentic work. **Claude Opus 5** (\`claude-opus-5\`, $5/$25) is the strong default. **Claude Sonnet 5** (\`claude-sonnet-5\`, $2/$10) balances capability and cost. **Claude Haiku 4.5** (\`claude-haiku-4-5\`, $1/$5) is the fast, cheap option and the only one with a 200K rather than 1M context window.

Use the exact ID strings — they are complete as written. Appending a date suffix (\`claude-sonnet-5-20251114\`) is a recalled pattern from older models and will fail. Do not downgrade a model for cost without measuring; that is a decision with quality consequences and it should be made on evidence.

Fable 5 has real API differences worth knowing before you route to it: thinking is always on (omit the parameter; explicit configuration returns a 400), the raw chain of thought is never returned, single requests on hard tasks can run many minutes, and it requires 30-day data retention — it is unavailable under zero-data-retention configurations.

Two availability facts that catch people: **fast mode** (up to ~2.5× output tokens/sec at premium pricing) is Opus 5 / Opus 4.8 only and first-party API only. **Priority Tier does not cover Opus 5**, Sonnet 5, or the Mythos models, though it covers Fable 5 and Opus 4.8.

Query the Models API rather than hard-coding capabilities — \`max_input_tokens\`, \`max_tokens\` and \`capabilities\` are live fields.`,
  insight: 'Route per task, not per application. Cheap models for mechanical high-volume work, capable models wherever judgement compounds — especially evaluation.',
  example: { label: 'Routing, with the reason recorded', lang: 'python', code: `ROUTES = {
  # high volume, mechanical, judgement adds nothing
  "classify_ticket":  ("claude-haiku-4-5", "low"),
  "summarise_thread": ("claude-sonnet-5",  "medium"),
  # judgement compounds downstream — do not economise here
  "code_review":      ("claude-opus-5",    "xhigh"),
  "eval_judge":       ("claude-opus-5",    "high"),
  # long-horizon, hardest reasoning
  "migration_plan":   ("claude-fable-5",   "high"),
}

model, effort = ROUTES[route]
client.messages.create(model=model, max_tokens=16000,
                       thinking={"type": "adaptive"},
                       output_config={"effort": effort}, messages=msgs)

# ✗ "claude-sonnet-5-20251114"  — IDs are complete as written.` },
},
{
  id: 's-structured', d: 'scale', lvl: 2, title: 'Structured Outputs',
  tag: 'parseable by construction', prereq: ['s-models'],
  hook: 'The line between a demo and a system is whether the next step can parse the output without a regex and a prayer.',
  what: `Set \`output_config: {format: {...}}\` on \`messages.create()\` and the response is constrained to your schema. The recommended path is \`client.messages.parse()\`, which validates for you. Note the deprecation: the old top-level \`output_format\` parameter is superseded — this is a general API change, not a model-specific one.

The related but distinct feature is \`strict: true\` on a *tool* definition, which guarantees \`tool_use.input\` validates exactly against the tool's schema. Requires \`additionalProperties: false\` and \`required\`. One is about the response; the other is about tool arguments.

Design schemas for the *model*, not only for your database. Field names are read as instructions: \`confidence_0_to_1\` produces better-calibrated values than \`score\`, and \`evidence_quote\` forces grounding in a way that \`notes\` does not. Enums beat free strings everywhere you can enumerate the values, because they eliminate a whole class of downstream normalisation.

Always include an explicit escape hatch. A schema with no way to express "I could not determine this" forces a fabricated value into a field your code will treat as fact — the most common way structured outputs manufacture confident errors. Make \`unknown\` or nullability representable, and the model will use it.

Remember the incompatibility: **structured outputs and citations cannot be combined** in one call (400). Plan the two-call shape up front if you need both.`,
  insight: 'A schema with no "unknown" branch forces fabrication. The escape hatch is not optional — it is the difference between a gap and a lie.',
  example: { label: 'Field names as instructions', lang: 'python', code: `SCHEMA = {
  "type": "object", "additionalProperties": False,
  "required": ["severity", "confidence_0_to_1", "evidence_quote"],
  "properties": {
    "severity": {"enum": ["S1","S2","S3","S4","cannot_determine"]},
    "confidence_0_to_1": {"type": "number"},
    # forces grounding: it must quote, or admit it cannot
    "evidence_quote": {"type": ["string","null"],
      "description": "Verbatim span from the report supporting the "
                     "severity. null ONLY if severity is "
                     "cannot_determine."},
  },
}

result = client.messages.parse(
    model="claude-opus-5", max_tokens=2000,
    output_config={"format": {"type": "json_schema", "schema": SCHEMA}},
    messages=msgs,
)` },
},
{
  id: 's-batch', d: 'scale', lvl: 3, title: 'Batch & Files',
  tag: 'half price, when you can wait', prereq: ['s-structured'],
  hook: 'Any workload that does not need an answer in this second is a workload you are overpaying for.',
  what: `The Message Batches API runs requests asynchronously at **50% cost**. You submit an array of requests each carrying a \`custom_id\`, poll \`processing_status\` until \`"ended"\`, then stream results. That is a straight halving of spend on a large class of real work: nightly classification, backfills, evaluation suites, document processing, dataset generation — anything where latency is not the constraint.

The rule that catches everyone: **results arrive in any order**. Key by \`custom_id\`, never by position. Code that zips the results array against the inputs array will look correct in testing with three items and corrupt data at scale. Each result carries \`.custom_id\` plus \`.result.type\` — \`succeeded\`, \`errored\`, \`canceled\` or \`expired\` — so handle all four rather than assuming success.

The Files API is the companion. Upload once, reference by \`file_id\` across many requests, and stop paying to re-transmit the same document. It is now out of beta: \`client.files.*\`, no beta header. If you have code on \`client.beta.files.*\` with the \`files-api-2025-04-14\` header, that is the migration.

Combine the two and the economics change shape. A thousand documents processed against a cached prefix, submitted as one batch, costs a fraction of a thousand synchronous calls — and the work that was "too expensive to run over the whole corpus" often turns out not to be.`,
  insight: 'Key batch results by custom_id. Positional zipping passes every small test and silently mismatches at production volume.',
  example: { label: 'Submit, poll, and key by ID', lang: 'python', code: `batch = client.messages.batches.create(requests=[
    Request(custom_id=doc.id,
            params=MessageCreateParamsNonStreaming(
                model="claude-haiku-4-5", max_tokens=1000,
                messages=[{"role":"user","content":render(doc)}]))
    for doc in docs                       # 50% cost, async
])

while client.messages.batches.retrieve(batch.id).processing_status != "ended":
    wait()

out = {}
for r in client.messages.batches.results(batch.id):
    if r.result.type == "succeeded":
        out[r.custom_id] = r.result.message.content   # ← key by ID
    else:
        log_failure(r.custom_id, r.result.type)       # 4 possible types

# ✗ for doc, r in zip(docs, results):  — order is NOT guaranteed.` },
},
{
  id: 's-cost', d: 'scale', lvl: 3, title: 'Cost Engineering',
  tag: 'free wins before tradeoffs', prereq: ['s-batch', 'c-cache'],
  hook: 'Most bills shrink 40-70% before you give up a single point of quality. Do those things first.',
  what: `There is a correct order, and it exists because the early levers cost nothing in quality and the later ones do. Take them in sequence.

**Free wins first.** Prompt caching, in almost every case, is the largest single lever — and it is free because it changes nothing about the output. Input-token hygiene: stop resending what has not changed. Loop hygiene: an agent that re-reads the same file six times is paying six times. Output-token hygiene: ask for the artifact, not the artifact plus a preamble explaining it. Batch anything asynchronous, at half price.

**Then tradeoffs.** Effort is the first quality-trading dial — and before you reach for a cheaper model, measure the capable model at *lower effort* on the same tasks. Lower effort on a current model often matches or beats a previous generation at high effort, and it keeps you on one cache namespace. Caches are model-scoped, so a multi-model cascade forfeits cache reuse across its models — a cost that rarely appears in the spreadsheet that justified the cascade.

Measure **cost per completed task**, not cost per request. A cheaper request that needs three retries, or a smaller model that produces work a human has to redo, is not cheaper — it has just moved the cost somewhere your API bill cannot see it.

Start from data, not intuition: the Usage and Cost Admin API if you have an admin key, your own \`response.usage\` logs otherwise. "No change recommended" is a legitimate outcome of a cost audit.`,
  insight: 'Every run that exercises the model spends real money. Get approval before a cost audit starts firing requests to measure things.',
  example: { label: 'Instrument first — you cannot optimise a guess', lang: 'python', code: `u = resp.usage
log({
  "route": route,
  "in":         u.input_tokens,
  "cache_read": u.cache_read_input_tokens,      # want this LARGE
  "cache_write":u.cache_creation_input_tokens,
  "out":        u.output_tokens,
  "hit_rate":   u.cache_read_input_tokens /
                max(1, u.input_tokens + u.cache_read_input_tokens),
})

# Then rank routes by SPEND, not by call count, and work top-down:
#   1. cache hit rate < 0.5 on a hot route → find the invalidator
#   2. async and still synchronous?         → batch it (−50%)
#   3. effort inherited from older code?    → re-tune per route
#   4. only then consider a cheaper model, and eval it` },
},
{
  id: 's-evals', d: 'scale', lvl: 4, title: 'Evals & Regression Gates',
  tag: 'the thing that makes changes safe', prereq: ['s-cost', 'r-judge'],
  hook: 'Without evals, every prompt change is a coin flip you cannot see the result of.',
  what: `An eval is a fixed set of inputs with known-good properties, run against your system, scored automatically. It is what turns prompt engineering from taste into engineering — because it is the only way to know whether the change you just made helped, hurt, or shifted the failure elsewhere.

Start much smaller than feels legitimate. Twenty cases drawn from real traffic will catch the overwhelming majority of regressions, and the discipline of *having* an eval matters more than its size. Cases you invent are cleaner than reality and will miss the failure modes that actually occur; every real production failure should become a case the moment it is diagnosed.

Score in layers, cheapest first. Deterministic checks — schema validity, required fields present, no forbidden strings, latency and cost bounds — catch a surprising share of regressions for free and never drift. Reserve model-based judging (see *Claude as Evaluator*, with binary criteria, not 1-10 scores) for the genuinely subjective dimensions. And keep a small human-labelled set to validate the judge itself, because an unvalidated judge silently defines quality as whatever it happens to prefer.

Then gate on it. An eval that runs when someone remembers is a document; an eval wired into CI that blocks a merge is a control. Track cost and latency alongside quality in the same run — otherwise you will ship a change that improves scores by 2% and triples the bill, and find out from finance.`,
  insight: 'Every production failure becomes a permanent eval case. That single habit compounds faster than any prompt technique on this web.',
  example: { label: 'Layered scoring, cheapest checks first', lang: 'python', code: `def score(case, out):
    # Layer 1 — deterministic. Free, never drifts, catches most regressions.
    if not schema_valid(out):              return fail("schema")
    if case.must_cite and not out.citations: return fail("uncited")
    if out.cost_usd > case.budget:         return fail("over budget")
    if out.latency_ms > case.p95_ms:       return fail("too slow")

    # Layer 2 — model judge, BINARY criteria only, capable model.
    return judge(case.source, out, RUBRIC)   # 5 × true/false

# CI gate: block the merge, don't just print a number.
assert pass_rate(results) >= BASELINE - 0.02, "quality regression"
assert mean_cost(results) <= BASELINE_COST * 1.10, "cost regression"` },
},
{
  id: 's-guardrails', d: 'scale', lvl: 4, title: 'Refusals & Fallbacks',
  tag: 'designing for the unhappy path', prereq: ['s-models'],
  hook: 'A refusal returns HTTP 200. If your code only checks for exceptions, it will hand users an empty string and call it success.',
  what: `Safety classifiers can decline a request. The result is **HTTP 200** with \`stop_reason: "refusal"\` and a \`stop_details\` object carrying a category. Nothing raises. Code that reads \`response.content[0].text\` without first checking \`stop_reason\` will produce a confusing empty output rather than a handled case — so always check \`stop_reason\` before touching \`content\`.

Note the guard on \`stop_details\`: it is populated **only** when \`stop_reason == "refusal"\` and is \`null\` for every other stop reason, including \`end_turn\`, \`max_tokens\`, \`tool_use\` and \`pause_turn\`.

For Opus 5 and Fable 5, enable **server-side fallbacks** by default. The simplest form is \`betas: ["server-side-fallback-2026-07-01"]\` with \`fallbacks: "default"\`, which routes by refusal category so you never maintain a model list. The older array form still works. On Bedrock, Vertex and Foundry, use the SDKs' client-side \`BetaRefusalFallbackMiddleware\` instead.

Handle the other stop reasons deliberately too. \`max_tokens\` means truncated mid-thought — do not parse it as complete. \`pause_turn\` means a server tool needs continuation. And handle errors as a *chain*, most specific first — \`NotFoundError\` → \`RateLimitError\` → \`APIStatusError\` → \`APIConnectionError\` — rather than one broad catch that erases the difference between retryable (429, 5xx, network) and non-retryable (400, 404).

Guardrails are also an input problem: any content from a document, a web page, a PR comment or an email is untrusted, and instructions inside it are data, not commands.`,
  insight: 'Check stop_reason before reading content, every time. The refusal path is a 200 and it is the one nobody tests.',
  example: { label: 'The unhappy paths, handled', lang: 'python', code: `resp = client.beta.messages.create(
    model="claude-opus-5", max_tokens=16000,
    betas=["server-side-fallback-2026-07-01"],
    fallbacks="default",              # routes by refusal category
    messages=msgs,
)

match resp.stop_reason:
    case "refusal":
        # stop_details is populated ONLY here
        return declined(resp.stop_details.category)
    case "max_tokens":
        return truncated(resp)        # ✗ do not parse as complete
    case "pause_turn":
        return continue_turn(resp)    # server tool wants to continue
    case _:
        return resp.content[0].text

# ✗ resp.content[0].text with no stop_reason check → silent empty
#   string on the one path you never exercised in testing.` },
},
{
  id: 's-observability', d: 'scale', lvl: 4, title: 'Observability & Admin',
  tag: 'you cannot debug what you did not log', prereq: ['s-evals'],
  hook: 'Non-determinism means the bug report is the only evidence you will ever have. Log accordingly.',
  what: `Traditional debugging assumes reproducibility. LLM systems do not offer it, which shifts the entire burden onto capture: whatever you did not record at the time is gone, because re-running the request gives you a different response.

Log the *full* request context — model, effort, thinking configuration, tool set, the rendered system prompt, message hashes — alongside the response and \`usage\`. When output quality shifts, the cause is very often a config change nobody connected to it: an effort setting, a tool description edit, a reordered prompt. Without those fields in the log, you are guessing; with them, it is a diff.

\`usage\` is the highest-signal object you have. Cache read and write tokens diagnose caching health; a collapse in \`cache_read_input_tokens\` is usually the first observable sign that someone introduced a silent invalidator. Track it per route, alert on the drop, and you find the regression the day it lands instead of at month end.

At organisation scale, the **Admin API** (beta since 2026-08-26) covers members, invites, workspaces, API keys, rate limit reports, service accounts and federation — under \`client.beta.organization\` in the SDKs. It requires an admin credential; regular API keys are rejected. Usage and cost reports are raw HTTP only, not in the SDKs.

Sample and store real conversations, with consent and a retention policy. That corpus is where your eval cases come from, and it is the difference between fixing the failures you imagined and fixing the ones that happen.`,
  insight: 'Alert on cache hit rate per route. It falls the moment someone adds a timestamp to a system prompt, and nothing else will tell you.',
  example: { label: 'Log the config, not just the text', lang: 'python', code: `emit({
  "ts": now(), "route": route, "trace_id": trace_id,
  # ── config: the field that explains most quality shifts ──
  "model": model, "effort": effort,
  "thinking": thinking_cfg,
  "tools_hash": stable_hash(TOOLS),      # a description edit shows up
  "system_hash": stable_hash(system),    # a reorder shows up
  # ── outcome ──
  "stop_reason": resp.stop_reason,
  "usage": dict(resp.usage),
  "latency_ms": ms,
})

# Alerts that actually catch regressions:
#   cache_read_input_tokens / input_tokens  drops >30% on a route
#   stop_reason == "refusal"                rate rises on a route
#   output_tokens p95                       doubles (verbosity drift)` },
},
{
  id: 's-deploy', d: 'scale', lvl: 5, title: 'Enterprise & Multi-cloud',
  tag: 'where the request actually runs', prereq: ['s-observability', 's-guardrails'],
  hook: 'The same model on a different platform is not the same product — feature availability, pricing and client code all diverge.',
  what: `Claude runs first-party, on **Claude Platform on AWS** (Anthropic-operated, same-day API parity), and on partner platforms: **Amazon Bedrock**, **Google Vertex AI** and **Microsoft Foundry**. Which one you are on changes real things, and assuming parity is the mistake that surfaces in week three.

Use the dedicated client class, never the first-party \`Anthropic()\` with a \`base_url\` override — \`AnthropicBedrockMantle\`, \`AnthropicVertex\`, \`AnthropicFoundry\`. Model IDs differ too: Bedrock takes an \`anthropic.\` prefix; Vertex takes the bare ID for current models but an \`@\` separator for dated snapshots (\`claude-opus-4-5@20251101\`, not a hyphenated date).

Feature availability is the real trap. Fast mode is first-party only. On Vertex, only basic web search is available and web fetch is not offered. Managed Agents is not on Bedrock, Vertex or Foundry — use Claude API plus tool use there. Pricing diverges as well: Foundry bills at standard API rates through the Microsoft Marketplace, while Bedrock and Vertex are partner-operated with their own pricing.

Then the enterprise surface: **Workload Identity Federation** removes long-lived API keys entirely — set the federation environment variables and the standard zero-argument client auto-detects, exchanges the JWT and refreshes. One catch: \`ANTHROPIC_API_KEY\` or \`ANTHROPIC_AUTH_TOKEN\`, even empty, outranks WIF, and a set \`ANTHROPIC_PROFILE\` also wins — unset all three. \`inference_geo\` pins where inference runs for data-residency requirements, as a top-level parameter on the Messages API (but nested inside the agent's \`model\` object on Managed Agents).`,
  insight: 'Verify feature availability per platform before you design around a feature. Parity is the assumption that breaks quietly, three weeks in.',
  example: { label: 'Dedicated clients, platform-specific IDs', lang: 'python', code: `# Bedrock — Mantle client, prefixed model ID
from anthropic import AnthropicBedrockMantle
bedrock = AnthropicBedrockMantle(aws_region="us-west-2")
bedrock.messages.create(model="anthropic.claude-opus-5", ...)

# Vertex — bare ID for current models; ADC auth, no API key
from anthropic import AnthropicVertex
vertex = AnthropicVertex(project_id="proj", region="global")
vertex.messages.create(model="claude-opus-5", ...)

# ✗ Anthropic(base_url="https://bedrock...")  — do not do this.

# WIF: zero-arg client auto-detects. But unset ALL of these first,
# or they silently outrank the federation vars:
#   ANTHROPIC_API_KEY · ANTHROPIC_AUTH_TOKEN · ANTHROPIC_PROFILE
client = Anthropic()

# Data residency (Messages API — top-level, not extra_body):
client.messages.create(model="claude-opus-5", inference_geo="us", ...)` },
},
];
