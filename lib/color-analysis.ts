import { hexToLab, hexToRgb, seasonFrom, type Chroma, type Hue, type SeasonKey, type Value } from './color-season'

/**
 * Reading her colouring off her own photograph.
 *
 * Every app that offers this pretends to more certainty than a phone camera
 * can support, and the reason is always the same: white balance. A photo
 * taken under a warm kitchen bulb makes everybody warm, and a photo taken in
 * blue shade makes everybody cool. Most "AI colour analysis" is measuring the
 * lightbulb and telling the woman it measured her.
 *
 * So this does the thing that actually works, which is the same thing a
 * photographer does. She puts something white in the frame, taps it, and
 * every other sample is corrected against it. Without that reference this
 * refuses to guess about warmth at all, and says why.
 *
 * The honest division of labour, stated plainly because she should know
 * which parts to trust:
 *
 *   Value — how light or deep she is overall — is the thing a corrected
 *   photograph measures *well*. Lightness survives most camera error.
 *
 *   Chroma — clear or muted — is measured *reasonably*, because it mostly
 *   comes out of the contrast between her hair and her skin, and a ratio
 *   between two points in the same photo cancels most of the error.
 *
 *   Hue — warm or cool — is measured *poorly*, even corrected. The shift
 *   between warm and cool skin is a couple of degrees of hue angle, which is
 *   smaller than the error left over after white balancing, smaller than the
 *   difference between two phone cameras, and smaller than what a bit of
 *   blusher does. So this asks her instead. The gold-and-silver test in her
 *   own bathroom mirror genuinely outperforms the arithmetic here.
 *
 * That last one is not a limitation I am apologising for. Hue is also the
 * least decisive of the three axes, so the photograph is doing the heavy
 * lifting on the two that matter most.
 */

export interface Sample {
  /** Averaged over a small patch, not a single pixel. */
  hex: string
}

export interface AnalysisInput {
  skin: Sample
  hair: Sample
  eye: Sample
  /** Something known to be neutral in the frame — paper, a white wall, a shirt. */
  reference?: Sample | null
  /** Her own answer, because the photo cannot tell us this reliably. */
  hue?: Hue | null
}

export type Confidence = 'good' | 'rough' | 'cannot-say'

export interface Reading<T> {
  value: T
  confidence: Confidence
  /** What the measurement actually was, so nothing is a black box. */
  because: string
}

export interface Analysis {
  value: Reading<Value>
  chroma: Reading<Chroma>
  hue: Reading<Hue> | null
  /** Null until hue is settled, one way or the other. */
  season: SeasonKey | null
  /** Which axis is furthest from the middle, and so names the season. */
  dominant: 'value' | 'chroma'
  /** Lightness of her hair against her skin — the number chroma leans on. */
  contrast: number
  /** The raw measurements, kept so the neighbour can move the right way. */
  metrics: { overall: number; clarity: number }
  /** Anything wrong with the photograph itself. */
  problems: string[]
  /** True when the sampled colours were corrected against a neutral. */
  balanced: boolean
}

/**
 * Correct a colour for the light the photo was taken in.
 *
 * Von Kries in plain sRGB: whatever she tapped as white *should* be neutral,
 * so scale each channel until it is, and apply the same scaling everywhere
 * else. Crude next to a real camera pipeline and completely sufficient for
 * telling a warm bulb from a cool window.
 */
export function whiteBalance(hex: string, reference: string): string {
  const c = hexToRgb(hex)
  const w = hexToRgb(reference)
  if (!c || !w) return hex
  const mean = (w[0] + w[1] + w[2]) / 3
  if (mean < 1) return hex
  const gains = w.map((v) => (v < 1 ? 1 : mean / v))
  const out = c.map((v, i) => Math.max(0, Math.min(255, Math.round(v * gains[i]))))
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

function chromaOf(hex: string): number {
  const lab = hexToLab(hex)
  return lab ? Math.hypot(lab[1], lab[2]) : 0
}

function lightnessOf(hex: string): number {
  return hexToLab(hex)?.[0] ?? 50
}

/**
 * What is wrong with the photograph, before anything is measured.
 *
 * Said before the result rather than after, because a woman who has just
 * been told she is a Deep Autumn does not go back and read the caveat.
 */
export function photoProblems(input: AnalysisInput): string[] {
  const out: string[] = []
  const skinL = lightnessOf(input.skin.hex)
  const hairL = lightnessOf(input.hair.hex)

  if (skinL > 92) out.push('The skin sample is blown out — the camera clipped it to white, so there is no colour left in it to read. Try again away from direct sun or a window behind you.')
  if (skinL < 12) out.push('The skin sample is almost black, which usually means it landed in shadow rather than on your face. Try a spot lit evenly.')
  if (hairL > 95) out.push('The hair sample is blown out. A highlight rather than the hair itself, most likely.')
  if (!input.reference) {
    out.push('No white reference, so nothing could be corrected for the light you were standing in. Value and contrast still hold up; warmth will have to be your call.')
  }
  if (Math.abs(skinL - hairL) < 4) {
    out.push('The hair and skin samples came out almost identical, which normally means two taps landed on the same thing.')
  }
  return out
}

/**
 * Turn three sampled colours into the two axes a photograph can honestly
 * carry, plus her season once hue is settled.
 */
export function analyse(input: AnalysisInput): Analysis {
  const ref = input.reference?.hex ?? null
  const fix = (h: string) => (ref ? whiteBalance(h, ref) : h)

  const skin = fix(input.skin.hex)
  const hair = fix(input.hair.hex)
  const eye = fix(input.eye.hex)

  const skinL = lightnessOf(skin)
  const hairL = lightnessOf(hair)
  const eyeL = lightnessOf(eye)
  const contrast = Math.abs(skinL - hairL)

  /*
   * Value: all three together, weighted the way a person squinting at her
   * would weight them. Hair frames the face and carries as much as the skin;
   * eyes are small but they are the thing people actually look at.
   */
  const overall = skinL * 0.42 + hairL * 0.42 + eyeL * 0.16
  const value: Value = overall > 57 ? 'light' : overall < 39 ? 'deep' : 'medium'
  const valueConfidence: Confidence =
    Math.abs(overall - 57) < 4 || Math.abs(overall - 39) < 4 ? 'rough' : 'good'

  /*
   * Chroma: clarity. Mostly the gap between her hair and her skin, because a
   * ratio between two points in one photograph survives bad light far better
   * than any absolute measurement does. The saturation of the hair and eye
   * nudges it — muted colouring tends to have grey sitting in both.
   */
  const featureChroma = (chromaOf(hair) + chromaOf(eye)) / 2
  const clarity = contrast * 0.72 + featureChroma * 0.9
  const chroma: Chroma = clarity > 42 ? 'bright' : clarity < 24 ? 'soft' : 'medium'
  const chromaConfidence: Confidence = ref
    ? Math.abs(clarity - 42) < 5 || Math.abs(clarity - 24) < 5
      ? 'rough'
      : 'good'
    : 'rough'

  const hue: Reading<Hue> | null = input.hue
    ? {
        value: input.hue,
        confidence: 'good',
        because: 'Your answer, not the photograph — a phone camera cannot separate warm skin from warm light reliably enough to be worth trusting.',
      }
    : null

  /*
   * Which axis actually runs the show.
   *
   * Distance from the centre of each scale, normalised so the two are
   * comparable. Without this, deep and bright together always resolved to a
   * deep season — so a woman with deep colouring and real clarity could
   * never reach a bright one, however clear she was.
   */
  const valueExtremity = Math.abs(overall - 48) / 48
  const chromaExtremity = Math.abs(clarity - 33) / 33
  const dominant: 'value' | 'chroma' = chromaExtremity > valueExtremity ? 'chroma' : 'value'

  return {
    value: {
      value,
      confidence: valueConfidence,
      because: `Your hair, skin and eyes average ${Math.round(overall)} out of 100 for lightness${
        valueConfidence === 'rough' ? ', which sits right on the line between two answers' : ''
      }.`,
    },
    chroma: {
      value: chroma,
      confidence: chromaConfidence,
      because: `Your hair is ${Math.round(contrast)} points ${
        hairL < skinL ? 'darker' : 'lighter'
      } than your skin${
        ref ? '' : ', measured without a white reference so treat it as a rough read'
      }.`,
    },
    hue,
    season: hue ? seasonFrom(hue.value, value, chroma, dominant) : null,
    dominant,
    metrics: { overall, clarity },
    contrast: Math.round(contrast),
    problems: photoProblems(input),
    balanced: Boolean(ref),
  }
}

/**
 * How much of this she should take on faith.
 *
 * Deliberately conservative. Anything short of a good reading on both
 * measured axes gets called a starting point, because a woman spending money
 * on clothes off the back of this deserves to know when the app is guessing.
 */
export function trustLine(a: Analysis): string {
  if (a.problems.length > 0 && !a.balanced) {
    return 'A starting point rather than an answer. Retake it in daylight with something white in the frame and this gets a lot better.'
  }
  if (a.value.confidence === 'good' && a.chroma.confidence === 'good') {
    return 'Both measurements came out clean. Worth trusting, and worth checking against your own mirror.'
  }
  return 'One of the two measurements landed close to a boundary, so treat this as the likeliest of two neighbouring answers rather than a verdict.'
}

/**
 * The season next door.
 *
 * When a reading sits on a boundary the useful thing is not a single name
 * but the two she is choosing between, held up in her own mirror — which
 * settles it in a minute in a way no amount of arithmetic here can.
 *
 * It moves the close axis *towards the boundary it was close to*, rather
 * than to some arbitrary other level. The first version cycled through the
 * options and cheerfully told a Light Summer she might be a Bright Winter,
 * which is not a neighbour, it is the other side of the system.
 */
export function neighbourOf(a: Analysis): SeasonKey | null {
  if (!a.hue || !a.season) return null

  const alt = ((): { value: Value; chroma: Chroma } | null => {
    if (a.value.confidence === 'rough') {
      // 57 is the light boundary, 39 the deep one.
      const toLight = Math.abs(a.metrics.overall - 57) < Math.abs(a.metrics.overall - 39)
      const next: Value =
        a.value.value === 'medium' ? (toLight ? 'light' : 'deep') : 'medium'
      return { value: next, chroma: a.chroma.value }
    }
    if (a.chroma.confidence !== 'good') {
      // 42 is the bright boundary, 24 the soft one.
      const toBright = Math.abs(a.metrics.clarity - 42) < Math.abs(a.metrics.clarity - 24)
      const next: Chroma =
        a.chroma.value === 'medium' ? (toBright ? 'bright' : 'soft') : 'medium'
      return { value: a.value.value, chroma: next }
    }
    return null
  })()

  if (!alt) return null
  const s = seasonFrom(a.hue.value, alt.value, alt.chroma, a.dominant)
  return s === a.season ? null : s
}
