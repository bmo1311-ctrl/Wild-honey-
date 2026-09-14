# Phase 0 — what is actually here

Read before building the intelligence layer. Everything below was verified
against the live Supabase schema and the repo, not inferred from the brief.

September 13, 2026. Commit `91ebf58`.

---

## 1. The finding that changes the plan

**Three of the tables the directive asks for already exist, empty and
unreferenced.**

| table | rows | referenced in code? | what it is |
|---|---|---|---|
| `transformation_state` | 0 | **no** | `current_season`, `capacity_score`, `vitality_score`, `awareness_score`, `alignment_score`, `becoming_goal`, `state_json` |
| `transformation_diagnoses` | 0 | **no** | `diagnosis_type`, `evidence` jsonb, `confidence`, `impact`, `first_detected_at`, `resolved_at` |
| `transformation_leverage` | 0 | **no** | `move_type`, `title`, `rationale`, `action_label`, `action_href`, `priority`, `confidence`, `source_diagnosis_id` |
| `transformation_reflections` | 0 | **yes** — 7 places | milestone reflections, `q_*` questions |
| `companion_messages` | 0 | **no** | `role`, `content` — an AI chat that was never built |

Those column lists are the Honey Trap engine, the Leverage engine and the
transformation dashboard, near enough as designed. Somebody — an earlier
session, or the v0 chat — laid the foundation and never built on it.

**So Phases 1, 2 and 4 do not start from an empty database.** They start by
adopting this schema. Creating `woman_state` beside `transformation_state`
would violate the directive's own rule 2 on the first day, and it is exactly
the mistake made twice already in this repo (`color_season` vs the wardrobe
season; `timezone` vs `time_zone`).

Gaps to add rather than replace: there is no experiment-outcome link, no
recommendation-feedback table, and `state_json` is unstructured so its shape
has to be defined in TypeScript and enforced there.

---

## 2. How much evidence exists to reason from

| signal | rows |
|---|---|
| profiles | 3 |
| checkins | 6 |
| vitality_checkins | 4 |
| habit_logs | 3 |
| meal_logs | 45 |
| journal_entries | 3 |
| commitments | 1 |
| personal_experiments | **0** |
| evening_reflections | **0** |
| routine_log | **0** |

This is the most important constraint on the build and it is worth stating
plainly: **there is almost nothing to detect patterns in yet.**

A Honey Trap engine run against six check-ins would produce confident
nonsense. So confidence and evidence thresholds are not polish to add later
— they decide whether the first thing a woman sees is trustworthy. The
engine must be able to say *"not enough yet"* and mean it, and the magic
moment of §37 is realistically weeks in, not on day one.

The one exception is `meal_logs` at 45 rows, which is the only signal with
enough history to say anything.

---

## 3. The existing engines, and what they already do

The directive's core loop is partly built. Nothing here needs rewriting.

| loop stage | what exists | file |
|---|---|---|
| NOTICE | picks one true sentence from real behaviour, or stays silent | `lib/noticing.ts` |
| ACT | ranks what belongs to this hour; appointments beat rough times | `lib/moment.ts`, `lib/moment-candidates.ts` |
| EXPERIENCE — skin | decides tonight's one strong product from the shelf and the log | `lib/tonight.ts` |
| EXPERIENCE — hair | runs on washes not nights; alternates protein and moisture | `lib/wash-day.ts` |
| EXPERIENCE — work | picks the piece closest to finished for the next block | `lib/studio.ts` |
| EXPERIENCE — dress | scores an outfit on colour, contrast and line, and explains it | `lib/outfit.ts`, `lib/color-season.ts`, `lib/silhouette.ts` |
| BECOME | milestones, streaks, becoming summary | `lib/rewards.ts` |
| RELEASE | commitments reviewed every 14 days; experiments with reflection | `/app/promises` |

Every one of these already produces a *reason*, not just a result. That is
the §22 "why this?" requirement, and it is the reason connecting them is
tractable: they can each explain themselves to a layer above.

**What no engine does yet:** look across them. Tonight's skincare does not
know her capacity is low. Studio does not know she has not slept. The outfit
engine does not know she has a presentation. That is the whole job.

---

## 4. Orphans — built but unreachable

Fix or remove before adding anything.

~~`lib/acids.ts`, `lib/apothecary.ts`~~ — **fixed 13 Sept.** Both now reached
through `lib/skin-concerns.ts`, which connects a chosen concern to the actives
and acids that address it topically and the nutrients, foods and herbs that
support it internally. Nothing was restated: the herbs come from `APOTHECARY`
by key so their pregnancy and medication cautions travel with them, and the
nutrients are only ones the food log can genuinely count.

~~`lib/rituals.ts`~~ — **fixed 13 Sept.** Six kitchen treatments that were
reachable only through `planTonight`, which needs a shelf of products first,
so the woman with nothing on her shelf was the one who could never see them.
Now offered directly on Protocols with one-tap logging — which is also the
first thing that has ever written to `routine_log`.

**Dead code:**
- `lib/nudges.ts` — orphaned when the nudge strip came off Today this week.
- `lib/spark-lines.ts`, `lib/stripe.ts` — unreferenced.
- `components/year-day-ritual.tsx` — never rendered (see §5).
- `companion_messages` — a table for a feature that does not exist.

**Routes reachable only by typing the URL:**
- `/app/progress` — renders "My Evolution", linked from nowhere. The directive wants Evolution as one of four top-level surfaces (§24); it is currently invisible.
- `/app/archive` — exists as a tab on Write, but the route itself is unlinked.
- `/app/program/[slug]/week/[n]` — no link anywhere points at a week.
- `/kid` — the child sign-in. Printed as text in Household, never a link.
- `/app/challenges` — unlinked and flag-off.

**Flags that gate nothing:** `mealPlans`, `groceries`, `community`.

---

## 5. The calendar frame still to fix

The 13-month calendar is deleted and stays deleted. One concept survived it:

**Year Day.** A day belonging to no month — meaningless without the
13-month structure. It persists in:

- `transformation_reflections.wild_honey_year` (column)
- `saveYearDayReflection`, `getYearDayReflectionForYear` (`app/actions.ts`)
- `getYearDayReflection` (`lib/data.ts`)
- `components/year-day-ritual.tsx` — **never rendered**
- `/app/progress` — displays a "Year Day {n}" chip on any such reflection

Nothing has ever written one (0 rows), so nothing is lost by retiring it.
The *milestone reflection* idea underneath is good and should survive under
a name that does not depend on a calendar nobody uses.

---

## 6. Navigation as it stands

Five tabs: **Today · Program · Library · Circle · You**.

The directive wants **ME · TODAY · BECOMING · EVOLUTION** with everything
else demoted to tools (§24). The distance between those two is the real UI
work, and it is mostly reorganisation rather than new screens:

- Becoming exists at `/app/becoming`, reachable only from a closet tile.
- Evolution exists at `/app/progress`, reachable from nothing.
- "ME" — the current-state view — does not exist in any form.
- Program, Library and Circle currently occupy three of five tabs.

`/app/profile` carries 20 tiles across five shelves. That is the catch-all
the directive warns about, and it is where the demoted tools belong.

---

## 7. Access, and a decision nobody has made

Tiers: `free` < `circle` < `inner-circle` < `founder`. Nothing branches on
`inner` anywhere.

**Fully locked:** Ask, Learning, Money, Watch.
**Partially locked:** Circle composer, Fitness, Nutrition (4 panels), Program.

**Decided (13 Sept):** Write stays free. Protocols stays free. Promises
stays free. All three are already ungated, so nothing changes in code — it
is recorded here so it is not re-litigated.

**Still open:** Studio, Wardrobe, Becoming, Body, Progress. These are free
today by accident rather than by decision, and they are where the
intelligence layer will sit.

---

## 7b. "Season" means four different things

Worth writing down, because the word has now caused two bugs in this repo.

| column | meaning | shape |
|---|---|---|
| `profiles.seasons` | her life seasons — rebuilding, motherhood, entrepreneurship… | **text[], plural** |
| `profiles.color_season` | the app's UI theme | winter/spring/summer/autumn |
| `profiles.style_season` | her wardrobe palette | one of twelve |
| `recipes.season` | when a recipe suits | spring/summer/fall/winter/any |

`profiles.season` was singular and is gone; `seasons` replaced it and the one
real value was carried across. The directive's `transformation_state.current_season`
is a fifth and should be reconciled with `profiles.seasons` rather than
becoming another parallel truth.

---

## 8. Order I would actually build in

The directive's phases are right. Two amendments from what the audit found:

1. **Phase 1 adopts `transformation_state` rather than designing a schema.** The table exists; the work is defining `state_json`'s shape in TypeScript, writing the read/derive layer, and RLS tests.

2. **Phase 2 cannot honestly ship on current data.** Build the Honey Trap engine with its evidence thresholds, then let it stay quiet until there is something to see. Silence is the correct first behaviour, and it is consistent with how `noticing.ts` already works.

Before either: clear the orphans in §4 and the Year Day frame in §5, because
building an intelligence layer on top of dead code means carrying it
forever.

---

## 9. Friction audit — the blank boxes

Swept every free-text input outside admin. **37 asked her to generate from
nothing; two had suggestions.** Both of those were on Promises.

**Fixed 13 Sept** — the ones she hits daily or weekly:

| surface | was | now |
|---|---|---|
| Journal / Write | `"Let it be honest."` and a cursor | openings from her seasons, shown only on an empty page |
| Wins | `"write it down…"` — the emptiest prompt in the app | small wins, deliberately small |
| Mood (check-in) | free text between three sliders and a row of symptom chips | 16 mood chips, own word still possible |
| Money category | retyped every entry | **her own past categories**, most-used first |
| Commitments, experiments, treatments | blank | done earlier today |

**Also fixed 13 Sept**, finishing the list:

| surface | was | now |
|---|---|---|
| Course write-block | daily in a programme, **no placeholder at all** | sentence openers, only while the box is empty |
| Milestone reflection | four blank textareas in a column | openers per question |
| The annual reflection | nine blank textareas | openers per question |
| Grocery list | blank box beside a 407-food library | autocomplete against the library |
| Pantry | same | same |
| Habit stack | two blank boxes, while QuickAddHabit next door had suggestions | the same `suggestHabits` source, plus anchor suggestions |

**Still blank, and deliberately so:** the community composer, group posts,
replies, and encouragement on another woman's entry. Suggesting words for
those would put my sentences in her mouth to another person, which is a
different thing from helping her start her own private writing. Also
Studio idea titles, learning item titles, the wardrobe garment name and the
allergies field — occasional, and each one is genuinely hers to name.

~~**Unmounted**~~ — **all four mounted 13 Sept.**

- `morning-reset-card` → Today, 5am–noon.
- `evening-reflection-card` → Today, after 7pm.
- `reset-panel` → Today, unconditionally. It asks `getCheckinGap()` itself and stays silent unless she has genuinely been away, which is the right behaviour for a card about coming back.
- `year-day-ritual` → Evolution, renamed. Nine questions once a year, named after Year Day from the deleted calendar; a ritual named after a calendar nobody uses is a ritual nobody opens.

**And the reason she could not find her settings:** the only link to
`/app/settings` said *"Privacy & notifications"*. The page holds her name and
photo, her timezone, what her body needs flagged, her profile page and who she
has blocked. It says **Settings** now, with a line naming what is in it.


---

## 10. Courses are editable now

They were four JSON files in the repo — 312KB, 154 days, 750 blocks, every
word hers — and the admin page could change exactly one thing about them:
which pillar a day belonged to.

**Now:** `courses` and `course_days` in Supabase, seeded lazily from the JSON
on first read and **only into an empty table**, so a deploy can never
overwrite an edit. Every read falls back to the bundled JSON if the database
has nothing to say.

`/admin/course` → course → day. Title, kind, minutes, and every block: add,
reorder, delete, edit. Publish toggle hides a course from members without
deleting it, so a rewrite can happen in place.

**Image and video blocks exist**, which they never did — thirteen block types
and not one could carry a picture. Upload to the `course-media` bucket, or
paste a YouTube link and it embeds.

**One honest limitation.** Five block types hold nested arrays — `steps`,
`grid`, `versus`, `check`, `figure` — and those are edited as JSON rather
than through a form. Validated on every keystroke, so the worst case is a
message about a bracket, not a broken day. A safe form for each is roughly a
week of work to improve something done rarely; worth doing if she finds
herself in there often.


---

## 11. Logging a meal — the daily path

Reported as the worst friction in the app, three times a day. Three separate
causes, all fixed 13 Sept:

1. **Today linked to the wrong page.** The breakfast, lunch and dinner rows on
   Today pointed at `/app/nutrition` — the hub, with recipes, pantry and
   grocery — rather than `/app/nutrition/log`. My bug from the moment engine.
   That was a whole extra tap, every meal.
2. **The logger was below the analysis.** The log page rendered a macro ring
   chart and a full micronutrient table *above* the logger, so logging lunch
   meant scrolling past two pieces of feedback to reach the box. Both are
   commentary on what she has already eaten; they sit below it now.
3. **The search box was fourth inside the logger** — under the member
   switcher, her usual foods, her saved meals and everything logged today.

Now: who she is logging for, then **What did you eat?**, then Your usual, then
saved meals, then today's list. The box autofocuses.

**Today → tap the meal → type.** One tap, no scroll.

---

## 12. Phase 1 — the personal state layer (14 Sept)

`lib/personal-state.ts` (pure) + `lib/personal-state-db.ts` (rows) +
`components/state-reading.tsx` (surface).

**Adopts `transformation_state`.** No new table. The four score columns that
were already there now have a writer; `state_json` holds the full reading,
reasons included, so a later phase can ask why the app said what it said on a
given day. Per §1's rule — Phases 1, 2 and 4 start by adopting this schema,
not beside it.

### The split

The maths knows nothing about Supabase, which is why every threshold in it can
be argued with in a 40-line node script. The db file knows nothing about
thresholds. That split is the reason the four bugs below were findable.

### Four things testing found that reading would not have

1. **Depletion needed a busy calendar to count.** `lowState && score >= 12`
   meant a woman reporting flat energy, broken sleep and high strain for a
   fortnight read `available` if she had not filled the app with commitments.
   Backwards: an empty plate is not room, and the emptiness is often the
   symptom. Two low signals now reach `stretched` on their own.
2. **`abundant` could print over the top of a named load.** "You have room
   right now" above "you are carrying 4 seasons at once" — the app arguing
   with itself, and she'd be right to trust the second line. `abundant` is now
   blocked whenever the load half named anything.
3. **Recent meant recent *rows*, not recent days.** `checkins.slice(-7)`. Her
   five check-ins span 7 Aug → 13 Sept, and all five were being averaged and
   described as "this week". `RECENT_DAYS = 14` now windows by date.
4. **The headline would have become furniture.** Her account reads `stretched`
   off load alone, and load barely moves week to week — so the strongest
   sentence the app can say would have appeared every morning until she
   dropped a season. Now dismissable, quiet for 14 days, and back only if the
   reading itself changes.

### Where it shows

- **Today** — `StateHeadline`, and it *replaces* `NoticeLine` on the days it
  fires. Both are "one true sentence about you"; stacked they cancel out.
- **You** (`/app/profile`) — `StateReading`, above the Honey profile card. The
  card is what she told the app once; this is what the app has noticed since.
  Renders nothing while `evidence === 'none'`.

### Where it writes

`recordPersonalState()` runs from `saveCheckin` and `saveEveningReflection` —
never on page render. Otherwise the series would record the days she opened
the app rather than the days she told it something. Never throws; a failed
write costs one point on a trend line.

Both writers merge into `state_json` rather than overwriting, because two
writers on one jsonb column is exactly how a dismissed message comes back.

### Her account as it stands

4 seasons · 2 programmes · 1 commitment · 1 experiment · 3 habits · 1 block
→ load 26.5 → `stretched`, confidence **low**, because only one check-in falls
inside the recent window. The headline fires on load alone, which is the case
the directive wanted, and every line under "why this?" is a fact she can check.

### Verification note

`npx tsc --noEmit` does **not** catch a wrong column name — the Supabase client
is untyped here, so `completed_on` (which does not exist; it is `completed_at`)
typechecked cleanly and would have failed silently at runtime behind `?? []`.
All 21 column references in `personal-state-db.ts` were checked against
`information_schema` by hand. Do this for any new query file.

### Still open

Phase 2 (Honey Traps) and Phase 4 (Leverage) have their tables and now have a
state layer to read from — but the audit's conclusion stands: they cannot
honestly ship until there is more evidence than six check-ins. Phase 1 is what
makes that evidence worth having.

---

## 13. The cycle (14 Sept)

### What she hit

Her period started. She logged it where she found it — `/app/nutrition/goals`,
reached from **You → Targets & your cycle** — by setting the start date. The
app went on saying luteal, and went on adding luteal's +7% to her calories and
carbs on day one of bleeding.

Three separate failures behind one symptom.

**1. Precedence.** `ownerTargets` had one rule: a logged phase always wins. She
had tapped `luteal` on a check-in that morning, before it started. A guess made
a few hours earlier outranked the event itself. Fixed by `resolvePhase` in
`lib/cycle.ts` — recency, not source, in one place instead of re-derived per
page. Period start on or after the last logged phase ⇒ dates win.

**2. Nothing told Nutrition.** `saveCycleSettings` revalidated the two pages the
form sits beside and not the hub, the recipe picks, Today or Energy.

**3. Nowhere to say the phase.** The only phase control in the app was a row of
chips inside a check-in form on a different page — which is exactly why she went
looking and found the settings instead. Her words: *"it shows targets and your
cycle, but then when I click into it, it doesn't have like what you would think,
like a spot to put what cycle I'm in."*

### Every cycle is different

Migration `every_cycle_is_different`. The app stored a start date and a cycle
length, then hardcoded the rest inside `phaseFromDates`: a five-day period,
ovulation at `len - 14`. Population averages wearing the costume of a personal
setting.

New on `profiles`: `period_length_days`, `luteal_length_days`,
`cycle_is_regular`. The migration also documents `last_period_start`,
`cycle_length_days` and `cycle_adjustments`, which application code had been
writing **with no migration at all** — see §12's verification note; this is the
same class of problem.

Why luteal length rather than an ovulation day: the luteal phase is the stable
half (usually 12–14 days, much the same month to month) and the follicular
phase is what stretches. Counting back from the next period is more reliable
than counting forward from the last.

What it changes, same start date:

| | ovulation | notes |
|---|---|---|
| average, all blank | day 14 | unchanged |
| 28d, bleeds 7 | day 14 | menstrual through day 7, was follicular from day 6 |
| 24d, luteal 12 | day 12 | old rule said day 10 |
| 33d, luteal 13, bleeds 3 | day 20 | old rule said day 19 |

`cycle_is_regular = false` switches date derivation off entirely — irregular,
perimenopausal, post-partum, PCOS, hormonal IUD. The app then uses only what
she logs rather than pretending arithmetic applies.

`cycleShape()` clamps everything, and a period can never run past ovulation.
Check constraints are the backstop, deliberately wide: they exist to catch a
typo, not to tell a woman her cycle is invalid.

### Where the switch lives now

`components/cycle-phase-switch.tsx`, mounted in two places:

- the phase banner on `/app/nutrition/log` — where the phase is being *used*
- the top of `/app/nutrition/goals`, above all the arithmetic — where she looked

"My period started today" is its own button, because that writes a date the app
counts forward from rather than a chip that goes stale tomorrow. It also writes
today's check-in to menstrual — leaving a contradicting chip in the row is how
this went wrong in the first place.

Every surface says *where* the phase came from (`ResolvedPhase.because`). There
was no way to tell whether the app was reading her check-in or her dates, and
so no way to know which one to go and fix.

### Still open

The phase barely does anything. Its entire effect on nutrition is a percentage
on calories and carbs, plus a recipe filter that depends on an admin having
hand-tagged `recipes.cycle_phase` — **a column with no migration**, so it may
be matching nothing. There is no per-phase food, herb, training or skincare
content anywhere in `lib/`. Her expectation was that it would *recommend*
differently. That is a content build and a decision she has not made yet.

---

## 14. The schema sweep (14 Sept)

Prompted by finding `last_period_start`, `cycle_length_days` and
`cycle_adjustments` being written by application code with no migration behind
them (§13), and by `completed_on` typechecking cleanly in §12.

### Finding 1 — the code is clean

**1,306 column references across 83 tables, every one of them real.** The
`completed_on` bug was the only instance, and it was caught before shipping.
Five apparent failures were all parser artifacts, each confirmed by hand:

| looked wrong | actually |
|---|---|
| `profiles.circle`, `profiles.program` | keys inside the `child_permissions` jsonb |
| `saved_meals.food_item_id`, `.quantity` | keys inside the `items` jsonb array |
| `kid_rewards.note` | a function parameter |
| `studio_items.today` | a local variable |
| `transformation_state.headline` | a key inside `state_json` |

### Finding 2 — the columns are all migrated

Every column in the live schema appears somewhere in
`supabase_migrations.schema_migrations`. The §13 worry was wrong in its
specifics: those three columns *do* have migrations, just not in the repo.

### Finding 3 — but the repo cannot rebuild the database

This is the real one, and it is bigger than the thing that prompted the sweep.

| | in `supabase/*.sql` | live |
|---|---|---|
| tables | 44 | 84 |
| migrations | ~11 | **77** |

Forty tables — courses, wardrobe, studio, money, household, every
`transformation_*` table — exist only in the remote project, because every
migration since 8 August has been applied through the MCP, which records into
the remote `schema_migrations` and never touches the repo.

Nothing is lost while the Supabase project exists. But a `supabase/` folder
that looks like a schema and is a quarter of one is worse than no folder at
all. Closing it properly needs the database password, which lives in Vercel and
should stay there, so it is documented rather than done: `supabase/README.md`
carries the three `db pull` commands. **Worth doing once.**

### What was built instead

- **`supabase/schema-snapshot.txt`** — all 84 tables, every column, names only.
  Checked in so the guard runs offline and so the repo holds *some* record of
  the schema.
- **`scripts/check-columns.mjs`** — walks every `.from('table')` chain,
  extracts columns from `.select`, the filter methods and
  `.insert`/`.update`/`.upsert` object keys, checks each against the snapshot.
  Verified by reintroducing the `completed_on` bug: it fails, naming the file
  and line. Known false positives live in an `ALLOW` set, each with a note
  saying what the thing actually is.
- **`npm run verify`** = `tsc --noEmit && npm run check:columns`. One command
  before pushing.
- **`supabase/legacy/`** — the eleven old files, moved out of the top level
  with a README saying they are history, because at the top level they read as
  current.

### The rule this leaves behind

`tsc` is not a schema check and never was. Any new query file gets
`npm run check:columns` run against it, and **any migration that adds, renames
or drops a column is followed by refreshing the snapshot** — `npm run
db:snapshot` prints the query and the steps.

---

## 15. The JSON blocks get forms (14 Sept)

§10 shipped the course editor with nine block types on proper fields and five —
`steps`, `check`, `grid`, `versus`, `figure` — on a validated JSON textarea. The
comment in the file called it a deliberate trade: *"a week of work to save her
from something she does rarely."*

Both halves were wrong, and the database says so:

| block | blocks | in courses |
|---|---|---|
| log | 154 | 4 |
| **steps** | **134** | **4** |
| text | 129 | 4 |
| write | 123 | 4 |
| **check** | **76** | **4** |
| scripture | 54 | 3 |
| **figure** | **22** | **4** |
| … | | |
| **grid** | **4** | 1 |
| **versus** | **1** | 1 |

**237 of 750 blocks — 32% of every block in every course — were JSON-only**,
and `steps` is the second most common block type in the app. Not rare: most of
what a practical course day is made of.

Nor a week. Four of the five are one shape underneath — a list of rows to add
to, delete from and reorder. `components/admin/nested-blocks.tsx` builds that
row editor once and `steps`, `check`, `grid` and `versus` all fall out of it.
`figure` is three flat strings and should never have been in the JSON bucket at
all.

### Things worth knowing

- **Step numbers are derived, not typed.** `n` is renumbered from position on
  every change. The JSON let them drift the moment a step was inserted in the
  middle, and a list that reads 1, 2, 4, 3 is worse than no numbers.
- **A grid is squared on every edit.** Rows are rebuilt to the column count
  whenever either changes, so adding a column cannot leave rows short. That
  drift is the single easiest way to break the block.
- **Up/down buttons, not drag handles.** This gets used on a phone, where a
  small drag target is not a feature.
- **Three types became addable** — `grid`, `versus` and `figure` existed in the
  renderer and in real course days but were missing from the add menu, because
  there was no form to add them into.
- **The JSON stays**, behind "edit as JSON instead", so an oddly shaped block is
  fixable rather than only deletable.

### Verification

- 15 unit tests on the two pure helpers (`moved`, `squareRows`) — reorder bounds
  at both ends, single and empty lists, column add/remove/reorder keeping cells
  with their headings, ragged input squared.
- All 237 existing blocks checked against what the forms expect: no step
  missing a head, no non-string checklist item, no ragged grid, no malformed
  versus, no figure missing pose or label. Every one will render.

---

## 16. Audit of the unexercised work (14 Sept)

Everything in §12–§15 shipped without a real user touching it. An independent
read-only audit of those files found seven issues. All fixed. Ordered as found.

**1. The settings form silently reverted day one.** `CyclePhaseSwitch` is
rendered *inside* `CycleSettingsForm`. Tapping "my period started today" wrote
`last_period_start` and revalidated — but `start` is a `useState` initialised
once from props, so the date field below still showed the old date. Touch
anything else on that page, press Save, and it wrote the stale date back over
today. The exact scenario the feature was built for. Fixed by keying the
component on the saved values so it remounts when they change.

**2. The state engine used the server's day, not hers.** `readStateInput`
called `isoToday()` (UTC on Vercel) while every row it compares against is
dated with `localToday()`. For anyone ahead of UTC they disagree for part of
every day, and `recentCheckins` then dropped today's check-in for having a
negative gap. Worst instance: `saveCheckin` calls `recordPersonalState()`
immediately after writing, so the reading persisted right after a check-in was
computed as if that check-in did not exist — at four check-ins, exactly the
`MIN_FOR_PATTERN` boundary where the card goes quiet.

**3. Reflecting moved "noticing" by zero.** `saveEveningReflection` called
`recordPersonalState()` under a comment saying reflecting is most of what
noticing is made of. `readStateInput` never queried `evening_reflections`.
Nor `morning_resets`. Both are in `writingDates` now.

**4. Alignment told her to do something with no effect.** The card read
"needs a goal in your words"; `computeAlignment` reads commitments,
experiments and active days and never touches `goals`. Copy now names what
actually feeds it.

**5. The default adjustments were not offered as choices.** `menstrual: 2`
and `follicular: -2`, against `CYCLE_CHOICES` of −7/−3/0/3/7. The form snaps
to the nearest, so on first open it previewed 3%/−3% while every other surface
applied 2%/−2%, never marked either "typical", and persisted an override she
never chose on the next Save. Defaults are 3/−3 now; a point is inside the
noise, the two lists agreeing is not.

**6. Ovulation could land on day −2.** `cycleShape` clamped cycle length and
luteal length independently, so an 18-day cycle could carry a 20-day luteal
phase: every day but the first came back luteal and the settings page printed
"ovulation around day -2". Luteal is now bounded against the cycle it sits in.

**7. `ownerTargets` kept a fallback that was wrong twice over.** It could not
see her period or luteal lengths, so it fell back to the 5-and-14 averages
`cycleShape` exists to replace; and it passed no check-in date, which made the
dates beat the logged phase unconditionally — the opposite of the
"conservative reading" its own comment claimed. Dead code that would have bitten
the first caller to lean on it. Removed; the phase now arrives already decided.

**Verified clean:** no hooks-rules violations (every hook precedes every early
return in both `StateReading` and `StateHeadline`), no server/client boundary
errors, no re-render storms, and the `{ ...prev }` upsert in
`setCyclePhaseToday` is safe — `checkins` has `unique (user_id, date)` and no
generated columns.

21 new unit tests cover 5 and 6.

### The lesson worth keeping

Six of the seven are the same species: **state or copy that drifts out of step
with the thing it describes.** A form holding values the page has since
changed. An engine dating rows differently from the code that wrote them. A
label naming an input the function ignores. Defaults that are not in the list
of choices. None of them crash, none of them typecheck wrong, and every one
makes the app quietly lie. `npm run verify` cannot catch these — reading the
two halves side by side is what catches them.

---

## 17. The wider audit (14 Sept)

§16 audited two days of work. This audited the surfaces that had never been
looked at this way: wardrobe, colour, protocols, beauty. The safety findings
are the reason this section exists.

### Safety

**S1 — every herb caution was computed and then thrown away.** The panel
rendered `c.inside.herbs` as raw key strings and told her the cautions were
"on the apothecary shelf", a page that does not exist. `herbsFor()` exists
precisely so those cautions cannot be lost — its own doc comment says so — and
**nothing had ever called it**. Chamomile, ginger, nettle, hibiscus and
raspberry leaf all carry a pregnancy flag; turmeric and chamomile carry a
blood-thinner flag. What shipped was the herb names with every warning
stripped and a pointer to nowhere. The panel now renders each herb with its
concerns inline.

**S2 — `pregnancyCaution: boolean` could not say the true thing.** Glycolic
and azelaic were both `false` — no caution at all — while `lib/acids.ts` says
of exactly those two: *"guidance differs by strength… ask, and ask
specifically."* A pregnant member with a glycolic toner and an azelaic serum
saw nothing. Replaced with `pregnancy: 'avoid' | 'ask' | 'quiet'`. Nothing
that flagged before stopped flagging.

**The rule this makes explicit:** `LIFE_STAGE_FOOTER`, rendered under any
pregnancy caution — *"anything not flagged here has not been cleared, it has
only not been flagged."* Without it, three flags out of six products makes the
other three read as approved, and the app is never in a position to say that.
The same sentence now closes the herb list.

**S5 — the app claimed to have read a label it had not.** A saved product's
`actives` can come from an ingredient list *or* from another member ticking
chips by hand; both arrive identically, and the copy said "read its
ingredients" for both. One woman's guess became every later woman's fact, and
that fact feeds the pregnancy cautions. `ingredients_raw` is what tells them
apart, and the copy now does too.

**S6 — tonight could pair benzoyl peroxide with vitamin C.** `alongside`
excluded strong actives and SPF but not other AM-only actives, so vitamin C
was listed as an evening step — and on a benzoyl peroxide night the card
proposed the exact pairing `lib/actives.ts` warns about. `planTonight` never
called `findConflicts`. It does now, against the treatment actually chosen.

**S7 — two more contradicting pairs had no tension entry.** redness +
dark-spots (stop the actives / use a retinoid) and dryness + breakouts (avoid
foaming cleansers and acids / use salicylic acid). Both render at once in the
accordion. A contradiction the app does not name is one she resolves alone,
usually by doing both.

### Functional

**"Honestly, both" was silently read as cool.** `seasonFrom` did
`const warm = hue === 'warm'`, so `neutral` — an option both pickers offer
explicitly — fell through to cool in all four families and in the final
hue-led branch. A woman answering honestly could be sorted into Summer or
Winter and **never** into Spring or Autumn, and the season drives every colour
sentence on her board. Neutral now gets a second, genuinely different question
(black drains warm colouring; orange overwhelms cool) rather than a default.
With no lean it goes to the blended families, never to a `true-*` season —
those are the four defined *by* undertone and the wrong home for an ambiguous
one.

**The outfit count overstated by up to 3×.** `countOutfits` multiplied each
top-and-bottom pairing by the number of matching shoes; `lib/outfit.ts`, which
builds the looks she actually sees, dedupes on exactly that basis — *"the shoe
is a detail, not a look"*. Two files counting the same word differently, under
a heading that says "outfits they can make" and a gap list promising "counted,
not guessed". Shoes and `outer` also left `findGaps` unable to ever return
them; they are gaps of wearability, not of combinations, and a function that
counts combinations is the wrong tool for saying so.

**Three components held state the server had already changed.** Same species
as §16's first finding, three more instances: `RoutineShelf` kept
`category: 'cleanser'` after switching Skin → Hair (the nav uses `<Link>`, so
it reconciles rather than remounts) — which filed hair products under a
category Hair does not have, so `detectHairRole` fell through to 'condition',
the product never counted as a wash, and the shelf went on saying "no shampoo
yet". `TonightCard` and `WashCard` kept `done: true` after the plan recomputed
to a different ritual, showing something she never did as done, with the
button disabled. All three keyed to remount.

### The pattern, now three audits deep

**State or copy drifting out of step with the thing it describes** accounts for
most of what these audits find. The safety ones are the same shape with worse
consequences: a function that computes cautions nobody calls, a boolean that
cannot express "ask", copy that claims a provenance the data does not have.
None crash. None fail `npm run verify`. Every one makes the app quietly lie.

---

## 18. Money, kid and nutrition (14 Sept)

The last unaudited surfaces. Two of these are the most serious findings of the
whole sweep.

### The child gate had never worked

`lib/kid.ts:11` — `always` contained `'/app'`, and the test was
`path === r || path.startsWith(r + '/')`. For `'/app'` that is
`path.startsWith('/app/')`, which is **every route in the app**. `/app/circle`,
`/app/money`, `/app/settings`, `/app/vault`, `/app/members/*` all returned
true. `perms.circle` has no other enforcement anywhere, so a child whose
parent had switched the Circle **off** could open it and — because
`getAccess()` grants her the guardian's paid tier — post in it.

`/app` is now matched exactly, never as a prefix. And the gate moved to the
server: `KidGate` is a `useEffect` redirect, so the disallowed page's server
component had already run and sent its data before the redirect fired. That is
not a redirect, it is a flash of the thing itself. `app/app/layout.tsx` now
checks before any child page renders, using a new `middleware.ts` whose only
job is to put the pathname in a header. `KidGate` stays for client-side
navigation.

### A child could claim any reward, including a sibling's

`app/actions.ts` `claimKidReward` looked the reward up **by id alone** — no
`owner_id`, no check that it belonged to the child claiming it. Any reward id
credited an earning to herself at that reward's amount. It is the one place in
the app where a child can move a money figure.

The cadence check was read-time only (`getKidRewards`), with a
unique-violation branch as its sole backstop — for a constraint that exists in
no migration. Claiming twice was a second tap. Both now enforced server-side.

### Calorie targets had no floor

`lib/goals.ts` — Mifflin-St Jeor, times a sedentary factor, minus 15% for
"lose fat", and then `applyCycle` took up to another 7% off. Worked through:
45kg, 150cm, 55, sedentary, losing fat gives **970**, and **902** in the
menstrual week. Rendered as "your daily targets" beside a ring to fill.

`MIN_CALORIES = 1200`, applied in `calculateTargets` **and** in `applyCycle` —
a floor something downstream can walk under is not a floor. When it binds,
`basis` says so, because a target that quietly stopped following her inputs
should not look calculated.

### A pregnant member was shown the general adult figures

`driFor` returns the adult female band: caffeine 400mg, iron 18mg, folate
400mcg. `life_stage` was read two lines later for the focus card but never
reached `panelTargets`. So the panel said iron "/ 18" directly above a card
saying "of 27", and put her caffeine against 400mg — roughly double what is
usually cited in pregnancy — as a *limit*. `vit_a_mcg` was not in
`LIMIT_NUTRIENTS` at all, so exceeding it rendered as a filled bar.

New `driForStage` layers the stage figures over the band. Still general
reference intakes, still labelled as such; they are simply the ones for the
stage she told the app she is in. Vitamin A is now a limit.

### Money said 52 months for a plan that clears in 45

`debtFreeDate` took the *longest single debt at its own minimum* and printed
it beside the *sum of all the minimums* — two different plans in one sentence.
Paying the total every month rolls each cleared payment onto the next debt and
finishes sooner. It now simulates the plan the sentence describes.

And "add a payment to each debt" was shown both when no payment was set and
when a payment existed but did not cover the interest — telling a woman to do
the thing she had already done, instead of the one fact that mattered. The
stalled debts are named now.

### Others fixed

- The child's water droplets counted any ml-measured drink, so a juice earned
  a glass of water.
- `LearningBoard` kept the previous child's tick map across a member switch —
  so tapping a completed item **deleted** the completion. A parent checking on
  one child could silently un-finish another's work.
- `archiveLearningItem` used `requireUser` where its neighbours use
  `requireOwner`, so for a child it matched zero rows and returned `{ ok: true }`.

### Still open from this audit

Not yet fixed, in rough priority order: `runwayMonths` counts the partial
current month as a full one (overstates runway); `monthSummary` reads the UTC
month against locally-dated entries; debt balances have no sign convention;
`lib/rewards.ts` hardcodes the 56-day course while the page runs the active
one; `computeStreaks` compares UTC dates; "stars this week" is a today-only
count; Studio `verbFor` is channel-blind; advancing a recurring Studio item
nulls `last_done_on`; `foods_avoided` is collected twice and read nowhere;
`updateNutritionGoals` is the only writer of the manual overrides and has no
caller, so Today's protein tile never shows a target.

---

## 19. The check-in moves onto Today (14 Sept)

### Why this and not Phase 2

Her account, a day after the friction work shipped:

| | count |
|---|---|
| **meal logs** | **62** |
| check-ins | 5 (3 in the last fortnight) |
| evening reflections | 0 |
| routine logs | 0 |

Meal logging is the one thing that was made answerable without leaving Today,
and it is the one thing that got used. That is not a coincidence and it is the
most useful single number in the database.

It also settles what to build next. Phases 2, 4 and 5 — Honey Traps, Leverage,
the Today remodel — all read check-ins. `MIN_CHECKINS_TO_INFER` is 4 and
`recentCheckins` only counts the last 14 days, so on three recent check-ins
every engine downstream correctly stays silent. **No amount of engine work
substitutes for the three taps happening.** Building Phase 2 on this data
produces either a silent feature or a lying one.

### What changed

`components/checkin-inline.tsx`, mounted directly under the moment card.
Three scales, answered in place, saved on the third tap.

- **No save button.** A save button is a fourth tap and a decision, and there
  is nothing here to decide. The third answer is the save.
- **No navigation.** The old path was: tap the card, wait for
  `/app/checkin`, three taps, press Save, get pushed back. Five taps and two
  page loads. It is three taps and no page loads.
- **Full-height targets**, not dots. This is tapped on a phone at seven in the
  morning; a six-pixel target is how a daily habit quietly stops being daily.
- **Done state stays visible** as one line, still tappable. Hiding it would
  make the page jump and leave her unsure whether it saved.
- `/app/checkin` is still there behind "more" — mood, cycle phase, movement,
  and the vitality snapshot all still live there. This is the floor, not a
  replacement.

The `checkin` candidate came **out** of `lib/moment-candidates.ts`. Offering it
there as well would put the same three scales on one screen twice — once as a
thing to tap through to, once as a thing to just do. The moment engine is for
what lives somewhere else.

### What to watch

The only measure that matters is whether check-ins per week goes up. If it
does, Phase 2 becomes buildable in a few weeks on real evidence. If it does
not, the problem is not friction and the next move is a different one —
probably that a daily check-in is not something she wants to do, in which case
capacity should be derived from what she already does rather than asked for.

---

## 20. Why Today timed out, and the actual fix (14 Sept)

### What happened

`/app` started returning Bad Gateway. No other route did — `/app/circle`,
`/app/library`, `/app/profile`, `/app/program` all stayed at 200 throughout.
The build was green and `npm run verify` was clean, because neither can see
how long a page takes.

Two things I did made it worse, and one of them was careless:

**Adding `getPersonalState()` to Today.** Eighteen queries, serialised behind
its own `localToday()` call, for a headline that fires rarely by design. The
full reading belongs on You, which is what it is for. Removed from Today.

**Putting `request.headers.set('x-pathname', …)` in `proxy.ts`.** `proxy` runs
in front of every request and owns the Supabase session refresh, and I edited
it with no way to run it locally. Reverted — and worth noting the revert did
*not* fix `/app`, which is how the real cause got found.

### The real cause: a waterfall, not a query count

Today fetched in five sequential stages:

```
getSessionProfile()          →  await
Promise.all([ 7 queries ])   →  await
loadCourse() / localToday()  →  await
Promise.all([ 7 queries ])   →  await
localHour() / Promise.all([ 10 ])  →  await
getAccess()                  →  await
```

Almost none of those groups needed the result of the one before it. The page's
wall-clock time was the **sum of five round trips** rather than the slowest of
one, and every surface added this week lengthened the chain. That is why it
failed intermittently rather than outright, and why it was always `/app`.

Now: one `Promise.all` of 27 independent fetches, then `loadCourse` →
`loadDay`, which are the only two that genuinely depend on something earlier.
**Three sequential stages instead of eight.**

### `cache()` on the two hottest reads

`getSessionProfile` was a plain async function and is the most-called thing in
the app. Today reached it **three times** — directly, in its fetch batch, and
inside `getAccess` — and each call was `auth.getUser()` *plus* a profiles
select. Six network calls for one row that cannot change mid-render.
`getOwnerScope` was the same shape, called from five helpers in `lib/data.ts`.

Both are `cache()`d now: React's per-request memoisation, no cross-request
sharing, nothing retained between users. Both are read-only.

### The rule this leaves

**`tsc` and `check:columns` say nothing about how long a page takes.** Today is
the page that will always be closest to the ceiling, because it is the one
every engine wants a line on. Anything added to it should go in the existing
`Promise.all`, never as a new `await` — and anything costing more than a query
or two should ask whether Today is where it belongs at all.

---

## 21. The child gate, done properly (14 Sept)

§18 found `kidAllowed` had been open since it was written — `'/app'` in the
allow list, matched as a prefix, which is every route in the app. The logic
fix shipped. The second half did not: the gate still ran in the browser, so a
page her parent had switched off still executed on the server and sent its
data before `KidGate` redirected. That is not a redirect, it is a flash of the
thing itself.

The first attempt to fix that put the pathname in a request header from
`proxy.ts`. `proxy` runs in front of every request and owns the Supabase
session refresh; the change took the site down and had to be reverted. **The
lesson is not "be careful with proxy" — it is that a global mechanism was the
wrong shape for a per-page rule.**

### What is there now

`lib/kid-guard.ts`, two functions, and each page says for itself:

- `adultsOnly()` — 25 pages.
- `circleOrRedirect()` — `/app/circle` and `/app/members/[id]`, which open only
  when her parent has switched the Circle on. This is the one that mattered
  most: `child_permissions.circle` had no enforcement beyond which tabs were
  drawn, and a child inherits her guardian's paid tier.

Both are free — `getSessionProfile` is memoised per request (§20) and every one
of these pages already loads it. `KidGate` stays for client-side navigation,
where there is no new server render to catch.

### `npm run check:kid`

A guard that depends on remembering to add a line is a silent hole the first
time someone forgets. So the check walks `app/app/*`, works out what
`kidAllowed` would say about each route, and fails on any route a child can
reach that has no guard. Verified by deleting the guard from `/app/money`: it
failed and named the route.

Three things it does beyond the obvious:

- **Follows redirects.** `/app/community`, `/app/pantry`, `/app/recipes`,
  `/app/workouts` and `/app/calendar` are redirect stubs. Rather than exempt
  them on trust, the check reads the destination and insists *it* is guarded —
  "this redirects somewhere safe" is exactly the kind of claim that quietly
  stops being true.
- **Flags over-guarding.** A guard on one of her own pages fails too. The
  check protects the child's access as well as from it.
- **Rejects stale exemptions.** An exemption for a page that no longer exists
  is an error.

Two exemptions remain, both with reasons: `/app/guidelines` (static community
rules, no personal data) and `/app/program` (filters its own list through
`courseAllowList`).

`npm run verify` is now `tsc --noEmit && check:columns && check:kid`.

---

## 22. Money arithmetic and the hardcoded course (14 Sept)

Working through §18's "still open" list. All logic in `lib/`, no page
restructuring — deliberately low-risk after the day Today had.

### Money

**A debt typed in as negative vanished.** Balances are stored positive — "I
owe 5,000" is `5000` — but the field is a bare "Balance" and nothing said so.
Entering `−5000`, which is the natural reading of owing money, pushed net
worth **up** by 5,000, dropped the debt out of the payoff date entirely (it
filtered on `balance > 0`), and rendered the row as `−-$5,000`. `netWorth` and
`debtFreeDate` now take the absolute value: the sign carries nothing `kind`
does not already carry, so there is nothing to lose by ignoring it, and a
wrong sign was silent in every other direction.

**Runway counted the part-month she was standing in.** The current month went
into the divisor as a whole month however many days had elapsed, so on the
2nd — with one complete month behind it — average monthly spend halved and the
runway doubled, then drifted back down all month. The current month is
excluded now; if it is the only month there is, the answer is null rather than
a flattering guess.

**"This month" read the server's month.** `monthSummary` defaulted to UTC
while entries are dated with `localToday()`, so from late afternoon on the
last day of the month in US timezones the card read empty while the entry she
had just logged sat in the old one. `today` is passed in from the page now,
and threaded through `freedomPath` — "a real emergency fund" could otherwise
tick green on a two-day-old month.

### `lib/rewards.ts` was hardcoded to one course

Every figure read `COURSE` — `COURSES[0]`, Strong and Surrendered, 56 days and
8 weeks — while `/app/becoming` has always run on her **active** course. The
four are 56, 28, 30 and 40 days.

So a woman finishing all 28 days of Daily Bread saw **"28 of 56 days"** and
"4 of 8 weeks", never earned a final milestone, and was offered one titled
*"Strong and Surrendered — Fifty-six days"* for a course she was not in.

`CourseShape` is threaded through `computeMilestones` and `computeBecoming`,
and the day milestones are now built per course: the intermediate marks are
filtered to those the course is actually long enough to contain, and the final
one carries her course's name and length. The Strong and Surrendered default
remains for any caller that passes nothing.

14 unit tests cover all of it, including that a negative debt still produces a
payoff date and that finishing a 28-day course earns its own final milestone.

### Still open from §18

`computeStreaks` compares UTC dates; "stars this week" is a today-only count;
Studio's `verbFor` is channel-blind; advancing a recurring Studio item nulls
`last_done_on`; `foods_avoided` is collected twice and read nowhere;
`updateNutritionGoals` has no caller, so Today's protein tile never shows a
target.

---

## 23. Studio, streaks and the wrong verb (14 Sept)

### Advancing a recurring item destroyed its history

`advanceStudioItem` wrote `posted_on: finished ? today : null` and the same
for `last_done_on` — so **every advance that was not the final step actively
nulled both columns**. For a weekly newsletter that had been finished once and
cycled back to the start, the first tap of the next cycle wiped
`last_done_on`; `isDue` returns true unconditionally when that is null, so
"done for now" and the whole interval stopped working for that item, for good.
The posted history went with it.

Now the dates are only written when there is a date to write. A column you are
not setting should be left alone, not overwritten with null — nothing about
moving from idea to drafted says anything about when the thing was published.

### The button named the wrong action on three pipelines

`verbFor` was keyed on the stage she was *leaving*, but the stage that follows
depends on the channel:

| channel · stage | button said | actually leads to |
|---|---|---|
| tiktok · filmed | "edit it" | posted |
| blog · drafted | "send it" | published |
| youtube · idea | "make it" | scripted |

Keyed on the stage being *arrived at* now, which is a property of the pipeline
rather than of the stage. `NEXT_VERB` was dead code that existed to patch
exactly this and was unreachable — `VERB[stage] ?? NEXT_VERB[stage]` always
found the first. Without a channel it returns "move it on" rather than
guessing: vague beats confidently wrong. 30 tests cover every stage of every
known pipeline.

### Streaks were counted in UTC

`computeStreaks` sliced `completed_at` to a UTC date while everything else
dates rows with `localToday()`. Seven hours west of UTC that is wrong twice
over: work done Monday evening and Tuesday morning both land on the UTC
Tuesday and **collapse into one day**, so two days of work count as one; and
Monday morning then Tuesday evening becomes UTC Monday and Wednesday, which
reads as a **broken run**. Both verified in tests against `America/Phoenix`.

It buckets by her timezone now, and an unrecognised zone falls back rather
than costing her a streak.

### Milestone dates assumed she worked in order

`earnedOn` read `byDay[m.at - 1]`, indexed by day number. Anyone who did day 4
before day 3 got the wrong date on every milestone after it. The nth milestone
is earned on the nth *completion*, whichever day that was.

### Left on the list

`foods_avoided` is collected in two places and read nowhere — the copy says
"nothing suggests them at you" and nothing filters on it.
`updateNutritionGoals` is the only writer of the manual calorie and protein
overrides and has no caller, so Today's protein tile always reads "g today"
with no target while Nutrition shows a calculated one. Both are drift between
copy and behaviour rather than anything breaking.

---

## 24. The last two, and what the audits amount to (14 Sept)

### The protein target that could never appear

`getTodayNutrition` read `daily_calorie_goal` and `daily_protein_goal_g` only.
Their sole writer, `updateNutritionGoals`, has no caller anywhere in the app —
so both were always null, and Today's protein tile always read "g today" with
no target, while Nutrition and the log screen showed a calculated one from the
same profile. Three surfaces, one number, two answers.

It falls back to `calculateTargets` now. No extra query: the profile was
already being fetched, it just was not being asked for enough columns.

### `foods_avoided` finally does something

Asked for in onboarding *and* in settings, under "By choice or by necessity —
either way, nothing suggests them at you." Nothing read it. Nor `allergies`,
outside the skincare rituals.

`getRecommendedRecipes` now filters on both. Three deliberate constraints:

- **It only ever removes.** It never marks anything as fine to eat.
- **Plain word matching**, and the copy says so. It catches "coconuts" when
  she typed "nuts", and misses casein when she typed "dairy" — both are in the
  tests, as expected results rather than bugs.
- **The allergy copy no longer over-promises.** It now reads: *"Word-matching
  only, so read the label yourself too — this app never tells you something is
  safe."* An allergy filter that someone trusts is more dangerous than none.

### What four rounds of auditing actually found

Roughly forty real problems. **Almost none were crashes.** The recurring shape:

1. **State that drifted from what it describes** — a form holding values the
   page had since changed; a tick map from the previous child; a card showing
   a ritual she never did as done.
2. **Copy that promised what the code did not do** — "nothing suggests them at
   you"; "needs a goal in your words"; "read its ingredients"; cautions "on the
   apothecary shelf", a page that does not exist.
3. **One value computed two ways** — outfits counted differently in two files;
   iron at 18 above a card saying 27; a debt-free date paired with a different
   plan's payment.
4. **Constants pretending to be settings** — a five-day period; ovulation on
   day 14; a 56-day course for everyone; defaults absent from their own list
   of choices.
5. **Time counted in the wrong place** — UTC against rows dated in hers, over
   and over.

None of these fail a typecheck, and a build passing says nothing about any of
them. What does catch them: reading the two halves side by side, and the three
scripted checks that now encode the ones worth never rediscovering —
`check:columns`, `check:kid`, and the unit tests around each engine.

The honest limit: `npm run verify` cannot see how long a page takes, cannot
see a claim in prose, and cannot see a value that two files compute
differently. Those still need someone to look.

---

## 25. What we charge for, and what we actually gate (14 Sept)

The same species as everything else these audits found — two sources of truth
disagreeing — but this one is about money.

### The gap

Both the marketing page and the in-app membership page promised *"Every
workout, and the routines that keep you well."* Workouts were gated.
**Protocols — which is what "the routines that keep you well" names — had no
gate at all.** Tonight's plan, the wash-day engine, the acids and actives
libraries, the apothecary, skin concerns: roughly 2,060 lines, free to anyone
with an account.

Two more were open and appeared on neither list: **Wardrobe** (~1,500 lines,
the colour analysis, the capsule, the outfit engine) and **Studio** (~350).
So nobody paying knew they were included, and nobody free knew they were
getting them.

It cost nothing yet — one free account, one inner-circle, one founder. It
would have cost the day someone joined free, used Protocols daily, and never
found a reason to pay.

### Decided

Protocols, Wardrobe and Studio are all part of The Circle. Both lists name
them now, in the same words.

Today also stops offering what a free member cannot open: no "tonight is your
retinal", no two o'clock Studio block, no outfit. The moment card is the one
surface that promises she can act on what it says, and an invitation to a
locked door breaks that.

### `npm run check:access`

Nothing catches a paywall disagreeing with a price list. It is not a type
error, nothing crashes, and each half reads correctly on its own — it is only
wrong side by side, which is exactly what a script can do every time.

It checks both directions: every gated area is named on the membership list,
and everything the list names is actually gated. Verified by removing the new
Protocols gate — it failed and named the route.

Three cases needed care, and each is recorded rather than silently skipped:

- **Gates can be one level down or inside.** `/app/program` lets her browse
  the list and gates the day; `/app/library` locks each door it lists with
  `meets(access.tier, …)`; `/app/nutrition` keeps logging free and locks
  recipes, grocery and pantry within the page. A per-page boolean calls all
  three "free" and is wrong about all three, so the check recurses.
- **Reading access is not gating.** `/app/membership` reads her tier to say
  whether she is already a member.
- **Free on purpose.** `/app/members/[id]` is someone's opt-in public profile,
  and "a read-only view of the circle" is a free feature — so it sits in
  `FREE_ON_PURPOSE` with its reason, rather than being absent and ambiguous.

`npm run verify` is now four checks: `tsc`, columns, kid routes, access.

---

## 26. What a new member actually sees (14 Sept)

The first outside tester joined two days ago: 2 check-ins and nothing else —
no meals, habits, products, garments, course, measurements, goals or cycle
dates. So the question stopped being hypothetical.

**The app does not collapse.** Almost every surface has a guarded empty state,
and the two engines most at risk — `buildMoment` and `NutrientRings` — degrade
cleanly. `/app/wardrobe` has the best empty state in the app ("start with five
things you actually wear") and is the model for the rest. The damage was
narrower and more specific.

### Fixed

**Money ticked off a step she had not done.** `freedomPath`'s "Kill
high-interest debt" was `done: !highInterest` — true when there are no
accounts at all — so an empty account rendered step 3 **struck through with a
green tick**. Step 6 already guarded with `accounts.length > 0`; this one was
missing the same clause.

**Today offered a reset to someone two days old.** `ResetPanel` had no silent
branch: with no gap it fell through to a permanent dashed "I'm resetting"
button. Worse, the threshold was 2 days, and `getCheckinGap` measures from her
last check-in — so checking in Monday and Tuesday and opening on Thursday said
*"it's been a few days — no need to explain"* on her third visit. Two days is
a weekend. Seven is a lapse. It now returns null when there is nothing to say.

**Becoming was a wall of zeroes against a course she never started.**
`getActiveCourseState` falls back to Strong and Surrendered's slug with no
enrolment, so the page measured her against it: run 0, "0 of 56 days", "0 of 8
weeks", "Not yet asked", and every milestone rendered as a padlock — reached
from a permanent card on Today. Evidence of change is the right idea and the
wrong page for day one; it now shows what fills it in, and a way to start.

**The nutrition note asserted numbers that did not exist.** "Your calorie and
protein targets come from your own weight and goal" and "micronutrient figures
are general adult reference intakes" — both false without a weight or a birth
year. The one line that could have explained thirty rows of zeroes instead
insisted they were personalised, which makes an un-filled-in app look broken.
Three states now, matching what she actually has.

**Onboarding never asked for height.** `heightCm: null`, hardcoded. Without it
`calculateTargets` cannot use Mifflin-St Jeor and falls back to a per-kilo
multiplier — then appends *"add height and year of birth for a closer
estimate"* to someone who has just given her year of birth. It is one field on
the step that already asks for weight. 7 tests on the feet-and-inches
conversion.

### Left standing, deliberately

`StateReading` renders at 2 check-ins showing noticing 14 and alignment 20 —
real numbers against a 14-day denominator she has existed for 2 days of. The
capacity line correctly says "still getting to know you", and the confidence
disclaimer is there. Lowering it further would mean showing nothing at all on
a page she just opened.

### The wider lesson

Every one of these reads correctly with data and wrongly without it. An empty
account is not an edge case — it is the state **every** member is in on the
day they arrive, and it is the only state the app cannot A/B its way out of.
Worth walking again whenever a surface is added.

---

## 27. The social layer, now that two people are in it (14 Sept)

Until this week the Circle had one member, so none of it had ever been
exercised. An audit of the whole social and privacy surface, checked against
the **live RLS policies** rather than the repo — which matters, because the
policies are not in git (§12) and several findings turned on them.

### What RLS already covers — verified, not assumed

- **`wins` and `course_day_progress`** both have a SELECT policy reading
  `profiles.profile_show->>'wins' | 'progress' = 'true'`. The doc comment
  claiming "readable only if she switched them on" was **accurate**; the
  app-level check in `/app/members/[id]` is belt and braces, not the only
  thing standing there.
- **Group posts, comments and reactions** all require membership in both
  directions — SELECT via `EXISTS (group_members …)`, INSERT via the same in
  `WITH CHECK`. The four unguarded group server actions are not exploitable.
- **Circle writes** require `auth.uid() = user_id AND is_paid()`, and comments
  and reactions additionally require the entry to be `visibility = 'circle'`.
- **Private journal entries, measurements, money, check-ins** — every read
  path filters on the session user. Nothing cross-member.
- **`public_profiles`** carries no email, birthday, life stage or body data.

### What was actually open

**A child could post, comment and react with the Circle switched off.** This
is the one that mattered. `circleOrRedirect()` guards two *pages*, and server
actions are plain POSTs whose ids sit in the client bundle — so the door was
shut and the action was not. The database did not close it either, and that is
the part worth naming: the INSERT policies require `is_paid()`, and `is_paid()`
deliberately returns the **guardian's** tier. A paid household's child passed
every check the app had, RLS included, while her parent had the toggle off.

`circleWriteAllowed()` now guards nine writers — the three Circle actions, the
two journal-sharing ones, and all four group actions. It returns an error
rather than redirecting, because a server action should answer its caller.
8 tests, including every case that must *not* be blocked.

**"Content removed." was not true.** `adminRemoveReportedContent` deleted
through the ordinary client, and the DELETE policy on every one of those six
tables is `auth.uid() = user_id` — there is **no admin delete policy
anywhere**, confirmed against `pg_policies`. So removing someone else's post
matched zero rows, returned no error, and the report was marked `removed`
while the content stayed live. The one record that would have prompted another
look now said it had been handled.

It uses the service client now — one of the few places that is the right tool,
since `requireAdmin` has already established who is asking — and checks the
count, because a moderation action that quietly does nothing is worse than one
that fails loudly.

### Known and not yet fixed

- **Blocking only filters feeds.** `getHiddenAuthorIds` is correct and
  bidirectional but is applied in three places. A blocked person's *comments*,
  *reactions* and *profile page* are all still visible, while the toast says
  "you won't see each other's posts". Narrowly true, broadly misleading.
- **`groups` SELECT is `auth.role() = 'authenticated'`**, so any member can
  read any group row — including `invite_code`, which is the join credential.
- **No `SafetyMenu` on comments**, so harassment in a reply has no route to a
  report.
- **Reports notify nobody**, and the admin card shows the reason without the
  reported text — a remove button for something never read.
- **`revalidatePath('/app/community')`** appears 8 times for a route that is
  now a redirect, and three Circle writers never revalidate `/app/circle`.

---

## 28. Blocking, invite codes, and a gap in my own check (14 Sept)

The rest of §27's list.

### Blocking now reaches past the feed

`getHiddenAuthorIds` is correct and bidirectional, and was applied to three
feeds and nothing else. So blocking someone removed her posts and left every
one of her **comments** in place — name, photo and all — one tap below, while
the confirmation said *"you won't see each other's posts"*.

Now applied in `getComments`, `getCommunityComments`, `getGroupPostComments`,
and on `/app/members/[id]`, which a blocked woman could previously open and
read. That last one uses `notFound()` rather than a message, because "you are
blocked" tells the blocked person something about the other woman's choices
that she is not owed.

### An invite code is a credential

The `groups` SELECT policy was `auth.role() = 'authenticated'` — every
signed-in member could read every group row, **including `invite_code`**. That
code is the whole of the join check in `joinGroupByCode`, so reading it was
equivalent to being able to join. Migration `invite_code_is_a_credential`
narrows it to members, the owner, and retreat groups.

**And that immediately broke joining by code** — she cannot read the row until
she is a member, and cannot become one until it is read. `joinGroupByCode`
does that one lookup with the service client now: presenting a correct code
*is* the authorisation, the query matches the exact code and selects only the
id, and the insert after it is still hers under RLS. Worth naming because the
migration looked complete on its own and was not.

Checked the other four `from('groups')` call sites against the new policy:
`getMyGroups` reads only her own; `getGroupById` now returns null to a
non-member, which turns a render-time check into a data-fetch one; both create
paths set `created_by = auth.uid()` so their `.select('id')` still passes.

### `check:kid` was only looking at the top level

`/app/groups` was guarded. `/app/groups/[groupId]` was not — and the check did
not notice, because it walked only the first level of `app/app/*`. A route one
directory deeper is exactly as reachable as one at the top.

It now walks every `page.tsx` beneath an adult-only route. That immediately
found two more genuinely unguarded pages: **`/app/nutrition/goals`** (her cycle
dates and body figures) and **`/app/wardrobe/you`** (the colour analysis).

One refinement it needed: ask `kidAllowed` about the **nested route itself**,
not its parent. `/app/nutrition` is adult-only but `/app/nutrition/log` is one
of a child's own pages, and inheriting the parent's answer would have demanded
a guard on the page she actually needs.

**The lesson about the checks themselves:** a check that passes is only worth
what its coverage is. This one had been green for a day while two adult pages
sat open, because of an assumption in the walker rather than anything in the
app. Worth asking of each of the four: what would it *not* see?

---

## 29. Moderation: the part with a person waiting on it (14 Sept)

Four things, all of them the same shape — a pathway that existed in the
database and stopped short of anything a woman could actually reach.

### The counts were not filtered, only the posts

Blocking filtered the post list and left the numbers above it alone, because
`reaction_count` and `comment_count` are computed from their own queries. So
"4 replies" opened to show three, and the heart count included someone she had
blocked. A block that leaks as an off-by-one is worse than none — it invites
her to go and check. Filtered in all three feeds; the comment selects now take
`user_id` so they can be.

### She was removing content she had never read

The admin report card showed the *reason* and nothing else. So "remove
content" permanently deleted a post on one member's description of it, with
the accusation on screen and the evidence nowhere. It now shows the text and
the author, fetched with the service client — a report is usually about a
group she is not in, where ordinary RLS returns nothing, which reads exactly
like "already deleted". When the row is genuinely gone the card says so and
the remove button is not offered.

`CONTENT_TABLE` moved to `lib/moderation.ts` so the screen that shows the
content and the action that deletes it use the same map. Two copies of that
lookup is the same species as everything else in this file.

### Reporting told nobody

It wrote a row. Reports is thirteenth in a nav bar that scrolls sideways off
the screen, so the only way she learned a member had reported something was by
going to look — which means by already suspecting. There is now a count on the
admin nav and on the Admin button in the app header, and when it is non-zero
that button goes straight to the reports rather than the overview. Reporting
and reviewing both revalidate the two layouts so it appears immediately.

### The safety menu was never on comments

`content_reports` has accepted `circle_comment`, `community_comment` and
`group_post_comment` since the table was written, and the removal path handles
all three. Nothing in the app could produce one — the menu was on posts only.
The replies are where people are actually unkind to each other, and it was the
one place with no way to say so.

### And the community feed revalidated a redirect

Five writers called `revalidatePath('/app/community')`. That route is four
lines that `redirect('/app/circle')` — the feed has been unified for a while.
So posting, reacting, commenting and pinning in the community feed refreshed a
page nobody is ever on, and the feed she was looking at kept its old copy.
All 8 now point at `/app/circle`.
