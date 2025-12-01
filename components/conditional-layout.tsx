'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Navbar } from './navbar'

interface ConditionalLayoutProps {
    children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
    const pathname = usePathname()
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    // Nascondi la navbar globale nelle pagine player, nello splash e nella home
    const isPlayerPage = pathname?.startsWith('/player/')
    const isSplashPage = pathname === '/'
    const isHomePage = pathname === '/home'
    const hideNavbar = isPlayerPage || isSplashPage || isHomePage

    // Evita hydration mismatch mostrando layout base durante SSR
    if (!isClient) {
        return (
            <div className="min-h-screen bg-black text-white">
                {children}
            </div>
        )
    }

    return (
        <>
            {!hideNavbar && <Navbar />}
            <div className={!hideNavbar ? 'pt-20' : ''}>
                {children}
            </div>
        </>
    )
}
