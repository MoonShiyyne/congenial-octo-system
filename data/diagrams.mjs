// Mechanism diagrams, hand-authored inline SVG.
//
// A node gets one only where a picture lets a cold reader see something they
// would otherwise assemble from prose: where data flows, what changes between
// two options, what state a request moves through. Advisory nodes — how to
// phrase a request, how to run a critique pass — get none, because a sentence
// says it faster.
//
// Conventions, because every figure ends up in the same document:
//   · marker ids are namespaced per node — a bare id="arrow" would collide
//   · strokes and text use currentColor so both themes work
//   · one accent (var(--accent)) marks the element the argument turns on
//   · OK/BAD keep a literal hue that reads on either ground

export const diagrams = {

'c-cache': { caption: 'Caching compares from the first byte and stops at the first difference — so one volatile value near the front discards everything after it.',
  alt: 'A request rendered as tools, then system, then messages. A breakpoint after the stable part marks what is reused; a timestamp placed early turns the whole remainder into a cache miss.',
  svg: `<svg viewBox="0 0 660 232" role="img" aria-label="Cache prefix matching, and how an early volatile value invalidates the remainder">
<defs><marker id="ar-ccache" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="currentColor"/></marker></defs>
<text x="0" y="12" font-size="10.5" fill="currentColor" opacity=".65" letter-spacing="1.2">RENDER ORDER — ALWAYS</text>
<g font-size="11.5" fill="currentColor">
  <rect x="0" y="24" width="120" height="38" rx="6" fill="none" stroke="currentColor" stroke-width="1.3" opacity=".55"/><text x="60" y="47" text-anchor="middle">tools</text>
  <rect x="128" y="24" width="150" height="38" rx="6" fill="none" stroke="currentColor" stroke-width="1.3" opacity=".55"/><text x="203" y="47" text-anchor="middle">system</text>
  <rect x="286" y="24" width="230" height="38" rx="6" fill="none" stroke="currentColor" stroke-width="1.3" opacity=".55"/><text x="401" y="47" text-anchor="middle">messages</text>
</g>
<line x1="0" y1="72" x2="516" y2="72" stroke="currentColor" stroke-width="1" opacity=".3"/>
<g stroke="var(--accent)" stroke-width="1.6"><line x1="286" y1="18" x2="286" y2="80"/></g>
<text x="292" y="90" font-size="11" fill="var(--accent)">cache_control breakpoint — everything left of here is reused</text>
<text x="0" y="122" font-size="10.5" fill="currentColor" opacity=".65" letter-spacing="1.2">A TIMESTAMP IN THE SYSTEM PROMPT</text>
<g font-size="11.5" fill="currentColor">
  <rect x="0" y="134" width="120" height="38" rx="6" fill="none" stroke="#2e9e6b" stroke-width="1.4"/><text x="60" y="157" text-anchor="middle">tools</text>
  <rect x="128" y="134" width="150" height="38" rx="6" fill="none" stroke="#d2603f" stroke-width="1.4"/><text x="203" y="152" text-anchor="middle" font-size="11">system</text><text x="203" y="166" text-anchor="middle" font-size="9.5" fill="#d2603f">changed</text>
  <rect x="286" y="134" width="230" height="38" rx="6" fill="none" stroke="#d2603f" stroke-width="1.4" stroke-dasharray="4 3"/><text x="401" y="157" text-anchor="middle" fill="#d2603f">messages — re-read in full</text>
</g>
<line x1="203" y1="182" x2="380" y2="182" stroke="#d2603f" stroke-width="1.3" marker-end="url(#ar-ccache)"/>
<text x="203" y="202" font-size="11" fill="#d2603f">invalidates everything after it</text>
<text x="0" y="224" font-size="11" fill="currentColor" opacity=".7">Only the tools block still hits. Hit rate goes to zero with no error.</text>
</svg>` },

'c-editing': { caption: 'Two features, two verbs. Context editing deletes old tool results; compaction summarises earlier turns. Using the wrong one loses state you needed.',
  alt: 'A conversation timeline shown twice: context editing removes stale tool results entirely, while compaction replaces earlier turns with a summary block that must be sent back.',
  svg: `<svg viewBox="0 0 660 236" role="img" aria-label="Context editing deletes tool results; compaction summarises earlier turns">
<text x="0" y="12" font-size="10.5" fill="currentColor" opacity=".65" letter-spacing="1.2">CONTEXT EDITING — CLEARS</text>
<g font-size="10.5" fill="currentColor">
  <rect x="0" y="24" width="88" height="34" rx="5" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".5"/><text x="44" y="45" text-anchor="middle">turn 1</text>
  <rect x="96" y="24" width="122" height="34" rx="5" fill="none" stroke="#d2603f" stroke-width="1.3" stroke-dasharray="4 3"/><text x="157" y="40" text-anchor="middle" fill="#d2603f">tool result</text><text x="157" y="52" text-anchor="middle" fill="#d2603f" font-size="9.5">dropped</text>
  <rect x="226" y="24" width="122" height="34" rx="5" fill="none" stroke="#d2603f" stroke-width="1.3" stroke-dasharray="4 3"/><text x="287" y="40" text-anchor="middle" fill="#d2603f">tool result</text><text x="287" y="52" text-anchor="middle" fill="#d2603f" font-size="9.5">dropped</text>
  <rect x="356" y="24" width="88" height="34" rx="5" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".5"/><text x="400" y="45" text-anchor="middle">turn 8</text>
  <rect x="452" y="24" width="88" height="34" rx="5" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".5"/><text x="496" y="45" text-anchor="middle">turn 9</text>
</g>
<text x="0" y="78" font-size="11" fill="currentColor" opacity=".7">Gone, not preserved. Right for a stale directory listing; wrong if turn 3 held a decision.</text>
<text x="0" y="118" font-size="10.5" fill="currentColor" opacity=".65" letter-spacing="1.2">COMPACTION — SUMMARISES</text>
<g font-size="10.5" fill="currentColor">
  <rect x="0" y="130" width="348" height="34" rx="5" fill="none" stroke="var(--accent)" stroke-width="1.4"/><text x="174" y="151" text-anchor="middle" fill="var(--accent)">turns 1–7 replaced by a compaction block</text>
  <rect x="356" y="130" width="88" height="34" rx="5" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".5"/><text x="400" y="151" text-anchor="middle">turn 8</text>
  <rect x="452" y="130" width="88" height="34" rx="5" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".5"/><text x="496" y="151" text-anchor="middle">turn 9</text>
</g>
<text x="0" y="188" font-size="11" fill="currentColor" opacity=".7">The block lives inside <tspan font-family="ui-monospace, monospace">response.content</tspan> — append the whole thing back,</text>
<text x="0" y="204" font-size="11" fill="#d2603f">not just <tspan font-family="ui-monospace, monospace">.content[0].text</tspan>, or the compaction state vanishes with no error.</text>
<text x="0" y="228" font-size="11" fill="currentColor" opacity=".7">Clear tool noise · summarise reasoning · persist decisions to memory. Three different jobs.</text>
</svg>` },

'c-retrieval': { caption: 'Fine chunking splits an answer across a boundary. Coarse retrieval sends whole documents and lets the window do comprehension — the failure class disappears.',
  alt: 'A document sliced into fixed chunks, where a definition falls across two slices and neither retrieved chunk carries the full answer; beside it, whole documents retrieved intact.',
  svg: `<svg viewBox="0 0 660 244" role="img" aria-label="Chunk boundary errors versus retrieving whole documents">
<text x="0" y="12" font-size="10.5" fill="currentColor" opacity=".65" letter-spacing="1.2">FINE CHUNKS — 500 TOKENS EACH</text>
<g fill="none" stroke="currentColor" stroke-width="1.2" opacity=".5">
  <rect x="0" y="24" width="74" height="46" rx="5"/><rect x="82" y="24" width="74" height="46" rx="5"/><rect x="246" y="24" width="74" height="46" rx="5"/>
</g>
<rect x="164" y="24" width="74" height="46" rx="5" fill="none" stroke="#d2603f" stroke-width="1.4"/>
<rect x="246" y="24" width="74" height="46" rx="5" fill="none" stroke="#d2603f" stroke-width="1.4"/>
<line x1="238" y1="18" x2="238" y2="76" stroke="#d2603f" stroke-width="1.6"/>
<text x="201" y="43" font-size="10" fill="#d2603f" text-anchor="middle">"the term</text><text x="201" y="56" font-size="10" fill="#d2603f" text-anchor="middle">means…"</text>
<text x="283" y="43" font-size="10" fill="#d2603f" text-anchor="middle">"…unless</text><text x="283" y="56" font-size="10" fill="#d2603f" text-anchor="middle">§9 applies"</text>
<text x="332" y="42" font-size="11" fill="#d2603f">boundary cuts the answer in half</text>
<text x="332" y="58" font-size="11" fill="currentColor" opacity=".7">retrieval returns one side, not both</text>
<text x="0" y="106" font-size="10.5" fill="currentColor" opacity=".65" letter-spacing="1.2">COARSE — WHOLE DOCUMENTS</text>
<g font-size="11" fill="currentColor">
  <rect x="0" y="118" width="150" height="62" rx="6" fill="none" stroke="var(--accent)" stroke-width="1.4"/><text x="75" y="146" text-anchor="middle" fill="var(--accent)">policy v4</text><text x="75" y="162" text-anchor="middle" font-size="9.5" opacity=".7">intact</text>
  <rect x="158" y="118" width="150" height="62" rx="6" fill="none" stroke="var(--accent)" stroke-width="1.4"/><text x="233" y="146" text-anchor="middle" fill="var(--accent)">amendment 2</text><text x="233" y="162" text-anchor="middle" font-size="9.5" opacity=".7">intact</text>
  <rect x="316" y="118" width="150" height="62" rx="6" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".45"/><text x="391" y="146" text-anchor="middle" opacity=".6">3 more</text>
</g>
<text x="482" y="146" font-size="11" fill="currentColor" opacity=".7">~60K tokens,</text>
<text x="482" y="162" font-size="11" fill="currentColor" opacity=".7">cached after turn 1</text>
<text x="0" y="204" font-size="11" fill="#2e9e6b">The model sees the qualification in §9 alongside the term it qualifies.</text>
<text x="0" y="228" font-size="11" fill="currentColor" opacity=".7">Retrieval still wins on scale, freshness, and per-user access control.</text>
</svg>` },

'c-memory': { caption: 'Context is what the model is holding and pays for every turn. Memory sits outside it and costs nothing until something is fetched.',
  alt: 'A context window billed on every turn, next to a persistent memory store outside it that is written to and read from on demand.',
  svg: `<svg viewBox="0 0 660 214" role="img" aria-label="Context is billed every turn; memory is outside the window and retrieved on demand">
<defs><marker id="ar-cmem" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="currentColor"/></marker></defs>
<rect x="0" y="26" width="300" height="120" rx="8" fill="none" stroke="currentColor" stroke-width="1.4"/>
<text x="10" y="18" font-size="10.5" fill="currentColor" opacity=".65" letter-spacing="1.2">CONTEXT WINDOW</text>
<g font-size="11" fill="currentColor" opacity=".8">
  <rect x="16" y="42" width="268" height="24" rx="4" fill="none" stroke="currentColor" stroke-width="1" opacity=".45"/><text x="26" y="58">system + standing instructions</text>
  <rect x="16" y="72" width="268" height="24" rx="4" fill="none" stroke="currentColor" stroke-width="1" opacity=".45"/><text x="26" y="88">this conversation</text>
  <rect x="16" y="102" width="268" height="24" rx="4" fill="none" stroke="currentColor" stroke-width="1" opacity=".45"/><text x="26" y="118">retrieved memories (only these)</text>
</g>
<text x="0" y="166" font-size="11" fill="#d2603f">billed on every turn, whether or not it is used</text>
<rect x="392" y="26" width="268" height="120" rx="8" fill="none" stroke="var(--accent)" stroke-width="1.4"/>
<text x="402" y="18" font-size="10.5" fill="var(--accent)" opacity=".85" letter-spacing="1.2">MEMORY STORE</text>
<g font-size="11" fill="currentColor" opacity=".8">
  <text x="408" y="52">"chose Postgres over Dynamo —</text><text x="408" y="66"> reporting query shape, 2026-03"</text>
  <text x="408" y="88">"user prefers terse diffs"</text>
  <text x="408" y="110" opacity=".55">…340 more entries</text>
  <text x="408" y="132" font-size="9.5" opacity=".6">each tagged: user | observed | external</text>
</g>
<line x1="388" y1="76" x2="308" y2="76" stroke="currentColor" stroke-width="1.3" marker-end="url(#ar-cmem)"/>
<text x="316" y="70" font-size="10.5" fill="currentColor" opacity=".75">read on demand</text>
<line x1="308" y1="112" x2="388" y2="112" stroke="currentColor" stroke-width="1.3" marker-end="url(#ar-cmem)"/>
<text x="316" y="128" font-size="10.5" fill="currentColor" opacity=".75">write decisions</text>
<text x="392" y="166" font-size="11" fill="#2e9e6b">costs nothing until retrieved</text>
<text x="0" y="200" font-size="11" fill="#d2603f">If untrusted content can reach the write arrow, that is a persistent injection channel.</text>
</svg>` },

'c-longctx': { caption: 'A million tokens is capacity, not a plan. Every token is billed on every turn, and irrelevant material competes with relevant material.',
  alt: 'A budget bar showing a deliberately curated 126K-token allocation against a 1M-token window, with the cost of a saturated window shown alongside.',
  svg: `<svg viewBox="0 0 660 210" role="img" aria-label="A curated context budget against the full window, and what filling it costs">
<text x="0" y="12" font-size="10.5" fill="currentColor" opacity=".65" letter-spacing="1.2">BUDGETED ON PURPOSE — ~126K OF 1M</text>
<g>
  <rect x="0" y="24" width="620" height="30" rx="5" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".35"/>
  <rect x="0" y="24" width="12" height="30" rx="2" fill="var(--accent)" opacity=".85"/>
  <rect x="14" y="24" width="60" height="30" fill="var(--accent)" opacity=".55"/>
  <rect x="76" y="24" width="30" height="30" fill="var(--accent)" opacity=".35"/>
  <rect x="108" y="24" width="96" height="30" fill="currentColor" opacity=".12"/>
</g>
<g font-size="10" fill="currentColor" opacity=".75">
  <text x="0" y="70">2K</text><text x="0" y="82" opacity=".7">system</text>
  <text x="60" y="70">40K</text><text x="60" y="82" opacity=".7">the 4 files that matter</text>
  <text x="200" y="70">20K</text><text x="200" y="82" opacity=".7">conversation</text>
  <text x="300" y="70">64K</text><text x="300" y="82" opacity=".7">headroom for output</text>
  <text x="470" y="70" opacity=".55">874K unused — deliberately</text>
</g>
<line x1="0" y1="112" x2="620" y2="112" stroke="currentColor" stroke-width="1" opacity=".25"/>
<text x="0" y="134" font-size="10.5" fill="currentColor" opacity=".65" letter-spacing="1.2">FILLED BECAUSE IT FITS — 80 FILES</text>
<rect x="0" y="146" width="620" height="30" rx="5" fill="#d2603f" opacity=".28"/>
<rect x="0" y="146" width="620" height="30" rx="5" fill="none" stroke="#d2603f" stroke-width="1.2"/>
<text x="10" y="166" font-size="11" fill="currentColor">the 4 that matter + 76 that merely mention the symbol</text>
<text x="0" y="200" font-size="11" fill="#d2603f">Costs money every turn · latency rises linearly · judgement degrades as noise competes for relevance.</text>
</svg>` },

'c-citations': { caption: 'With citations on, the answer arrives as separate blocks, each carrying the exact span it came from — so a reviewer can jump to the source instead of trusting the prose.',
  alt: 'An answer split into text blocks, where cited blocks carry a page and character location pointing back into the source document.',
  svg: `<svg viewBox="0 0 660 218" role="img" aria-label="A cited answer splits into blocks, each pointing at an exact span in the source">
<defs><marker id="ar-ccit" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--accent)"/></marker></defs>
<text x="0" y="12" font-size="10.5" fill="currentColor" opacity=".65" letter-spacing="1.2">SOURCE — MSA v3.pdf</text>
<rect x="0" y="24" width="200" height="150" rx="6" fill="none" stroke="currentColor" stroke-width="1.3" opacity=".55"/>
<g stroke="currentColor" opacity=".25" stroke-width="5">
  <line x1="16" y1="44" x2="184" y2="44"/><line x1="16" y1="60" x2="160" y2="60"/><line x1="16" y1="108" x2="184" y2="108"/><line x1="16" y1="140" x2="150" y2="140"/>
</g>
<rect x="12" y="72" width="176" height="24" rx="3" fill="var(--accent)" opacity=".3"/>
<text x="20" y="88" font-size="9.5" fill="currentColor">"…30 days written notice…"</text>
<text x="12" y="164" font-size="9.5" fill="currentColor" opacity=".6">p.14</text>
<text x="360" y="12" font-size="10.5" fill="currentColor" opacity=".65" letter-spacing="1.2">RESPONSE — SEPARATE BLOCKS</text>
<g font-size="10.5" fill="currentColor">
  <rect x="360" y="24" width="300" height="30" rx="5" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".4"/><text x="372" y="43" opacity=".75">"Either party may terminate…"</text>
  <rect x="360" y="60" width="300" height="44" rx="5" fill="none" stroke="var(--accent)" stroke-width="1.4"/><text x="372" y="78">"…on 30 days notice."</text>
  <text x="372" y="94" font-size="9.5" fill="var(--accent)">cited · page_location · start_page 14</text>
  <rect x="360" y="110" width="300" height="30" rx="5" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".4"/><text x="372" y="129" opacity=".75">"Renewal is automatic."</text>
</g>
<path d="M356 82 C 300 82, 260 84, 196 84" fill="none" stroke="var(--accent)" stroke-width="1.4" marker-end="url(#ar-ccit)"/>
<text x="215" y="200" font-size="11" fill="currentColor" opacity=".75">Claims that cannot be anchored tend not to get made.</text>
<text x="0" y="200" font-size="11" fill="#d2603f">Cannot combine with a JSON schema — 400.</text>
</svg>` },

'c-files': { caption: 'The model reads a message in order. A question asked before the evidence arrives gets answered from priors, then retrofitted.',
  alt: 'Two message layouts: the document block placed before the text block, and the reverse, which asks the question before the evidence has been read.',
  svg: `<svg viewBox="0 0 660 176" role="img" aria-label="Document block before text block, versus the reverse">
<defs><marker id="ar-cfil" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="currentColor"/></marker></defs>
<text x="0" y="12" font-size="10.5" fill="#2e9e6b" letter-spacing="1.2">DOCUMENT FIRST</text>
<g font-size="11.5" fill="currentColor">
  <rect x="0" y="24" width="230" height="40" rx="6" fill="none" stroke="#2e9e6b" stroke-width="1.4"/><text x="115" y="49" text-anchor="middle">document / image block</text>
  <rect x="266" y="24" width="180" height="40" rx="6" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".55"/><text x="356" y="49" text-anchor="middle">your question</text>
</g>
<line x1="234" y1="44" x2="262" y2="44" stroke="currentColor" stroke-width="1.3" marker-end="url(#ar-cfil)"/>
<text x="466" y="49" font-size="11" fill="#2e9e6b">reads, then answers</text>
<text x="0" y="102" font-size="10.5" fill="#d2603f" letter-spacing="1.2">QUESTION FIRST</text>
<g font-size="11.5" fill="currentColor">
  <rect x="0" y="114" width="180" height="40" rx="6" fill="none" stroke="#d2603f" stroke-width="1.4"/><text x="90" y="139" text-anchor="middle">your question</text>
  <rect x="216" y="114" width="230" height="40" rx="6" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".55"/><text x="331" y="139" text-anchor="middle">document / image block</text>
</g>
<line x1="184" y1="134" x2="212" y2="134" stroke="currentColor" stroke-width="1.3" marker-end="url(#ar-cfil)"/>
<text x="466" y="132" font-size="11" fill="#d2603f">answers from priors,</text>
<text x="466" y="148" font-size="11" fill="#d2603f">then retrofits to the source</text>
</svg>` },

'a-tools': { caption: 'The model asks, your code answers, the loop repeats. Every result from a parallel batch must return in ONE user message — splitting them teaches the model to stop asking in parallel.',
  alt: 'The tool-use exchange: an assistant message containing three parallel tool_use blocks, executed concurrently, with all three tool_result blocks returned in a single user message.',
  svg: `<svg viewBox="0 0 660 258" role="img" aria-label="The tool use exchange, and why parallel results must return in one message">
<defs><marker id="ar-atool" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="currentColor"/></marker></defs>
<rect x="0" y="20" width="160" height="80" rx="7" fill="none" stroke="currentColor" stroke-width="1.3"/>
<text x="80" y="46" font-size="11.5" text-anchor="middle" fill="currentColor">assistant</text>
<text x="80" y="64" font-size="10" text-anchor="middle" fill="var(--accent)">3 × tool_use</text>
<text x="80" y="80" font-size="9.5" text-anchor="middle" fill="currentColor" opacity=".6">stop_reason: tool_use</text>
<line x1="164" y1="60" x2="222" y2="60" stroke="currentColor" stroke-width="1.3" marker-end="url(#ar-atool)"/>
<g font-size="10.5" fill="currentColor">
  <rect x="226" y="14" width="150" height="26" rx="4" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".55"/><text x="301" y="31" text-anchor="middle">query_orders()</text>
  <rect x="226" y="47" width="150" height="26" rx="4" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".55"/><text x="301" y="64" text-anchor="middle">get_customer()</text>
  <rect x="226" y="80" width="150" height="26" rx="4" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".55"/><text x="301" y="97" text-anchor="middle">check_stock()</text>
</g>
<text x="301" y="126" font-size="10" text-anchor="middle" fill="currentColor" opacity=".65">your code, run concurrently</text>
<line x1="380" y1="60" x2="438" y2="60" stroke="currentColor" stroke-width="1.3" marker-end="url(#ar-atool)"/>
<rect x="442" y="20" width="176" height="80" rx="7" fill="none" stroke="#2e9e6b" stroke-width="1.5"/>
<text x="530" y="44" font-size="11.5" text-anchor="middle" fill="currentColor">ONE user message</text>
<text x="530" y="62" font-size="10" text-anchor="middle" fill="#2e9e6b">3 × tool_result</text>
<text x="530" y="80" font-size="9.5" text-anchor="middle" fill="currentColor" opacity=".6">errors too, is_error: true</text>
<path d="M530 104 C 530 140, 80 140, 80 104" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".6" marker-end="url(#ar-atool)"/>
<text x="305" y="152" font-size="10.5" text-anchor="middle" fill="currentColor" opacity=".7">loop until stop_reason is anything else</text>
<line x1="0" y1="176" x2="620" y2="176" stroke="currentColor" stroke-width="1" opacity=".22"/>
<text x="0" y="200" font-size="10.5" fill="#d2603f" letter-spacing="1.2">SPLIT ACROSS MESSAGES</text>
<g font-size="10.5" fill="currentColor">
  <rect x="0" y="210" width="120" height="26" rx="4" fill="none" stroke="#d2603f" stroke-width="1.3"/><text x="60" y="227" text-anchor="middle">result 1</text>
  <rect x="128" y="210" width="120" height="26" rx="4" fill="none" stroke="#d2603f" stroke-width="1.3"/><text x="188" y="227" text-anchor="middle">result 2</text>
  <rect x="256" y="210" width="120" height="26" rx="4" fill="none" stroke="#d2603f" stroke-width="1.3"/><text x="316" y="227" text-anchor="middle">result 3</text>
</g>
<text x="392" y="220" font-size="11" fill="#d2603f">The model stops making parallel calls.</text>
<text x="392" y="234" font-size="11" fill="currentColor" opacity=".7">No error — just a slower agent.</text>
</svg>` },

'a-servertools': { caption: 'The difference is who executes. A client tool round-trips to your code; a server tool runs on Anthropic infrastructure and the result is already in the response.',
  alt: 'A client tool requiring your own execution loop, contrasted with a server tool that executes on Anthropic infrastructure and returns its result inside the same response.',
  svg: `<svg viewBox="0 0 660 220" role="img" aria-label="Client tools need your execution loop; server tools do not">
<defs><marker id="ar-asrv" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="currentColor"/></marker></defs>
<text x="0" y="12" font-size="10.5" fill="currentColor" opacity=".65" letter-spacing="1.2">CLIENT TOOL — YOU RUN THE LOOP</text>
<g font-size="11" fill="currentColor">
  <rect x="0" y="24" width="130" height="46" rx="6" fill="none" stroke="currentColor" stroke-width="1.3"/><text x="65" y="52" text-anchor="middle">your app</text>
  <rect x="200" y="24" width="130" height="46" rx="6" fill="none" stroke="currentColor" stroke-width="1.3"/><text x="265" y="52" text-anchor="middle">model</text>
  <rect x="400" y="24" width="150" height="46" rx="6" fill="none" stroke="currentColor" stroke-width="1.3" opacity=".7"/><text x="475" y="52" text-anchor="middle">your database</text>
</g>
<line x1="134" y1="40" x2="196" y2="40" stroke="currentColor" stroke-width="1.2" marker-end="url(#ar-asrv)"/><text x="165" y="34" font-size="9.5" text-anchor="middle" fill="currentColor" opacity=".7">request</text>
<line x1="196" y1="58" x2="134" y2="58" stroke="currentColor" stroke-width="1.2" marker-end="url(#ar-asrv)"/><text x="165" y="72" font-size="9.5" text-anchor="middle" fill="currentColor" opacity=".7">tool_use</text>
<line x1="134" y1="86" x2="470" y2="86" stroke="currentColor" stroke-width="1.2" opacity=".7" marker-end="url(#ar-asrv)"/>
<text x="300" y="100" font-size="9.5" text-anchor="middle" fill="currentColor" opacity=".7">you execute, then send tool_result back — repeat</text>
<line x1="0" y1="118" x2="620" y2="118" stroke="currentColor" stroke-width="1" opacity=".22"/>
<text x="0" y="142" font-size="10.5" fill="var(--accent)" letter-spacing="1.2">SERVER TOOL — NO LOOP OF YOURS</text>
<g font-size="11" fill="currentColor">
  <rect x="0" y="154" width="130" height="46" rx="6" fill="none" stroke="currentColor" stroke-width="1.3"/><text x="65" y="182" text-anchor="middle">your app</text>
  <rect x="200" y="154" width="350" height="46" rx="6" fill="none" stroke="var(--accent)" stroke-width="1.5"/>
  <text x="290" y="182" text-anchor="middle" fill="var(--accent)">model</text>
  <line x1="360" y1="160" x2="360" y2="194" stroke="var(--accent)" stroke-width="1" opacity=".5"/>
  <text x="455" y="177" text-anchor="middle" fill="var(--accent)" font-size="10.5">web_search · web_fetch · code_execution</text>
  <text x="455" y="191" text-anchor="middle" font-size="9" opacity=".7">runs on Anthropic infrastructure</text>
</g>
<line x1="134" y1="170" x2="196" y2="170" stroke="currentColor" stroke-width="1.2" marker-end="url(#ar-asrv)"/>
<line x1="196" y1="188" x2="134" y2="188" stroke="var(--accent)" stroke-width="1.4" marker-end="url(#ar-asrv)"/>
<text x="0" y="216" font-size="11" fill="#d2603f">Failures return HTTP 200 with an error object — nothing raises, so branch before you index.</text>
</svg>` },

'a-mcp': { caption: 'Without a shared protocol, every client needs a bespoke integration with every tool. With one, each side implements it once.',
  alt: 'Four clients wired individually to four tools producing sixteen integrations, beside the same clients and tools each connected once through a shared protocol.',
  svg: `<svg viewBox="0 0 660 250" role="img" aria-label="N times M bespoke integrations versus N plus M through a shared protocol">
<text x="0" y="12" font-size="10.5" fill="#d2603f" letter-spacing="1.2">WITHOUT A PROTOCOL — 4 × 4 = 16</text>
<g font-size="9.5" fill="currentColor">
  <rect x="0" y="26" width="72" height="22" rx="4" fill="none" stroke="currentColor" stroke-width="1" opacity=".6"/><text x="36" y="41" text-anchor="middle">CLI</text>
  <rect x="0" y="56" width="72" height="22" rx="4" fill="none" stroke="currentColor" stroke-width="1" opacity=".6"/><text x="36" y="71" text-anchor="middle">desktop</text>
  <rect x="0" y="86" width="72" height="22" rx="4" fill="none" stroke="currentColor" stroke-width="1" opacity=".6"/><text x="36" y="101" text-anchor="middle">API app</text>
  <rect x="0" y="116" width="72" height="22" rx="4" fill="none" stroke="currentColor" stroke-width="1" opacity=".6"/><text x="36" y="131" text-anchor="middle">your IDE</text>
  <rect x="216" y="26" width="72" height="22" rx="4" fill="none" stroke="currentColor" stroke-width="1" opacity=".6"/><text x="252" y="41" text-anchor="middle">Jira</text>
  <rect x="216" y="56" width="72" height="22" rx="4" fill="none" stroke="currentColor" stroke-width="1" opacity=".6"/><text x="252" y="71" text-anchor="middle">Grafana</text>
  <rect x="216" y="86" width="72" height="22" rx="4" fill="none" stroke="currentColor" stroke-width="1" opacity=".6"/><text x="252" y="101" text-anchor="middle">deploy</text>
  <rect x="216" y="116" width="72" height="22" rx="4" fill="none" stroke="currentColor" stroke-width="1" opacity=".6"/><text x="252" y="131" text-anchor="middle">warehouse</text>
</g>
<g stroke="#d2603f" stroke-width=".7" opacity=".5">
  <line x1="72" y1="37" x2="216" y2="37"/><line x1="72" y1="37" x2="216" y2="67"/><line x1="72" y1="37" x2="216" y2="97"/><line x1="72" y1="37" x2="216" y2="127"/>
  <line x1="72" y1="67" x2="216" y2="37"/><line x1="72" y1="67" x2="216" y2="67"/><line x1="72" y1="67" x2="216" y2="97"/><line x1="72" y1="67" x2="216" y2="127"/>
  <line x1="72" y1="97" x2="216" y2="37"/><line x1="72" y1="97" x2="216" y2="67"/><line x1="72" y1="97" x2="216" y2="97"/><line x1="72" y1="97" x2="216" y2="127"/>
  <line x1="72" y1="127" x2="216" y2="37"/><line x1="72" y1="127" x2="216" y2="67"/><line x1="72" y1="127" x2="216" y2="97"/><line x1="72" y1="127" x2="216" y2="127"/>
</g>
<text x="144" y="166" font-size="11" text-anchor="middle" fill="#d2603f">every pair written by hand</text>
<text x="380" y="12" font-size="10.5" fill="var(--accent)" letter-spacing="1.2">WITH MCP — 4 + 4 = 8</text>
<g font-size="9.5" fill="currentColor">
  <rect x="380" y="26" width="72" height="22" rx="4" fill="none" stroke="currentColor" stroke-width="1" opacity=".6"/><text x="416" y="41" text-anchor="middle">CLI</text>
  <rect x="380" y="56" width="72" height="22" rx="4" fill="none" stroke="currentColor" stroke-width="1" opacity=".6"/><text x="416" y="71" text-anchor="middle">desktop</text>
  <rect x="380" y="86" width="72" height="22" rx="4" fill="none" stroke="currentColor" stroke-width="1" opacity=".6"/><text x="416" y="101" text-anchor="middle">API app</text>
  <rect x="380" y="116" width="72" height="22" rx="4" fill="none" stroke="currentColor" stroke-width="1" opacity=".6"/><text x="416" y="131" text-anchor="middle">your IDE</text>
  <rect x="588" y="26" width="72" height="22" rx="4" fill="none" stroke="currentColor" stroke-width="1" opacity=".6"/><text x="624" y="41" text-anchor="middle">Jira</text>
  <rect x="588" y="56" width="72" height="22" rx="4" fill="none" stroke="currentColor" stroke-width="1" opacity=".6"/><text x="624" y="71" text-anchor="middle">Grafana</text>
  <rect x="588" y="86" width="72" height="22" rx="4" fill="none" stroke="currentColor" stroke-width="1" opacity=".6"/><text x="624" y="101" text-anchor="middle">deploy</text>
  <rect x="588" y="116" width="72" height="22" rx="4" fill="none" stroke="currentColor" stroke-width="1" opacity=".6"/><text x="624" y="131" text-anchor="middle">warehouse</text>
</g>
<rect x="494" y="60" width="52" height="44" rx="6" fill="none" stroke="var(--accent)" stroke-width="1.6"/>
<text x="520" y="79" font-size="10" text-anchor="middle" fill="var(--accent)">MCP</text>
<text x="520" y="93" font-size="8.5" text-anchor="middle" fill="var(--accent)" opacity=".8">protocol</text>
<g stroke="var(--accent)" stroke-width="1.1" opacity=".8">
  <line x1="452" y1="37" x2="494" y2="74"/><line x1="452" y1="67" x2="494" y2="78"/><line x1="452" y1="97" x2="494" y2="86"/><line x1="452" y1="127" x2="494" y2="90"/>
  <line x1="546" y1="74" x2="588" y2="37"/><line x1="546" y1="78" x2="588" y2="67"/><line x1="546" y1="86" x2="588" y2="97"/><line x1="546" y1="90" x2="588" y2="127"/>
</g>
<text x="520" y="166" font-size="11" text-anchor="middle" fill="var(--accent)">each side implements it once</text>
<line x1="0" y1="190" x2="620" y2="190" stroke="currentColor" stroke-width="1" opacity=".22"/>
<text x="0" y="212" font-size="11" fill="currentColor" opacity=".75">A server you write works in clients that do not exist yet — that is the whole return.</text>
<text x="0" y="234" font-size="11" fill="#d2603f">A third-party server's tool descriptions enter your context. Treat it as a dependency.</text>
</svg>` },

'a-subagents': { caption: 'The product of a subagent is not parallelism — it is that the reading happens in someone else\'s window. Delegate when the input is large and the output small.',
  alt: 'A parent context receiving three sentences from a subagent that read two hundred thousand tokens, contrasted with doing the same work inline and carrying all of it forever.',
  svg: `<svg viewBox="0 0 660 236" role="img" aria-label="Context isolation: a subagent reads a lot and returns a little">
<defs><marker id="ar-asub" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="currentColor"/></marker></defs>
<text x="0" y="12" font-size="10.5" fill="#d2603f" letter-spacing="1.2">INLINE</text>
<rect x="0" y="24" width="270" height="72" rx="7" fill="none" stroke="#d2603f" stroke-width="1.4"/>
<text x="135" y="46" font-size="11" text-anchor="middle" fill="currentColor">parent context</text>
<rect x="14" y="56" width="242" height="26" rx="4" fill="#d2603f" opacity=".25"/>
<text x="135" y="73" font-size="10" text-anchor="middle" fill="currentColor">200K tokens of grepped code</text>
<text x="0" y="118" font-size="11" fill="#d2603f">carried on every later turn, billed every time,</text>
<text x="0" y="134" font-size="11" fill="#d2603f">competing for attention with what matters</text>
<text x="360" y="12" font-size="10.5" fill="var(--accent)" letter-spacing="1.2">DELEGATED</text>
<rect x="360" y="24" width="270" height="72" rx="7" fill="none" stroke="currentColor" stroke-width="1.4"/>
<text x="495" y="46" font-size="11" text-anchor="middle" fill="currentColor">parent context</text>
<rect x="374" y="56" width="66" height="26" rx="4" fill="var(--accent)" opacity=".35"/>
<text x="407" y="73" font-size="10" text-anchor="middle" fill="currentColor">3 lines</text>
<text x="452" y="73" font-size="9.5" fill="currentColor" opacity=".55">…room left for the actual work</text>
<rect x="360" y="140" width="270" height="60" rx="7" fill="none" stroke="var(--accent)" stroke-width="1.3" stroke-dasharray="5 4"/>
<text x="495" y="162" font-size="11" text-anchor="middle" fill="var(--accent)">subagent · own window</text>
<text x="495" y="178" font-size="10" text-anchor="middle" fill="currentColor" opacity=".7">reads 200K · Read/Grep only · haiku, low effort</text>
<text x="495" y="192" font-size="9" text-anchor="middle" fill="currentColor" opacity=".5">discarded when it returns</text>
<line x1="495" y1="136" x2="495" y2="100" stroke="var(--accent)" stroke-width="1.4" marker-end="url(#ar-asub)"/>
<text x="505" y="122" font-size="10" fill="var(--accent)">returns a conclusion</text>
<text x="0" y="170" font-size="11" fill="currentColor" opacity=".75">The cost: it starts cold and</text>
<text x="0" y="186" font-size="11" fill="currentColor" opacity=".75">re-derives what you already know.</text>
<text x="0" y="210" font-size="11" fill="currentColor" opacity=".75">So: large input + small output → delegate.</text>
<text x="0" y="226" font-size="11" fill="currentColor" opacity=".75">Small input + large output → keep it inline.</text>
</svg>` },

'a-runner': { caption: 'Two independent questions decide the option: who supplies the harness, and who supplies the deployment. Only one square answers both.',
  alt: 'A two-by-two grid placing the manual loop, Tool Runner, the Claude Agent SDK and Managed Agents against whether each supplies a harness and whether it supplies hosting.',
  svg: `<svg viewBox="0 0 660 248" role="img" aria-label="Manual loop, Tool Runner, Agent SDK and Managed Agents placed by harness and hosting">
<text x="150" y="16" font-size="10.5" fill="currentColor" opacity=".65" letter-spacing="1.2">YOU HOST IT</text>
<text x="420" y="16" font-size="10.5" fill="currentColor" opacity=".65" letter-spacing="1.2">ANTHROPIC HOSTS IT</text>
<text x="0" y="70" font-size="10.5" fill="currentColor" opacity=".65" letter-spacing="1.2">NO</text>
<text x="0" y="84" font-size="10.5" fill="currentColor" opacity=".65" letter-spacing="1.2">HARNESS</text>
<text x="0" y="164" font-size="10.5" fill="currentColor" opacity=".65" letter-spacing="1.2">HARNESS</text>
<text x="0" y="178" font-size="10.5" fill="currentColor" opacity=".65" letter-spacing="1.2">SUPPLIED</text>
<g font-size="11.5" fill="currentColor">
  <rect x="96" y="26" width="250" height="76" rx="7" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".5"/>
  <text x="221" y="54" text-anchor="middle">the manual loop</text>
  <text x="221" y="72" font-size="10" text-anchor="middle" opacity=".7">nine lines you write once</text>
  <text x="221" y="88" font-size="9.5" text-anchor="middle" opacity=".55">so you can judge everything else</text>

  <rect x="360" y="26" width="250" height="76" rx="7" fill="none" stroke="currentColor" stroke-width="1" opacity=".2" stroke-dasharray="4 4"/>
  <text x="485" y="68" font-size="10.5" text-anchor="middle" opacity=".4">— nothing lives here —</text>

  <rect x="96" y="114" width="250" height="112" rx="7" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".5"/>
  <text x="221" y="140" text-anchor="middle">Tool Runner</text>
  <text x="221" y="156" font-size="9.5" text-anchor="middle" opacity=".7">your tools · per-turn hooks · no built-ins</text>
  <line x1="112" y1="168" x2="330" y2="168" stroke="currentColor" stroke-width="1" opacity=".25"/>
  <text x="221" y="188" text-anchor="middle">Claude Agent SDK</text>
  <text x="221" y="204" font-size="9.5" text-anchor="middle" opacity=".7">Claude Code as a library —</text>
  <text x="221" y="217" font-size="9.5" text-anchor="middle" opacity=".7">file, shell, search tools included</text>

  <rect x="360" y="114" width="250" height="112" rx="7" fill="none" stroke="var(--accent)" stroke-width="1.6"/>
  <text x="485" y="152" text-anchor="middle" fill="var(--accent)">Managed Agents</text>
  <text x="485" y="172" font-size="10" text-anchor="middle" opacity=".75">harness AND the container</text>
  <text x="485" y="188" font-size="10" text-anchor="middle" opacity=".75">your tools execute in</text>
  <text x="485" y="208" font-size="9.5" text-anchor="middle" opacity=".55">sessions, budgets, schedules</text>
</g>
</svg>` },

'a-managed': { caption: 'The agent is a durable, versioned object; sessions are disposable runs against it. Creating an agent per request throws away the entire point of the surface.',
  alt: 'A control plane holding one versioned agent config, and a data plane where many disposable sessions reference it by id, each with its own container and budget.',
  svg: `<svg viewBox="0 0 660 234" role="img" aria-label="One durable agent config, many disposable sessions referencing it">
<defs><marker id="ar-amgd" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--accent)"/></marker></defs>
<text x="0" y="12" font-size="10.5" fill="currentColor" opacity=".65" letter-spacing="1.2">CONTROL PLANE — ONCE</text>
<rect x="0" y="24" width="240" height="94" rx="7" fill="none" stroke="var(--accent)" stroke-width="1.6"/>
<text x="120" y="48" font-size="12" text-anchor="middle" fill="var(--accent)">agent</text>
<g font-size="10" fill="currentColor" opacity=".8">
  <text x="18" y="68">model · system · tools · skills</text>
  <text x="18" y="86">versioned — v1, v2, v3…</text>
  <text x="18" y="104" fill="var(--accent)">store the id. never re-create.</text>
</g>
<text x="380" y="12" font-size="10.5" fill="currentColor" opacity=".65" letter-spacing="1.2">DATA PLANE — EVERY RUN</text>
<g font-size="10" fill="currentColor">
  <rect x="380" y="24" width="280" height="26" rx="5" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".6"/><text x="392" y="41">session · container · budget $5 · Mon</text>
  <rect x="380" y="56" width="280" height="26" rx="5" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".6"/><text x="392" y="73">session · container · budget $5 · Tue</text>
  <rect x="380" y="88" width="280" height="26" rx="5" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".6"/><text x="392" y="105">session · container · budget $5 · Wed</text>
</g>
<line x1="376" y1="70" x2="248" y2="70" stroke="var(--accent)" stroke-width="1.4" marker-end="url(#ar-amgd)"/>
<text x="256" y="62" font-size="9.5" fill="var(--accent)">agent_id</text>
<text x="380" y="132" font-size="10" fill="currentColor" opacity=".6">no model, no system, no tools here</text>
<line x1="0" y1="152" x2="620" y2="152" stroke="currentColor" stroke-width="1" opacity=".22"/>
<text x="0" y="174" font-size="10.5" fill="#d2603f" letter-spacing="1.2">THE CLASSIC MISTAKE</text>
<g font-size="10" fill="currentColor">
  <rect x="0" y="186" width="150" height="24" rx="4" fill="none" stroke="#d2603f" stroke-width="1.2"/><text x="75" y="202" text-anchor="middle">agent + session</text>
  <rect x="158" y="186" width="150" height="24" rx="4" fill="none" stroke="#d2603f" stroke-width="1.2"/><text x="233" y="202" text-anchor="middle">agent + session</text>
  <rect x="316" y="186" width="150" height="24" rx="4" fill="none" stroke="#d2603f" stroke-width="1.2"/><text x="391" y="202" text-anchor="middle">agent + session</text>
</g>
<text x="480" y="196" font-size="11" fill="#d2603f">40,000 agents.</text>
<text x="480" y="210" font-size="11" fill="currentColor" opacity=".7">Versioning gone.</text>
<text x="0" y="230" font-size="11" fill="currentColor" opacity=".7">Vault credentials are substituted at egress — the secret never enters the container.</text>
</svg>` },

'a-scheduled': { caption: 'Nobody is watching, so every implicit safeguard becomes an explicit mechanism — and the agent earns write access by first showing you what it would have done.',
  alt: 'A four-stage graduation path from observing to acting, alongside the mechanisms that replace a watching human: a hard budget, structured output and alerting only on anomalies.',
  svg: `<svg viewBox="0 0 660 236" role="img" aria-label="The graduation path from read-only to acting, and the mechanisms that replace supervision">
<defs><marker id="ar-asch" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="currentColor"/></marker></defs>
<text x="0" y="12" font-size="10.5" fill="currentColor" opacity=".65" letter-spacing="1.2">EARN THE ACCESS, IN THIS ORDER</text>
<g font-size="10.5" fill="currentColor">
  <rect x="0" y="24" width="136" height="44" rx="6" fill="none" stroke="#2e9e6b" stroke-width="1.4"/><text x="68" y="43" text-anchor="middle">observe</text><text x="68" y="58" text-anchor="middle" font-size="9" opacity=".7">read-only, 2 weeks</text>
  <rect x="162" y="24" width="136" height="44" rx="6" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".65"/><text x="230" y="43" text-anchor="middle">propose</text><text x="230" y="58" text-anchor="middle" font-size="9" opacity=".7">reports what it would do</text>
  <rect x="324" y="24" width="136" height="44" rx="6" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".65"/><text x="392" y="43" text-anchor="middle">act with approval</text><text x="392" y="58" text-anchor="middle" font-size="9" opacity=".7">a human confirms</text>
  <rect x="486" y="24" width="136" height="44" rx="6" fill="none" stroke="var(--accent)" stroke-width="1.4"/><text x="554" y="43" text-anchor="middle" fill="var(--accent)">act</text><text x="554" y="58" text-anchor="middle" font-size="9" opacity=".7">only what the reports showed</text>
</g>
<g stroke="currentColor" stroke-width="1.2" opacity=".55">
  <line x1="140" y1="46" x2="158" y2="46" marker-end="url(#ar-asch)"/><line x1="302" y1="46" x2="320" y2="46" marker-end="url(#ar-asch)"/><line x1="464" y1="46" x2="482" y2="46" marker-end="url(#ar-asch)"/>
</g>
<text x="0" y="90" font-size="11" fill="#d2603f">Skipping to the end means discovering your specification gaps in production.</text>
<line x1="0" y1="110" x2="620" y2="110" stroke="currentColor" stroke-width="1" opacity=".22"/>
<text x="0" y="132" font-size="10.5" fill="currentColor" opacity=".65" letter-spacing="1.2">WHAT REPLACES THE WATCHING HUMAN</text>
<g font-size="10.5" fill="currentColor">
  <rect x="0" y="144" width="196" height="56" rx="6" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".6"/>
  <text x="14" y="164">was: "I'd have stopped it"</text><text x="14" y="184" fill="var(--accent)">now: hard budget, in dollars</text>
  <rect x="212" y="144" width="196" height="56" rx="6" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".6"/>
  <text x="226" y="164">was: "I'd have read it"</text><text x="226" y="184" fill="var(--accent)">now: structured output</text>
  <rect x="424" y="144" width="196" height="56" rx="6" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".6"/>
  <text x="438" y="164">was: "I'd have noticed"</text><text x="438" y="184" fill="var(--accent)">now: alert on anomaly only</text>
</g>
<text x="0" y="226" font-size="11" fill="currentColor" opacity=".75">A green run is silent — so a notification always means something.</text>
</svg>` },

'k-hooks': { caption: 'An instruction is a request the model usually honours. A hook is a command with an exit code — non-zero and the tool call never happens.',
  alt: 'A tool call passing through a PreToolUse gate that blocks it on a non-zero exit code, then a PostToolUse hook running after the write succeeds.',
  svg: `<svg viewBox="0 0 660 226" role="img" aria-label="A PreToolUse hook gates a tool call by exit code; PostToolUse runs after it">
<defs><marker id="ar-khook" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="currentColor"/></marker></defs>
<g font-size="11" fill="currentColor">
  <rect x="0" y="52" width="112" height="40" rx="6" fill="none" stroke="currentColor" stroke-width="1.3"/><text x="56" y="76" text-anchor="middle">Claude edits</text>
  <rect x="164" y="46" width="130" height="52" rx="6" fill="none" stroke="var(--accent)" stroke-width="1.6"/>
  <text x="229" y="68" text-anchor="middle" fill="var(--accent)">PreToolUse</text><text x="229" y="84" text-anchor="middle" font-size="9.5" opacity=".75">your shell command</text>
  <rect x="404" y="14" width="140" height="40" rx="6" fill="none" stroke="#d2603f" stroke-width="1.4"/><text x="474" y="38" text-anchor="middle" fill="#d2603f">BLOCKED</text>
  <rect x="404" y="90" width="140" height="40" rx="6" fill="none" stroke="#2e9e6b" stroke-width="1.4"/><text x="474" y="114" text-anchor="middle">write proceeds</text>
</g>
<line x1="116" y1="72" x2="160" y2="72" stroke="currentColor" stroke-width="1.3" marker-end="url(#ar-khook)"/>
<path d="M298 62 C 350 62, 360 34, 400 34" fill="none" stroke="#d2603f" stroke-width="1.4" marker-end="url(#ar-khook)"/>
<text x="312" y="30" font-size="10" fill="#d2603f">exit 1</text>
<path d="M298 84 C 350 84, 360 110, 400 110" fill="none" stroke="#2e9e6b" stroke-width="1.4" marker-end="url(#ar-khook)"/>
<text x="312" y="128" font-size="10" fill="#2e9e6b">exit 0</text>
<line x1="548" y1="110" x2="592" y2="110" stroke="currentColor" stroke-width="1.3" marker-end="url(#ar-khook)"/>
<text x="596" y="106" font-size="10" fill="currentColor" opacity=".8">PostToolUse</text>
<text x="596" y="120" font-size="9" fill="currentColor" opacity=".6">formatter runs</text>
<line x1="0" y1="156" x2="620" y2="156" stroke="currentColor" stroke-width="1" opacity=".22"/>
<text x="0" y="178" font-size="11" fill="currentColor" opacity=".75">"Please run the formatter after editing" — a request the model usually honours.</text>
<text x="0" y="196" font-size="11" fill="var(--accent)">A PostToolUse hook that runs it — a guarantee. "Usually" is not a security property.</text>
<text x="0" y="220" font-size="11" fill="currentColor" opacity=".6">SessionStart is the one most teams miss: it makes a fresh cloud session usable on turn one.</text>
</svg>` },

'k-skills': { caption: 'A Skill\'s body costs nothing until its description matches. That is why you can ship ten thousand words of specialist procedure and pay for none of it on unrelated work.',
  alt: 'Three installed skills where only the one whose description matches the request loads its body into context; the other two remain unloaded and cost nothing.',
  svg: `<svg viewBox="0 0 660 224" role="img" aria-label="Only the skill whose description matches the request loads its body">
<defs><marker id="ar-kskl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--accent)"/></marker></defs>
<rect x="0" y="30" width="192" height="42" rx="6" fill="none" stroke="currentColor" stroke-width="1.3"/>
<text x="96" y="49" font-size="11" text-anchor="middle" fill="currentColor">"write the postmortem</text>
<text x="96" y="64" font-size="11" text-anchor="middle" fill="currentColor">for last night's outage"</text>
<text x="0" y="20" font-size="10.5" fill="currentColor" opacity=".65" letter-spacing="1.2">THE REQUEST</text>
<text x="266" y="20" font-size="10.5" fill="currentColor" opacity=".65" letter-spacing="1.2">INSTALLED SKILLS — DESCRIPTIONS ONLY</text>
<g font-size="10.5" fill="currentColor">
  <rect x="266" y="30" width="200" height="30" rx="5" fill="none" stroke="var(--accent)" stroke-width="1.5"/><text x="278" y="49" fill="var(--accent)">incident-report</text>
  <rect x="266" y="68" width="200" height="30" rx="5" fill="none" stroke="currentColor" stroke-width="1" opacity=".4"/><text x="278" y="87" opacity=".55">api-review</text>
  <rect x="266" y="106" width="200" height="30" rx="5" fill="none" stroke="currentColor" stroke-width="1" opacity=".4"/><text x="278" y="125" opacity=".55">brand-system</text>
</g>
<line x1="196" y1="46" x2="262" y2="46" stroke="var(--accent)" stroke-width="1.4" marker-end="url(#ar-kskl)"/>
<text x="229" y="40" font-size="9" text-anchor="middle" fill="var(--accent)">matches</text>
<line x1="470" y1="45" x2="512" y2="45" stroke="var(--accent)" stroke-width="1.4" marker-end="url(#ar-kskl)"/>
<rect x="516" y="24" width="144" height="76" rx="6" fill="none" stroke="var(--accent)" stroke-width="1.5"/>
<text x="588" y="44" font-size="10.5" text-anchor="middle" fill="var(--accent)">SKILL.md body</text>
<text x="588" y="60" font-size="9.5" text-anchor="middle" fill="currentColor" opacity=".75">+ scripts/lint_report.py</text>
<text x="588" y="78" font-size="9.5" text-anchor="middle" fill="currentColor" opacity=".75">loaded into context</text>
<text x="588" y="92" font-size="9" text-anchor="middle" fill="currentColor" opacity=".5">now, and only now</text>
<text x="470" y="87" font-size="10" fill="currentColor" opacity=".5">unloaded — 0 tokens</text>
<text x="470" y="125" font-size="10" fill="currentColor" opacity=".5">unloaded — 0 tokens</text>
<line x1="0" y1="154" x2="620" y2="154" stroke="currentColor" stroke-width="1" opacity=".22"/>
<text x="0" y="176" font-size="11" fill="var(--accent)">The description is the retrieval key — it decides whether the skill fires at all.</text>
<text x="0" y="196" font-size="11" fill="currentColor" opacity=".75">List the literal words a user would say. A brilliant skill with a vague description never runs.</text>
<text x="0" y="218" font-size="11" fill="currentColor" opacity=".6">Ten installed skills cost about as much as none until one of them is relevant.</text>
</svg>` },

'k-permissions': { caption: 'Rules layer, and a lower scope can never widen what a higher one forbids. Allowlisting the noise is what keeps the remaining prompts meaningful.',
  alt: 'Three settings scopes stacked with managed settings outermost constraining project and user scopes, and an allow and deny split showing which calls prompt.',
  svg: `<svg viewBox="0 0 660 230" role="img" aria-label="Settings scopes layer, and allow versus deny decides what prompts you">
<rect x="0" y="20" width="290" height="120" rx="8" fill="none" stroke="var(--accent)" stroke-width="1.6"/>
<text x="14" y="40" font-size="10.5" fill="var(--accent)">managed / enterprise</text>
<rect x="22" y="50" width="246" height="80" rx="7" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".7"/>
<text x="36" y="70" font-size="10.5" fill="currentColor" opacity=".85">project · .claude/settings.json</text>
<rect x="44" y="80" width="202" height="40" rx="6" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".5"/>
<text x="58" y="104" font-size="10.5" fill="currentColor" opacity=".7">user</text>
<text x="0" y="162" font-size="11" fill="currentColor" opacity=".75">An inner scope can narrow, never widen.</text>
<text x="0" y="178" font-size="11" fill="currentColor" opacity=".75">That is what makes agent autonomy defensible in an org.</text>
<text x="356" y="16" font-size="10.5" fill="currentColor" opacity=".65" letter-spacing="1.2">WHAT ACTUALLY PROMPTS YOU</text>
<g font-size="10.5" fill="currentColor">
  <rect x="356" y="26" width="304" height="34" rx="5" fill="none" stroke="#2e9e6b" stroke-width="1.3"/>
  <text x="368" y="47"><tspan fill="#2e9e6b">allow</tspan>  git status · rg · Read(src/**) → silent</text>
  <rect x="356" y="66" width="304" height="34" rx="5" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".65"/>
  <text x="368" y="87">everything else → asks</text>
  <rect x="356" y="106" width="304" height="34" rx="5" fill="none" stroke="#d2603f" stroke-width="1.3"/>
  <text x="368" y="127"><tspan fill="#d2603f">deny</tspan>  .env · *.pem · git push → refused</text>
</g>
<text x="356" y="162" font-size="11" fill="currentColor" opacity=".75">Deny wins where they overlap — even if</text>
<text x="356" y="178" font-size="11" fill="currentColor" opacity=".75">you would have said yes in the moment.</text>
<line x1="0" y1="196" x2="620" y2="196" stroke="currentColor" stroke-width="1" opacity=".22"/>
<text x="0" y="220" font-size="11" fill="#d2603f">Forty prompts an hour for 'ls' trains reflexive approval — a worse posture than a good allowlist.</text>
</svg>` },

'k-remote': { caption: 'Separate worktrees give each session its own checkout, so parallel work never collides. The limit is task independence, not session count.',
  alt: 'One repository with three worktrees, each checked out to a different branch with its own background session, contrasted with three sessions sharing one working tree.',
  svg: `<svg viewBox="0 0 660 236" role="img" aria-label="Worktrees let sessions run in parallel; sharing one tree does not">
<defs><marker id="ar-krem" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="currentColor"/></marker></defs>
<rect x="0" y="56" width="110" height="44" rx="6" fill="none" stroke="currentColor" stroke-width="1.3"/>
<text x="55" y="82" font-size="11" text-anchor="middle" fill="currentColor">one repo</text>
<g font-size="10.5" fill="currentColor">
  <rect x="196" y="16" width="180" height="34" rx="5" fill="none" stroke="#2e9e6b" stroke-width="1.3"/><text x="208" y="37">wt-deps · chore/deps</text>
  <rect x="196" y="60" width="180" height="34" rx="5" fill="none" stroke="#2e9e6b" stroke-width="1.3"/><text x="208" y="81">wt-flake · fix/flaky-ws</text>
  <rect x="196" y="104" width="180" height="34" rx="5" fill="none" stroke="#2e9e6b" stroke-width="1.3"/><text x="208" y="125">wt-docs · docs/pass</text>
</g>
<g stroke="currentColor" stroke-width="1.2" opacity=".6">
  <line x1="114" y1="72" x2="192" y2="33" marker-end="url(#ar-krem)"/><line x1="114" y1="78" x2="192" y2="77" marker-end="url(#ar-krem)"/><line x1="114" y1="84" x2="192" y2="121" marker-end="url(#ar-krem)"/>
</g>
<g font-size="10" fill="currentColor" opacity=".8">
  <text x="392" y="37">background session →  mergeable branch</text>
  <text x="392" y="81">background session →  mergeable branch</text>
  <text x="392" y="125">background session →  mergeable branch</text>
</g>
<text x="0" y="168" font-size="11" fill="#2e9e6b">Independent, reading-heavy chores parallelise cleanly.</text>
<line x1="0" y1="184" x2="620" y2="184" stroke="currentColor" stroke-width="1" opacity=".22"/>
<text x="0" y="206" font-size="11" fill="#d2603f">Four sessions on the same module is a merge conflict with extra steps —</text>
<text x="0" y="222" font-size="11" fill="currentColor" opacity=".75">reconciling the diffs costs more than doing the work sequentially would have.</text>
</svg>` },

's-guardrails': { caption: 'A refusal is a normal 200 response. Code that reads content without first checking stop_reason hands users a blank string on the one path nobody tests.',
  alt: 'A response branching on stop_reason into end_turn, refusal, max_tokens, tool_use and pause_turn, with the refusal path shown returning HTTP 200 and raising nothing.',
  svg: `<svg viewBox="0 0 660 244" role="img" aria-label="Branch on stop_reason before reading content; a refusal is a 200">
<defs><marker id="ar-sgrd" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="currentColor"/></marker></defs>
<rect x="0" y="88" width="132" height="44" rx="6" fill="none" stroke="currentColor" stroke-width="1.4"/>
<text x="66" y="106" font-size="11" text-anchor="middle" fill="currentColor">response</text>
<text x="66" y="122" font-size="9.5" text-anchor="middle" fill="#2e9e6b">HTTP 200, always</text>
<text x="150" y="104" font-size="10.5" fill="var(--accent)">check</text>
<text x="150" y="118" font-size="10.5" fill="var(--accent)">stop_reason</text>
<g font-size="10.5" fill="currentColor">
  <rect x="252" y="8" width="150" height="30" rx="5" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".6"/><text x="264" y="27">end_turn</text>
  <rect x="252" y="46" width="150" height="30" rx="5" fill="none" stroke="#d2603f" stroke-width="1.5"/><text x="264" y="65" fill="#d2603f">refusal</text>
  <rect x="252" y="84" width="150" height="30" rx="5" fill="none" stroke="#d2603f" stroke-width="1.3"/><text x="264" y="103" fill="#d2603f">max_tokens</text>
  <rect x="252" y="122" width="150" height="30" rx="5" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".6"/><text x="264" y="141">tool_use</text>
  <rect x="252" y="160" width="150" height="30" rx="5" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".6"/><text x="264" y="179">pause_turn</text>
</g>
<g stroke="currentColor" stroke-width="1.1" opacity=".55">
  <line x1="222" y1="108" x2="248" y2="23" marker-end="url(#ar-sgrd)"/><line x1="222" y1="108" x2="248" y2="61" marker-end="url(#ar-sgrd)"/>
  <line x1="222" y1="108" x2="248" y2="99" marker-end="url(#ar-sgrd)"/><line x1="222" y1="108" x2="248" y2="137" marker-end="url(#ar-sgrd)"/>
  <line x1="222" y1="108" x2="248" y2="175" marker-end="url(#ar-sgrd)"/>
</g>
<g font-size="10" fill="currentColor" opacity=".8">
  <text x="414" y="27">read content — the only safe path</text>
  <text x="414" y="59" fill="#d2603f">stop_details.category · nothing raised</text>
  <text x="414" y="72" font-size="9" opacity=".7">populated ONLY here — null everywhere else</text>
  <text x="414" y="103" fill="#d2603f">truncated mid-thought — do not parse</text>
  <text x="414" y="141">run the tools, loop</text>
  <text x="414" y="179">a server tool wants to continue</text>
</g>
<line x1="0" y1="204" x2="620" y2="204" stroke="currentColor" stroke-width="1" opacity=".22"/>
<text x="0" y="226" font-size="11" fill="#d2603f">response.content[0].text with no check → a silent empty string on the path you never exercised.</text>
</svg>` },

's-batch': { caption: 'Batch results come back in any order. Positional matching passes every small test and silently attaches the wrong summary to a third of your records at volume.',
  alt: 'Three documents submitted with custom ids, returning in a different order; zipping by position mismatches them while keying by custom id restores the correct pairing.',
  svg: `<svg viewBox="0 0 660 238" role="img" aria-label="Key batch results by custom_id, never by position">
<defs><marker id="ar-sbat" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="currentColor"/></marker></defs>
<text x="0" y="12" font-size="10.5" fill="currentColor" opacity=".65" letter-spacing="1.2">SUBMITTED</text>
<g font-size="10.5" fill="currentColor">
  <rect x="0" y="24" width="120" height="26" rx="4" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".65"/><text x="60" y="41" text-anchor="middle">doc-A</text>
  <rect x="0" y="56" width="120" height="26" rx="4" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".65"/><text x="60" y="73" text-anchor="middle">doc-B</text>
  <rect x="0" y="88" width="120" height="26" rx="4" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".65"/><text x="60" y="105" text-anchor="middle">doc-C</text>
</g>
<text x="240" y="12" font-size="10.5" fill="currentColor" opacity=".65" letter-spacing="1.2">RETURNED — ANY ORDER</text>
<g font-size="10.5" fill="currentColor">
  <rect x="240" y="24" width="150" height="26" rx="4" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".65"/><text x="252" y="41">result · custom_id C</text>
  <rect x="240" y="56" width="150" height="26" rx="4" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".65"/><text x="252" y="73">result · custom_id A</text>
  <rect x="240" y="88" width="150" height="26" rx="4" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".65"/><text x="252" y="105">result · custom_id B</text>
</g>
<g stroke="#d2603f" stroke-width="1.2" opacity=".8">
  <line x1="124" y1="37" x2="236" y2="37" marker-end="url(#ar-sbat)"/><line x1="124" y1="69" x2="236" y2="69" marker-end="url(#ar-sbat)"/><line x1="124" y1="101" x2="236" y2="101" marker-end="url(#ar-sbat)"/>
</g>
<text x="410" y="41" font-size="10" fill="#d2603f">zip() → A gets C's summary</text>
<text x="410" y="73" font-size="10" fill="#d2603f">zip() → B gets A's summary</text>
<text x="410" y="105" font-size="10" fill="#d2603f">zip() → C gets B's summary</text>
<line x1="0" y1="134" x2="620" y2="134" stroke="currentColor" stroke-width="1" opacity=".22"/>
<text x="0" y="156" font-size="10.5" fill="#2e9e6b" letter-spacing="1.2">KEYED BY custom_id</text>
<rect x="0" y="166" width="390" height="34" rx="5" fill="none" stroke="#2e9e6b" stroke-width="1.4"/>
<text x="14" y="188" font-size="11" fill="currentColor">out[r.custom_id] = r.result.message</text>
<text x="410" y="188" font-size="11" fill="#2e9e6b">order stops mattering</text>
<text x="0" y="224" font-size="11" fill="currentColor" opacity=".75">Handle all four outcomes: succeeded · errored · canceled · expired. Async work is half price.</text>
</svg>` },

's-cost': { caption: 'There is a correct order, and it exists because the early levers cost nothing in quality while the later ones do. Most bills fall a long way before any tradeoff.',
  alt: 'A ladder of cost levers with caching, hygiene and batching marked as free of quality cost, and effort then model choice marked as genuine tradeoffs to take last.',
  svg: `<svg viewBox="0 0 660 244" role="img" aria-label="Cost levers in order: free wins first, tradeoffs last">
<text x="0" y="12" font-size="10.5" fill="#2e9e6b" letter-spacing="1.2">FREE — CHANGES NOTHING ABOUT THE OUTPUT</text>
<g font-size="11" fill="currentColor">
  <rect x="0" y="24" width="470" height="30" rx="5" fill="#2e9e6b" opacity=".14"/>
  <rect x="0" y="24" width="470" height="30" rx="5" fill="none" stroke="#2e9e6b" stroke-width="1.3"/>
  <text x="14" y="44"><tspan font-size="10" opacity=".6">1</tspan>   prompt caching — usually the single biggest lever</text>
  <rect x="0" y="60" width="400" height="30" rx="5" fill="#2e9e6b" opacity=".1"/>
  <rect x="0" y="60" width="400" height="30" rx="5" fill="none" stroke="#2e9e6b" stroke-width="1.2"/>
  <text x="14" y="80"><tspan font-size="10" opacity=".6">2</tspan>   input hygiene — stop resending what has not changed</text>
  <rect x="0" y="96" width="330" height="30" rx="5" fill="#2e9e6b" opacity=".1"/>
  <rect x="0" y="96" width="330" height="30" rx="5" fill="none" stroke="#2e9e6b" stroke-width="1.2"/>
  <text x="14" y="116"><tspan font-size="10" opacity=".6">3</tspan>   batch anything async — straight 50%</text>
</g>
<line x1="0" y1="142" x2="620" y2="142" stroke="currentColor" stroke-width="1.2" opacity=".35" stroke-dasharray="5 4"/>
<text x="0" y="164" font-size="10.5" fill="#d2603f" letter-spacing="1.2">TRADEOFFS — MEASURE BEFORE AND AFTER</text>
<g font-size="11" fill="currentColor">
  <rect x="0" y="176" width="240" height="30" rx="5" fill="none" stroke="#d2603f" stroke-width="1.2"/>
  <text x="14" y="196"><tspan font-size="10" opacity=".6">4</tspan>   lower effort, same model</text>
  <rect x="248" y="176" width="240" height="30" rx="5" fill="none" stroke="#d2603f" stroke-width="1.2"/>
  <text x="262" y="196"><tspan font-size="10" opacity=".6">5</tspan>   a cheaper model — last</text>
</g>
<text x="0" y="228" font-size="11" fill="#d2603f">Caches are model-scoped: a cascade forfeits reuse across its models.</text>
<text x="0" y="242" font-size="11" fill="currentColor" opacity=".75">Measure cost per completed task — a cheap request that needs three retries is not cheap.</text>
</svg>` },

's-evals': { caption: 'Score in layers, cheapest first. Deterministic checks catch most regressions for free and never drift; reserve the model judge for the genuinely subjective axis.',
  alt: 'Candidate output passing through deterministic checks for schema, citations, cost and latency before reaching a model judge scoring five binary criteria, gating a merge.',
  svg: `<svg viewBox="0 0 660 232" role="img" aria-label="Layered eval scoring: deterministic checks before a model judge, gating CI">
<defs><marker id="ar-sev" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="currentColor"/></marker></defs>
<rect x="0" y="60" width="104" height="40" rx="6" fill="none" stroke="currentColor" stroke-width="1.3"/>
<text x="52" y="78" font-size="11" text-anchor="middle" fill="currentColor">20 real</text>
<text x="52" y="92" font-size="11" text-anchor="middle" fill="currentColor">cases</text>
<rect x="140" y="34" width="176" height="92" rx="7" fill="none" stroke="#2e9e6b" stroke-width="1.4"/>
<text x="228" y="54" font-size="10.5" text-anchor="middle" fill="#2e9e6b">LAYER 1 — DETERMINISTIC</text>
<g font-size="10" fill="currentColor" opacity=".85">
  <text x="154" y="72">schema valid?</text><text x="154" y="88">required citations present?</text><text x="154" y="104">under cost + latency bound?</text>
</g>
<text x="228" y="140" font-size="9.5" text-anchor="middle" fill="#2e9e6b">free · never drifts · catches most</text>
<rect x="352" y="34" width="176" height="92" rx="7" fill="none" stroke="var(--accent)" stroke-width="1.4"/>
<text x="440" y="54" font-size="10.5" text-anchor="middle" fill="var(--accent)">LAYER 2 — JUDGE</text>
<g font-size="10" fill="currentColor" opacity=".85">
  <text x="366" y="72">grounded?  complete?</text><text x="366" y="88">no invention?  scoped?</text><text x="366" y="104">five true/false — never 1–10</text>
</g>
<text x="440" y="140" font-size="9.5" text-anchor="middle" fill="var(--accent)">capable model · validate it by hand</text>
<line x1="108" y1="80" x2="136" y2="80" stroke="currentColor" stroke-width="1.3" marker-end="url(#ar-sev)"/>
<line x1="320" y1="80" x2="348" y2="80" stroke="currentColor" stroke-width="1.3" marker-end="url(#ar-sev)"/>
<line x1="532" y1="80" x2="560" y2="80" stroke="currentColor" stroke-width="1.3" marker-end="url(#ar-sev)"/>
<rect x="564" y="56" width="96" height="48" rx="6" fill="none" stroke="#d2603f" stroke-width="1.4"/>
<text x="612" y="76" font-size="11" text-anchor="middle" fill="#d2603f">CI gate</text>
<text x="612" y="92" font-size="9" text-anchor="middle" fill="currentColor" opacity=".7">blocks the merge</text>
<line x1="0" y1="166" x2="620" y2="166" stroke="currentColor" stroke-width="1" opacity=".22"/>
<text x="0" y="188" font-size="11" fill="currentColor" opacity=".75">Gate on cost and latency too, or you ship +2% quality and 3× spend and hear it from finance.</text>
<text x="0" y="212" font-size="11" fill="var(--accent)">Every production failure becomes a permanent case. That habit compounds faster than any technique here.</text>
</svg>` },

's-deploy': { caption: 'The same model on a different platform is not the same product. Parity is the assumption that breaks quietly, about three weeks in.',
  alt: 'A feature availability matrix across the first-party API, Bedrock, Vertex and Foundry showing which of fast mode, web fetch and Managed Agents each supports.',
  svg: `<svg viewBox="0 0 660 236" role="img" aria-label="Feature availability differs across first-party, Bedrock, Vertex and Foundry">
<g font-size="10.5" fill="currentColor" opacity=".7">
  <text x="196" y="26" text-anchor="middle">first-party</text><text x="308" y="26" text-anchor="middle">Bedrock</text>
  <text x="420" y="26" text-anchor="middle">Vertex</text><text x="532" y="26" text-anchor="middle">Foundry</text>
</g>
<g font-size="10.5" fill="currentColor">
  <text x="0" y="56">fast mode</text><text x="0" y="86">web fetch</text><text x="0" y="116">Managed Agents</text><text x="0" y="146">client class</text><text x="0" y="176">model id form</text>
</g>
<g stroke="currentColor" opacity=".18" stroke-width="1">
  <line x1="0" y1="34" x2="620" y2="34"/><line x1="0" y1="66" x2="620" y2="66"/><line x1="0" y1="96" x2="620" y2="96"/><line x1="0" y1="126" x2="620" y2="126"/><line x1="0" y1="156" x2="620" y2="156"/>
</g>
<g font-size="13" text-anchor="middle">
  <text x="196" y="57" fill="#2e9e6b">✓</text><text x="308" y="57" fill="#d2603f">✗</text><text x="420" y="57" fill="#d2603f">✗</text><text x="532" y="57" fill="#d2603f">✗</text>
  <text x="196" y="87" fill="#2e9e6b">✓</text><text x="308" y="87" fill="#2e9e6b">✓</text><text x="420" y="87" fill="#d2603f">✗</text><text x="532" y="87" fill="#2e9e6b">✓</text>
  <text x="196" y="117" fill="#2e9e6b">✓</text><text x="308" y="117" fill="#d2603f">✗</text><text x="420" y="117" fill="#d2603f">✗</text><text x="532" y="117" fill="#d2603f">✗</text>
</g>
<g font-size="9" text-anchor="middle" fill="currentColor" opacity=".8">
  <text x="196" y="147">Anthropic()</text><text x="308" y="147">AnthropicBedrockMantle</text><text x="420" y="147">AnthropicVertex</text><text x="532" y="147">AnthropicFoundry</text>
  <text x="196" y="177">claude-opus-5</text><text x="308" y="177">anthropic.claude-opus-5</text><text x="420" y="177">claude-opus-4-5@date</text><text x="532" y="177">claude-opus-5</text>
</g>
<line x1="0" y1="196" x2="620" y2="196" stroke="currentColor" stroke-width="1" opacity=".22"/>
<text x="0" y="218" font-size="11" fill="#d2603f">Never the first-party client with a swapped base_url — use the dedicated class.</text>
<text x="0" y="234" font-size="11" fill="currentColor" opacity=".7">Verify availability before you design around a feature.</text>
</svg>` },

'f-artifacts': { caption: 'The viewer has three states, not two. A colour defined only inside a dark-mode query never applies in the default un-stamped state — the classic unreadable-page bug.',
  alt: 'Three viewer theme states — explicit light, explicit dark, and the unstamped system default — mapped to which CSS block supplies the tokens in each.',
  svg: `<svg viewBox="0 0 660 230" role="img" aria-label="Three viewer theme states and which CSS block wins in each">
<defs><marker id="ar-fart" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="currentColor"/></marker></defs>
<text x="0" y="12" font-size="10.5" fill="currentColor" opacity=".65" letter-spacing="1.2">WHAT THE VIEWER'S ROOT ELEMENT CARRIES</text>
<g font-size="10.5" fill="currentColor">
  <rect x="0" y="24" width="200" height="34" rx="5" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".65"/><text x="100" y="45" text-anchor="middle">data-theme="light"</text>
  <rect x="0" y="66" width="200" height="34" rx="5" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".65"/><text x="100" y="87" text-anchor="middle">data-theme="dark"</text>
  <rect x="0" y="108" width="200" height="42" rx="5" fill="none" stroke="var(--accent)" stroke-width="1.6"/><text x="100" y="126" text-anchor="middle" fill="var(--accent)">nothing stamped</text><text x="100" y="141" text-anchor="middle" font-size="9" opacity=".75">"system" — the default, most viewers</text>
</g>
<g stroke="currentColor" stroke-width="1.2" opacity=".6">
  <line x1="204" y1="41" x2="288" y2="41" marker-end="url(#ar-fart)"/><line x1="204" y1="83" x2="288" y2="83" marker-end="url(#ar-fart)"/>
</g>
<line x1="204" y1="129" x2="288" y2="129" stroke="var(--accent)" stroke-width="1.5" marker-end="url(#ar-fart)"/>
<g font-size="10" fill="currentColor">
  <rect x="292" y="24" width="368" height="34" rx="5" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".5"/><text x="304" y="45">bare :root — the complete light palette</text>
  <rect x="292" y="66" width="368" height="34" rx="5" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".5"/><text x="304" y="87">:root[data-theme="dark"] — so the toggle wins</text>
  <rect x="292" y="108" width="368" height="42" rx="5" fill="none" stroke="var(--accent)" stroke-width="1.5"/>
  <text x="304" y="126" fill="var(--accent)">@media (prefers-color-scheme: dark)</text>
  <text x="304" y="141" fill="var(--accent)">  :root:not([data-theme="light"])</text>
</g>
<line x1="0" y1="168" x2="620" y2="168" stroke="currentColor" stroke-width="1" opacity=".22"/>
<text x="0" y="190" font-size="11" fill="#d2603f">A colour whose only definition sits inside a media or [data-theme] block never applies in the third state.</text>
<text x="0" y="210" font-size="11" fill="currentColor" opacity=".75">Define every token on bare :root, then redefine — and give body an explicit background,</text>
<text x="0" y="226" font-size="11" fill="currentColor" opacity=".75">or it borrows the host's ground and you get one theme's text on the other's background.</text>
</svg>` },

'f-viz': { caption: 'The axis is an argument. Starting y above zero magnifies a change you have not measured — the same data, made to say something else.',
  alt: 'The same five data points drawn twice: on a truncated axis the change looks dramatic, and on a zero-based axis it is visibly small.',
  svg: `<svg viewBox="0 0 660 236" role="img" aria-label="The same data on a truncated axis and a zero-based axis">
<text x="0" y="12" font-size="10.5" fill="#d2603f" letter-spacing="1.2">TRUNCATED — Y FROM 94%</text>
<line x1="30" y1="26" x2="30" y2="126" stroke="currentColor" stroke-width="1.1" opacity=".55"/>
<line x1="30" y1="126" x2="270" y2="126" stroke="currentColor" stroke-width="1.1" opacity=".55"/>
<polyline points="50,110 100,96 150,74 200,50 250,32" fill="none" stroke="#d2603f" stroke-width="2"/>
<g fill="#d2603f"><circle cx="50" cy="110" r="2.6"/><circle cx="100" cy="96" r="2.6"/><circle cx="150" cy="74" r="2.6"/><circle cx="200" cy="50" r="2.6"/><circle cx="250" cy="32" r="2.6"/></g>
<text x="6" y="30" font-size="9" fill="currentColor" opacity=".6">97</text>
<text x="6" y="130" font-size="9" fill="currentColor" opacity=".6">94</text>
<text x="30" y="150" font-size="11" fill="#d2603f">"a dramatic collapse"</text>
<text x="360" y="12" font-size="10.5" fill="#2e9e6b" letter-spacing="1.2">ZERO-BASED — THE SAME NUMBERS</text>
<line x1="390" y1="26" x2="390" y2="126" stroke="currentColor" stroke-width="1.1" opacity=".55"/>
<line x1="390" y1="126" x2="630" y2="126" stroke="currentColor" stroke-width="1.1" opacity=".55"/>
<polyline points="410,32 460,32.9 510,34.3 560,35.8 610,36.9" fill="none" stroke="#2e9e6b" stroke-width="2"/>
<g fill="#2e9e6b"><circle cx="410" cy="32" r="2.6"/><circle cx="460" cy="32.9" r="2.6"/><circle cx="510" cy="34.3" r="2.6"/><circle cx="560" cy="35.8" r="2.6"/><circle cx="610" cy="36.9" r="2.6"/></g>
<text x="366" y="30" font-size="9" fill="currentColor" opacity=".6">100</text>
<text x="374" y="130" font-size="9" fill="currentColor" opacity=".6">0</text>
<text x="390" y="150" font-size="11" fill="#2e9e6b">"a 3-point drift"</text>
<line x1="0" y1="172" x2="620" y2="172" stroke="currentColor" stroke-width="1" opacity=".22"/>
<text x="0" y="194" font-size="11" fill="currentColor" opacity=".8">Write the takeaway sentence first. If you cannot write it, you do not yet have a chart.</text>
<text x="0" y="214" font-size="11" fill="currentColor" opacity=".75">Then: direct-label the series, encode with colour AND dash so it survives greyscale,</text>
<text x="0" y="230" font-size="11" fill="currentColor" opacity=".75">and read gridline colour from tokens — hard-coded #eee vanishes on a dark ground.</text>
</svg>` },

'f-capabilities': { caption: 'Browser storage is private to one viewer in one browser. A poll, a sign-up sheet or a shared checklist needs state that lives outside it.',
  alt: 'Three viewers each holding their own separate browser storage and seeing only their own votes, contrasted with one shared store all three read and write.',
  svg: `<svg viewBox="0 0 660 226" role="img" aria-label="Per-viewer browser storage versus one shared store">
<defs><marker id="ar-fcap" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--accent)"/></marker></defs>
<text x="0" y="12" font-size="10.5" fill="#d2603f" letter-spacing="1.2">localStorage — A POLL BUILT ON IT</text>
<g font-size="10" fill="currentColor">
  <rect x="0" y="24" width="94" height="56" rx="6" fill="none" stroke="#d2603f" stroke-width="1.3"/><text x="47" y="44" text-anchor="middle">Ana</text><text x="47" y="62" text-anchor="middle" opacity=".7">sees 1 vote</text>
  <rect x="102" y="24" width="94" height="56" rx="6" fill="none" stroke="#d2603f" stroke-width="1.3"/><text x="149" y="44" text-anchor="middle">Ben</text><text x="149" y="62" text-anchor="middle" opacity=".7">sees 1 vote</text>
  <rect x="204" y="24" width="94" height="56" rx="6" fill="none" stroke="#d2603f" stroke-width="1.3"/><text x="251" y="44" text-anchor="middle">Cal</text><text x="251" y="62" text-anchor="middle" opacity=".7">sees 1 vote</text>
</g>
<text x="0" y="102" font-size="11" fill="#d2603f">Three private stores. Nobody sees a tally, and it is gone on another device.</text>
<text x="360" y="12" font-size="10.5" fill="var(--accent)" letter-spacing="1.2">SHARED STATE CAPABILITY</text>
<g font-size="10" fill="currentColor">
  <rect x="360" y="24" width="84" height="30" rx="5" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".6"/><text x="402" y="43" text-anchor="middle">Ana</text>
  <rect x="452" y="24" width="84" height="30" rx="5" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".6"/><text x="494" y="43" text-anchor="middle">Ben</text>
  <rect x="544" y="24" width="84" height="30" rx="5" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".6"/><text x="586" y="43" text-anchor="middle">Cal</text>
  <rect x="440" y="80" width="148" height="34" rx="6" fill="none" stroke="var(--accent)" stroke-width="1.5"/><text x="514" y="101" text-anchor="middle" fill="var(--accent)">one tally · 3 votes</text>
</g>
<g stroke="var(--accent)" stroke-width="1.2" opacity=".75">
  <line x1="402" y1="58" x2="470" y2="76" marker-end="url(#ar-fcap)"/><line x1="494" y1="58" x2="508" y2="76" marker-end="url(#ar-fcap)"/><line x1="586" y1="58" x2="552" y2="76" marker-end="url(#ar-fcap)"/>
</g>
<line x1="0" y1="136" x2="620" y2="136" stroke="currentColor" stroke-width="1" opacity=".22"/>
<text x="0" y="158" font-size="11" fill="currentColor" opacity=".8">Per-viewer convenience — a remembered tab, a collapsed section → browser storage is right.</text>
<text x="0" y="178" font-size="11" fill="currentColor" opacity=".8">Shared, durable, or readable later → it is the wrong tool and the data is lost silently.</text>
<text x="0" y="202" font-size="11" fill="#d2603f">Wrap every read and write in try/catch — in a private window the accessor throws.</text>
</svg>` },

'r-thinking': { caption: 'Display controls visibility, not work. Thinking is billed identically whichever setting you choose — and the raw chain of thought is never returned on any model.',
  alt: 'A request with adaptive thinking producing reasoning that is always billed, shown to the user only when display is set to summarized rather than the default omitted.',
  svg: `<svg viewBox="0 0 660 210" role="img" aria-label="Thinking is billed the same whether or not display shows it">
<defs><marker id="ar-rthk" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="currentColor"/></marker></defs>
<rect x="0" y="52" width="120" height="44" rx="6" fill="none" stroke="currentColor" stroke-width="1.3"/>
<text x="60" y="70" font-size="11" text-anchor="middle" fill="currentColor">request</text>
<text x="60" y="86" font-size="9" text-anchor="middle" fill="var(--accent)">type: adaptive</text>
<rect x="164" y="46" width="160" height="56" rx="6" fill="none" stroke="var(--accent)" stroke-width="1.5"/>
<text x="244" y="68" font-size="11" text-anchor="middle" fill="var(--accent)">reasoning happens</text>
<text x="244" y="84" font-size="9.5" text-anchor="middle" fill="currentColor" opacity=".75">depth decided per request</text>
<line x1="124" y1="74" x2="160" y2="74" stroke="currentColor" stroke-width="1.3" marker-end="url(#ar-rthk)"/>
<text x="244" y="122" font-size="10.5" text-anchor="middle" fill="#d2603f">billed identically under every display setting</text>
<g font-size="10.5" fill="currentColor">
  <rect x="392" y="18" width="268" height="42" rx="6" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".6"/>
  <text x="404" y="36">display: "omitted"  — the default</text>
  <text x="404" y="52" font-size="9.5" opacity=".7">blocks stream with empty text — looks like a long pause</text>
  <rect x="392" y="70" width="268" height="42" rx="6" fill="none" stroke="var(--accent)" stroke-width="1.4"/>
  <text x="404" y="88" fill="var(--accent)">display: "summarized"</text>
  <text x="404" y="104" font-size="9.5" opacity=".7">set it deliberately if users watch it work</text>
</g>
<g stroke="currentColor" stroke-width="1.2" opacity=".55">
  <line x1="328" y1="66" x2="388" y2="40" marker-end="url(#ar-rthk)"/><line x1="328" y1="82" x2="388" y2="92" marker-end="url(#ar-rthk)"/>
</g>
<line x1="0" y1="150" x2="620" y2="150" stroke="currentColor" stroke-width="1" opacity=".22"/>
<text x="0" y="172" font-size="11" fill="#d2603f">budget_tokens is gone — a 400 on Fable 5, Sonnet 5 and Opus 5 / 4.8 / 4.7.</text>
<text x="0" y="192" font-size="11" fill="currentColor" opacity=".75">On Opus 5 thinking is ON by default. Want it cheaper? Lower effort — do not disable it.</text>
</svg>` },

'r-judge': { caption: 'A 1–10 score feels like measurement and is not: it clusters, drifts between runs, and tells you nothing about what broke. Binary criteria give a number you can debug.',
  alt: 'Scalar scores from three runs clustering around seven and shifting unpredictably, beside five binary criteria where one failing check identifies exactly what regressed.',
  svg: `<svg viewBox="0 0 660 232" role="img" aria-label="Scalar scores drift and cluster; binary criteria are reproducible and debuggable">
<text x="0" y="12" font-size="10.5" fill="#d2603f" letter-spacing="1.2">1–10 SCORE — THREE RUNS, SAME INPUT</text>
<line x1="16" y1="112" x2="270" y2="112" stroke="currentColor" stroke-width="1.1" opacity=".5"/>
<g font-size="9" fill="currentColor" opacity=".6"><text x="16" y="126">1</text><text x="140" y="126">5</text><text x="262" y="126">10</text></g>
<g fill="#d2603f">
  <circle cx="184" cy="98" r="4"/><circle cx="196" cy="82" r="4"/><circle cx="177" cy="66" r="4"/>
</g>
<g font-size="9" fill="currentColor" opacity=".7">
  <text x="206" y="101">7</text><text x="218" y="85">8</text><text x="199" y="69">7</text>
</g>
<text x="16" y="50" font-size="10.5" fill="#d2603f">clusters, shifts run to run,</text>
<text x="16" y="64" font-size="10.5" fill="#d2603f">and never says what changed</text>
<text x="360" y="12" font-size="10.5" fill="#2e9e6b" letter-spacing="1.2">FIVE BINARY CRITERIA</text>
<g font-size="10.5" fill="currentColor">
  <text x="360" y="38">✓  grounded</text>
  <text x="360" y="60">✓  complete</text>
  <text x="360" y="82" fill="#d2603f">✗  no_invention</text>
  <text x="360" y="104">✓  format</text>
  <text x="360" y="126">✓  scoped</text>
</g>
<text x="500" y="82" font-size="10.5" fill="#d2603f">← this is what regressed</text>
<text x="500" y="126" font-size="11" fill="#2e9e6b">score 4 / 5</text>
<line x1="0" y1="150" x2="620" y2="150" stroke="currentColor" stroke-width="1" opacity=".22"/>
<text x="0" y="172" font-size="11" fill="currentColor" opacity=".8">Reproducible, and when the number drops you already know which check failed.</text>
<text x="0" y="196" font-size="11" fill="currentColor" opacity=".75">Judges prefer longer answers and whichever candidate came second — score one at a time,</text>
<text x="0" y="212" font-size="11" fill="currentColor" opacity=".75">and never let the judge see which prompt or model produced a candidate.</text>
</svg>` },

};
