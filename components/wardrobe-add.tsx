'use client'

import { useRef, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Camera, Loader2 } from 'lucide-react'
import { addGarment } from '@/app/actions'
import { LAYERS, OCCASIONS, type Layer, type Occasion } from '@/lib/wardrobe'
import { inferEffects, EFFECT_LABEL } from '@/lib/silhouette'
import { cn } from '@/lib/utils'

/**
 * Adding a piece: a photo, a name, and where you wear it.
 *
 * Everything else the engine needs, it works out. The colour is read off her
 * own photograph and the line effects are read out of what she called the
 * thing, because a form with thirteen checkboxes per garment is a wardrobe
 * nobody ever finishes entering — and she has asked, more than once, for one
 * two done.
 *
 * Both guesses are shown before saving, so nothing is decided behind her
 * back and a wrong one is one tap from fixed.
 */
export function WardrobeAdd({ onDone }: { onDone?: () => void }) {
  const [pending, start] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [name, setName] = useState('')
  const [layer, setLayer] = useState<Layer>('top')
  const [occasions, setOccasions] = useState<Occasion[]>(['everyday'])
  const [hex, setHex] = useState<string>('#B0A08C')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const effects = inferEffects(name, layer)

  async function onFile(file: File) {
    setUploading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Sign in again.')

      // Read the colour before uploading, so the swatch is right immediately.
      const dominant = await dominantColour(file)
      if (dominant) setHex(dominant)

      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from('wardrobe').upload(path, file)
      if (error) throw error
      const { data } = supabase.storage.from('wardrobe').getPublicUrl(path)
      setImageUrl(data.publicUrl)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'That photo would not upload.')
    } finally {
      setUploading(false)
    }
  }

  function save() {
    if (!name.trim()) {
      toast.error('It needs a name.')
      return
    }
    start(async () => {
      const res = await addGarment({
        name,
        layer,
        hex,
        effects,
        occasions,
        imageUrl,
      })
      if (res && 'error' in res && res.error) {
        toast.error(res.error)
        return
      }
      setName('')
      setImageUrl(null)
      toast.success('In your closet.')
      onDone?.()
    })
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-card p-4 ring-1 ring-border">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="relative flex h-44 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted/40"
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <span className="flex flex-col items-center gap-1.5 text-muted-foreground">
            <Camera className="h-6 w-6" />
            <span className="text-[13px]">photograph it</span>
          </span>
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void onFile(f)
        }}
      />

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="cream silk shirt, high-waisted wide leg…"
        className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      />

      <div className="flex flex-wrap gap-1.5">
        {LAYERS.map((l) => (
          <button
            key={l.key}
            type="button"
            onClick={() => setLayer(l.key)}
            className={cn(
              'rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 transition-colors',
              layer === l.key ? 'bg-foreground text-background ring-foreground' : 'text-muted-foreground ring-border',
            )}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div>
        <p className="mb-1.5 text-[12px] text-muted-foreground">where you wear it</p>
        <div className="flex flex-wrap gap-1.5">
          {OCCASIONS.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() =>
                setOccasions((prev) =>
                  prev.includes(o.key) ? prev.filter((x) => x !== o.key) : [...prev, o.key],
                )
              }
              className={cn(
                'rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 transition-colors',
                occasions.includes(o.key)
                  ? 'bg-foreground text-background ring-foreground'
                  : 'text-muted-foreground ring-border',
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* What it worked out, shown rather than assumed. */}
      <div className="flex items-center gap-3 rounded-2xl bg-muted/40 px-3 py-2.5">
        <label className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-black/10">
          <span className="absolute inset-0" style={{ backgroundColor: hex }} />
          <input
            type="color"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="colour"
          />
        </label>
        <p className="min-w-0 flex-1 text-[12px] leading-[1.4] text-muted-foreground">
          {imageUrl ? 'colour read from your photo — tap to change. ' : 'tap the circle to set the colour. '}
          {effects.length > 0 && (
            <span>
              It {effects.map((e) => EFFECT_LABEL[e]).join(', and ')}.
            </span>
          )}
        </p>
      </div>

      <button
        type="button"
        onClick={save}
        disabled={pending || uploading}
        className="h-12 rounded-2xl bg-primary text-[15px] font-bold text-primary-foreground disabled:opacity-50"
      >
        {pending ? 'saving…' : 'add to closet'}
      </button>
    </div>
  )
}

/**
 * The colour of the garment, read off her photograph.
 *
 * Averaging the whole image gives mud, so this buckets pixels into coarse
 * colour bins and takes the fullest bin — the same trick a colour picker
 * uses. It ignores the outer border, which is usually a wall or a duvet
 * rather than the clothes, and it throws away near-white and near-black
 * pixels, which are usually the background or the shadow under a hanger.
 */
async function dominantColour(file: File): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(file)
    const size = 120
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(bitmap, 0, 0, size, size)

    const inset = Math.floor(size * 0.18)
    const { data } = ctx.getImageData(inset, inset, size - inset * 2, size - inset * 2)

    const bins = new Map<string, { n: number; r: number; g: number; b: number }>()
    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]]
      if (a < 200) continue
      const max = Math.max(r, g, b), min = Math.min(r, g, b)
      // Background and shadow, not fabric.
      if (max > 244 && min > 232) continue
      if (max < 24) continue
      const key = `${r >> 5}-${g >> 5}-${b >> 5}`
      const bin = bins.get(key) ?? { n: 0, r: 0, g: 0, b: 0 }
      bin.n++; bin.r += r; bin.g += g; bin.b += b
      bins.set(key, bin)
    }

    let best: { n: number; r: number; g: number; b: number } | null = null
    for (const bin of bins.values()) if (!best || bin.n > best.n) best = bin
    if (!best) return null

    const hex = (v: number) => Math.round(v / best!.n).toString(16).padStart(2, '0')
    return `#${hex(best.r)}${hex(best.g)}${hex(best.b)}`
  } catch {
    return null
  }
}
