'use client'

import { useEffect } from 'react'
import OneSignal from 'react-onesignal'

let initialized = false

export function OneSignalInit({ externalUserId }: { externalUserId?: string | null }) {
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
    if (!appId) return

    async function run() {
      if (!initialized) {
        initialized = true
        await OneSignal.init({ appId: appId as string })
      }
      if (externalUserId) {
        await OneSignal.login(externalUserId)
      }
    }
    run()
  }, [externalUserId])

  return null
}
