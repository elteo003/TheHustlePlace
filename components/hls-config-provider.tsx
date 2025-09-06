'use client'

import { useEffect } from 'react'
import { configureHLS, cleanupHLS } from '@/utils/hls-config'

interface HLSConfigProviderProps {
    children: React.ReactNode
}

export function HLSConfigProvider({ children }: HLSConfigProviderProps) {
    useEffect(() => {
        // Configura HLS.js all'avvio dell'applicazione
        configureHLS()

        // Cleanup quando il componente viene smontato
        return () => {
            cleanupHLS()
        }
    }, [])

    return <>{children}</>
}



