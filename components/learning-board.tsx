'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Check, Plus, UserPlus, X } from 'lucide-react'
import { addHouseholdMember, addLearningItem, archiveLearningItem, toggleLearningItem } from '@/app/actions'
import type { HouseholdMember, LearningItem } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * One board per person. She switches between herself and each child, and sees
 * exactly what that person is working through today.
 */
export function LearningBoard({
  members,
  activeMemberId,
  items,
  onSwitch,
}: {
  members: HouseholdMember[]
  activeMemberId: string | null
  items: LearningItem[]
  onSwitch: (id: string) => void
}) {
  const [pending, startTransition] = useTransition()
  const [addingItem, setAddingItem] = useState(false)
  const [addingPerson, setAddingPerson] = useState(false)
  const [draft, setDraft] = useState({ subject: '', title: '', cadence: 'daily' })
  const [person, setPerson] = useState({ name: '', birthYear: '' })
  const [done, setDone] = useState<Record<string, boolean>>(Object.fromEntries(items.map((i) => [i.id, Boolean(i.doneToday)])))

  const bySubject = items.reduce<Record<string, LearningItem[]>>((acc, i) => {
    ;(acc[i.subject] ??= []).push(i)
    return acc
  }, {})

  const doneCount = items.filter((i) => done[i.id]).length

  function toggle(item: LearningItem) {
    const next = !done[item.id]
    setDone((d) => ({ ...d, [item.id]: next }))
    startTransition(async () => {
      const res = await toggleLearningItem(item.id)
      if ('error' in res && res.error) {
        setDone((d) => ({ ...d, [item.id]: !next }))
        toast.error(res.error)
      }
    })
  }

  function submitItem() {
    startTransition(async () => {
      const res = await addLearningItem({
        memberId: activeMemberId,
        subject: draft.subject,
        title: draft.title,
        cadence: draft.cadence,
      })
      if ('error' in res && res.error) {
        toast.error(res.error)
        return
      }
      setDraft({ subject: '', title: '', cadence: 'daily' })
      setAddingItem(false)
      toast.success('Added')
    })
  }

  function submitPerson() {
    startTransition(async () => {
      const res = await addHouseholdMember({ name: person.name, birthYear: Number(person.birthYear) || null })
      if ('error' in res && res.error) {
        toast.error(res.error)
        return
      }
      setPerson({ name: '', birthYear: '' })
      setAddingPerson(false)
      toast.success('Added to your household')
    })
  }

  const field = 'h-11 w-full rounded-xl bg-background px-3 text-base outline-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary/40'

  return (
    <div className="flex flex-col gap-4">
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {members.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onSwitch(m.id)}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
              m.id === activeMemberId ? 'bg-mindset-pillar text-white' : 'bg-muted text-muted-foreground',
            )}
          >
            <span
              className={cn('flex h-6 w-6 items-center justify-center rounded-full font-serif text-xs', m.id === activeMemberId ? 'bg-white/20' : 'bg-card')}
            >
              {m.name.charAt(0).toUpperCase()}
            </span>
            {m.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setAddingPerson(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-card px-3.5 py-2 text-sm font-medium text-muted-foreground ring-1 ring-border"
        >
          <UserPlus className="h-4 w-4" /> Add
        </button>
      </div>

      {addingPerson && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-serif text-[17px] font-semibold">Add someone</p>
            <button type="button" onClick={() => setAddingPerson(false)} aria-label="Cancel">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <input value={person.name} onChange={(e) => setPerson({ ...person, name: e.target.value })} placeholder="Name" className={field} />
            <input value={person.birthYear} onChange={(e) => setPerson({ ...person, birthYear: e.target.value })} inputMode="numeric" placeholder="Year born (optional)" className={field} />
            <button type="button" onClick={submitPerson} disabled={pending} className="h-11 rounded-xl bg-primary text-[15px] font-bold text-primary-foreground disabled:opacity-50">
              Add
            </button>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {doneCount} of {items.length} done today
        </p>
      )}

      {Object.entries(bySubject).map(([subject, list]) => (
        <section key={subject}>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">{subject}</h2>
          <ul className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
            {list.map((item, i) => (
              <li key={item.id} className={cn('flex items-center gap-3 px-4 py-3.5', i > 0 && 'border-t border-border')}>
                <button type="button" onClick={() => toggle(item)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors',
                      done[item.id] ? 'bg-mindset-pillar text-white' : 'border-[1.5px] border-border',
                    )}
                  >
                    {done[item.id] && <Check className="h-4 w-4" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn('block text-[15px] font-medium', done[item.id] && 'text-muted-foreground line-through')}>{item.title}</span>
                    {item.cadence !== 'once' && <span className="block text-[12px] text-muted-foreground">{item.cadence}</span>}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => startTransition(async () => void (await archiveLearningItem(item.id)))}
                  aria-label={`Remove ${item.title}`}
                  className="shrink-0 p-1 text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {items.length === 0 && !addingItem && (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-[15px] text-muted-foreground text-pretty">
          Nothing on the list yet. Add what they&rsquo;re working through — reading, maths, a instrument, anything.
        </p>
      )}

      {addingItem ? (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-serif text-[17px] font-semibold">New item</p>
            <button type="button" onClick={() => setAddingItem(false)} aria-label="Cancel">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="What is it?" className={field} />
            <input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} placeholder="Subject (Reading, Maths…)" className={field} />
            <div className="flex gap-2">
              {(['daily', 'weekly', 'once'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setDraft({ ...draft, cadence: c })}
                  className={cn('h-11 flex-1 rounded-xl text-sm font-medium', draft.cadence === c ? 'bg-mindset-pillar text-white' : 'bg-muted text-muted-foreground')}
                >
                  {c}
                </button>
              ))}
            </div>
            <button type="button" onClick={submitItem} disabled={pending} className="h-11 rounded-xl bg-primary text-[15px] font-bold text-primary-foreground disabled:opacity-50">
              Add to the list
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingItem(true)}
          className="flex h-[52px] items-center justify-center gap-2 rounded-2xl border border-border bg-card text-[16px] font-semibold"
        >
          <Plus className="h-5 w-5" /> Add to the list
        </button>
      )}
    </div>
  )
}
