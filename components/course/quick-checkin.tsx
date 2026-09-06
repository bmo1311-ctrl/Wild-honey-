'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { saveCheckin } from '@/app/actions'
import { ScaleRow } from '@/components/wellness-checkin-form'
import type { Checkin } from '@/lib/types'

/**
 * The three things nothing else in the app tracks — energy, sleep, stress —
 * plus minutes moved. Saves to the same row as the check-in screen, so
 * answering here is answering there.
 */
export function QuickCheckin({ existing }: { existing: Checkin | null }) {
  const [energy, setEnergy] = useState(existing?.energy ?? 5)
  const [sleep, setSleep] = useState(existing?.sleep_quality ?? 5)
  const [stress, setStress] = useState(existing?.stress ?? 5)
  const [moved, setMoved] = useState(existing?.movement_minutes?.toString() ?? '')
  const [pending, start] = useTransition()

  return (
    <div className="flex flex-col gap-3">
      <ScaleRow label="energy" value={energy} onChange={setEnergy} />
      <ScaleRow label="sleep quality" value={sleep} onChange={setSleep} />
      <ScaleRow label="stress" value={stress} onChange={setStress} />
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="quick-moved" className="text-xs text-muted-foreground">
          minutes moved
        </label>
        <input
          id="quick-moved"
          value={moved}
          onChange={(e) => setMoved(e.target.value)}
          inputMode="numeric"
          placeholder="0"
          className="h-10 w-20 rounded-xl bg-background px-2 text-center text-base outline-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary/40"
        />
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await saveCheckin({
              energy,
              sleepQuality: sleep,
              stress,
              movementMinutes: moved.trim() ? parseInt(moved, 10) : undefined,
            })
            if ('error' in res && res.error) {
              toast.error(res.error)
              return
            }
            toast.success('Saved — the check-in screen has it too.')
          })
        }
        className="h-11 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-50"
      >
        {existing ? 'Update' : 'Save'}
      </button>
    </div>
  )
}
