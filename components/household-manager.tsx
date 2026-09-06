'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Pencil, Trash2, UserPlus, X } from 'lucide-react'
import { addHouseholdMember, createChildAccess, removeHouseholdMember, updateHouseholdMember } from '@/app/actions'
import type { HouseholdMember } from '@/lib/types'
import { cn } from '@/lib/utils'

function ageFrom(birthYear: number | null): string {
  if (!birthYear) return 'age not set'
  const age = new Date().getFullYear() - birthYear
  return age >= 0 && age < 120 ? `${age} years old` : 'age not set'
}

/** Add, rename and remove the people you're tracking. */
export function HouseholdManager({ members }: { members: HouseholdMember[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState({ name: '', birthYear: '' })
  const [editing, setEditing] = useState<string | null>(null)
  const [edit, setEdit] = useState({ name: '', birthYear: '', sex: '' })
  const [confirming, setConfirming] = useState<string | null>(null)
  const [access, setAccess] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [issued, setIssued] = useState<{ name: string; code: string } | null>(null)

  function giveAccess(id: string, name: string) {
    startTransition(async () => {
      const res = await createChildAccess(id, pin)
      if ('error' in res && res.error) {
        toast.error(res.error)
        return
      }
      if ('familyCode' in res && res.familyCode) setIssued({ name, code: res.familyCode })
      setAccess(null)
      setPin('')
      router.refresh()
    })
  }

  const field = 'h-11 w-full rounded-xl bg-background px-3 text-base outline-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary/40'

  function add() {
    startTransition(async () => {
      const res = await addHouseholdMember({ name: draft.name, birthYear: Number(draft.birthYear) || null })
      if ('error' in res && res.error) {
        toast.error(res.error)
        return
      }
      setDraft({ name: '', birthYear: '' })
      setAdding(false)
      toast.success('Added')
      router.refresh()
    })
  }

  function saveEdit(id: string) {
    startTransition(async () => {
      const res = await updateHouseholdMember({ id, name: edit.name, birthYear: Number(edit.birthYear) || null, sex: edit.sex || null })
      if ('error' in res && res.error) {
        toast.error(res.error)
        return
      }
      setEditing(null)
      router.refresh()
    })
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await removeHouseholdMember(id)
      if ('error' in res && res.error) {
        toast.error(res.error)
        return
      }
      setConfirming(null)
      toast.success('Removed')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
        {members.map((m, i) => (
          <li key={m.id} className={cn('px-4 py-3.5', i > 0 && 'border-t border-border')}>
            {editing === m.id ? (
              <div className="flex flex-col gap-2">
                <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className={field} placeholder="Name" />
                <input value={edit.birthYear} onChange={(e) => setEdit({ ...edit, birthYear: e.target.value })} inputMode="numeric" className={field} placeholder="Year born" />
                <div className="flex gap-2">
                  {(['female', 'male'] as const).map((sx) => (
                    <button
                      key={sx}
                      type="button"
                      onClick={() => setEdit({ ...edit, sex: edit.sex === sx ? '' : sx })}
                      className={cn('h-10 flex-1 rounded-xl text-sm font-medium', edit.sex === sx ? 'bg-mindset-pillar text-white' : 'bg-muted text-muted-foreground')}
                    >
                      {sx}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">optional — iron and calorie needs split from about age nine.</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => saveEdit(m.id)} disabled={pending} className="h-10 flex-1 rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                    Save
                  </button>
                  <button type="button" onClick={() => setEditing(null)} className="h-10 rounded-xl bg-muted px-4 text-sm font-medium">
                    Cancel
                  </button>
                </div>
              </div>
            ) : confirming === m.id ? (
              <div className="flex items-center gap-3">
                <span className="min-w-0 flex-1 text-[14.5px] text-pretty">
                  Remove {m.name}? Their lists and food logs go too.
                </span>
                <button type="button" onClick={() => remove(m.id)} disabled={pending} className="shrink-0 rounded-full bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive">
                  Remove
                </button>
                <button type="button" onClick={() => setConfirming(null)} className="shrink-0 text-xs text-muted-foreground">
                  Keep
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted font-serif text-sm">
                  {m.name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[15px] font-medium">{m.name}</span>
                    {m.is_self && <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">you</span>}
                  </span>
                  <span className="block text-[13px] text-muted-foreground">{ageFrom(m.birth_year)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(m.id)
                    setEdit({ name: m.name, birthYear: m.birth_year ? String(m.birth_year) : '', sex: (m as { sex?: string | null }).sex ?? '' })
                  }}
                  aria-label={`Edit ${m.name}`}
                  className="shrink-0 p-1.5 text-muted-foreground"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {!m.is_self && (
                  <button type="button" onClick={() => setAccess(access === m.id ? null : m.id)} className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold">
                    {(m as { child_user_id?: string | null }).child_user_id ? 'reset PIN' : 'give her the app'}
                  </button>
                )}
                {!m.is_self && (
                  <button type="button" onClick={() => setConfirming(m.id)} aria-label={`Remove ${m.name}`} className="shrink-0 p-1.5 text-muted-foreground">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      {access && (() => { const m = members.find((x) => x.id === access); return m ? (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="font-serif text-[17px] font-semibold">{m.name}&rsquo;s own sign-in</p>
          <p className="mt-1 text-[13px] text-muted-foreground text-pretty">She signs in at <span className="font-semibold text-foreground">/kid</span> with your family code and a four-digit PIN. No email, nothing public, no Circle. Everything she logs shows up here for you.</p>
          <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" placeholder="pick a 4-digit PIN" className="mt-3 h-12 w-full rounded-xl bg-background px-3 text-center text-xl tracking-[0.3em] outline-none ring-1 ring-border" />
          <button type="button" onClick={() => giveAccess(m.id, m.name)} disabled={pending || pin.length !== 4} className="mt-2 h-11 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-50">Create her sign-in</button>
        </div>
      ) : null })()}

      {issued && (
        <div className="rounded-2xl border-2 border-primary bg-card p-4">
          <p className="font-serif text-[17px] font-semibold">{issued.name} is set up</p>
          <p className="mt-1 text-[14px] text-muted-foreground">Family code — she&rsquo;ll type this once:</p>
          <p className="mt-1 font-serif text-3xl font-semibold tracking-[0.25em]">{issued.code}</p>
          <p className="mt-2 text-[13px] text-muted-foreground">Open <span className="font-semibold text-foreground">wild-honey-circle.vercel.app/kid</span> on her device, type the code, tap her name, enter the PIN.</p>
          <button type="button" onClick={() => setIssued(null)} className="mt-3 text-sm text-muted-foreground">done</button>
        </div>
      )}

      {adding ? (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-serif text-[17px] font-semibold">Add someone</p>
            <button type="button" onClick={() => setAdding(false)} aria-label="Cancel">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Name" className={field} autoFocus />
            <input value={draft.birthYear} onChange={(e) => setDraft({ ...draft, birthYear: e.target.value })} inputMode="numeric" placeholder="Year born" className={field} />
            <p className="text-xs text-muted-foreground">the year lets the app keep up as they grow.</p>
            <button type="button" onClick={add} disabled={pending} className="h-11 rounded-xl bg-primary text-[15px] font-bold text-primary-foreground disabled:opacity-50">
              <Check className="mr-1.5 inline h-4 w-4" /> Add
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex h-[52px] items-center justify-center gap-2 rounded-2xl border border-border bg-card text-[16px] font-semibold"
        >
          <UserPlus className="h-5 w-5" /> Add a family member
        </button>
      )}
    </div>
  )
}
