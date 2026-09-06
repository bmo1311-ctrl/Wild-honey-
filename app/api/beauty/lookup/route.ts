import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { detectActives } from '@/lib/actives'

/**
 * Barcode in, product out.
 *
 * Two places to look, in order:
 *   1. Our own library, which grows every time a member adds something. Over
 *      time this becomes the fast path and the one that knows Wild Honey's
 *      kind of products.
 *   2. Open Beauty Facts — a free, open, crowdsourced cosmetics database, the
 *      same idea Yuka is built on. No key, no cost.
 *
 * Coverage there is real but patchy, and thinner for US and Korean brands than
 * European ones. So a miss is expected and is not an error: the caller falls
 * back to photographing the label or typing the name, and whatever she enters
 * lands in our library for the next person.
 */

const OBF = 'https://world.openbeautyfacts.org/api/v2/product'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const barcode = (searchParams.get('barcode') ?? '').replace(/\D/g, '')
  if (barcode.length < 6) {
    return NextResponse.json({ error: 'That does not look like a barcode.' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in first.' }, { status: 401 })

  // 1. Ours first.
  const { data: known } = await supabase
    .from('beauty_products')
    .select('id, name, brand, category, actives, ingredients_raw, image_url')
    .eq('barcode', barcode)
    .maybeSingle()

  if (known) {
    return NextResponse.json({ found: true, source: 'library', product: { ...known, barcode } })
  }

  // 2. Then the open database.
  try {
    const res = await fetch(
      `${OBF}/${barcode}.json?fields=code,product_name,brands,ingredients_text,image_small_url`,
      { headers: { 'User-Agent': 'WildHoneyCircle/1.0 (wildhoneyretreat@gmail.com)' }, cache: 'no-store' },
    )
    const json = (await res.json()) as {
      status?: number
      product?: { product_name?: string; brands?: string; ingredients_text?: string; image_small_url?: string }
    }

    if (json.status === 1 && json.product) {
      const ingredients = json.product.ingredients_text ?? ''
      return NextResponse.json({
        found: true,
        source: 'openbeautyfacts',
        product: {
          barcode,
          name: json.product.product_name ?? '',
          brand: json.product.brands ?? null,
          ingredients_raw: ingredients || null,
          // Only ever claims what it can actually see spelled out on the label.
          actives: ingredients ? detectActives(ingredients) : [],
          image_url: json.product.image_small_url ?? null,
        },
      })
    }
  } catch (err) {
    // A database being down is not a reason to block her — fall through to the
    // same "not found" path she would get for an unlisted product.
    console.error('[beauty lookup]', err)
  }

  return NextResponse.json({ found: false, barcode })
}
