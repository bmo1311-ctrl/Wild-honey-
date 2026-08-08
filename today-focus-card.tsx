import { Sparkles, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { TodayFocus } from '@/lib/types'
import { getProtocol } from '@/lib/protocols'

export function TodayFocusCard({ focus }: { focus: TodayFocus }) {
  const protocol = focus.suggestedProtocolSlug ? getProtocol(focus.suggestedProtocolSlug) : null

  return (
    <section className="rounded-2xl bg-foreground p-6 text-background">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-background/70">
        <Sparkles className="h-3.5 w-3.5" />
        today's focus
      </div>
      <h2 className="mt-2 font-serif text-xl font-semibold leading-snug text-balance">{focus.headline}</h2>

      <div className="mt-4 rounded-xl bg-background/10 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-background/60">if you only do one thing today</p>
        <p className="mt-1 text-sm leading-relaxed text-pretty">{focus.oneThing}</p>
      </div>

      {focus.suggestions.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {focus.suggestions.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-background/90">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-background/60" />
              <span className="text-pretty">{s}</span>
            </li>
          ))}
        </ul>
      )}

      {protocol && (
        <Link href="/app/protocols" className="mt-4 flex items-center justify-between rounded-xl bg-honey/15 p-3 text-sm font-medium text-honey">
          <span>a {protocol.lengthDays}-day {protocol.title} protocol matches this</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0" />
        </Link>
      )}

      <div className="mt-4 flex items-center gap-1.5 text-xs text-background/60">
        <Clock className="h-3 w-3" />
        about {focus.estimatedMinutes} minutes
      </div>
    </section>
  )
}
