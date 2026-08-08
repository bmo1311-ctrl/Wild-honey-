import { Lightbulb, TrendingUp } from 'lucide-react'
import type { Checkin } from '@/lib/types'

const SYMPTOM_GUIDANCE: Record<string, string[]> = {
  'brain fog': ['hydrate first — even mild dehydration affects focus', 'a short walk outside can reset your head', 'consider whether sleep or blood sugar dips are involved'],
  'low energy': ['check protein and iron-rich foods at your next meal', 'a 10-minute walk often helps more than caffeine', 'notice if this tracks with your cycle phase'],
  PMS: ['magnesium-rich foods (dark leafy greens, nuts) may help', 'gentle movement over intense workouts this week', 'be extra kind to yourself — this is a real physiological shift'],
  bloating: ['slow down at meals and chew thoroughly', 'peppermint or ginger tea is a gentle traditional remedy', 'notice patterns with specific foods'],
  acne: ['track it against your cycle phase — hormonal patterns are common', 'stay hydrated and prioritize sleep', 'gentle, consistent skincare beats aggressive changes'],
  headache: ['check hydration first — it\'s the most common trigger', 'screen breaks every 30-45 minutes if you\'ve been on a device', 'note whether stress or sleep was a factor'],
  'poor sleep': ['morning sunlight helps reset your circadian rhythm', 'try cutting screens 30 minutes before bed', 'a consistent wind-down routine trains your body to expect rest'],
  cramping: ['a heating pad or warm bath can ease muscle tension', 'gentle movement like walking or stretching often helps more than resting', 'magnesium and staying hydrated may reduce intensity'],
  anxiety: ['the calming breath (in for 4, hold for 4, out for 6) signals safety to your nervous system', 'limit caffeine today, it can amplify anxious energy', 'write down what\'s actually in your control right now'],
  irritability: ['low blood sugar and poor sleep are common hidden causes — check both', 'a few minutes alone before responding to anything stressful', 'this often eases as hormones shift — be patient with yourself'],
  'joint pain': ['gentle movement is usually better than complete rest', 'anti-inflammatory foods (berries, leafy greens, fatty fish) may help', 'note whether this correlates with your cycle or with specific activities'],
  'digestive issues': ['slow down at meals and chew thoroughly', 'note any specific foods that seem to trigger it', 'peppermint tea is a gentle traditional remedy for cramping or bloating'],
  nausea: ['small, bland meals rather than large ones', 'ginger tea or ginger candy can help settle your stomach', 'if persistent or severe, check in with a doctor'],
  'tender breasts': ['this is common in the luteal phase and usually hormonal', 'a supportive, well-fitted bra can help with comfort', 'reducing caffeine and salt this week may ease it'],
}

const SYMPTOM_KEYS = Object.keys(SYMPTOM_GUIDANCE)

function PatternInsight({ symptoms, recentCheckins }: { symptoms: string[]; recentCheckins: Checkin[] }) {
  const insights: string[] = []
  for (const symptom of symptoms) {
    const withSymptom = recentCheckins.filter((c) => c.symptoms?.includes(symptom) && c.cycle_phase && c.cycle_phase !== 'not_tracked')
    if (withSymptom.length < 3) continue
    const phaseCounts: Record<string, number> = {}
    withSymptom.forEach((c) => {
      if (c.cycle_phase) phaseCounts[c.cycle_phase] = (phaseCounts[c.cycle_phase] ?? 0) + 1
    })
    const [topPhase, topCount] = Object.entries(phaseCounts).sort((a, b) => b[1] - a[1])[0]
    if (topCount / withSymptom.length >= 0.6) {
      insights.push(`${symptom} shows up most during your ${topPhase} phase (${topCount} of ${withSymptom.length} times logged).`)
    }
  }
  if (insights.length === 0) return null
  return (
    <div className="rounded-2xl bg-honey/10 p-4 ring-1 ring-honey/20">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-3.5 w-3.5 text-honey" />
        <p className="text-sm font-semibold">a pattern in your data</p>
      </div>
      <ul className="mt-2 flex flex-col gap-1">
        {insights.map((ins, i) => (
          <li key={i} className="text-xs text-muted-foreground text-pretty">
            {ins}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SymptomIntelligence({ symptoms, recentCheckins = [] }: { symptoms: string[]; recentCheckins?: Checkin[] }) {
  if (symptoms.length === 0) return null
  return (
    <div className="flex flex-col gap-3">
      <PatternInsight symptoms={symptoms} recentCheckins={recentCheckins} />
      {symptoms.map((s) => {
        const tips = SYMPTOM_GUIDANCE[s]
        if (!tips) return null
        return (
          <div key={s} className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-3.5 w-3.5 text-honey" />
              <p className="text-sm font-semibold capitalize">{s}</p>
            </div>
            <ul className="mt-2 flex flex-col gap-1.5">
              {tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                  <span className="text-pretty">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
      <p className="text-[0.7rem] text-muted-foreground">this is educational content, not medical advice. talk to a doctor about anything persistent or concerning.</p>
    </div>
  )
}

export { SYMPTOM_KEYS }
