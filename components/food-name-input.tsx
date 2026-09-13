'use client'

import { useMemo, useState } from 'react'

/**
 * A name field that knows the food library.
 *
 * The grocery list and the pantry both asked her to type an item into a
 * blank box while 407 foods sat in a table the app already loads elsewhere.
 * Two systems in the same section of the app, not speaking to each other.
 *
 * Matching is a plain substring filter rather than anything cleverer — the
 * list is small enough that it is instant, and a fuzzy match that offers
 * "chicken thighs" when she typed "chia" is worse than no match at all.
 *
 * It never blocks her. What she types is what gets saved; the list is only
 * ever a shortcut, so "nana's soup" works exactly as well as "spinach".
 */
export function FoodNameInput({
  value,
  onChange,
  foodNames,
  placeholder,
  className,
  onEnter,
}: {
  value: string
  onChange: (v: string) => void
  /** Names from the food library. Filtered client-side; the list is tiny. */
  foodNames: string[]
  placeholder?: string
  className?: string
  onEnter?: () => void
}) {
  const [focused, setFocused] = useState(false)

  const matches = useMemo(() => {
    const t = value.trim().toLowerCase()
    if (t.length < 2) return []
    // An exact match means she has already picked it — no point suggesting
    // the thing that is currently in the box.
    return foodNames
      .filter((n) => n.toLowerCase().includes(t) && n.toLowerCase() !== t)
      .slice(0, 6)
  }, [value, foodNames])

  const show = focused && matches.length > 0

  return (
    <div className="relative flex-1">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        // Delayed so a tap on a suggestion lands before the list disappears.
        onBlur={() => setTimeout(() => setFocused(false), 120)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onEnter?.()
          if (e.key === 'Escape') setFocused(false)
        }}
        placeholder={placeholder}
        className={className}
      />

      {show && (
        <ul className="absolute left-0 right-0 top-full z-30 mt-1 flex flex-col overflow-hidden rounded-xl bg-card shadow-lg ring-1 ring-border">
          {matches.map((n) => (
            <li key={n}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(n)
                  setFocused(false)
                }}
                className="w-full border-b border-border px-3 py-2.5 text-left text-[14px] last:border-0 hover:bg-muted"
              >
                {n}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
