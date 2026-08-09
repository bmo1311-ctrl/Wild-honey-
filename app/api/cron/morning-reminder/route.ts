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
    supabase.from('checkins').select('user_id').eq('date', today),
  ])

  const doneIds = new Set((doneToday ?? []).map((c) => c.user_id))
  const targetIds = (profiles ?? [])
    .filter((p) => (p.notification_prefs as Record<string, boolean> | null)?.morning_checkin !== false)
    .filter((p) => !doneIds.has(p.id))
    .map((p) => p.id)

  const res = await sendPushToUsers({
    externalUserIds: targetIds,
    title: 'Good morning 🌤️',
    message: "Take 20 seconds for today's check-in — it shapes everything else Wild Honey suggests for you today.",
    url: '/app',
  })

  return NextResponse.json({ sent: targetIds.length, ...res })
}
