'use client'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { saveCheckin } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Checkin, CyclePhase } from '@/lib/types'
import { SYMPTOM_KEYS } from '@/components/symptom-intelligence'
import { cn } from '@/lib/utils'

const SLIDER_FIELDS: { key: 'energy' | 'stress' | 'sleep_quality'; label: string }[] = [
  { key: 'energy', label: 'energy' },
  { key: 'sleep_quality', label: 'sleep quality' },
  { key: 'stress', label: 'stress' },
]

const CYCLE_PHASES: { value: CyclePhase; label: string }[] = [
  { value: 'menstrual', label: 'menstrual' },
  { value: 'follicular', label: 'follicular' },
  { value: 'ovulation', label: 'ovulation' },
  { value: 'luteal', label: 'luteal' },
  { value: 'not_tracked', label: "don't track" },
]

const SYMPTOM_OPTIONS = SYMPTOM_KEYS

export function ScaleRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="text-xs font-medium">{value}/10</span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${label} ${n}`}
            className={cn('h-6 flex-1 rounded-sm transition-colors', n <= value ? 'bg-honey' : 'bg-secondary')}
          />
        ))}
      </div>
    </div>
  )
}

export function WellnessCheckinForm({ existing }: { existing: Checkin | null }) {
  const [energy, setEnergy] = useState(existing?.energy ?? 5)
  const [sleepQuality, setSleepQuality] = useState(existing?.sleep_quality ?? 5)
  const [stress, setStress] = useState(existing?.stress ?? 5)
  const [mood, setMood] = useState(existing?.mood ?? '')
  const [hydration, setHydration] = useState(existing?.hydration_oz?.toString() ?? '')
  const [protein, setProtein] = useState(existing?.protein_g?.toString() ?? '')
  const [sunlight, setSunlight] = useState(existing?.sunlight_minutes?.toString() ?? '')
  const [movement, setMovement] = useState(existing?.movement_minutes?.toString() ?? '')
  const [cyclePhase, setCyclePhase] = useState<CyclePhase | null>(existing?.cycle_phase ?? null)
  const [symptoms, setSymptoms] = useState<string[]>(existing?.symptoms ?? [])
  const [pending, startTransition] = useTransition()

  function toggleSymptom(s: string) {
    setSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  function handleSave() {
    startTransition(async () => {
      const res = await saveCheckin({
        energy,
        sleepQuality,
        stress,
        mood: mood || undefined,
        hydrationOz: hydration ? parseFloat(hydration) : undefined,
        proteinG: protein ? parseFloat(protein) : undefined,
        sunlightMinutes: sunlight ? parseInt(sunlight, 10) : undefined,
        movementMinutes: movement ? parseInt(movement, 10) : undefined,
        cyclePhase: cyclePhase ?? undefined,
        symptoms,
      })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Check-in saved.')
    })
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-card p-5 ring-1 ring-border">
      <p className="font-serif text-lg font-semibold">today's check-in</p>

      {SLIDER_FIELDS.map((f) => (
        <ScaleRow
          key={f.key}
          label={f.label}
          value={f.key === 'energy' ? energy : f.key === 'sleep_quality' ? sleepQuality : stress}
          onChange={f.key === 'energy' ? setEnergy : f.key === 'sleep_quality' ? setSleepQuality : setStress}
        />
      ))}

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">mood, in a word or two</Label>
        <Input value={mood} onChange={(e) => setMood(e.target.value)} placeholder="e.g. steady, foggy, hopeful" className="h-11" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">hydration (oz)</Label>
          <Input type="number" value={hydration} onChange={(e) => setHydration(e.target.value)} className="h-11" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">protein (g)</Label>
          <Input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} className="h-11" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">sunlight (min)</Label>
          <Input type="number" value={sunlight} onChange={(e) => setSunlight(e.target.value)} className="h-11" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">movement (min)</Label>
          <Input type="number" value={movement} onChange={(e) => setMovement(e.target.value)} className="h-11" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">cycle phase</Label>
        <div className="flex flex-wrap gap-1.5">
          {CYCLE_PHASES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setCyclePhase(cyclePhase === p.value ? null : p.value)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-border transition-colors',
                cyclePhase === p.value ? 'bg-foreground text-background ring-foreground' : 'bg-transparent text-muted-foreground',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">any symptoms today?</Label>
        <div className="flex flex-wrap gap-1.5">
          {SYMPTOM_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSymptom(s)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-border transition-colors',
                symptoms.includes(s) ? 'bg-foreground text-background ring-foreground' : 'bg-transparent text-muted-foreground',
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="mt-1 text-[0.7rem] text-muted-foreground">this is educational tracking, not medical advice — check with a doctor for anything persistent or concerning.</p>
      </div>

      <Button onClick={handleSave} disabled={pending} className="h-11">
        {pending ? 'saving…' : 'save check-in'}
      </Button>
    </div>
  )
}
