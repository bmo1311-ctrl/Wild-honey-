import { HelpCircle } from 'lucide-react'
import { AskExpertForm } from '@/components/ask-expert-form'
import { PILLAR_META, relativeTime } from '@/lib/pillars'
import { getMyQuestions, getPublicAnsweredQuestions } from '@/lib/data'
import { FeatureOff } from '@/components/feature-off'
import { FEATURES } from '@/lib/features'

export default async function AskExpertPage() {
  if (!FEATURES.expertQA) return <FeatureOff />

  const [mine, publicQA] = await Promise.all([getMyQuestions(), getPublicAnsweredQuestions()])
  const otherPublic = publicQA.filter((q) => !mine.some((m) => m.id === q.id))

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Ask an Expert</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">send a question straight to Brooke — answers show up here once they're ready.</p>
      </div>

      <AskExpertForm />

      {mine.length > 0 && (
        <div>
          <h2 className="mb-3 font-serif text-lg font-semibold">your questions</h2>
          <div className="flex flex-col gap-3">
            {mine.map((q) => (
              <div key={q.id} className="rounded-2xl bg-card p-4 ring-1 ring-border">
                <div className="flex items-center gap-2">
                  {q.pillar && <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${PILLAR_META[q.pillar].chip}`}>{q.pillar}</span>}
                  <span className="text-xs text-muted-foreground">{relativeTime(q.created_at)}</span>
                </div>
                <p className="mt-2 text-sm font-medium text-pretty">{q.question}</p>
                {q.answer ? (
                  <div className="mt-2 flex items-start gap-2 rounded-xl bg-honey/10 p-3">
                    <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-honey" />
                    <p className="text-sm text-pretty">{q.answer}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">waiting on an answer...</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {otherPublic.length > 0 && (
        <div>
          <h2 className="mb-3 font-serif text-lg font-semibold">from the vault</h2>
          <div className="flex flex-col gap-3">
            {otherPublic.map((q) => (
              <div key={q.id} className="rounded-2xl bg-card p-4 ring-1 ring-border">
                {q.pillar && <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${PILLAR_META[q.pillar].chip}`}>{q.pillar}</span>}
                <p className="mt-2 text-sm font-medium text-pretty">{q.question}</p>
                <div className="mt-2 flex items-start gap-2 rounded-xl bg-honey/10 p-3">
                  <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-honey" />
                  <p className="text-sm text-pretty">{q.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
