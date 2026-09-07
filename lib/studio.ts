/**
 * The output engine.
 *
 * Notion is the wrong shape for this problem, and it is worth being clear
 * why. A flexible canvas asks you to decide what to do, every single time.
 * Brooke's problem is not that she has nowhere to write the plan — it is
 * that a block of time arrives and nothing decides for her. Give someone in
 * that position an infinitely customisable workspace and they will spend the
 * hour building the workspace.
 *
 * So this is built like the wash-day engine instead. It does not ask what
 * she feels like doing. When the block arrives it names one thing, says why
 * that one, and takes a single tap.
 *
 * Customisation lives in the setup — her blocks, her channels, her pipeline.
 * It never appears on the day.
 */

export type Channel = 'tiktok' | 'youtube' | 'newsletter' | 'other'

/**
 * The stages a piece moves through, per channel.
 *
 * Ordered, and the order is the whole logic: the engine always advances the
 * piece that is furthest along, because a nearly-finished video is worth more
 * than a new idea and finishing is the thing she is short of.
 */
export const PIPELINE: Record<Channel, string[]> = {
  tiktok: ['idea', 'filmed', 'posted'],
  youtube: ['idea', 'scripted', 'filmed', 'edited', 'posted'],
  newsletter: ['idea', 'drafted', 'sent'],
  other: ['idea', 'doing', 'done'],
}

/** What the work of moving from one stage to the next actually is. */
const VERB: Record<string, string> = {
  idea: 'film it',
  scripted: 'film it',
  filmed: 'edit it',
  edited: 'post it',
  drafted: 'send it',
  doing: 'finish it',
}

const NEXT_VERB: Record<string, string> = {
  idea: 'write the script',
}

export interface StudioBlock {
  id: string
  label: string
  channel: Channel
  /** 0 = Sunday … 6 = Saturday */
  weekday: number
  startMinute: number
  minutes: number
}

export interface StudioItem {
  id: string
  title: string
  channel: Channel
  stage: string
  notes?: string | null
  updatedAt: string
}

export interface BlockPlan {
  block: StudioBlock
  /** Null when there is genuinely nothing in the pipeline for this channel. */
  item: StudioItem | null
  /** The stage this block would move it to. */
  nextStage: string | null
  /** What she is being asked to do, in two or three words. */
  action: string
  /** One line on why this one. */
  why: string
}

function stagesFor(channel: Channel): string[] {
  return PIPELINE[channel] ?? PIPELINE.other
}

/** The stage after this one, or null when it is already finished. */
export function nextStage(channel: Channel, stage: string): string | null {
  const stages = stagesFor(channel)
  const i = stages.indexOf(stage)
  if (i === -1 || i >= stages.length - 1) return null
  return stages[i + 1]
}

export function isFinished(channel: Channel, stage: string): boolean {
  const stages = stagesFor(channel)
  return stage === stages[stages.length - 1]
}

/**
 * What this block is for.
 *
 * Picks the piece closest to being finished. A half-edited video beats a
 * fresh idea every time — the pile of unfinished things is what makes
 * showing up feel pointless, and clearing it is what makes it feel possible.
 */
export function planBlock(block: StudioBlock, items: StudioItem[]): BlockPlan {
  const stages = stagesFor(block.channel)

  const live = items
    .filter((i) => i.channel === block.channel && !isFinished(block.channel, i.stage))
    .sort((a, b) => {
      const byStage = stages.indexOf(b.stage) - stages.indexOf(a.stage)
      if (byStage !== 0) return byStage
      // Same stage: whatever has waited longest.
      return a.updatedAt.localeCompare(b.updatedAt)
    })

  const item = live[0] ?? null
  if (!item) {
    return {
      block,
      item: null,
      nextStage: null,
      action: 'catch an idea',
      why: 'nothing waiting. one idea written down now is one less blank block later.',
    }
  }

  const next = nextStage(block.channel, item.stage)
  const action = VERB[item.stage] ?? NEXT_VERB[item.stage] ?? 'move it on'
  const nearlyThere = next !== null && stages.indexOf(next) === stages.length - 1

  return {
    block,
    item,
    nextStage: next,
    action,
    why: nearlyThere
      ? 'this one is one step from live.'
      : live.length > 1
        ? `furthest along of ${live.length} waiting.`
        : 'the only thing in the pipeline.',
  }
}

export interface WeekBlock {
  block: StudioBlock
  /** Minutes from midnight on Sunday, for ordering the week. */
  at: number
  isToday: boolean
  isPast: boolean
  /** True when a session was logged against this block this week. */
  done: boolean
}

/**
 * Her week, in the order it happens.
 *
 * Starting from today rather than Sunday, because the useful question is
 * "what is next", not "what did Monday look like".
 */
export function weekAhead(blocks: StudioBlock[], todayWeekday: number, doneBlockIds: Set<string>): WeekBlock[] {
  return blocks
    .map((block) => {
      const offset = (block.weekday - todayWeekday + 7) % 7
      return {
        block,
        at: offset * 1440 + block.startMinute,
        isToday: offset === 0,
        isPast: false,
        done: doneBlockIds.has(block.id),
      }
    })
    .sort((a, b) => a.at - b.at)
}

/** 540 → "9:00 am" */
export function timeLabel(startMinute: number): string {
  const h = Math.floor(startMinute / 60)
  const m = startMinute % 60
  const suffix = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${suffix}`
}

export const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/**
 * One line about the week so far.
 *
 * Same rule as everywhere else in this app: it counts what she did, never
 * what she missed. A week with two blocks kept is a good week, and a week
 * with none gets silence rather than a scolding — she already knows.
 */
export function weekNotice(kept: number, total: number): string | null {
  if (kept === 0) return null
  if (kept === total) return `every block this week. that is the whole thing.`
  if (kept === 1) return `one block kept this week.`
  return `${kept} blocks kept this week.`
}
