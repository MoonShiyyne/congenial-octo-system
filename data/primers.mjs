// "In plain terms" — the concrete, named things a node refers to.
//
// The node prose assumes you know what `cache_control` or a PreToolUse hook
// literally is. This is where that gets said plainly, before the dense
// explanation uses the term. One line of plain English per item, plus the
// smallest snippet that shows the shape.
//
// Nodes that are purely conceptual (how to phrase a request, how to run a
// critique pass) have no entry — there is no named artifact to define, and a
// padded glossary would be worse than none.
//
//   n = the thing, exactly as you would type or see it
//   d = what it is, in plain terms
//   e = the smallest example that shows its shape

export const primers = {

// ── reasoning ─────────────────────────────────────────────────────────────
'r-thinking': {
  lead: 'Thinking is reasoning the model does before it writes the answer you see. You turn it on with one parameter.',
  items: [
    { n: 'thinking', d: 'The parameter that switches reasoning on. It goes at the top level of your request.', e: 'thinking={"type": "adaptive"}' },
    { n: '"adaptive"', d: 'The current setting. The model decides how much to think per request instead of you picking a fixed amount.', e: '{"type": "adaptive"}' },
    { n: 'display', d: 'Whether you get to see the reasoning. Defaults to hidden on current models, so set it if you want to show it.', e: '{"type": "adaptive", "display": "summarized"}' },
    { n: 'budget_tokens', d: 'The old way — a fixed reasoning allowance you paid for on every request. Gone; sending it now returns a 400 error.', e: '✗ {"type": "enabled", "budget_tokens": 8000}' },
  ],
},
'r-effort': {
  lead: 'Effort is one dial that trades thoroughness against cost, inside a single model. Five settings, and it lives inside output_config — not at the top level.',
  items: [
    { n: 'output_config', d: 'The wrapper object that effort goes inside. Putting effort at the top level silently does nothing.', e: 'output_config={"effort": "high"}' },
    { n: 'low / medium', d: 'Less reasoning, fewer tool calls, shorter answers. Right for classification and simple chat.', e: '{"effort": "low"}' },
    { n: 'high', d: 'The default. What you get if you set nothing.', e: '{"effort": "high"}' },
    { n: 'xhigh', d: 'Between high and max. The sweet spot for coding and agent work on current models.', e: '{"effort": "xhigh"}' },
    { n: 'max', d: 'Everything it has. For rare, high-stakes work where being wrong costs more than the tokens.', e: '{"effort": "max"}' },
  ],
},
'r-decompose': {
  lead: 'Plan mode makes Claude propose before it touches anything, so you approve the plan rather than review the damage.',
  items: [
    { n: 'plan mode', d: 'A Claude Code mode where the agent researches and proposes a plan, then stops and waits for you to approve it.', e: 'claude --permission-mode plan' },
    { n: 'Shift+Tab', d: 'Cycles permission modes inside a running session, including into and out of plan mode.', e: '(press it in the session)' },
    { n: '"Plan only. Change nothing."', d: 'The same effect with no flags — a sentence that scopes the turn to thinking.', e: 'claude "Plan only. Change nothing yet. …"' },
  ],
},
'r-archaeology': {
  lead: 'These are the specific things to grep for — patterns that were good advice for an older model and are now dead weight or an outright error.',
  items: [
    { n: 'rg', d: 'ripgrep — a fast recursive search. The tool you actually run an audit with.', e: 'rg -n "budget_tokens"' },
    { n: 'assistant prefill', d: 'Putting words in the assistant\'s mouth to force a format. Removed on current models; now a 400.', e: '✗ messages=[…, {"role": "assistant", "content": "{"}]' },
    { n: '"think step by step"', d: 'Scaffolding that made older models reason. Adaptive thinking does this now; the phrase just costs tokens.', e: 'rg -ni "think step by step"' },
    { n: 'a keep list', d: 'The rules that look like cruft and are not — domain constraints, safety rules, real format needs. Write it before you delete anything.', e: '# KEEP: "never quote a price without the disclaimer"' },
  ],
},

// ── context ───────────────────────────────────────────────────────────────
'c-files': {
  lead: 'You attach a file as a content block inside the message. The block type has to match what the file actually is.',
  items: [
    { n: 'content block', d: 'One item in a message. A message can hold several — a document, then your question.', e: '"content": [ {…document…}, {…text…} ]' },
    { n: 'document block', d: 'How a PDF goes in. Put it before your question, because the model reads in order.', e: '{"type": "document", "source": {…}}' },
    { n: 'image block', d: 'How a screenshot or photo goes in.', e: '{"type": "image", "source": {…}}' },
    { n: 'file_id', d: 'An ID you get back from uploading once, then reuse. Stops you re-sending a 200-page PDF every turn.', e: '{"type": "file", "file_id": "file_01A…"}' },
  ],
},
'c-projects': {
  lead: 'Every surface has one place for instructions you would otherwise retype. Same idea, four names.',
  items: [
    { n: 'CLAUDE.md', d: 'A file in your repo that Claude Code reads automatically every session.', e: '# Conventions\n- pnpm only, never npm' },
    { n: 'Projects', d: 'The same thing in the Claude apps — instructions and files that apply to every chat in that project.', e: '(set in the project’s settings)' },
    { n: 'system', d: 'The API version — a parameter carrying instructions that sit in front of the conversation.', e: 'system="You review SQL for a Postgres 16 shop."' },
    { n: 'mid-conversation system message', d: 'Adding an operator instruction partway through without wrecking your cache.', e: 'messages.append({"role": "system", …})' },
  ],
},
'c-memory': {
  lead: 'Memory is a store Claude can write to and read back later. Unlike the conversation, it costs nothing until it is fetched.',
  items: [
    { n: 'memory_20250818', d: 'The tool type string that turns memory on. The date is the version, not something you change.', e: 'tools=[{"type": "memory_20250818", "name": "memory"}]' },
    { n: 'the backend', d: 'Where entries actually get stored. You implement it — the SDKs ship a base class to build on.', e: 'class MyMemory(BetaAbstractMemoryTool): …' },
    { n: 'provenance', d: 'Recording where a fact came from, so a later session can tell "the user said this" from "I read this online".', e: '{"fact": …, "source": "user" | "external"}' },
  ],
},
'c-citations': {
  lead: 'Turn citations on and the answer comes back split into pieces, each one pointing at the exact span of the source it came from.',
  items: [
    { n: 'citations', d: 'The switch, set on a document block. It is all documents in the request or none.', e: '"citations": {"enabled": true}' },
    { n: 'cited_text', d: 'The literal words from the source that back a claim.', e: 'c.cited_text  → "…terminate on 30 days notice…"' },
    { n: 'page_location', d: 'Where it came from in a PDF — page numbers, counting from 1.', e: 'c.start_page_number → 14' },
    { n: 'char_location', d: 'The same for plain text — character offsets instead of pages.', e: 'c.start_char_index → 2841' },
  ],
},
'c-longctx': {
  lead: 'The context window is how much the model can hold at once. Big now — but you pay for all of it, on every turn.',
  items: [
    { n: 'context window', d: 'Total room for everything you send plus everything it writes. 1M tokens on current models; 200K on Haiku 4.5.', e: '~750,000 words, give or take' },
    { n: 'max_input_tokens', d: 'The real number, from the API. Ask rather than hard-coding it — models differ.', e: 'client.models.retrieve("claude-opus-5").max_input_tokens' },
    { n: 'token', d: 'Roughly ¾ of a word. The unit everything is counted and billed in.', e: '"unbelievable" ≈ 3 tokens' },
  ],
},
'c-cache': {
  lead: 'Caching lets the model skip re-reading the unchanged front of your request. It matches from the start, so one changed byte early throws away everything after it.',
  items: [
    { n: 'prefix', d: 'The front of your request. Caching compares from byte one and stops at the first difference.', e: 'tools → system → messages  (always this order)' },
    { n: 'cache_control', d: 'The marker saying "everything up to here is reusable". Four allowed per request.', e: '"cache_control": {"type": "ephemeral"}' },
    { n: 'cache_read_input_tokens', d: 'How many tokens came from cache. If it is zero, caching is silently not working.', e: 'assert resp.usage.cache_read_input_tokens > 0' },
    { n: 'an invalidator', d: 'Anything that changes near the front — a timestamp, a request ID, a set iterated in random order.', e: '✗ f"Today is {datetime.now()}"' },
  ],
},
'c-editing': {
  lead: 'Two different features with two different verbs. One deletes old material, the other summarises it. Using the wrong one loses state you needed.',
  items: [
    { n: 'context editing', d: 'Deletes. Drops old tool results outright — gone, not summarised.', e: 'context_management={"edits": [...]}' },
    { n: 'clear_tool_uses_20250919', d: 'The strategy that throws away stale tool output, like a directory listing from turn 3.', e: '{"type": "clear_tool_uses_20250919"}' },
    { n: 'compaction', d: 'Summarises. Condenses earlier conversation as you approach a size threshold.', e: 'betas=["compact-2026-01-12"]' },
    { n: 'response.content', d: 'Append the whole thing back, not just the text. Compaction state lives inside it, and pulling out only the text loses it with no error.', e: '✓ {"role": "assistant", "content": resp.content}' },
  ],
},


// ── code ──────────────────────────────────────────────────────────────────
'k-cli': {
  lead: 'Claude Code is a command you run in your project folder. It reads and edits your files and runs your commands, rather than describing what it would do.',
  items: [
    { n: 'claude', d: 'Start a session in the current folder. On its own it opens interactively; with a quoted task it just goes.', e: 'claude "make the auth tests pass"' },
    { n: 'claude attach <id>', d: 'Reconnect to a session that is running in the background.', e: 'claude attach sess_01H…' },
    { n: '/init', d: 'A built-in command that reads your codebase and writes a starter CLAUDE.md.', e: '/init' },
    { n: 'a checkable task', d: 'A job with a machine-verifiable finish, so the agent knows when it is done. This is the single biggest quality lever.', e: '"make pnpm test pass" ✓   "clean up auth" ✗' },
  ],
},
'k-claudemd': {
  lead: 'CLAUDE.md is a plain markdown file in your repo. Claude Code loads it automatically. Because it is committed, the whole team gets it.',
  items: [
    { n: 'CLAUDE.md', d: 'Goes in the repo root. Write what the code cannot tell you: reverted decisions, known flaky tests, undocumented build steps.', e: '- `make proto` must run before tests' },
    { n: 'nested CLAUDE.md', d: 'A second file deeper in the tree, for rules that only apply to that package.', e: 'packages/api/CLAUDE.md' },
    { n: 'the correction loop', d: 'The habit that makes it good: every time you correct Claude on something it could not have known, that goes in the file.', e: '# Do not switch serialize() to orjson — see #4412' },
  ],
},
'k-permissions': {
  lead: 'Claude Code asks before doing things. You decide in advance which things are boring enough not to ask about — so the prompts you do get still mean something.',
  items: [
    { n: 'settings.json', d: 'Where the rules live. `.claude/settings.json` in the repo is shared; there are user and org-level files too.', e: '.claude/settings.json' },
    { n: 'allow', d: 'Calls that never prompt. Put your read-only noise here — status, diff, search.', e: '"allow": ["Bash(git status)", "Bash(rg:*)"]' },
    { n: 'deny', d: 'Calls that are refused outright, even if you would have said yes. Secrets belong here.', e: '"deny": ["Read(.env)", "Bash(git push:*)"]' },
    { n: ':*', d: 'A wildcard for arguments — "this command with anything after it".', e: '"Bash(git diff:*)"' },
    { n: 'permission mode', d: 'The overall posture, from prompting on everything to broadly autonomous.', e: 'claude --permission-mode acceptEdits' },
  ],
},
'k-slash': {
  lead: 'A slash command is a markdown file. Drop it in a folder and it becomes a command you can type. That is the entire mechanism.',
  items: [
    { n: '.claude/commands/', d: 'The folder. A file named triage.md becomes the command /triage.', e: '.claude/commands/triage.md' },
    { n: 'frontmatter', d: 'The `---` block at the top holding the description shown in the command list.', e: '---\ndescription: Triage an issue\n---' },
    { n: '$1, $2', d: 'Placeholders for arguments you type after the command.', e: '/triage 4471   → $1 becomes 4471' },
    { n: 'output style', d: 'A different setting: it changes the voice of a whole session, not what one command does.', e: '/output-style explanatory' },
  ],
},
'k-skills': {
  lead: 'A Skill is a folder with a SKILL.md inside. Claude loads it only when it is relevant, so deep expertise costs nothing until you need it.',
  items: [
    { n: 'SKILL.md', d: 'The instructions. Everything below the frontmatter is what Claude reads once the skill fires.', e: 'skills/incident-report/SKILL.md' },
    { n: 'description', d: 'The most important line in the file — it decides whether the skill loads at all. List the literal words a user would say.', e: 'description: Use when the user says postmortem, RCA, outage…' },
    { n: 'on demand', d: 'Why it scales: the body is not in context until the description matches. Ten skills cost about as much as none.', e: '(nothing to type — it just loads)' },
    { n: 'bundled scripts', d: 'Files next to SKILL.md that Claude can run. The model handles judgement; scripts handle the parts that must be exact.', e: 'scripts/lint_report.py' },
  ],
},
'k-hooks': {
  lead: 'A hook is one of your own shell commands that Claude Code runs at a fixed moment. Because it is a real command with an exit code, it enforces rather than asks.',
  items: [
    { n: 'PreToolUse', d: 'Runs before a tool call. Exit non-zero and the call is blocked — no negotiating.', e: 'exit 1   # the edit never happens' },
    { n: 'PostToolUse', d: 'Runs after. Where format-on-write and re-run-the-typechecker go.', e: 'pnpm biome format --write "$FILE"' },
    { n: 'SessionStart', d: 'Runs when a session opens. Installs deps and starts your database, so a fresh cloud session works on turn one.', e: 'pnpm i && docker compose up -d db' },
    { n: 'matcher', d: 'Which tools the hook applies to. A regex against the tool name.', e: '"matcher": "Edit|Write"' },
    { n: 'exit code', d: 'The whole point. 0 means proceed; non-zero means stop. An instruction is a request, an exit code is a guarantee.', e: 'exit 0  → allowed     exit 1  → blocked' },
  ],
},
'k-plugins': {
  lead: 'A plugin is one installable bundle holding skills, commands, hooks, subagents and MCP servers together — because those pieces are usually only useful as a set.',
  items: [
    { n: 'plugin.json', d: 'The manifest — name, version, description. The version is what lets you pin and roll back.', e: '.claude-plugin/plugin.json' },
    { n: 'marketplace', d: 'A repo listing plugins so a teammate installs instead of rediscovering your setup.', e: '/plugin marketplace add your-org/tooling' },
    { n: '/plugin', d: 'The command to browse, install and update them.', e: '/plugin install team-workflow' },
    { n: 'treat it as a dependency', d: 'A third-party plugin runs code and instructions in your repo with your permissions. Review it like any other package.', e: '(read the SKILL.md and hooks before installing)' },
  ],
},
'k-review': {
  lead: 'Automated review is a first pass, not a replacement. Point it at mechanical things at scale so humans keep their attention for intent and architecture.',
  items: [
    { n: '/code-review', d: 'Reviews the current diff for correctness bugs and cleanups.', e: '/code-review high' },
    { n: '/security-review', d: 'A separate adversarial pass looking for a different catalogue — injection, authz gaps, secrets, path traversal.', e: '/security-review' },
    { n: 'failure scenario', d: 'Requiring concrete inputs that trigger each claimed bug. The cheapest false-positive filter there is.', e: '"…given an empty cart, line 88 divides by zero"' },
    { n: 'review in-branch', d: 'Run it before the PR exists. The same finding costs minutes there and a round trip afterwards.', e: 'claude "review the diff against origin/main"' },
  ],
},
'k-remote': {
  lead: 'Sessions can run without your terminal open — in the background, in the cloud, several at once. The constraint stops being Claude and becomes how clearly you can specify a task.',
  items: [
    { n: '--background', d: 'Start detached. It keeps working after you close the terminal.', e: 'claude --background "bump minor deps"' },
    { n: 'claude logs / stop / rm', d: 'Lifecycle for background sessions — check on one, halt it, clean it up.', e: 'claude logs sess_01H…' },
    { n: 'git worktree', d: 'A second checkout of the same repo on another branch, so two sessions never fight over one working tree.', e: 'git worktree add ../wt-deps -b chore/deps' },
    { n: 'ephemeral container', d: 'Cloud sessions get a fresh clone that is thrown away. Anything not committed and pushed is gone.', e: '(commit and push before you walk away)' },
  ],
},


// ── agents ────────────────────────────────────────────────────────────────
'a-tools': {
  lead: 'A tool is a function you own. You describe it, the model asks you to run it, you run it and send back the result. That exchange is what every agent is built from.',
  items: [
    { n: 'input_schema', d: 'A JSON Schema saying what arguments the tool takes. This is how the model knows what to send.', e: '{"type": "object", "properties": {"sql": {"type": "string"}}}' },
    { n: 'description', d: 'The only thing the model knows about when to use the tool. Say what it does, when not to use it, and what comes back.', e: '"Read-only SELECT. NOT for writes — use apply_migration."' },
    { n: 'tool_use', d: 'The block in the reply saying "please run this, with these arguments".', e: '{"type": "tool_use", "name": "query_orders", "input": {…}}' },
    { n: 'tool_result', d: 'What you send back, tagged with the id you were given. Failures still need one, marked is_error.', e: '{"type": "tool_result", "tool_use_id": "toolu_01…", "content": …}' },
    { n: 'parallel tool use', d: 'One reply can ask for several tools at once. Return every result in ONE message — splitting them trains the model out of doing it.', e: '{"role": "user", "content": [result1, result2, result3]}' },
    { n: 'strict', d: 'Guarantees the arguments match your schema exactly. Needs additionalProperties: false.', e: '"strict": true' },
  ],
},
'a-servertools': {
  lead: 'Server tools run on Anthropic\'s machines. You list them and the results arrive in the same reply — there is no loop for you to write.',
  items: [
    { n: 'web_search_20260209', d: 'Lets Claude search the web. The dated suffix is the version; prefer the newest your model supports.', e: '{"type": "web_search_20260209", "name": "web_search"}' },
    { n: 'web_fetch_20260209', d: 'Retrieves a URL — but only one already in the conversation. It cannot discover links, so pair it with search.', e: '{"type": "web_fetch_20260209", "name": "web_fetch"}' },
    { n: 'code_execution_20260521', d: 'A real Python sandbox. How Claude does arithmetic that is actually right, parses a real CSV, and builds real files.', e: '{"type": "code_execution_20260521", "name": "code_execution"}' },
    { n: 'max_uses', d: 'A cap on how many times one request may call it. Your guard against a runaway loop.', e: '"max_uses": 5' },
    { n: 'errors return 200', d: 'A failed server tool does not raise. You get HTTP 200 and an error object in the result block — check for it.', e: 'if not isinstance(block.content, list): # it errored' },
  ],
},
'a-mcp': {
  lead: 'MCP is a shared standard for plugging tools into models. Write a connector once and every MCP-speaking client can use it — including ones that do not exist yet.',
  items: [
    { n: '.mcp.json', d: 'The file in your repo listing servers. Commit it and the whole team gets the same connections.', e: '{"mcpServers": {"grafana": {"command": "npx", …}}}' },
    { n: 'server', d: 'The thing exposing tools — a local process or a URL. Your deploy system, Jira, a database.', e: '{"type": "url", "url": "https://mcp.internal/deploy"}' },
    { n: 'mcp_toolset', d: 'The second half on the API. Listing the server alone is a validation error; you need this too.', e: '{"type": "mcp_toolset", "mcp_server_name": "deploy"}' },
    { n: 'task-shaped tools', d: 'Name tools after what a person wants, not after your REST endpoints. Three good ones beat forty CRUD ones.', e: 'find_customer ✓   GET /api/v2/customers ✗' },
    { n: 'defer_loading', d: 'For servers with many tools: load definitions on demand instead of filling context up front.', e: '"defer_loading": true' },
  ],
},
'a-subagents': {
  lead: 'A subagent is a second Claude with its own context window. It does a job and hands back a conclusion — the eighty files it read never enter your conversation.',
  items: [
    { n: 'agent file', d: 'A markdown file defining one. Frontmatter sets its name, tools and model; the body is its instructions.', e: '.claude/agents/dependency-tracer.md' },
    { n: 'tools:', d: 'Which tools it may use. Leave out Write and Bash and it physically cannot change anything.', e: 'tools: Read, Grep, Glob' },
    { n: 'model:', d: 'Subagents can run a cheaper model than the parent. Correct sizing, not a downgrade.', e: 'model: haiku' },
    { n: 'context isolation', d: 'The actual point. Not speed — the mess stays in the subagent\'s window instead of yours.', e: 'reads 200K tokens → returns 3 sentences' },
    { n: 'starts cold', d: 'The cost. It knows nothing you know, so a task needing deep shared context is better done inline.', e: 'big input + small output = delegate' },
  ],
},
'a-runner': {
  lead: 'Every agent is a while-loop around one API call. Write it by hand once and you can judge any framework that claims to replace it.',
  items: [
    { n: 'stop_reason', d: 'Why the model stopped. "tool_use" means it wants a tool; anything else means it is done.', e: 'if resp.stop_reason != "tool_use": break' },
    { n: 'the loop', d: 'Send, check stop_reason, run the tools, append results, repeat. That is the whole thing.', e: 'while True: … msgs.append(results)' },
    { n: 'tool_runner', d: 'The SDK driving that loop over tools you define — and it keeps the per-turn hooks, so you keep control.', e: 'client.beta.messages.tool_runner(…)' },
    { n: '@beta_tool', d: 'A decorator that turns a normal Python function into a tool. The docstring becomes the description.', e: '@beta_tool\ndef query_orders(sql: str) -> str: …' },
    { n: 'harness vs. hosting', d: 'Two separate questions. Tool Runner and the Agent SDK give you a harness; only Managed Agents also hosts it.', e: 'manual → runner → Agent SDK → Managed Agents' },
  ],
},
'a-teams': {
  lead: 'Several agents working toward one outcome — a lead that splits the work, workers that specialise. They fail at the handoffs, not at the workers.',
  items: [
    { n: 'lead', d: 'The agent that decomposes the job, delegates, and reconciles what comes back.', e: '(usually your expensive model)' },
    { n: 'worker', d: 'A specialist doing one bounded piece. Reading-heavy work belongs on a cheaper model.', e: 'security-reviewer, haiku, read-only' },
    { n: 'the contract', d: 'What the handoff must carry: scope, what to return, what is out of scope, and what to do when blocked instead of guessing.', e: 'RETURN: JSON array. BLOCKED: emit {"needs": …}' },
    { n: 'roster', d: 'In Managed Agents, the list of who a lead may delegate to — copies of itself, or other agents by ID.', e: '[{"type": "self"}, {"agent_id": "agt_01…"}]' },
    { n: 'cost the coordination', d: 'If writing the handoff takes longer than doing the task, do the task. Two agents with clean contracts beat six with fuzzy ones.', e: '' },
  ],
},
'a-sdk': {
  lead: 'The Claude Agent SDK is Claude Code as a library — the file, shell and search tools plus the loop, permissions and context handling, importable into your own product.',
  items: [
    { n: 'query()', d: 'The entry point. Give it a prompt and options; it drives everything and streams messages back.', e: 'async for msg in query(prompt=…, options=…): …' },
    { n: 'ClaudeAgentOptions', d: 'The configuration — working directory, which tools are allowed, permission posture, system prompt.', e: 'ClaudeAgentOptions(cwd="/srv/checkout", …)' },
    { n: 'allowed_tools', d: 'The list it may use. Your main blast-radius control.', e: 'allowed_tools=["Read", "Edit", "Bash"]' },
    { n: 'when NOT to use it', d: 'If every tool is an HTTP call to your own backend, the built-in file tools are dead weight — use Tool Runner.', e: '' },
    { n: 'different from Tool Runner', d: 'Similar names, separate packages. Tool Runner has no built-in tools; this has the whole Claude Code toolset.', e: 'claude-agent-sdk  ≠  anthropic' },
  ],
},
'a-managed': {
  lead: 'The one option where Anthropic runs the loop AND hosts the container your tools execute in. You define an agent once, then start sessions against it.',
  items: [
    { n: 'agent', d: 'A durable, versioned config: model, system prompt, tools. Create once and store the ID.', e: 'client.beta.agents.create(name="nightly-triage", …)' },
    { n: 'session', d: 'One disposable run of that agent. No model or tools here — those live on the agent.', e: 'client.beta.sessions.create(agent_id=…)' },
    { n: 'the classic mistake', d: 'Calling agents.create() on every request. That makes a new agent each time and throws away versioning entirely.', e: '✗ agent = agents.create(…) inside your handler' },
    { n: 'budget', d: 'A hard cap in real dollars. What makes an unattended agent safe to leave running.', e: 'budget={"type": "usd", "total": 5.00}' },
    { n: 'vault credentials', d: 'Secrets Anthropic stores and swaps in at the network edge, so they never enter the sandbox at all.', e: '(referenced by name, never by value)' },
  ],
},
'a-scheduled': {
  lead: 'Agents that start themselves on a schedule. Nothing else changes except the most important thing: nobody is watching.',
  items: [
    { n: 'cron expression', d: 'Five fields saying when to fire, in UTC. Convert from your local time first.', e: '0 6 * * 1-5   → 06:00 UTC, weekdays' },
    { n: 'fresh vs. bound', d: 'A new session each firing needs a fully standalone prompt. One bound to an existing session continues a conversation.', e: 'nightly report → fresh   ·   ongoing watch → bound' },
    { n: 'structured output', d: 'Make results checkable by a program, since no person is reading them.', e: '{"status": "ok" | "anomaly", "findings": [...]}' },
    { n: 'notify on anomaly', d: 'Alert when something is wrong, not when a run finishes. A green run should be silent so a notification always means something.', e: 'if status != "ok": page()' },
    { n: 'start read-only', d: 'Observe → propose → act-with-approval → act. Skipping ahead means finding your spec gaps in production.', e: '"Take NO action. Open no tickets."' },
  ],
},


// ── craft ─────────────────────────────────────────────────────────────────
'f-artifacts': {
  lead: 'An artifact is a real web page at its own URL, instead of output that scrolls away in a chat. It starts private; you decide whether to share it.',
  items: [
    { n: 'artifact', d: 'A hosted page — an app, report, dashboard or game — that you can send someone as a link.', e: '(ask for "an artifact" or "a page")' },
    { n: 'same path, same URL', d: 'Republishing updates in place. The link never breaks, so it is a living document rather than a snapshot.', e: '' },
    { n: 'CDN allowlist', d: 'Only a few script hosts are permitted; images, fonts and fetches must be inlined or embedded.', e: 'cdnjs.cloudflare.com ✓   unpkg.com ✗' },
    { n: 'theme-aware', d: 'The page renders in the reader\'s theme. Define colours as tokens for both, or half your audience sees it broken.', e: ':root { --bg: … }  then override for dark' },
  ],
},
'f-docs': {
  lead: 'Claude makes genuine Office files, not markdown that looks like them — and reads them too.',
  items: [
    { n: '.docx / .pptx / .xlsx', d: 'Real Word, PowerPoint and Excel files, built in the sandbox and handed back to you.', e: '"give me the summary as a .docx"' },
    { n: '.dotx / .potx', d: 'Template files. Supply one and the output inherits your real branding instead of default Calibri.', e: '"build the deck from brand-template.potx"' },
    { n: 'the libraries', d: 'What actually builds them — python-docx, python-pptx, matplotlib, pypdf, all preinstalled in the sandbox.', e: '' },
    { n: 'reading them', d: 'The half people forget: pulling tables out of a 100-page PDF or fixing a sheet whose headers start on row 7.', e: '"headers start at row 7; dates are text"' },
  ],
},
'f-viz': {
  lead: 'A chart is an argument. Decide what the reader should conclude in three seconds, and the right chart follows from that.',
  items: [
    { n: 'the takeaway sentence', d: 'Write it before any chart code. If you cannot write it, you do not yet have a chart.', e: '"EU latency regressed after v4.2; US did not"' },
    { n: 'direct labelling', d: 'Putting the series name on the line instead of in a legend, so the eye does not have to travel.', e: '' },
    { n: 'truncated axis', d: 'Starting y above zero to make a small change look dramatic. The most common way a chart misleads.', e: 'y from 0 ✓   y from 94% ✗' },
    { n: 'redundant encoding', d: 'Colour AND dash pattern, so the chart survives colour-blindness and greyscale printing.', e: 'stroke-dasharray plus hue' },
    { n: 'theme-aware gridlines', d: 'Hard-coded #eee vanishes on a dark background. Read colours from CSS variables.', e: 'stroke: var(--grid)' },
  ],
},
'f-design': {
  lead: 'Consistency is a memory problem, which models are good at. Hand over real tokens and rules and every output sits inside them.',
  items: [
    { n: 'design token', d: 'A named value used everywhere instead of a literal — one accent colour, not fourteen similar purples.', e: '--accent: #6b57d2' },
    { n: 'type scale', d: 'A fixed set of sizes. Five steps you keep beats fifteen you improvise.', e: '40 / 28 / 20 / 15 / 13' },
    { n: 'checkable rule', d: 'A constraint with an observable violation. "Modern and clean" has none; a contrast ratio does.', e: 'body contrast ≥ 7:1' },
    { n: 'ship it as a skill', d: 'Put the system where it loads automatically. A style guide nobody pastes in does not exist.', e: 'skills/brand-system/SKILL.md' },
  ],
},
'f-canvas': {
  lead: 'Some changes are faster to do than to describe. The model drafts the structure; you nudge the details directly.',
  items: [
    { n: 'artboard', d: 'One design surface on a shared canvas — a screen, a poster, a page. Several sit side by side.', e: '4 artboards = 4 layout options' },
    { n: 'canvas', d: 'The pan-and-zoom space holding them, so you compare variations rather than one at a time.', e: '' },
    { n: 'ask for variations', d: 'The model is cheap at breadth. Four structurally different takes beat one polished draft.', e: '"same copy, four different structures"' },
    { n: 'generate then manipulate', d: 'Prompt for the draft, adjust by hand. Each side does what it is fast at.', e: '' },
  ],
},
'f-capabilities': {
  lead: 'Capabilities are what a published page can do beyond static HTML — remember things, share state between viewers, even ask Claude a question at runtime.',
  items: [
    { n: 'localStorage', d: 'Per-viewer, per-browser memory. Right for a remembered tab; wrong for anything shared.', e: 'localStorage.setItem("tab", "overview")' },
    { n: 'try/catch it', d: 'Storage can be empty, and in private windows it throws outright. Always guard it.', e: 'try { … } catch { render(default) }' },
    { n: 'shared state', d: 'A capability where everyone sees one copy — a poll tally, a checklist several people tick.', e: 'one vote count, not one per browser' },
    { n: 'calling Claude at runtime', d: 'The qualitative jump: the page stops being a rendered answer and becomes something that can answer.', e: 'a dashboard that explains its own spike' },
  ],
},
'f-generative': {
  lead: 'The deliverable is a generator, not a picture. A program whose knobs and seed define a space of outputs you then explore.',
  items: [
    { n: 'seed', d: 'The number that makes randomness repeatable. Without it, a result you liked is gone forever.', e: 'let SEED = 20260831;' },
    { n: 'parameter', d: 'A named knob with real meaning, not a magic number buried in the code.', e: 'fieldScale: 0.0032   // wisps ↔ broad currents' },
    { n: 'sweeping one axis', d: 'Fix the seed, vary one knob. Now you can actually see what that knob controls.', e: 'for (s of [0.001, 0.002, 0.004]) render({…P, fieldScale: s})' },
    { n: 'p5.js', d: 'The usual library for this — a small drawing API that makes the iteration loop tight.', e: '' },
  ],
},

// ── scale ─────────────────────────────────────────────────────────────────
's-models': {
  lead: 'Four models at different price and capability points. The IDs are exact strings — adding a date suffix is a habit from older models and now fails.',
  items: [
    { n: 'claude-fable-5', d: 'The most capable. Hardest reasoning and long-horizon agent work. $10 / $50 per million tokens in / out.', e: 'model="claude-fable-5"' },
    { n: 'claude-opus-5', d: 'The strong default. $5 / $25.', e: 'model="claude-opus-5"' },
    { n: 'claude-sonnet-5', d: 'Balanced. $2 / $10.', e: 'model="claude-sonnet-5"' },
    { n: 'claude-haiku-4-5', d: 'Fast and cheap, $1 / $5 — and the only one with a 200K rather than 1M context window.', e: 'model="claude-haiku-4-5"' },
    { n: 'no date suffix', d: 'The IDs above are complete. Appending a date is a recalled pattern that returns an error.', e: '✗ "claude-sonnet-5-20251114"' },
  ],
},
's-structured': {
  lead: 'Structured outputs constrain the reply to a shape your code can parse, instead of hoping for valid JSON.',
  items: [
    { n: 'output_config.format', d: 'Where you attach the schema the response must match.', e: 'output_config={"format": {"type": "json_schema", …}}' },
    { n: 'messages.parse()', d: 'The recommended call — it validates the response against your schema for you.', e: 'client.messages.parse(…)' },
    { n: 'field names are instructions', d: 'The model reads them. confidence_0_to_1 gets better-calibrated numbers than score.', e: '"evidence_quote"  beats  "notes"' },
    { n: 'the escape hatch', d: 'Always allow "unknown". A schema with no way to say "I could not tell" forces a made-up value into a field you will trust.', e: '"severity": {"enum": […, "cannot_determine"]}' },
    { n: 'not with citations', d: 'Structured outputs and citations cannot be combined in one call — it is a 400. Use two calls.', e: '' },
  ],
},
's-batch': {
  lead: 'Batching runs requests asynchronously for half the price. If you do not need the answer this second, you are overpaying.',
  items: [
    { n: 'Message Batches API', d: 'Submit many requests at once, collect them later. 50% off, no quality difference.', e: 'client.messages.batches.create(requests=[…])' },
    { n: 'custom_id', d: 'Your label on each request. The only reliable way to match results back to inputs.', e: 'custom_id=doc.id' },
    { n: 'results arrive in any order', d: 'The rule that bites everyone. Zipping results against inputs passes small tests and corrupts data at scale.', e: '✗ zip(docs, results)     ✓ out[r.custom_id]' },
    { n: 'result.type', d: 'Four outcomes, not one: succeeded, errored, canceled, expired. Handle all of them.', e: 'if r.result.type == "succeeded": …' },
    { n: 'Files API', d: 'The companion. Upload once, reference by ID, stop re-sending the same document.', e: 'client.files.upload(…)' },
  ],
},
's-cost': {
  lead: 'There is a correct order. The early levers cost nothing in quality; the later ones do. Do them in this sequence.',
  items: [
    { n: '1 · caching', d: 'Usually the single biggest lever, and free — it changes nothing about the output.', e: 'often 40-70% off, on its own' },
    { n: '2 · batching', d: 'Half price for anything that does not need an answer right now.', e: '−50%' },
    { n: '3 · effort', d: 'The first lever that actually trades quality. Try lower effort on a current model before a cheaper model.', e: '"effort": "low"' },
    { n: '4 · a cheaper model', d: 'Last, and measure it. Caches are per-model, so a multi-model cascade also loses cache reuse.', e: '' },
    { n: 'cost per completed task', d: 'The number that matters. A cheap request that needs three retries is not cheap.', e: 'not cost per request' },
  ],
},
's-evals': {
  lead: 'An eval is a fixed set of inputs with known-good properties, scored automatically. It is what turns prompt changes from guessing into engineering.',
  items: [
    { n: 'a case', d: 'One input plus what a good answer looks like. Twenty real ones beat two hundred invented ones.', e: '' },
    { n: 'deterministic check', d: 'The cheap layer — valid schema, required fields, under budget, under latency. Never drifts.', e: 'if not schema_valid(out): fail()' },
    { n: 'judge', d: 'The expensive layer, for genuinely subjective dimensions. Binary criteria, never a 1-10 score.', e: '5 × true/false' },
    { n: 'the gate', d: 'Wiring it into CI so it blocks a merge. An eval you run when you remember is a document, not a control.', e: 'assert pass_rate >= BASELINE - 0.02' },
    { n: 'the compounding habit', d: 'Every production failure becomes a permanent case. This beats any prompt technique.', e: '' },
  ],
},
's-guardrails': {
  lead: 'The unhappy paths. The important one: a refusal is not an exception — it is a normal 200 response, and it is the path nobody tests.',
  items: [
    { n: 'stop_reason', d: 'Why generation ended. Check it before you read the content, every time.', e: 'if resp.stop_reason == "refusal": …' },
    { n: '"refusal"', d: 'A safety classifier declined. HTTP 200, nothing raised. Read content blindly and you hand users an empty string.', e: '' },
    { n: '"max_tokens"', d: 'It was cut off mid-thought. Do not parse this as a complete answer.', e: '' },
    { n: 'stop_details', d: 'The refusal category. Populated only on a refusal — null for every other stop reason.', e: 'resp.stop_details.category' },
    { n: 'server-side fallbacks', d: 'Let Anthropic reroute a refusal by category so you maintain no model list.', e: 'fallbacks="default"' },
    { n: 'untrusted input', d: 'Instructions inside a document, web page or PR comment are data, not commands.', e: '' },
  ],
},
's-observability': {
  lead: 'You cannot re-run a request and get the same answer, so whatever you failed to record at the time is gone. Capture is the whole game.',
  items: [
    { n: 'usage', d: 'The highest-signal object you get back — tokens in, out, cached, written.', e: 'resp.usage.cache_read_input_tokens' },
    { n: 'log the config', d: 'Model, effort, thinking settings, hashes of your tools and system prompt. Most quality shifts are a config change nobody connected.', e: '"tools_hash": stable_hash(TOOLS)' },
    { n: 'cache hit rate', d: 'The alert worth having. It collapses the day someone adds a timestamp to a system prompt, and nothing else tells you.', e: 'cache_read / (input + cache_read)' },
    { n: 'Admin API', d: 'Org-level: members, workspaces, keys, rate limits. Needs an admin key — a normal API key is rejected.', e: 'client.beta.organization…' },
  ],
},
's-deploy': {
  lead: 'The same model on a different cloud is not the same product. Features, pricing and client code all diverge — assuming parity is what breaks in week three.',
  items: [
    { n: 'dedicated client', d: 'Use the real class, never the first-party client with a swapped base_url.', e: 'AnthropicBedrockMantle() / AnthropicVertex()' },
    { n: 'model ID differs', d: 'Bedrock prefixes them; Vertex uses @ for dated snapshots instead of a hyphen.', e: 'anthropic.claude-opus-5   ·   claude-opus-4-5@20251101' },
    { n: 'feature gaps', d: 'Fast mode is first-party only. Vertex has no web fetch. Managed Agents is not on any partner cloud.', e: 'verify before you design around it' },
    { n: 'WIF', d: 'Workload Identity Federation — short-lived credentials instead of a long-lived API key.', e: '(zero-arg client auto-detects it)' },
    { n: 'the WIF gotcha', d: 'ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN or ANTHROPIC_PROFILE silently outrank it. Unset all three.', e: 'unset ANTHROPIC_API_KEY' },
    { n: 'inference_geo', d: 'Pins which region runs inference, for data-residency rules.', e: 'inference_geo="us"' },
  ],
},


'r-judge': {
  lead: 'Using a model to grade model output. The one thing that makes iteration measurable — and the technique most often built wrong, in one specific way.',
  items: [
    { n: 'rubric', d: 'The checklist the judge scores against. Written once, applied identically to every candidate.', e: '1. grounded  2. complete  3. no_invention' },
    { n: 'binary criteria', d: 'Each check is true/false, not a rating. Five of them give a 0-5 score you can actually debug.', e: '"grounded": true' },
    { n: 'the 1-10 trap', d: 'Scalar scores from models are poorly calibrated, drift between runs, and cluster around 7. They feel like measurement and are not.', e: '✗ "rate the quality 1-10"' },
    { n: 'position bias', d: 'Judges prefer whichever candidate came second, and prefer longer answers. Score one at a time against the rubric.', e: '' },
    { n: 'hide the provenance', d: 'Never let the judge see which prompt or model produced a candidate. It leaks into the score even when you say not to.', e: '' },
  ],
},
'c-retrieval': {
  lead: 'Fetching only the relevant documents instead of sending everything. With a 1M window this is now a choice rather than a requirement.',
  items: [
    { n: 'RAG', d: 'Retrieval-Augmented Generation — look up relevant text first, then hand it to the model with the question.', e: '' },
    { n: 'chunk', d: 'A slice of a document, small enough to index. Also where the classic failure lives: the answer split across two of them.', e: '~500 tokens per slice' },
    { n: 'embedding', d: 'A document turned into a list of numbers so "similar meaning" becomes "close together".', e: '' },
    { n: 'vector database', d: 'Stores those numbers and finds the nearest ones. Increasingly optional for corpora that simply fit in the window.', e: '' },
    { n: 'BM25', d: 'Old-fashioned keyword ranking. Cheap, no embeddings, and often enough to pick which whole documents to send.', e: 'doc_ids = bm25_top_k(query, k=5)' },
    { n: 'coarse retrieval', d: 'Return whole documents, not fragments, and let the long window read them. Chunk-boundary errors disappear entirely.', e: '5 whole docs  beats  8 tight chunks' },
  ],
},

};
