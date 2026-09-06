import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Wild Honey Circle',
    short_name: 'Wild Honey',
    description:
      'Start with the body — the rest of the life is in here. Programs, teaching, food, movement, money and a circle of women, for Body, Identity, Mindset and Faith.',
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
