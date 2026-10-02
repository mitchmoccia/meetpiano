import type { Metadata, Viewport } from 'next';
import { connection } from 'next/server';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'MeetPiano family', template: '%s · MeetPiano' },
  description: 'Family profiles and saved practice for MeetPiano.',
  robots: { index: false, follow: false },
  icons: { icon: '/assets/favicon.svg' }
};

export const viewport: Viewport = { themeColor: '#fffdf6' };

export default async function RootLayout({ children }: { children: ReactNode }) {
  // The proxy's per-request CSP nonce only reaches Next.js scripts when pages render dynamically.
  await connection();
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-bold"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
