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
