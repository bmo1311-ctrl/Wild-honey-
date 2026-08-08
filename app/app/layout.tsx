import type React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Wordmark } from '@/components/logo'
import { BottomNav } from '@/components/bottom-nav'
import { BloomAvatar } from '@/components/bloom-avatar'
import { getSessionProfile } from '@/lib/data'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionProfile()
  if (!profile) redirect('/auth/login')
  if (!profile.onboarding_completed_at) redirect('/onboarding')

  return (
    <div className="min-h-dvh bg-background pb-24">
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
                className="h-9 w-9"
              />
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-5 py-6">{children}</main>
      <BottomNav />
    </div>
  )
}
