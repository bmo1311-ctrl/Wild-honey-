'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Download, Trash2 } from 'lucide-react'
import { deleteMyAccount, updateNotificationPrefs } from '@/app/actions'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { NotificationPrefs } from '@/lib/types'
import { cn } from '@/lib/utils'

const NOTIF_OPTIONS: { key: keyof NotificationPrefs; label: string }[] = [
  { key: 'morning_checkin', label: 'morning check-in reminder' },
  { key: 'hydration', label: 'hydration reminders' },
  { key: 'movement', label: 'movement reminders' },
  { key: 'journal', label: 'journal reminders' },
  { key: 'evening_reflection', label: 'evening reflection reminder' },
  { key: 'new_content', label: 'new content from Wild Honey' },
  { key: 'retreat_announcements', label: 'retreat announcements' },
]

export function PrivacySettings({
  initialPrefs,
  initialQuietStart,
  initialQuietEnd,
}: {
  initialPrefs: NotificationPrefs
  initialQuietStart: string | null
  initialQuietEnd: string | null
}) {
  const router = useRouter()
  const [prefs, setPrefs] = useState<NotificationPrefs>(initialPrefs)
  const [quietStart, setQuietStart] = useState(initialQuietStart ?? '')
  const [quietEnd, setQuietEnd] = useState(initialQuietEnd ?? '')
  const [pending, startTransition] = useTransition()
  const [deletePending, startDeleteTransition] = useTransition()
  const [confirmText, setConfirmText] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  function toggle(key: keyof NotificationPrefs) {
    setPrefs((prev) => ({ ...prev, [key]: prev[key] === false ? true : false }))
  }

  function handleSave() {
    startTransition(async () => {
      const res = await updateNotificationPrefs({ prefs, quietHoursStart: quietStart, quietHoursEnd: quietEnd })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Preferences saved.')
    })
  }

  function handleDelete() {
    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      toast.error('Type DELETE to confirm.')
      return
    }
    startDeleteTransition(async () => {
      const res = await deleteMyAccount()
      if (res?.error) {
        toast.error(res.error)
        return
      }
      const supabase = createClient()
      await supabase.auth.signOut()
      toast.success('Your account has been deleted.')
      router.push('/')
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
        <p className="font-serif text-lg font-semibold">notifications</p>
        <div className="flex flex-col gap-2">
          {NOTIF_OPTIONS.map((opt) => {
            const active = prefs[opt.key] !== false
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => toggle(opt.key)}
                className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2.5 text-left"
              >
                <span className="text-sm">{opt.label}</span>
                <span
                  className={cn(
                    'relative h-5 w-9 shrink-0 rounded-full transition-colors',
                    active ? 'bg-honey' : 'bg-muted-foreground/30',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 h-4 w-4 rounded-full bg-background transition-transform',
                      active ? 'translate-x-4' : 'translate-x-0.5',
                    )}
                  />
                </span>
              </button>
            )
          })}
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">quiet hours start</label>
            <Input value={quietStart} onChange={(e) => setQuietStart(e.target.value)} placeholder="9pm" className="h-11" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">quiet hours end</label>
            <Input value={quietEnd} onChange={(e) => setQuietEnd(e.target.value)} placeholder="7am" className="h-11" />
          </div>
        </div>
        <Button onClick={handleSave} disabled={pending} className="h-11">
          {pending ? 'saving…' : 'save preferences'}
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
        <p className="font-serif text-lg font-semibold">your data</p>
        <p className="text-sm text-muted-foreground text-pretty">download everything Wild Honey has stored for you — journal entries, check-ins, your Honey Profile, all of it.</p>
        <a
          href="/api/export"
          download
          className="flex h-11 items-center justify-center gap-2 rounded-lg bg-secondary text-sm font-medium text-secondary-foreground"
        >
          <Download className="h-4 w-4" />
          export my data
        </a>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
        <p className="font-serif text-lg font-semibold text-destructive">delete account</p>
        <p className="text-sm text-muted-foreground text-pretty">
          this permanently deletes your account and everything tied to it — journal, check-ins, community posts, purchases. this cannot be undone.
        </p>
        {!showDeleteConfirm ? (
          <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} className="h-11 self-start">
            <Trash2 className="h-4 w-4" />
            delete my account
          </Button>
        ) : (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground">type DELETE to confirm</label>
            <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="h-11" placeholder="DELETE" />
            <div className="flex gap-2">
              <Button variant="destructive" onClick={handleDelete} disabled={deletePending} className="h-11 flex-1">
                {deletePending ? 'deleting…' : 'permanently delete'}
              </Button>
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} className="h-11">
                cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
