import type { VitalityCheckin } from '@/lib/types'
import { VITALITY_DIMENSIONS } from '@/lib/honey-profile'

function delta(base: number | null, latest: number | null): number | null {
  if (base === null || latest === null) return null
  return latest - base
}

export function VitalityComparison({ baseline, latest }: { baseline: VitalityCheckin | null; latest: VitalityCheckin | null }) {
  if (!baseline) {
    return (
      <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
        no baseline yet — this gets set the first time you fill out your Honey Profile.
      </p>
    )
  }

  const sameEntry = latest && latest.id === baseline.id

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
      <p className="font-serif text-lg font-semibold">where you started, where you are</p>
      {sameEntry && <p className="text-xs text-muted-foreground">add a new check-in below to start seeing movement here.</p>}
      <div className="flex flex-col gap-3">
        {VITALITY_DIMENSIONS.map((d) => {
          const baseVal = (baseline as any)[d.key] as number | null
          const latestVal = latest ? ((latest as any)[d.key] as number | null) : null
          const diff = sameEntry ? null : delta(baseVal, latestVal)
          return (
            <div key={d.key} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium capitalize">{d.label}</span>
                <span className="text-muted-foreground">
                  {baseVal ?? '—'} → {sameEntry ? baseVal ?? '—' : latestVal ?? '—'}
                  {diff !== null && diff !== 0 && (
                    <span className={diff > 0 ? 'ml-1.5 font-medium text-honey' : 'ml-1.5 font-medium text-muted-foreground'}>
                      {diff > 0 ? `+${diff}` : diff}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full bg-muted-foreground/40" style={{ width: `${((baseVal ?? 0) / 10) * 100}%` }} />
              </div>
              {!sameEntry && (
                <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full bg-honey" style={{ width: `${((latestVal ?? 0) / 10) * 100}%` }} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
