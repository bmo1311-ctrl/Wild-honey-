import { redirect } from 'next/navigation'
import { OnboardingWizard } from '@/components/onboarding-wizard'
import { getSessionProfile } from '@/lib/data'

export default async function OnboardingPage() {
  const profile = await getSessionProfile()
  if (!profile) redirect('/auth/login')
  if (profile.onboarding_completed_at) redirect('/app')

  return (
    <div className="min-h-dvh bg-background">
      <OnboardingWizard initialName={profile.name} />
    </div>
  )
}
