// Which surface each capability is actually reachable on.
//
// The web is organised by discipline and level, both of which assume you have
// already decided to build something. This is the axis a beginner needs first:
// can I do this by typing in the Claude app, or does it require a terminal or
// a program? Without it, the no-code subset is real but invisible — scattered
// across six sectors and interleaved with API-only material, so a newcomer
// cannot tell a dead end from a detour.
//
//   apps  claude.ai, desktop, mobile — no code at all
//   code  Claude Code — a terminal, but not a program you write
//   api   you write software against the API or an SDK

export const surfaceMeta = [
  { id: 'apps', name: 'In the Claude apps', short: 'No code',
    blurb: 'Do this by typing, clicking and uploading. No terminal, no programming.' },
  { id: 'code', name: 'In Claude Code', short: 'Terminal',
    blurb: 'Runs in a terminal in your project. You are configuring a tool, not writing a program.' },
  { id: 'api', name: 'Through the API', short: 'Programming',
    blurb: 'You write software that calls Claude. Needs a programming language.' },
];

export const surfaces = {
  // Technique applies wherever you are talking to the model.
  'r-ask':          ['apps', 'code', 'api'],
  'r-frame':        ['apps', 'code', 'api'],
  'r-examples':     ['apps', 'code', 'api'],
  'r-critique':     ['apps', 'code', 'api'],
  'r-thinking':     ['apps', 'code', 'api'],
  'r-effort':       ['code', 'api'],
  'r-decompose':    ['apps', 'code', 'api'],
  'r-judge':        ['apps', 'code', 'api'],
  'r-archaeology':  ['code', 'api'],

  'c-files':        ['apps', 'code', 'api'],
  'c-projects':     ['apps', 'code', 'api'],
  'c-memory':       ['apps', 'code', 'api'],
  'c-citations':    ['apps', 'api'],
  'c-longctx':      ['apps', 'code', 'api'],
  'c-cache':        ['code', 'api'],
  'c-editing':      ['code', 'api'],
  'c-retrieval':    ['apps', 'api'],

  'k-cli':          ['code'],
  'k-claudemd':     ['code'],
  'k-permissions':  ['code'],
  'k-slash':        ['code'],
  'k-skills':       ['apps', 'code', 'api'],
  'k-hooks':        ['code'],
  'k-plugins':      ['apps', 'code'],
  'k-review':       ['code'],
  'k-remote':       ['code'],

  'a-tools':        ['api'],
  'a-servertools':  ['apps', 'api'],
  'a-mcp':          ['apps', 'code', 'api'],
  'a-subagents':    ['code', 'api'],
  'a-runner':       ['api'],
  'a-teams':        ['code', 'api'],
  'a-sdk':          ['api'],
  'a-managed':      ['api'],
  'a-scheduled':    ['apps', 'code', 'api'],

  'f-artifacts':    ['apps', 'code'],
  'f-docs':         ['apps', 'api'],
  'f-viz':          ['apps', 'code', 'api'],
  'f-design':       ['apps', 'code'],
  'f-canvas':       ['apps', 'code'],
  'f-capabilities': ['apps', 'code'],
  'f-longform':     ['apps', 'code', 'api'],
  'f-generative':   ['apps', 'code'],

  's-models':       ['apps', 'api'],
  's-structured':   ['api'],
  's-batch':        ['api'],
  's-cost':         ['code', 'api'],
  's-evals':        ['code', 'api'],
  's-guardrails':   ['api'],
  's-observability':['code', 'api'],
  's-deploy':       ['api'],
};
