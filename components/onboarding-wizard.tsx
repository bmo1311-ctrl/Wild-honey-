'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { completeOnboarding, skipOnboarding } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { HoneycombMark } from '@/components/logo'
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
import { cn } from '@/lib/utils'

const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+']
const MOVEMENT_OPTIONS = ['walking', 'strength training', 'yoga', 'dance', 'swimming', 'running', 'low-impact', 'not sure yet']
const CAFFEINE_OPTIONS = ['none', '1 cup', '2+ cups', 'trying to cut back']

const STEPS = ['name', 'season', 'goals', 'vitality', 'lifestyle', 'food', 'style'] as const
type Step = (typeof STEPS)[number]

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3.5 py-2 text-sm font-medium ring-1 ring-border transition-colors',
        active ? 'bg-foreground text-background ring-foreground' : 'bg-transparent text-muted-foreground',
      )}
    >
      {children}
    </button>
  )
}

export function OnboardingWizard({ initialName }: { initialName: string }) {
  const router = useRouter()
  const [stepIndex, setStepIndex] = useState(0)
  const [pending, startTransition] = useTransition()

  const [name, setName] = useState(initialName)
  const [ageRange, setAgeRange] = useState<string | null>(null)
  const [season, setSeason] = useState<string | null>(null)
  const [goals, setGoals] = useState<string[]>([])
  const [vitality, setVitality] = useState<Record<string, number>>(
    Object.fromEntries(VITALITY_DIMENSIONS.map((d) => [d.key, 5])),
  )
  const [wakeTime, setWakeTime] = useState('')
  const [bedtime, setBedtime] = useState('')
  const [movementPreference, setMovementPreference] = useState<string | null>(null)
  const [hydrationGoalOz, setHydrationGoalOz] = useState('')
  const [caffeine, setCaffeine] = useState<string | null>(null)
  const [foodsAvoided, setFoodsAvoided] = useState('')
  const [allergies, setAllergies] = useState('')
  const [communicationStyle, setCommunicationStyle] = useState<string | null>(null)
  const [faithPreference, setFaithPreference] = useState<string | null>(null)

  const step: Step = STEPS[stepIndex]
  const isLast = stepIndex === STEPS.length - 1

  function toggleGoal(g: string) {
    setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]))
  }

  function canAdvance(): boolean {
    if (step === 'name') return name.trim().length > 0
    return true
  }

  function handleNext() {
    if (!canAdvance()) {
      toast.error('Tell us your name first.')
      return
    }
    if (isLast) {
      handleSubmit()
      return
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  }

  function handleBack() {
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  function handleSubmit() {
    startTransition(async () => {
      const res = await completeOnboarding({
        name,
        ageRange: ageRange ?? undefined,
        season: season ?? undefined,
        goals,
        vitality,
        wakeTime,
        bedtime,
        movementPreference: movementPreference ?? undefined,
        hydrationGoalOz: hydrationGoalOz ? parseInt(hydrationGoalOz, 10) : undefined,
        caffeine: caffeine ?? undefined,
        foodsAvoided,
        allergies,
        communicationStyle: communicationStyle ?? undefined,
        faithPreference: faithPreference ?? undefined,
      })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Welcome to Wild Honey.')
      router.push('/app')
      router.refresh()
    })
  }

  function handleSkip() {
    startTransition(async () => {
      const res = await skipOnboarding()
      if (res?.error) {
        toast.error(res.error)
        return
      }
      router.push('/app')
      router.refresh()
    })
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <HoneycombMark className="h-9 w-9" />
        <button type="button" onClick={handleSkip} disabled={pending} className="text-xs font-medium text-muted-foreground">
          skip for now
        </button>
      </div>

      <div className="mb-8 flex gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s} className={cn('h-1 flex-1 rounded-full', i <= stepIndex ? 'bg-honey' : 'bg-secondary')} />
        ))}
      </div>

      <div className="flex-1">
        {step === 'name' && (
          <div className="flex flex-col gap-4">
            <h1 className="font-serif text-2xl font-semibold text-balance">let's get to know you</h1>
            <p className="text-sm text-muted-foreground text-pretty">what should we call you?</p>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-12 text-base" placeholder="your name" autoFocus />
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-muted-foreground">age range (optional)</p>
              <div className="flex flex-wrap gap-2">
                {AGE_RANGES.map((r) => (
                  <Chip key={r} active={ageRange === r} onClick={() => setAgeRange(ageRange === r ? null : r)}>
                    {r}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'season' && (
          <div className="flex flex-col gap-4">
            <h1 className="font-serif text-2xl font-semibold text-balance">what season are you in?</h1>
            <p className="text-sm text-muted-foreground text-pretty">this shapes what we surface for you — you can change it anytime.</p>
            <div className="flex flex-col gap-2">
              {SEASONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeason(s)}
                  className={cn(
                    'flex flex-col gap-0.5 rounded-2xl p-4 text-left ring-1 transition-colors',
                    season === s ? 'bg-foreground text-background ring-foreground' : 'bg-card ring-border',
                  )}
                >
                  <span className="text-sm font-semibold">{SEASON_META[s].label}</span>
                  <span className={cn('text-xs', season === s ? 'text-background/70' : 'text-muted-foreground')}>
                    {SEASON_META[s].description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'goals' && (
          <div className="flex flex-col gap-4">
            <h1 className="font-serif text-2xl font-semibold text-balance">what are you here for?</h1>
            <p className="text-sm text-muted-foreground text-pretty">pick as many as you'd like.</p>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <Chip key={g} active={goals.includes(g)} onClick={() => toggleGoal(g)}>
                  {GOAL_META[g]}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {step === 'vitality' && (
          <div className="flex flex-col gap-5">
            <h1 className="font-serif text-2xl font-semibold text-balance">a quick baseline</h1>
            <p className="text-sm text-muted-foreground text-pretty">
              rate where you are right now on each of these. this becomes the "before" in your transformation — no wrong answers.
            </p>
            <div className="flex flex-col gap-4">
              {VITALITY_DIMENSIONS.map((d) => (
                <div key={d.key} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{d.label}</span>
                    <span className="text-xs font-medium text-muted-foreground">{vitality[d.key]}/10</span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setVitality((prev) => ({ ...prev, [d.key]: n }))}
                        className={cn('h-6 flex-1 rounded-sm transition-colors', n <= vitality[d.key] ? 'bg-honey' : 'bg-secondary')}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'lifestyle' && (
          <div className="flex flex-col gap-4">
            <h1 className="font-serif text-2xl font-semibold text-balance">your rhythm</h1>
            <p className="text-sm text-muted-foreground text-pretty">all optional — helps us time things well for you.</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">wake time</label>
                <Input value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} placeholder="6:30am" className="h-11" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">bedtime</label>
                <Input value={bedtime} onChange={(e) => setBedtime(e.target.value)} placeholder="10pm" className="h-11" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-muted-foreground">movement you enjoy</p>
              <div className="flex flex-wrap gap-2">
                {MOVEMENT_OPTIONS.map((m) => (
                  <Chip key={m} active={movementPreference === m} onClick={() => setMovementPreference(movementPreference === m ? null : m)}>
                    {m}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">hydration goal (oz)</label>
                <Input type="number" value={hydrationGoalOz} onChange={(e) => setHydrationGoalOz(e.target.value)} placeholder="64" className="h-11" />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-muted-foreground">caffeine</p>
                <div className="flex flex-wrap gap-1.5">
                  {CAFFEINE_OPTIONS.map((c) => (
                    <Chip key={c} active={caffeine === c} onClick={() => setCaffeine(caffeine === c ? null : c)}>
                      {c}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'food' && (
          <div className="flex flex-col gap-4">
            <h1 className="font-serif text-2xl font-semibold text-balance">food notes</h1>
            <p className="text-sm text-muted-foreground text-pretty">so recipes and grocery suggestions actually fit you. optional.</p>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">foods you avoid</label>
              <Textarea value={foodsAvoided} onChange={(e) => setFoodsAvoided(e.target.value)} rows={2} placeholder="e.g. fish, legumes" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">allergies or intolerances</label>
              <Textarea value={allergies} onChange={(e) => setAllergies(e.target.value)} rows={2} />
            </div>
          </div>
        )}

        {step === 'style' && (
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="font-serif text-2xl font-semibold text-balance">how should we show up for you?</h1>
              <p className="mt-1 text-sm text-muted-foreground text-pretty">pick whatever fits how you like to be nudged.</p>
            </div>
            <div className="flex flex-col gap-2">
              {COMMUNICATION_STYLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setCommunicationStyle(s)}
                  className={cn(
                    'flex flex-col gap-0.5 rounded-2xl p-3.5 text-left ring-1 transition-colors',
                    communicationStyle === s ? 'bg-foreground text-background ring-foreground' : 'bg-card ring-border',
                  )}
                >
                  <span className="text-sm font-semibold">{COMMUNICATION_META[s].label}</span>
                  <span className={cn('text-xs', communicationStyle === s ? 'text-background/70' : 'text-muted-foreground')}>
                    {COMMUNICATION_META[s].description}
                  </span>
                </button>
              ))}
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-xs font-medium text-muted-foreground">
                one more thing — would you like faith woven into your experience? totally your call.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {FAITH_OPTIONS.map((f) => (
                  <Chip key={f} active={faithPreference === f} onClick={() => setFaithPreference(faithPreference === f ? null : f)}>
                    {FAITH_META[f]}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={handleBack} disabled={stepIndex === 0 || pending} className="h-11">
          <ArrowLeft className="h-4 w-4" />
          back
        </Button>
        <Button onClick={handleNext} disabled={pending} className="h-11 flex-1">
          {pending ? (
            'saving…'
          ) : isLast ? (
            <>
              <Check className="h-4 w-4" />
              enter Wild Honey
            </>
          ) : (
            <>
              next
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
