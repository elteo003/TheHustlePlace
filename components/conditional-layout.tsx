'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from './navbar'

interface ConditionalLayoutProps {
    children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
    const pathname = usePathname()

    // Nascondi la navbar nelle pagine del player, home e splash
    const isPlayerPage = pathname?.startsWith('/player/')
    const isHomePage = pathname === '/' || pathname === '/home'
    const isSplashPage = pathname === '/splash'

    return (
        <>
            {!isPlayerPage && !isHomePage && !isSplashPage && <Navbar />}
            <div className={!isPlayerPage && !isHomePage && !isSplashPage ? 'pt-20' : ''}>
                {children}
            </div>
        </>
    )
}
