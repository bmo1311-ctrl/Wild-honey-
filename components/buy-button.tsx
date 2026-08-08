'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function BuyButton({
  productId,
  retreatId,
  tier,
  kind,
  label = 'buy now',
}: {
  productId?: string
  retreatId?: string
  tier?: string
  kind: 'product' | 'retreat' | 'membership'
  label?: string
}) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      try {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind, productId, retreatId, tier }),
        })
        const data = await res.json()
        if (data.url) {
          window.location.href = data.url
          return
        }
        if (data.notConfigured) {
          toast.info('Payments aren\u2019t connected yet \u2014 add your Stripe keys to enable checkout.')
          return
        }
        toast.error(data.error ?? 'Something went wrong starting checkout.')
      } catch {
        toast.error('Could not reach checkout. Try again.')
      }
    })
  }

  return (
    <Button onClick={handleClick} disabled={pending} size="sm" className="rounded-full">
      {pending ? 'starting checkout…' : label}
    </Button>
  )
}
