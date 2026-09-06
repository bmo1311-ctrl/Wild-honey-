'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { kidAllowed, type ChildPermissions } from '@/lib/kid'

/** If a child lands somewhere her parent has not opened, send her home. */
export function KidGate({ perms }: { perms: ChildPermissions }) {
  const path = usePathname()
  const router = useRouter()
  useEffect(() => {
    if (!kidAllowed(path, perms)) router.replace('/app')
  }, [path, router, perms])
  return null
}
