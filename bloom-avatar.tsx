import { cn } from '@/lib/utils'

export function avatarColor(c: string): string {
  switch (c) {
    case 'terracotta':
      return 'oklch(0.68 0.12 25)'
    case 'sage':
      return 'oklch(0.62 0.09 145)'
    case 'plum':
      return 'oklch(0.58 0.11 285)'
    default:
      return 'oklch(0.78 0.15 75)'
  }
}

export function BloomAvatar({
  name,
  color,
  className,
}: {
  name: string
  color: string
  className?: string
}) {
  const initial = (name || 'H').trim().charAt(0).toUpperCase()
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-serif text-sm font-semibold text-white',
        className,
      )}
      style={{ background: avatarColor(color) }}
      aria-hidden="true"
    >
      {initial}
    </span>
  )
}
