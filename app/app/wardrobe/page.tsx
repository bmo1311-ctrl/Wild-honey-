import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { WardrobeBoard } from '@/components/wardrobe-board'
import { getStyleProfile, getWardrobe } from '@/lib/data'
import { getSeason } from '@/lib/color-season'
import type { Body, Scale, Shape, VerticalProportion } from '@/lib/silhouette'
import { LAYERS, countOutfits, findGaps, wearStats } from '@/lib/wardrobe'
import { localToday } from '@/lib/today'

/**
 * The capsule wardrobe.
 *
 * The number that matters is not how many pieces she owns, it is how many
 * outfits they make — which is why that is the only figure on the page and
 * why the gap analysis names one piece rather than a shopping list.
 */
export default async function WardrobePage() {
  const [garments, style, today] = await Promise.all([getWardrobe(), getStyleProfile(), localToday()])

  const season = getSeason(style?.season)
  const body: Body | null =
    style?.shape && style?.vertical && style?.scale
      ? {
          shape: style.shape as Shape,
          vertical: style.vertical as VerticalProportion,
          scale: style.scale as Scale,
        }
      : null

  const outfits = countOutfits(garments)
  const gaps = garments.length >= 5 ? findGaps(garments, 2) : []
  const wear = wearStats(garments, today)

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-serif text-[29px] font-semibold leading-[1.1]">Wardrobe</h1>
        <p className="mt-1.5 text-[15px] leading-[1.5] text-pretty text-muted-foreground">
          {garments.length === 0
            ? 'your own clothes, and an engine that knows what they do on you.'
            : `${garments.length} ${garments.length === 1 ? 'piece' : 'pieces'} · ${outfits} ${outfits === 1 ? 'outfit' : 'outfits'} they can make`}
        </p>
      </header>

      {/*
        The setup link stays at the top until it is done, because without a
        season and a frame the whole board is just a photo album — everything
        clever on this page is downstream of these two answers.
      */}
      {(!season || !body) && (
        <Link
          href="/app/wardrobe/you"
          className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-4 py-4"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold">your colours and your frame</span>
            <span className="mt-0.5 block text-[13px] text-pretty text-muted-foreground">
              three questions about your colouring, three about your outline. Everything else on
              this page reads from them.
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
      )}

      <WardrobeBoard garments={garments} season={season} body={body} today={today} />

      {gaps.length > 0 && (
        <section className="rounded-3xl bg-card p-4 ring-1 ring-border">
          <h2 className="font-serif text-[17px] font-semibold">the one thing that would open it up</h2>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            Counted, not guessed — this is how many new outfits each would actually unlock.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {gaps.map((g) => (
              <li key={`${g.layer}-${g.occasion}`} className="flex items-baseline gap-2 text-[13.5px] leading-[1.45]">
                <span className="font-semibold">
                  {LAYERS.find((l) => l.key === g.layer)?.label.toLowerCase()}
                </span>
                <span className="text-muted-foreground">
                  you can wear for {g.occasion} — {g.unlocks} more{' '}
                  {g.unlocks === 1 ? 'outfit' : 'outfits'}
                  {season ? `, ideally in one of your neutrals` : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {wear.restingSince.length > 0 && (
        <section className="rounded-3xl bg-card p-4 ring-1 ring-border">
          <h2 className="font-serif text-[17px] font-semibold">resting</h2>
          <p className="mt-1 text-[12.5px] text-pretty text-muted-foreground">
            Not a telling-off. A dress worn twice a year for something that matters is doing its
            job — this is only here so nothing good disappears to the back.
          </p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {wear.restingSince.slice(0, 8).map(({ garment, days }) => (
              <div key={garment.id} className="w-20 shrink-0">
                <div
                  className="h-24 w-20 overflow-hidden rounded-2xl ring-1 ring-black/5"
                  style={{ backgroundColor: garment.hex ?? 'var(--muted)' }}
                >
                  {garment.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={garment.imageUrl} alt={garment.name} className="h-full w-full object-cover" />
                  )}
                </div>
                <p className="mt-1 truncate text-[11.5px] font-medium">{garment.name}</p>
                <p className="text-[11px] text-muted-foreground">{days} days</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {(season || body) && (
        <Link
          href="/app/wardrobe/you"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold">
              {season?.name ?? 'your frame'}
            </span>
            <span className="mt-0.5 block text-[13px] text-muted-foreground">
              your palette, your lines, and what they mean
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
      )}
    </div>
  )
}
