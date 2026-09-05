/**
 * Read a recipe from a URL.
 *
 * Most recipe sites embed a schema.org Recipe as JSON-LD, which carries the
 * title, ingredients, steps, image, yield, times and often nutrition. That is
 * read first. If a page has none, the title and image come from Open Graph
 * tags and she fills in the rest.
 *
 * Server-side fetch of a user-supplied URL, so it is deliberately narrow:
 * http(s) only, no private or loopback hosts, a short timeout, a size cap.
 */

export interface ImportedRecipe {
  title: string
  description: string | null
  ingredients: string
  instructions: string
  image_url: string | null
  prep_minutes: number | null
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  source_url: string
  source_name: string | null
  complete: boolean
}

const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[?::1\]?$|172\.(1[6-9]|2\d|3[01])\.)/i

export function safeUrl(raw: string): URL | null {
  let u: URL
  try {
    u = new URL(raw.trim())
  } catch {
    return null
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
  if (PRIVATE_HOST.test(u.hostname) || !u.hostname.includes('.')) return null
  return u
}

function text(v: unknown): string | null {
  if (v == null) return null
  if (typeof v === 'string') return v.trim() || null
  if (Array.isArray(v)) return v.map(text).filter(Boolean).join(' ') || null
  if (typeof v === 'object' && v && '@value' in (v as Record<string, unknown>)) return text((v as Record<string, unknown>)['@value'])
  return null
}

function minutes(iso: unknown): number | null {
  const s = text(iso)
  if (!s) return null
  const m = s.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i)
  if (!m) return null
  return (Number(m[1] || 0) * 60 + Number(m[2] || 0)) || null
}

function num(v: unknown): number | null {
  const s = text(v)
  if (!s) return null
  const n = parseFloat(s.replace(/[^\d.]/g, ''))
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null
}

function steps(v: unknown): string {
  if (!v) return ''
  const list = Array.isArray(v) ? v : [v]
  const out: string[] = []
  for (const item of list) {
    if (typeof item === 'string') out.push(item.trim())
    else if (item && typeof item === 'object') {
      const o = item as Record<string, unknown>
      if (o['@type'] === 'HowToSection' && Array.isArray(o.itemListElement)) out.push(steps(o.itemListElement))
      else out.push(text(o.text) ?? text(o.name) ?? '')
    }
  }
  return out.filter(Boolean).join('\n')
}

function image(v: unknown): string | null {
  if (!v) return null
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return image(v[0])
  if (typeof v === 'object') return text((v as Record<string, unknown>).url)
  return null
}

function findRecipe(node: unknown): Record<string, unknown> | null {
  if (!node) return null
  if (Array.isArray(node)) {
    for (const n of node) {
      const r = findRecipe(n)
      if (r) return r
    }
    return null
  }
  if (typeof node !== 'object') return null
  const o = node as Record<string, unknown>
  const type = o['@type']
  const types = Array.isArray(type) ? type : [type]
  if (types.includes('Recipe')) return o
  if (o['@graph']) return findRecipe(o['@graph'])
  return null
}

export function parseRecipeHtml(html: string, url: string): ImportedRecipe {
  const source_name = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, '')
    } catch {
      return null
    }
  })()

  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  for (const m of blocks) {
    let data: unknown
    try {
      data = JSON.parse(m[1].trim())
    } catch {
      continue
    }
    const r = findRecipe(data)
    if (!r) continue
    const nutrition = (r.nutrition && typeof r.nutrition === 'object' ? r.nutrition : {}) as Record<string, unknown>
    const ingredients = Array.isArray(r.recipeIngredient) ? r.recipeIngredient.map(text).filter(Boolean).join('\n') : (text(r.recipeIngredient) ?? '')
    const instructions = steps(r.recipeInstructions)
    return {
      title: text(r.name) ?? 'Untitled recipe',
      description: text(r.description),
      ingredients,
      instructions,
      image_url: image(r.image),
      prep_minutes: minutes(r.totalTime) ?? minutes(r.cookTime) ?? minutes(r.prepTime),
      calories: num(nutrition.calories),
      protein_g: num(nutrition.proteinContent),
      carbs_g: num(nutrition.carbohydrateContent),
      fat_g: num(nutrition.fatContent),
      source_url: url,
      source_name,
      complete: Boolean(ingredients && instructions),
    }
  }

  // No structured recipe: take what Open Graph offers and let her fill the rest.
  const og = (p: string) => html.match(new RegExp(`<meta[^>]+property=["']og:${p}["'][^>]+content=["']([^"']+)["']`, 'i'))?.[1] ?? null
  const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? null
  return {
    title: og('title') ?? titleTag ?? 'Untitled recipe',
    description: og('description'),
    ingredients: '',
    instructions: '',
    image_url: og('image'),
    prep_minutes: null,
    calories: null,
    protein_g: null,
    carbs_g: null,
    fat_g: null,
    source_url: url,
    source_name,
    complete: false,
  }
}

export async function fetchRecipe(url: string): Promise<ImportedRecipe> {
  const u = safeUrl(url)
  if (!u) throw new Error('That does not look like a web address I can open.')
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 8000)
  try {
    const res = await fetch(u.toString(), {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; WildHoneyCircle/1.0; +recipe-import)', accept: 'text/html' },
    })
    if (!res.ok) throw new Error(`The site answered ${res.status}.`)
    const reader = res.body?.getReader()
    if (!reader) throw new Error('Empty page.')
    const chunks: Uint8Array[] = []
    let size = 0
    while (size < 1_500_000) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      size += value.length
    }
    const html = new TextDecoder().decode(Buffer.concat(chunks))
    return parseRecipeHtml(html, u.toString())
  } finally {
    clearTimeout(t)
  }
}
