import { Sparkles } from 'lucide-react'

/**
 * Pinned at the top of the Circle. A standing invitation to say what went
 * right — the one post nobody needs permission to make.
 */
export function PraiseReportCard() {
  return (
    <div className="honey-glow rounded-2xl border border-border bg-card p-4">
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-pink">
        <Sparkles className="h-3.5 w-3.5" /> Praise report · pinned
      </p>
      <p className="mt-1.5 font-serif text-[19px] font-semibold leading-snug text-balance">What went right this week?</p>
      <p className="mt-1 text-[14px] leading-[1.45] text-pretty text-muted-foreground">
        Answered prayer, a day you didn&rsquo;t skip, a thing that finally clicked. Say it here so the rest of the circle gets to
        carry it too. Start your post with <span className="font-semibold text-foreground">Praise:</span>
      </p>
    </div>
  )
}
