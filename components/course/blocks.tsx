import Image from 'next/image'
import type { Block, CourseWriting } from '@/lib/courses'
import type { Checkin } from '@/lib/types'
import { cn } from '@/lib/utils'
import { WriteBlock } from '@/components/course/write-block'
import { RateBlock } from '@/components/course/rate-block'
import { CheckBlock } from '@/components/course/check-block'
import { LogBlock, type TrackedToday } from '@/components/course/log-block'

export interface BlocksContext {
  /** null on week pages, where there is no day to save against. */
  dayNumber: number | null
  slug: string
  /** Saved answers for this day, keyed by prompt_index. */
  saved?: Map<number, CourseWriting>
  checkin?: Checkin | null
  /** Today's food log totals, so the day never asks for what is already logged. */
  tracked?: TrackedToday | null
  /**
   * Added to a block's position to get its prompt_index. Milestone days are
   * split for rendering, so part 2's blocks must keep the indices they have
   * in the day's full blocks array.
   */
  offset?: number
}

/** Renders a day's or week's blocks. Every block type in the course is handled. */
export function Blocks({ blocks, ctx }: { blocks: Block[]; ctx: BlocksContext }) {
  return (
    <div className="flex flex-col gap-[15px]">
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} index={(ctx.offset ?? 0) + i} ctx={ctx} />
      ))}
    </div>
  )
}

function BlockView({ block, index, ctx }: { block: Block; index: number; ctx: BlocksContext }) {
  const saved = ctx.saved?.get(index)

  switch (block.t) {
    case 'text':
      return <p className="shrink-0 text-[16.5px] leading-[1.5] text-pretty">{block.v}</p>

    case 'h':
      return <p className="shrink-0 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{block.v}</p>

    case 'quote':
      return (
        <figure className="shrink-0 py-4">
          <blockquote className="font-serif text-[22px] leading-[1.32] text-balance">&ldquo;{block.v}&rdquo;</blockquote>
          {block.by && <figcaption className="mt-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{block.by}</figcaption>}
        </figure>
      )

    case 'steps':
      return (
        <div className="shrink-0">
          {block.title && <p className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">{block.title}</p>}
          <ol className="flex flex-col gap-2">
            {block.items.map((it) => (
              <li key={it.n} className="flex gap-3 rounded-xl border border-border bg-card p-3">
                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md bg-mindset-pillar text-[12px] font-bold text-white">
                  {it.n}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-pretty">{it.head}</p>
                  {it.sub && <p className="mt-0.5 text-[12.5px] leading-[1.42] text-pretty text-muted-foreground">{it.sub}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )

    // The illustrations do the teaching — full card width, never a thumbnail.
    case 'figure':
      return (
        <figure className="shrink-0 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="relative h-[150px] w-full">
            <Image src={`/shapes/${block.pose}.png`} alt={block.label} fill sizes="(max-width: 640px) 100vw, 520px" className="object-contain p-3" />
          </div>
          <figcaption className="border-t border-border p-3">
            <p className="text-[17px] font-semibold">{block.label}</p>
            {block.cue && <p className="mt-1 text-sm leading-[1.45] text-pretty text-muted-foreground">{block.cue}</p>}
          </figcaption>
        </figure>
      )

    case 'grid':
      return (
        <div className="shrink-0">
          {block.title && <p className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">{block.title}</p>}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-muted">
                  {block.cols.map((c) => (
                    <th key={c} className="px-3 py-2 text-left font-semibold">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, r) => (
                  <tr key={r} className="border-t border-border">
                    {row.map((cell, c) => (
                      <td key={c} className="px-3 py-2 align-top text-pretty">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )

    case 'versus':
      return (
        <div className="shrink-0">
          {block.title && <p className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">{block.title}</p>}
          <div className="grid gap-2 min-[360px]:grid-cols-2">
            {[block.left, block.right].map((side, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-border">
                <p className="bg-muted px-3 py-2 text-[13px] font-semibold">{side.head}</p>
                <ul className="flex flex-col gap-1.5 p-3">
                  {side.items.map((it, j) => (
                    <li key={j} className="text-[13px] leading-[1.4] text-pretty text-muted-foreground">{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )

    case 'scripture':
      return (
        <div className="shrink-0 rounded-2xl border border-border bg-card p-4">
          <p className="text-[11px] uppercase tracking-[0.14em] text-mindset-pillar">{block.ref}</p>
          <p className="mt-2 font-serif text-[20px] leading-snug text-pretty">{block.text}</p>
          {block.why && <p className="mt-2 text-sm leading-[1.45] text-pretty text-muted-foreground">{block.why}</p>}
        </div>
      )

    case 'note':
      return (
        <div className={cn('shrink-0 rounded-xl p-3.5', block.tone === 'warn' ? 'border-l-[3px] border-l-primary bg-muted' : 'bg-muted')}>
          {block.title && <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">{block.title}</p>}
          <p className="mt-1 text-[14.5px] leading-[1.45] text-pretty">{block.v}</p>
        </div>
      )

    case 'write':
      return (
        <div className="shrink-0">
          <WriteBlock
            dayNumber={ctx.dayNumber}
            slug={ctx.slug}
            promptIndex={index}
            prompt={block.prompt}
            lines={block.lines}
            initialBody={saved?.body ?? ''}
          />
        </div>
      )

    case 'rate':
      return (
        <div className="shrink-0">
          <RateBlock
            dayNumber={ctx.dayNumber}
            slug={ctx.slug}
            promptIndex={index}
            q={block.q}
            left={block.left}
            right={block.right}
            initialValue={parseRate(saved?.body)}
          />
        </div>
      )

    case 'check':
      return (
        <div className="shrink-0">
          <CheckBlock
            dayNumber={ctx.dayNumber}
            slug={ctx.slug}
            promptIndex={index}
            title={block.title}
            items={block.items}
            demo={block.demo}
            initialChecked={parseChecked(saved?.body)}
          />
        </div>
      )

    case 'log':
      return (
        <div className="shrink-0">
          <LogBlock existing={ctx.checkin ?? null} tracked={ctx.tracked ?? null} />
        </div>
      )

    default: {
      // Compile-time proof that every block type in the course is rendered.
      // If a new type is added to Block, this line stops the build.
      const unhandled: never = block
      return unhandled
    }
  }
}

function parseRate(body?: string): number | null {
  if (!body) return null
  const n = Number(body)
  return Number.isInteger(n) && n >= 1 && n <= 10 ? n : null
}

function parseChecked(body?: string): number[] {
  if (!body) return []
  try {
    const v = JSON.parse(body)
    return Array.isArray(v) ? v.filter((x): x is number => Number.isInteger(x)) : []
  } catch {
    return []
  }
}
