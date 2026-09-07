# Walking the app as a new member

Traced every screen a member hits with nothing in it. Not opinions — what
the code actually renders when the tables are empty.

September 7, 2026.

---

## 1. Today is empty for anyone without a course

**This is the one that matters.**

A brand new member — free or paid — lands on Today and sees a heading and a
button. That is the entire screen:

> ### Start a program
> pick where you're beginning — you can carry more than one.
> **[ See the programs ]**

No daily prompt. No food logging. No check-in. No habits. No Protocols, no
Studio, nothing about her body. The app looks empty and slightly broken.

For a **free** member it is worse than empty, it is a dead end: that button
goes to Programs, and every programme is behind the paywall. So the entire
free experience of the home screen is one button to a locked door.

And it now catches paid members too. Switching a course off — which I built
for you today — drops her back to this same screen. The app forgets she
exists the moment she sets a programme down.

**Fix:** Today should always show the things she can actually do. The
programme is one row among several, not the price of entry.

---

## 2. The free tier is advertised but not delivered

The landing page sells free as:

- The daily prompt
- Your private journal
- Food and body logging
- A read-only view of the circle

All four exist and all four work. **None of them appear on Today** until she
starts a paid programme. A woman who signs up free, reads that list, lands
on the home screen and sees a locked door has been told something untrue
without anyone meaning to.

---

## 3. I fixed a check-in nobody can reach

Worth saying plainly because it was my mistake.

There are **two** check-in screens with two different components:

| page | component | linked from |
|---|---|---|
| `/app/checkin` | `DailyCheckin` | Today's row — this is the real one |
| `/app/energy` | `WellnessCheckinForm` | **nothing at all** |

The nine-field check-in I cut down this morning was the second one. It sits
on a page with zero links anywhere in the app, no entry in the module
registry, and no door in the Library. It is reachable only by typing the URL.

The check-in members actually use was already partly folded — three scales,
then "a bit more" — but still shows cycle phase and movement minutes
unfolded, so it is five visible asks rather than three.

**Fix:** apply the cut to `DailyCheckin`, and decide whether `/app/energy`
should be linked or deleted. It also holds trends, wins and habits, which
are good and currently invisible.

---

## 4. Two claims on the sales page the code cannot support

**"Three programs"** appears in five places. There are **four**. Still
Waters is not named in any sales copy, so members are paying for something
nobody tells them exists.

**"A library that learns you — the shelves reorder around what you actually
watch."** The vault sorts by newest, full stop. There is no personalisation.
That is a false claim on a page that takes money and it should come down
today, whatever else changes.

---

## 5. Protocols and Studio are free, and not on purpose

Neither is gated, and neither appears in the paywall list. So a free member
gets the whole skin and hair engine, 118 seeded products, the wash-day
planner, and the entire output engine.

That may be exactly what you want — they are wonderful hooks. But it is
currently a decision nobody made, and Protocols is arguably the most
distinctive thing in the app.

---

## What is actually solid

Worth saying, because most of the walk went well.

- **The paywall holds.** Recipes, pantry and workouts redirect into gated
  pages with proper locked panels. No holes found.
- **Onboarding is enforced** — the layout redirects until it is done.
- **Content is really there**: 105 prompts, 127 vault resources, 60 recipes,
  13 workouts, 406 foods, 118 beauty products.
- **No crashes on empty data.** Every array access I traced is guarded.
- **Every internal link resolves.** Swept the whole app; nothing 404s.
- Groups, Circle and the course pages all have proper empty states.

---

## In order

1. **Rebuild Today for someone with no course.** Everything else on this
   list is cosmetic next to a home screen that looks broken on day one.
2. **Move the check-in cut to `DailyCheckin`** — the one people use.
3. **Fix "three programs" and delete the shelves claim.** Ten minutes, and
   one of them is a false statement on a paid page.
4. **Decide about Protocols and Studio** — free hooks, or part of The Circle.
5. **Link or delete `/app/energy`.** Trends, wins and habits are sitting
   behind a URL nobody will ever type.
