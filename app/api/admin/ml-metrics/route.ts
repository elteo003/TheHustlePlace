import { NextRequest, NextResponse } from 'next/server'
import { generateMLDiagnosticReport } from '@/lib/admin-ml-metrics'
import { RANKER_WEIGHTS_V1, RankerWeights } from '@/lib/taste-ranker'
import { isDatabaseConfigured } from '@/lib/db'
import { loadRankerWeights } from '@/lib/db/title-feedback'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const personaId = searchParams.get('persona') || 'cinephile'

        let baseWeights: RankerWeights = RANKER_WEIGHTS_V1
        if (isDatabaseConfigured()) {
            try {
                baseWeights = await loadRankerWeights()
            } catch {
                // fallback to v1
            }
        }

        // Custom weight overrides from query
        const simTaste = searchParams.get('simTaste')
        const newness = searchParams.get('newness')
        const popularity = searchParams.get('popularity')
        const explicit = searchParams.get('explicit')
        const neighbor = searchParams.get('neighbor')
        const abandon = searchParams.get('abandon')

        const effectiveWeights: RankerWeights = {
            ...baseWeights,
            simTaste: simTaste ? Number(simTaste) : baseWeights.simTaste,
            newness: newness ? Number(newness) : baseWeights.newness,
            popularity: popularity ? Number(popularity) : baseWeights.popularity,
            explicit: explicit ? Number(explicit) : baseWeights.explicit,
            neighbor: neighbor ? Number(neighbor) : baseWeights.neighbor,
            abandon: abandon ? Number(abandon) : baseWeights.abandon,
        }

        const report = generateMLDiagnosticReport(effectiveWeights, personaId)
        return NextResponse.json(report)
    } catch (error) {
        console.error('Errore /api/admin/ml-metrics:', error)
        return NextResponse.json({ error: 'Errore generazione metriche ML' }, { status: 500 })
    }
}
