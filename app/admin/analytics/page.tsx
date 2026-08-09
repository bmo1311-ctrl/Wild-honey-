import { AnalyticsCharts } from '@/components/admin/analytics-charts'
import { adminGetAnalytics } from '@/lib/data'

export default async function AdminAnalyticsPage() {
  const data = await adminGetAnalytics()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">growth, engagement, and revenue at a glance.</p>
      </div>
      <AnalyticsCharts
        signupsByWeek={data.signupsByWeek}
        checkinsByDay={data.checkinsByDay}
        entriesByPillar={data.entriesByPillar}
        streakDistribution={data.streakDistribution}
        revenueByMonth={data.revenueByMonth}
        engagement={data.engagement}
      />
    </div>
  )
}
