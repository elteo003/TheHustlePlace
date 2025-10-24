import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { HLSConfigProvider } from '@/components/hls-config-provider'
import { ConditionalLayout } from '@/components/conditional-layout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TheHustlePlace - Streaming Premium',
  description: 'La piattaforma di streaming più elegante e moderna. Guarda film e serie TV in alta qualità.',
  keywords: 'streaming, film, serie tv, entertainment, premium',
  authors: [{ name: 'TheHustlePlace Team' }],
  openGraph: {
    title: 'TheHustlePlace - Streaming Premium',
    description: 'La piattaforma di streaming più elegante e moderna',
    type: 'website',
    locale: 'it_IT',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TheHustlePlace - Streaming Premium',
    description: 'La piattaforma di streaming più elegante e moderna',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" className="dark">
      <head>
        {/* CSS critico inline per caricamento immediato */}
        <style dangerouslySetInnerHTML={{
          __html: `
            body { margin: 0; padding: 0; background: #000; }
            .instant-loading-fade { opacity: 0; animation: instantFadeIn 0.5s ease-out forwards; }
            @keyframes instantFadeIn { from { opacity: 0; } to { opacity: 1; } }
          `
        }} />
      </head>
      <body className={`${inter.className} scrollbar-vertical`}>
        <HLSConfigProvider>
          <div className="min-h-screen bg-black text-white">
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </div>
          <Toaster />
        </HLSConfigProvider>
      </body>
    </html>
  )
}
