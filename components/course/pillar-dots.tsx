import type { Pillar4 } from '@/lib/courses'

export function PillarDots({ pillars, size = 'sm' }: { pillars: Pillar4[]; size?: 'sm' | 'md' }) {
  if (pillars.length === 0) return null
  const d = size === 'md' ? 'h-2.5 w-2.5' : 'h-2 w-2'
  return (
    <span className="inline-flex items-center gap-1" aria-label={pillars.join(', ')}>
      {pillars.map((p) => (
        <span key={p} className={`${d} rounded-full`} style={{ backgroundColor: `var(--pillar-${p.toLowerCase()})` }} title={p} />
      ))}
    </span>
  )
}
