import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Nav } from '@/components/Nav';

export const metadata: Metadata = {
  title: 'BaseQuiz — Learn Base, level up',
  description: 'Onchain quiz about the Base ecosystem. EAS-attested levels, global leaderboard.',
  openGraph: {
    title: 'BaseQuiz',
    description: 'Learn Base, level up. Onchain quiz with EAS-attested progression.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#FAF6EE',
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
