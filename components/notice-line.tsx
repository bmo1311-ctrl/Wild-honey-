import Link from 'next/link'
import type { Notice } from '@/lib/noticing'

/**
 * The one thing worth saying today.
 *
 * No avatar, no name, no bubble — it sits in the page's own voice rather than
 * pretending to be someone. That was the deliberate choice: a character
 * greeting her would compete with the real woman she joined, and lose.
 *
 * Renders nothing at all when there is nothing true to say, which is most
 * days. Silence is the point.
 */
export function NoticeLine({ notice }: { notice: Notice | null }) {
  if (!notice) return null

  const body = (
    <p className="text-[15px] leading-relaxed text-pretty">{notice.text}</p>
  )

  if (!notice.href) {
    return <div className="rounded-2xl bg-card px-4 py-3.5 ring-1 ring-border">{body}</div>
  }

  return (
    <Link
      href={notice.href}
      className="block rounded-2xl bg-card px-4 py-3.5 ring-1 ring-border transition-colors hover:ring-mindset-pillar"
    >
      {body}
    </Link>
  )
}
