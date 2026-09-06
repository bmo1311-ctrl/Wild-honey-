'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { childCredentials, lookupFamily } from '@/app/actions'
import { createClient } from '@/lib/supabase/client'
import { HoneycombMark } from '@/components/logo'
import { cn } from '@/lib/utils'

export default function KidSignIn() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [members, setMembers] = useState<{ id: string; name: string }[] | null>(null)
  const [who, setWho] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [pending, startTransition] = useTransition()

  function findFamily() {
    startTransition(async () => {
      const res = await lookupFamily(code)
      if ('error' in res && res.error) {
        toast.error(res.error)
        return
      }
      if ('members' in res && res.members) setMembers(res.members)
    })
  }

  function go() {
    if (!who || pin.length !== 4) return
    startTransition(async () => {
      const creds = await childCredentials(who, code, pin)
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword(creds)
      if (error) {
        toast.error('That PIN is not right. Try again.')
        setPin('')
        return
      }
      router.push('/app')
      router.refresh()
    })
  }

  const big = 'h-14 w-full rounded-2xl bg-card px-4 text-center text-2xl font-semibold tracking-[0.3em] outline-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary/50'

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><HoneycombMark className="h-12 w-12" /></div>
        {!members ? (
          <>
            <h1 className="text-center font-serif text-3xl font-semibold">Hi there!</h1>
            <p className="mt-2 text-center text-[16px] text-muted-foreground">Type your family code.</p>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))} onKeyDown={(e) => e.key === 'Enter' && findFamily()} autoCapitalize="characters" autoCorrect="off" placeholder="ABC123" className={cn(big, 'mt-6')} autoFocus />
            <button type="button" onClick={findFamily} disabled={pending || code.length < 6} className="mt-3 h-14 w-full rounded-2xl bg-primary text-[19px] font-bold text-primary-foreground disabled:opacity-50">Next</button>
          </>
        ) : !who ? (
          <>
            <h1 className="text-center font-serif text-3xl font-semibold">Who are you?</h1>
            <div className="mt-6 flex flex-col gap-3">
              {members.map((m) => (
                <button key={m.id} type="button" onClick={() => setWho(m.id)} className="flex h-16 items-center gap-4 rounded-2xl bg-card px-5 text-left ring-1 ring-border">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-serif text-lg font-semibold text-primary-foreground">{m.name.charAt(0)}</span>
                  <span className="text-[19px] font-semibold">{m.name}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1 className="text-center font-serif text-3xl font-semibold">Your secret PIN</h1>
            <p className="mt-2 text-center text-[16px] text-muted-foreground">Four numbers. Nobody else needs to know it.</p>
            <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} onKeyDown={(e) => e.key === 'Enter' && go()} inputMode="numeric" type="password" placeholder="••••" className={cn(big, 'mt-6')} autoFocus />
            <button type="button" onClick={go} disabled={pending || pin.length !== 4} className="mt-3 h-14 w-full rounded-2xl bg-primary text-[19px] font-bold text-primary-foreground disabled:opacity-50">{pending ? 'One sec…' : "Let's go"}</button>
            <button type="button" onClick={() => setWho(null)} className="mt-3 w-full text-sm text-muted-foreground">not you? go back</button>
          </>
        )}
      </div>
    </main>
  )
}
