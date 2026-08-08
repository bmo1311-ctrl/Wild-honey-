import { VitalityComparison } from '@/components/vitality-comparison'
import { CheckpointForm } from '@/components/checkpoint-form'
import { ReflectionForm } from '@/components/reflection-form'
import { getReflections, getVitalityHistory } from '@/lib/data'
import { relativeTime } from '@/lib/pillars'

const MILESTONE_LABEL: Record<string, string> = {
  '30_day': '30 days in',
  '60_day': '60 days in',
  '90_day': '90 days in',
  custom: 'a reflection',
}

export default async function ProgressPage() {
  const [vitalityHistory, reflections] = await Promise.all([getVitalityHistory(), getReflections()])
  const baseline = vitalityHistory.find((v) => v.label === 'baseline') ?? vitalityHistory[0] ?? null
  const latest = vitalityHistory[vitalityHistory.length - 1] ?? null

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Progress</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">your transformation, tracked honestly — not just numbers.</p>
      </div>

      <VitalityComparison baseline={baseline} latest={latest} />
      <CheckpointForm />

      <div>
        <h2 className="mb-3 font-serif text-lg font-semibold">reflections</h2>
        <div className="flex flex-col gap-3">
          <ReflectionForm />
          {reflections.map((r) => (
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
