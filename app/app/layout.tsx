import type React from 'react'
import { headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Wordmark } from '@/components/logo'
import { BottomNav } from '@/components/bottom-nav'
import { KidNav } from '@/components/kid-nav'
import { KidGate } from '@/components/kid-gate'
import { TzCookie } from '@/components/tz-cookie'
import { BloomAvatar } from '@/components/bloom-avatar'
import { OneSignalInit } from '@/components/onesignal-init'
import { getSessionProfile } from '@/lib/data'
import { kidAllowed } from '@/lib/kid'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionProfile()
  if (!profile) redirect('/auth/login')
  if (!profile.onboarding_completed_at) redirect('/onboarding')

  /*
   * The child gate, on the server.
   *
   * `KidGate` below is a `useEffect` redirect, so by the time it runs the
   * server component for a disallowed page has already rendered and its data
   * has already been sent to the browser. For a page her parent switched off
   * that is not a redirect, it is a flash of the thing itself.
   *
   * This runs before any child page does. `KidGate` stays for client-side
   * navigations, where there is no new server render to catch.
   */
  if (profile.is_child) {
    const path = (await headers()).get('x-pathname') ?? ''
    if (path && !kidAllowed(path, profile.child_permissions ?? {})) redirect('/app')
  }

  return (
    <div className="min-h-dvh bg-background pb-24" data-palette={profile?.color_season ?? undefined}>
      <OneSignalInit externalUserId={profile.id} />
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
          <Link href="/app" aria-label="Wild Honey Circle home">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-3">
            {profile.is_admin && (
              <Link
                href="/admin"
                className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
              >
                Admin
              </Link>
            )}
            <Link href="/app/profile" aria-label="Your profile">
              <BloomAvatar
                name={profile.name}
                color={profile.avatar_color}
                avatarUrl={profile.avatar_url}
                className="h-9 w-9"
              />
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-5 py-6">{children}</main>
      {profile.is_child ? <KidNav perms={profile.child_permissions ?? {}} /> : <BottomNav />}
      {profile.is_child && <KidGate perms={profile.child_permissions ?? {}} />}
      <TzCookie />
    </div>
  )
}
