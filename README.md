# The Claude Progression Web

An interactive radial map of what Claude can do — **51 capabilities**, across **six
disciplines** and **five levels of depth** — with a live sidebar that tracks AI and
entrepreneurial signals and attaches new ones to the nodes they touch.

Every node carries a plain-terms glossary of the things it names, an in-depth
explanation, a worked example, the non-obvious detail that is usually learned the
expensive way, and **links to the canonical material** that explains it — 180
references across 149 machine-checked URLs.

The repo also carries one standalone tool that is not part of the web:
[**the Canvas prep-brief tool**](#the-canvas-prep-brief-tool), which reads a Canvas LMS
account and writes a short brief for every syllabus and every assignment.

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

node tools/canvas-brief.mjs --demo  # the Canvas prep-brief tool, on sample data
node --test 'tools/canvas/*.test.mjs'
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

---

## The Canvas prep-brief tool

`tools/canvas-brief.mjs` is separate from the web above: it reads a **Canvas
LMS** account and writes a short brief for every course and every assignment,
plus one index across all of them.

```bash
node tools/canvas-brief.mjs --demo          # three sample courses, no account needed
export CANVAS_HOST=school.instructure.com
export CANVAS_TOKEN=...                     # Canvas → Account → Settings → New Access Token
node tools/canvas-brief.mjs                 # → out/canvas/
```

Output is `out/canvas/`: `README.md` across every course, `courses/<code>/course-brief.md`
per syllabus, `courses/<code>/assignments/<due-date>-<name>.md` per assignment — named so
the directory sorts into the order you will do them — and `dashboard.html`, one
self-contained page with no scripts and nothing to fetch. `out/` is gitignored, because
what lands there is your coursework.

### What it is actually doing

Canvas does not hide anything. It shows each thing on its own page: the weighting is on
the grades tab, the rubric is behind a link, the readings are in Modules, the deadline
change is in Announcements — and the only place they are ever assembled is in a
student's head at 11pm. The tool assembles them on disk instead. Four joins do most of
the work:

- **Points → grade share.** 100 points means nothing on its own. A 100-point assignment
  in a 10%-weighted group matters less than a 20-point one in a 40% group, and that
  arithmetic needs the assignment group, its weight and every other assignment in it.
  Where a group holds only one published assignment the share is labelled provisional,
  because early in a term it looks like the whole group weight and it is not going to
  stay that way.
- **Assignment → its module.** The readings, slides and pages immediately above an
  assignment in its own module are the inputs the instructor put there. The assignment
  page has no idea it is in a module at all.
- **Assignment → announcements.** An announcement posted after the assignment was
  written can silently overrule its due date, and Canvas will not update the page.
  Wording that means a deadline moved is flagged loudly and labelled as keyword-matched.
- **Syllabus ↔ Canvas.** Where the syllabus states weights and Canvas's groups state
  different ones, the brief reports the disagreement rather than picking a side. Both
  being internally consistent and mutually contradictory is a real thing that happens,
  and it is worth an email, not a silent choice.

Per assignment it also pulls out the deliverables (from the instructor's own bulleted
list where there is one), the constraints that cost marks on their own (word count,
citation style, file format), the rubric ranked by what each criterion is worth, and a
*start by* date. Per course: meeting times, who to ask, the grading scheme, the policies
with a cost attached — late work, attendance, integrity, AI use — with their numbers
pulled out (`5% per day`, `2 late passes`), required texts with ISBNs, and fixed dates.
Across courses: the week, timetable clashes, an announcement feed, and where the term
gets heavy, weighted by grade impact rather than by item count.

### What it will not do

Everything read out of syllabus prose is a heuristic on writing that has no schema, so
each extraction says where it came from and the briefs distinguish the two sources by
name: a weighting from Canvas's own groups is what Canvas computes with; the same
weighting scraped from a sentence is a reading to confirm. Effort estimates and start
dates are a stated planning prior, labelled as estimates every time — the useful output
is the start date, which is wrong by a day at worst and still beats starting the night
before. `## What this brief could not establish` on each course brief lists what came up
empty, so a course with no grading scheme published never reads like one the tool simply
failed to parse.

### Options

| | |
|---|---|
| `--demo` | run on `data/canvas-demo.json`, no network, nothing personal |
| `--snapshot <file>` | analyse a saved pull instead of fetching |
| `--save-snapshot` | keep the raw pull next to the briefs |
| `--course` / `--term` | filter by name or code |
| `--include-concluded` | include finished terms |
| `--horizon <days>` | how far ahead the radar looks (default 21) |
| `--out <dir>` | output directory (default `out/canvas`) |
| `--no-html` | markdown only |

### Notes on the API

Two things a naive fetch loop gets wrong, both handled in `tools/canvas/client.mjs`:
pagination lives in the `Link` header and nothing in the body says a page was truncated,
so a course with 60 assignments silently returns 10; and the rate limiter reports a cost
budget in `X-Rate-Limit-Remaining` and answers **403 with a "Rate Limit Exceeded" body**
rather than 429, so a retry policy keyed on 429 reads throttling as an auth failure and
gives up on a working token.

Fetching is deliberately separate from analysis — a snapshot can be re-read offline
while the extractors are tuned, rather than hammering a rate-limited server owned by
your university. Per-course requests are best-effort in the same way the signals feed
is: a course with the syllabus tab disabled records the gap in its brief and keeps its
other data.

An access token grants everything your account can see. Pass it in `CANVAS_TOKEN`
rather than on the command line, where it lands in shell history, and delete it in
Canvas when you are done.

### Files

| | |
|---|---|
| `tools/canvas-brief.mjs` | CLI |
| `tools/canvas/client.mjs` | REST client — pagination, retries, rate limits |
| `tools/canvas/fetch.mjs` | one snapshot of everything, best-effort per course |
| `tools/canvas/html.mjs` | instructor-pasted HTML → text worth parsing |
| `tools/canvas/syllabus.mjs` | meeting times, grading, policies, materials, dates |
| `tools/canvas/assignment.mjs` | weight, deliverables, constraints, rubric, effort |
| `tools/canvas/catalogue.mjs` | the cross-course views |
| `tools/canvas/analyse.mjs` | the joins |
| `tools/canvas/render.mjs` | the markdown briefs |
| `tools/canvas/dashboard.mjs` | the self-contained HTML page |
| `tools/canvas/canvas.test.mjs` | 52 tests, one per judgement call |
| `data/canvas-demo.json` | synthetic three-course snapshot |

The tests pin the cases where a plausible parser reads a syllabus wrongly and the wrong
reading is silent: `R` is Thursday but `WAR` is not three weekdays, a bare `2:00` in a
timetable is the afternoon, a stray "10% per day" in a late policy is not a grading
scheme, and a newline inside a `<p>` is where the instructor's editor wrapped rather
than the end of a sentence.


## Accuracy

API details — model ids, pricing, parameter shapes, deprecations — were checked
against current sources rather than written from memory, and the Claude Code
feature vocabulary was taken from the shipped changelog. Anything version-bound
will drift; the signals feed is partly there to make that drift visible.
