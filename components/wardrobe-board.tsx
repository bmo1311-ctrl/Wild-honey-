'use client'

import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Check, Heart, Plus, Shuffle, X } from 'lucide-react'
import { logWear, saveOutfit, updateGarment } from '@/app/actions'
import { WardrobeAdd } from '@/components/wardrobe-add'
import { LAYERS, OCCASIONS, type Garment, type Layer, type Occasion } from '@/lib/wardrobe'
import { buildOutfit, suggestOutfits } from '@/lib/outfit'
import type { Season } from '@/lib/color-season'
import type { Body } from '@/lib/silhouette'
import { cn } from '@/lib/utils'

/**
 * The board.
 *
 * She asked for something Pinterest-ish — a place to play with her own
 * clothes rather than a spreadsheet of them. So the pieces are photographs
 * at photograph size, in a masonry column layout, and tapping them builds an
 * outfit in a tray at the bottom that explains itself as it fills.
 *
 * The explaining is the part that matters. Anyone can shuffle garments; the
 * reason to do it here is that the app can say why a combination works on
 * her particular colouring and her particular frame, in a sentence she can
 * take into a shop.
 */
export function WardrobeBoard({
  garments,
  season,
  body,
  today,
}: {
  garments: Garment[]
  season: Season | null
  body: Body | null
  today: string
}) {
  const [pending, start] = useTransition()
  const [adding, setAdding] = useState(false)
  const [filter, setFilter] = useState<Layer | 'all'>('all')
  const [occasion, setOccasion] = useState<Occasion>('everyday')
  const [picked, setPicked] = useState<string[]>([])

  const shown = useMemo(
    () => garments.filter((g) => filter === 'all' || g.layer === filter),
    [garments, filter],
  )

  const pickedGarments = picked
    .map((id) => garments.find((g) => g.id === id))
    .filter((g): g is Garment => Boolean(g))

  const outfit =
    season && body && pickedGarments.length >= 2
      ? buildOutfit(pickedGarments, occasion, season, body)
      : null

  function toggle(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  function shuffle() {
    if (!season || !body) {
      toast.error('Set your colours and frame first — the shuffle needs them to have an opinion.')
      return
    }
    const options = suggestOutfits({ garments, occasion, season, body, limit: 8 })
    if (options.length === 0) {
      toast.error(`Nothing in your closet is tagged for ${occasion} yet.`)
      return
    }
    // Not always the top one, or it would show the same outfit forever.
    const pick = options[Math.floor(Math.random() * Math.min(4, options.length))]
    setPicked(pick.pieces.map((p) => p.id))
  }

  function wearIt() {
    start(async () => {
      const res = await logWear(picked, today)
      if (res && 'error' in res && res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Worn today.')
    })
  }

  function keepIt() {
    start(async () => {
      const res = await saveOutfit({ itemIds: picked, occasion })
      if (res && 'error' in res && res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Saved to your looks.')
      setPicked([])
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="-mx-5 flex flex-1 gap-1.5 overflow-x-auto px-5 pb-0.5 [scrollbar-width:none]">
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
            everything
          </Chip>
          {LAYERS.filter((l) => garments.some((g) => g.layer === l.key)).map((l) => (
            <Chip key={l.key} active={filter === l.key} onClick={() => setFilter(l.key)}>
              {l.plural}
            </Chip>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setAdding((a) => !a)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background"
          aria-label="add a piece"
        >
          {adding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>

      {adding && <WardrobeAdd onDone={() => setAdding(false)} />}

      {shown.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-8 text-center">
          <p className="font-serif text-lg font-semibold">start with five things you actually wear</p>
          <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-pretty text-muted-foreground">
            Not the whole closet. Five pieces is enough for the engine to start
            making outfits, and it is far enough in to see whether this is worth
            finishing.
          </p>
        </div>
      ) : (
        /*
          Masonry rather than a grid, so a tall coat and a square shoe photo
          both get to be their own shape. CSS columns handle it without
          measuring anything, which is what keeps it fast on a phone.
        */
        <div className="columns-2 gap-2.5 sm:columns-3 [&>*]:mb-2.5">
          {shown.map((g) => (
            <Tile
              key={g.id}
              g={g}
              picked={picked.includes(g.id)}
              onPick={() => toggle(g.id)}
              onLove={() =>
                start(async () => {
                  await updateGarment(g.id, { loved: !g.loved })
                })
              }
            />
          ))}
        </div>
      )}

      {/*
        The tray. Sits above the tab bar and only exists once she has picked
        something, so the board is never crowded by a control she is not using.
      */}
      {picked.length > 0 && (
        <div className="sticky bottom-2 z-20 flex flex-col gap-3 rounded-3xl bg-card/95 p-4 shadow-lg ring-1 ring-border backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 gap-1.5 overflow-hidden">
              {pickedGarments.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggle(g.id)}
                  className="h-10 w-10 shrink-0 overflow-hidden rounded-xl ring-1 ring-black/10"
                  style={{ backgroundColor: g.hex ?? 'var(--muted)' }}
                >
                  {g.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.imageUrl} alt={g.name} className="h-full w-full object-cover" />
                  )}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPicked([])}
              className="shrink-0 text-[12px] text-muted-foreground"
            >
              clear
            </button>
          </div>

          {outfit ? (
            <div className="flex flex-col gap-1">
              <p className="text-[13.5px] leading-[1.45] text-pretty">{outfit.colourStory}</p>
              {outfit.lineStory && (
                <p className="text-[13.5px] leading-[1.45] text-pretty text-muted-foreground">{outfit.lineStory}</p>
              )}
              {outfit.caveat && (
                <p className="mt-0.5 text-[12.5px] leading-[1.45] text-pretty text-muted-foreground">
                  {outfit.caveat}
                </p>
              )}
            </div>
          ) : (
            <p className="text-[13px] text-muted-foreground">
              {season && body ? 'pick one more piece.' : 'set your colours and frame and this will start explaining itself.'}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={wearIt}
              disabled={pending}
              className="h-11 flex-1 rounded-2xl bg-primary text-[14.5px] font-bold text-primary-foreground disabled:opacity-50"
            >
              wearing this
            </button>
            <button
              type="button"
              onClick={keepIt}
              disabled={pending}
              className="h-11 rounded-2xl bg-secondary px-4 text-[14.5px] font-medium text-secondary-foreground disabled:opacity-50"
            >
              keep it
            </button>
          </div>
        </div>
      )}

      {garments.length >= 4 && picked.length === 0 && (
        <div className="flex items-center gap-2">
          <select
            value={occasion}
            onChange={(e) => setOccasion(e.target.value as Occasion)}
            className="h-11 flex-1 rounded-2xl border border-border bg-background px-3 text-[14px] outline-none"
          >
            {OCCASIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label} — {o.note}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={shuffle}
            className="flex h-11 items-center gap-1.5 rounded-2xl bg-foreground px-4 text-[14px] font-semibold text-background"
          >
            <Shuffle className="h-4 w-4" />
            dress me
          </button>
        </div>
      )}
    </div>
  )
}

function Tile({
  g,
  picked,
  onPick,
  onLove,
}: {
  g: Garment
  picked: boolean
  onPick: () => void
  onLove: () => void
}) {
  return (
    <div className="relative break-inside-avoid">
      <button
        type="button"
        onClick={onPick}
        className={cn(
          'closet-tile block w-full overflow-hidden rounded-3xl text-left ring-1 ring-inset ring-black/5',
          picked && 'ring-2 ring-primary',
        )}
        style={{ backgroundColor: g.hex ?? 'var(--card)' }}
      >
        {g.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={g.imageUrl} alt={g.name} className="w-full object-cover" />
        ) : (
          <span className="block h-32 w-full" />
        )}
        <span className="block bg-card/90 px-3 py-2 backdrop-blur">
          <span className="block truncate text-[13px] font-medium">{g.name}</span>
          {g.wornCount ? (
            <span className="mt-0.5 block text-[11px] text-muted-foreground">
              worn {g.wornCount}×
            </span>
          ) : null}
        </span>
      </button>

      {picked && (
        <span className="pointer-events-none absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3.5 w-3.5" />
        </span>
      )}

      <button
        type="button"
        onClick={onLove}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-card/80 backdrop-blur"
        aria-label={g.loved ? 'remove from loved' : 'love this'}
      >
        <Heart className={cn('h-3.5 w-3.5', g.loved ? 'fill-primary text-primary' : 'text-muted-foreground')} />
      </button>
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 transition-colors',
        active ? 'bg-foreground text-background ring-foreground' : 'text-muted-foreground ring-border',
      )}
    >
      {children}
    </button>
  )
}
