'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sun, BookOpen, PenLine, Users, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/app', label: 'Today', icon: Sun, exact: true },
  { href: '/app/program', label: 'Program', icon: BookOpen },
  { href: '/app/write', label: 'Write', icon: PenLine },
  { href: '/app/circle', label: 'Circle', icon: Users },
  { href: '/app/profile', label: 'You', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm"
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-between px-2 py-2">
        {TABS.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)
          const Icon = tab.icon
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className="flex min-h-[52px] flex-col items-center justify-center gap-1"
              >
                <span
                  className={cn(
                    'hex-clip flex h-11 w-11 items-center justify-center transition-colors',
                    active ? 'bg-mindset-pillar text-white' : 'bg-transparent text-muted-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span
                  className={cn(
                    'text-xs font-medium leading-none',
                    active ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
