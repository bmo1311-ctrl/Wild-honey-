import { RITUALS, type Ritual } from './rituals'

/**
 * Something to react to, instead of a blank line.
 *
 * The database says this plainly. Six check-ins, one commitment, and zero
 * experiments — and the two emptiest things in the app are the two that ask
 * her to invent prose from nothing. A commitment form says "I will…" and
 * waits. An experiment form asks her to name a hypothesis. Both are a cursor
 * blinking in an empty box at the end of a long day.
 *
 * Choosing is a fundamentally easier act than composing. So every generative
 * surface offers a handful of real, complete, tappable options, and each one
 * fills the field rather than submitting anything — she can change a word,
 * change all of them, or ignore the lot and write her own. Nothing here is a
 * limit on what she can say.
 *
 * Two rules that keep this from becoming a fortune cookie:
 *
 * Grounded beats clever. A suggestion built from something she actually
 * logged carries a `because` that names the evidence, and it is ranked above
 * the generic ones. A suggestion that is merely sensible says nothing about
 * her and admits it by staying silent.
 *
 * Never a diagnosis. These are prompts to choose from, not conclusions. The
 * wording stays on the side of "worth trying" rather than "this is your
 * problem", because with this little history that is all it could honestly be.
 */

export interface SuggestionContext {
  /** Goals in her own words, from user_goals. */
  goals: string[]
  /**
   * Newest last, exactly as the daily check-in stores them.
   *
   * These three are the only numbers the check-in actually captures, and all
   * three run 1-10. An earlier draft of this file reasoned about sleep
   * *hours* and a 1-5 scale — neither exists, so it would have offered her a
   * suggestion citing evidence the app has never collected, which is worse
   * than offering nothing.
   */
  checkins: { date: string; energy?: number | null; sleep_quality?: number | null; stress?: number | null }[]
  /** Titles of habits she already keeps — never suggest a duplicate. */
  habits: string[]
  /** Commitments she already made, for the same reason. */
  existingCommitments: string[]
  /** Whether she is carrying a programme right now. */
  hasCourse: boolean
  /** Where she is, when she has said. Changes what is appropriate to suggest. */
  lifeStage?: string | null
  /**
   * The life seasons she is in — plural, and usually several at once.
   *
   * This is the richest thing the app knows about her and it was going
   * unread. A woman who has said she is an entrepreneur, rebuilding, in
   * motherhood and deepening her faith has told us four true things about
   * where her capacity is going; suggestions that ignore all four are
   * generic by choice rather than by necessity.
   *
   * Keys from lib/honey-profile.ts.
   */
  seasons?: string[]
  /**
   * Today's date, used only to rotate which seasons get a turn.
   * Optional — without it the order is simply the order she chose them.
   */
  today?: string
}

export interface Suggestion {
  /** What lands in the field. Editable the moment it does. */
  text: string
  /**
   * Why this one is being offered, when it comes from her own data.
   * Null for a generic suggestion — an invented reason would be worse than
   * no reason.
   */
  because: string | null
}

export interface ExperimentSuggestion extends Suggestion {
  /** The whole thing, ready to start: what she is testing. */
  description: string
  lengthDays: number
  /** What to pay attention to while it runs. */
  notice: string
}

const MIN_CHECKINS_TO_INFER = 4

function recent<T extends { date: string }>(rows: T[], n: number): T[] {
  return rows.slice(-n)
}

function mean(values: number[]): number | null {
  const live = values.filter((v) => Number.isFinite(v))
  return live.length ? live.reduce((a, b) => a + b, 0) / live.length : null
}

/** Case- and punctuation-insensitive, so "I will walk." matches "walk". */
function alreadyHas(haystack: string[], needle: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z ]/g, '').trim()
  const n = norm(needle)
  return haystack.some((h) => {
    const x = norm(h)
    return x.includes(n) || n.includes(x)
  })
}

/**
 * What the check-ins actually support saying.
 *
 * Deliberately conservative. Under four check-ins this returns nothing at
 * all, because three data points is a mood, not a pattern, and an app that
 * says "you always…" on day two has lost her.
 */
function readState(ctx: SuggestionContext): { lowEnergy: boolean; poorSleep: boolean; highStress: boolean } {
  const rows = recent(ctx.checkins, 7)
  if (rows.length < MIN_CHECKINS_TO_INFER) {
    return { lowEnergy: false, poorSleep: false, highStress: false }
  }
  const e = mean(rows.map((r) => r.energy ?? NaN))
  const s = mean(rows.map((r) => r.sleep_quality ?? NaN))
  const t = mean(rows.map((r) => r.stress ?? NaN))
  // All three sliders run 1-10, so the midpoint is 5.5 and these sit a clear
  // step either side of it rather than at the extremes nobody ever taps.
  return {
    lowEnergy: e !== null && e <= 4,
    poorSleep: s !== null && s <= 4,
    highStress: t !== null && t >= 7,
  }
}

/**
 * What each season makes worth offering.
 *
 * One commitment and one experiment per season, written for the actual
 * shape of that life rather than for wellness in general. A woman in
 * motherhood does not need the same suggestion as a woman in career
 * expansion, and the app already knew which she was.
 *
 * The `because` names the season in her own words, so the reason is
 * checkable — she told us this, and can untell us in one tap.
 */
const BY_SEASON: Record<
  string,
  { commitment: string; experiment: { text: string; description: string; lengthDays: number; notice: string } }
> = {
  rebuilding: {
    commitment: 'I will rebuild one thing at a time',
    experiment: {
      text: 'One thing rebuilt',
      description: 'Choosing a single thing to put back together this week, and letting the rest wait.',
      lengthDays: 7,
      notice: 'Whether finishing one thing feels better than touching five.',
    },
  },
  growing: {
    commitment: 'I will do the thing that scares me slightly, once a week',
    experiment: {
      text: 'The slightly-too-big thing',
      description: 'One thing a week that is just past what feels comfortable.',
      lengthDays: 14,
      notice: 'What it actually costs, versus what you expected it to cost.',
    },
  },
  healing: {
    commitment: 'I will let this take the time it takes',
    experiment: {
      text: 'No pushing',
      description: 'A week with nothing forced. Rest when tired, stop when done.',
      lengthDays: 7,
      notice: 'Whether anything recovers faster when it is not being hurried.',
    },
  },
  motherhood: {
    commitment: 'I will take twenty minutes that belong to nobody else',
    experiment: {
      text: 'Twenty minutes of my own',
      description: 'Twenty minutes a day that are not for anyone else, at whatever hour they can be found.',
      lengthDays: 7,
      notice: 'Whether the rest of the day is easier to give when some of it was yours.',
    },
  },
  entrepreneurship: {
    commitment: 'I will stop working at a time I choose in advance',
    experiment: {
      text: 'A closing time',
      description: 'Naming the hour the working day ends the night before, and keeping it.',
      lengthDays: 7,
      notice: 'Whether the work actually suffers, or only feels like it will.',
    },
  },
  career_expansion: {
    commitment: 'I will say no to one thing that is not mine to carry',
    experiment: {
      text: 'One no a week',
      description: 'Declining one request that belongs to someone else.',
      lengthDays: 14,
      notice: 'What happens. Usually nothing.',
    },
  },
  transition: {
    commitment: 'I will not decide anything big while I am this tired',
    experiment: {
      text: 'Nothing decided at night',
      description: 'No big decisions after eight in the evening for two weeks.',
      lengthDays: 14,
      notice: 'Whether the same question looks different in the morning.',
    },
  },
  deepening_faith: {
    commitment: 'I will keep the first ten minutes of the day for prayer',
    experiment: {
      text: 'The first ten minutes',
      description: 'Ten minutes of prayer or stillness before anything else begins.',
      lengthDays: 7,
      notice: 'What the day feels like when it does not start with a screen.',
    },
  },
  finding_balance: {
    commitment: 'I will stop trying to do all of it in the same week',
    experiment: {
      text: 'One thing at a time',
      description: 'Choosing what this week is for, and letting the other things be next week.',
      lengthDays: 7,
      notice: 'Whether less at once turns out to be more done.',
    },
  },
  becoming_healthiest: {
    commitment: 'I will eat something with protein at breakfast',
    experiment: {
      text: 'Protein first',
      description: 'Protein at the first meal, every day.',
      lengthDays: 7,
      notice: 'Mid-morning energy, and what you reach for at eleven.',
    },
  },
}

function seasonLabel(key: string): string {
  return key.replace(/_/g, ' ')
}

/**
 * Which seasons get to speak today.
 *
 * Three at most, or the list becomes the thing she was trying to escape.
 * But a woman carrying four seasons would otherwise never see the fourth —
 * hers was deepening faith, permanently cut by the cap — so the window
 * rotates by the day. Over a week every season she named gets a turn, and
 * the order is deterministic, so it does not reshuffle on every render.
 */
function seasonsForToday(seasons: string[], today?: string, take = 3): string[] {
  if (seasons.length <= take) return seasons
  const day = today ? Math.floor(Date.parse(`${today}T00:00:00Z`) / 86_400_000) : 0
  const start = Number.isFinite(day) ? ((day % seasons.length) + seasons.length) % seasons.length : 0
  return Array.from({ length: take }, (_, i) => seasons[(start + i) % seasons.length])
}

/**
 * Commitments she might make.
 *
 * A commitment here is a sentence she agrees to revisit in a fortnight, so
 * these are written as promises rather than tasks, and every one of them is
 * small enough to actually keep.
 */
export function commitmentSuggestions(ctx: SuggestionContext, limit = 6): Suggestion[] {
  const state = readState(ctx)
  const out: Suggestion[] = []
  const add = (text: string, because: string | null) => {
    if (alreadyHas(ctx.existingCommitments, text)) return
    out.push({ text, because })
  }

  // Grounded first — these are the ones that make the app feel like it is
  // paying attention, so they go to the top of the list.
  if (state.poorSleep) {
    add('I will be in bed by eleven on weeknights', 'you have been rating your sleep low most of this week')
  }
  if (state.lowEnergy) {
    add('I will eat something before my first commitment of the day', 'your energy has been rating low this week')
  }
  if (state.highStress) {
    add('I will get outside for ten minutes before noon', 'your stress has been rating high this week')
  }
  // Her seasons. Several at once is normal, so several can contribute — but
  // capped, because six suggestions from six seasons is a list again.
  for (const season of seasonsForToday(ctx.seasons ?? [], ctx.today)) {
    const entry = BY_SEASON[season]
    if (entry) add(entry.commitment, `you said you are in ${seasonLabel(season)}`)
  }

  for (const goal of ctx.goals.slice(0, 2)) {
    add(`I will protect one hour a week for ${goal.toLowerCase()}`, `you said this matters to you`)
  }
  if (ctx.hasCourse) {
    add('I will do my programme day before I open anything else', 'you are carrying a programme right now')
  }

  // Then the ones that are simply good, offered without a claim attached.
  add('I will stop saying yes when I mean no', null)
  add('I will leave my phone out of the bedroom', null)
  add('I will finish one thing before starting another', null)
  add('I will ask for help with one thing I have been carrying alone', null)
  add('I will let one thing be good enough', null)
  add('I will spend ten minutes a day on something that is only mine', null)

  return out.slice(0, limit)
}

/**
 * Experiments she might run.
 *
 * The whole template, not a title — this is the actual unlock. An experiment
 * is only worth anything if it has a length and something to measure, and
 * asking a tired woman to invent all three is why there are none in the
 * database. One tap should produce a complete, finishable experiment.
 *
 * Seven days by default. Long enough to see something, short enough that
 * starting it is not a commitment to a new identity.
 */
export function experimentSuggestions(ctx: SuggestionContext, limit = 5): ExperimentSuggestion[] {
  const state = readState(ctx)
  const out: ExperimentSuggestion[] = []
  const add = (s: ExperimentSuggestion) => {
    if (alreadyHas(ctx.habits, s.text)) return
    out.push(s)
  }

  if (state.poorSleep) {
    add({
      text: 'Phone out of the bedroom',
      description: 'Charging it somewhere else, so the last thing at night and the first thing in the morning is not a screen.',
      lengthDays: 7,
      notice: 'How long it takes to fall asleep, and what the first ten minutes of the morning feel like.',
      because: 'you have been rating your sleep low most of this week',
    })
  }
  if (state.highStress) {
    add({
      text: 'A hard stop',
      description: 'Naming the hour the working day ends, and stopping at it.',
      lengthDays: 7,
      notice: 'Whether the evening feels like yours again.',
      because: 'your stress has been rating high this week',
    })
  }
  if (state.lowEnergy) {
    add({
      text: 'Eat before the day starts',
      description: 'Something with protein in it before the first thing anyone else needs from you.',
      lengthDays: 7,
      notice: 'Whether the eleven o\'clock dip still arrives.',
      because: 'your energy has been rating low this week',
    })
    add({
      text: 'One unreactive hour',
      description: 'No messages, no email, no feed for the first hour you are awake.',
      lengthDays: 7,
      notice: 'What the rest of the day feels like when it does not begin by answering someone.',
      because: 'worth testing while your energy is low, because it costs nothing to try',
    })
  }

  for (const season of seasonsForToday(ctx.seasons ?? [], ctx.today)) {
    const entry = BY_SEASON[season]
    if (entry) add({ ...entry.experiment, because: `you said you are in ${seasonLabel(season)}` })
  }

  // Always available, and genuinely good regardless of what the data says.
  add({
    text: 'Walk after dinner',
    description: 'Ten to twenty minutes outside, no destination.',
    lengthDays: 7,
    notice: 'Sleep, and how the evening feels afterwards.',
    because: null,
  })
  add({
    text: 'One thing at a time',
    description: 'Finishing what is open before starting the next thing, for a week.',
    lengthDays: 7,
    notice: 'Whether the day feels longer or shorter.',
    because: null,
  })
  add({
    text: 'Say no once a day',
    description: 'One small no, to anything that was not really yours to carry.',
    lengthDays: 7,
    notice: 'What it costs, and whether anything actually goes wrong.',
    because: null,
  })
  add({
    text: 'Water first',
    description: 'A full glass before coffee.',
    lengthDays: 7,
    notice: 'Headaches, and mid-morning energy.',
    because: null,
  })
  add({
    text: 'Nothing new',
    description: 'Starting no new project, protocol, course or habit for two weeks. Only finishing.',
    lengthDays: 14,
    notice: 'How much room appears when nothing is being added.',
    because: null,
  })

  return out.slice(0, limit)
}

/**
 * How many of these came from her own data.
 *
 * Used to decide whether to say anything about where they came from at all.
 * When it is zero, the honest framing is "some places to start", not
 * "based on your week".
 */
export function groundedCount(suggestions: Suggestion[]): number {
  return suggestions.filter((s) => s.because !== null).length
}

// ── Treatments ──────────────────────────────────────────────────────────────


export interface TreatmentSuggestion extends Suggestion {
  slug: string
  /** How to do it, in her voice. Already written in lib/rituals.ts. */
  how: string
  minutes: number
}

/**
 * Treatments she could actually do tonight.
 *
 * Six of these have existed in lib/rituals.ts since the beginning — a honey
 * mask, an oat and yoghurt soak, a green tea compress — written in her voice,
 * needing nothing but a kitchen. Every one of them was unreachable. They
 * surfaced only as the fallback inside planTonight on a rest night, which
 * requires a shelf of products to have been entered first.
 *
 * So the woman with nothing on her shelf — the one who most needs somewhere
 * to start — was the one woman who could never see them. Her empty Protocols
 * page said "add what you use" and gave her a search box, which is the blank
 * page problem again wearing a different hat.
 *
 * These need no products, cost nothing, and produce a real log entry the
 * moment she taps one. routine_log has never had a single row in it.
 */
export function treatmentSuggestions(input: {
  /** Free text from her settings. A ritual containing any of it is dropped. */
  allergies?: string | null
  /** Slugs she has done lately, so the same one is not offered twice running. */
  recentRitualSlugs?: string[]
  /** Drives the stable per-day ordering. */
  today?: string
  /** True when she has no products at all in this area. */
  shelfIsEmpty?: boolean
  limit?: number
}): TreatmentSuggestion[] {
  const { allergies, recentRitualSlugs = [], today, shelfIsEmpty = false, limit = 3 } = input

  const avoid = (allergies ?? '').toLowerCase()
  const safe: Ritual[] = RITUALS.filter(
    (r) => !recentRitualSlugs.includes(r.slug) && !r.contains.some((c) => avoid && avoid.includes(c)),
  )
  if (safe.length === 0) return []

  // Same stable per-day rotation the tonight engine already uses, so the two
  // never disagree about what tonight's gentle option is.
  const seed = today ? Number(today.replace(/-/g, '')) % safe.length : 0
  const ordered = Array.from({ length: safe.length }, (_, i) => safe[(seed + i) % safe.length])

  return ordered.slice(0, limit).map((r) => ({
    slug: r.slug,
    text: r.title,
    how: r.how,
    minutes: r.minutes,
    because: shelfIsEmpty
      ? 'nothing to buy — this one is done with what is already in your kitchen'
      : null,
  }))
}

// ── Her own words, given back ───────────────────────────────────────────────

/**
 * What she has typed here before, most-used first.
 *
 * The cheapest friction fix in the app and the most honest one: no content
 * written by me, no inference, just her own past entries offered as taps.
 * Money categories are the clearest case — she retypes "groceries" every
 * week into a blank box while the database already holds it forty times.
 *
 * Case-insensitive on the way in, but her own capitalisation is what comes
 * back out, because "Groceries" and "groceries" being two chips is exactly
 * the kind of mess that makes a feature feel broken.
 */
export function recentlyUsed(values: (string | null | undefined)[], limit = 8): string[] {
  const counts = new Map<string, { display: string; n: number }>()
  for (const raw of values) {
    const v = raw?.trim()
    if (!v) continue
    const key = v.toLowerCase()
    const seen = counts.get(key)
    if (seen) seen.n++
    else counts.set(key, { display: v, n: 1 })
  }
  return [...counts.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, limit)
    .map((x) => x.display)
}

/**
 * Ways into a journal entry, when the page is blank.
 *
 * These are openings rather than questions — a half-finished sentence is far
 * easier to continue than a question is to answer, and it leaves her writing
 * her own thought rather than answering mine.
 *
 * Deliberately not therapy. No "how does that make you feel", nothing
 * fishing for a confession.
 */
export function journalStarters(input: { seasons?: string[]; today?: string }): Suggestion[] {
  const out: Suggestion[] = []
  const general = [
    'Today was mostly…',
    'The thing I keep circling back to is…',
    'What I actually want right now is…',
    'Something I noticed today…',
    'I am tired of…',
    'One thing that went right…',
  ]

  const bySeason: Record<string, string> = {
    motherhood: 'The part of today that was only mine…',
    entrepreneurship: 'What the work took out of me today…',
    rebuilding: 'One thing that is steadier than it was…',
    deepening_faith: 'What I want to say that I have not said…',
    healing: 'What my body was asking for today…',
    transition: 'What I am between…',
    growing: 'What I am not saying out loud yet…',
    career_expansion: 'What I said yes to that I meant…',
    finding_balance: 'What I let go of today, or did not…',
    becoming_healthiest: 'How I actually felt in my body today…',
  }

  for (const s of seasonsForToday(input.seasons ?? [], input.today, 2)) {
    const line = bySeason[s]
    if (line) out.push({ text: line, because: `you said you are in ${seasonLabel(s)}` })
  }

  // Rotate the general openings too, so it is not the same page every night.
  const day = input.today ? Number(input.today.replace(/-/g, '')) : 0
  const start = general.length ? ((day % general.length) + general.length) % general.length : 0
  for (let i = 0; i < 3; i++) {
    out.push({ text: general[(start + i) % general.length], because: null })
  }
  return out
}

/**
 * Kinds of win worth writing down.
 *
 * "write it down…" was the emptiest prompt in the app, and wins are the one
 * thing women reliably under-record — the bar drifts up until only enormous
 * things count and then nothing gets logged at all. These are deliberately
 * small.
 */
export function winStarters(input: { seasons?: string[]; today?: string }): Suggestion[] {
  const out: Suggestion[] = []
  const bySeason: Record<string, string> = {
    motherhood: 'I kept my patience when I nearly did not',
    entrepreneurship: 'I finished something instead of starting another thing',
    rebuilding: 'I did the small boring maintenance thing',
    deepening_faith: 'I showed up to it even though I did not feel it',
    healing: 'I rested without earning it first',
    finding_balance: 'I said no to something',
    growing: 'I did the thing I was avoiding',
    career_expansion: 'I asked for what I actually wanted',
    transition: 'I sat with not knowing',
    becoming_healthiest: 'I moved my body when I did not feel like it',
  }
  for (const s of seasonsForToday(input.seasons ?? [], input.today, 2)) {
    const line = bySeason[s]
    if (line) out.push({ text: line, because: `you said you are in ${seasonLabel(s)}` })
  }
  out.push({ text: 'I asked for help', because: null })
  out.push({ text: 'I did one hard thing before noon', because: null })
  out.push({ text: 'I let something be good enough', because: null })
  out.push({ text: 'Someone told me something kind and I believed it', because: null })
  return out.slice(0, 5)
}

/**
 * A running start on a question someone has already asked her.
 *
 * Different problem from the journal. There the page is blank and she has to
 * find a subject; here the prompt is sitting right above the box, so the
 * subject is settled and the obstacle is purely the first word. A course day
 * can hold several of these in a row, and the fourth blank box in one sitting
 * is where people close the app.
 *
 * So these are sentence openers, not ideas — deliberately empty of content.
 * They commit her to nothing except starting, which is the only thing that is
 * actually hard.
 *
 * An earlier version of this tried to derive a stem from the prompt itself —
 * turning "What are you avoiding?" into "What I am avoiding is…". Tested
 * against real course prompts it produced broken English far more often than
 * not: "What saying yes to that I mean no to is…". A suggestion in mangled
 * grammar costs more trust than a blank box does, so the clever half is gone
 * and only the openers that always read properly remain.
 */
export function promptOpeners(_prompt: string, today?: string): Suggestion[] {
  const out: Suggestion[] = []

  const universal = [
    'Honestly, …',
    'The first thing that comes up is…',
    'What is actually true is…',
    'I keep coming back to…',
    'The part I would rather not write is…',
  ]
  // Rotated by the day so a course day with four write blocks in it does not
  // show the same three openers four times.
  const day = today ? Number(today.replace(/-/g, '')) : 0
  const start = ((day % universal.length) + universal.length) % universal.length
  for (let i = 0; i < 3; i++) out.push({ text: universal[(start + i) % universal.length], because: null })

  return out
}
