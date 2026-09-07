'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { saveStyleProfile } from '@/app/actions'
import {
  SEASONS, SEASON_LIST, seasonFrom, getSeason,
  type Chroma, type Hue, type SeasonKey, type Value,
} from '@/lib/color-season'
import { SHAPES, SCALES, VERTICAL, type Scale, type Shape, type VerticalProportion } from '@/lib/silhouette'
import { ColorAnalysis } from '@/components/color-analysis'
import { cn } from '@/lib/utils'

/**
 * Her colouring and her frame, asked once.
 *
 * Three ways in, because women arrive at this from three directions. Some
 * have already been draped and know their season — those women should not be
 * made to answer anything to reach a result they already paid for. Some have
 * never heard the word chroma, and for them three questions about their own
 * hair and skin is far easier than picking from twelve names that all sound
 * made up. And some would rather the app looked at a photograph, which it
 * can now do for the two axes a photograph can honestly carry.
 *
 * Whatever it lands on, she can overrule. She is the one in the mirror and
 * all of this is arithmetic.
 */
export function StyleSetup({
  initial,
}: {
  initial: { season: string | null; shape: string | null; vertical: string | null; scale: string | null }
}) {
  const [pending, start] = useTransition()
  const [season, setSeason] = useState<SeasonKey | null>((initial.season as SeasonKey) ?? null)
  const [shape, setShape] = useState<Shape | null>((initial.shape as Shape) ?? null)
  const [vertical, setVertical] = useState<VerticalProportion | null>((initial.vertical as VerticalProportion) ?? null)
  const [scale, setScale] = useState<Scale | null>((initial.scale as Scale) ?? null)

  const [hue, setHue] = useState<Hue | null>(null)
  const [value, setValue] = useState<Value | null>(null)
  const [chroma, setChroma] = useState<Chroma | null>(null)
  const [mode, setMode] = useState<'photo' | 'work-it-out' | 'i-know'>(
    initial.season ? 'i-know' : 'photo',
  )

  const derived = hue && value && chroma ? seasonFrom(hue, value, chroma) : null
  const active = getSeason(season)

  function save(patch: Parameters<typeof saveStyleProfile>[0]) {
    start(async () => {
      const res = await saveStyleProfile(patch)
      if (res && 'error' in res && res.error) toast.error(res.error)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="mb-2 px-1 font-serif text-[17px] font-semibold">your colouring</h2>

        {/*
          Three doors, because women arrive at this from three directions:
          already draped and certain, willing to answer three questions, or
          wanting the app to look at a photograph and tell them. All three
          land in the same place, and she can overrule any of them.
        */}
        <div className="mb-3 flex gap-1.5">
          {([
            ['photo', 'from a photo'],
            ['work-it-out', 'answer three questions'],
            ['i-know', 'I know mine'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              className={cn(
                'flex-1 rounded-full px-2 py-1.5 text-[12.5px] font-medium ring-1 transition-colors',
                mode === key ? 'bg-foreground text-background ring-foreground' : 'text-muted-foreground ring-border',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'photo' ? (
          <ColorAnalysis
            onAccept={(s) => {
              setSeason(s as SeasonKey)
              save({ season: s })
              setMode('i-know')
            }}
          />
        ) : mode === 'i-know' ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SEASON_LIST.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => {
                  setSeason(s.key)
                  save({ season: s.key })
                }}
                className={cn(
                  'closet-tile flex flex-col gap-2 rounded-2xl p-3 text-left ring-1 ring-inset',
                  season === s.key ? 'ring-2 ring-primary' : 'ring-black/5',
                )}
                style={{ backgroundColor: `color-mix(in oklch, ${s.signature.hex}, var(--card) 88%)` }}
              >
                <span className="flex gap-1">
                  {[...s.neutrals.slice(0, 2), ...s.colours.slice(0, 3)].map((c) => (
                    <span
                      key={c.hex}
                      className="h-4 w-4 rounded-full ring-1 ring-black/10"
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </span>
                <span className="text-[13px] font-semibold leading-tight">{s.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4 rounded-3xl bg-card p-4 ring-1 ring-border">
            <Question
              label="Does your colouring run warm or cool?"
              help="Look at your skin in daylight against a gold necklace and a silver one. Whichever disappears into you is your answer — the one that stands out is the one working against you."
              options={[
                { key: 'warm', label: 'gold disappears' },
                { key: 'cool', label: 'silver disappears' },
                { key: 'neutral', label: 'honestly, both' },
              ]}
              value={hue}
              onChange={(v) => setHue(v as Hue)}
            />
            <Question
              label="Light or deep, taking hair and eyes and skin together?"
              help="Not just your skin. Squint at a photo of yourself until the detail goes — what is left is either a light shape or a dark one."
              options={[
                { key: 'light', label: 'light overall' },
                { key: 'medium', label: 'in the middle' },
                { key: 'deep', label: 'deep overall' },
              ]}
              value={value}
              onChange={(v) => setValue(v as Value)}
            />
            <Question
              label="Clear or muted?"
              help="The axis nobody is taught, and the one that decides most. Clear colouring has a sharp line between hair, eyes and skin. Muted colouring blends, as though there is a fine grey veil over all of it."
              options={[
                { key: 'bright', label: 'clear and sharp' },
                { key: 'medium', label: 'somewhere between' },
                { key: 'soft', label: 'soft and blended' },
              ]}
              value={chroma}
              onChange={(v) => setChroma(v as Chroma)}
            />

            {derived && (
              <div className="rounded-2xl bg-muted/40 p-3">
                <p className="text-[13px] text-muted-foreground">that puts you at</p>
                <p className="mt-0.5 font-serif text-[19px] font-semibold">{SEASONS[derived].name}</p>
                <p className="mt-1 text-[13px] leading-[1.45] text-pretty text-muted-foreground">
                  {SEASONS[derived].feels}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSeason(derived)
                    save({ season: derived })
                    setMode('i-know')
                  }}
                  className="mt-3 h-10 w-full rounded-xl bg-foreground text-[14px] font-semibold text-background"
                >
                  that&rsquo;s me
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {active && (
        <section className="rounded-3xl bg-card p-4 ring-1 ring-border">
          <h3 className="font-serif text-[17px] font-semibold">{active.name}</h3>
          <p className="mt-1 text-[13.5px] leading-[1.45] text-pretty text-muted-foreground">{active.feels}</p>

          <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            the ones that do the work
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {active.neutrals.map((c) => (
              <Swatch key={c.hex} {...c} />
            ))}
          </div>

          <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            the ones that do the talking
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {active.colours.map((c) => (
              <Swatch key={c.hex} {...c} />
            ))}
          </div>

          <p className="mt-4 text-[13px] leading-[1.5] text-pretty text-muted-foreground">
            Metals: {active.metals.join(', ')}. Your own colouring carries{' '}
            {active.contrast} contrast, which is how much light-to-dark an outfit can hold before
            the clothes set the tone instead of your face.
          </p>

          <details className="mt-3">
            <summary className="cursor-pointer list-none text-[13px] text-muted-foreground underline underline-offset-2">
              colours that work harder against you
            </summary>
            <div className="mt-2 flex flex-col gap-2">
              {active.fights.map((f) => (
                <div key={f.hex} className="flex items-start gap-2.5">
                  <span
                    className="mt-0.5 h-5 w-5 shrink-0 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: f.hex }}
                  />
                  <p className="text-[12.5px] leading-[1.45] text-pretty text-muted-foreground">
                    <span className="font-medium text-foreground">{f.name}</span> — {f.because}
                  </p>
                </div>
              ))}
              <p className="mt-1 text-[12px] leading-[1.45] text-pretty text-muted-foreground">
                None of these is a rule. A colour you love, in a piece that fits, beats a
                correct colour every time — this only tells you what the room will look at first.
              </p>
            </div>
          </details>
        </section>
      )}

      <section>
        <h2 className="mb-2 px-1 font-serif text-[17px] font-semibold">your frame</h2>
        <div className="flex flex-col gap-4 rounded-3xl bg-card p-4 ring-1 ring-border">
          <div>
            <p className="text-sm font-medium">Which of these describes your outline?</p>
            <div className="mt-2 flex flex-col gap-1.5">
              {Object.values(SHAPES).map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => {
                    setShape(s.key)
                    save({ shape: s.key })
                  }}
                  className={cn(
                    'rounded-2xl px-3 py-2.5 text-left ring-1 transition-colors',
                    shape === s.key ? 'bg-secondary ring-foreground' : 'ring-border',
                  )}
                >
                  <span className="block text-[14px] font-medium">{s.name}</span>
                  <span className="mt-0.5 block text-[12.5px] leading-[1.4] text-pretty text-muted-foreground">
                    {s.reads}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Question
            label="Where does your body split?"
            help="Sit down on a hard chair. If your torso looks long relative to your thigh, you are longer through the body. This is the single highest-leverage thing in your whole wardrobe, and almost nobody knows theirs."
            options={[
              { key: 'long-torso', label: VERTICAL['long-torso'].name },
              { key: 'even', label: VERTICAL.even.name },
              { key: 'long-leg', label: VERTICAL['long-leg'].name },
            ]}
            value={vertical}
            onChange={(v) => {
              setVertical(v as VerticalProportion)
              save({ vertical: v })
            }}
          />
          {vertical && (
            <p className="-mt-2 text-[12.5px] leading-[1.45] text-pretty text-muted-foreground">
              {VERTICAL[vertical].note}
            </p>
          )}

          <Question
            label="And your height?"
            options={[
              { key: 'petite', label: 'petite' },
              { key: 'average', label: 'average' },
              { key: 'tall', label: 'tall' },
            ]}
            value={scale}
            onChange={(v) => {
              setScale(v as Scale)
              save({ scale: v })
            }}
          />
          {scale && (
            <p className="-mt-2 text-[12.5px] leading-[1.45] text-pretty text-muted-foreground">
              {SCALES[scale].note}
            </p>
          )}
        </div>
      </section>

      {shape && (
        <section className="rounded-3xl bg-card p-4 ring-1 ring-border">
          <h3 className="font-serif text-[17px] font-semibold">what tends to be true for you</h3>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            The eye goes where lines meet. Yours already rest at {SHAPES[shape].restsAt}.
          </p>
          <ul className="mt-3 flex flex-col gap-2.5">
            {SHAPES[shape].worksBecause.map((w) => (
              <li key={w} className="flex gap-2.5 text-[13.5px] leading-[1.5] text-pretty">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                {w}
              </li>
            ))}
          </ul>
        </section>
      )}

      {pending && <p className="px-1 text-[12px] text-muted-foreground">saving…</p>}
    </div>
  )
}

function Swatch({ name, hex }: { name: string; hex: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-muted/50 py-1 pl-1 pr-2.5">
      <span className="h-5 w-5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: hex }} />
      <span className="text-[12px]">{name}</span>
    </span>
  )
}

function Question({
  label,
  help,
  options,
  value,
  onChange,
}: {
  label: string
  help?: string
  options: { key: string; label: string }[]
  value: string | null
  onChange: (v: string) => void
}) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      {help && <p className="mt-0.5 text-[12.5px] leading-[1.45] text-pretty text-muted-foreground">{help}</p>}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className={cn(
              'rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 transition-colors',
              value === o.key ? 'bg-foreground text-background ring-foreground' : 'text-muted-foreground ring-border',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
