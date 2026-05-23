import type { Metadata, Viewport } from 'next'
import './globals.css'
import './aurie-design.css'
import { DevServiceWorkerCleaner } from '@/shared/components/devtools/DevServiceWorkerCleaner'
import { ThemeProvider } from '@/shared/components/theme'
import { ThemedToaster } from '@/shared/components/providers/ThemedToaster'

export const metadata: Metadata = {
  title: 'Aurie CRM',
  description: 'Sistema de gestión integral para agencias',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Aurie CRM',
    startupImage: [
      '/brand/logo.png',
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#08060E',
}

// Inline script: sets data-mode/data-brand on <body> BEFORE React hydrates,
// reading from localStorage. Avoids flash of opposite theme.
const noFlashScript = `
(function(){
  try {
    var m = localStorage.getItem('aurie-theme-mode') || 'dark';
    var apply = function(){
      document.body.setAttribute('data-mode', m);
      document.body.setAttribute('data-brand', 'aurie');
    };
    if (document.body) apply();
    else document.addEventListener('DOMContentLoaded', apply);
  } catch(e) {}
})();
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body data-brand="aurie" data-mode="dark" suppressHydrationWarning>
        <ThemeProvider>
          {children}
          <ThemedToaster />
        </ThemeProvider>
        <DevServiceWorkerCleaner />
      </body>
    </html>
  )
}
