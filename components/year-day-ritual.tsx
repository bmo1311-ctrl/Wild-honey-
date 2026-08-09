'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Sun, ArrowRight } from 'lucide-react'
import { saveYearDayReflection, startExperiment, addCommitment, updateSeason } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SEASON_META, SEASONS } from '@/lib/honey-profile'
import type { TransformationReflection } from '@/lib/types'
import { cn } from '@/lib/utils'

const QUESTIONS = [
  { key: 'qLearned', label: 'what did I learn about myself?' },
  { key: 'qChanged', label: 'what changed?' },
  { key: 'qProud', label: 'what am I proud of?' },
  { key: 'qOvercame', label: 'what did I overcome?' },
  { key: 'qPatterns', label: 'what patterns became clearer?' },
  { key: 'qRelease', label: "what am I ready to release?" },
  { key: 'qCarryingForward', label: 'what am I carrying forward?' },
  { key: 'qBecoming', label: 'who am I becoming?' },
  { key: 'qIntention', label: 'what is my intention for the next cycle?' },
] as const

export function YearDayRitual({ wildHoneyYear, existing }: { wildHoneyYear: number; existing: TransformationReflection | null }) {
  const [stage, setStage] = useState<'intro' | 'questions' | 'establish' | 'done'>(existing ? 'done' : 'intro')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [pending, startTransition] = useTransition()

  // "establish new" mini-flow state
  const [season, setSeason] = useState('')
  const [commitmentText, setCommitmentText] = useState('')
  const [experimentTitle, setExperimentTitle] = useState('')

  function handleSaveReflection() {
    startTransition(async () => {
      const res = await saveYearDayReflection({ wildHoneyYear, ...answers })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Your year is recorded.')
      setStage('establish')
    })
  }

  function handleEstablish() {
    startTransition(async () => {
      const tasks: Promise<any>[] = []
      if (season) tasks.push(updateSeason(season))
      if (commitmentText.trim()) tasks.push(addCommitment(commitmentText))
      if (experimentTitle.trim()) tasks.push(startExperiment({ title: experimentTitle, lengthDays: 7 }))
      await Promise.all(tasks)
      toast.success('Begin again.')
      setStage('done')
    })
  }

  if (stage === 'done') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-honey/10 p-8 text-center ring-1 ring-honey/30">
        <Sun className="h-8 w-8 text-honey" />
        <p className="font-serif text-xl font-semibold text-honey">Year Day {wildHoneyYear}, complete</p>
        <p className="max-w-sm text-sm text-muted-foreground text-pretty">
          {existing ? 'you already reflected today — come back to it on your Progress page anytime.' : 'reflect · integrate · celebrate · begin again.'}
        </p>
      </div>
    )
  }

  if (stage === 'intro') {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-honey/10 p-8 text-center ring-1 ring-honey/30">
        <Sun className="h-10 w-10 text-honey" />
        <div>
          <p className="font-serif text-2xl font-semibold text-honey">Year Day</p>
          <p className="mt-1 text-sm text-muted-foreground">reflect · integrate · celebrate · begin again</p>
        </div>
        <p className="max-w-sm text-sm text-muted-foreground text-pretty">
          this is the one day that belongs to no month — a threshold between your Wild Honey years. take a few quiet minutes before you begin again.
        </p>
        <Button onClick={() => setStage('questions')} className="h-11">
          begin the reflection
        </Button>
      </div>
    )
  }

  if (stage === 'questions') {
    return (
      <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
        <p className="font-serif text-lg font-semibold">your year in Wild Honey</p>
        {QUESTIONS.map((q) => (
          <div key={q.key} className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">{q.label}</label>
            <Textarea
              value={answers[q.key] ?? ''}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
              rows={2}
            />
          </div>
        ))}
        <Button onClick={handleSaveReflection} disabled={pending} className="h-11">
          {pending ? 'saving…' : 'save my reflection'}
        </Button>
      </div>
    )
  }

  // stage === 'establish'
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
      <p className="font-serif text-lg font-semibold">begin again</p>
      <p className="text-sm text-muted-foreground text-pretty">everything here is optional — set what feels true right now.</p>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">new season</label>
        <div className="flex flex-wrap gap-1.5">
          {SEASONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeason(season === s ? '' : s)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-border',
                season === s ? 'bg-foreground text-background ring-foreground' : 'text-muted-foreground',
              )}
            >
              {SEASON_META[s].label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">a new commitment</label>
        <Input value={commitmentText} onChange={(e) => setCommitmentText(e.target.value)} placeholder="I will..." className="h-10" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">a new experiment to try</label>
        <Input value={experimentTitle} onChange={(e) => setExperimentTitle(e.target.value)} placeholder="e.g. Morning Light Experiment" className="h-10" />
      </div>

      <Button onClick={handleEstablish} disabled={pending} className="h-11">
        {pending ? 'setting up…' : 'begin again'}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
