'use client'

import type React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Wordmark } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const AVATAR_COLORS = ['honey', 'terracotta', 'sage', 'plum']

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [avatarColor, setAvatarColor] = useState('honey')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
          `${window.location.origin}/auth/callback`,
        data: { name: name || 'honey', avatar_color: avatarColor },
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/auth/sign-up-success')
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-10 flex justify-center">
          <Wordmark />
        </Link>
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl font-semibold text-balance">Join the circle</h1>
          <p className="mt-2 text-sm text-muted-foreground text-pretty">
            Begin your daily practice with women becoming rooted.
          </p>
        </div>
        <form onSubmit={handleSignUp} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">First name</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 text-base"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 text-base"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 text-base"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Choose your bloom</Label>
            <div className="flex gap-3">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAvatarColor(c)}
                  aria-label={c}
                  aria-pressed={avatarColor === c}
                  className={`h-11 w-11 rounded-full ring-2 ring-offset-2 ring-offset-background transition ${
                    avatarColor === c ? 'ring-foreground' : 'ring-transparent'
                  }`}
                  style={{ background: colorFor(c) }}
                />
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="h-12 text-base">
            {loading ? 'Creating your space...' : 'Create account'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already a member?{' '}
          <Link href="/auth/login" className="font-medium text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}

function colorFor(c: string): string {
  switch (c) {
    case 'terracotta':
      return 'oklch(0.68 0.12 25)'
    case 'sage':
      return 'oklch(0.62 0.09 145)'
    case 'plum':
      return 'oklch(0.58 0.11 285)'
    default:
      return 'oklch(0.78 0.15 75)'
  }
}
