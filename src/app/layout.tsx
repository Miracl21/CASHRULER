
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AppProvider } from '@/contexts/AppContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from 'next-themes';
import Script from 'next/script';



export const metadata: Metadata = {
  title: 'CASHRULER Mobile',
  description: 'Gérez vos finances personnelles simplement.',
  manifest: '/manifest.json', // Ajout du manifest pour PWA
  icons: [
    { rel: 'apple-touch-icon', url: '/icons/icon-192.png' },
    { rel: 'icon', url: '/icons/icon-192.png' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0D9668" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png"></link>
      </head>
      <body className="antialiased bg-background">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <AuthProvider>
            <AppProvider>
              <div className="flex flex-col items-center min-h-dvh">
                <div className="w-full max-w-lg min-h-dvh flex flex-col shadow-xl overflow-x-hidden">
                  {children}
                </div>
              </div>
              <Toaster />
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
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
