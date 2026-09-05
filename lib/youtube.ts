/**
 * The resource library is entirely YouTube, stored in three URL shapes:
 *   https://youtu.be/ID?si=…
 *   https://www.youtube.com/live/ID?si=…
 *   https://www.youtube.com/watch?v=ID
 * Pull the id out of any of them so a video can play in the app rather than
 * throwing her out to another tab.
 */
export function youTubeId(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') return clean(u.pathname.slice(1))
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      if (u.pathname === '/watch') return clean(u.searchParams.get('v'))
      const m = u.pathname.match(/^\/(?:live|embed|shorts|v)\/([^/?#]+)/)
      if (m) return clean(m[1])
    }
    return null
  } catch {
    return null
  }
}

function clean(id: string | null): string | null {
  if (!id) return null
  const trimmed = id.trim()
  return /^[\w-]{6,20}$/.test(trimmed) ? trimmed : null
}

export function youTubeEmbed(id: string): string {
  // nocookie host, and no related videos from other channels at the end.
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`
}

export function youTubeThumb(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
}
