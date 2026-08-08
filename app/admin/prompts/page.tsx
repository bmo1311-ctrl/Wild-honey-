import { AddPromptForm, DeletePromptButton } from '@/components/admin/prompt-form'
import { getPromptArchive } from '@/lib/data'
import { PILLAR_META } from '@/lib/pillars'

export default async function AdminPromptsPage() {
  const prompts = await getPromptArchive()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Prompts</h1>
        <p className="mt-1 text-sm text-muted-foreground">schedule what shows up on Today, one per date.</p>
      </div>

      <AddPromptForm />

      <div className="flex flex-col gap-2">
        {prompts.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl bg-card p-3 ring-1 ring-border">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={`rounded-full px-2 py-0.5 font-medium ${PILLAR_META[p.pillar].chip}`}>
                  {p.pillar}
                </span>
                <span>{p.date_scheduled}</span>
                {p.is_premium && <span className="rounded-full bg-secondary px-2 py-0.5">premium</span>}
              </div>
              <p className="mt-1 truncate text-sm text-pretty">{p.text}</p>
            </div>
            <DeletePromptButton id={p.id} />
          </div>
        ))}
      </div>
    </div>
  )
}
