'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RootPage() {
    const router = useRouter()
    const [isClient, setIsClient] = useState(false)
    const [isFadingOut, setIsFadingOut] = useState(false)

    useEffect(() => {
        // Indica che siamo lato client
        setIsClient(true)

        // Naviga alla home dopo 15 secondi
        const timer = setTimeout(() => {
            setIsFadingOut(true)
            setTimeout(() => {
                router.push('/home')
            }, 1000)
        }, 15000)

        return () => clearTimeout(timer)
    }, [router])

    return (
        <div className={`fixed inset-0 z-50 bg-black transition-opacity duration-1000 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
            {/* CSS-Only Loading Animation - Parte immediatamente */}
            <div className="flex flex-col items-center justify-center h-full instant-loading-fade">
                {/* Logo */}
                <div className="instant-loading-logo mb-8">
                    <div className="w-24 h-24 bg-gradient-to-r from-blue-400 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl overflow-hidden">
                        <span className="text-white font-bold text-4xl drop-shadow-lg">H</span>
                    </div>
                </div>

                {/* Text */}
                <div className="text-center mb-12">
                    <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-4">
                        TheHustlePlace
                    </h1>
                    <p className="text-xl text-gray-300 font-medium">
                        STREAMING PREMIUM
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="w-80 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="instant-loading-progress h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                </div>

                {/* Loading Text */}
                <p className="text-gray-400 mt-6 text-lg">
                    Caricamento in corso...
                </p>
            </div>

            {/* Fallback per quando JavaScript non è ancora caricato */}
            <noscript>
                <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-24 h-24 bg-gradient-to-r from-blue-400 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl mb-8 overflow-hidden">
                        <span className="text-white font-bold text-4xl drop-shadow-lg">H</span>
                    </div>
                    <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-4">
                        TheHustlePlace
                    </h1>
                    <p className="text-xl text-gray-300 font-medium mb-12">
                        STREAMING PREMIUM
                    </p>
                    <p className="text-gray-400 text-lg">
                        Abilita JavaScript per continuare...
                    </p>
                </div>
            </noscript>
        </div>
    )
}