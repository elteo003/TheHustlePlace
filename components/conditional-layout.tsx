'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Navbar } from './navbar'
import { PageTransition } from './page-transition'

interface ConditionalLayoutProps {
    children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
    const pathname = usePathname()
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    const isPlayerPage = pathname?.startsWith('/player/')
    const isSplash = pathname === '/'
    const isHome = pathname === '/home'
    const showNavbar = !isPlayerPage && !isSplash
    const needsTopPadding = showNavbar && !isHome

    if (!isClient) {
        return <div className="min-h-screen bg-black text-white">{children}</div>
    }

    return (
        <>
            {showNavbar && <Navbar immersive={false} />}
            <div className={needsTopPadding ? 'pt-16' : ''}>
                <PageTransition>{children}</PageTransition>
            </div>
        </>
    )
}
