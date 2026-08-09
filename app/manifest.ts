import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Wild Honey Circle',
    short_name: 'Wild Honey',
    description:
      'A daily journaling practice and private community for women becoming rooted in Body, Identity, Mindset, and Faith.',
    start_url: '/app',
    display: 'standalone',
    background_color: '#faf6ec',
    theme_color: '#e5a94a',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}
