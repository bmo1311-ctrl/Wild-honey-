import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

/**
 * The closet.
 *
 * Her page was twenty-one identical grey rows with a chevron on each — a
 * filing cabinet, and half of what was filed in it was not hers at all but
 * things for sale. This is the other idea: shelves you can see, tinted so the
 * eye sorts them before the words do.
 *
 * Tone is what does the sorting. Everything that is hers is pink, everything
 * about her body is blue, her people are honey, and anything of Brooke's she
 * could add is deep rose. After a week she stops reading the labels.
 */

export type Tone = 'identity' | 'mindset' | 'body' | 'faith' | 'honey'

const TONE_VAR: Record<Tone, string> = {
  identity: 'var(--pillar-identity)',
  mindset: 'var(--pillar-mindset)',
  body: 'var(--pillar-body)',
  faith: 'var(--pillar-faith)',
  honey: 'var(--honey-glow)',
}

export interface ClosetItem {
  href: string
  label: string
  icon: LucideIcon
  /** One or two words. Left off when the label already says everything. */
  note?: string
  /** Opens away from the app, so it says so. */
  external?: boolean
}

export function ClosetTile({ item, tone }: { item: ClosetItem; tone: Tone }) {
  const { icon: Icon, label, note, href, external } = item
  const colour = TONE_VAR[tone]

  const inner = (
    <>
      <span
        className="flex h-11 w-11 items-center justify-center rounded-2xl"
        style={{ backgroundColor: `color-mix(in oklch, ${colour}, white 74%)` }}
      >
        <Icon className="h-5 w-5" style={{ color: `color-mix(in oklch, ${colour}, black 12%)` }} />
      </span>
      <span className="mt-auto block">
        <span className="block font-serif text-[15px] font-semibold leading-tight text-balance">{label}</span>
        {note && <span className="mt-0.5 block text-[11.5px] leading-tight text-muted-foreground">{note}</span>}
      </span>
    </>
  )

  const className =
    'closet-tile flex min-h-[124px] flex-col gap-3 rounded-3xl p-4 ring-1 ring-inset ring-black/5'
  const style = { backgroundColor: `color-mix(in oklch, ${colour}, var(--card) 88%)` }

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={style}>
        {inner}
      </a>
    )
  }

  return (
    <Link href={href} className={className} style={style}>
      {inner}
    </Link>
  )
}

export function ClosetShelf({
  title,
  tone,
  items,
}: {
  title: string
  tone: Tone
  items: (ClosetItem | false | null | undefined)[]
}) {
  const live = items.filter(Boolean) as ClosetItem[]
  if (live.length === 0) return null

  return (
    <section>
      <h2 className="mb-2 px-1 font-serif text-[17px] font-semibold">{title}</h2>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {live.map((item) => (
          <ClosetTile key={item.href} item={item} tone={tone} />
        ))}
      </div>
    </section>
  )
}
