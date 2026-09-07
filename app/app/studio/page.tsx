import { StudioBoard } from '@/components/studio-board'
import { StudioBlockSetup } from '@/components/studio-block-setup'
import { getStudioBlocks, getStudioItems, getStudioSessionsThisWeek } from '@/lib/data'
import { localToday } from '@/lib/today'
import type { Channel, StudioBlock, StudioItem } from '@/lib/studio'

/**
 * Studio — the work that pays.
 *
 * Built for the problem as stated: there are open blocks in the week that
 * never get filled, because nothing decides what goes in them. So the page
 * opens on the next block with one piece named and one button, rather than a
 * board to arrange.
 *
 * Everything customisable — her blocks, her channels, her pipeline — lives in
 * setup, below the work. It is never in the way on the day.
 */
export default async function StudioPage() {
  const [blocks, items, sessions, today] = await Promise.all([
    getStudioBlocks(),
    getStudioItems(),
    getStudioSessionsThisWeek(),
    localToday(),
  ])

  const todayWeekday = new Date(`${today}T12:00:00`).getDay()
  const keptBlockIds = [...new Set(sessions.map((s) => s.blockId).filter(Boolean) as string[])]

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-serif text-[29px] font-semibold leading-[1.1]">Studio</h1>
        <p className="mt-1.5 text-[15px] leading-[1.5] text-pretty text-muted-foreground">
          the blocks you kept, and what goes in the next one.
        </p>
      </header>

      {blocks.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-6 text-center">
          <p className="font-serif text-lg font-semibold">start with the time, not the ideas</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">
            Name the blocks you already have. Two a week is plenty — the point is that when one
            arrives, something is already decided.
          </p>
        </div>
      ) : (
        <StudioBoard
          blocks={blocks as StudioBlock[]}
          items={items as StudioItem[]}
          todayWeekday={todayWeekday}
          keptBlockIds={keptBlockIds}
        />
      )}

      <StudioBlockSetup blocks={blocks as { id: string; label: string; channel: Channel; weekday: number; startMinute: number; minutes: number }[]} />
    </div>
  )
}
