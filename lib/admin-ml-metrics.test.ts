import { describe, it, expect } from 'vitest'
import {
    computeNDCG,
    computeMRR,
    computeIntraListDiversity,
    generateMLDiagnosticReport,
} from './admin-ml-metrics'
import { isValidAdminCode, isDeviceAdminCode, MASTER_ADMIN_CODE_RAW, MASTER_ADMIN_CODE_FORMATTED } from './admin-auth'
import { RANKER_WEIGHTS_V1 } from './taste-ranker'

describe('Admin ML Metrics & Evaluation Suite', () => {
    it('calcola correttamente NDCG@K su ranking perfetti e invertiti', () => {
        const ideal = [3, 2, 1, 0]
        const actualPerfect = [3, 2, 1, 0]
        const actualWorst = [0, 0, 1, 3]

        expect(computeNDCG(actualPerfect, ideal, 4)).toBe(1.0)
        const worstNDCG = computeNDCG(actualWorst, ideal, 4)
        expect(worstNDCG).toBeGreaterThan(0)
        expect(worstNDCG).toBeLessThan(0.6)
    })

    it('calcola Mean Reciprocal Rank (MRR)', () => {
        // First relevant item at index 0 (rank 1) -> MRR = 1.0
        expect(computeMRR([2, 1, 0])).toBe(1.0)
        // First relevant item at index 1 (rank 2) -> MRR = 0.5
        expect(computeMRR([0, 2, 1])).toBe(0.5)
        // First relevant item at index 2 (rank 3) -> MRR = 0.333
        expect(computeMRR([0, 1, 3])).toBe(0.333)
    })

    it('calcola Intra-List Diversity (distanza Jaccard media tra vettori genere)', () => {
        // Diverse list
        const diverseGenres = [[28, 12], [35, 10751], [27, 53]]
        const diversity = computeIntraListDiversity(diverseGenres)
        expect(diversity).toBeGreaterThan(0.7)

        // Homogeneous list (all action/adventure)
        const sameGenres = [[28, 12], [28, 12], [28, 12]]
        expect(computeIntraListDiversity(sameGenres)).toBe(0)
    })

    it('genera il report diagnostico completo per esperti ML', () => {
        const report = generateMLDiagnosticReport(RANKER_WEIGHTS_V1, 'cinephile')

        // Summary KPI
        expect(report.summary.ndcg10).toBeGreaterThan(0.6)
        expect(report.summary.precisionAt5).toBeGreaterThan(0.5)
        expect(report.summary.mrr).toBeGreaterThan(0.5)
        expect(report.summary.intraListDiversity).toBeGreaterThan(0.5)
        expect(report.summary.catalogGini).toBeGreaterThan(0.3)

        // Funnel has 5 industrial stages
        expect(report.funnel.stages.length).toBe(5)
        expect(report.funnel.stages[0].shortName).toBe('Catalog Pool')
        expect(report.funnel.stages[4].shortName).toBe('Final Slate (Top 24)')

        // Confusion matrix
        expect(report.confusionMatrix.tp).toBeGreaterThan(0)
        expect(report.confusionMatrix.precision).toBeGreaterThan(0.5)
        expect(report.confusionMatrix.recall).toBeGreaterThan(0.5)

        // Failure cases categorized by pipeline stage
        expect(report.failureCases.length).toBeGreaterThan(2)
        expect(report.failureCases.some((f) => f.failureStage === 'Scoring')).toBe(true)
        expect(report.failureCases.some((f) => f.failureStage === 'Retrieval')).toBe(true)

        // SHAP attribution samples
        expect(report.attributionSample.length).toBeGreaterThan(1)
    })

    it('autentica rigorosamente solo con il codice specificato M7BY - Z77K', () => {
        expect(isValidAdminCode('M7BY - Z77K')).toBe(true)
        expect(isValidAdminCode('M7BY-Z77K')).toBe(true)
        expect(isValidAdminCode('m7byz77k')).toBe(true)
        expect(isValidAdminCode(MASTER_ADMIN_CODE_RAW)).toBe(true)
        expect(isValidAdminCode(MASTER_ADMIN_CODE_FORMATTED)).toBe(true)

        // Invalid codes
        expect(isValidAdminCode('AAAA-BBBB')).toBe(false)
        expect(isValidAdminCode('12345678')).toBe(false)
        expect(isValidAdminCode('')).toBe(false)
        expect(isValidAdminCode(null)).toBe(false)
    })

    it('identifica correttamente il dispositivo admin M7BY-Z77K', () => {
        expect(isDeviceAdminCode('M7BY-Z77K')).toBe(true)
        expect(isDeviceAdminCode('M7BYZ77K')).toBe(true)
        expect(isDeviceAdminCode('OTHER123')).toBe(false)
    })
})
