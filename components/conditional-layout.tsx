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

    // Nascondi la navbar nelle pagine del player e home
    const isPlayerPage = pathname?.startsWith('/player/')
    const isHomePage = pathname === '/' || pathname === '/home'

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
            {!isPlayerPage && !isHomePage && <Navbar />}
            <div className={!isPlayerPage && !isHomePage ? 'pt-20' : ''}>
                {children}
            </div>
        </>
    )
}
