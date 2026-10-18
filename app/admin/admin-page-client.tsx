'use client'

import { useState, useEffect } from 'react'
import { MLMetricsPayload } from '@/lib/admin-ml-metrics'
import { AdminAuthGate } from '@/components/admin/admin-auth-gate'
import { AdminMLDashboard } from '@/components/admin/admin-ml-dashboard'

interface AdminPageClientProps {
    initialReport: MLMetricsPayload
}

export function AdminPageClient({ initialReport }: AdminPageClientProps) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

    useEffect(() => {
        let isMounted = true
        fetch('/api/admin/auth')
            .then((r) => r.json())
            .then((data) => {
                if (isMounted) {
                    setIsAuthenticated(Boolean(data?.authenticated))
                }
            })
            .catch(() => {
                if (isMounted) setIsAuthenticated(false)
            })

        return () => {
            isMounted = false
        }
    }, [])

    const handleLogout = async () => {
        await fetch('/api/admin/auth', { method: 'DELETE' }).catch(() => undefined)
        setIsAuthenticated(false)
    }

    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen bg-[#090a0f] flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
        )
    }

    if (!isAuthenticated) {
        return <AdminAuthGate onAuthenticated={() => setIsAuthenticated(true)} />
    }

    return <AdminMLDashboard initialReport={initialReport} onLogout={handleLogout} />
}
