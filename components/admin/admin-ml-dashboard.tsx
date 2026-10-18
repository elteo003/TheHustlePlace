'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Activity,
    Layers,
    TrendingUp,
    ShieldAlert,
    Sliders,
    Sparkles,
    LogOut,
    RefreshCw,
    UserCheck,
    Cpu,
    Target,
    Scale,
    AlertOctagon,
} from 'lucide-react'
import { MLMetricsPayload } from '@/lib/admin-ml-metrics'
import { RankerWeights } from '@/lib/taste-ranker'
import { FunnelChart } from './funnel-chart'
import { RankingQualityChart } from './ranking-quality-chart'
import { ConfusionMatrixCard } from './confusion-matrix-card'
import { LorenzGiniChart } from './lorenz-gini-chart'
import { FeatureAttributionWaterfall } from './feature-attribution-waterfall'
import { FailureCasesTable } from './failure-cases-table'
import { HyperparameterSandbox } from './hyperparameter-sandbox'
import { MASTER_ADMIN_CODE_FORMATTED } from '@/lib/admin-auth'

interface AdminMLDashboardProps {
    initialReport: MLMetricsPayload
    onLogout: () => void
}

export function AdminMLDashboard({ initialReport, onLogout }: AdminMLDashboardProps) {
    const router = useRouter()
    const [report, setReport] = useState<MLMetricsPayload>(initialReport)
    const [activeTab, setActiveTab] = useState<'funnel' | 'ranking' | 'errors' | 'attribution' | 'tuning'>('funnel')
    const [activePersona, setActivePersona] = useState<string>('cinephile')
    const [isLoading, setIsLoading] = useState(false)
    const [weights, setWeights] = useState<RankerWeights>(initialReport.summary.activeWeights)

    const fetchUpdatedReport = async (persona: string, customWeights?: RankerWeights) => {
        setIsLoading(true)
        try {
            const w = customWeights || weights
            const query = new URLSearchParams({
                persona,
                simTaste: String(w.simTaste),
                newness: String(w.newness),
                popularity: String(w.popularity),
                explicit: String(w.explicit),
                neighbor: String(w.neighbor),
                abandon: String(w.abandon),
            }).toString()

            const res = await fetch(`/api/admin/ml-metrics?${query}`)
            const data = (await res.json()) as MLMetricsPayload
            if (data && data.summary) {
                setReport(data)
                if (customWeights) setWeights(customWeights)
            }
        } catch (error) {
            console.error('Errore fetch metriche:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handlePersonaChange = (id: string) => {
        setActivePersona(id)
        fetchUpdatedReport(id)
    }

    const handleApplyWeights = (newWeights: RankerWeights) => {
        fetchUpdatedReport(activePersona, newWeights)
    }

    const tabs = [
        { id: 'funnel' as const, label: 'Funnel di Raccomandazione', icon: Layers },
        { id: 'ranking' as const, label: 'Qualità Ranking (NDCG/MAP)', icon: TrendingUp },
        { id: 'errors' as const, label: 'Error Analysis & Diagnosi', icon: AlertOctagon },
        { id: 'attribution' as const, label: 'Feature Attribution & SHAP', icon: Sparkles },
        { id: 'tuning' as const, label: 'Tuning Pesi Sandbox', icon: Sliders },
    ]

    return (
        <div className="min-h-screen bg-black text-white p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
            {/* Header bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-950/80 border border-white/10 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-zinc-900 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                        <Cpu className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-black text-white tracking-tight">
                                ML Recommendation Diagnostics
                            </h1>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/70 border border-cyan-500/30 text-cyan-300">
                                Ranker V1
                            </span>
                        </div>
                        <p className="text-xs text-white/50">
                            Console di validazione per modelli di filtraggio collaborativo e ranking multiobiettivo.
                        </p>
                    </div>
                </div>

                {/* Right actions: Persona selector, Admin code badge, Logout */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Persona Selector */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-xs">
                        <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                        <select
                            value={activePersona}
                            onChange={(e) => handlePersonaChange(e.target.value)}
                            className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer"
                        >
                            {report.personas.map((p) => (
                                <option key={p.id} value={p.id} className="bg-zinc-950 text-white">
                                    Profilo: {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Master Code Authenticated Badge */}
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{MASTER_ADMIN_CODE_FORMATTED}</span>
                    </div>

                    {/* Refresh */}
                    <button
                        type="button"
                        onClick={() => fetchUpdatedReport(activePersona)}
                        disabled={isLoading}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                        title="Ricarica metriche"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>

                    {/* Logout */}
                    <button
                        type="button"
                        onClick={onLogout}
                        className="px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 hover:bg-red-950/70 active:scale-95 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Esci</span>
                    </button>
                </div>
            </div>

            {/* Top KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-4 rounded-xl bg-zinc-950/70 border border-white/10">
                    <span className="text-[10px] text-white/50 uppercase tracking-wider block font-semibold">
                        NDCG@10
                    </span>
                    <span className="text-xl sm:text-2xl font-mono font-black text-emerald-400 mt-0.5 block">
                        {report.summary.ndcg10}
                    </span>
                    <span className="text-[10px] text-emerald-300/80 mt-1 block">Accuratezza Posizionale</span>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950/70 border border-white/10">
                    <span className="text-[10px] text-white/50 uppercase tracking-wider block font-semibold">
                        Precision@5
                    </span>
                    <span className="text-xl sm:text-2xl font-mono font-black text-cyan-400 mt-0.5 block">
                        {(report.summary.precisionAt5 * 100).toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-cyan-300/80 mt-1 block">Hit Rate Top 5</span>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950/70 border border-white/10">
                    <span className="text-[10px] text-white/50 uppercase tracking-wider block font-semibold">
                        MRR
                    </span>
                    <span className="text-xl sm:text-2xl font-mono font-black text-white mt-0.5 block">
                        {report.summary.mrr}
                    </span>
                    <span className="text-[10px] text-white/50 mt-1 block">Posizione Primo Hit</span>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950/70 border border-white/10">
                    <span className="text-[10px] text-white/50 uppercase tracking-wider block font-semibold">
                        Intra-List Div.
                    </span>
                    <span className="text-xl sm:text-2xl font-mono font-black text-purple-400 mt-0.5 block">
                        {report.summary.intraListDiversity}
                    </span>
                    <span className="text-[10px] text-purple-300/80 mt-1 block">Varietà Generi Slate</span>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950/70 border border-white/10">
                    <span className="text-[10px] text-white/50 uppercase tracking-wider block font-semibold">
                        Gini Index
                    </span>
                    <span className="text-xl sm:text-2xl font-mono font-black text-amber-400 mt-0.5 block">
                        {report.summary.catalogGini}
                    </span>
                    <span className="text-[10px] text-amber-300/80 mt-1 block">Coda Lunga Catalogo</span>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950/70 border border-white/10">
                    <span className="text-[10px] text-white/50 uppercase tracking-wider block font-semibold">
                        False Positives
                    </span>
                    <span className="text-xl sm:text-2xl font-mono font-black text-rose-400 mt-0.5 block">
                        {(report.summary.falsePositiveRate * 100).toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-rose-300/80 mt-1 block">Tasso di Rigetto</span>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-950 border border-white/10 overflow-x-auto [scrollbar-width:none]">
                {tabs.map((t) => {
                    const Icon = t.icon
                    const isActive = activeTab === t.id

                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setActiveTab(t.id)}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                                isActive
                                    ? 'bg-white text-black shadow-md shadow-white/10'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{t.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* Tab Contents */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                >
                    {activeTab === 'funnel' && (
                        <FunnelChart
                            stages={report.funnel.stages}
                            dropOffs={report.funnel.dropOffs}
                        />
                    )}

                    {activeTab === 'ranking' && (
                        <RankingQualityChart
                            metricsAtK={report.curves.metricsAtK}
                            mrr={report.summary.mrr}
                            map={report.summary.map}
                            ild={report.summary.intraListDiversity}
                        />
                    )}

                    {activeTab === 'errors' && (
                        <div className="space-y-6">
                            <ConfusionMatrixCard data={report.confusionMatrix} />
                            <FailureCasesTable cases={report.failureCases} />
                        </div>
                    )}

                    {activeTab === 'attribution' && (
                        <div className="space-y-6">
                            <FeatureAttributionWaterfall items={report.attributionSample} />
                            <LorenzGiniChart
                                points={report.curves.lorenzCurve}
                                gini={report.summary.catalogGini}
                            />
                        </div>
                    )}

                    {activeTab === 'tuning' && (
                        <HyperparameterSandbox
                            weights={weights}
                            onApplyWeights={handleApplyWeights}
                        />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
