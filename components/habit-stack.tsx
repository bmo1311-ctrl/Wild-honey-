'use client'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Check, Plus, X } from 'lucide-react'
import { addHabit, archiveHabit, toggleHabitLog } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Habit, HabitLog } from '@/lib/types'
import { computeHabitStreak } from '@/lib/pillars'
import { cn } from '@/lib/utils'

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export function HabitStack({ habits, logs }: { habits: Habit[]; logs: HabitLog[] }) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [anchor, setAnchor] = useState('')
  const [pending, startTransition] = useTransition()
  const [localLogs, setLocalLogs] = useState(logs)

  const today = todayStr()
  const doneToday = new Set(localLogs.filter((l) => l.date === today).map((l) => l.habit_id))

  function handleAdd() {
    if (!title.trim()) {
      toast.error('Give the habit a name first.')
      return
    }
    startTransition(async () => {
      const res = await addHabit({ title, anchor })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setTitle('')
      setAnchor('')
      setAdding(false)
      toast.success('Habit added.')
    })
  }

  function handleToggle(habitId: string) {
    const wasDone = doneToday.has(habitId)
    // optimistic update
    setLocalLogs((prev) =>
      wasDone
        ? prev.filter((l) => !(l.habit_id === habitId && l.date === today))
        : [...prev, { id: 'temp', habit_id: habitId, user_id: '', date: today, completed_at: new Date().toISOString() }],
    )
    startTransition(async () => {
      const res = await toggleHabitLog(habitId)
      if (res?.error) {
        toast.error(res.error)
        // revert
        setLocalLogs(logs)
      }
    })
  }

  function handleArchive(habitId: string) {
    startTransition(async () => {
      const res = await archiveHabit(habitId)
      if (res?.error) toast.error(res.error)
      else toast.success('Habit archived.')
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
      <div className="flex items-center justify-between">
        <p className="font-serif text-lg font-semibold">habit stack</p>
        <button type="button" onClick={() => setAdding((a) => !a)} className="flex items-center gap-1 text-xs font-medium text-honey">
          <Plus className="h-3.5 w-3.5" />
          add
        </button>
      </div>

      {adding && (
        <div className="flex flex-col gap-2 rounded-xl bg-secondary/50 p-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="habit, e.g. drink a glass of water" className="h-10" />
          <Input value={anchor} onChange={(e) => setAnchor(e.target.value)} placeholder="stack it onto... e.g. after I make coffee" className="h-10" />
          <Button onClick={handleAdd} disabled={pending} className="h-10 self-start">
            save habit
          </Button>
        </div>
      )}

      {habits.length === 0 && !adding ? (
        <p className="text-sm text-muted-foreground">stack a new habit onto something you already do every day.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {habits.map((h) => {
            const done = doneToday.has(h.id)
            const streak = computeHabitStreak(h.id, localLogs)
            return (
              <div key={h.id} className="group flex items-center gap-3 rounded-xl bg-secondary/40 p-3">
                <button
                  type="button"
                  onClick={() => handleToggle(h.id)}
                  aria-pressed={done}
                  className={cn(
                    'hex-clip flex h-8 w-8 shrink-0 items-center justify-center transition-colors',
                    done ? 'bg-honey text-honey-foreground' : 'bg-background text-muted-foreground ring-1 ring-border',
                  )}
                >
                  {done && <Check className="h-4 w-4" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{h.title}</p>
                  {h.anchor && <p className="truncate text-xs text-muted-foreground">{h.anchor}</p>}
                </div>
                {streak > 0 && <span className="shrink-0 text-xs font-medium text-honey">{streak}d</span>}
                <button type="button" onClick={() => handleArchive(h.id)} className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
