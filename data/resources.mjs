// Reference material per node: where to go deeper.
//
// Every URL here is machine-checked by tools/check-links.mjs, which CI runs
// weekly — link rot is the failure mode this file is most exposed to, so it is
// verified rather than trusted. Paths were taken from the publishers' own
// sitemaps rather than guessed.
//
// `src` is the real publisher, not the topic's owner. A conference talk given
// by an Anthropic engineer is labelled as the conference's, because that is
// whose channel it is on; several popular "official Anthropic" videos turn out
// to be third-party re-uploads and are deliberately absent.
//
// kinds:  docs · canonical reference   post · engineering write-up
//         guide · task-oriented help    talk · recorded session

const P = 'https://platform.claude.com/docs/en/';
const C = 'https://code.claude.com/docs/en/';
const E = 'https://www.anthropic.com/engineering/';
const S = 'https://support.claude.com/en/articles/';
const Y = 'https://www.youtube.com/watch?v=';

const d = (t, u) => ({ k: 'docs',  t, u: P + u, src: 'Claude Docs' });
const c = (t, u) => ({ k: 'docs',  t, u: C + u, src: 'Claude Code Docs' });
const e = (t, u) => ({ k: 'post',  t, u: E + u, src: 'Anthropic Engineering' });
const s = (t, u) => ({ k: 'guide', t, u: S + u, src: 'Claude Help Center' });
const y = (t, u, src) => ({ k: 'talk', t, u: Y + u, src });

export const resources = {
  // ── reasoning ───────────────────────────────────────────────────────────
  'r-ask': [
    d('Prompt engineering overview', 'build-with-claude/prompt-engineering/overview'),
    d('Claude prompting best practices', 'build-with-claude/prompt-engineering/claude-prompting-best-practices'),
    s('Introduction to prompt design', '7996853-introduction-to-prompt-design'),
  ],
  'r-frame': [
    d('Prompting Claude Opus 5', 'build-with-claude/prompt-engineering/prompting-claude-opus-5'),
    c('Output styles', 'output-styles'),
    d('Use case guides', 'about-claude/use-case-guides/overview'),
  ],
  'r-examples': [
    d('Prompt engineering overview', 'build-with-claude/prompt-engineering/overview'),
    d('Ticket routing — a worked classification guide', 'about-claude/use-case-guides/ticket-routing'),
    c('Prompt library', 'prompt-library'),
  ],
  'r-critique': [
    d('Increase output consistency', 'test-and-evaluate/strengthen-guardrails/increase-consistency'),
    e('Demystifying evals for AI agents', 'demystifying-evals-for-ai-agents'),
    c('Ultrareview — a deep, adversarial review pass', 'ultrareview'),
  ],
  'r-thinking': [
    d('Extended thinking', 'build-with-claude/extended-thinking'),
    d('Thinking', 'build-with-claude/thinking'),
    e('The "think" tool', 'claude-think-tool'),
    d('Thinking troubleshooting', 'build-with-claude/thinking-troubleshooting'),
  ],
  'r-effort': [
    d('Effort', 'build-with-claude/effort'),
    d('Thinking, steering and cost', 'build-with-claude/thinking-steering-and-cost'),
    d('Changing effort mid-conversation', 'build-with-claude/mid-conversation-effort-example'),
  ],
  'r-decompose': [
    e('Building effective agents', 'building-effective-agents'),
    e('Effective harnesses for long-running agents', 'effective-harnesses-for-long-running-agents'),
    c('Common workflows', 'common-workflows'),
  ],
  'r-judge': [
    e('Demystifying evals for AI agents', 'demystifying-evals-for-ai-agents'),
    e('AI-resistant technical evaluations', 'AI-resistant-technical-evaluations'),
    d('Develop tests', 'test-and-evaluate/develop-tests'),
  ],
  'r-archaeology': [
    d('Model migration guide', 'about-claude/models/migration-guide'),
    d('Opus 5 migration guide', 'models/opus-5/migration-guide'),
    d('Model deprecations', 'about-claude/model-deprecations'),
    d("What's new in Opus 5", 'models/opus-5/whats-new-opus-5'),
  ],

  // ── context ─────────────────────────────────────────────────────────────
  'c-files': [
    d('Vision', 'build-with-claude/vision'),
    d('PDF support', 'build-with-claude/pdf-support'),
    d('Files API', 'build-with-claude/files'),
    s('Upload files to Claude', '8241126-upload-files-to-claude'),
  ],
  'c-projects': [
    s('What are Projects', '9517075-what-are-projects'),
    c('Memory and CLAUDE.md', 'memory'),
    d('Mid-conversation system messages', 'build-with-claude/mid-conversation-system-messages'),
  ],
  'c-memory': [
    d('Memory tool', 'agents-and-tools/tool-use/memory-tool'),
    d('Memory in Managed Agents', 'managed-agents/memory'),
    e('Effective context engineering for AI agents', 'effective-context-engineering-for-ai-agents'),
    s('Chat search and memory', '11817273-use-claude-s-chat-search-and-memory-to-build-on-previous-context'),
  ],
  'c-citations': [
    d('Citations', 'build-with-claude/citations'),
    d('Search results', 'build-with-claude/search-results'),
    d('Reduce hallucinations', 'test-and-evaluate/strengthen-guardrails/reduce-hallucinations'),
  ],
  'c-longctx': [
    d('Context windows', 'build-with-claude/context-windows'),
    e('Effective context engineering for AI agents', 'effective-context-engineering-for-ai-agents'),
    c('Context window', 'context-window'),
  ],
  'c-cache': [
    d('Prompt caching', 'build-with-claude/prompt-caching'),
    d('Cache diagnostics', 'build-with-claude/cache-diagnostics'),
    d('Tool use with prompt caching', 'agents-and-tools/tool-use/tool-use-with-prompt-caching'),
    c('Prompt caching in Claude Code', 'prompt-caching'),
  ],
  'c-editing': [
    d('Context editing', 'build-with-claude/context-editing'),
    d('Compaction', 'build-with-claude/compaction'),
    d('Manage tool context', 'agents-and-tools/tool-use/manage-tool-context'),
  ],
  'c-retrieval': [
    e('Contextual retrieval', 'contextual-retrieval'),
    d('Embeddings', 'build-with-claude/embeddings'),
    s('RAG for Projects', '11473015-retrieval-augmented-generation-rag-for-projects'),
  ],

  // ── code ────────────────────────────────────────────────────────────────
  'k-cli': [
    c('Claude Code overview', 'overview'),
    c('Quickstart', 'quickstart'),
    c('Best practices', 'best-practices'),
    c('Common workflows', 'common-workflows'),
  ],
  'k-claudemd': [
    c('Memory and CLAUDE.md', 'memory'),
    c('Working with large codebases', 'large-codebases'),
    c('Settings', 'settings'),
  ],
  'k-permissions': [
    c('Permissions', 'permissions'),
    c('Permission modes', 'permission-modes'),
    e('Claude Code sandboxing', 'claude-code-sandboxing'),
    c('Sandboxing', 'sandboxing'),
  ],
  'k-slash': [
    c('Slash commands', 'commands'),
    c('Output styles', 'output-styles'),
    c('Settings', 'settings'),
  ],
  'k-skills': [
    d('Agent Skills overview', 'agents-and-tools/agent-skills/overview'),
    d('Agent Skills best practices', 'agents-and-tools/agent-skills/best-practices'),
    e('Equipping agents for the real world with Agent Skills', 'equipping-agents-for-the-real-world-with-agent-skills'),
    s('How to create custom Skills', '12512198-how-to-create-custom-skills'),
  ],
  'k-hooks': [
    c('Hooks guide', 'hooks-guide'),
    c('Hooks reference', 'hooks'),
    c('Agent SDK hooks', 'agent-sdk/hooks'),
  ],
  'k-plugins': [
    c('Plugins', 'plugins'),
    c('Plugin marketplaces', 'plugin-marketplaces'),
    c('Plugins reference', 'plugins-reference'),
    s('Browse Skills, connectors and plugins', '14328846-browse-skills-connectors-and-plugins-in-one-directory'),
  ],
  'k-review': [
    c('Code review', 'code-review'),
    c('Ultrareview', 'ultrareview'),
    c('GitHub Actions', 'github-actions'),
    c('Security guidance', 'security-guidance'),
  ],
  'k-remote': [
    c('Claude Code on the web', 'claude-code-on-the-web'),
    c('Worktrees', 'worktrees'),
    c('Headless mode', 'headless'),
    e('Claude Code auto mode', 'claude-code-auto-mode'),
    c('Remote control', 'remote-control'),
  ],

  // ── agents ──────────────────────────────────────────────────────────────
  'a-tools': [
    d('Tool use overview', 'agents-and-tools/tool-use/overview'),
    d('How tool use works', 'agents-and-tools/tool-use/how-tool-use-works'),
    e('Writing tools for agents', 'writing-tools-for-agents'),
    d('Parallel tool use', 'agents-and-tools/tool-use/parallel-tool-use'),
  ],
  'a-servertools': [
    d('Server tools', 'agents-and-tools/tool-use/server-tools'),
    d('Web search tool', 'agents-and-tools/tool-use/web-search-tool'),
    d('Code execution tool', 'agents-and-tools/tool-use/code-execution-tool'),
    e('Advanced tool use', 'advanced-tool-use'),
  ],
  'a-mcp': [
    d('MCP connector', 'agents-and-tools/mcp-connector'),
    c('MCP in Claude Code', 'mcp'),
    e('Code execution with MCP', 'code-execution-with-mcp'),
    d('Tool search tool', 'agents-and-tools/tool-use/tool-search-tool'),
    s('Custom connectors using remote MCP', '11175166-get-started-with-custom-connectors-using-remote-mcp'),
  ],
  'a-subagents': [
    c('Subagents', 'sub-agents'),
    c('Agent SDK subagents', 'agent-sdk/subagents'),
    c('Agents and agent configuration', 'agents'),
    e('How we built our multi-agent research system', 'multi-agent-research-system'),
  ],
  'a-runner': [
    d('Tool runner', 'agents-and-tools/tool-use/tool-runner'),
    e('Building effective agents', 'building-effective-agents'),
    c('The agent loop', 'agent-sdk/agent-loop'),
    d('Build a tool-using agent', 'agents-and-tools/tool-use/build-a-tool-using-agent'),
  ],
  'a-teams': [
    c('Agent teams', 'agent-teams'),
    e('How we built our multi-agent research system', 'multi-agent-research-system'),
    d('Multiagent orchestration', 'managed-agents/multiagent-orchestration'),
  ],
  'a-sdk': [
    c('Agent SDK overview', 'agent-sdk/overview'),
    c('Agent SDK quickstart', 'agent-sdk/quickstart'),
    c('Custom tools', 'agent-sdk/custom-tools'),
    y('Claude Agent SDK — full workshop (Thariq Shihipar, Anthropic)', 'TqC1qOfiVcQ', 'AI Engineer'),
  ],
  'a-managed': [
    d('Managed Agents overview', 'managed-agents/overview'),
    d('Managed Agents quickstart', 'managed-agents/quickstart'),
    e('Managed Agents', 'managed-agents'),
    d('Vaults — credentials that never enter the sandbox', 'managed-agents/vaults'),
  ],
  'a-scheduled': [
    d('Scheduled deployments', 'managed-agents/scheduled-deployments'),
    e('Effective harnesses for long-running agents', 'effective-harnesses-for-long-running-agents'),
    e('Harness design for long-running apps', 'harness-design-long-running-apps'),
    c('Routines', 'routines'),
  ],

  // ── craft ───────────────────────────────────────────────────────────────
  'f-artifacts': [
    s('What are Artifacts and how do I use them', '9487310-what-are-artifacts-and-how-do-i-use-them'),
    s('Publish and share Artifacts', '9547008-publish-and-share-artifacts'),
    c('Artifacts in Claude Code', 'artifacts'),
  ],
  'f-docs': [
    s('Create and edit files with Claude', '12111783-create-and-edit-files-with-claude'),
    { k: 'guide', t: 'Claude for Excel', u: 'https://claude.com/docs/office-agents/excel', src: 'Claude Docs' },
    d('Code execution tool — the sandbox that builds them', 'agents-and-tools/tool-use/code-execution-tool'),
  ],
  'f-viz': [
    s('Create and edit files with Claude', '12111783-create-and-edit-files-with-claude'),
    d('Code execution tool', 'agents-and-tools/tool-use/code-execution-tool'),
    c('Artifacts in Claude Code', 'artifacts'),
  ],
  'f-design': [
    s('What are Skills', '12512176-what-are-skills'),
    d('Agent Skills best practices', 'agents-and-tools/agent-skills/best-practices'),
    s('How to create custom Skills', '12512198-how-to-create-custom-skills'),
  ],
  'f-canvas': [
    s('What are Artifacts and how do I use them', '9487310-what-are-artifacts-and-how-do-i-use-them'),
    s('Live Artifacts', '14729249-use-live-artifacts-in-claude-cowork'),
    c('Artifacts in Claude Code', 'artifacts'),
  ],
  'f-capabilities': [
    s('Live Artifacts', '14729249-use-live-artifacts-in-claude-cowork'),
    c('Artifacts in Claude Code', 'artifacts'),
    s('Use connectors to extend Claude', '11176164-use-connectors-to-extend-claude-s-capabilities'),
  ],
  'f-longform': [
    s('What are Projects', '9517075-what-are-projects'),
    s('Create and edit files with Claude', '12111783-create-and-edit-files-with-claude'),
    d('Legal summarization — a long-document worked guide', 'about-claude/use-case-guides/legal-summarization'),
  ],
  'f-generative': [
    d('Code execution tool', 'agents-and-tools/tool-use/code-execution-tool'),
    c('Artifacts in Claude Code', 'artifacts'),
    s('Can Claude produce images', '9002504-can-claude-produce-images'),
  ],

  // ── scale ───────────────────────────────────────────────────────────────
  's-models': [
    d('Choosing a model', 'about-claude/models/choosing-a-model'),
    d('Models overview', 'models/overview'),
    d('Pricing', 'about-claude/pricing'),
    d('Model IDs and versions', 'about-claude/models/model-ids-and-versions'),
  ],
  's-structured': [
    d('Structured outputs', 'build-with-claude/structured-outputs'),
    d('Strict tool use', 'agents-and-tools/tool-use/strict-tool-use'),
    d('Define tools', 'agents-and-tools/tool-use/define-tools'),
  ],
  's-batch': [
    d('Batch processing', 'build-with-claude/batch-processing'),
    d('Files API', 'build-with-claude/files'),
    d('Token counting — size a batch before you submit it', 'build-with-claude/token-counting'),
  ],
  's-cost': [
    d('Optimizing for cost and intelligence', 'about-claude/models/optimizing-for-cost-and-intelligence'),
    d('Prompt caching', 'build-with-claude/prompt-caching'),
    c('Costs', 'costs'),
    d('Usage and cost API', 'manage-claude/usage-cost-api'),
  ],
  's-evals': [
    d('Develop tests', 'test-and-evaluate/develop-tests'),
    e('Demystifying evals for AI agents', 'demystifying-evals-for-ai-agents'),
    e('AI-resistant technical evaluations', 'AI-resistant-technical-evaluations'),
  ],
  's-guardrails': [
    d('Refusals and fallback', 'build-with-claude/refusals-and-fallback'),
    d('Handling stop reasons', 'build-with-claude/handling-stop-reasons'),
    d('Mitigate jailbreaks', 'test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks'),
    e('How we contain Claude', 'how-we-contain-claude'),
  ],
  's-observability': [
    d('Admin API', 'manage-claude/admin-api'),
    d('Usage and cost API', 'manage-claude/usage-cost-api'),
    d('Analytics API', 'manage-claude/analytics-api'),
    c('Monitoring usage', 'monitoring-usage'),
  ],
  's-deploy': [
    d('Claude in Amazon Bedrock', 'build-with-claude/claude-in-amazon-bedrock'),
    d('Claude on Vertex AI', 'build-with-claude/claude-on-vertex-ai'),
    d('Claude in Microsoft Foundry', 'build-with-claude/claude-in-microsoft-foundry'),
    d('Workload identity federation', 'manage-claude/workload-identity-federation'),
    d('Data residency', 'manage-claude/data-residency'),
  ],
};
