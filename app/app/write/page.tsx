/**
 * Interim screen. Replaced by the real Write view, which lists every
 * course_writings row newest first. Nothing on that screen may be
 * destructive — it replaces a paper workbook.
 */
export default function WritePage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Write</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">everything you write in the course, kept in one place.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <p className="font-serif text-xl font-semibold">Not built yet</p>
        <p className="mx-auto mt-2 max-w-xs text-[15px] leading-[1.5] text-muted-foreground text-pretty">
          Once the course is running, every prompt you answer collects here — newest first, nothing
          ever deleted.
        </p>
      </div>
    </div>
  )
}
