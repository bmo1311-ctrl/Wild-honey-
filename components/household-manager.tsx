'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Pencil, Trash2, UserPlus, X } from 'lucide-react'
import { addHouseholdMember, addKidReward, archiveKidReward, createChildAccess, getChildPermissions, payAllKidEarnings, removeHouseholdMember, setChildPermissions, setKidEarningStatus, updateHouseholdMember } from '@/app/actions'
import type { KidEarning, KidReward } from '@/lib/data'
import { COURSES } from '@/lib/courses'
import type { HouseholdMember } from '@/lib/types'
import { cn } from '@/lib/utils'

function ageFrom(birthYear: number | null): string {
  if (!birthYear) return 'age not set'
  const age = new Date().getFullYear() - birthYear
  return age >= 0 && age < 120 ? `${age} years old` : 'age not set'
}

/** Add, rename and remove the people you're tracking. */
export function HouseholdManager({ members, rewards = {} }: { members: HouseholdMember[]; rewards?: Record<string, { rewards: KidReward[]; earnings: KidEarning[]; balance: { waiting: number; ready: number; paid: number } }> }) {
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
  const [permsFor, setPermsFor] = useState<string | null>(null)
  const [rewardsFor, setRewardsFor] = useState<string | null>(null)
  const [nr, setNr] = useState({ title: '', amount: '', cadence: 'daily' })
  const money = (n: number) => `$${Number(n).toFixed(Number(n) % 1 ? 2 : 0)}`
  const [perms, setPerms] = useState<{ circle: boolean; program: string[] }>({ circle: false, program: [] })

  function openPerms(id: string) {
    setPermsFor(id)
    startTransition(async () => setPerms(await getChildPermissions(id)))
  }
  function savePerms(id: string) {
    startTransition(async () => {
      const res = await setChildPermissions(id, perms)
      if ('error' in res && res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Saved')
      setPermsFor(null)
    })
  }

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
                {!m.is_self && (m as { child_user_id?: string | null }).child_user_id && (
                  <button type="button" onClick={() => openPerms(m.id)} className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold">what she can see</button>
                )}
                {!m.is_self && (
                  <button type="button" onClick={() => setRewardsFor(rewardsFor === m.id ? null : m.id)} className="shrink-0 rounded-full bg-primary/20 px-2.5 py-1 text-[11px] font-semibold">earn{rewards[m.id]?.balance.waiting ? ` · ${money(rewards[m.id].balance.waiting)} waiting` : ''}</button>
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

      {rewardsFor && (() => { const m = members.find((x) => x.id === rewardsFor); const r = rewards[rewardsFor]; return m ? (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="font-serif text-[17px] font-semibold">{m.name} earns</p>
          <p className="mt-1 text-[13px] text-muted-foreground text-pretty">Set what a thing is worth. She taps "I did it", you say yes, you pay her. Tie a reward to a Learning item and it counts itself when she ticks it.</p>
          {r && r.earnings.some((e) => e.status === 'pending' || e.status === 'approved') && (
            <div className="mt-3 rounded-xl bg-muted p-3">
              <div className="mb-2 flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Waiting on you</span><button type="button" onClick={() => startTransition(async () => { await payAllKidEarnings(m.id); router.refresh() })} className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground">Pay all {money(r.balance.waiting + r.balance.ready)}</button></div>
              <ul className="flex flex-col gap-1.5">
                {r.earnings.filter((e) => e.status === 'pending' || e.status === 'approved').slice(0, 8).map((e) => (
                  <li key={e.id} className="flex items-center gap-2 text-[13.5px]"><span className="w-10 text-[11px] text-muted-foreground">{e.date.slice(5)}</span><span className="min-w-0 flex-1 truncate">{e.title}</span><span className="font-semibold">{money(e.amount)}</span>
                    {e.status === 'pending' && <button type="button" onClick={() => startTransition(async () => { await setKidEarningStatus(e.id, 'approved'); router.refresh() })} className="rounded-full bg-card px-2 py-0.5 text-[11px] font-semibold ring-1 ring-border">yes</button>}
                    <button type="button" onClick={() => startTransition(async () => { await setKidEarningStatus(e.id, 'paid'); router.refresh() })} className="rounded-full bg-card px-2 py-0.5 text-[11px] font-semibold ring-1 ring-border">paid</button>
                    <button type="button" onClick={() => startTransition(async () => { await setKidEarningStatus(e.id, 'declined'); router.refresh() })} aria-label="decline" className="px-1 text-muted-foreground">×</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <ul className="mt-3 flex flex-col gap-1.5">
            {(r?.rewards ?? []).map((rw) => (
              <li key={rw.id} className="flex items-center gap-2 text-[14px]"><span className="min-w-0 flex-1 truncate">{rw.title} <span className="text-[11px] text-muted-foreground">· {rw.cadence}</span></span><span className="font-semibold">{money(rw.amount)}</span><button type="button" onClick={() => startTransition(async () => { await archiveKidReward(rw.id); router.refresh() })} aria-label="remove" className="px-1 text-muted-foreground">×</button></li>
            ))}
          </ul>
          <div className="mt-3 flex flex-col gap-2">
            <input value={nr.title} onChange={(e) => setNr({ ...nr, title: e.target.value })} placeholder="e.g. Read for 20 minutes" className={field} />
            <div className="flex gap-2">
              <input value={nr.amount} onChange={(e) => setNr({ ...nr, amount: e.target.value })} inputMode="decimal" placeholder="$" className="h-11 w-24 rounded-xl bg-background px-3 text-base outline-none ring-1 ring-border" />
              {(['daily', 'weekly', 'once'] as const).map((c) => (<button key={c} type="button" onClick={() => setNr({ ...nr, cadence: c })} className={cn('h-11 flex-1 rounded-xl text-[12px] font-medium', nr.cadence === c ? 'bg-mindset-pillar text-white' : 'bg-muted text-muted-foreground')}>{c}</button>))}
            </div>
            <button type="button" disabled={pending || !nr.title.trim() || !(Number(nr.amount) > 0)} onClick={() => startTransition(async () => { const res = await addKidReward({ memberId: m.id, title: nr.title, amount: Number(nr.amount), cadence: nr.cadence }); if ('error' in res && res.error) { toast.error(res.error); return } setNr({ title: '', amount: '', cadence: 'daily' }); router.refresh() })} className="h-11 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-50">Add a way to earn</button>
          </div>
        </div>
      ) : null })()}

      {permsFor && (() => { const m = members.find((x) => x.id === permsFor); return m ? (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="font-serif text-[17px] font-semibold">What {m.name} can see</p>
          <p className="mt-1 text-[13px] text-muted-foreground text-pretty">Off by default. The Circle is a feed of adults who can read and reply to her posts; her name there will not open a page about her.</p>
          <button type="button" onClick={() => setPerms({ ...perms, circle: !perms.circle })} className={cn('mt-3 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left ring-1', perms.circle ? 'bg-mindset-pillar text-white ring-transparent' : 'ring-border')}>
            <span className="text-sm font-medium">The Circle and discussions</span><span className={cn('text-xs', perms.circle ? 'text-white/80' : 'text-muted-foreground')}>{perms.circle ? 'on' : 'off'}</span>
          </button>
          {COURSES.map((c) => { const on = perms.program.includes(c.slug); return (
            <button key={c.slug} type="button" onClick={() => setPerms({ ...perms, program: on ? perms.program.filter((s) => s !== c.slug) : [...perms.program, c.slug] })} className={cn('mt-2 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left ring-1', on ? 'bg-mindset-pillar text-white ring-transparent' : 'ring-border')}>
              <span className="text-sm font-medium">{c.title}</span><span className={cn('text-xs', on ? 'text-white/80' : 'text-muted-foreground')}>{on ? 'on' : 'off'}</span>
            </button>
          ) })}
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => savePerms(m.id)} disabled={pending} className="h-11 flex-1 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-50">Save</button>
            <button type="button" onClick={() => setPermsFor(null)} className="h-11 rounded-xl bg-muted px-4 text-sm font-medium">Cancel</button>
          </div>
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
