'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { ChevronDown, ChevronUp, ImageIcon, Loader2, Plus, Trash2, Video } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Block } from '@/lib/courses'
import { NESTED_TYPES, NestedBlockEditor, RawJson } from '@/components/admin/nested-blocks'
import { cn } from '@/lib/utils'

/**
 * Editing the blocks a course day is made of.
 *
 * Fifteen block types with genuinely different shapes. Rather than build
 * fifteen bespoke forms — most of which would be used twice a year — the
 * common ones get proper fields and the structural ones fall back to editing
 * their JSON directly.
 *
 * That fallback used to cover `steps`, `grid`, `versus`, `check` and
 * `figure` too, on the reasoning that a form for nested arrays was a week of
 * work to save her from something she does rarely. Both halves were wrong.
 * Steps and checklists are most of what a practical course day is made of,
 * and four of the five are the same list-of-rows underneath — build the row
 * editor once and they all fall out of it. They live in nested-blocks.tsx.
 *
 * What still lands here is genuinely unusual shapes, and they keep the
 * validated textarea: the worst case is a message about brackets, never a
 * broken day.
 */

const SIMPLE_FIELDS: Record<string, { key: string; label: string; long?: boolean }[]> = {
  text: [{ key: 'v', label: 'text', long: true }],
  h: [{ key: 'v', label: 'heading' }],
  quote: [
    { key: 'v', label: 'quote', long: true },
    { key: 'by', label: 'who said it' },
  ],
  note: [
    { key: 'title', label: 'title' },
    { key: 'v', label: 'note', long: true },
  ],
  scripture: [
    { key: 'ref', label: 'reference' },
    { key: 'text', label: 'the verse', long: true },
    { key: 'why', label: 'why it is here', long: true },
  ],
  write: [{ key: 'prompt', label: 'prompt', long: true }],
  rate: [
    { key: 'q', label: 'question' },
    { key: 'left', label: 'left end' },
    { key: 'right', label: 'right end' },
  ],
  image: [
    { key: 'alt', label: 'describe it (for anyone who cannot see it)' },
    { key: 'caption', label: 'caption' },
  ],
  video: [
    { key: 'title', label: 'title' },
    { key: 'caption', label: 'caption' },
  ],
}

const ADDABLE: { t: string; label: string }[] = [
  { t: 'text', label: 'Text' },
  { t: 'h', label: 'Heading' },
  { t: 'image', label: 'Image' },
  { t: 'video', label: 'Video' },
  { t: 'quote', label: 'Quote' },
  { t: 'scripture', label: 'Scripture' },
  { t: 'note', label: 'Note' },
  { t: 'write', label: 'Write prompt' },
  { t: 'rate', label: 'Rating' },
  { t: 'steps', label: 'Steps' },
  { t: 'check', label: 'Checklist' },
  // Three that existed in the renderer and in real course days but could not
  // be added from here, because there was no form to add them into.
  { t: 'grid', label: 'Table' },
  { t: 'versus', label: 'This vs that' },
  { t: 'figure', label: 'Pose' },
  { t: 'log', label: 'Log' },
]

function blankBlock(t: string): Record<string, unknown> {
  switch (t) {
    case 'text':
    case 'h':
      return { t, v: '' }
    case 'quote':
      return { t, v: '' }
    case 'note':
      return { t, tone: 'note', v: '' }
    case 'scripture':
      return { t, ref: '', text: '' }
    case 'write':
      return { t, prompt: '' }
    case 'rate':
      return { t, q: '' }
    case 'image':
      return { t, url: '', alt: '' }
    case 'video':
      return { t, url: '' }
    case 'steps':
      return { t, items: [{ n: 1, head: '', sub: '' }] }
    case 'check':
      return { t, items: [''] }
    case 'grid':
      return { t, cols: ['', ''], rows: [['', '']] }
    case 'versus':
      return { t, left: { head: '', items: [''] }, right: { head: '', items: [''] } }
    case 'figure':
      return { t, pose: '', label: '' }
    case 'log':
      return { t }
    default:
      return { t }
  }
}

export function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: Block[]
  onChange: (next: Block[]) => void
}) {
  const [open, setOpen] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)

  const list = blocks as unknown as Record<string, unknown>[]

  function update(i: number, next: Record<string, unknown>) {
    const copy = [...list]
    copy[i] = next
    onChange(copy as unknown as Block[])
  }
  function move(i: number, by: number) {
    const j = i + by
    if (j < 0 || j >= list.length) return
    const copy = [...list]
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
    onChange(copy as unknown as Block[])
    setOpen(j)
  }
  function remove(i: number) {
    onChange(list.filter((_, x) => x !== i) as unknown as Block[])
    setOpen(null)
  }
  function add(t: string) {
    onChange([...list, blankBlock(t)] as unknown as Block[])
    setOpen(list.length)
    setAdding(false)
  }

  return (
    <div className="flex flex-col gap-2">
      {list.map((b, i) => {
        const t = String(b.t)
        const isOpen = open === i
        return (
          <div key={i} className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
            <div className="flex items-center gap-2 px-3 py-2.5">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
                  {t}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">
                  {preview(b)}
                </span>
              </button>
              <button type="button" onClick={() => move(i, -1)} aria-label="move up" className="p-1 text-muted-foreground disabled:opacity-30" disabled={i === 0}>
                <ChevronUp className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => move(i, 1)} aria-label="move down" className="p-1 text-muted-foreground disabled:opacity-30" disabled={i === list.length - 1}>
                <ChevronDown className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => remove(i)} aria-label="delete" className="p-1 text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {isOpen && (
              <div className="border-t border-border px-3 py-3">
                <OneBlock block={b} onChange={(n) => update(i, n)} />
              </div>
            )}
          </div>
        )
      })}

      {adding ? (
        <div className="flex flex-wrap gap-1.5 rounded-2xl bg-secondary/50 p-3">
          {ADDABLE.map((a) => (
            <button
              key={a.t}
              type="button"
              onClick={() => add(a.t)}
              className="rounded-full bg-card px-3 py-1.5 text-[13px] font-medium ring-1 ring-border"
            >
              {a.label}
            </button>
          ))}
          <button type="button" onClick={() => setAdding(false)} className="px-2 text-[13px] text-muted-foreground">
            cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border py-3 text-[13.5px] font-medium text-muted-foreground"
        >
          <Plus className="h-4 w-4" />
          add a block
        </button>
      )}
    </div>
  )
}

function preview(b: Record<string, unknown>): string {
  for (const k of ['v', 'prompt', 'q', 'ref', 'title', 'alt', 'url']) {
    const val = b[k]
    if (typeof val === 'string' && val.trim()) return val.slice(0, 80)
  }
  const items = b.items
  if (Array.isArray(items) && items.length) return `${items.length} items`
  return '—'
}

function OneBlock({
  block,
  onChange,
}: {
  block: Record<string, unknown>
  onChange: (b: Record<string, unknown>) => void
}) {
  const t = String(block.t)
  const fields = SIMPLE_FIELDS[t]
  const isMedia = t === 'image' || t === 'video'

  if (!fields) {
    /*
     * Five of these now have real forms; anything else still gets the JSON.
     * The list lives in nested-blocks.tsx so adding a form there is the only
     * change needed to promote a type out of the textarea.
     */
    if (NESTED_TYPES.has(t)) {
      return <NestedBlockEditor block={block} onChange={onChange} />
    }
    return <RawJson block={block} onChange={onChange} />
  }

  return (
    <div className="flex flex-col gap-3">
      {isMedia && <MediaField block={block} onChange={onChange} />}

      {fields.map((f) => (
        <label key={f.key} className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {f.label}
          </span>
          {f.long ? (
            <textarea
              value={String(block[f.key] ?? '')}
              onChange={(e) => onChange({ ...block, [f.key]: e.target.value })}
              rows={4}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-[14px] leading-[1.5] outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
          ) : (
            <input
              value={String(block[f.key] ?? '')}
              onChange={(e) => onChange({ ...block, [f.key]: e.target.value })}
              className="h-10 w-full rounded-xl border border-border bg-background px-2.5 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
          )}
        </label>
      ))}

      {t === 'note' && (
        <div className="flex gap-1.5">
          {(['note', 'warn', 'scope'] as const).map((tone) => (
            <button
              key={tone}
              type="button"
              onClick={() => onChange({ ...block, tone })}
              className={cn(
                'rounded-full px-2.5 py-1 text-[12px] font-medium ring-1',
                block.tone === tone ? 'bg-foreground text-background ring-foreground' : 'text-muted-foreground ring-border',
              )}
            >
              {tone}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * The upload, and the paste-a-link alternative.
 *
 * Both matter. A photo she took goes in the bucket; a video already on her
 * YouTube channel should stay there rather than becoming a second copy she
 * has to keep in sync.
 */
function MediaField({
  block,
  onChange,
}: {
  block: Record<string, unknown>
  onChange: (b: Record<string, unknown>) => void
}) {
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const isVideo = block.t === 'video'
  const url = String(block.url ?? '')

  async function upload(file: File) {
    setBusy(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? (isVideo ? 'mp4' : 'jpg')
      const path = `${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from('course-media').upload(path, file)
      if (error) throw error
      const { data } = supabase.storage.from('course-media').getPublicUrl(path)
      onChange({ ...block, url: data.publicUrl })
      toast.success('Uploaded.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'That would not upload.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {url && !isVideo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="max-h-48 w-full rounded-xl object-cover ring-1 ring-border" />
      )}
      {url && isVideo && (
        <p className="truncate rounded-xl bg-muted px-2.5 py-2 text-[12px] text-muted-foreground">{url}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-secondary text-[13px] font-medium disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : isVideo ? <Video className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
          {url ? 'replace' : 'upload'}
        </button>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {isVideo ? 'or paste a YouTube link' : 'or paste an image URL'}
        </span>
        <input
          value={url}
          onChange={(e) => onChange({ ...block, url: e.target.value })}
          placeholder={isVideo ? 'https://youtube.com/watch?v=…' : 'https://…'}
          className="h-10 w-full rounded-xl border border-border bg-background px-2.5 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        />
      </label>

      <input
        ref={fileRef}
        type="file"
        accept={isVideo ? 'video/*' : 'image/*'}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void upload(f)
        }}
      />
    </div>
  )
}
