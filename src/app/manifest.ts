import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Crew — Gestion d\'équipe',
    short_name: 'Crew',
    description: "PWA pour coordonner l'équipe média d'une église : services, planning, validation mensuelle, contenu spirituel.",
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F4F4F2',
    theme_color: '#16161B',
    lang: 'fr',
    categories: ['productivity', 'lifestyle', 'social'],
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    shortcuts: [
      {
        name: 'Mon dashboard',
        short_name: 'Dashboard',
        description: 'Accéder à mon dashboard membre',
        url: '/dashboard',
      },
      {
        name: 'Console admin',
        short_name: 'Admin',
        description: 'Accéder à la console admin',
        url: '/admin',
      },
    ],
  };
}
