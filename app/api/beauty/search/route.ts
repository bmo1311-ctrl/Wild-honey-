import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { detectActives } from '@/lib/actives'

/**
 * Find a product by typing its name.
 *
 * This is the low-friction path, and in practice the main one. Barcodes only
 * help if she still has the box; the bottle in her hand always has a name.
 * Searching also returns ingredient lists far more often than a barcode
 * lookup does — a search for "cerave" comes back with well over a hundred
 * products, nearly all of them with a full INCI list attached.
 *
 * Our own library goes first and always will: it is faster, it is curated,
 * and it grows every time a member adds something the open database missed.
 */

const OBF_SEARCH = 'https://world.openbeautyfacts.org/cgi/search.pl'

export interface SearchHit {
  barcode: string | null
  name: string
  brand: string | null
  ingredients_raw: string | null
  actives: string[]
  source: 'library' | 'openbeautyfacts'
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const term = (searchParams.get('q') ?? '').trim()
  if (term.length < 2) return NextResponse.json({ hits: [] })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in first.' }, { status: 401 })

  const hits: SearchHit[] = []

  // 1. Ours.
  const { data: mine } = await supabase
    .from('beauty_products')
    .select('barcode, name, brand, actives, ingredients_raw')
    .ilike('name', `%${term}%`)
    .limit(6)

  for (const p of mine ?? []) {
    hits.push({
      barcode: p.barcode,
      name: p.name,
      brand: p.brand,
      ingredients_raw: p.ingredients_raw,
      actives: p.actives ?? [],
      source: 'library',
    })
  }

  // 2. Then the open database, skipping anything we already have.
  try {
    const url = `${OBF_SEARCH}?search_terms=${encodeURIComponent(term)}&search_simple=1&action=process&json=1&page_size=12&fields=code,product_name,brands,ingredients_text`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'WildHoneyCircle/1.0 (wildhoneyretreat@gmail.com)' },
      cache: 'no-store',
    })
    const json = (await res.json()) as {
      products?: { code?: string; product_name?: string; brands?: string; ingredients_text?: string }[]
    }

    const seen = new Set(hits.map((h) => h.barcode).filter(Boolean))
    for (const p of json.products ?? []) {
      const name = (p.product_name ?? '').trim()
      // A row with no name is no use to anyone choosing from a list.
      if (!name || seen.has(p.code ?? '')) continue
      const ingredients = p.ingredients_text ?? ''
      hits.push({
        barcode: p.code ?? null,
        name,
        brand: p.brands ?? null,
        ingredients_raw: ingredients || null,
        actives: ingredients ? detectActives(ingredients) : [],
        source: 'openbeautyfacts',
      })
      if (hits.length >= 12) break
    }
  } catch (err) {
    // The open database being down should not stop her searching ours.
    console.error('[beauty search]', err)
  }

  // Ones with a readable ingredient list are more useful, so float them up.
  hits.sort((a, b) => Number(Boolean(b.ingredients_raw)) - Number(Boolean(a.ingredients_raw)))

  return NextResponse.json({ hits })
}
