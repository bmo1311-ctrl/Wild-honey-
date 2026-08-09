import { PrivacySettings } from '@/components/privacy-settings'
import { BlockedMutedList } from '@/components/blocked-muted-list'
import { getBlockedUsers, getMutedUsers, getSessionProfile } from '@/lib/data'

export default async function SettingsPage() {
  const [profile, blocked, muted] = await Promise.all([getSessionProfile(), getBlockedUsers(), getMutedUsers()])
  if (!profile) return null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Privacy &amp; Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">control what Wild Honey sends you, download your data, or close your account.</p>
      </div>
      <BlockedMutedList blocked={blocked} muted={muted} />
      <PrivacySettings
        initialPrefs={profile.notification_prefs ?? {}}
        initialQuietStart={profile.quiet_hours_start}
        initialQuietEnd={profile.quiet_hours_end}
      />
    </div>
  )
}
