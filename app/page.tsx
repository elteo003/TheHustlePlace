'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingScreen } from '@/components/loading-screen'

export default function RootPage() {
    const router = useRouter()

    useEffect(() => {
        // Reindirizza immediatamente alla splash page
        router.replace('/splash')
    }, [router])

    return (
        <div className="fixed inset-0 z-50 bg-black">
            <LoadingScreen onComplete={() => {}} duration={15000} />
        </div>
    )
}