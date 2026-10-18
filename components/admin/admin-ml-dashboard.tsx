'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Layers,
    TrendingUp,
    AlertOctagon,
    Sliders,
    LogOut,
    RefreshCw,
    User,
    Sparkles,
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
            console.error('Errore durante il recupero delle metriche:', error)
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
        { id: 'funnel' as const, label: 'Funnel di selezione', icon: Layers },
        { id: 'ranking' as const, label: 'Qualità del ranking', icon: TrendingUp },
        { id: 'errors' as const, label: 'Diagnosi degli errori', icon: AlertOctagon },
        { id: 'attribution' as const, label: 'Attribuzione dei pesi', icon: Sparkles },
        { id: 'tuning' as const, label: 'Sandbox iperparametri', icon: Sliders },
    ]

    return (
        <div className="min-h-screen bg-[#090a0f] text-zinc-100 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-[#11131a] border border-white/[0.08]">
                <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                            Diagnostica raccomandazioni ML
                        </h1>
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-white/[0.06] text-zinc-400 border border-white/[0.06]">
                            Ranker v1
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-400">
                        Monitoraggio del filtraggio collaborativo, scomposizione dei pesi e classificazione degli errori.
                    </p>
                </div>

                {/* Right controls: Persona Selector, Terminal Code, Refresh, Logout */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Persona Selector */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs">
                        <User className="w-3.5 h-3.5 text-zinc-400" />
                        <select
                            value={activePersona}
                            onChange={(e) => handlePersonaChange(e.target.value)}
                            aria-label="Seleziona profilo utente"
                            className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer"
                        >
                            {report.personas.map((p) => (
                                <option key={p.id} value={p.id} className="bg-[#11131a] text-white">
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Authenticated Terminal Badge */}
                    <div className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-zinc-300">
                        {MASTER_ADMIN_CODE_FORMATTED}
                    </div>

                    {/* Refresh */}
                    <button
                        type="button"
                        onClick={() => fetchUpdatedReport(activePersona)}
                        disabled={isLoading}
                        aria-label="Ricarica metriche"
                        className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all"
                        title="Ricarica metriche"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>

                    {/* Logout */}
                    <button
                        type="button"
                        onClick={onLogout}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-rose-500/10 border border-white/[0.08] hover:border-rose-500/20 text-zinc-400 hover:text-rose-300 active:scale-95 text-xs font-medium flex items-center gap-1.5 transition-all"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Esci</span>
                    </button>
                </div>
            </div>

            {/* Top KPI Row - Clean, High-Contrast Tabular Figures */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
                <div className="p-3.5 sm:p-4 rounded-xl bg-[#11131a] border border-white/[0.06]">
                    <span className="text-xs text-zinc-400 block font-normal">
                        NDCG@10
                    </span>
                    <span className="text-2xl font-mono tabular-nums font-semibold text-white mt-1 block">
                        {report.summary.ndcg10}
                    </span>
                    <span className="text-[11px] text-zinc-500 mt-1 block">Accuratezza d&apos;ordine</span>
                </div>

                <div className="p-4 rounded-xl bg-[#11131a] border border-white/[0.06]">
                    <span className="text-xs text-zinc-400 block font-normal">
                        Precision@5
                    </span>
                    <span className="text-2xl font-mono tabular-nums font-semibold text-white mt-1 block">
                        {(report.summary.precisionAt5 * 100).toFixed(1)}%
                    </span>
                    <span className="text-[11px] text-zinc-500 mt-1 block">Hit rate prime 5</span>
                </div>

                <div className="p-4 rounded-xl bg-[#11131a] border border-white/[0.06]">
                    <span className="text-xs text-zinc-400 block font-normal">
                        MRR
                    </span>
                    <span className="text-2xl font-mono tabular-nums font-semibold text-white mt-1 block">
                        {report.summary.mrr}
                    </span>
                    <span className="text-[11px] text-zinc-500 mt-1 block">Primo hit rilevante</span>
                </div>

                <div className="p-4 rounded-xl bg-[#11131a] border border-white/[0.06]">
                    <span className="text-xs text-zinc-400 block font-normal">
                        Diversità ILD
                    </span>
                    <span className="text-2xl font-mono tabular-nums font-semibold text-white mt-1 block">
                        {report.summary.intraListDiversity}
                    </span>
                    <span className="text-[11px] text-zinc-500 mt-1 block">Varietà dei generi</span>
                </div>

                <div className="p-4 rounded-xl bg-[#11131a] border border-white/[0.06]">
                    <span className="text-xs text-zinc-400 block font-normal">
                        Indice di Gini
                    </span>
                    <span className="text-2xl font-mono tabular-nums font-semibold text-white mt-1 block">
                        {report.summary.catalogGini}
                    </span>
                    <span className="text-[11px] text-zinc-500 mt-1 block">Copertura catalogo</span>
                </div>

                <div className="p-4 rounded-xl bg-[#11131a] border border-white/[0.06]">
                    <span className="text-xs text-zinc-400 block font-normal">
                        Falsi positivi
                    </span>
                    <span className="text-2xl font-mono tabular-nums font-semibold text-white mt-1 block">
                        {(report.summary.falsePositiveRate * 100).toFixed(1)}%
                    </span>
                    <span className="text-[11px] text-zinc-500 mt-1 block">Tasso di scarto</span>
                </div>
            </div>

            {/* Segmented Tab Navigation */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#11131a] border border-white/[0.06] overflow-x-auto [scrollbar-width:none]">
                {tabs.map((t) => {
                    const Icon = t.icon
                    const isActive = activeTab === t.id

                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setActiveTab(t.id)}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                                isActive
                                    ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
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
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                >
                    {activeTab === 'funnel' && (
                        <FunnelChart
                            stages={report.funnel.stages}
                            dropOffs={report.funnel.dropOffs}
                        />
                    )}

                    {activeTab === 'ranking' && (
                        <div className="space-y-6">
                            <RankingQualityChart
                                metricsAtK={report.curves.metricsAtK}
                                mrr={report.summary.mrr}
                                map={report.summary.map}
                                ild={report.summary.intraListDiversity}
                            />
                            <LorenzGiniChart
                                points={report.curves.lorenzCurve}
                                gini={report.summary.catalogGini}
                            />
                        </div>
                    )}

                    {activeTab === 'errors' && (
                        <div className="space-y-6">
                            <ConfusionMatrixCard data={report.confusionMatrix} />
                            <FailureCasesTable cases={report.failureCases} />
                        </div>
                    )}

                    {activeTab === 'attribution' && (
                        <FeatureAttributionWaterfall items={report.attributionSample} />
                    )}

                    {activeTab === 'tuning' && (
                        <div className="space-y-6">
                            <HyperparameterSandbox
                                weights={weights}
                                onApplyWeights={handleApplyWeights}
                            />
                            <RankingQualityChart
                                metricsAtK={report.curves.metricsAtK}
                                mrr={report.summary.mrr}
                                map={report.summary.map}
                                ild={report.summary.intraListDiversity}
                            />
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
