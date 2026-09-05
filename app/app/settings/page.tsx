import { ProfileEditor } from '@/components/profile-editor'
import { PrivacySettings } from '@/components/privacy-settings'
import { BlockedMutedList } from '@/components/blocked-muted-list'
import { getBlockedUsers, getMutedUsers, getSessionProfile } from '@/lib/data'

export default async function SettingsPage() {
  const [profile, blocked, muted] = await Promise.all([getSessionProfile(), getBlockedUsers(), getMutedUsers()])
  if (!profile) return null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">your name and photo, what Wild Honey sends you, your data, your account.</p>
      </div>
      <section>
        <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">name, photo &amp; colour</p>
        <ProfileEditor name={profile.name} avatarColor={profile.avatar_color} avatarUrl={profile.avatar_url} />
      </section>
      <BlockedMutedList blocked={blocked} muted={muted} />
      <PrivacySettings
        initialPrefs={profile.notification_prefs ?? {}}
        initialQuietStart={profile.quiet_hours_start}
        initialQuietEnd={profile.quiet_hours_end}
      />
    </div>
  )
}
