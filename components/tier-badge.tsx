import { Crown } from 'lucide-react'
import { cn } from '@/lib/utils'

const TIER_LABEL: Record<string, string> = {
  free: 'Free',
  circle: 'Circle',
  'inner-circle': 'Inner Circle',
  founder: 'Founder',
}

export function TierBadge({ tier, className }: { tier?: string | null; className?: string }) {
  if (!tier || tier === 'free') return null
  const isFounder = tier === 'founder'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide',
        isFounder ? 'bg-[var(--founder)] text-[var(--founder-foreground)]' : 'bg-secondary text-secondary-foreground',
        className,
      )}
    >
      {isFounder && <Crown className="h-3 w-3" />}
      {TIER_LABEL[tier] ?? tier}
    </span>
  )
}
