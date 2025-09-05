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
      <body className={inter.className}>
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
