// Keyword map: signal text → curriculum node.
// Terms are matched case-insensitively against a signal's title and summary.
// Weight 3 terms are near-unambiguous; weight 1 terms are supporting evidence.

export const nodeKeywords = {
  'r-ask':            [[2,'prompt engineering'],[1,'prompting'],[2,'system prompt']],
  'r-frame':          [[2,'persona'],[1,'tone'],[2,'output style']],
  'r-examples':       [[3,'few-shot'],[2,'in-context learning'],[1,'exemplar']],
  'r-critique':       [[2,'self-critique'],[2,'self-refine'],[1,'revision']],
  'r-thinking':       [[3,'extended thinking'],[3,'adaptive thinking'],[2,'reasoning tokens'],[2,'chain of thought'],[2,'budget_tokens'],[1,'thinking']],
  'r-effort':         [[3,'effort level'],[2,'xhigh'],[2,'output_config'],[1,'effort']],
  'r-decompose':      [[2,'plan mode'],[2,'task decomposition'],[1,'planning']],
  'r-archaeology':    [[3,'prompt audit'],[3,'model migration'],[2,'deprecated'],[2,'breaking change'],[1,'migration']],
  'r-judge':          [[3,'llm-as-judge'],[3,'llm as a judge'],[2,'rubric'],[1,'grader']],

  'c-files':          [[3,'files api'],[2,'pdf support'],[2,'vision'],[1,'multimodal']],
  'c-projects':       [[2,'claude.md'],[2,'system prompt'],[1,'projects']],
  'c-memory':         [[3,'memory tool'],[3,'agent memory'],[2,'memory_2025'],[1,'memory']],
  'c-citations':      [[3,'citations'],[2,'grounding'],[1,'attribution']],
  'c-longctx':        [[3,'context window'],[3,'1m context'],[2,'long context'],[1,'needle in a haystack']],
  'c-cache':          [[3,'prompt caching'],[3,'cache_control'],[2,'cache hit'],[1,'caching']],
  'c-editing':        [[3,'context editing'],[3,'compaction'],[2,'context management'],[2,'clear_tool_uses']],
  'c-retrieval':      [[3,'retrieval augmented'],[3,'rag'],[2,'vector database'],[2,'embedding'],[1,'chunking']],

  'k-cli':            [[3,'claude code'],[2,'coding agent'],[1,'cli']],
  'k-claudemd':       [[3,'claude.md'],[2,'project memory'],[1,'repo instructions']],
  'k-permissions':    [[3,'permission mode'],[3,'sandboxing'],[2,'allowlist'],[2,'bypasspermissions'],[1,'sandbox']],
  'k-slash':          [[3,'slash command'],[3,'output style'],[1,'custom command']],
  'k-skills':         [[3,'agent skills'],[3,'skill.md'],[2,'skills'],[1,'skill']],
  'k-hooks':          [[3,'hooks'],[3,'pretooluse'],[3,'posttooluse'],[2,'sessionstart'],[2,'hook event']],
  'k-plugins':        [[3,'plugin marketplace'],[3,'claude code plugin'],[2,'marketplace'],[1,'plugin']],
  'k-review':         [[3,'code review'],[3,'security review'],[2,'pull request review'],[1,'static analysis']],
  'k-remote':         [[3,'background session'],[3,'claude code on the web'],[3,'remote control'],[2,'worktree'],[2,'parallel agents'],[1,'headless']],

  'a-tools':          [[3,'tool use'],[3,'function calling'],[2,'tool_use'],[2,'parallel tool'],[1,'tools']],
  'a-servertools':    [[3,'code execution'],[3,'web search tool'],[3,'web fetch'],[2,'server tool'],[2,'sandbox execution']],
  'a-mcp':            [[3,'model context protocol'],[3,'mcp server'],[3,'mcp'],[2,'tool search'],[1,'connector']],
  'a-subagents':      [[3,'subagent'],[3,'sub-agent'],[2,'agent delegation'],[1,'fork']],
  'a-runner':         [[3,'tool runner'],[3,'agent loop'],[2,'agentic loop'],[1,'orchestration loop']],
  'a-teams':          [[3,'agent teams'],[3,'multi-agent'],[3,'multiagent'],[2,'orchestrator'],[1,'swarm']],
  'a-sdk':            [[3,'agent sdk'],[3,'claude agent sdk'],[2,'agent framework']],
  'a-managed':        [[3,'managed agents'],[3,'agent session'],[2,'hosted agent'],[2,'vault credential']],
  'a-scheduled':      [[3,'scheduled deployment'],[3,'autonomous agent'],[2,'cron'],[2,'long-running agent'],[1,'trigger']],

  'f-artifacts':      [[3,'artifacts'],[2,'artifact'],[1,'shareable app']],
  'f-docs':           [[3,'docx'],[3,'pptx'],[3,'xlsx'],[2,'powerpoint'],[2,'spreadsheet'],[1,'document generation']],
  'f-viz':            [[3,'data visualization'],[3,'data visualisation'],[2,'charts'],[2,'dashboard'],[1,'plotting']],
  'f-design':         [[3,'design system'],[2,'brand guidelines'],[2,'design tokens'],[1,'styling']],
  'f-canvas':         [[3,'design canvas'],[2,'mockup'],[2,'wireframe'],[1,'ui design']],
  'f-capabilities':   [[3,'artifact capabilities'],[2,'interactive artifact'],[2,'window.claude'],[1,'runtime capability']],
  'f-longform':       [[3,'co-authoring'],[2,'long-form writing'],[2,'technical writing'],[1,'documentation']],
  'f-generative':     [[3,'generative art'],[3,'algorithmic art'],[2,'p5.js'],[2,'creative coding']],

  's-models':         [[3,'opus 5'],[3,'sonnet 5'],[3,'haiku 4.5'],[3,'claude fable'],[3,'model release'],[2,'benchmark'],[2,'fast mode'],[1,'model']],
  's-structured':     [[3,'structured output'],[3,'json schema'],[2,'strict mode'],[2,'output_config'],[1,'schema']],
  's-batch':          [[3,'batch api'],[3,'message batches'],[2,'files api'],[1,'batch']],
  's-cost':           [[3,'cost optimization'],[3,'token cost'],[3,'pricing'],[2,'cheaper'],[2,'cost per'],[1,'spend']],
  's-evals':          [[3,'evals'],[3,'evaluation harness'],[3,'benchmark suite'],[2,'regression test'],[1,'eval']],
  's-guardrails':     [[3,'guardrails'],[3,'prompt injection'],[3,'refusal'],[2,'jailbreak'],[2,'safety classifier'],[1,'fallback']],
  's-observability':  [[3,'observability'],[3,'llm monitoring'],[2,'tracing'],[2,'admin api'],[1,'telemetry']],
  's-deploy':         [[3,'bedrock'],[3,'vertex ai'],[3,'microsoft foundry'],[2,'multi-cloud'],[2,'data residency'],[1,'enterprise']],
};

// Phrases that suggest a signal describes a NEW APPLICATION of a capability
// (someone built something) rather than a change to the capability itself.
export const applicationCues = [
  'show hn', 'we built', 'i built', 'built with', 'built using', 'launch',
  'introducing', 'how we', 'case study', 'in production', 'shipped',
  'open source', 'open-sourced', 'replaced', 'automating', 'automated',
  'saved us', 'startup', 'raised', 'yc ', 'my side project', 'side project',
];
