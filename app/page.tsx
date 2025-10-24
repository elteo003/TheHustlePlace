'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RootPage() {
    const router = useRouter()

    useEffect(() => {
        // Reindirizza alla splash page
        router.push('/splash')
    }, [router])

    return null
}