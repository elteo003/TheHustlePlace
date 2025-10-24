'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingScreen } from '@/components/loading-screen'

export default function RootPage() {
    const router = useRouter()
    const [showAnimation, setShowAnimation] = useState(true)
    const [isFadingOut, setIsFadingOut] = useState(false)

    useEffect(() => {
        // Mostra l'animazione per 15 secondi
        const timer = setTimeout(() => {
            // Inizia il fade-out
            setIsFadingOut(true)
            
            // Dopo 1 secondo di fade-out, naviga alla home
            setTimeout(() => {
                router.push('/home')
            }, 1000)
        }, 15000) // 15 secondi

        return () => clearTimeout(timer)
    }, [router])

    return (
        <div className={`fixed inset-0 z-50 bg-black transition-opacity duration-1000 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
            <LoadingScreen onComplete={() => {}} duration={15000} />
        </div>
    )
}