import Link from 'next/link'
import { Wordmark } from '@/components/logo'
import { Button } from '@/components/ui/button'

export default function SignUpSuccessPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-12 text-center">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex justify-center">
          <Wordmark />
        </div>
        <h1 className="font-serif text-3xl font-semibold text-balance">Check your inbox</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
          We&apos;ve sent you a confirmation link. Confirm your email to open the door to your daily
          practice and the circle.
        </p>
        <Button asChild variant="outline" className="mt-8 h-12 w-full text-base">
          <Link href="/auth/login">Back to sign in</Link>
        </Button>
      </div>
    </main>
  )
}
