
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AppProvider } from '@/contexts/AppContext';
import { AuthProvider } from '@/contexts/AuthContext';
import Script from 'next/script';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CASHRULER Mobile',
  description: 'Gérez vos finances personnelles simplement.',
  manifest: '/manifest.json', // Ajout du manifest pour PWA
  icons: [
    { rel: 'apple-touch-icon', url: 'https://placehold.co/192x192.png' },
    { rel: 'icon', url: 'https://placehold.co/192x192.png' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#388E3C" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="https://placehold.co/192x192.png" data-ai-hint="app icon"></link>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-background`}>
        <AuthProvider>
          <AppProvider>
            <div className="flex flex-col items-center min-h-full">
              <div className="w-full max-w-md h-full flex flex-col shadow-xl overflow-hidden">
                {children}
              </div>
            </div>
            <Toaster />
          </AppProvider>
        </AuthProvider>
        <Script id="service-worker-registration" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                  .then((registration) => {
                    console.log('Service Worker registered with scope:', registration.scope);
                  })
                  .catch((error) => {
                    console.error('Service Worker registration failed:', error);
                  });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
