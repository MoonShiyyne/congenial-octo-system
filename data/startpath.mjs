// A route through the web for someone arriving with no background.
//
// Every step is reachable in the Claude apps, so the whole path can be walked
// without a terminal or a line of code — and each one is chosen because it
// changes what the next one is worth, not because it is easy.

export const startPath = [
  { n: 'r-ask',       why: 'Everything downstream amplifies whatever you actually asked for. Start by asking on purpose.' },
  { n: 'c-files',     why: 'Stop describing things you could simply show it — a screenshot, a PDF, a spreadsheet.' },
  { n: 'c-projects',  why: 'You have now typed the same preference three times. Say it once, somewhere durable.' },
  { n: 'f-artifacts', why: 'Turn an answer that would scroll away into a page you can send someone.' },
  { n: 'c-memory',    why: 'Let decisions survive the end of a conversation instead of being re-litigated.' },
  { n: 'f-docs',      why: 'Produce the file your audience will actually open — a real document, not a description of one.' },
  { n: 'k-skills',    why: 'Package a procedure you repeat, so it loads itself the moment it is relevant.' },
  { n: 'a-mcp',       why: 'Connect Claude to the tools you already use. This is where the ceiling starts to lift.' },
];
