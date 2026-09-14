import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { BodyGoalsForm } from '@/components/body-goals-form'
import { CycleSettingsForm } from '@/components/cycle-settings-form'
import type { CyclePhaseKey } from '@/lib/cycle'
import { getCyclePhase, getSessionProfile } from '@/lib/data'
import { calculateTargets, kgToLb, type ActivityLevel, type BodyGoal } from '@/lib/goals'

export default async function GoalsPage() {
  const [rawProfile, cycle] = await Promise.all([getSessionProfile(), getCyclePhase()])
  const profile = rawProfile as (Awaited<ReturnType<typeof getSessionProfile>> & {
    weight_kg?: number | null
    weight_unit?: 'lb' | 'kg' | null
    height_cm?: number | null
    birth_year?: number | null
    activity_level?: string | null
    body_goal?: string | null
    last_period_start?: string | null
    cycle_length_days?: number | null
    cycle_adjustments?: Partial<Record<CyclePhaseKey, number>> | null
    period_length_days?: number | null
    luteal_length_days?: number | null
    cycle_is_regular?: boolean | null
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

      {/*
        Keyed on the saved values, so the form remounts when they change.
        Without this its useState initialisers hold the values from first
        render for ever — and the phase switch *inside* this card writes
        `last_period_start` behind them. Tapping "my period started today"
        left the date field below showing the old date, and the next save on
        this page wrote that stale date back over today's day one.
      */}
      <CycleSettingsForm
        key={[
          profile?.last_period_start ?? '',
          profile?.cycle_length_days ?? '',
          profile?.period_length_days ?? '',
          profile?.luteal_length_days ?? '',
          String(profile?.cycle_is_regular ?? ''),
        ].join('|')}
        baseCalories={
          calculateTargets({
            weightKg: profile?.weight_kg ?? null,
            heightCm: profile?.height_cm ?? null,
            birthYear: profile?.birth_year ?? null,
            activity: (profile?.activity_level as ActivityLevel) ?? null,
            goal: (profile?.body_goal as BodyGoal) ?? null,
          }).calories
        }
        current={cycle}
        initial={{
          lastPeriodStart: profile?.last_period_start?.slice(0, 10) ?? '',
          // Blank rather than pre-filled with the average, so an untouched
          // field reads as "not said" instead of as her answer.
          cycleLength: profile?.cycle_length_days ? String(profile.cycle_length_days) : '',
          periodLength: profile?.period_length_days ? String(profile.period_length_days) : '',
          lutealLength: profile?.luteal_length_days ? String(profile.luteal_length_days) : '',
          isRegular: profile?.cycle_is_regular ?? null,
          adjustments: profile?.cycle_adjustments ?? {},
        }}
      />
    </div>
  )
}
