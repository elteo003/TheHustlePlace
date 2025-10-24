'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RootPage() {
    const router = useRouter()

    useEffect(() => {
        // Reindirizza immediatamente alla splash page
        router.replace('/splash')
    }, [router])

    return (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
            <div className="text-white text-xl">Caricamento...</div>
        </div>
    )
}