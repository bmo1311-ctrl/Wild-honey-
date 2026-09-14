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
