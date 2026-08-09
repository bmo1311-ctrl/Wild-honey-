/**
 * Push notifications via OneSignal's REST API. Optional — if
 * ONESIGNAL_REST_API_KEY isn't set, these functions no-op quietly rather
 * than throwing, so the app works fine before push is configured.
 */

export function oneSignalConfigured(): boolean {
  return Boolean(process.env.ONESIGNAL_REST_API_KEY && process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID)
}

export async function sendPushToUsers(input: {
  externalUserIds: string[]
  title: string
  message: string
  url?: string
}): Promise<{ ok: boolean; error?: string }> {
  if (!oneSignalConfigured()) return { ok: false, error: 'OneSignal not configured' }
  if (input.externalUserIds.length === 0) return { ok: true }

  try {
    const res = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
        target_channel: 'push',
        include_external_user_ids: input.externalUserIds,
        headings: { en: input.title },
        contents: { en: input.message },
        url: input.url,
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: text }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
