'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingScreen } from '@/components/loading-screen'

export default function RootPage() {
    const router = useRouter()

    useEffect(() => {
        // Reindirizza alla splash page dopo un breve delay per evitare la pagina nera
        const timer = setTimeout(() => {
            router.push('/splash')
        }, 100)
        
        return () => clearTimeout(timer)
    }, [router])

    return (
        <div className="fixed inset-0 z-50 bg-black">
            <LoadingScreen onComplete={() => {}} duration={15000} />
        </div>
    )
}