'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { kidAllowed } from '@/lib/kid'

/** If a child lands anywhere that is not hers, send her home. */
export function KidGate() {
  const path = usePathname()
  const router = useRouter()
  useEffect(() => {
    if (!kidAllowed(path)) router.replace('/app')
  }, [path, router])
  return null
}
