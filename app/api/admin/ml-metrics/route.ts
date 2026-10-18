import { NextRequest, NextResponse } from 'next/server'
import { generateLiveMLDiagnosticReport } from '@/lib/admin-ml-metrics'
import { RANKER_WEIGHTS_V1, RankerWeights } from '@/lib/taste-ranker'
import { isDatabaseConfigured } from '@/lib/db'
import { loadRankerWeights, saveRankerWeights } from '@/lib/db/title-feedback'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const personaId = searchParams.get('persona') || 'real_community'

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

        const report = await generateLiveMLDiagnosticReport(effectiveWeights, personaId)
        return NextResponse.json(report)
    } catch (error) {
        console.error('Errore /api/admin/ml-metrics:', error)
        return NextResponse.json({ error: 'Errore generazione metriche ML' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        if (!body || !body.weights) {
            return NextResponse.json({ error: 'Pesi non validi forniti' }, { status: 400 })
        }

        const saved = await saveRankerWeights(body.weights)
        if (!saved) {
            return NextResponse.json({ error: 'Impossibile salvare i pesi nel database' }, { status: 500 })
        }

        const updatedReport = await generateLiveMLDiagnosticReport(body.weights)
        return NextResponse.json({ success: true, report: updatedReport })
    } catch (error) {
        console.error('Errore POST /api/admin/ml-metrics:', error)
        return NextResponse.json({ error: 'Errore durante il salvataggio dei pesi' }, { status: 500 })
    }
}

