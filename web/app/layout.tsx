import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Nav } from '@/components/Nav';
import { miniapp, miniappEmbed, ORIGIN } from '@/lib/miniapp-config';

export const metadata: Metadata = {
  metadataBase: new URL(ORIGIN),
  title: {
    default:  'BaseQuiz — Learn Base, level up',
    template: '%s · BaseQuiz',
  },
  description: miniapp.description,
  openGraph: {
    title:       miniapp.ogTitle,
    description: miniapp.ogDescription,
    images:      [{ url: miniapp.ogImageUrl, width: 1200, height: 800, alt: 'BaseQuiz' }],
    type:        'website',
    siteName:    'BaseQuiz',
    url:         ORIGIN,
  },
  twitter: {
    card:        'summary_large_image',
    title:       miniapp.ogTitle,
    description: miniapp.ogDescription,
    images:      [miniapp.ogImageUrl],
  },
  icons: {
    icon: [
      { url: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/brand/icon.png',     sizes: '1024x1024', type: 'image/png' },
    ],
    apple: [{ url: '/brand/icon.png' }],
  },
  // Mini-app embed metadata — feeds in Base App / Warpcast read this to render a rich card.
  other: {
    'fc:miniapp': JSON.stringify(miniappEmbed),
    // Same payload duplicated under the legacy key for backward compat.
    'fc:frame':   JSON.stringify(miniappEmbed),
    // Base.dev ownership verification — proves we own this domain for the project.
    'base:app_id': '69ffa6669ee68cd142d1afa8',
  },
};

export const viewport: Viewport = {
  width:        'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor:   '#FAF6EE',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <main className="mx-auto max-w-md min-h-screen pb-24 px-4 pt-3">
            {children}
          </main>
          <Nav />
        </Providers>
      </body>
    </html>
  );
}
