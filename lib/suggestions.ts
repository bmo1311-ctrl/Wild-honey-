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
