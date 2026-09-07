'use client'

import { useRef, useState } from 'react'
import { Camera, RotateCcw } from 'lucide-react'
import {
  analyse, trustLine, neighbourOf,
  type Analysis, type Sample,
} from '@/lib/color-analysis'
import { SEASONS, type Hue } from '@/lib/color-season'
import { cn } from '@/lib/utils'

type SpotKey = 'reference' | 'skin' | 'hair' | 'eye'

const SPOTS: { key: SpotKey; label: string; ask: string; optional?: boolean }[] = [
  {
    key: 'reference',
    label: 'the white thing',
    ask: 'Tap the whitest thing in the photo — paper, a white shirt, a wall. This is what corrects for the light you were standing in, and it is the difference between a real reading and a guess.',
  },
  { key: 'skin', label: 'your skin', ask: 'Tap your cheek, in an evenly lit spot. Avoid blusher and avoid shadow.' },
  { key: 'hair', label: 'your hair', ask: 'Tap the body of your hair, not a shine or a highlight.' },
  { key: 'eye', label: 'your iris', ask: 'Tap the coloured ring of one eye. Zoom in if you need to.' },
]

/**
 * Colour analysis from her own photograph.
 *
 * She taps four points rather than the app finding her face, and that is a
 * deliberate choice rather than a shortcut. Face detection would find the
 * cheek reliably and the iris badly, and it would give no way at all to
 * identify the white reference, which is the single most important sample of
 * the four. Four taps also means she can see exactly what was measured,
 * which is what makes the result arguable — and it should be arguable.
 *
 * The result is a suggestion with its own confidence attached, and the
 * warmth question is asked rather than measured. See lib/color-analysis.ts
 * for why that is the honest split.
 */
export function ColorAnalysis({ onAccept }: { onAccept: (season: string) => void }) {
  const [src, setSrc] = useState<string | null>(null)
  const [spots, setSpots] = useState<Partial<Record<SpotKey, { x: number; y: number; hex: string }>>>({})
  const [step, setStep] = useState(0)
  const [hue, setHue] = useState<Hue | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const current = SPOTS[step]
  const ready = Boolean(spots.skin && spots.hair && spots.eye)

  const analysis: Analysis | null = ready
    ? analyse({
        skin: { hex: spots.skin!.hex },
        hair: { hex: spots.hair!.hex },
        eye: { hex: spots.eye!.hex },
        reference: spots.reference ? ({ hex: spots.reference.hex } as Sample) : null,
        hue,
      })
    : null

  function reset() {
    setSpots({})
    setStep(0)
    setHue(null)
  }

  /**
   * Sample a patch, not a pixel.
   *
   * A single pixel on a phone photo is mostly sensor noise and JPEG
   * artefacts. An eleven-by-eleven median-ish average of the area she tapped
   * is what she thinks she is tapping.
   */
  function sampleAt(clientX: number, clientY: number) {
    const img = imgRef.current
    if (!img) return
    const rect = img.getBoundingClientRect()
    const rx = (clientX - rect.left) / rect.width
    const ry = (clientY - rect.top) / rect.height
    if (rx < 0 || rx > 1 || ry < 0 || ry > 1) return

    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(img, 0, 0)

    const px = Math.round(rx * canvas.width)
    const py = Math.round(ry * canvas.height)
    const r = 5
    const x0 = Math.max(0, px - r)
    const y0 = Math.max(0, py - r)
    const w = Math.min(canvas.width - x0, r * 2 + 1)
    const h = Math.min(canvas.height - y0, r * 2 + 1)
    const { data } = ctx.getImageData(x0, y0, w, h)

    let rs = 0, gs = 0, bs = 0, n = 0
    for (let i = 0; i < data.length; i += 4) {
      rs += data[i]; gs += data[i + 1]; bs += data[i + 2]; n++
    }
    if (n === 0) return
    const hex = `#${[rs, gs, bs].map((v) => Math.round(v / n).toString(16).padStart(2, '0')).join('')}`

    setSpots((s) => ({ ...s, [current.key]: { x: rx, y: ry, hex } }))
    if (step < SPOTS.length - 1) setStep(step + 1)
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-card p-4 ring-1 ring-border">
      {!src ? (
        <>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-44 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/40 text-muted-foreground"
          >
            <Camera className="h-6 w-6" />
            <span className="text-[13px]">a photo of you</span>
          </button>
          <div className="rounded-2xl bg-muted/40 p-3">
            <p className="text-[12.5px] font-medium">for this to mean anything</p>
            <ul className="mt-1.5 flex flex-col gap-1 text-[12.5px] leading-[1.45] text-pretty text-muted-foreground">
              <li>· Daylight, near a window, no lamp on. Indoor bulbs are the single biggest cause of a wrong answer.</li>
              <li>· Hold something white next to your face — paper, a white shirt. Without it, warmth cannot be corrected for at all.</li>
              <li>· No makeup and hair back, if you can. No filter, ever.</li>
            </ul>
            <p className="mt-2 text-[12px] leading-[1.45] text-pretty text-muted-foreground">
              The photo never leaves your phone. All of this is measured in your own browser and
              nothing is uploaded or stored — only the season you choose at the end is saved.
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="relative overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt=""
              className="w-full cursor-crosshair select-none"
              onClick={(e) => sampleAt(e.clientX, e.clientY)}
            />
            {SPOTS.map((s) => {
              const spot = spots[s.key]
              if (!spot) return null
              return (
                <span
                  key={s.key}
                  className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                  style={{ left: `${spot.x * 100}%`, top: `${spot.y * 100}%`, backgroundColor: spot.hex }}
                />
              )
            })}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">
            {SPOTS.map((s, i) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setStep(i)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-[12.5px] font-medium ring-1 transition-colors',
                  step === i ? 'bg-foreground text-background ring-foreground' : 'ring-border',
                )}
              >
                <span
                  className="h-5 w-5 rounded-full ring-1 ring-black/10"
                  style={{ backgroundColor: spots[s.key]?.hex ?? 'var(--muted)' }}
                />
                {s.label}
              </button>
            ))}
            <button
              type="button"
              onClick={reset}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 ring-border"
              aria-label="start the taps again"
            >
              <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>

          <p className="text-[13px] leading-[1.45] text-pretty text-muted-foreground">{current.ask}</p>
        </>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (!f) return
          setSrc(URL.createObjectURL(f))
          reset()
        }}
      />

      {analysis && (
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          {/* Problems first. Nobody rereads a caveat under a verdict. */}
          {analysis.problems.length > 0 && (
            <div className="flex flex-col gap-1.5 rounded-2xl bg-muted/50 p-3">
              {analysis.problems.map((p) => (
                <p key={p} className="text-[12.5px] leading-[1.45] text-pretty text-muted-foreground">
                  {p}
                </p>
              ))}
            </div>
          )}

          <Measured label="how light or deep you are" reading={analysis.value} />
          <Measured label="how clear or muted" reading={analysis.chroma} />

          {/* The one the photo cannot do. Asked, not measured. */}
          <div>
            <p className="text-[13px] font-medium">warm or cool?</p>
            <p className="mt-0.5 text-[12.5px] leading-[1.45] text-pretty text-muted-foreground">
              This one you have to answer. A phone camera cannot separate warm skin from warm
              light well enough to be worth trusting, and your own mirror can — hold gold to your
              face, then silver. Whichever disappears into you is your answer.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(['warm', 'cool', 'neutral'] as Hue[]).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHue(h)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 transition-colors',
                    hue === h ? 'bg-foreground text-background ring-foreground' : 'text-muted-foreground ring-border',
                  )}
                >
                  {h === 'warm' ? 'gold disappears' : h === 'cool' ? 'silver disappears' : 'honestly, both'}
                </button>
              ))}
            </div>
          </div>

          {analysis.season && (
            <div className="rounded-2xl bg-muted/40 p-3">
              <p className="text-[12.5px] text-muted-foreground">that puts you at</p>
              <p className="mt-0.5 font-serif text-[20px] font-semibold">
                {SEASONS[analysis.season].name}
              </p>
              <p className="mt-1 text-[13px] leading-[1.45] text-pretty text-muted-foreground">
                {SEASONS[analysis.season].feels}
              </p>

              <p className="mt-2.5 text-[12.5px] leading-[1.45] text-pretty text-muted-foreground">
                {trustLine(analysis)}
              </p>

              {(() => {
                const n = neighbourOf(analysis)
                return n ? (
                  <p className="mt-1.5 text-[12.5px] leading-[1.45] text-pretty text-muted-foreground">
                    Your closest neighbour is <span className="font-medium text-foreground">{SEASONS[n].name}</span>.
                    Hold the two palettes up in a mirror — that settles it in a minute, which nothing
                    here can.
                  </p>
                ) : null
              })()}

              <button
                type="button"
                onClick={() => onAccept(analysis.season!)}
                className="mt-3 h-11 w-full rounded-xl bg-foreground text-[14px] font-semibold text-background"
              >
                use {SEASONS[analysis.season].name}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Measured<T extends string>({
  label,
  reading,
}: {
  label: string
  reading: { value: T; confidence: string; because: string }
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="flex-1 border-b border-dashed border-border" />
      <span className="text-right">
        <span className="text-[14px] font-semibold">{reading.value}</span>
        {reading.confidence !== 'good' && (
          <span className="ml-1.5 text-[11px] text-muted-foreground">rough</span>
        )}
        <span className="mt-0.5 block max-w-[15rem] text-[11.5px] leading-[1.4] text-pretty text-muted-foreground">
          {reading.because}
        </span>
      </span>
    </div>
  )
}
