'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ChevronDown, ChevronUp, Plus, TrendingUp } from 'lucide-react'
import { addVitalityCheckin, updateGoals, updateHoneyProfile } from '@/app/actions'
import { Button } from '@/components/ui/button'
import {
  COMMUNICATION_META,
  COMMUNICATION_STYLES,
  FAITH_META,
  FAITH_OPTIONS,
  GOAL_META,
  GOALS,
  SEASON_META,
  SEASONS,
  VITALITY_DIMENSIONS,
} from '@/lib/honey-profile'
import type { Profile, VitalityCheckin } from '@/lib/types'
import { cn } from '@/lib/utils'

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-border transition-colors',
        active ? 'bg-foreground text-background ring-foreground' : 'bg-transparent text-muted-foreground',
      )}
    >
      {children}
    </button>
  )
}

export function HoneyProfileCard({
  profile,
  goals: initialGoals,
  baseline,
  latest,
}: {
  profile: Profile
  goals: string[]
  baseline: VitalityCheckin | null
  latest: VitalityCheckin | null
}) {
  const [expanded, setExpanded] = useState(false)
  const [season, setSeason] = useState(profile.season)
  const [goals, setGoals] = useState<string[]>(initialGoals)
  const [communicationStyle, setCommunicationStyle] = useState(profile.communication_style)
  const [faithPreference, setFaithPreference] = useState(profile.faith_preference)
  const [pending, startTransition] = useTransition()
  const [checkinOpen, setCheckinOpen] = useState(false)
  const [vitality, setVitality] = useState<Record<string, number>>(
    Object.fromEntries(VITALITY_DIMENSIONS.map((d) => [d.key, (latest as any)?.[d.key] ?? 5])),
  )

  function saveProfileField(patch: Partial<{ season: string | null; communicationStyle: string | null; faithPreference: string | null }>) {
    startTransition(async () => {
      const res = await updateHoneyProfile({
        season: patch.season !== undefined ? patch.season ?? undefined : season ?? undefined,
        communicationStyle: patch.communicationStyle !== undefined ? patch.communicationStyle ?? undefined : communicationStyle ?? undefined,
        faithPreference: patch.faithPreference !== undefined ? patch.faithPreference ?? undefined : faithPreference ?? undefined,
      })
      if (res?.error) toast.error(res.error)
    })
  }

  function toggleGoal(g: string) {
    const next = goals.includes(g) ? goals.filter((x) => x !== g) : [...goals, g]
    setGoals(next)
    startTransition(async () => {
      const res = await updateGoals(next)
      if (res?.error) toast.error(res.error)
    })
  }

  function handleSaveCheckin() {
    startTransition(async () => {
      const res = await addVitalityCheckin(vitality)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Checkpoint saved.')
      setCheckinOpen(false)
    })
  }

  const dimensionsWithChange = VITALITY_DIMENSIONS.map((d) => {
    const base = (baseline as any)?.[d.key] as number | undefined
    const cur = (latest as any)?.[d.key] as number | undefined
    return { ...d, base, cur, delta: base !== undefined && cur !== undefined ? cur - base : null }
  })

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
      <button type="button" onClick={() => setExpanded((e) => !e)} className="flex items-center justify-between">
        <p className="font-serif text-lg font-semibold">honey profile</p>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {baseline && (
        <div className="rounded-xl bg-secondary/50 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            your transformation so far
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {dimensionsWithChange.map((d) => (
              <div key={d.key} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{d.label}</span>
                <span className={cn('font-medium', d.delta && d.delta > 0 ? 'text-honey' : d.delta && d.delta < 0 ? 'text-destructive' : '')}>
                  {d.cur ?? '—'}
                  {d.delta !== null && d.delta !== 0 && ` (${d.delta > 0 ? '+' : ''}${d.delta})`}
                </span>
              </div>
            ))}
          </div>
          {!checkinOpen ? (
            <button type="button" onClick={() => setCheckinOpen(true)} className="mt-2 flex items-center gap-1 text-xs font-medium text-honey">
              <Plus className="h-3 w-3" />
              log a new checkpoint
            </button>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {VITALITY_DIMENSIONS.map((d) => (
                <div key={d.key} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>{d.label}</span>
                    <span className="font-medium">{vitality[d.key]}/10</span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setVitality((prev) => ({ ...prev, [d.key]: n }))}
                        className={cn('h-4 flex-1 rounded-sm', n <= vitality[d.key] ? 'bg-honey' : 'bg-background')}
                      />
                    ))}
                  </div>
                </div>
              ))}
              <Button onClick={handleSaveCheckin} disabled={pending} className="h-9 self-start">
                save checkpoint
              </Button>
            </div>
          )}
        </div>
      )}

      {expanded && (
        <div className="flex flex-col gap-5 border-t border-border pt-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">season</p>
            <div className="flex flex-wrap gap-1.5">
              {SEASONS.map((s) => (
                <Chip
                  key={s}
                  active={season === s}
                  onClick={() => {
                    const next = season === s ? null : s
                    setSeason(next)
                    saveProfileField({ season: next })
                  }}
                >
                  {SEASON_META[s].label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">what you're here for</p>
            <div className="flex flex-wrap gap-1.5">
              {GOALS.map((g) => (
                <Chip key={g} active={goals.includes(g)} onClick={() => toggleGoal(g)}>
                  {GOAL_META[g]}
                </Chip>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">how we show up for you</p>
            <div className="flex flex-wrap gap-1.5">
              {COMMUNICATION_STYLES.map((s) => (
                <Chip
                  key={s}
                  active={communicationStyle === s}
                  onClick={() => {
                    const next = communicationStyle === s ? null : s
                    setCommunicationStyle(next)
                    saveProfileField({ communicationStyle: next })
                  }}
                >
                  {COMMUNICATION_META[s].label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">faith in your experience</p>
            <div className="flex flex-wrap gap-1.5">
              {FAITH_OPTIONS.map((f) => (
                <Chip
                  key={f}
                  active={faithPreference === f}
                  onClick={() => {
                    const next = faithPreference === f ? null : f
                    setFaithPreference(next)
                    saveProfileField({ faithPreference: next })
                  }}
                >
                  {FAITH_META[f]}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
