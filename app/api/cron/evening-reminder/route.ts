import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { oneSignalConfigured, sendPushToUsers } from '@/lib/onesignal'

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!oneSignalConfigured()) return NextResponse.json({ skipped: 'OneSignal not configured' })

  const supabase = createServiceClient()
  const today = new Date().toISOString().slice(0, 10)

  const [{ data: profiles }, { data: doneToday }] = await Promise.all([
    supabase.from('profiles').select('id, notification_prefs'),
    supabase.from('evening_reflections').select('user_id').eq('date', today),
  ])

  const doneIds = new Set((doneToday ?? []).map((r) => r.user_id))
  const targetIds = (profiles ?? [])
    .filter((p) => (p.notification_prefs as Record<string, boolean> | null)?.evening_reflection !== false)
    .filter((p) => !doneIds.has(p.id))
    .map((p) => p.id)

  const res = await sendPushToUsers({
    externalUserIds: targetIds,
    title: 'Evening reflection 🌙',
    message: 'A couple of quiet minutes before bed — what stood out about today?',
    url: '/app',
  })

  return NextResponse.json({ sent: targetIds.length, ...res })
}
