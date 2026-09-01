# The Claude Progression Web

An interactive radial map of what Claude can do — **51 capabilities**, across **six
disciplines** and **five levels of depth** — with a live sidebar that tracks AI and
entrepreneurial signals and attaches new ones to the nodes they touch.

Every node carries a plain-terms glossary of the things it names, an in-depth
explanation, a worked example, the non-obvious detail that is usually learned the
expensive way, an **assumed-background** footer defining the vocabulary it leans on
without explaining, and **links to the canonical material** — 180 references across
149 machine-checked URLs. 28 nodes also carry a **mechanism diagram**.

---

## The four parts

**The web** is the stable part: a curriculum that changes when someone edits it.
The centre is where everyone starts; rings are levels; sectors are disciplines;
lines are prerequisites. Hovering a node traces its lineage back to the centre,
so "what do I need before this?" is a visual question rather than a reading task.

**The capstones** sit at the summit of each sector — one project per discipline,
reachable from the ◆ marker at the outer edge of the web or from the left rail.
Each exercises every node in its line.

**The tutor** is retrieval practice. It gives you a situation and asks which
capability it calls for — 103 scenarios, at least two per node.

**The signals sidebar** is the moving part. A scheduled job pulls from nine feeds,
keyword-matches each item against all 51 nodes, and writes the result to
`data/signals.json`. Matched items appear inside the node's own panel and put a
marker on the node in the web, so a capability that is actively moving looks
different from one that is settled.

### Disciplines

| | Discipline | What it covers |
|---|---|---|
| ● | **Reasoning & Dialogue** | How you ask, and how the model thinks back |
| ● | **Context & Knowledge** | What Claude can see, and what that costs |
| ● | **Code & Engineering** | Claude Code as a working environment |
| ● | **Agents & Automation** | Tools, protocols, delegation, autonomy |
| ● | **Creation & Craft** | Artifacts, documents, visualisation, design |
| ● | **Platform & Scale** | Models, money, evaluation, failure modes |

### Levels

1. **Ground** — you can get a good answer on purpose rather than by luck
2. **Fluent** — you shape the interaction instead of accepting the default one
3. **Builder** — you assemble Claude into something that runs without you watching
4. **Architect** — you make decisions other people and other agents depend on
5. **Frontier** — you work where the documentation runs out

---

## Running it

The page uses ES modules, so it needs to be served over HTTP — opening
`index.html` from the filesystem will not work.

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

No build step, no dependencies, no framework. Node 22+ is needed only for the
tools below.

```bash
node tools/refresh-signals.mjs      # pull the feeds, re-map to nodes
node tools/refresh-signals.mjs --dry-run
node tools/validate.mjs             # check the graph, resources and signal payload
node tools/check-links.mjs          # verify every reference URL still resolves
node tools/build-standalone.mjs     # → dist/index.html, one self-contained file
```

---

## How the signals stay current

`.github/workflows/refresh-signals.yml` runs every six hours, on manual dispatch,
and on any push that changes the graph or the fetcher. It runs the refresh, runs
the validator, and commits `data/signals.json` only when it actually changed.

The pipeline, in `tools/refresh-signals.mjs`:

1. **Fetch** each source in `data/sources.json`. Every source is best-effort —
   a failure is recorded in `sourceStatus` and shown in the sidebar's *Sources*
   panel, and the remaining sources still refresh. One dead endpoint never
   empties the feed.
2. **Parse** by kind: markdown changelogs, the Hacker News Algolia API, arXiv
   Atom. No XML dependency; the Atom parse is deliberately narrow.
3. **Match** each item against `data/keywords.mjs`, which maps weighted terms to
   node ids. An item scoring ≥ 3 attaches to its top three nodes. Items matching
   nothing are dropped — the feed is scoped to this web, not to AI in general.
4. **Flag applications.** An item that both matches a node and hits an
   application cue ("Show HN", "we built", "in production", …) is surfaced as a
   candidate *new application* of that capability. These are keyword-derived and
   labelled unreviewed in the UI — leads, not facts.
5. **Quota and rank.** Each source has a `limit` so no high-volume feed crowds
   out the others, then dated items sort newest-first and undated changelog
   entries follow by relevance.

Current sources: the Claude Code changelog, the Anthropic Python and TypeScript
SDK changelogs, four Hacker News searches (Claude/Anthropic, MCP and tooling,
AI-agent building, and Show HN), and two arXiv queries. All nine were verified
reachable when they were added; the sidebar shows their live status.

### Adding a source

Append to `data/sources.json` with a `kind` the parser understands
(`changelog-md`, `hn-algolia`, `arxiv`), a `category` matching a sidebar tab,
a `weight`, and a `limit`. A new `kind` needs a parser function in
`tools/refresh-signals.mjs` that returns `{title, summary, url, date, badge}`.

### Adding or editing a node

Nodes live in `data/curriculum.mjs`, authored as an ES module so the prose can
be written without JSON escaping. Add a `nodeKeywords` entry in
`data/keywords.mjs` so signals can find it, then run `node tools/validate.mjs`.

The validator enforces the things that break the page quietly: unique ids,
required fields, complete examples, prerequisites that exist, prerequisites that
are not at a *higher* level than the node depending on them, and at least one
level-1 entry point per discipline.

---

## The capstones

`data/capstones.mjs` holds six projects, one per discipline, anchored to that
discipline's highest-tier node. They are not exercises with an answer key — each
is a real project whose completion is the check.

| Discipline | Capstone |
|---|---|
| Reasoning & Dialogue | **The Prompt Audit** — modernise a codebase of inherited prompts and prove you did not break anything |
| Context & Knowledge | **The Corpus Interrogator** — cited answers over 800 documents, under a stated budget |
| Code & Engineering | **The Self-Maintaining Repo** — make a repo one where an agent works overnight and you would merge the diff |
| Agents & Automation | **The Overnight Analyst** — an agent that runs at 6am and cannot cost more than five dollars |
| Creation & Craft | **One Story, Four Surfaces** — one analysis, four audiences, one visual system |
| Platform & Scale | **The Route to Production** — take one route from prototype to something you would put a pager on |

Each has a brief, six ordered stages naming the nodes they exercise, a **You have
understood this if** list of checkable outcomes, and a **What reveals you have
not** list of the mistakes people actually make. The stages are numbered because
they genuinely are a sequence — in The Prompt Audit you build the eval before you
delete anything, and doing it the other way round is the trap.

The validator enforces what makes a capstone a real check: anchors must sit at the
discipline's top tier, every node in the discipline must be exercised by some
stage, and each capstone needs at least four stages, four proof criteria and four
traps. Cross-discipline nodes are listed separately — a capstone that never leaves
its own sector is not a real project.

**One asymmetry worth knowing:** Context & Knowledge tops out at Architect while
the other five reach Frontier, so its capstone anchors on two level-4 nodes rather
than one level-5. The validator checks the anchor is at whatever that
discipline's top tier actually is, rather than assuming 5.

---

## The tutor

`data/scenarios.mjs` holds 103 scenarios, at least two per node. Each is written
as a situation someone would actually be in, never as a restated definition.

**The teaching lives in the distractors.** Every scenario carries a hand-authored
`near` list — the capability a person would genuinely reach for by mistake — and a
`vs` line saying what separates them. Random distractors would make each question
trivially easy and teach nothing; these force the discrimination that is the whole
point. Where `near` supplies fewer than four options the rest are filled from the
same discipline, never from across the web.

After an answer you get why the right node is right, what the node you picked
actually is (pulled from its own tag and hook), and the distinction that matters.
That last block is labelled as the nearest confusion rather than as a response to
your specific pick — it is authored against the closest neighbour, and claiming
otherwise would be a lie the UI tells.

Selection is weighted: unseen scenarios first, then ones you got wrong, then
rarely for ones you keep getting right, with the last six excluded so nothing
repeats immediately. Progress persists per browser. Filter by discipline, or
practise only what you have got wrong. Keyboard: <kbd>1</kbd>–<kbd>4</kbd> to
answer, <kbd>Enter</kbd> for the next.

The validator enforces that every node has at least one scenario, that every
distractor exists and is not the answer itself, and that no scenario text is
duplicated.

---

## In plain terms

The prose names concrete things — `cache_control`, `PreToolUse`, `SKILL.md`,
`custom_id` — and assumes you know what they are. `data/primers.mjs` is where that
gets said plainly, and it renders **between the hook and the deep explanation**, so
the jargon is defined before the writing leans on it.

Each entry is the thing exactly as you would type it, one line of plain English,
and the smallest snippet that shows its shape:

```
PreToolUse   Runs before a tool call. Exit non-zero and the call is
             blocked — no negotiating.
             exit 1   # the edit never happens
```

46 of the 51 nodes have one, 206 entries in total. The five without —
precise asking, framing, exemplars, critique loops, long-form co-authoring — are
pure technique with no named artifact to define, and a padded glossary there would
be worse than none. The validator enforces a minimum of three entries and caps each
description, so an entry that stops being plain terms fails the build.

---

## Mechanism diagrams

28 of the 51 nodes carry a hand-authored inline SVG in `data/diagrams.mjs`,
placed between the explanation and the worked example so it consolidates the
mechanism the prose just described.

The bar for including one: **a diagram earns its place only where it lets a cold
reader see something they would otherwise assemble from prose** — where data
flows, what changes between two options, what state a request moves through. So
the caching node gets one (the prefix match and what invalidates it), and the
precise-asking node does not, because a sentence says it faster. Advisory nodes
have none by design; the split runs 7 in Context, 7 in Agents, 5 in Platform &
Scale, 4 in Code, 3 in Craft, 2 in Reasoning.

They are drawn as mechanisms rather than labelled boxes. MCP is `N×M` bespoke
integrations beside `N+M` through a protocol. The agent-loop node is a 2×2 of
harness against hosting, with one empty square. Refusals is the `stop_reason`
branch tree with the refusal path marked as a 200 that raises nothing.

Conventions, because every figure ends up in the same document:

- **Marker ids are namespaced per node.** A bare `id="arrow"` would collide across
  28 inlined figures and every arrowhead would resolve to whichever was parsed
  first. The validator fails on a duplicate id.
- **`currentColor` for strokes and text**, so both themes work, with
  `var(--accent)` reserved for the element the argument turns on and a green/red
  pair for correct-versus-broken paths that reads on either ground.
- **Self-contained** — no `<script>`, `<style>`, `<foreignObject>` or external
  references, all enforced by the validator.
- **`role="img"` plus an `aria-label`** carrying the same claim as the
  `<figcaption>`, for readers who cannot see the drawing.

Figures scroll inside their own container so the page body never scrolls
sideways. A browser check walks all 28 in both themes and compares each SVG's
rendered bounding box against its `viewBox`, because content drawn outside the
box is clipped silently rather than erroring.

---

## Assumed background

`data/primers.mjs` defines what a node **is about**. `data/glossary.mjs` defines
what it **takes for granted** — the words and systems you need to already know to
follow the explanation at all: token, prefix, JSON Schema, exit code, egress,
p95, prompt injection, blast radius, flaky test, cron, symlink.

84 entries, tagged `vocab` (a word or idea) or `system` (a named thing, format or
protocol). They render in a footer at the very bottom of the node panel —
deliberately last, because this is a safety net for a reader who got stuck, not
something to read on the way in.

Entries attach by **matching a node's own text**, so a term only appears where it
is genuinely used, and anything the node's own primer already defines is
suppressed so nothing is explained twice on one page. Matching is word-boundary
anchored and case-sensitive for acronyms — `CI` inside "efficiency" and `race`
inside "trace" are the obvious way to get this wrong, and an early version of the
term list was built on exactly that noise.

The validator enforces the shape (unique ids, real `RegExp` patterns, definitions
short enough to stay quick explainers), fails on any entry whose pattern matches
no node at all, and fails if a term ever appears in both a node's primer and its
assumed background. It deliberately does **not** fail on an entry that matches
nodes but is always suppressed by their primers — that is the dedupe working.

50 of 51 nodes carry a section. Long-form Co-authoring genuinely assumes no
jargon, so it has none rather than a padded one.

---

## Reference material

Each node's **Go deeper** section links the canonical material for that capability,
in `data/resources.mjs`. Four kinds, each labelled with its real publisher:

| Kind | Source |
|---|---|
| **Docs** | `platform.claude.com` and `code.claude.com` — canonical reference |
| **Write-up** | `anthropic.com/engineering` — the deeper explanations |
| **Guide** | `support.claude.com` — task-oriented help |
| **Talk** | recorded sessions, attributed to the channel they are on |

Every path was taken from the publisher's own sitemap rather than guessed, and
`tools/check-links.mjs` verifies all 149 URLs resolve. Two rules the checker
enforces that a naive link check would miss:

- **YouTube is checked through oEmbed**, not by fetching the watch page. A dead
  video id still returns HTTP 200 with a "video unavailable" body, so a status
  check alone would pass a broken link. oEmbed 404s properly.
- **The `src` label must match the real channel.** oEmbed returns the publisher,
  and the checker fails if a resource claims a source it does not have. Several
  widely-shared "official Anthropic" videos turn out to be third-party
  re-uploads; they are deliberately absent rather than mislabelled.

`.github/workflows/check-links.yml` runs the check weekly and on any edit to the
map. A scheduled failure opens (or comments on) a `link-rot` issue, so rot
surfaces somewhere a person will actually see it rather than as a red tick.

The count per node is deliberately uneven — three strong links beat five padded
ones, and the craft nodes have thinner canonical coverage than the API ones.

---

## Layout notes

The geometry has two non-obvious constraints, both learned by looking at it:

- **The wheel is rotated half a sector off the axes.** A sector pointing due
  left or right puts every ring's label on the same horizontal line, and
  horizontal labels then overlap across rings.
- **Labels ride outward along each node's own radius**, and the anchor flips on
  the sign of `cos` with no dead zone at the vertical — siblings either side of
  a vertical sector must anchor in opposite directions or their labels collide.

Progress marks are stored in `localStorage`, per browser, and every access is
wrapped in `try/catch` because private windows throw rather than return empty.

## Accuracy

API details — model ids, pricing, parameter shapes, deprecations — were checked
against current sources rather than written from memory, and the Claude Code
feature vocabulary was taken from the shipped changelog. Anything version-bound
will drift; the signals feed is partly there to make that drift visible.
