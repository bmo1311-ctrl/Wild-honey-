'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { youTubeEmbed } from '@/lib/youtube'

/** Plays in the app. Escape closes, the backdrop closes, the page never scrolls behind it. */
export function VaultPlayer({
  videoId,
  title,
  description,
  onClose,
}: {
  videoId: string
  title: string
  description?: string
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3"
      onClick={onClose}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-card" onClick={(e) => e.stopPropagation()}>
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={youTubeEmbed(videoId)}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
        <div className="flex items-start gap-3 p-4">
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-[19px] font-semibold leading-snug text-pretty">{title}</h2>
            {description && <p className="mt-1.5 text-[14.5px] leading-[1.45] text-pretty text-muted-foreground">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full bg-muted p-2">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
