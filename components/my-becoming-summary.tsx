import Link from 'next/link'
import { Heart, Beaker, ArrowRight } from 'lucide-react'
import type { Commitment, PersonalExperiment } from '@/lib/types'

const HELPED_LABEL: Record<string, string> = {
  yes: 'helped',
  somewhat: 'helped somewhat',
  no: "didn't help",
}

export function MyBecomingSummary({ commitments, experiments }: { commitments: Commitment[]; experiments: PersonalExperiment[] }) {
  const active = commitments.filter((c) => c.status === 'active')
  const completedExperiments = experiments.filter((e) => e.status === 'completed')
  const activeExperiments = experiments.filter((e) => e.status === 'active')

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2 rounded-2xl bg-card p-5 ring-1 ring-border">
        <p className="flex items-center gap-1.5 font-serif text-lg font-semibold">
          <Heart className="h-4 w-4 text-honey" />
          my commitments
        </p>
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">nothing set right now.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {active.slice(0, 4).map((c) => (
              <li key={c.id} className="text-sm text-pretty">
                {c.text}
              </li>
            ))}
          </ul>
        )}
        <Link href="/app/calendar" className="mt-1 flex items-center gap-1 text-xs font-medium text-honey">
          manage on Calendar <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl bg-card p-5 ring-1 ring-border">
        <p className="flex items-center gap-1.5 font-serif text-lg font-semibold">
          <Beaker className="h-4 w-4 text-honey" />
          my experiments
        </p>
        {activeExperiments.length === 0 && completedExperiments.length === 0 ? (
          <p className="text-sm text-muted-foreground">nothing tried yet.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {activeExperiments.slice(0, 2).map((e) => (
              <li key={e.id} className="text-sm">
                <span className="text-pretty">{e.title}</span> <span className="text-xs text-muted-foreground">— in progress</span>
              </li>
            ))}
            {completedExperiments.slice(0, 3).map((e) => (
              <li key={e.id} className="text-sm">
                <span className="text-pretty">{e.title}</span>{' '}
                <span className="text-xs text-honey">— {HELPED_LABEL[e.helped ?? '']}</span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/app/calendar" className="mt-1 flex items-center gap-1 text-xs font-medium text-honey">
          manage on Calendar <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}
