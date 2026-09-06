'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, X, Keyboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Scan a barcode, or type it.
 *
 * The camera path uses the browser's own BarcodeDetector, which needs no
 * library and no download. It is not in Safari, so on an iPhone the camera
 * button simply does not appear and she types the number under the barcode
 * instead — which is a few seconds, and always works.
 *
 * That is the deliberate trade: nobody hits a dead end, and there is no
 * megabyte of scanning library shipped to every member for a feature some of
 * them cannot use anyway.
 */

type Detector = { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> }

function scanningSupported(): boolean {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window
}

export function BarcodeScanner({
  onFound,
  onCancel,
}: {
  onFound: (barcode: string) => void
  onCancel: () => void
}) {
  const [mode, setMode] = useState<'choose' | 'camera' | 'type'>('choose')
  const [typed, setTyped] = useState('')
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (mode !== 'camera') return
    let cancelled = false
    let timer: ReturnType<typeof setInterval> | null = null

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        const Ctor = (window as unknown as { BarcodeDetector: new (o?: unknown) => Detector }).BarcodeDetector
        const detector = new Ctor({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] })

        timer = setInterval(async () => {
          if (!videoRef.current || cancelled) return
          try {
            const hits = await detector.detect(videoRef.current)
            const code = hits[0]?.rawValue
            if (code) {
              cancelled = true
              onFound(code)
            }
          } catch {
            // A frame that will not decode is normal; keep looking.
          }
        }, 400)
      } catch {
        setError('Could not open the camera. You can type the number instead.')
        setMode('type')
      }
    }

    start()
    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [mode, onFound])

  if (mode === 'camera') {
    return (
      <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
        <div className="relative overflow-hidden rounded-xl bg-black">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoRef} playsInline muted className="h-56 w-full object-cover" />
          <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-honey/70" />
        </div>
        <p className="text-center text-sm text-muted-foreground">hold the barcode in the light</p>
        <Button variant="ghost" onClick={onCancel} className="h-10">
          cancel
        </Button>
      </div>
    )
  }

  if (mode === 'type') {
    return (
      <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
        {error && <p className="text-sm text-muted-foreground text-pretty">{error}</p>}
        <div className="flex flex-col gap-1.5">
          <Label>the number under the barcode</Label>
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            inputMode="numeric"
            placeholder="e.g. 3600551153117"
            className="h-11"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => typed.replace(/\D/g, '').length >= 6 && onFound(typed.replace(/\D/g, ''))}
            disabled={typed.replace(/\D/g, '').length < 6}
            className="h-10 flex-1"
          >
            look it up
          </Button>
          <Button variant="ghost" onClick={onCancel} className="h-10">
            cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-card p-5 ring-1 ring-border">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">how would you like to add it?</p>
        <button type="button" onClick={onCancel} aria-label="close" className="text-muted-foreground/60">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-1 flex flex-col gap-2 sm:flex-row">
        {scanningSupported() && (
          <Button onClick={() => setMode('camera')} className="h-11 flex-1">
            <Camera className="mr-1.5 h-4 w-4" />
            scan the barcode
          </Button>
        )}
        <Button variant="outline" onClick={() => setMode('type')} className="h-11 flex-1">
          <Keyboard className="mr-1.5 h-4 w-4" />
          type the number
        </Button>
      </div>
      {!scanningSupported() && (
        <p className="text-[0.7rem] text-muted-foreground text-pretty">
          your browser can&rsquo;t scan, so type the number under the barcode — it only takes a second.
        </p>
      )}
    </div>
  )
}
