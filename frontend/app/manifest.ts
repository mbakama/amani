import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Amani',
    short_name: 'Amani',
    description: "Musique, slam et poésie des artistes baha'is de RDC",
    start_url: '/',
    display: 'standalone',
    background_color: '#f2f4f1',
    theme_color: '#1e4d3d',
    orientation: 'portrait-primary',
    lang: 'fr',
    categories: ['music', 'entertainment'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
