import Link from 'next/link'
import { Star } from 'lucide-react'
import { TodayChecklist, type TodoRow } from '@/components/today-checklist'
import type { LearningItem } from '@/lib/types'

/**
 * A nine-year-old's Today. Big, warm, short. Stars for things done — a
 * count she can watch grow, never a streak she can lose.
 */
export function KidToday({ name, items, mealsToday, starsThisWeek, programs = [], earned = 0 }: { name: string; items: LearningItem[]; mealsToday: number; starsThisWeek: number; programs?: { slug: string; title: string }[]; earned?: number }) {
  const rows: TodoRow[] = items.map((i) => ({ key: i.id, kind: 'link', href: '/app/learning', label: i.title, hint: i.subject, done: Boolean(i.doneToday) }))
  rows.push({ key: 'food', kind: 'link', href: '/app/kid-food', label: 'Tell me what you ate', hint: mealsToday ? `${mealsToday} logged — nice` : 'breakfast, lunch, snacks, dinner', done: mealsToday > 0 })
  const done = rows.filter((r) => r.done).length

  return (
    <div className="flex flex-col gap-6">
      <header className="honey-glow -mx-5 -mt-6 px-5 pb-5 pt-8">
        <h1 className="font-serif text-[32px] font-semibold leading-[1.1]">Hi {name}!</h1>
        <p className="mt-1.5 text-[17px] text-muted-foreground">{done === 0 ? "Let's see what today's got." : done === rows.length ? 'You did everything today. Go you.' : `${done} down, ${rows.length - done} to go.`}</p>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-3 rounded-2xl bg-primary/20 px-4 py-4">
          <Star className="h-7 w-7 fill-current text-primary" />
          <div>
            <p className="font-serif text-[24px] font-semibold leading-none">{starsThisWeek}</p>
            <p className="text-[12px] text-muted-foreground">stars this week</p>
          </div>
        </div>
        <Link href="/app/kid-money" className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4">
          <span className="font-serif text-[24px] font-semibold leading-none">${earned.toFixed(earned % 1 ? 2 : 0)}</span>
          <span className="text-[12px] text-muted-foreground">earned &amp; waiting</span>
        </Link>
      </div>

      <TodayChecklist rows={rows} />

      {programs.map((p) => (
        <Link key={p.slug} href={`/app/program/${p.slug}`} className="flex h-[60px] items-center justify-center rounded-2xl bg-primary text-[19px] font-bold text-primary-foreground">{p.title}</Link>
      ))}
      <Link href="/app/learning" className={programs.length ? 'text-center text-[15px] font-semibold text-muted-foreground underline underline-offset-[3px]' : 'flex h-[60px] items-center justify-center rounded-2xl bg-primary text-[19px] font-bold text-primary-foreground'}>Open my learning</Link>
    </div>
  )
}
