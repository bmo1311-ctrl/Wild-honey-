'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'

/**
 * Forms for the five block types that used to be raw JSON.
 *
 * The original editor gave proper fields to the nine flat block types and sent
 * `steps`, `check`, `grid`, `versus` and `figure` to a textarea, with a comment
 * calling it a deliberate trade: a week of work to save her from something she
 * does rarely.
 *
 * That was wrong on both halves. It is not rare — `steps` and `check` are what
 * a practical course day is mostly made of. And it is not a week, because four
 * of the five are the same thing underneath: a list of rows she can add to,
 * delete from and reorder. Build the row editor once and `steps`, `check`,
 * `grid` and `versus` all fall out of it; `figure` is three plain fields and
 * never needed JSON at all.
 *
 * The JSON is still there, behind a disclosure, for the day something is
 * shaped oddly. But it is no longer the only way in.
 */

const field =
  'w-full rounded-xl border border-border bg-background p-2.5 text-[14px] leading-[1.5] outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
const label = 'text-[11px] font-medium uppercase tracking-wide text-muted-foreground'

/** Which types this file can draw. Anything else still falls back to JSON. */
export const NESTED_TYPES = new Set(['steps', 'check', 'grid', 'versus', 'figure'])

function Labelled({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className={label}>{text}</span>
      {children}
    </label>
  )
}

/**
 * One row in a list, with the controls that make a list editable.
 *
 * Up, down and delete on every row rather than drag handles — this gets used
 * on a phone as often as a laptop, and a four-pixel drag target on a phone is
 * not a feature.
 */
function Row({
  index,
  count,
  onMove,
  onRemove,
  children,
}: {
  index: number
  count: number
  onMove: (by: number) => void
  onRemove: () => void
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-1.5 rounded-xl bg-secondary/40 p-2">
      <span className="mt-2.5 w-4 shrink-0 text-center text-[11px] font-semibold text-muted-foreground">
        {index + 1}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">{children}</div>
      <div className="flex shrink-0 flex-col">
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={index === 0}
          aria-label="move up"
          className="p-1 text-muted-foreground disabled:opacity-30"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={index === count - 1}
          aria-label="move down"
          className="p-1 text-muted-foreground disabled:opacity-30"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
      <button type="button" onClick={onRemove} aria-label="delete row" className="shrink-0 p-1 text-destructive">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function AddRow({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2 text-[13px] font-medium text-muted-foreground"
    >
      <Plus className="h-3.5 w-3.5" />
      {text}
    </button>
  )
}

/** Move an item within a list, or return the list untouched if it cannot. */
export function moved<T>(list: T[], from: number, by: number): T[] {
  const to = from + by
  if (to < 0 || to >= list.length) return list
  const copy = [...list]
  ;[copy[from], copy[to]] = [copy[to], copy[from]]
  return copy
}

/** Every row padded or trimmed to exactly `width` cells. Exported for tests. */
export function squareRows(width: number, rows: string[][]): string[][] {
  return rows.map((r) => Array.from({ length: width }, (_, i) => r[i] ?? ''))
}

function TitleField({
  block,
  onChange,
}: {
  block: Record<string, unknown>
  onChange: (b: Record<string, unknown>) => void
}) {
  return (
    <Labelled text="title (optional)">
      <input
        value={String(block.title ?? '')}
        onChange={(e) => onChange({ ...block, title: e.target.value })}
        className={field}
      />
    </Labelled>
  )
}

/* ── steps ─────────────────────────────────────────────────────────────── */

interface Step {
  n: number
  head: string
  sub?: string
}

function StepsEditor({
  block,
  onChange,
}: {
  block: Record<string, unknown>
  onChange: (b: Record<string, unknown>) => void
}) {
  const items = (Array.isArray(block.items) ? block.items : []) as Step[]

  /*
   * `n` is the number shown on the step. It is renumbered from position on
   * every change rather than being hers to maintain — the old JSON let the
   * numbers drift out of order the moment a step was inserted in the middle,
   * and a numbered list that goes 1, 2, 4, 3 is worse than no numbers.
   */
  const set = (next: Step[]) =>
    onChange({ ...block, items: next.map((s, i) => ({ ...s, n: i + 1 })) })

  return (
    <div className="flex flex-col gap-2.5">
      <TitleField block={block} onChange={onChange} />
      {items.map((s, i) => (
        <Row
          key={i}
          index={i}
          count={items.length}
          onMove={(by) => set(moved(items, i, by))}
          onRemove={() => set(items.filter((_, x) => x !== i))}
        >
          <input
            value={s.head ?? ''}
            placeholder="what to do"
            onChange={(e) => set(items.map((x, y) => (y === i ? { ...x, head: e.target.value } : x)))}
            className={field}
          />
          <input
            value={s.sub ?? ''}
            placeholder="a note underneath (optional)"
            onChange={(e) => set(items.map((x, y) => (y === i ? { ...x, sub: e.target.value } : x)))}
            className={field}
          />
        </Row>
      ))}
      <AddRow text="add a step" onClick={() => set([...items, { n: items.length + 1, head: '', sub: '' }])} />
    </div>
  )
}

/* ── check ─────────────────────────────────────────────────────────────── */

function CheckEditor({
  block,
  onChange,
}: {
  block: Record<string, unknown>
  onChange: (b: Record<string, unknown>) => void
}) {
  const items = (Array.isArray(block.items) ? block.items : []) as string[]
  const set = (next: string[]) => onChange({ ...block, items: next })

  return (
    <div className="flex flex-col gap-2.5">
      <TitleField block={block} onChange={onChange} />
      {items.map((s, i) => (
        <Row
          key={i}
          index={i}
          count={items.length}
          onMove={(by) => set(moved(items, i, by))}
          onRemove={() => set(items.filter((_, x) => x !== i))}
        >
          <input
            value={s ?? ''}
            placeholder="one thing to tick off"
            onChange={(e) => set(items.map((x, y) => (y === i ? e.target.value : x)))}
            className={field}
          />
        </Row>
      ))}
      <AddRow text="add an item" onClick={() => set([...items, ''])} />
      <Labelled text="demo link (optional)">
        <input
          value={String(block.demo ?? '')}
          onChange={(e) => onChange({ ...block, demo: e.target.value })}
          className={field}
        />
      </Labelled>
    </div>
  )
}

/* ── grid ──────────────────────────────────────────────────────────────── */

function GridEditor({
  block,
  onChange,
}: {
  block: Record<string, unknown>
  onChange: (b: Record<string, unknown>) => void
}) {
  const cols = (Array.isArray(block.cols) ? block.cols : []) as string[]
  const rows = (Array.isArray(block.rows) ? block.rows : []) as string[][]

  /*
   * A grid is the one shape where two things have to stay in step: every row
   * must have exactly as many cells as there are columns. Adding a column with
   * no cells behind it is the single easiest way to break this block, so every
   * change here rebuilds the rows to match rather than trusting them to.
   */
  const square = (nextCols: string[], nextRows: string[][]) =>
    onChange({ ...block, cols: nextCols, rows: squareRows(nextCols.length, nextRows) })

  return (
    <div className="flex flex-col gap-2.5">
      <TitleField block={block} onChange={onChange} />

      <p className={label}>columns</p>
      {cols.map((c, i) => (
        <Row
          key={i}
          index={i}
          count={cols.length}
          onMove={(by) => {
            const order = moved(
              cols.map((_, x) => x),
              i,
              by,
            )
            square(
              order.map((x) => cols[x]),
              rows.map((r) => order.map((x) => r[x] ?? '')),
            )
          }}
          onRemove={() =>
            square(
              cols.filter((_, x) => x !== i),
              rows.map((r) => r.filter((_, x) => x !== i)),
            )
          }
        >
          <input
            value={c ?? ''}
            placeholder="column heading"
            onChange={(e) => square(cols.map((x, y) => (y === i ? e.target.value : x)), rows)}
            className={field}
          />
        </Row>
      ))}
      <AddRow text="add a column" onClick={() => square([...cols, ''], rows)} />

      <p className={label}>rows</p>
      {cols.length === 0 ? (
        <p className="text-[12.5px] text-muted-foreground">Add a column first.</p>
      ) : (
        <>
          {rows.map((r, i) => (
            <Row
              key={i}
              index={i}
              count={rows.length}
              onMove={(by) => square(cols, moved(rows, i, by))}
              onRemove={() => square(cols, rows.filter((_, x) => x !== i))}
            >
              {cols.map((c, j) => (
                <input
                  key={j}
                  value={r[j] ?? ''}
                  placeholder={c || `column ${j + 1}`}
                  onChange={(e) =>
                    square(
                      cols,
                      rows.map((row, y) => (y === i ? row.map((cell, x) => (x === j ? e.target.value : cell)) : row)),
                    )
                  }
                  className={field}
                />
              ))}
            </Row>
          ))}
          <AddRow text="add a row" onClick={() => square(cols, [...rows, cols.map(() => '')])} />
        </>
      )}
    </div>
  )
}

/* ── versus ────────────────────────────────────────────────────────────── */

function Side({
  side,
  value,
  onChange,
}: {
  side: 'left' | 'right'
  value: { head?: string; items?: string[] }
  onChange: (v: { head: string; items: string[] }) => void
}) {
  const items = Array.isArray(value.items) ? value.items : []
  const head = value.head ?? ''

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-secondary/30 p-2.5">
      <Labelled text={`${side} heading`}>
        <input value={head} onChange={(e) => onChange({ head: e.target.value, items })} className={field} />
      </Labelled>
      {items.map((s, i) => (
        <Row
          key={i}
          index={i}
          count={items.length}
          onMove={(by) => onChange({ head, items: moved(items, i, by) })}
          onRemove={() => onChange({ head, items: items.filter((_, x) => x !== i) })}
        >
          <input
            value={s ?? ''}
            onChange={(e) => onChange({ head, items: items.map((x, y) => (y === i ? e.target.value : x)) })}
            className={field}
          />
        </Row>
      ))}
      <AddRow text="add a line" onClick={() => onChange({ head, items: [...items, ''] })} />
    </div>
  )
}

function VersusEditor({
  block,
  onChange,
}: {
  block: Record<string, unknown>
  onChange: (b: Record<string, unknown>) => void
}) {
  const left = (block.left ?? {}) as { head?: string; items?: string[] }
  const right = (block.right ?? {}) as { head?: string; items?: string[] }

  return (
    <div className="flex flex-col gap-2.5">
      <TitleField block={block} onChange={onChange} />
      <Side side="left" value={left} onChange={(v) => onChange({ ...block, left: v })} />
      <Side side="right" value={right} onChange={(v) => onChange({ ...block, right: v })} />
    </div>
  )
}

/* ── figure ────────────────────────────────────────────────────────────── */

function FigureEditor({
  block,
  onChange,
}: {
  block: Record<string, unknown>
  onChange: (b: Record<string, unknown>) => void
}) {
  // Three flat strings. This one was never nested and should never have been
  // sent to the JSON editor in the first place.
  return (
    <div className="flex flex-col gap-2.5">
      <Labelled text="pose">
        <input
          value={String(block.pose ?? '')}
          onChange={(e) => onChange({ ...block, pose: e.target.value })}
          className={field}
        />
      </Labelled>
      <Labelled text="label">
        <input
          value={String(block.label ?? '')}
          onChange={(e) => onChange({ ...block, label: e.target.value })}
          className={field}
        />
      </Labelled>
      <Labelled text="cue (optional)">
        <input
          value={String(block.cue ?? '')}
          onChange={(e) => onChange({ ...block, cue: e.target.value })}
          className={field}
        />
      </Labelled>
    </div>
  )
}

/* ── the switch ────────────────────────────────────────────────────────── */

export function NestedBlockEditor({
  block,
  onChange,
}: {
  block: Record<string, unknown>
  onChange: (b: Record<string, unknown>) => void
}) {
  const [raw, setRaw] = useState(false)
  const t = String(block.t)

  const form =
    t === 'steps' ? (
      <StepsEditor block={block} onChange={onChange} />
    ) : t === 'check' ? (
      <CheckEditor block={block} onChange={onChange} />
    ) : t === 'grid' ? (
      <GridEditor block={block} onChange={onChange} />
    ) : t === 'versus' ? (
      <VersusEditor block={block} onChange={onChange} />
    ) : (
      <FigureEditor block={block} onChange={onChange} />
    )

  return (
    <div className="flex flex-col gap-3">
      {raw ? <RawJson block={block} onChange={onChange} /> : form}
      {/*
        The escape hatch stays. Not because she should need it, but because a
        block that came from somewhere else and is shaped oddly should be
        fixable rather than only deletable.
      */}
      <button
        type="button"
        onClick={() => setRaw((r) => !r)}
        className="self-start text-[12px] font-medium text-muted-foreground underline underline-offset-[3px]"
      >
        {raw ? 'back to the form' : 'edit as JSON instead'}
      </button>
    </div>
  )
}

/**
 * The original fallback, unchanged in behaviour.
 *
 * Validated on every keystroke so nothing malformed can be saved — honest
 * about what it is rather than dressed up as a form.
 */
export function RawJson({
  block,
  onChange,
}: {
  block: Record<string, unknown>
  onChange: (b: Record<string, unknown>) => void
}) {
  const [draft, setDraft] = useState(() => JSON.stringify(block, null, 2))
  const [bad, setBad] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11.5px] leading-[1.45] text-pretty text-muted-foreground">
        Keep <code className="rounded bg-muted px-1">&quot;t&quot;</code> as it is — that is what tells
        the app how to draw this block.
      </p>
      <textarea
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value)
          try {
            const parsed = JSON.parse(e.target.value)
            if (!parsed || typeof parsed.t !== 'string') {
              setBad('Needs a "t" saying what kind of block it is.')
              return
            }
            setBad(null)
            onChange(parsed)
          } catch {
            setBad('Not valid JSON yet — a bracket or comma is off.')
          }
        }}
        rows={12}
        spellCheck={false}
        className={
          'w-full rounded-xl border bg-background p-2.5 font-mono text-[12px] leading-[1.5] outline-none ' +
          (bad ? 'border-destructive' : 'border-border')
        }
      />
      {bad && <p className="text-[12px] text-destructive">{bad}</p>}
    </div>
  )
}
