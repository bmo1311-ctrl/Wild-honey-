import { MeasurementLogger } from '@/components/measurement-logger'
import { WeightChart } from '@/components/weight-chart'
import { getMeasurements, getSessionProfile } from '@/lib/data'
import { kgToLb } from '@/lib/goals'

/** Watch yourself change. Weight trend, tape measurements, first against latest. */
export default async function BodyPage() {
  const [rows, profile] = await Promise.all([getMeasurements(), getSessionProfile()])
  const unit = ((profile as { weight_unit?: 'lb' | 'kg' | null })?.weight_unit ?? 'lb') as 'lb' | 'kg'
  const conv = (kg: number) => (unit === 'lb' ? kgToLb(kg) : kg)
  const weights = rows.filter((r) => r.weight_kg != null).map((r) => ({ date: r.date, value: conv(Number(r.weight_kg)) }))
  const first = weights[0]
  const last = weights[weights.length - 1]
  const change = first && last && weights.length > 1 ? Math.round((last.value - first.value) * 10) / 10 : null
  const latest = rows[rows.length - 1]
  const earliest = rows[0]
  const tape = (['waist_cm', 'hips_cm', 'chest_cm', 'arm_cm', 'thigh_cm'] as const)
    .map((k) => ({ label: k.replace('_cm', ''), from: earliest?.[k], to: latest?.[k] }))
    .filter((t) => t.to != null)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-serif text-[29px] font-semibold leading-[1.1]">Body</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">the line, not the number. weight and tape, once a week.</p>
      </div>

      {last && (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-border bg-card px-2 py-3 text-center">
            <p className="font-serif text-[22px] font-semibold leading-none">{last.value}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">now · {unit}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-2 py-3 text-center">
            <p className="font-serif text-[22px] font-semibold leading-none">{first?.value ?? '—'}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">start</p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-2 py-3 text-center">
            <p className="font-serif text-[22px] font-semibold leading-none">{change == null ? '—' : `${change > 0 ? '+' : ''}${change}`}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">change</p>
          </div>
        </div>
      )}

      <WeightChart points={weights} unit={unit} />

      {tape.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Tape</p>
          <div className="flex flex-col gap-1.5">
            {tape.map((t) => (
              <div key={t.label} className="flex items-baseline justify-between text-[15px]">
                <span className="font-medium capitalize">{t.label}</span>
                <span className="text-muted-foreground">{t.from != null && t.from !== t.to ? `${t.from} → ` : ''}<span className="font-semibold text-foreground">{t.to}</span> cm</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <MeasurementLogger unit={unit} />

      {rows.length === 0 && (
        <p className="text-center text-[13px] text-muted-foreground text-pretty">first entry becomes your starting point. the app never shows this to anyone.</p>
      )}
    </div>
  )
}
