'use client'

import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatMonth(monthStr: string): string {
  const [y, m] = monthStr.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="mt-3 h-48 w-full">{children}</div>
    </div>
  )
}

export function AnalyticsCharts({
  signupsByWeek,
  checkinsByDay,
  entriesByPillar,
  streakDistribution,
  revenueByMonth,
  engagement,
}: {
  signupsByWeek: { week: string; count: number }[]
  checkinsByDay: { date: string; count: number }[]
  entriesByPillar: { pillar: string; count: number }[]
  streakDistribution: { bucket: string; count: number }[]
  revenueByMonth: { month: string; dollars: number }[]
  engagement: { communityPosts: number; groupPosts: number; savedRecipes: number; challengeJoins: number; savedResources: number }
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
          <p className="font-serif text-xl font-semibold">{engagement.communityPosts}</p>
          <p className="text-xs text-muted-foreground">community posts</p>
        </div>
        <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
          <p className="font-serif text-xl font-semibold">{engagement.groupPosts}</p>
          <p className="text-xs text-muted-foreground">group posts</p>
        </div>
        <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
          <p className="font-serif text-xl font-semibold">{engagement.savedRecipes}</p>
          <p className="text-xs text-muted-foreground">recipes saved</p>
        </div>
        <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
          <p className="font-serif text-xl font-semibold">{engagement.challengeJoins}</p>
          <p className="text-xs text-muted-foreground">challenge joins</p>
        </div>
        <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
          <p className="font-serif text-xl font-semibold">{engagement.savedResources}</p>
          <p className="text-xs text-muted-foreground">resources saved</p>
        </div>
      </div>

      <ChartCard title="revenue by month">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={revenueByMonth.map((r) => ({ ...r, label: formatMonth(r.month) }))} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={36} tickFormatter={(v) => `$${v}`} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => [`$${v.toFixed(2)}`, 'revenue']} />
            <Bar dataKey="dollars" fill="oklch(0.55 0.22 25)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="new members by week">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={signupsByWeek.map((s) => ({ ...s, label: formatWeek(s.week) }))} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={24} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Line type="monotone" dataKey="count" stroke="oklch(0.55 0.15 155)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="daily check-ins (last 30 days)">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={checkinsByDay.map((c) => ({ ...c, label: formatDay(c.date) }))} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={24} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Line type="monotone" dataKey="count" stroke="oklch(0.5 0.18 255)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="journal entries by pillar">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={entriesByPillar} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
            <XAxis dataKey="pillar" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={24} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="count" fill="oklch(0.5 0.2 335)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="streak distribution">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={streakDistribution} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
            <XAxis dataKey="bucket" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={24} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="count" fill="oklch(0.72 0.1 225)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
