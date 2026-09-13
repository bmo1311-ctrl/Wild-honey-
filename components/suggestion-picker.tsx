'use client'

import { Sparkles } from 'lucide-react'
import type { Suggestion } from '@/lib/suggestions'
import { groundedCount } from '@/lib/suggestions'

/**
 * A few real options, above the empty box.
 *
 * Tapping one *fills the field*. It never submits, and it never closes the
 * form — the point is to give her something to react to and then change, not
 * to make the decision for her. Every one of these is still a draft until
 * she presses the button herself.
 *
 * The heading is honest about where they came from. When none of them are
 * built on her own data it says "somewhere to start" rather than implying a
 * personalisation that has not happened yet; a generic suggestion dressed up
 * as insight is how an app loses her trust in one screen.
 */
export function SuggestionPicker({
  suggestions,
  onPick,
  label = 'or start from one of these',
}: {
  suggestions: Suggestion[]
  onPick: (s: Suggestion) => void
  label?: string
}) {
  if (suggestions.length === 0) return null
  const grounded = groundedCount(suggestions)

  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-honey" />
        {grounded > 0 ? 'from your last week' : label}
      </p>
      <div className="flex flex-col gap-1.5">
        {suggestions.map((s) => (
          <button
            key={s.text}
            type="button"
            onClick={() => onPick(s)}
            className="rounded-xl bg-card px-3 py-2.5 text-left ring-1 ring-border transition-colors hover:ring-foreground/30"
          >
            <span className="block text-[13.5px] font-medium leading-snug text-pretty">{s.text}</span>
            {/*
              Only ever shown when it is true. A suggestion that is merely
              sensible gets no invented justification — see lib/suggestions.ts.
            */}
            {s.because && (
              <span className="mt-0.5 block text-[11.5px] leading-[1.4] text-pretty text-muted-foreground">
                {s.because}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
