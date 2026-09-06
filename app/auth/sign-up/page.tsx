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

const AVATAR_COLORS = ['sapphire', 'icyblue', 'emerald', 'fuchsia', 'crimson', 'lavender']

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [avatarColor, setAvatarColor] = useState('sapphire')
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
            Start with the body. The rest of the life is in here.
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
    case 'icyblue':
      return 'oklch(0.75 0.09 220)'
    case 'sapphire':
      return 'oklch(0.5 0.2 260)'
    case 'emerald':
      return 'oklch(0.6 0.14 165)'
    case 'fuchsia':
      return 'oklch(0.6 0.24 340)'
    case 'crimson':
      return 'oklch(0.55 0.22 25)'
    case 'lavender':
      return 'oklch(0.72 0.12 300)'
    default:
      return 'oklch(0.5 0.2 260)'
  }
}
