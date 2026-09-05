/**
 * Interim screen. The course engine (week + day views, the 56-dot strip and
 * the block renderer) replaces this wholesale — it needs
 * lib/courses/strong-and-surrendered.json, which is not in the repo yet.
 */
export default function ProgramPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Program</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">strong and surrendered — eight weeks, fifty-six days.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <p className="font-serif text-xl font-semibold">Not built yet</p>
        <p className="mx-auto mt-2 max-w-xs text-[15px] leading-[1.5] text-muted-foreground text-pretty">
          The course lands here next — the day you&rsquo;re on, the week you&rsquo;re in, and everything
          you&rsquo;ve already ticked off.
        </p>
      </div>
    </div>
  )
}
