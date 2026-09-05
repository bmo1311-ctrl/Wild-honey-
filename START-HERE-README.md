## Wild Honey Circle — course engine handoff

You're picking up work already started elsewhere. Read all of this before writing code. Some of it is **already done and live** — don't redo it.

### The goal

Rebuild this app around **one course**, mobile-first. The owner's words: *"There's a lot of meaningless stuff that is boring and just monotonous. It needs to be built for the course."* Everything must be readable on a phone. She will never print anything.

The course is **Strong and Surrendered** — 8 weeks, 56 days, a body-first program. A woman opens the app on Day 23 and it tells her exactly what today is, she does it, she taps done.

---

## 1. ALREADY DONE — do not recreate

### Database (live in Supabase, project ref `dxwkfijdoqnculclecmx`)

Three tables exist with RLS enabled and owner-only policies. **Do not create, alter or drop them.** Read and write them as-is.

```sql
course_enrollments (
  id uuid pk, user_id uuid -> profiles(id), course_slug text,
  started_on date default current_date, is_active boolean default true,
  completed_at timestamptz, created_at timestamptz,
  unique (user_id, course_slug))

course_day_progress (
  id uuid pk, user_id uuid -> profiles(id), course_slug text,
  day_number int, completed_at timestamptz default now(),
  unique (user_id, course_slug, day_number))

course_writings (
  id uuid pk, user_id uuid -> profiles(id), course_slug text,
  day_number int, prompt_index int default 0, prompt text,
  body text default '', updated_at timestamptz default now(),
  unique (user_id, course_slug, day_number, prompt_index))
```

RLS on all three is `auth.uid() = user_id` for all operations. Always resolve the user server-side; never accept a user id from the client.

Also seeded, already in the DB: a `challenges` row titled "Strong and Surrendered" (56 days) and eight `workouts` rows titled "Strong and Surrendered — Week N: …". Leave them alone; they're a fallback.

### Content and assets — these files exist in her local folder and need to come into the repo

- **`lib/courses/strong-and-surrendered.json`** — ~108 KB, the entire course. All 56 days and 8 weeks, already written and voiced. **This is the single most important file. Do not regenerate it, do not rewrite its copy.** If it isn't in the repo yet, ask her to copy it from `~/Downloads/Wild-honey-/lib/courses/`.
- **`public/shapes/*.png`** — 15 illustrations: `hollow arch stacked landing seated exhale kneel walk squat hinge carry getup stand table circle`. Same source folder, `~/Downloads/Wild-honey-/public/shapes/`.

### Content shape

```ts
{
  slug: "strong-and-surrendered",
  title, subtitle, length_days: 56, weeks: 8,
  week_list: [{ week_number, title, verb, principle,
                opening_line, stakes, pull_quote, blocks[] }],
  days:      [{ day_number, week_number, title, kind, minutes, blocks[] }]
}
```

`kind` ∈ `teaching | practice | session | rest | milestone`.
Day → week mapping is `Math.floor((day - 1) / 7) + 1`.
Current day = days elapsed since `started_on`, plus 1, clamped to 1–56.

### Block types — render every one of these

```
{t:"text", v}                                  paragraph
{t:"h", v}                                     small heading
{t:"quote", v, by}                             pull quote — large, generous white space
{t:"steps", title, items:[{n, head, sub}]}     numbered cards
{t:"figure", pose, label, cue}                 <img src=`/shapes/${pose}.png`> + label + cue
{t:"grid", title, cols[], rows[][]}            small reference table
{t:"versus", title, left:{head,items[]}, right:{head,items[]}}
{t:"write", prompt, lines}                     textarea that SAVES to course_writings
{t:"check", title, items[], demo}              checklist + the demonstration, set apart
{t:"rate", q, left, right}                     1–10 scale she taps
{t:"scripture", ref, text, why}
{t:"log"}                                      the existing log-today widget
{t:"note", tone:"warn"|"scope"|"note", title, v}
```

Block counts across the course: text 60, steps 56, log 56, write 28, quote 8, check 8, rate 8, figure 5 — plus grid, versus, scripture and note on the week pages.

---

## 2. WHAT TO BUILD

### Nav — cut to five tabs
`components/bottom-nav.tsx`, currently Today · Energy · Circle · Workouts · You. Change to:

**Today · Program · Write · Circle · You**

### Hide the rest behind one flag file
`lib/features.ts` — a plain object of booleans, all `false`: `recipes, pantry, mealPlans, groceries, energy, vault, archive, fixedCalendar, expertQA, shop, retreats, community, challenges, protocols, groups, progress`.

Each hidden route early-returns a small "Not available" panel when its flag is false, and links to it are removed from Today and the profile menu. **Delete nothing.** It all comes back by flipping one boolean.

Stays on: Today, Program, Write, Circle (the one social feed — hide `community` and `groups`), profile, settings, membership, workouts.

### `/app/program`
Course title, "Day 23 of 56", slim progress bar. Eight week cards: number, title, the `verb` as a small chip, a done / current / upcoming state. Don't hard-lock future weeks — show them muted but tappable. It's her own book.

### `/app/program/week/[n]`
`opening_line` large at the top, then `stakes`, then render `blocks[]`, then that week's seven days as a compact list with tick states linking to each day.

### `/app/program/day/[n]` — the most important screen
Kicker `WEEK 3 · DAY 17` and the `kind` as a quiet label. Title, large. Render `blocks[]`. A big primary **"Done for today"** writing to `course_day_progress`, ticked with the time if already done, with undo. Previous / next arrows. **Nothing else.** She's holding a phone in a kitchen at 6:40am.

### `/app/write`
Everything she's written, newest first — prompt plus first line, tapping through to edit. This replaces a paper workbook, so it must feel like a notebook and must never lose anything.

### Today (`app/app/page.tsx`) — rewrite
If enrolled: today's day rendered inline, same as the day view, no extra navigation, plus streak and the log widget. If not enrolled: a single card that starts the course, creating the enrollment with `started_on = today`.

Stop rendering morning reset, evening reflection, prompt-of-the-day, goals and the focus card.

### Server actions and data helpers
`enrollInCourse`, `unenrollFromCourse`, `completeCourseDay`, `uncompleteCourseDay`, `saveCourseWriting` (upsert), and read helpers `getEnrollment`, `getCurrentDay`, `getCompletedDays`, `getWritings`. Match the existing patterns in `app/actions.ts` and `lib/data.ts`.

---

## 3. DESIGN — she asked specifically for engagement and attention

- **One thing per screen.** Today shows today. Nothing else.
- **Visible progress.** Day counter, a 56-dot or 8-week strip, the streak. She should watch it fill.
- **The illustrations do the teaching.** Render `figure` blocks generously sized, never as thumbnails.
- **Pull quotes get real space.** Large type, lots of white around them.
- **Short scroll.** A day is 3–6 blocks and must fit in a couple of thumb-flicks.
- **One primary action per screen**, visually dominant.
- Type large enough to read at arm's length, generous line height, mobile-first.

**Palette — Bright Winter, and this is settled.** Cool undertones, high contrast, clear and saturated. Anchor is a true blue-based red `#C8102E`; sapphire `#14417A` carries structure; ice `#F4F7FA` for surfaces; text cool near-black `#14171C`. **No gold, amber, honey-yellow, cream, beige or terracotta anywhere.** The `--honey` token in `globals.css` is deliberately cool — leave it cool. Warm Sedona photography is allowed to be the only warm thing on a page.

---

## 4. RULES

- **Don't touch the three course tables.** They're live and correct.
- **Don't rewrite the course JSON copy.** It's finished, voiced, and signed off.
- **No new npm dependencies.**
- Server components by default; `'use client'` only where interaction requires it.
- Every query filters by the authenticated user. Never expose another member's data.
- Note that `next.config.mjs` has `typescript.ignoreBuildErrors: true`, so type errors become runtime errors rather than build failures. Be conservative.
- Deploy to a **preview URL first**, not production. She wants to walk it on her phone before it goes live.

## 5. Known gap worth fixing

`rate` and `check` blocks currently display but don't persist — tap a number, navigate away, it's gone. `write` saves correctly. Either add a small table for them or extend `course_writings` with a `kind` column. Her comprehension checks and completion criteria should survive a page change.
