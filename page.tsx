import { Lock, Users } from 'lucide-react'
import { getMyEntries } from '@/lib/data'
import { PILLAR_META, relativeTime } from '@/lib/pillars'

export default async function ArchivePage() {
  const entries = await getMyEntries()

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Your archive</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          {entries.length > 0
            ? `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} in your practice so far.`
            : 'Everything you write lives here.'}
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="font-serif text-lg font-semibold">No entries yet</p>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            Head to Today and write your first page.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {entries.map((entry) => {
            const pillar = entry.prompt?.pillar
            return (
              <article key={entry.id} className="rounded-2xl bg-card p-5 ring-1 ring-border">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {pillar && (
                      <span
                        className={`rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${PILLAR_META[pillar].chip}`}
                      >
                        {pillar}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      {entry.visibility === 'circle' ? (
                        <>
                          <Users className="h-3 w-3" /> Shared
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3" /> Private
                        </>
                      )}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {relativeTime(entry.created_at)}
                  </span>
                </div>
                {entry.prompt && (
                  <p className="mt-3 text-sm italic text-muted-foreground text-pretty">
                    &ldquo;{entry.prompt.text}&rdquo;
                  </p>
                )}
                <p className="mt-2 whitespace-pre-wrap leading-relaxed text-pretty">{entry.text}</p>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
