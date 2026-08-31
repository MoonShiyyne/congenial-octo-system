# The Claude Progression Web

An interactive radial map of what Claude can do — **51 capabilities**, across **six
disciplines** and **five levels of depth** — with a live sidebar that tracks AI and
entrepreneurial signals and attaches new ones to the nodes they touch.

Every node carries a plain-terms glossary of the things it names, an in-depth
explanation, a worked example, the non-obvious detail that is usually learned the
expensive way, and **links to the canonical material** that explains it — 180
references across 149 machine-checked URLs.

---

## The two halves

**The web** is the stable part: a curriculum that changes when someone edits it.
The centre is where everyone starts; rings are levels; sectors are disciplines;
lines are prerequisites. Hovering a node traces its lineage back to the centre,
so "what do I need before this?" is a visual question rather than a reading task.

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
