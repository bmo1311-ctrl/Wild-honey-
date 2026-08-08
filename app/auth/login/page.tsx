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

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(
        error.message.toLowerCase().includes('confirm')
          ? 'Please confirm your email before signing in. Check your inbox.'
          : 'Invalid email or password.',
      )
      setLoading(false)
      return
    }
    router.push('/app')
    router.refresh()
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-10 flex justify-center">
          <Wordmark />
        </Link>
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl font-semibold text-balance">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground text-pretty">
            Return to your practice and your circle.
          </p>
        </div>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 text-base"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="h-12 text-base">
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          New here?{' '}
          <Link href="/auth/sign-up" className="font-medium text-foreground underline underline-offset-4">
            Join the circle
          </Link>
        </p>
      </div>
    </main>
  )
}
