'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Navbar } from './navbar'
import { PageTransition } from './page-transition'
import { TrailerPeekProvider } from '@/contexts/trailer-peek-context'
import { rememberBrowsePath } from '@/lib/player-exit'
import { TvEntryRedirect } from '@/tv/components/TvEntryRedirect'
import { isLivingPath } from '@/tv/lib/paths'

interface ConditionalLayoutProps {
    children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
    const pathname = usePathname()
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    useEffect(() => {
        if (!isClient || !pathname) return
        rememberBrowsePath(`${pathname}${window.location.search}`)
    }, [isClient, pathname])

    const isPlayerPage = pathname?.startsWith('/player/')
    const isSplash = pathname === '/'
    const isHome = pathname === '/home'
    const isLiving = isLivingPath(pathname)
    const showNavbar = !isPlayerPage && !isSplash && !isLiving
    const needsTopPadding = showNavbar && !isHome

    if (!isClient) {
        return <div className="min-h-screen bg-black text-white">{children}</div>
    }

    return (
        <TrailerPeekProvider>
            <TvEntryRedirect />
            {showNavbar && <Navbar immersive={false} />}
            <div className={needsTopPadding ? 'pt-16' : ''}>
                <PageTransition>{children}</PageTransition>
            </div>
        </TrailerPeekProvider>
    )
}
