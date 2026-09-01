// "In the Claude apps" — the same capability, done by typing.
//
// Every node tagged `apps` in data/surfaces.mjs gets one. It sits ABOVE the
// code example rather than replacing it: seeing the same idea expressed twice,
// once as something you type and once as something you call, is the point.
//
//   where  which apps this works in
//   do     clicks and actions, where there are any
//   say    the literal message to type — the part that actually does the work
//   note   the one thing that goes wrong if you skip it

export const appExamples = {

// ── reasoning ─────────────────────────────────────────────────────────────
'r-ask': { label: 'Naming the axis instead of asking for "better"',
  where: 'claude.ai · desktop · mobile',
  say: `Here is the spreadsheet our team uses to track renewals.

Task:        make it possible to see, in one glance, which accounts
             are at risk this quarter
Context:     the column headings are inconsistent because four
             people have edited it since 2023
Constraints: keep every existing row and formula working
Audience:    two account managers who do not use spreadsheets much
Format:      tell me what you changed and why, in a short list

If something is ambiguous, ask before changing it.`,
  note: 'The four labels are not magic words — they are just the four things you would otherwise leave out.' },

'r-frame': { label: 'Describing the situation instead of assigning a costume',
  where: 'claude.ai · desktop · mobile',
  say: `Rewrite this paragraph for our help centre.

The reader has already hit the error and is scanning for the fix.
They are annoyed, on a phone, and will not read a second paragraph.
Lead with what to do. Put the explanation after it.`,
  note: 'Compare with "You are a world-class technical writer" — that changes the vocabulary, this changes the output.' },

'r-examples': { label: 'Two examples instead of three paragraphs of description',
  where: 'claude.ai · desktop · mobile',
  say: `Label these support emails using exactly these tags.
Here is how we do it:

  "The site is down"                    -> needs-detail
  (no browser, no time, no error text)

  "Checkout 500s on Safari since 2pm"   -> bug, urgent

Now label the twelve emails in the attached file the same way.`,
  do: ['Attach the file of emails before you send the message'],
  note: 'Vary anything you do not want copied. Two examples about billing will teach "this is about billing".' },

'r-critique': { label: 'A second pass whose only job is to find problems',
  where: 'claude.ai · desktop · mobile',
  say: `Here is the plan you just wrote.

Act as the person who gets called if it goes wrong on a Saturday.

1. Name the 3 steps most likely to fail, ranked by how much
   damage each would do — not by how likely it is.
2. For each: what we would actually see when it failed.
3. Name one thing the plan assumes but never says out loud.

Do not restate the plan. Do not reassure me.`,
  note: 'Start a new chat and paste only the plan. In the same conversation it defends its own reasoning.' },

'r-thinking': { label: 'Turning thinking on, and seeing it',
  where: 'claude.ai · desktop',
  do: ['Open the model or settings control below the message box', 'Switch extended thinking on'],
  say: `Work through this properly before answering.

We have three suppliers, two of whom can only deliver on
alternating weeks, and a contract that penalises us for any
gap longer than nine days. Is a workable schedule possible,
and if so what is it?`,
  note: 'Worth it for anything with constraints that interact. For "summarise this email" it just costs you time.' },

'r-decompose': { label: 'Getting the plan before anything changes',
  where: 'claude.ai · desktop · mobile',
  say: `Plan only. Do not write the final thing yet.

I need to move our onboarding docs from Notion to the new
help centre without breaking any existing links.

Give me numbered steps. For each one say whether it can be
undone, and how. Then tell me the last step after which we
could stop and still be in a sensible state.`,
  note: 'A bad plan costs one message. A bad execution costs an afternoon.' },

'r-judge': { label: 'Scoring against a checklist, not a feeling',
  where: 'claude.ai · desktop',
  say: `Score each of these five draft replies against this checklist.
Answer true or false for each line, with one sentence of why.

  1. answers the question the customer actually asked
  2. states the refund window explicitly
  3. invents no policy that is not in the attached handbook
  4. no apology longer than one sentence
  5. names a next step with a date

Give me the count out of 5. Do not give an overall rating.`,
  do: ['Attach the handbook so criterion 3 can be checked'],
  note: 'Attach the handbook in the same message. Criterion 3 cannot be checked against something the model cannot see.' },

// ── context ───────────────────────────────────────────────────────────────
'c-files': { label: 'Attaching the evidence instead of describing it',
  where: 'claude.ai · desktop · mobile',
  do: ['Attach the PDF first', 'Then attach the screenshot', 'Then type the question'],
  say: `Attached: our supplier contract, and a screenshot of the
invoice that just came in.

Does the invoice match what the contract allows? Quote the
clause you are relying on.`,
  note: 'Attach before you ask. The model reads in order, so a question asked first gets answered before the evidence arrives.' },

'c-projects': { label: 'Saying it once in a Project',
  where: 'claude.ai · desktop',
  do: ['Create a Project', 'Open its instructions', 'Paste the standing rules below', 'Add reference files to the Project so every chat in it can see them'],
  say: `We are a 12-person dental practice. Never give clinical advice.
Always use British spelling. Our refund window is 14 days, never
30 — if a draft says 30 it is wrong. Sign off as "the team at
Ashgrove", never with an individual name.`,
  note: 'Rules a new colleague could break on day one. "Be professional" is not one of those.' },

'c-memory': { label: 'Letting a decision survive the conversation',
  where: 'claude.ai · desktop',
  do: ['Turn memory on in settings'],
  say: `Remember this for future conversations: we decided against the
subscription model in March because our customers buy once a
year and hated being billed monthly. If I ask about pricing
again, start from that.`,
  note: 'Record decisions and why. Recording transcripts fills it with material nothing can find later.' },

'c-citations': { label: 'Asking for answers you can check',
  where: 'claude.ai · desktop · mobile',
  say: `Using only the attached policy documents, answer:
how much notice must we give to end the agreement?

For every claim, quote the exact sentence you are relying on
and say which document and page it is from. If the documents
do not answer something, say so rather than filling the gap.`,
  do: ['Attach the policy documents'],
  note: 'The last sentence is the important one — it gives the model somewhere to put "I do not know".' },

'c-longctx': { label: 'Curating what goes in, rather than everything',
  where: 'claude.ai · desktop',
  say: `I am attaching four documents, not the whole folder:
the current contract, the two amendments that changed pricing,
and last quarter's invoice.

Reconcile them. Where the amendments conflict, say which one
governs and why.`,
  note: 'Attaching all forty makes answers vaguer, not sharper — the irrelevant ones compete for attention.' },

'c-retrieval': { label: 'A Project as your searchable corpus',
  where: 'claude.ai · desktop',
  do: ['Create a Project for the corpus', 'Upload the whole document set to it', 'Ask questions in any chat inside that Project'],
  say: `Across everything in this Project, where do we contradict
ourselves about the returns process? Name the documents that
disagree and quote both.`,
  note: 'Whole documents beat fragments: the model can see a rule and the exception that qualifies it together.' },

// ── code & agents (the parts that reach the apps) ─────────────────────────
'k-skills': { label: 'Adding a Skill so it loads itself when relevant',
  where: 'claude.ai · desktop',
  do: ['Open Skills in settings', 'Browse the directory, or create one of your own', 'Give it a description listing the words you would actually say'],
  say: `Create a Skill called meeting-notes.

Description: use when I say meeting notes, minutes, action items,
standup summary, or ask "what did we agree".

Body: our format is Decisions, Owners, Open questions — in that
order. Every action item needs a named person and a date.
Never invent an owner; write "unassigned" instead.`,
  note: 'The description decides whether it ever fires. Write the words a person would type, not an elegant summary.' },

'k-plugins': { label: 'Installing a bundle someone else assembled',
  where: 'claude.ai · desktop',
  do: ['Open the directory of skills, connectors and plugins', 'Read what a plugin actually contains before installing it', 'Install, then check it appears in your Skills list'],
  say: `What does this plugin add to my setup, and what can it do that
it could not do before? List anything that touches my files or
sends data anywhere.`,
  note: 'A plugin is code and instructions that run with your permissions. Read it like you would a contract.' },

'a-servertools': { label: 'Letting Claude look things up and actually compute',
  where: 'claude.ai · desktop · mobile',
  do: ['Switch on web search', 'Switch on analysis or code execution for real arithmetic'],
  say: `Find the current corporation tax thresholds for a small UK
company, then work out what we would owe on a profit of
£184,320. Show the arithmetic and cite where the thresholds
came from.`,
  note: 'Without the calculation tool it does the sum in its head, which is exactly where models are weakest.' },

'a-mcp': { label: 'Connecting Claude to a tool you already use',
  where: 'claude.ai · desktop',
  do: ['Open Connectors in settings', 'Connect the service — a drive, a calendar, an issue tracker', 'Approve only the access it actually needs'],
  say: `Look through my drive for every version of the onboarding
checklist. Tell me which is newest, what changed between the
last two, and which ones we should archive.`,
  note: 'This is the same protocol a developer uses. The connector list is MCP with the plumbing hidden.' },

'a-scheduled': { label: 'A task that runs without you starting it',
  where: 'claude.ai · desktop',
  do: ['Create a scheduled task', 'Set it to weekdays at 8am', 'Let it run read-only for a fortnight before it is allowed to act'],
  say: `Every weekday morning, check my calendar for the next two days.

Report ONLY if something needs a decision: a double booking, a
meeting with no agenda the day before it happens, or travel with
under 30 minutes between locations.

If none of those are true, say nothing at all.`,
  note: 'A quiet run must mean "nothing wrong". Report every morning and you will stop reading it within a week.' },

// ── creation & craft ──────────────────────────────────────────────────────
'f-artifacts': { label: 'Turning an answer into a page you can send',
  where: 'claude.ai · desktop · mobile',
  say: `Turn this analysis into a single page I can send the team.

It should work on a phone, and in dark mode. Put the conclusion
at the top — most people will not scroll. Make the three
regional numbers filterable so leads can look at their own.`,
  note: 'Ask for it as a page. Otherwise good analysis stays in a chat nobody else can find.' },

'f-docs': { label: 'Producing the file your reader will actually open',
  where: 'claude.ai · desktop',
  do: ['Attach the messy source file', 'Attach your branded template so the output is not default Calibri'],
  say: `The attached spreadsheet has headings starting on row 7, dates
stored as text, and three columns that are nearly duplicates.

1. Clean it into a proper spreadsheet, keeping the existing
   formulas in columns K to N working.
2. Build the summary deck from the attached template — use its
   layouts and colours, do not restyle it.
3. Give me a one-page Word summary as well.

Same numbers in all three. Flag any row you had to guess about
rather than quietly dropping it.`,
  note: 'Attach the template in the same message as the data, not afterwards. Sent later, you get a first draft in Calibri and restyle it by hand.' },

'f-viz': { label: 'Stating the argument, not the chart type',
  where: 'claude.ai · desktop',
  say: `Chart this so a reader sees one thing in three seconds:
returns rose in the north after we changed couriers, and did
not move anywhere else.

Start the axis at zero. Label the lines directly rather than
using a key. Mark the courier change with a dated line.
Make sure it still reads in black and white.`,
  note: 'Write that first sentence before anything else. If you cannot, you do not yet know what the chart is for.' },

'f-design': { label: 'Handing over the system once',
  where: 'claude.ai · desktop',
  do: ['Put this in your Project instructions, or save it as a Skill, so it applies to everything'],
  say: `Everything you make for us uses only these:

  Text sizes: 40 / 28 / 20 / 15 / 13. Never a sixth.
  Spacing:    4, 8, 12, 16, 24, 32, 48, 64. Nothing in between.
  Colours:    ink #16151a, paper #fbfaf8, accent #6b57d2,
              muted #6c6a78. One accent per page, never two.
  Body text must stay readable against its own background.`,
  note: 'Numbers and rules, not adjectives. "Modern and clean" cannot be checked, so it cannot be followed.' },

'f-canvas': { label: 'Asking for options instead of one polished draft',
  where: 'claude.ai · desktop',
  say: `Four versions of this page, side by side. Same words in each,
so I am judging the layout and not the copy.

  A  one column, big headline
  B  split, image on the right
  C  dense, three proof points above the fold
  D  no image at all, long headline

Do not polish. I will pick one and we will refine it.`,
  note: 'A single "best" draft hides the option you would have chosen, because you never saw it.' },

'f-capabilities': { label: 'A page that collects answers from everyone',
  where: 'claude.ai · desktop',
  say: `Make this a page the whole team can use, not just read.

Everyone should be able to tick off the items they have done,
and everyone should see the same totals — not just their own.
Show who is still outstanding.`,
  note: 'Say "everyone sees the same" explicitly. Otherwise each person gets a private copy and the tally never adds up.' },

'f-longform': { label: 'Arguing about the outline before any prose exists',
  where: 'claude.ai · desktop',
  say: `Do not write the document yet.

Give me the section headings and, for each, the one thing that
section has to convince the reader of.

Then tell me: which of those claims is weakest, what objection
a sceptical reader raises that this order does not answer, and
what I am assuming they already know.`,
  note: 'Structural problems cost a sentence to fix now and a rewrite later.' },

'f-generative': { label: 'Asking for a system with knobs, not a picture',
  where: 'claude.ai · desktop',
  say: `Build me a generative pattern for the cover, as something I
can adjust rather than a finished image.

Give it a fixed starting number so I can get the same result
back, and name each control in plain words — how tight the
swirls are, how many strands, which way they drift.

Then show me the same pattern with only the tightness changed,
four times.`,
  note: 'Without the fixed starting number, the one you liked twenty minutes ago is gone for good.' },

// ── platform ──────────────────────────────────────────────────────────────
's-models': { label: 'Picking the model for the task in front of you',
  where: 'claude.ai · desktop · mobile',
  do: ['Use the model selector below the message box', 'Switch per task, not once and forever'],
  say: `This is a long contract and I need the reasoning to be right
rather than fast. Take your time and work through the clauses
that interact.`,
  note: 'Sorting a list or drafting a reply does not need the strongest model. A contract analysis does.' },

};
