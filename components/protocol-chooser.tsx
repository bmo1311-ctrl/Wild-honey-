import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { AREAS } from '@/lib/domains'

/**
 * What she sees before anything is set up.
 *
 * Opening straight into skincare assumed she came for skincare. She might have
 * come for her hair, or because her week has gone sideways and she wants a
 * reset. Asking first costs one tap and stops the page deciding for her.
 *
 * She only ever sees this once — after that the page opens where her things
 * already are.
 */
export function ProtocolChooser() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground text-pretty">
        what are you tending?
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {AREAS.map((area) => (
          <Link
            key={area.key}
            href={`/app/protocols?area=${area.key}`}
            className="group flex items-start justify-between gap-3 rounded-2xl bg-card p-5 ring-1 ring-border transition-colors hover:ring-mindset-pillar"
          >
            <span>
              <span className="block font-serif text-lg font-semibold">{area.label}</span>
              <span className="mt-1 block text-sm leading-relaxed text-muted-foreground text-pretty">
                {area.invite}
              </span>
            </span>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </div>
  )
}
