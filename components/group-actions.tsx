'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Plus, Users, KeyRound, Copy } from 'lucide-react'
import { createGroup, joinGroupByCode } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Group } from '@/lib/types'

export function CreateOrJoinGroup() {
  const [mode, setMode] = useState<'none' | 'create' | 'join'>('none')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [code, setCode] = useState('')
  const [pending, startTransition] = useTransition()

  function handleCreate() {
    if (!name.trim()) {
      toast.error('Give your group a name first.')
      return
    }
    startTransition(async () => {
      const res = await createGroup({ name, description })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setName('')
      setDescription('')
      setMode('none')
      toast.success('Group created.')
    })
  }

  function handleJoin() {
    if (!code.trim()) {
      toast.error('Enter an invite code first.')
      return
    }
    startTransition(async () => {
      const res = await joinGroupByCode(code)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setCode('')
      setMode('none')
      toast.success('Joined the group.')
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
      {mode === 'none' && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('create')}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background"
          >
            <Plus className="h-3.5 w-3.5" />
            start a group
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground"
          >
            <KeyRound className="h-3.5 w-3.5" />
            join with code
          </button>
        </div>
      )}

      {mode === 'create' && (
        <div className="flex flex-col gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="group name, e.g. Tucson Accountability" className="h-11" />
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="what's this group for? (optional)" className="h-11" />
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={pending} className="h-10 flex-1">
              create
            </Button>
            <Button onClick={() => setMode('none')} variant="ghost" className="h-10">
              cancel
            </Button>
          </div>
        </div>
      )}

      {mode === 'join' && (
        <div className="flex flex-col gap-2">
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="6-character invite code" className="h-11 uppercase" maxLength={6} />
          <div className="flex gap-2">
            <Button onClick={handleJoin} disabled={pending} className="h-10 flex-1">
              join
            </Button>
            <Button onClick={() => setMode('none')} variant="ghost" className="h-10">
              cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function GroupListCard({ group }: { group: Group }) {
  function handleCopyCode() {
    navigator.clipboard?.writeText(group.invite_code)
    toast.success('Invite code copied.')
  }

  return (
    <Link href={`/app/groups/${group.id}`} className="flex flex-col gap-2 rounded-2xl bg-card p-4 ring-1 ring-border">
      <div className="flex items-center justify-between gap-2">
        <p className="font-serif text-lg font-semibold text-pretty">{group.name}</p>
        {group.my_role === 'owner' && <span className="shrink-0 rounded-full bg-honey/20 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-honey">owner</span>}
      </div>
      {group.description && <p className="text-sm text-muted-foreground text-pretty">{group.description}</p>}
      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {group.member_count ?? 0} member{group.member_count === 1 ? '' : 's'}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            handleCopyCode()
          }}
          className="flex items-center gap-1 font-medium text-honey"
        >
          <Copy className="h-3 w-3" />
          {group.invite_code}
        </button>
      </div>
    </Link>
  )
}
