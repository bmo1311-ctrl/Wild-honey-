import { VitalityComparison } from '@/components/vitality-comparison'
import { CheckpointForm } from '@/components/checkpoint-form'
import { ReflectionForm } from '@/components/reflection-form'
import { MySeasonCard } from '@/components/my-season-card'
import { MyBecomingSummary } from '@/components/my-becoming-summary'
import { getMyCommitments, getMyExperiments, getRecentWins, getReflections, getSessionProfile, getVitalityHistory } from '@/lib/data'
import { relativeTime } from '@/lib/pillars'
import { Sparkles } from 'lucide-react'
import { FeatureOff } from '@/components/feature-off'
import { FEATURES } from '@/lib/features'

const MILESTONE_LABEL: Record<string, string> = {
  '30_day': '30 days in',
  '60_day': '60 days in',
  '90_day': '90 days in',
  custom: 'a reflection',
  year_day: 'Year Day',
}

export default async function ProgressPage() {
  if (!FEATURES.progress) return <FeatureOff />

  const [profile, vitalityHistory, reflections, commitments, experiments, wins] = await Promise.all([
    getSessionProfile(),
    getVitalityHistory(),
    getReflections(),
    getMyCommitments(),
    getMyExperiments(),
    getRecentWins(10),
  ])
  const baseline = vitalityHistory.find((v) => v.label === 'baseline') ?? vitalityHistory[0] ?? null
  const latest = vitalityHistory[vitalityHistory.length - 1] ?? null

  const yearDayReflections = reflections.filter((r) => r.milestone === 'year_day')
  const otherReflections = reflections.filter((r) => r.milestone !== 'year_day')

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold">My Evolution</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">not just what changed — who you're becoming.</p>
      </div>

      <MySeasonCard season={profile?.season ?? null} />

      <MyBecomingSummary commitments={commitments} experiments={experiments} />

      <div>
        <h2 className="mb-3 font-serif text-lg font-semibold">my wins</h2>
        {wins.length === 0 ? (
          <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
            nothing logged yet — small wins add up to the bigger story.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {wins.map((w) => (
              <div key={w.id} className="flex items-start gap-2.5 rounded-xl bg-card p-3 ring-1 ring-border">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-honey" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-pretty">{w.text}</p>
                  <p className="text-xs text-muted-foreground">{relativeTime(w.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <VitalityComparison baseline={baseline} latest={latest} />
      <CheckpointForm />

      {yearDayReflections.length > 0 && (
        <div>
          <h2 className="mb-3 font-serif text-lg font-semibold">my year in Wild Honey</h2>
          <div className="flex flex-col gap-3">
            {yearDayReflections.map((r) => (
              <div key={r.id} className="rounded-2xl bg-honey/10 p-4 ring-1 ring-honey/30">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-honey/20 px-2.5 py-1 text-[0.7rem] font-medium text-honey">Year Day {r.wild_honey_year}</span>
                  <span className="text-xs text-muted-foreground">{relativeTime(r.created_at)}</span>
                </div>
                <div className="mt-3 flex flex-col gap-2.5">
                  {r.q_becoming && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">who am I becoming?</p>
                      <p className="text-sm italic text-pretty">{r.q_becoming}</p>
                    </div>
                  )}
                  {r.q_intention && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">my intention for the next cycle</p>
                      <p className="text-sm text-pretty">{r.q_intention}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 font-serif text-lg font-semibold">what I'm learning</h2>
        <div className="flex flex-col gap-3">
          <ReflectionForm />
          {otherReflections.map((r) => (
            <div key={r.id} className="rounded-2xl bg-card p-4 ring-1 ring-border">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-honey/15 px-2.5 py-1 text-[0.7rem] font-medium text-honey">{MILESTONE_LABEL[r.milestone]}</span>
                <span className="text-xs text-muted-foreground">{relativeTime(r.created_at)}</span>
              </div>
              <div className="mt-3 flex flex-col gap-2.5">
                {r.q_changed && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">what has changed?</p>
                    <p className="text-sm text-pretty">{r.q_changed}</p>
                  </div>
                )}
                {r.q_proud && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">what are you proud of?</p>
                    <p className="text-sm text-pretty">{r.q_proud}</p>
                  </div>
                )}
                {r.q_different && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">what feels different?</p>
                    <p className="text-sm text-pretty">{r.q_different}</p>
                  </div>
                )}
                {r.q_becoming && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">the woman I am becoming is…</p>
                    <p className="text-sm italic text-pretty">{r.q_becoming}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
