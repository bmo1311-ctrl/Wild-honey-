'use client'

import { useTransition } from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Lock, FileText, ShoppingCart, ListPlus } from 'lucide-react'
import { importGroceryListToBuilder } from '@/app/actions'
import { PillarRows } from '@/components/pillar-rows'
import { WorkoutCard } from '@/components/workout-card'
import type { GroceryList, MealPlan, Workout } from '@/lib/types'
import { cn } from '@/lib/utils'

const SECTIONS = [
  { id: 'workouts', label: 'Workouts' },
  { id: 'meals', label: 'Meal Plans' },
  { id: 'grocery', label: 'Grocery Lists' },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

function Locked() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
      <span className="hex-clip flex h-12 w-12 items-center justify-center bg-honey text-honey-foreground">
        <Lock className="h-5 w-5" />
      </span>
      <div>
        <p className="font-serif text-lg font-semibold">members-only content</p>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">unlock workouts, meal plans, and grocery lists with a paid membership.</p>
      </div>
      <Link href="/app/membership" className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background">
        see membership options
      </Link>
    </div>
  )
}

function ImportListButton({ groceryListId }: { groceryListId: string }) {
  const [pending, startTransition] = useTransition()
  function handleImport() {
    startTransition(async () => {
      const res = await importGroceryListToBuilder(groceryListId)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success(`Added ${res.count ?? 'items'} to your grocery list.`)
    })
  }
  return (
    <button
      type="button"
      onClick={handleImport}
      disabled={pending}
      className="mt-3 flex items-center gap-1.5 rounded-full bg-honey/15 px-3 py-1.5 text-xs font-medium text-honey"
    >
      <ListPlus className="h-3.5 w-3.5" />
      {pending ? 'adding…' : 'add to my grocery list'}
    </button>
  )
}

export function WorkoutsHubTabs({
  workouts,
  mealPlans,
  groceryLists,
  unlocked,
}: {
  workouts: Workout[]
  mealPlans: MealPlan[]
  groceryLists: GroceryList[]
  unlocked: boolean
}) {
  const [active, setActive] = useState<SectionId>('workouts')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1.5 overflow-x-auto">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(s.id)}
            className={cn(
              'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ring-1 ring-border transition-colors',
              active === s.id ? 'bg-foreground text-background ring-foreground' : 'bg-card text-muted-foreground',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {!unlocked ? (
        <Locked />
      ) : (
        <>
          {active === 'workouts' && (
            <PillarRows
              items={workouts}
              cardWidthClass="w-[260px]"
              renderItem={(w) => <WorkoutCard workout={w} />}
              emptyMessage="no workouts posted yet."
            />
          )}

          {active === 'meals' &&
            (mealPlans.length === 0 ? (
              <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">no meal plans posted yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {mealPlans.map((m) => (
                  <div key={m.id} className="rounded-2xl bg-card p-4 ring-1 ring-border">
                    <h3 className="font-serif text-lg font-semibold text-pretty">{m.title}</h3>
                    {m.description && <p className="mt-1 text-sm text-muted-foreground text-pretty">{m.description}</p>}
                    {m.content && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-pretty">{m.content}</p>}
                    {m.file_url && (
                      <a href={m.file_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
                        <FileText className="h-3.5 w-3.5" /> download plan
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ))}

          {active === 'grocery' &&
            (groceryLists.length === 0 ? (
              <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">no grocery lists posted yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {groceryLists.map((g) => (
                  <div key={g.id} className="rounded-2xl bg-card p-4 ring-1 ring-border">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-serif text-lg font-semibold text-pretty">{g.title}</h3>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-pretty">{g.items}</p>
                    <ImportListButton groceryListId={g.id} />
                  </div>
                ))}
              </div>
            ))}
        </>
      )}
    </div>
  )
}
