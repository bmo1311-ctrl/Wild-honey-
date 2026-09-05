'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { addHouseholdMembers, completeOnboarding, saveBodyGoals, saveProfilePage, skipOnboarding } from '@/app/actions'
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
} from '@/lib/honey-profile'
import { ACTIVITY_LEVELS, BODY_GOALS } from '@/lib/goals'
const COLOUR_SEASONS = [
  { key: 'winter', label: 'Winter', blurb: 'clear, cool, high contrast' },
  { key: 'spring', label: 'Spring', blurb: 'light, warm, fresh' },
  { key: 'summer', label: 'Summer', blurb: 'soft, cool, muted' },
  { key: 'autumn', label: 'Autumn', blurb: 'deep, warm, rich' },
] as const
import { cn } from '@/lib/utils'

const MOVEMENT_OPTIONS = ['walking', 'strength training', 'yoga', 'dance', 'swimming', 'running', 'low-impact', 'not sure yet']
const CAFFEINE_OPTIONS = ['none', '1 cup', '2+ cups', 'trying to cut back']

/**
 * Five steps, and nothing asked twice.
 *
 * Age used to be asked as a bracket here and again as a birth year for the
 * calorie maths; hydration was typed in here and then calculated from her
 * weight; and "what are you here for" sat next to "what are you working
 * toward". Each of those is now asked once, in the place it is used.
 * The vitality baseline moved out entirely — it is a check-in, and asking for
 * ten sliders before she has seen the app is the definition of friction.
 */
const STEPS = ['you', 'focus', 'body', 'rhythm', 'fit'] as const
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

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-muted-foreground">{children}</p>
}

export function OnboardingWizard({ initialName }: { initialName: string }) {
  const router = useRouter()
  const [stepIndex, setStepIndex] = useState(0)
  const [pending, startTransition] = useTransition()

  const [name, setName] = useState(initialName)
  const [birthYear, setBirthYear] = useState('')
  const [season, setSeason] = useState<string | null>(null)
  const [goals, setGoals] = useState<string[]>([])
  const [bodyGoal, setBodyGoal] = useState<string | null>(null)
  const [weight, setWeight] = useState('')
  const [weightUnit, setWeightUnit] = useState<'lb' | 'kg'>('lb')
  const [activityLevel, setActivityLevel] = useState<string | null>(null)
  const [wakeTime, setWakeTime] = useState('')
  const [bedtime, setBedtime] = useState('')
  const [movementPreference, setMovementPreference] = useState<string | null>(null)
  const [caffeine, setCaffeine] = useState<string | null>(null)
  const [foodsAvoided, setFoodsAvoided] = useState('')
  const [allergies, setAllergies] = useState('')
  const [communicationStyle, setCommunicationStyle] = useState<string | null>(null)
  const [faithPreference, setFaithPreference] = useState<string | null>(null)
  const [children, setChildren] = useState<{ name: string; birthYear: string }[]>([])
  const [colorSeason, setColorSeason] = useState<string | null>(null)

  const step: Step = STEPS[stepIndex]
  const isLast = stepIndex === STEPS.length - 1

  function toggleGoal(g: string) {
    setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]))
  }

  function handleNext() {
    if (step === 'you' && !name.trim()) {
      toast.error('Tell us your name first.')
      return
    }
    if (isLast) {
      handleSubmit()
      return
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  }

  function handleSubmit() {
    startTransition(async () => {
      const res = await completeOnboarding({
        name,
        season: season ?? undefined,
        goals,
        vitality: {},
        wakeTime,
        bedtime,
        movementPreference: movementPreference ?? undefined,
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
      // Saved separately, so leaving the body step blank costs nothing.
      if (weight.trim() || bodyGoal || birthYear.trim() || activityLevel) {
        await saveBodyGoals({
          weight: Number(weight) || null,
          weightUnit,
          heightCm: null,
          birthYear: Number(birthYear) || null,
          activityLevel,
          bodyGoal,
        })
      }
      if (colorSeason) await saveProfilePage({ colorSeason: colorSeason as 'winter' | 'spring' | 'summer' | 'autumn' })
      if (children.some((c) => c.name.trim())) {
        await addHouseholdMembers(children.map((c) => ({ name: c.name, birthYear: Number(c.birthYear) || null })))
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
        {step === 'you' && (
          <div className="flex flex-col gap-4">
            <h1 className="font-serif text-2xl font-semibold text-balance">let&rsquo;s get to know you</h1>
            <p className="text-sm text-muted-foreground text-pretty">what should we call you?</p>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-12 text-base" placeholder="your name" autoFocus />
            <div className="flex flex-col gap-1.5">
              <Label>year you were born (optional)</Label>
              <Input
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                inputMode="numeric"
                placeholder="1990"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">only used to work out your calorie target.</p>
            </div>
          </div>
        )}

        {step === 'focus' && (
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="font-serif text-2xl font-semibold text-balance">what are you here for?</h1>
              <p className="mt-1 text-sm text-muted-foreground text-pretty">pick as many as you&rsquo;d like.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <Chip key={g} active={goals.includes(g)} onClick={() => toggleGoal(g)}>
                  {GOAL_META[g]}
                </Chip>
              ))}
            </div>
            <div className="border-t border-border pt-4">
              <Label>and what season are you in? (optional)</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {SEASONS.map((s) => (
                  <Chip key={s} active={season === s} onClick={() => setSeason(season === s ? null : s)}>
                    {SEASON_META[s].label}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <Label>which colours do you vibe with? the app dresses to match. (optional)</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {COLOUR_SEASONS.map((c) => (
                  <button key={c.key} type="button" data-palette={c.key} onClick={() => setColorSeason(colorSeason === c.key ? null : c.key)} className={cn('rounded-xl border p-3 text-left', colorSeason === c.key ? 'border-foreground ring-2 ring-foreground/20' : 'border-border')}>
                    <span className="mb-1.5 flex gap-1"><span className="h-4 w-4 rounded-full bg-primary" /><span className="h-4 w-4 rounded-full bg-honey" /><span className="h-4 w-4 rounded-full bg-accent" /></span>
                    <span className="block text-sm font-semibold">{c.label}</span>
                    <span className="block text-[11.5px] text-muted-foreground">{c.blurb}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'body' && (
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="font-serif text-2xl font-semibold text-balance">what are you working toward?</h1>
              <p className="mt-1 text-sm text-muted-foreground text-pretty">
                this is what lets the app work out your protein and calories instead of guessing. all optional.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {BODY_GOALS.map((g) => (
                <Chip key={g.key} active={bodyGoal === g.key} onClick={() => setBodyGoal(bodyGoal === g.key ? null : g.key)}>
                  {g.label}
                </Chip>
              ))}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>your weight</Label>
              <div className="flex gap-2">
                <Input value={weight} onChange={(e) => setWeight(e.target.value)} inputMode="decimal" placeholder="130" className="h-12 text-base" />
                <div className="flex shrink-0 overflow-hidden rounded-lg ring-1 ring-border">
                  {(['lb', 'kg'] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setWeightUnit(u)}
                      className={cn('h-12 px-4 text-sm font-semibold', weightUnit === u ? 'bg-foreground text-background' : 'bg-transparent text-muted-foreground')}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">never shown to anyone else. change it any time.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>how active are you?</Label>
              <div className="flex flex-wrap gap-2">
                {ACTIVITY_LEVELS.map((a) => (
                  <Chip key={a.key} active={activityLevel === a.key} onClick={() => setActivityLevel(activityLevel === a.key ? null : a.key)}>
                    {a.label}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'rhythm' && (
          <div className="flex flex-col gap-4">
            <h1 className="font-serif text-2xl font-semibold text-balance">your rhythm</h1>
            <p className="text-sm text-muted-foreground text-pretty">all optional — helps us time things well for you.</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>wake time</Label>
                <Input value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} placeholder="6:30am" className="h-11" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>bedtime</Label>
                <Input value={bedtime} onChange={(e) => setBedtime(e.target.value)} placeholder="10pm" className="h-11" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>movement you enjoy</Label>
              <div className="flex flex-wrap gap-2">
                {MOVEMENT_OPTIONS.map((m) => (
                  <Chip key={m} active={movementPreference === m} onClick={() => setMovementPreference(movementPreference === m ? null : m)}>
                    {m}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>caffeine</Label>
              <div className="flex flex-wrap gap-2">
                {CAFFEINE_OPTIONS.map((c) => (
                  <Chip key={c} active={caffeine === c} onClick={() => setCaffeine(caffeine === c ? null : c)}>
                    {c}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'fit' && (
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="font-serif text-2xl font-semibold text-balance">last one</h1>
              <p className="mt-1 text-sm text-muted-foreground text-pretty">so recipes fit you, and we show up the way you like. all optional.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>foods you avoid</Label>
                <Textarea value={foodsAvoided} onChange={(e) => setFoodsAvoided(e.target.value)} rows={2} placeholder="e.g. fish" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>allergies</Label>
                <Textarea value={allergies} onChange={(e) => setAllergies(e.target.value)} rows={2} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>how should we nudge you?</Label>
              <div className="flex flex-wrap gap-2">
                {COMMUNICATION_STYLES.map((s) => (
                  <Chip key={s} active={communicationStyle === s} onClick={() => setCommunicationStyle(communicationStyle === s ? null : s)}>
                    {COMMUNICATION_META[s].label}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>anyone else at home you want to track? (optional)</Label>
              {children.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={c.name}
                    onChange={(e) => setChildren(children.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                    placeholder="name"
                    className="h-11"
                  />
                  <Input
                    value={c.birthYear}
                    onChange={(e) => setChildren(children.map((x, j) => (j === i ? { ...x, birthYear: e.target.value } : x)))}
                    inputMode="numeric"
                    placeholder="year born"
                    className="h-11 w-32"
                  />
                  <button
                    type="button"
                    onClick={() => setChildren(children.filter((_, j) => j !== i))}
                    aria-label="remove"
                    className="shrink-0 px-2 text-muted-foreground"
                  >
                    &times;
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setChildren([...children, { name: '', birthYear: '' }])}
                className="self-start rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground ring-1 ring-border"
              >
                + add a child
              </button>
              <p className="text-xs text-muted-foreground">the year lets the app keep up as they grow. you can add more later.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>faith woven in? totally your call.</Label>
              <div className="flex flex-wrap gap-2">
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
        <Button
          variant="ghost"
          onClick={() => setStepIndex((i) => Math.max(i - 1, 0))}
          disabled={stepIndex === 0 || pending}
          className="h-11"
        >
          <ArrowLeft className="h-4 w-4" /> back
        </Button>
        <Button onClick={handleNext} disabled={pending} className="h-11 flex-1">
          {isLast ? (
            <>
              <Check className="h-4 w-4" /> {pending ? 'saving…' : 'start'}
            </>
          ) : (
            <>
              next <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
