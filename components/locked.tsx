import Link from 'next/link'
import { Lock } from 'lucide-react'
import { TIER_NAME, type Requirement } from '@/lib/access'
import { cn } from '@/lib/utils'

/** A closed door with the reason on it and one way through. */
export function Locked({
  title,
  blurb,
  from,
  tier = 'circle',
  compact = false,
}: {
  title?: string
  blurb: string
  from: string
  tier?: Requirement
  compact?: boolean
}) {
  return (
    <div className={cn('rounded-2xl border border-dashed border-border bg-card text-center', compact ? 'p-4' : 'p-6')}>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        <Lock className="h-3 w-3" /> part of {TIER_NAME[tier]}
      </span>
      {title && <h2 className="mt-3 font-serif text-xl font-semibold">{title}</h2>}
      <p className="mx-auto mt-1.5 max-w-xs text-[15px] leading-[1.5] text-muted-foreground text-pretty">{blurb}</p>
      <Link
        href={`/app/membership?from=${from}`}
        className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-6 text-[15px] font-bold text-primary-foreground"
      >
        Join {TIER_NAME[tier]}
      </Link>
    </div>
  )
}

/** A whole area behind the door: the page header she expected, then the door. */
export function LockedArea({
  title,
  subtitle,
  blurb,
  from,
  tier = 'circle',
}: {
  title: string
  subtitle: string
  blurb: string
  from: string
  tier?: Requirement
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-serif text-[29px] font-semibold leading-[1.1]">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">{subtitle}</p>
      </div>
      <Locked blurb={blurb} from={from} tier={tier} />
    </div>
  )
}
