import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { DailyCheckin } from '@/components/daily-checkin'
import { getBaselineVitality, getTodayCheckin } from '@/lib/data'

export default async function CheckinPage() {
  const [existing, baseline] = await Promise.all([getTodayCheckin(), getBaselineVitality()])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/app" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ChevronLeft className="h-4 w-4" /> Today
        </Link>
        <h1 className="font-serif text-[29px] font-semibold leading-[1.1]">How are you today?</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">four quick things. nothing here is required.</p>
      </div>
      <DailyCheckin existing={existing} hasBaseline={Boolean(baseline)} />
    </div>
  )
}
