'use client'

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

/** The line she came to see. Weight over time, in her unit. */
export function WeightChart({ points, unit }: { points: { date: string; value: number }[]; unit: 'lb' | 'kg' }) {
  if (points.length < 2) return null
  const data = points.map((p) => ({ date: p.date.slice(5), value: Math.round(p.value * 10) / 10 }))
  return (
    <div className="h-44 w-full rounded-2xl border border-border bg-card p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip formatter={(v: number) => [`${v} ${unit}`, '']} labelStyle={{ fontSize: 12 }} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
          <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
