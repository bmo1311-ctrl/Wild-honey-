'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Apple, BookOpen, GraduationCap, Smile, Sun, Users } from 'lucide-react'
import type { ChildPermissions } from '@/lib/kid'
import { cn } from '@/lib/utils'

/** Big tabs. Circle and Program appear only when her parent switched them on. */
export function KidNav({ perms }: { perms: ChildPermissions }) {
  const pathname = usePathname()
  const tabs = [
    { href: '/app', label: 'Today', icon: Sun },
    ...(perms.program?.length ? [{ href: '/app/program', label: 'Program', icon: BookOpen }] : []),
    { href: '/app/learning', label: 'Learning', icon: GraduationCap },
    { href: '/app/nutrition/log', label: 'Food', icon: Apple },
    ...(perms.circle ? [{ href: '/app/circle', label: 'Circle', icon: Users }] : []),
    { href: '/app/kid-me', label: 'Me', icon: Smile },
  ].slice(0, 6)
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm">
      <ul className="mx-auto flex max-w-2xl items-stretch justify-between px-1 py-2">
        {tabs.map((t) => {
          const active = t.href === '/app' ? pathname === '/app' : pathname.startsWith(t.href)
          const Icon = t.icon
          return (
            <li key={t.href} className="flex-1">
              <Link href={t.href} aria-current={active ? 'page' : undefined} className="flex min-h-[60px] flex-col items-center justify-center gap-1">
                <span className={cn('flex h-11 w-11 items-center justify-center rounded-2xl transition-colors', active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className={cn('text-[12px] font-semibold', active ? 'text-foreground' : 'text-muted-foreground')}>{t.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
