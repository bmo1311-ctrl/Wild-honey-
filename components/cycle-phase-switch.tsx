'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { setCyclePhaseToday } from '@/app/actions'
import { CYCLE_PHASES, phaseLabel, type CyclePhaseKey, type PhaseSource } from '@/lib/cycle'
import { cn } from '@/lib/utils'

/**
 * Change your phase from where the phase is being used.
 *
 * The only way to correct this was a row of chips buried in a check-in form
 * on another page, which is why the day her period arrived she went looking
 * and found the cycle settings instead — a different control, on a third
 * page, that the nutrition targets then overruled.
 *
 * So it lives on the banner that quotes the phase at her. Tapping a phase
 * writes today's check-in; "my period started today" writes the date, which
 * is the stronger statement and the one that fixes the next four days too.
 */
export function CyclePhaseSwitch({
  phase,
  source,
  because,
}: {
  phase: CyclePhaseKey | null
  source: PhaseSource
  because: string | null
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function choose(next: CyclePhaseKey, periodStarted: boolean) {
    startTransition(async () => {
      const res = await setCyclePhaseToday(next, periodStarted)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setOpen(false)
      toast.success(periodStarted ? 'Noted — day one.' : `${phaseLabel(next)} it is.`)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-faith-pillar" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold">{phaseLabel(phase)} phase</span>
          {because && <span className="block text-[12px] text-muted-foreground">{because}</span>}
        </span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="shrink-0 text-[13px] font-medium text-mindset-pillar underline underline-offset-[3px]"
        >
          {open ? 'close' : 'change'}
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-2.5 rounded-2xl bg-secondary/50 p-3">
          {/*
            Day one first, and on its own. It is the thing she is most often
            opening this to say, and unlike a phase chip it is a date the app
            can count forward from — so it keeps being right tomorrow.
          */}
          <button
            type="button"
            disabled={pending}
            onClick={() => choose('menstrual', true)}
            className="btn-solid rounded-full px-4 py-2.5 text-sm font-medium"
          >
            my period started today
          </button>

          <p className="text-[12px] text-muted-foreground">or set the phase for today</p>
          <div className="flex flex-wrap gap-1.5">
            {CYCLE_PHASES.map((p) => {
              const active = p.key === phase
              return (
                <button
                  key={p.key}
                  type="button"
                  disabled={pending}
                  onClick={() => choose(p.key, false)}
                  className={cn(
                    'flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 transition-colors',
                    active
                      ? 'bg-foreground text-background ring-transparent'
                      : 'bg-card ring-border',
                  )}
                >
                  {active && <Check className="h-3 w-3" />}
                  {p.label}
                </button>
              )
            })}
          </div>

          {source === 'logged' && (
            <p className="text-[12px] text-muted-foreground text-pretty">
              A phase you set here holds until your next period start.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
