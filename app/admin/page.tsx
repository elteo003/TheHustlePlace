import { generateMLDiagnosticReport } from '@/lib/admin-ml-metrics'
import { AdminPageClient } from './admin-page-client'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
    const initialReport = generateMLDiagnosticReport()

    return <AdminPageClient initialReport={initialReport} />
}
