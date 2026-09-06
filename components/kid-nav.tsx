'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Apple, GraduationCap, Smile, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/app', label: 'Today', icon: Sun },
  { href: '/app/learning', label: 'Learning', icon: GraduationCap },
  { href: '/app/nutrition/log', label: 'Food', icon: Apple },
  { href: '/app/kid-me', label: 'Me', icon: Smile },
]

/** Four big tabs. That is the whole app for her. */
export function KidNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm">
      <ul className="mx-auto flex max-w-2xl items-stretch justify-between px-2 py-2">
        {TABS.map((t) => {
          const active = t.href === '/app' ? pathname === '/app' : pathname.startsWith(t.href)
          const Icon = t.icon
          return (
            <li key={t.href} className="flex-1">
              <Link href={t.href} aria-current={active ? 'page' : undefined} className="flex min-h-[60px] flex-col items-center justify-center gap-1">
                <span className={cn('flex h-12 w-12 items-center justify-center rounded-2xl transition-colors', active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>
                  <Icon className="h-6 w-6" />
                </span>
                <span className={cn('text-[13px] font-semibold', active ? 'text-foreground' : 'text-muted-foreground')}>{t.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
