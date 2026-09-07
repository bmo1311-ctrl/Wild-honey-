import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { Blocks, type BlocksContext } from '@/components/course/blocks'
import { shapeDay } from '@/lib/day-shape'
import type { Block } from '@/lib/courses'

/**
 * A day's blocks, arranged so the doing comes first.
 *
 * Two things happen here, both reversible by the member and neither of which
 * deletes anything.
 *
 * A day that opens with a long stretch of teaching gets that stretch folded
 * behind a line she can tap. The first paragraph stays — it is the way in —
 * and the rest waits. She came to do the day, not to read an essay before
 * being allowed to start.
 *
 * And where a day has meaningfully more reading than doing, it opens on the
 * short path: everything she does, one block of context, every caution. The
 * full day is one tap away and the link says how long it is.
 */
export function DayBody({
  blocks,
  minutes,
  full,
  fullHref,
  ctx,
}: {
  blocks: Block[]
  minutes: number
  /** True when she asked for the whole day. */
  full: boolean
  /** Where "show me everything" goes. */
  fullHref: string
  ctx: Omit<BlocksContext, 'indices'>
}) {
  const shape = shapeDay(blocks, minutes)
  const showAll = full || !shape.hasShortPath

  /**
   * Positions are relative to the slice we were handed, but saved writing is
   * keyed against the day's full block list. Milestone days are split in two,
   * so part 2 arrives with an offset — without adding it back, every answer
   * on part 2 would save against a prompt from part 1.
   */
  const at = (idx: number[]) => idx.map((i) => i + (ctx.offset ?? 0))

  if (!showAll) {
    return (
      <div className="flex flex-col gap-5">
        <Blocks blocks={shape.core.map((i) => blocks[i])} ctx={{ ...ctx, indices: at(shape.core) }} />
        <Link
          href={fullHref}
          className="flex items-center justify-center gap-1.5 rounded-2xl border border-border py-3 text-sm text-muted-foreground"
        >
          the whole day · {minutes} min
          <ChevronDown className="h-3.5 w-3.5" />
        </Link>
      </div>
    )
  }

  // Showing everything. A long opening still folds, but stays on the page.
  const folded = new Set(shape.fold)
  const before = shape.all.filter((i) => i < (shape.fold[0] ?? Infinity) && !folded.has(i))
  const after = shape.all.filter((i) => i > (shape.fold[shape.fold.length - 1] ?? -1) && !folded.has(i))

  if (shape.fold.length === 0) {
    return <Blocks blocks={blocks} ctx={ctx} />
  }

  return (
    <div className="flex flex-col gap-[15px]">
      <Blocks blocks={before.map((i) => blocks[i])} ctx={{ ...ctx, indices: at(before) }} />

      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm text-muted-foreground [&::-webkit-details-marker]:hidden">
          the rest of the story · {shape.foldWords} words
          <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-[15px]">
          <Blocks blocks={shape.fold.map((i) => blocks[i])} ctx={{ ...ctx, indices: at(shape.fold) }} />
        </div>
      </details>

      <Blocks blocks={after.map((i) => blocks[i])} ctx={{ ...ctx, indices: at(after) }} />
    </div>
  )
}
