import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getAllWritings, getMyEntries, getMyEntryForPrompt, getTodayPrompt } from '@/lib/data'
import { JournalComposer } from '@/components/journal-composer'
import { cn } from '@/lib/utils'

/** Everything she has written, newest first. Nothing here is destructive. */
export default async function WritePage() {
  const [courseWritings, entries, prompt] = await Promise.all([getAllWritings(), getMyEntries(), getTodayPrompt()])
  const existing = prompt ? await getMyEntryForPrompt(prompt.id) : null

  // One notebook: course answers and free writing, newest first.
  const writings = [
    ...courseWritings
      .filter((w) => w.kind === 'write' && w.body.trim())
      .map((w) => ({ id: w.id, when: w.updated_at, kicker: `${w.course_title} · Day ${w.day_number}`, prompt: w.prompt, body: w.body, href: `/app/program/${w.course_slug}/day/${w.day_number}` })),
    ...entries
      .filter((e) => e.text?.trim())
      .map((e) => ({ id: e.id, when: e.created_at, kicker: e.prompt ? 'Prompt' : 'Free write', prompt: e.prompt?.text ?? '', body: e.text, href: '/app/write' })),
  ].sort((a, b) => b.when.localeCompare(a.when))

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-serif text-[29px] font-semibold leading-[1.1]">Write</h1>
        <p className="mt-1.5 text-[15px] leading-[1.5] text-pretty text-muted-foreground">
          everything you&rsquo;ve written, newest first.
        </p>
      </header>

      <section className="rounded-2xl border border-border border-l-[3px] border-l-primary bg-card p-4">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-primary">{prompt ? "Today's prompt" : 'Write'}</p>
        {prompt && <p className="mt-2 font-serif text-[17px] leading-snug text-pretty">{prompt.text}</p>}
        <div className="mt-3">
          <JournalComposer promptId={prompt?.id ?? null} existing={existing} />
        </div>
      </section>

      {writings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-[15px] text-muted-foreground text-pretty">
            Nothing written yet. Answer the prompt above, or just write.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {writings.map((w) => (
            <Link
              key={w.id}
              href={w.href}
              className={cn('flex items-center gap-3 rounded-2xl border border-border bg-card p-4')}
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-mindset-pillar">{w.kicker}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(w.when).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </span>
                <span className="mt-1 block font-serif text-[14.5px] font-medium leading-snug text-pretty">{w.prompt}</span>
                <span className="mt-1 block truncate text-sm text-muted-foreground">{w.body.trim().split('\n')[0]}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
