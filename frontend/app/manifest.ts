import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'WordCraft - Learn Languages with Flashcards',
    short_name: 'WordCraft',
    description: 'Master new languages with WordCraft - the ultimate flashcard learning platform.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    icons: [
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
    ],
    categories: ['education', 'productivity'],
    lang: 'en',
    orientation: 'portrait',
  }
}


