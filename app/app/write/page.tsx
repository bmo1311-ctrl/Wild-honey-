import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getWritings } from '@/lib/data'
import { cn } from '@/lib/utils'

/** Everything she has written, newest first. Nothing here is destructive. */
export default async function WritePage() {
  const writings = (await getWritings()).filter((w) => w.kind === 'write' && w.body.trim())

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-serif text-[29px] font-semibold leading-[1.1]">Write</h1>
        <p className="mt-1.5 text-[15px] leading-[1.5] text-pretty text-muted-foreground">
          everything you&rsquo;ve written, newest first.
        </p>
      </header>

      {writings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-[15px] text-muted-foreground text-pretty">
            Nothing written yet. The course adds a prompt on the days that call for one — you fill this in as you go.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {writings.map((w) => (
            <Link
              key={w.id}
              href={`/app/program/day/${w.day_number}`}
              className={cn('flex items-center gap-3 rounded-2xl border border-border bg-card p-4')}
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-mindset-pillar">Day {w.day_number}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(w.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </span>
                <span className="mt-1 block font-serif text-[14.5px] font-medium leading-snug text-pretty">{w.prompt}</span>
                <span className="mt-1 block truncate text-sm text-muted-foreground">{w.body.trim().split('\n')[0]}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
