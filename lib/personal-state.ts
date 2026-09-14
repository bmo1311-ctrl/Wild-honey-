/**
 * What the app actually knows about her, in one place.
 *
 * Every engine in here already reasons well about its own corner — tonight's
 * serum, this wash, the next Studio block, what belongs to this hour. None of
 * them can see each other, so none of them knows she has not slept, or that
 * she is carrying four seasons at once, or that the reason nothing is getting
 * done is not motivation.
 *
 * This is the layer underneath. It derives rather than asks: every number
 * here comes from something she already did, and where there is not enough to
 * go on it says so instead of guessing.
 *
 * Capacity is the idea that earns this file. Most wellness software assumes
 * the problem is wanting it enough and responds by adding — another habit,
 * another protocol, another course. The far more common truth is that her
 * life has no room in it, and the honest response to that is subtraction.
 * Telling those two situations apart is the whole point.
 *
 * Nothing here is a verdict. `Reading` carries its own confidence and the
 * evidence it was built from, so every surface above can show its working and
 * every claim can be argued with.
 */

export type Confidence = 'none' | 'low' | 'fair' | 'good'

export interface Reading<T> {
  value: T
  confidence: Confidence
  /** The observable facts behind it, in her own terms. */
  because: string[]
}

export type CapacityLevel = 'stretched' | 'available' | 'abundant'

export interface Load {
  /** Life seasons she has named. Four at once is not a hobby. */
  seasons: number
  /** Promises she has made and not released. */
  commitments: number
  /** Experiments running right now. */
  experiments: number
  /** Programmes she is carrying. */
  courses: number
  /** Habits she is trying to keep. */
  habits: number
  /** Recurring work blocks in a week. */
  studioBlocks: number
}

export interface PersonalState {
  /** How much she can currently hold. The one that changes what to recommend. */
  capacity: Reading<CapacityLevel>
  /** How alive she feels, 0–100. Null when she has not said. */
  vitality: Reading<number | null>
  /** How much she is noticing about herself — writing, reflecting, checking in. */
  awareness: Reading<number | null>
  /** Whether what she does matches what she said matters. */
  alignment: Reading<number | null>
  /** What she is carrying. Counts, not judgements. */
  load: Load
  /** Total weight of `load`, for ranking. */
  loadScore: number
  /** How much evidence there is overall. Gates everything downstream. */
  evidence: Confidence
  asOf: string
}

export interface StateInput {
  today: string
  /** Newest last. energy, sleep_quality and stress all run 1–10. */
  checkins: { date: string; energy?: number | null; sleep_quality?: number | null; stress?: number | null }[]
  seasons: string[]
  commitments: { status?: string | null }[]
  experiments: { status?: string | null }[]
  /** Slugs of courses she is actively carrying. */
  activeCourses: string[]
  habits: { id: string }[]
  habitLogs: { habit_id: string; date: string }[]
  studioBlocks: { id: string }[]
  /** Dates she wrote anything — journal or course writing. */
  writingDates: string[]
  /** Goals in her own words. Used for alignment. */
  goals: string[]
  /** Dates anything at all was logged, from lib/activity. */
  activeDays: string[]
}

/**
 * Four check-ins is the floor for saying anything about a pattern.
 *
 * Below it every reading returns `none` and the surfaces above stay quiet.
 * Three data points is a mood, and an app that announces a pattern on day two
 * has spent trust it will not get back.
 */
const MIN_FOR_PATTERN = 4
const MIN_FOR_GOOD = 10

function mean(xs: (number | null | undefined)[]): number | null {
  const live = xs.filter((x): x is number => typeof x === 'number' && Number.isFinite(x))
  return live.length ? live.reduce((a, b) => a + b, 0) / live.length : null
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(a) - Date.parse(b)) / 86_400_000)
}

function within(dates: string[], today: string, days: number): number {
  return dates.filter((d) => {
    const gap = daysBetween(today, d)
    return gap >= 0 && gap < days
  }).length
}

/**
 * How far back a check-in still counts as "now".
 *
 * Taking the last seven *rows* was the bug: someone who checks in twice a
 * month hands the engine five rows spanning six weeks, and the app then says
 * "your energy has been low this week" on the strength of a Tuesday in
 * August. Rows are not days. Fourteen is loose enough to survive a missed
 * week and tight enough that nothing here is quietly out of date.
 */
const RECENT_DAYS = 14

function recentCheckins<T extends { date: string }>(rows: T[], today: string): T[] {
  return rows.filter((r) => {
    const gap = daysBetween(today, r.date)
    return gap >= 0 && gap < RECENT_DAYS
  })
}

function confidenceFrom(n: number): Confidence {
  if (n === 0) return 'none'
  if (n < MIN_FOR_PATTERN) return 'low'
  if (n < MIN_FOR_GOOD) return 'fair'
  return 'good'
}

/**
 * What she is carrying, counted.
 *
 * Deliberately a count of live things rather than a score of how hard they
 * are. Four seasons and six commitments is a fact she can check; a weighted
 * difficulty index is a number she would have to take on faith.
 */
export function computeLoad(input: StateInput): Load {
  const live = (xs: { status?: string | null }[]) =>
    xs.filter((x) => !x.status || x.status === 'active' || x.status === 'running').length
  return {
    seasons: input.seasons.length,
    commitments: live(input.commitments),
    experiments: live(input.experiments),
    courses: input.activeCourses.length,
    habits: input.habits.length,
    studioBlocks: input.studioBlocks.length,
  }
}

/**
 * Weighted, because the things on that list do not cost the same.
 *
 * A season is a whole region of life and sits under everything else, so it
 * carries the most. A habit is a small recurring ask. A programme is real
 * daily work with an end date. These weights are a judgement, not a
 * measurement, and are kept here in one readable place rather than buried.
 */
export function loadScore(load: Load): number {
  return (
    load.seasons * 3 +
    load.courses * 3 +
    load.commitments * 2 +
    load.experiments * 2 +
    load.studioBlocks * 1.5 +
    load.habits * 1
  )
}

/**
 * How much she can hold right now.
 *
 * Two halves, and both are needed. How she has been — energy, sleep, stress
 * — and how much is already on her. A woman with good energy and almost
 * nothing on has room; the same woman carrying four seasons and six
 * commitments does not, however well she slept.
 *
 * This is the reading that should change what everything else recommends,
 * and specifically it is what licenses the app to suggest removing something
 * rather than adding one more.
 */
export function computeCapacity(input: StateInput, load: Load): Reading<CapacityLevel> {
  const because: string[] = []
  const recent = recentCheckins(input.checkins, input.today)
  const n = recent.length

  const energy = mean(recent.map((c) => c.energy))
  const sleep = mean(recent.map((c) => c.sleep_quality))
  const stress = mean(recent.map((c) => c.stress))

  const score = loadScore(load)

  // The load half is always available — it is counted, not reported.
  if (load.seasons >= 3) {
    because.push(`you are carrying ${load.seasons} seasons at once`)
  }
  if (load.commitments + load.experiments >= 4) {
    because.push(`${load.commitments + load.experiments} commitments and experiments running`)
  }
  if (load.courses >= 2) because.push(`${load.courses} programmes on the go`)

  /*
   * Anything named above is something she is visibly carrying. Counted here,
   * before the state half starts pushing, so the combining step can tell the
   * two kinds of evidence apart.
   */
  const namedLoad = because.length

  // The state half needs enough check-ins to mean anything.
  const haveState = n >= MIN_FOR_PATTERN
  if (haveState) {
    if (energy !== null && energy <= 4) because.push('your energy has been rating low this week')
    if (sleep !== null && sleep <= 4) because.push('your sleep has been rating low this week')
    if (stress !== null && stress >= 7) because.push('your stress has been rating high this week')
    if (energy !== null && energy >= 7 && (stress === null || stress <= 4)) {
      because.push('your energy has been good and your stress low')
    }
  }

  /*
   * Combining the halves.
   *
   * Low reported state pulls down hard, because how she actually feels
   * outranks any arithmetic about how much is on her list. Load alone can
   * still reach 'stretched' without a single check-in, which matters: a woman
   * who has never filled one in but has named four seasons and eight
   * commitments is visibly stretched and the app should be able to say so.
   */
  const heavy = score >= 18
  const veryHeavy = score >= 26
  /*
   * How many of the three are reading low, not merely whether any one is.
   *
   * One low reading is a rough patch. Two together — tired and not sleeping,
   * or tired and under strain — is the shape of depletion, and it does not
   * need a long to-do list to be real.
   */
  const lowSignals =
    (energy !== null && energy <= 4 ? 1 : 0) +
    (sleep !== null && sleep <= 4 ? 1 : 0) +
    (stress !== null && stress >= 7 ? 1 : 0)
  const lowState = haveState && lowSignals >= 1
  const depleted = haveState && lowSignals >= 2
  const goodState = haveState && energy !== null && energy >= 7 && (stress === null || stress <= 4)

  let value: CapacityLevel
  /*
   * Depletion counts on its own.
   *
   * The first version of this required `score >= 12` alongside a low week,
   * which meant a woman reporting flat energy, broken sleep and high strain
   * was told she had capacity available purely because she had not filled the
   * app with commitments. That is backwards. An empty plate is not the same
   * as room, and the emptiness is often the symptom. So two low readings
   * reach 'stretched' with no load at all; a single low reading still wants
   * some load behind it before the app says anything that strong.
   */
  if (veryHeavy || depleted || (heavy && lowState) || (lowState && score >= 12)) value = 'stretched'
  /*
   * And 'abundant' is never said over the top of something she is carrying.
   * "You have room right now" printed directly above "you are carrying four
   * seasons at once" is the app arguing with itself, and she would be right
   * to trust the second line. A good week on a full plate is 'available' —
   * which is true, and does not go on to suggest she add something.
   */
  else if (goodState && !heavy && namedLoad === 0) value = 'abundant'
  else value = 'available'

  return {
    value,
    confidence: haveState ? confidenceFrom(n) : score > 0 ? 'low' : 'none',
    because,
  }
}

/** How alive she feels. Straight from the check-in, never inferred. */
export function computeVitality(input: StateInput): Reading<number | null> {
  const recent = recentCheckins(input.checkins, input.today)
  const energy = mean(recent.map((c) => c.energy))
  const sleep = mean(recent.map((c) => c.sleep_quality))
  const stress = mean(recent.map((c) => c.stress))
  if (energy === null && sleep === null && stress === null) {
    return { value: null, confidence: 'none', because: [] }
  }
  // Stress is inverted: 10 stressed is 1 alive.
  const parts = [energy, sleep, stress === null ? null : 11 - stress].filter(
    (x): x is number => x !== null,
  )
  const avg = parts.reduce((a, b) => a + b, 0) / parts.length
  return {
    value: Math.round((avg / 10) * 100),
    confidence: confidenceFrom(recent.length),
    because: [`averaged from your last ${recent.length} check-${recent.length === 1 ? 'in' : 'ins'}`],
  }
}

/**
 * How much she is noticing about herself.
 *
 * Counted from acts of attention over a fortnight — checking in, writing,
 * reflecting. Deliberately not a streak: this is a proportion of days on
 * which she looked at herself at all, and missing a Tuesday does not reset it
 * to zero.
 */
export function computeAwareness(input: StateInput): Reading<number | null> {
  const checkinDays = within(input.checkins.map((c) => c.date), input.today, 14)
  const writeDays = within(input.writingDates, input.today, 14)
  const days = new Set([
    ...input.checkins.map((c) => c.date).filter((d) => daysBetween(input.today, d) < 14 && daysBetween(input.today, d) >= 0),
    ...input.writingDates.filter((d) => daysBetween(input.today, d) < 14 && daysBetween(input.today, d) >= 0),
  ]).size

  if (checkinDays + writeDays === 0) return { value: null, confidence: 'none', because: [] }
  return {
    value: Math.round((days / 14) * 100),
    confidence: confidenceFrom(days),
    because: [`you looked at how you were on ${days} of the last 14 days`],
  }
}

/**
 * Whether what she does matches what she said matters.
 *
 * The hardest of the four to do honestly, so it is kept crude: are the
 * promises she made being reviewed, are the experiments she started being
 * finished, is the programme she chose being opened. It does not attempt to
 * read her goals against her behaviour — that would be a guess dressed as a
 * measurement, and this file is supposed to be the opposite of that.
 */
export function computeAlignment(input: StateInput): Reading<number | null> {
  const signals: number[] = []
  const because: string[] = []

  const liveCommitments = input.commitments.filter((c) => !c.status || c.status === 'active').length
  if (input.commitments.length > 0) {
    const kept = liveCommitments / input.commitments.length
    signals.push(kept)
    because.push(`${liveCommitments} of ${input.commitments.length} commitments still standing`)
  }

  const running = input.experiments.filter((e) => !e.status || e.status === 'active').length
  const finished = input.experiments.filter((e) => e.status === 'completed').length
  if (input.experiments.length > 0) {
    signals.push(finished / input.experiments.length)
    because.push(`${finished} of ${input.experiments.length} experiments seen through`)
  }

  const active = within(input.activeDays, input.today, 14)
  if (active > 0) {
    signals.push(Math.min(1, active / 10))
    because.push(`active on ${active} of the last 14 days`)
  }

  if (signals.length === 0) return { value: null, confidence: 'none', because: [] }
  const avg = signals.reduce((a, b) => a + b, 0) / signals.length
  return {
    value: Math.round(avg * 100),
    confidence: signals.length >= 2 ? 'fair' : 'low',
    because,
  }
}

/** Everything, assembled. The one thing other surfaces should read. */
export function computeState(input: StateInput): PersonalState {
  const load = computeLoad(input)
  const capacity = computeCapacity(input, load)
  const vitality = computeVitality(input)
  const awareness = computeAwareness(input)
  const alignment = computeAlignment(input)

  const known = [vitality, awareness, alignment].filter((r) => r.confidence !== 'none').length
  const evidence: Confidence =
    input.checkins.length >= MIN_FOR_GOOD && known >= 2
      ? 'good'
      : input.checkins.length >= MIN_FOR_PATTERN
        ? 'fair'
        : input.checkins.length > 0 || loadScore(load) > 0
          ? 'low'
          : 'none'

  return {
    capacity,
    vitality,
    awareness,
    alignment,
    load,
    loadScore: loadScore(load),
    evidence,
    asOf: input.today,
  }
}

/**
 * The one sentence worth showing her.
 *
 * Returns null rather than filling space. An app that produces an insight
 * every single day teaches her that none of them mean anything.
 *
 * The capacity line is the one this file exists for: it is the difference
 * between "try harder" and "you are carrying too much", and only one of those
 * is true most of the time.
 */
export function headline(state: PersonalState): { text: string; because: string[] } | null {
  if (state.capacity.value === 'stretched' && state.capacity.because.length > 0) {
    return {
      text: 'This does not look like a motivation problem. It looks like a capacity problem.',
      because: state.capacity.because,
    }
  }
  if (state.capacity.value === 'abundant' && state.capacity.confidence !== 'none') {
    return {
      text: 'You have room right now. This is the week to start the thing you keep deferring.',
      because: state.capacity.because,
    }
  }
  return null
}
