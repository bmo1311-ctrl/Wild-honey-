import { cn } from '@/lib/utils'

export function HoneycombMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'hex-clip inline-flex items-center justify-center bg-honey text-honey-foreground',
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 3l7 4v10l-7 4-7-4V7z" strokeLinejoin="round" />
        <path d="M12 8l3.5 2v4L12 16l-3.5-2v-4z" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <HoneycombMark className="h-8 w-8" />
      <span className="font-serif text-lg font-semibold leading-none tracking-tight">
        Wild Honey
        <span className="block text-[0.68rem] font-sans font-medium uppercase tracking-[0.28em] text-muted-foreground">
          Circle
        </span>
      </span>
    </span>
  )
}
