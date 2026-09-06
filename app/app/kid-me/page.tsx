import { signOut } from '@/app/actions'
import { getSessionProfile } from '@/lib/data'

export default async function KidMePage() {
  const profile = await getSessionProfile()
  return (
    <div className="flex flex-col gap-6">
      <header className="honey-glow -mx-5 -mt-6 px-5 pb-5 pt-8">
        <h1 className="font-serif text-[32px] font-semibold leading-[1.1]">{profile?.name}</h1>
        <p className="mt-1.5 text-[17px] text-muted-foreground">This is your app. Your grown-up can see how you&rsquo;re doing, and nobody else can.</p>
      </header>
      <form action={signOut}>
        <button type="submit" className="h-14 w-full rounded-2xl bg-muted text-[17px] font-semibold">Sign out</button>
      </form>
    </div>
  )
}
