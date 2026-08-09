import { cn } from '@/lib/utils'

export function avatarColor(c: string): string {
  switch (c) {
    case 'icyblue':
      return 'oklch(0.75 0.09 220)'
    case 'sapphire':
      return 'oklch(0.5 0.2 260)'
    case 'emerald':
      return 'oklch(0.6 0.14 165)'
    case 'fuchsia':
      return 'oklch(0.6 0.24 340)'
    case 'crimson':
      return 'oklch(0.55 0.22 25)'
    case 'lavender':
      return 'oklch(0.72 0.12 300)'
    default:
      return 'oklch(0.5 0.2 260)'
  }
}

export function BloomAvatar({
  name,
  color,
  avatarUrl,
  className,
}: {
  name: string
  color: string
  avatarUrl?: string | null
  className?: string
}) {
  const initial = (name || 'H').trim().charAt(0).toUpperCase()

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name || 'avatar'}
        className={cn('inline-block shrink-0 rounded-full object-cover', className)}
      />
    )
  }

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
