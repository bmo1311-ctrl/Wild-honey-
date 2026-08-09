import { redirect } from 'next/navigation'

// Community merged into the unified Circle feed.
export default function CommunityRedirectPage() {
  redirect('/app/circle')
}
