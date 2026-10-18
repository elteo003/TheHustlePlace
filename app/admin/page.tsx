import type { Metadata } from 'next'
import { generateLiveMLDiagnosticReport } from '@/lib/admin-ml-metrics'
import { AdminPageClient } from './admin-page-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Diagnostica raccomandazioni ML - Console Admin',
    description: 'Pannello di controllo diagnostico per algoritmi di ranking e machine learning.',
    robots: {
        index: false,
        follow: false,
    },
}

export default async function AdminPage() {
    const initialReport = await generateLiveMLDiagnosticReport()

    return <AdminPageClient initialReport={initialReport} />
}

