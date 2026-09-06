'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Sun, Moon, X, AlertTriangle, Info, ScanLine, ClipboardPaste, Loader2, Search } from 'lucide-react'
import { addBeautyProduct, removeBeautyProduct, setLifeStage } from '@/app/actions'
import { ACTIVES, detectActives, getActive, guessCategory } from '@/lib/actives'
import { buildRoutines, findGaps, type ShelfItem } from '@/lib/routine'
import type { LifeStage } from '@/lib/actives'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { BarcodeScanner } from '@/components/barcode-scanner'
import type { SearchHit } from '@/app/api/beauty/search/route'

const CATEGORIES = [
  'cleanser',
  'toner',
  'essence',
  'exfoliant',
  'serum',
  'treatment',
  'eye',
  'moisturizer',
  'oil',
  'spf',
]

const STAGES: { value: 'none' | 'pregnant' | 'trying' | 'breastfeeding'; label: string }[] = [
  { value: 'none', label: 'not right now' },
  { value: 'pregnant', label: 'pregnant' },
  { value: 'trying', label: 'trying' },
  { value: 'breastfeeding', label: 'breastfeeding' },
]

export function RoutineShelf({
  shelf,
  lifeStage,
}: {
  shelf: ShelfItem[]
  lifeStage: LifeStage
}) {
  const [adding, setAdding] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanNote, setScanNote] = useState<string | null>(null)
  const [barcode, setBarcode] = useState<string | null>(null)
  const [ingredients, setIngredients] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('serum')
  const [picked, setPicked] = useState<string[]>([])
  const [pasting, setPasting] = useState(false)
  const [pasted, setPasted] = useState('')
  const [looking, setLooking] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)
  const [hits, setHits] = useState<SearchHit[]>([])
  const [searching, setSearching] = useState(false)
  const [pending, startTransition] = useTransition()

  const { am, pm } = useMemo(() => buildRoutines(shelf, lifeStage), [shelf, lifeStage])
  const gaps = useMemo(() => findGaps(shelf), [shelf])

  useEffect(() => {
    if (adding) formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [adding])

  /**
   * Search as she types. This is the path most people will use: the bottle in
   * her hand always has a name, even when the box is long gone.
   */
  useEffect(() => {
    const term = name.trim()
    if (!adding || term.length < 3 || barcode) {
      setHits([])
      return
    }
    let cancelled = false
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/beauty/search?q=${encodeURIComponent(term)}`)
        const data = await res.json()
        if (!cancelled) setHits(data.hits ?? [])
      } catch {
        if (!cancelled) setHits([])
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [name, adding, barcode])

  /** Picking a result fills everything in at once. */
  function chooseHit(hit: SearchHit) {
    setName([hit.brand, hit.name].filter(Boolean).join(' ').trim())
    setPicked(hit.actives ?? [])
    setIngredients(hit.ingredients_raw)
    setBarcode(hit.barcode)
    setCategory(guessCategory(`${hit.brand ?? ''} ${hit.name}`) ?? category)
    setHits([])
    setScanNote(
      hit.actives?.length
        ? `read its ingredients: ${hit.actives.map((a) => getActive(a)?.label ?? a).join(', ').toLowerCase()}.`
        : 'no ingredient list on this one — tick anything you know.',
    )
  }

  function toggleActive(key: string) {
    setPicked((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]))
  }

  /** A scan fills the form in rather than saving behind her back. */
  async function handleScanned(code: string) {
    setScanning(false)
    setBarcode(code)
    setLooking(true)
    setAdding(true)
    try {
      const res = await fetch(`/api/beauty/lookup?barcode=${encodeURIComponent(code)}`)
      const data = await res.json()
      if (data.found) {
        const p = data.product
        setName([p.brand, p.name].filter(Boolean).join(' ').trim() || p.name || '')
        setPicked(p.actives ?? [])
        setIngredients(p.ingredients_raw ?? null)
        setScanNote(
          p.actives?.length
            ? 'found it, and read the label. check the details before you add it.'
            : 'found it, but the ingredients aren’t listed — tick anything you know.',
        )
      } else {
        setScanNote(
          `couldn’t find ${code} in the database — a lot of american and korean products aren’t in there yet. type the name below, or paste the ingredients and I’ll read them.`,
        )
      }
    } catch {
      setScanNote('couldn’t reach the product database. type the name below, or paste the ingredients.')
    } finally {
      setLooking(false)
    }
  }

  /**
   * Read an ingredient list she pasted from anywhere — Yuka, a retailer's
   * page, the back of the box. The text is the same wherever it came from,
   * and it fills the same fields a scan would.
   */
  function applyPaste() {
    const found = detectActives(pasted)
    setPicked((p) => [...new Set([...p, ...found])])
    setIngredients(pasted)
    setPasting(false)
    setScanNote(
      found.length
        ? `read ${found.length === 1 ? 'one active' : `${found.length} actives`} off that: ${found
            .map((f) => getActive(f)?.label ?? f)
            .join(', ')
            .toLowerCase()}.`
        : 'nothing I recognise in that list — tick anything you know by hand.',
    )
  }

  function handleAdd() {
    if (!name.trim()) {
      toast.error('What is it called?')
      return
    }
    startTransition(async () => {
      const res = await addBeautyProduct({
        name,
        category,
        actives: picked,
        domain: 'skin',
        barcode: barcode ?? undefined,
        ingredientsRaw: ingredients ?? undefined,
      })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setName('')
      setPicked([])
      setBarcode(null)
      setIngredients(null)
      setScanNote(null)
      setPasted('')
      setPasting(false)
      setAdding(false)
      toast.success('On your shelf.')
    })
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      const res = await removeBeautyProduct(id)
      if (res?.error) toast.error(res.error)
    })
  }

  function handleStage(value: 'none' | 'pregnant' | 'trying' | 'breastfeeding') {
    startTransition(async () => {
      const res = await setLifeStage(value)
      if (res?.error) toast.error(res.error)
    })
  }

  const cautions = [...am.cautions, ...pm.cautions]

  return (
    <div className="flex flex-col gap-6">
      {shelf.length === 0 ? (
        <p className="text-sm text-muted-foreground text-pretty">
          add what you already use and the order sorts itself out — morning, evening, and what
          shouldn&rsquo;t share a night.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <RoutineColumn title="morning" icon={<Sun className="h-4 w-4" />} steps={am.steps} onRemove={handleRemove} />
          <RoutineColumn title="evening" icon={<Moon className="h-4 w-4" />} steps={pm.steps} onRemove={handleRemove} />
        </div>
      )}

      {cautions.length > 0 && (
        <div className="flex flex-col gap-2">
          {cautions.map((c, i) => (
            <div
              key={i}
              className={`flex gap-2 rounded-2xl p-4 text-sm text-pretty ring-1 ${
                c.level === 'pregnancy' ? 'bg-card ring-honey' : 'bg-muted ring-border'
              }`}
            >
              {c.level === 'pregnancy' ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-honey" />
              ) : (
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span>{c.message}</span>
            </div>
          ))}
        </div>
      )}

      {gaps.length > 0 && (
        <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          {gaps.map((g) => (
            <li key={g} className="text-pretty">
              {g}
            </li>
          ))}
        </ul>
      )}

      {/* Life stage — optional, private, and only ever used for cautions. */}
      <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
        <Label className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
          anything I should watch for?
        </Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {STAGES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => handleStage(s.value)}
              className={`rounded-full px-3 py-1.5 text-sm ${
                (lifeStage ?? 'none') === s.value ? 'bg-mindset-pillar text-white' : 'bg-muted text-muted-foreground'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[0.7rem] leading-relaxed text-muted-foreground text-pretty">
          only used to flag ingredients worth asking your doctor or midwife about. never shared,
          never shown to anyone else.
        </p>
      </div>

      {scanning && <BarcodeScanner onFound={handleScanned} onCancel={() => setScanning(false)} />}

      {adding ? (
        <div ref={formRef} className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
          {looking && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              looking up {barcode}…
            </p>
          )}
          {!looking && scanNote && (
            <p className="rounded-xl bg-muted p-3 text-sm leading-relaxed text-pretty">{scanNote}</p>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>what is it?</Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                const guess = guessCategory(e.target.value)
                if (guess) setCategory(guess)
              }}
              placeholder="start typing — cerave, the ordinary…"
              className="h-11"
            />
            {searching && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                looking…
              </p>
            )}
            {hits.length > 0 && (
              <ul className="flex flex-col overflow-hidden rounded-xl ring-1 ring-border">
                {hits.map((h, i) => (
                  <li key={`${h.barcode ?? h.name}-${i}`}>
                    <button
                      type="button"
                      onClick={() => chooseHit(h)}
                      className="flex w-full flex-col items-start gap-0.5 border-b border-border bg-background px-3 py-2.5 text-left last:border-0 hover:bg-muted"
                    >
                      <span className="text-sm">
                        {h.brand ? <span className="text-muted-foreground">{h.brand} </span> : null}
                        {h.name}
                      </span>
                      <span className="text-[0.65rem] text-muted-foreground">
                        {h.actives.length
                          ? h.actives.map((a) => getActive(a)?.label ?? a).join(', ').toLowerCase()
                          : 'no ingredients listed'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>what kind?</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 rounded-md border border-input bg-background px-3 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          {pasting ? (
            <div className="flex flex-col gap-2">
              <Label>paste the ingredient list</Label>
              <Textarea
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                rows={4}
                placeholder="aqua, glycerin, niacinamide, retinol…"
              />
              <p className="text-[0.7rem] text-muted-foreground text-pretty">
                copy it from wherever you found it — yuka, the shop&rsquo;s page, or the back of the box.
              </p>
              <div className="flex gap-2">
                <Button onClick={applyPaste} disabled={!pasted.trim()} className="h-9 flex-1">
                  read it
                </Button>
                <Button variant="ghost" onClick={() => setPasting(false)} className="h-9">
                  cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPasting(true)}
              className="flex items-center gap-1.5 self-start text-sm font-medium text-mindset-pillar"
            >
              <ClipboardPaste className="h-3.5 w-3.5" />
              paste the ingredients instead
            </button>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>what&rsquo;s in it? (tick any you know)</Label>
            <div className="flex flex-wrap gap-2">
              {ACTIVES.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => toggleActive(a.key)}
                  className={`rounded-full px-3 py-1.5 text-xs ${
                    picked.includes(a.key) ? 'bg-mindset-pillar text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
            <p className="text-[0.7rem] text-muted-foreground">leave it blank if you&rsquo;re not sure — it still goes in the right place.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={pending} className="h-10 flex-1">
              {pending ? 'adding…' : 'add it'}
            </Button>
            <Button variant="ghost" onClick={() => setAdding(false)} className="h-10">
              cancel
            </Button>
          </div>
        </div>
      ) : (
        !scanning && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setAdding(true)} className="rounded-full">
              <Search className="mr-1.5 h-4 w-4" />
              find a product
            </Button>
            <Button onClick={() => setScanning(true)} variant="outline" className="rounded-full">
              <ScanLine className="mr-1.5 h-4 w-4" />
              scan a barcode
            </Button>
          </div>
        )
      )}
    </div>
  )
}

function RoutineColumn({
  title,
  icon,
  steps,
  onRemove,
}: {
  title: string
  icon: React.ReactNode
  steps: { id: string; name: string; category: string | null; cadence?: string }[]
  onRemove: (id: string) => void
}) {
  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium uppercase tracking-[0.12em]">{title}</span>
      </div>
      {steps.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">nothing here yet.</p>
      ) : (
        <ol className="mt-3 flex flex-col gap-2.5">
          {steps.map((s, i) => (
            <li key={s.id} className="flex items-start gap-2.5">
              <span className="mt-0.5 w-4 shrink-0 text-xs text-muted-foreground">{i + 1}</span>
              <span className="flex-1 text-pretty">
                <span className="text-[15px]">{s.name}</span>
                {s.cadence && <span className="block text-xs text-honey">{s.cadence}</span>}
                {s.category && !s.cadence && (
                  <span className="block text-xs text-muted-foreground">{s.category}</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => onRemove(s.id)}
                aria-label={`remove ${s.name}`}
                className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
