'use client'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Checkin } from '@/lib/types'

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function TrendChart({ title, data, dataKey, color }: { title: string; data: Checkin[]; dataKey: keyof Checkin; color: string }) {
  const points = data.filter((c) => c[dataKey] !== null && c[dataKey] !== undefined).map((c) => ({ day: formatDay(c.date), value: c[dataKey] as number }))
  if (points.length === 0) return null
  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <div className="mt-2 h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis dataKey="day" tick={{ fontSize: 10 }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function WellnessTrends({ checkins }: { checkins: Checkin[] }) {
  if (checkins.length === 0) {
    return <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">log a few check-ins to start seeing your trends here.</p>
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      <TrendChart title="energy" data={checkins} dataKey="energy" color="oklch(0.55 0.22 25)" />
      <TrendChart title="sleep quality" data={checkins} dataKey="sleep_quality" color="oklch(0.5 0.18 255)" />
      <TrendChart title="stress" data={checkins} dataKey="stress" color="oklch(0.5 0.2 335)" />
      <TrendChart title="hydration (oz)" data={checkins} dataKey="hydration_oz" color="oklch(0.55 0.15 155)" />
    </div>
  )
}
