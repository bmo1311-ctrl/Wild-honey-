'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { AlertCircle, Check, ChevronDown, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Failure state for every screen under /app.
 *
 * This is deliberately not an empty state. An empty state may only claim
 * emptiness when the query succeeded — a missing table or a blocked RLS
 * policy has to say so, because one string ('42P01 relation "challenges"
 * does not exist') is the difference between an hour of guessing and a
 * two-minute fix. Never remove the details block.
 */

/** Names the thing that failed, so the message isn't generic when we know better. */
const SECTION_LABELS: Record<string, string> = {
  challenges: 'your challenges',
  recipes: 'your recipes',
  vault: 'the vault',
  groups: 'your groups',
  circle: 'the circle',
  community: 'the circle',
  workouts: 'your workouts',
  pantry: 'your pantry',
  calendar: 'your calendar',
  progress: 'your progress',
  protocols: 'your protocols',
  membership: 'your membership',
  profile: 'your profile',
  settings: 'your settings',
  retreats: 'the retreats',
  shop: 'the shop',
  archive: 'the archive',
  energy: 'your energy log',
  ask: 'your questions',
}

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    console.error('[app] render failed:', error)
  }, [error])

  const section = SECTION_LABELS[pathname?.split('/')[2] ?? '']
  const title = section ? `We couldn't load ${section}` : "We couldn't load this page"

  const details = [error.message || String(error), error.digest ? `digest ${error.digest}` : null, pathname].filter(Boolean).join('\n')

  async function copy(text: string, note: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success(note)
    } catch {
      toast.error('Could not copy — select the text and copy it manually.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-border border-t-[3px] border-t-primary bg-card p-5">
        <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden="true">
          <AlertCircle className="h-5 w-5" />
        </span>

        <h2 className="font-serif text-[22px] font-semibold leading-tight text-balance">{title}</h2>
        <p className="mt-2 text-[15.5px] leading-[1.5] text-pretty text-muted-foreground">
          This is a problem on our side, not something you did — and nothing you&rsquo;ve logged is affected.
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-5 h-[52px] w-full rounded-2xl bg-primary text-[17px] font-bold text-primary-foreground transition-opacity hover:opacity-90 active:translate-y-px"
        >
          Try again
        </button>

        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => copy(`${title}\n\n${details}`, "Details copied — send them to us and we'll take it from here.")}
            className="text-sm font-medium text-muted-foreground underline underline-offset-[3px]"
          >
            Tell the team
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground"
          >
            Show details
            <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
          </button>
        </div>

        {open && (
          <div className="mt-3 rounded-xl bg-foreground p-3">
            <pre className="max-h-40 overflow-auto font-mono text-[11.5px] leading-[1.45] whitespace-pre-wrap break-words text-background">{details}</pre>
            <button
              type="button"
              onClick={() => copy(details, 'Copied.')}
              className="mt-2 flex items-center gap-1.5 text-[11.5px] font-medium text-background/70"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground">Everything else in the app is working.</p>
    </div>
  )
}
