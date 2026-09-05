import { FileText } from 'lucide-react'
import type { MealPlan } from '@/lib/types'

/** Lifted out of the workouts hub — meal plans belong with food, not movement. */
export function MealPlanList({ plans, unlocked }: { plans: MealPlan[]; unlocked: boolean }) {
  if (!unlocked) {
    return (
      <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
        meal plans are part of a paid membership.
      </p>
    )
  }
  if (plans.length === 0) {
    return <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">no meal plans posted yet.</p>
  }
  return (
    <div className="flex flex-col gap-3">
      {plans.map((m) => (
        <div key={m.id} className="rounded-2xl bg-card p-4 ring-1 ring-border">
          <h3 className="font-serif text-lg font-semibold text-pretty">{m.title}</h3>
          {m.description && <p className="mt-1 text-sm text-muted-foreground text-pretty">{m.description}</p>}
          {m.content && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-pretty">{m.content}</p>}
          {m.file_url && (
            <a
              href={m.file_url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
            >
              <FileText className="h-3.5 w-3.5" /> download plan
            </a>
          )}
        </div>
      ))}
    </div>
  )
}
