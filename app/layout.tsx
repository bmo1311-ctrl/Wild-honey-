import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Fraunces, Nunito_Sans } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const body = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const NEW_DESCRIPTION =
  'Start with the body — the rest of the life is in here. Programs, teaching, food, movement, money and a circle of women, for Body, Identity, Mindset and Faith.'

export const metadata: Metadata = {
  title: 'Wild Honey Circle',
  description: NEW_DESCRIPTION,
  generator: 'v0.app',
  manifest: '/manifest.json',
  openGraph: {
    title: 'Wild Honey Circle',
    description: NEW_DESCRIPTION,
    type: 'website',
    images: ['/hero.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wild Honey Circle',
    description: NEW_DESCRIPTION,
    images: ['/hero.jpg'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#e5a94a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-center" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
