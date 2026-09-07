'use client'

import { useEffect, useState } from 'react'

/**
 * The moment a day is finished.
 *
 * About a second of petals and one line, then gone. Not a screen, not a
 * modal, nothing to dismiss — the page underneath stays live the whole time,
 * so it can never become one more thing to get past.
 *
 * It only ever marks something she did. There is no version of this that
 * fires to tell her she broke anything.
 */

const PETALS = 14

/** Fixed so the burst is the same every time rather than randomly lopsided. */
const ANGLES = Array.from({ length: PETALS }, (_, i) => (360 / PETALS) * i + (i % 2 ? 9 : -9))

export function Celebrate({ show, line }: { show: boolean; line?: string | null }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!show) return
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 1400)
    return () => clearTimeout(t)
  }, [show])

  if (!visible) return null

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <div className="relative">
        {ANGLES.map((deg, i) => {
          const rad = (deg * Math.PI) / 180
          const dist = 70 + (i % 3) * 26
          return (
            <span
              key={i}
              className="petal absolute left-0 top-0 block h-2.5 w-2.5 rounded-[40%_60%_55%_45%] bg-primary"
              style={
                {
                  '--dx': `${Math.cos(rad) * dist}px`,
                  '--dy': `${Math.sin(rad) * dist}px`,
                  '--rot': `${deg}deg`,
                  '--dur': `${820 + (i % 4) * 90}ms`,
                  opacity: 0,
                } as React.CSSProperties
              }
            />
          )
        })}
      </div>

      {line && (
        <p className="burst-line absolute rounded-full bg-foreground px-5 py-2.5 font-serif text-[17px] font-semibold text-background shadow-lg">
          {line}
        </p>
      )}
    </div>
  )
}

/**
 * What to say, if anything.
 *
 * Most days say nothing — the petals are enough, and a sentence every single
 * time stops meaning anything by the second week. Milestones speak.
 */
export function celebrationLine(daysDone: number, courseLength: number): string | null {
  if (daysDone === 1) return 'you started'
  if (daysDone === courseLength) return 'you finished it'
  if (daysDone === 7) return 'one week in'
  if (daysDone === 14) return 'two weeks'
  if (daysDone === 21) return 'three weeks'
  if (daysDone === 30) return 'thirty days'
  if (daysDone > 0 && daysDone % 25 === 0) return `${daysDone} days`
  return null
}
