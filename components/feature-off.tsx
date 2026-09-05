/**
 * Shown by a route whose feature flag is off. Nothing here is deleted —
 * flipping the flag in lib/features.ts brings the screen straight back.
 */
export function FeatureOff({ title = 'Not available' }: { title?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center">
      <h1 className="font-serif text-xl font-semibold">{title}</h1>
      <p className="mx-auto mt-2 max-w-xs text-[15px] leading-[1.5] text-muted-foreground text-pretty">
        This part of the circle is turned off while we focus on the course. Nothing you saved here is
        gone — it comes back when this reopens.
      </p>
    </div>
  )
}
