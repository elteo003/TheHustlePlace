'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from './navbar'

interface ConditionalLayoutProps {
    children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
    const pathname = usePathname()

    // Nascondi la navbar nelle pagine del player e home
    const isPlayerPage = pathname?.startsWith('/player/')
    const isHomePage = pathname === '/' || pathname === '/home'

    return (
        <>
            {!isPlayerPage && !isHomePage && <Navbar />}
            <div className={!isPlayerPage && !isHomePage ? 'pt-20' : ''}>
                {children}
            </div>
        </>
    )
}
