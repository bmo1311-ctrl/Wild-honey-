'use client'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Award, Heart, HandHeart, Sparkle, Flame } from 'lucide-react'
import { addWin } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Win, WinKind } from '@/lib/types'
import { relativeTime } from '@/lib/pillars'
import { cn } from '@/lib/utils'

const KINDS: { value: WinKind; label: string; icon: typeof Award }[] = [
  { value: 'win', label: "today's win", icon: Award },
  { value: 'gratitude', label: 'gratitude', icon: Heart },
  { value: 'prayer', label: 'answered prayer', icon: HandHeart },
  { value: 'compliment', label: 'compliment received', icon: Sparkle },
  { value: 'courage', label: 'moment of courage', icon: Flame },
]

export function WinsJournal({ wins }: { wins: Win[] }) {
  const [kind, setKind] = useState<WinKind>('win')
  const [text, setText] = useState('')
  const [pending, startTransition] = useTransition()

  function handleAdd() {
    if (!text.trim()) {
      toast.error('Write something first.')
      return
    }
    startTransition(async () => {
      const res = await addWin({ text, kind })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setText('')
      toast.success('Added to your wins journal.')
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
        <div className="flex flex-wrap gap-1.5">
          {KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              onClick={() => setKind(k.value)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-border transition-colors',
                kind === k.value ? 'bg-foreground text-background ring-foreground' : 'bg-transparent text-muted-foreground',
              )}
            >
              <k.icon className="h-3 w-3" />
              {k.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="write it down..." className="h-11" />
          <Button onClick={handleAdd} disabled={pending} className="h-11 shrink-0">
            add
          </Button>
        </div>
      </div>

      {wins.length === 0 ? (
        <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">nothing logged yet — start with one small win from today.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {wins.map((w) => {
            const meta = KINDS.find((k) => k.value === w.kind) ?? KINDS[0]
            return (
              <div key={w.id} className="flex items-start gap-3 rounded-xl bg-card p-3 ring-1 ring-border">
                <span className="hex-clip mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center bg-honey/20 text-honey">
                  <meta.icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-pretty">{w.text}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {meta.label} · {relativeTime(w.created_at)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
