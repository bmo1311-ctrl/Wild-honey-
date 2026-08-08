import type React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { HoneycombMark } from '@/components/logo'
import { getSessionProfile } from '@/lib/data'

const LINKS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/members', label: 'Members' },
  { href: '/admin/prompts', label: 'Prompts' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/retreats', label: 'Retreats' },
  { href: '/admin/workouts', label: 'Workouts' },
  { href: '/admin/recipes', label: 'Recipes' },
  { href: '/admin/challenges', label: 'Challenges' },
  { href: '/admin/resources', label: 'Resources' },
  { href: '/admin/questions', label: 'Questions' },
  { href: '/admin/reports', label: 'Reports' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionProfile()
  if (!profile) redirect('/auth/login')
  if (!profile.is_admin) redirect('/app')

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <HoneycombMark className="h-7 w-7" />
            <span className="font-serif text-lg font-semibold">Admin</span>
          </div>
          <Link href="/app" className="text-xs font-medium text-muted-foreground">
            back to app
          </Link>
        </div>
        <nav className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-5 pb-2">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-6">{children}</main>
    </div>
  )
}
