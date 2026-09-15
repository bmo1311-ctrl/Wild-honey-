# What this app is

Not a tracker. Not a dashboard. A place to hold inspiration, so a woman can
filter through it and live out her life — a source of energy, vitality,
wellness, wisdom, and of God.

Everything below follows from that. Where any future decision is unclear, this
document is the tiebreaker, not the roadmap.

---

## The thesis

**Each day looks different for a woman. That is the whole point.**

What she needs is not a streak. It is a system to fall back on — something
already decided, so that at 9pm with nothing left she does not also have to
decide. And inspiration, so that the falling back is toward something rather
than away from something.

An app that asks her to perform consistency is asking her to be a different
woman than the one who showed up today. That is the opposite of the work.

---

## The four pillars are the structure

**Body** — coming home to the vessel you live in
**Identity** — remembering and becoming who you are
**Mindset** — tending the stories you tell yourself
**Faith** — trusting the path before you can see it

This is her coaching plan. It is what she does with these women in person, and
it is the shape the app should have.

For a long time it was not. The app measured capacity, vitality, awareness and
alignment — four metrics, none of them one of the four pillars. The pillars
survived as coloured chips on posts. The structure that organises the actual
work became decoration, and a wellness dashboard's structure took its place.

Faith is a pillar. Not a tag, not a content category, not a tasteful nod. It
sits level with the other three because that is where it sits in her life and
in the lives of the women she works with.

---

## The rules

### 1. It may only say what she told it

**Silence is not data.** If she did not log breakfast, the app knows nothing
about breakfast — not that she skipped it. She may have journalled on paper,
prayed in the car, eaten at her mother's. None of that is the app's to know,
and none of its absence is hers to be measured by.

Concretely, and enforced by `npm run check:silence`:

- No percentage whose numerator is her participation
- No denominator of days
- Nothing that reads "you only…", "you haven't…", "X of the last 14 days"
- A gap is a gap. It is never evidence.

This killed two of the four original metrics outright. `awareness` divided the
days she wrote in the app by fourteen and called the result how much she was
noticing about herself — so a woman with a paper journal and a prayer life
scored zero on self-awareness. `alignment` treated not opening the app as
evidence her life did not match her values. Both are gone.

What survived: `capacity` and `vitality`. Both only speak when she has spoken.

### 2. It holds. It does not grade.

The app's job is to keep the inspiration — scripture, her teaching, the words
and images worth returning to — and offer from it. What she does with any of
it is her life, not the app's business.

No completion rates. No adherence. No "did you do it." A suggestion she
ignored for six days is not a failure state; it is a suggestion she did not
need.

### 3. Systems flex. The woman does not.

The same system comes in three sizes, and the day decides which.

On a stretched day the evening is one thing: wash your face, drink water, go
to bed. On an abundant day it is the full version. **Not a reduced goal. Not a
lite mode with a smaller number beside it.** The same system, sized to the
woman who actually showed up.

`computeCapacity` already produces this signal — `stretched | available |
abundant` — and for a long time nothing in the app changed because of it. The
app knew what kind of day it was and handed her the identical day regardless.

### 4. It is allowed to say nothing

An app that produces an insight every single day teaches her that none of them
mean anything. `headline()` returns null far more often than it returns a
sentence, and that is correct.

The same goes for the noticing: one true, specific thing she did not type —
"you've written three mornings running, which you last did in June" — and
nothing at all the rest of the time. A thing that comments every day is not a
friend, it is a notification.

### 5. Nothing shames her

Established earlier and unchanged. No broken-streak language, no red, no
"you're falling behind." Progress copy describes where she is, never how far
short.

### 6. What it will not do

- Clear anyone as safe in pregnancy — it flags and defers to her doctor or midwife
- Claim a product contains an active it cannot verify from the name or a pasted list
- Reproduce anyone else's copyrighted work
- Diagnose, or imply a diagnosis

---

## What this means for the surfaces

**Today** is the day, sized. Not a list of what is outstanding.

**Protocols** stops being a nightly attendance register. It becomes the thing
she opens when something is wrong — skin is angry this week, hair is limp —
and it answers from what she already owns. The tonight engine survives as the
answer to that question rather than as a daily ask. The evidence for this: she
entered ten products and logged zero routines. She paid the expensive setup
cost and skipped the one-tap one, which means the return was missing, not that
the price was too high.

**The pillars** are how inspiration is held and found.

**The state layer** is read by everything and displayed as a score by nothing.

---

## The test

Does it feel like a best friend, or like homework?

A best friend notices one thing and says it. She does not keep a record of
your attendance. She is delighted to see you after three weeks of nothing and
does not open with where you have been.
