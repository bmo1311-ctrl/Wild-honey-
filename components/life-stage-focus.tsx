import { readFocus, focusFor, type LifeStage } from '@/lib/life-stage'

/**
 * What she logged, against the stage she told us she is in.
 *
 * Saying "I am trying to conceive" used to change exactly one thing in this
 * app: it warned her off retinol. She named a goal and got a list of things
 * not to put on her face.
 *
 * The food log already counts folate, iron, choline and B12 on hundreds of
 * foods. This reads them back against the stage — amounts, never verdicts.
 * Nothing here says short, low, or not enough. One day of food is not a
 * diagnosis, and a woman doing this well can still have an ordinary Tuesday.
 */
export function LifeStageFocus({ stage, totals }: { stage: LifeStage; totals: Record<string, number> }) {
  const focus = focusFor(stage)
  const readings = readFocus(stage, totals)
  if (!focus || readings.length === 0) return null

  return (
    <section className="rounded-3xl bg-card p-5 ring-1 ring-border">
      <h2 className="font-serif text-[17px] font-semibold">{focus.title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground text-pretty">{focus.blurb}</p>

      <ul className="mt-4 flex flex-col gap-3">
        {readings.map(({ nutrient, got, share }) => (
          <li key={nutrient.key}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium">{nutrient.label}</span>
              <span className="text-sm tabular-nums text-muted-foreground">
                {got >= 10 ? Math.round(got) : got.toFixed(1)}
                {nutrient.unit} <span className="opacity-60">of {nutrient.reference}</span>
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round(share * 100)}%` }} />
            </div>
            <p className="mt-1 text-[12px] leading-snug text-muted-foreground text-pretty">
              {nutrient.why} <span className="opacity-70">Found in {nutrient.found}.</span>
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-4 rounded-2xl bg-muted p-3 text-[12px] leading-relaxed text-muted-foreground text-pretty">
        {focus.caveat}
      </p>
    </section>
  )
}
