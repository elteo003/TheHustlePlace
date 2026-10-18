import {
    RANKER_WEIGHTS_V1,
    RankerWeights,
    TitleFeedback,
} from '@/lib/taste-ranker'
import { Top10Content } from '@/types'

export interface FunnelStage {
    name: string
    shortName: string
    count: number
    retainedPct: number
    dropPct: number
    description: string
    errorRisks: string[]
}

export interface DropOffReason {
    reason: string
    count: number
    percentage: number
    stage: string
    mitigation: string
}

export interface MetricAtK {
    k: number
    ndcg: number
    precision: number
    recall: number
    f1: number
}

export interface ConfusionMatrixData {
    tp: number // True Positives: Raccomandati in Top 10 e Graditi (thrilled, a_lot, completed)
    fp: number // False Positives: Raccomandati in Top 10 ma Rifiutati (disliked, skipped, abbandonati)
    fn: number // False Negatives: Scartati/basso ranking ma l'utente li ha cercati o amati
    tn: number // True Negatives: Correttamente esclusi dal Top 10
    precision: number
    recall: number
    specificity: number
    f1: number
    fpr: number // False Positive Rate
}

export interface AlgorithmicFailureCase {
    id: number
    title: string
    posterPath: string | null
    type: 'movie' | 'tv'
    predictedScore: number
    actualFeedback: string
    failureStage: 'Retrieval' | 'Scoring' | 'Deduplication' | 'Diversity'
    failureCategory:
        | 'POPULARITY_BIAS_OVERRIDE'
        | 'COLD_START_UNCERTAINTY'
        | 'ABANDONMENT_AMBIGUITY'
        | 'FILTER_BUBBLE_FATIGUE'
        | 'GENRE_MISMATCH_BLEED'
        | 'EXPLICIT_NEGATIVE_UNDERPENALIZED'
    explanation: string
    suggestedWeightFix: string
}

export interface FeatureAttributionItem {
    id: number
    title: string
    totalScore: number
    breakdown: {
        tasteSim: number
        newness: number
        popularity: number
        explicit: number
        neighbor: number
        abandonPenalty: number
        alreadySeenPenalty: number
        continueNoPenalty: number
    }
}

export interface LorenzPoint {
    catalogPercentile: number // 0 to 100%
    impressionShare: number // 0 to 100%
    idealShare: number // 0 to 100% (45 degree line)
}

export interface MLMetricsPayload {
    summary: {
        ndcg10: number
        map: number
        mrr: number
        precisionAt5: number
        recallAt10: number
        intraListDiversity: number
        catalogGini: number
        falsePositiveRate: number
        totalEvaluatedItems: number
        activeWeights: RankerWeights
    }
    funnel: {
        stages: FunnelStage[]
        dropOffs: DropOffReason[]
    }
    curves: {
        metricsAtK: MetricAtK[]
        lorenzCurve: LorenzPoint[]
    }
    confusionMatrix: ConfusionMatrixData
    failureCases: AlgorithmicFailureCase[]
    attributionSample: FeatureAttributionItem[]
    personas: Array<{ id: string; name: string; description: string; topGenres: string[] }>
}

// Calcolo matematico NDCG@K
export function computeNDCG(actualScores: number[], idealScores: number[], k: number): number {
    if (actualScores.length === 0 || idealScores.length === 0 || k <= 0) return 0

    const dcg = actualScores.slice(0, k).reduce((acc, score, idx) => {
        const gain = Math.max(0, Math.pow(2, score) - 1)
        const discount = Math.log2(idx + 2)
        return acc + gain / discount
    }, 0)

    const idcg = idealScores.slice(0, k).reduce((acc, score, idx) => {
        const gain = Math.max(0, Math.pow(2, score) - 1)
        const discount = Math.log2(idx + 2)
        return acc + gain / discount
    }, 0)

    if (idcg === 0) return 0
    return Math.min(1, Math.max(0, dcg / idcg))
}

// Calcolo Mean Reciprocal Rank (MRR)
export function computeMRR(relevanceGrades: number[]): number {
    for (let i = 0; i < relevanceGrades.length; i++) {
        if (relevanceGrades[i] >= 2) {
            return Number((1 / (i + 1)).toFixed(3))
        }
    }
    return 0
}

// Calcolo Intra-List Diversity (distanza media coseni generi)
export function computeIntraListDiversity(itemGenres: number[][]): number {
    if (itemGenres.length < 2) return 1
    let sumDist = 0
    let pairs = 0

    for (let i = 0; i < itemGenres.length; i++) {
        for (let j = i + 1; j < itemGenres.length; j++) {
            const setA = new Set(itemGenres[i])
            const setB = new Set(itemGenres[j])
            const intersection = itemGenres[i].filter((g) => setB.has(g)).length
            const union = new Set([...itemGenres[i], ...itemGenres[j]]).size
            const jaccardDist = union === 0 ? 0 : 1 - intersection / union
            sumDist += jaccardDist
            pairs++
        }
    }

    return pairs === 0 ? 0 : Number((sumDist / pairs).toFixed(3))
}

// Simulatore completo di metriche ML per il pannello di controllo
export function generateMLDiagnosticReport(
    customWeights: RankerWeights = RANKER_WEIGHTS_V1,
    personaId = 'cinephile'
): MLMetricsPayload {
    const weights = { ...RANKER_WEIGHTS_V1, ...customWeights }

    // Coefficienti dinamici basati sui pesi configurati
    const simBoost = weights.simTaste / 0.26
    const popSensitivity = weights.popularity / 0.08
    const explicitPenaltyStrength = weights.explicit / 0.28

    // Funnel di raccomandazione a stadi industriali
    const stages: FunnelStage[] = [
        {
            name: '1. Catalogo Globale TMDB',
            shortName: 'Catalog Pool',
            count: 12450,
            retainedPct: 100,
            dropPct: 0,
            description: 'Universo totale di titoli cinematografici e serie TV censiti da TMDB.',
            errorRisks: ['Mancanza di metadati completi', 'Rilasci non ancora distribuiti in Italia'],
        },
        {
            name: '2. Filtro Guardrails & Lingua',
            shortName: 'Safety & Locale',
            count: 3180,
            retainedPct: 25.5,
            dropPct: 74.5,
            description: 'Esclusione talk show, news, reality, soap opera e titoli privi di traccia audio/sub in italiano.',
            errorRisks: ['Esclusione accidentale di capolavori documentaristici o anime d’autore'],
        },
        {
            name: '3. Retrieval Multi-Sorgente',
            shortName: 'Candidate Retrieval',
            count: 240,
            retainedPct: 7.5,
            dropPct: 92.5,
            description: 'Generazione candidati da affinità gusti, semi di visione recenti, keyword matching e piattaforme.',
            errorRisks: [
                'Bias da popolarità (over-retrieval di blockbuster generici)',
                'Cold-start starvation per utenti con meno di 3 visioni',
            ],
        },
        {
            name: '4. Deduplicazione & Business Rules',
            shortName: 'Deduplication',
            count: 72,
            retainedPct: 30.0,
            dropPct: 70.0,
            description: 'Filtraggio titoli già visti (progresso ≥ 90%), blacklist esplicita e titoli già nei caroselli Top 10.',
            errorRisks: [
                'Falso scarto di titoli con alto valore di re-watchability',
                'Perdita di serie seguite per cui sta uscendo una nuova stagione',
            ],
        },
        {
            name: '5. Scoring & Ranker V1',
            shortName: 'Final Slate (Top 24)',
            count: 24,
            retainedPct: 33.3,
            dropPct: 66.7,
            description: 'Ordinamento pesato per affinità gusti, freschezza, popolarità, penalità abbandono e boost vicini.',
            errorRisks: [
                'Compressione del punteggio (tutti i titoli tra 0.45 e 0.52)',
                'Filter bubble: 8 titoli dello stesso genere nelle prime 10 posizioni',
            ],
        },
    ]

    const dropOffs: DropOffReason[] = [
        {
            reason: 'Titolo Già Completato (Progresso ≥ 90%)',
            count: 48,
            percentage: 28.5,
            stage: 'Deduplicazione',
            mitigation: 'Consentito reinserimento solo se feedback "Vuoi rivedere?" = sì',
        },
        {
            reason: 'Distanza Vettoriale Gusto (SimTaste < 0.20)',
            count: 42,
            percentage: 25.0,
            stage: 'Retrieval',
            mitigation: 'Esplorazione controllata tramite carosello Tesori Nascosti',
        },
        {
            reason: 'Feedback Esplicito Negativo (Disliked / Skipped)',
            count: 31,
            percentage: 18.5,
            stage: 'Scoring',
            mitigation: 'Penalizzazione rigida w_explicit (-0.28) + blacklist per 30 giorni',
        },
        {
            reason: 'Penalità Abbandono Recente (Watch progress 15-50% interrotto)',
            count: 26,
            percentage: 15.5,
            stage: 'Scoring',
            mitigation: 'Applicata penalità decrescente basata sul tempo trascorso',
        },
        {
            reason: 'Penalità Ridondanza Genere (Intra-list Diversity Guard)',
            count: 21,
            percentage: 12.5,
            stage: 'Scoring',
            mitigation: 'Penalizzazione progressiva per titoli consecutivi dello stesso genere primario',
        },
    ]

    // Metriche @ K calcolate
    const baseNdcg = Math.min(0.96, Math.max(0.68, 0.81 * simBoost - 0.05 * (popSensitivity - 1)))
    const baseP5 = Math.min(0.92, Math.max(0.60, 0.78 * simBoost + 0.04 * explicitPenaltyStrength))

    const metricsAtK: MetricAtK[] = [
        { k: 1, ndcg: Number((baseNdcg * 1.05).toFixed(3)), precision: 0.90, recall: 0.18, f1: 0.30 },
        { k: 3, ndcg: Number((baseNdcg * 1.02).toFixed(3)), precision: 0.85, recall: 0.38, f1: 0.52 },
        { k: 5, ndcg: Number(baseNdcg.toFixed(3)), precision: Number(baseP5.toFixed(3)), recall: 0.56, f1: 0.65 },
        { k: 10, ndcg: Number((baseNdcg * 0.96).toFixed(3)), precision: 0.72, recall: 0.74, f1: 0.73 },
        { k: 15, ndcg: Number((baseNdcg * 0.93).toFixed(3)), precision: 0.64, recall: 0.84, f1: 0.73 },
        { k: 20, ndcg: Number((baseNdcg * 0.90).toFixed(3)), precision: 0.58, recall: 0.91, f1: 0.71 },
    ]

    // Curva di Lorenz (Gini Catalog Coverage)
    const lorenzCurve: LorenzPoint[] = [
        { catalogPercentile: 0, impressionShare: 0, idealShare: 0 },
        { catalogPercentile: 10, impressionShare: 2.1, idealShare: 10 },
        { catalogPercentile: 20, impressionShare: 5.6, idealShare: 20 },
        { catalogPercentile: 30, impressionShare: 10.4, idealShare: 30 },
        { catalogPercentile: 40, impressionShare: 16.8, idealShare: 40 },
        { catalogPercentile: 50, impressionShare: 24.5, idealShare: 50 },
        { catalogPercentile: 60, impressionShare: 34.2, idealShare: 60 },
        { catalogPercentile: 70, impressionShare: 47.0, idealShare: 70 },
        { catalogPercentile: 80, impressionShare: 63.8, idealShare: 80 },
        { catalogPercentile: 90, impressionShare: 82.5, idealShare: 90 },
        { catalogPercentile: 100, impressionShare: 100, idealShare: 100 },
    ]

    // Matrice di Confusione
    const totalTested = 180
    const tp = Math.round(78 * simBoost)
    const fp = Math.max(6, Math.round(24 * popSensitivity - 4 * explicitPenaltyStrength))
    const fn = Math.max(4, Math.round(18 / simBoost))
    const tn = totalTested - (tp + fp + fn)

    const precision = Number((tp / (tp + fp)).toFixed(3))
    const recall = Number((tp / (tp + fn)).toFixed(3))
    const specificity = Number((tn / (tn + fp)).toFixed(3))
    const f1 = Number(((2 * precision * recall) / (precision + recall)).toFixed(3))
    const fpr = Number((fp / (fp + tn)).toFixed(3))

    // Casi di Fallimento Algoritmico Reali / Simulati
    const failureCases: AlgorithmicFailureCase[] = [
        {
            id: 93405,
            title: 'Squid Game: Stagione 2',
            posterPath: '/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg',
            type: 'tv',
            predictedScore: 0.79,
            actualFeedback: 'Disliked (Utente ha abbandonato dopo 12 min)',
            failureStage: 'Scoring',
            failureCategory: 'POPULARITY_BIAS_OVERRIDE',
            explanation:
                'La popolarità globale eccezionale (popNorm=0.98) ha soverchiato la bassa affinità per i thriller survival estremi dell’utente.',
            suggestedWeightFix:
                'Riduci w_popularity da 0.08 a 0.05 e aumenta la penalità di genere w_explicit per i titoli scartati.',
        },
        {
            id: 1022789,
            title: 'Inside Out 2',
            posterPath: '/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
            type: 'movie',
            predictedScore: 0.74,
            actualFeedback: 'Not Interested (Ignorato ripetutamente)',
            failureStage: 'Retrieval',
            failureCategory: 'FILTER_BUBBLE_FATIGUE',
            explanation:
                'L’algoritmo ha proposto 4 film d’animazione consecutivi nello scaffale Scelti per te causando saturation fatigue.',
            suggestedWeightFix:
                'Attiva l’intra-list diversity re-ranking penalizzando titoli con identico cluster di generi nelle posizioni adiacenti.',
        },
        {
            id: 693134,
            title: 'Dune: Parte Due',
            posterPath: '/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
            type: 'movie',
            predictedScore: 0.38,
            actualFeedback: 'Cercato manualmente dall’utente e valutato "Entusiasta"',
            failureStage: 'Deduplication',
            failureCategory: 'COLD_START_UNCERTAINTY',
            explanation:
                'Falso Negativo: L’algoritmo ha escluso il titolo ritenendolo "già visto" a causa di un trailer guardato al 92% nei metadati.',
            suggestedWeightFix:
                'Separa rigorosamente il progresso dei trailer dal progresso effettivo del lungometraggio.',
        },
        {
            id: 1118031,
            title: 'Apocalypse Z: Il principio della fine',
            posterPath: '/wIGJn31H0kRjN1r7G5j8fJ8p03G.jpg',
            type: 'movie',
            predictedScore: 0.68,
            actualFeedback: 'Skipped (Superato nello slider senza soffermarsi)',
            failureStage: 'Scoring',
            failureCategory: 'ABANDONMENT_AMBIGUITY',
            explanation:
                'L’utente aveva abbandonato un film simile dopo 22 minuti. Il ranker non ha collegato la penalità al sottogenere zombie.',
            suggestedWeightFix:
                'Estendi la propagazione dell’abbandono attraverso la matrice di co-occorrenza delle keyword.',
        },
    ]

    // Scomposizione WaterFall (SHAP attribution)
    const attributionSample: FeatureAttributionItem[] = [
        {
            id: 1,
            title: 'Dune: Parte Due',
            totalScore: 0.84,
            breakdown: {
                tasteSim: 0.22,
                newness: 0.08,
                popularity: 0.07,
                explicit: 0.28,
                neighbor: 0.19,
                abandonPenalty: 0.0,
                alreadySeenPenalty: 0.0,
                continueNoPenalty: 0.0,
            },
        },
        {
            id: 2,
            title: 'Slow Horses',
            totalScore: 0.76,
            breakdown: {
                tasteSim: 0.24,
                newness: 0.09,
                popularity: 0.05,
                explicit: 0.28,
                neighbor: 0.10,
                abandonPenalty: 0.0,
                alreadySeenPenalty: 0.0,
                continueNoPenalty: 0.0,
            },
        },
        {
            id: 3,
            title: 'Squid Game S2',
            totalScore: 0.49,
            breakdown: {
                tasteSim: 0.11,
                newness: 0.10,
                popularity: 0.08,
                explicit: 0.0,
                neighbor: 0.04,
                abandonPenalty: 0.08,
                alreadySeenPenalty: 0.0,
                continueNoPenalty: 0.0,
            },
        },
        {
            id: 4,
            title: 'Titolo Escluso (Blacklist)',
            totalScore: -0.33,
            breakdown: {
                tasteSim: 0.06,
                newness: 0.02,
                popularity: 0.04,
                explicit: -0.28,
                neighbor: 0.0,
                abandonPenalty: 0.08,
                alreadySeenPenalty: 0.04,
                continueNoPenalty: 0.05,
            },
        },
    ]

    const personas = [
        {
            id: 'cinephile',
            name: 'Cinefilo d’Autore & Drama',
            description: 'Preferenza per film premiati, drama d’autore, crime scandinavo e cinema vintage. Rifiuta i cinecomic.',
            topGenres: ['Dramma (18)', 'Crime (80)', 'Mistero (9648)', 'Storia (36)'],
        },
        {
            id: 'scifi_binge',
            name: 'Binge-Watcher Sci-Fi & Cyberpunk',
            description: 'Consumo compulsivo di serie TV complesse, mondi futuristici, viaggi nel tempo e distopie.',
            topGenres: ['Sci-Fi & Fantasy (10765)', 'Azione & Avventura (10759)', 'Thriller (53)'],
        },
        {
            id: 'casual_family',
            name: 'Famiglia & Mainstream Comedy',
            description: 'Alta tolleranza per i blockbuster TMDB popolari, film d’animazione e commedie leggere.',
            topGenres: ['Animazione (16)', 'Commedia (35)', 'Famiglia (10751)'],
        },
        {
            id: 'cold_start',
            name: 'Nuovo Utente (Cold Start 0 Visite)',
            description: 'Profilo privo di cronologia di visione; l’algoritmo deve basarsi sui trend editoriali calibrati.',
            topGenres: ['Top 10 Globale', 'I più votati dalla critica'],
        },
    ]

    return {
        summary: {
            ndcg10: Number(metricsAtK.find((m) => m.k === 10)?.ndcg.toFixed(3) || 0.81),
            map: 0.772,
            mrr: 0.833,
            precisionAt5: Number(baseP5.toFixed(3)),
            recallAt10: 0.74,
            intraListDiversity: 0.742,
            catalogGini: 0.412,
            falsePositiveRate: fpr,
            totalEvaluatedItems: totalTested,
            activeWeights: weights,
        },
        funnel: {
            stages,
            dropOffs,
        },
        curves: {
            metricsAtK,
            lorenzCurve,
        },
        confusionMatrix: {
            tp,
            fp,
            fn,
            tn,
            precision,
            recall,
            specificity,
            f1,
            fpr,
        },
        failureCases,
        attributionSample,
        personas,
    }
}
