import Link from 'next/link'
import { ClipboardList } from 'lucide-react'
import { WellnessCheckinForm } from '@/components/wellness-checkin-form'
import { WellnessTrends } from '@/components/wellness-trends'
import { SymptomIntelligence } from '@/components/symptom-intelligence'
import { WinsJournal } from '@/components/wins-journal'
import { HabitStack } from '@/components/habit-stack'
import { getHabits, getRecentCheckins, getRecentHabitLogs, getRecentWins, getTodayCheckin } from '@/lib/data'

export default async function EnergyPage() {
  const [today, recent, wins, habits, habitLogs] = await Promise.all([
    getTodayCheckin(),
    getRecentCheckins(30),
    getRecentWins(30),
    getHabits(),
    getRecentHabitLogs(30),
  ])

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Energy &amp; Wellness</h1>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">track how you're doing, see your trends, and build a record of your wins.</p>
        </div>
        <Link href="/app/protocols" className="flex shrink-0 items-center gap-1.5 rounded-full bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground">
          <ClipboardList className="h-3.5 w-3.5" />
          protocols
        </Link>
      </div>

      <WellnessCheckinForm existing={today} />

      {today?.symptoms && today.symptoms.length > 0 && (
        <div>
          <h2 className="mb-3 font-serif text-lg font-semibold">for what you're feeling today</h2>
          <SymptomIntelligence symptoms={today.symptoms} recentCheckins={recent} />
        </div>
      )}

      <HabitStack habits={habits} logs={habitLogs} />

      <div>
        <h2 className="mb-3 font-serif text-lg font-semibold">your trends</h2>
        <WellnessTrends checkins={recent} />
      </div>

      <div>
        <h2 className="mb-3 font-serif text-lg font-semibold">wins journal</h2>
        <WinsJournal wins={wins} />
      </div>
    </div>
  )
}
