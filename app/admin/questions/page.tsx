import { QuestionCard } from '@/components/admin/question-answer-form'
import { getAllQuestionsForAdmin } from '@/lib/data'

export default async function AdminQuestionsPage() {
  const questions = await getAllQuestionsForAdmin()
  const unanswered = questions.filter((q) => !q.answer)
  const answered = questions.filter((q) => q.answer)

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Ask an Expert</h1>
        <p className="mt-1 text-sm text-muted-foreground">answer member questions — mark any as public to add them to the shared vault.</p>
      </div>

      <div>
        <h2 className="mb-3 font-serif text-lg font-semibold">unanswered ({unanswered.length})</h2>
        {unanswered.length === 0 ? (
          <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">nothing waiting — nice.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {unanswered.map((q) => (
              <QuestionCard key={q.id} question={q} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-serif text-lg font-semibold">answered ({answered.length})</h2>
        <div className="flex flex-col gap-3">
          {answered.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      </div>
    </div>
  )
}
