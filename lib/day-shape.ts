/**
 * The shape of a day: what she does, what she reads, and what she must see.
 *
 * A day arrives as a flat list of blocks, all weighted the same. On screen
 * that means a woman with fifteen minutes meets the same wall as a woman with
 * forty, and a day that opens with six paragraphs makes her read an essay
 * before she is allowed to touch anything.
 *
 * Sorting the blocks by what they are for lets the page lead with the doing
 * and keep the teaching within reach — without deleting a word of it.
 */

import type { Block } from '@/lib/courses'

export type BlockRole =
  /** Something she does: writing, checking, rating, logging, moving. */
  | 'doing'
  /** Something she reads. Valuable, but not the thing that gets done. */
  | 'teaching'
  /** A caution. Never hidden, never collapsed, never behind a tap. */
  | 'safety'

/**
 * How long an opening run of teaching may get before it is worth folding.
 *
 * Around 180 words is where an opening stops reading as a way in and starts
 * reading as a chapter. Still Waters opens at 467 and The Honest Room at 439;
 * most days sit near 60.
 */
const LEAD_FOLD_WORDS = 180

export function roleOfBlock(b: Block): BlockRole {
  // A warning is never optional, whatever else is happening on the page.
  if (b.t === 'note' && b.tone === 'warn') return 'safety'

  switch (b.t) {
    case 'write':
    case 'check':
    case 'rate':
    case 'log':
    case 'steps':
    case 'figure':
      return 'doing'
    default:
      return 'teaching'
  }
}

export function wordsOf(b: Block): number {
  let n = 0
  const walk = (v: unknown) => {
    if (typeof v === 'string') n += v.trim().split(/\s+/).filter(Boolean).length
    else if (Array.isArray(v)) v.forEach(walk)
    else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => k !== 't' && walk(x))
  }
  Object.entries(b).forEach(([k, v]) => k !== 't' && walk(v))
  return n
}

export interface DayShape {
  /** Every block, by index. */
  all: number[]
  /**
   * The opening teaching run, minus the first block, when that run is long
   * enough to be a wall. Empty when the day opens sensibly.
   */
  fold: number[]
  /** Words inside `fold`, for the disclosure's own label. */
  foldWords: number
  /** The short path: everything she does, plus a way in and any cautions. */
  core: number[]
  /** Roughly how long the short path takes. */
  coreMinutes: number
  /** True when the short path genuinely saves her something. */
  hasShortPath: boolean
}

/**
 * Work out a day's shape.
 *
 * Two independent decisions. Whether the opening is a wall — a long run of
 * teaching before the first thing she can act on. And what the short path is
 * — the doing, one block of context, and every caution.
 */
export function shapeDay(blocks: Block[], minutes: number): DayShape {
  const all = blocks.map((_, i) => i)

  // The run of teaching the day opens with, before anything can be done.
  const opening: number[] = []
  for (const i of all) {
    if (roleOfBlock(blocks[i]) !== 'teaching') break
    opening.push(i)
  }
  const openingWords = opening.reduce((n, i) => n + wordsOf(blocks[i]), 0)

  // Keep the first block as the way in; fold the rest of a long opening.
  const fold = openingWords > LEAD_FOLD_WORDS ? opening.slice(1) : []
  const foldWords = fold.reduce((n, i) => n + wordsOf(blocks[i]), 0)

  const folded = new Set(fold)
  const core = all.filter((i) => {
    const role = roleOfBlock(blocks[i])
    if (role === 'doing' || role === 'safety') return true
    // One block of context: the first teaching block, if it opens the day.
    return i === opening[0] && !folded.has(i)
  })

  const coreMinutes = Math.max(5, Math.round((minutes * (core.length / Math.max(1, all.length))) / 5) * 5)

  return {
    all,
    fold,
    foldWords,
    core,
    coreMinutes,
    // Only worth offering when it actually removes something substantial.
    hasShortPath: all.length - core.length >= 2 && coreMinutes < minutes,
  }
}
