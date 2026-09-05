import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { BodyGoalsForm } from '@/components/body-goals-form'
import { CycleSettingsForm } from '@/components/cycle-settings-form'
import type { CyclePhaseKey } from '@/lib/cycle'
import { getSessionProfile } from '@/lib/data'
import { kgToLb, type ActivityLevel, type BodyGoal } from '@/lib/goals'

export default async function GoalsPage() {
  const profile = (await getSessionProfile()) as (Awaited<ReturnType<typeof getSessionProfile>> & {
    weight_kg?: number | null
    weight_unit?: 'lb' | 'kg' | null
    height_cm?: number | null
    birth_year?: number | null
    activity_level?: string | null
    body_goal?: string | null
    last_period_start?: string | null
    cycle_length_days?: number | null
    cycle_adjustments?: Partial<Record<CyclePhaseKey, number>> | null
  }) | null

  const unit = (profile?.weight_unit as 'lb' | 'kg') ?? 'lb'
  const weight = profile?.weight_kg ? (unit === 'lb' ? kgToLb(profile.weight_kg) : profile.weight_kg) : null

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/app/nutrition/log" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ChevronLeft className="h-4 w-4" /> Log
        </Link>
        <h1 className="font-serif text-[29px] font-semibold leading-[1.1]">Your targets</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          tell the app what you&rsquo;re working toward and it works out what a day should look like.
        </p>
      </div>

      <BodyGoalsForm
        initial={{
          weight: weight ? String(weight) : '',
          weightUnit: unit,
          heightCm: profile?.height_cm ? String(profile.height_cm) : '',
          birthYear: profile?.birth_year ? String(profile.birth_year) : '',
          activity: (profile?.activity_level as ActivityLevel) ?? null,
          goal: (profile?.body_goal as BodyGoal) ?? null,
        }}
      />

      <CycleSettingsForm
        initial={{
          lastPeriodStart: profile?.last_period_start?.slice(0, 10) ?? '',
          cycleLength: profile?.cycle_length_days ? String(profile.cycle_length_days) : '',
          adjustments: profile?.cycle_adjustments ?? {},
        }}
      />
    </div>
  )
}
