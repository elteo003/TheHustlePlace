'use client'

import { useState } from 'react'
import Link from 'next/link'
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
    ArrowLeft,
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

    const handleSaveProductionWeights = async (newWeights: RankerWeights): Promise<boolean> => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/admin/ml-metrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weights: newWeights }),
            })
            const data = await res.json()
            if (data.report) {
                setReport(data.report)
                setWeights(newWeights)
                return true
            }
            return false
        } catch (error) {
            console.error('Errore salvataggio pesi nel DB:', error)
            return false
        } finally {
            setIsLoading(false)
        }
    }


    const tabs = [
        { id: 'funnel' as const, label: 'Funnel di selezione', icon: Layers },
        { id: 'ranking' as const, label: 'Qualità del ranking', icon: TrendingUp },
        { id: 'errors' as const, label: 'Diagnosi degli errori', icon: AlertOctagon },
        { id: 'attribution' as const, label: 'Attribuzione dei pesi', icon: Sparkles },
        { id: 'tuning' as const, label: 'Sandbox iperparametri', icon: Sliders },
    ]

    return (
        <div className="min-h-screen bg-black text-white p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto select-none">
            {/* Header: Platform Branding, Breadcrumb & Controls - Completely Borderless */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-6 border-b border-white/[0.08]">
                {/* Brand Identity & Section Title */}
                <div className="flex items-center gap-3.5 flex-wrap">
                    <Link
                        href="/home"
                        className="flex items-center gap-2.5 group"
                        title="Torna a TheHustlePlace"
                    >
                        <div className="h-8 w-8 rounded-lg bg-white text-black font-bold flex items-center justify-center text-sm shadow-sm group-hover:scale-105 transition-transform">
                            H
                        </div>
                        <span className="text-lg font-semibold text-white tracking-tight group-hover:text-zinc-300 transition-colors">
                            TheHustlePlace
                        </span>
                    </Link>

                    <span className="text-zinc-600 font-light">/</span>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-300">
                            Diagnostica ML
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Ranker v1
                        </span>
                        {report.telemetry?.isLiveDatabase && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Live DB ({report.telemetry.totalProfiles} profili, {report.telemetry.totalDevices} device)
                            </span>
                        )}
                    </div>
                </div>

                {/* Right Controls: Persona Selector, Device Badge, Refresh, Exit */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Persona Selector */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-white/10 text-xs text-zinc-300 hover:border-white/20 transition-colors">
                        <User className="w-3.5 h-3.5 text-zinc-400" />
                        <select
                            value={activePersona}
                            onChange={(e) => handlePersonaChange(e.target.value)}
                            aria-label="Seleziona profilo utente"
                            className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer"
                        >
                            {report.personas.map((p) => (
                                <option key={p.id} value={p.id} className="bg-zinc-950 text-white">
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Authenticated Terminal Badge with green status pulse */}
                    <div className="px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-white/10 text-xs font-mono text-zinc-300 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{MASTER_ADMIN_CODE_FORMATTED}</span>
                    </div>

                    {/* Refresh */}
                    <button
                        type="button"
                        onClick={() => fetchUpdatedReport(activePersona)}
                        disabled={isLoading}
                        aria-label="Ricarica metriche"
                        className="p-2 rounded-lg bg-zinc-900/80 border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 active:scale-95 transition-all"
                        title="Ricarica metriche"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>

                    {/* Exit to Home */}
                    <Link
                        href="/home"
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Sito</span>
                    </Link>

                    {/* Logout */}
                    <button
                        type="button"
                        onClick={onLogout}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 active:scale-95 text-xs font-medium flex items-center gap-1.5 transition-all"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Esci</span>
                    </button>
                </div>
            </div>

            {/* Live Database Telemetry Strip */}
            {report.telemetry && (
                <div className="p-4 sm:p-5 rounded-2xl bg-[#11131a] border border-white/[0.08] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-zinc-400 text-[11px] block">Profili registrati</span>
                        <span className="text-xl sm:text-2xl font-mono tabular-nums font-semibold text-white mt-1 block">
                            {report.telemetry.totalProfiles.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-zinc-500 mt-0.5 block">watch_profiles (DB)</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-zinc-400 text-[11px] block">Dispositivi associati</span>
                        <span className="text-xl sm:text-2xl font-mono tabular-nums font-semibold text-white mt-1 block">
                            {report.telemetry.totalDevices.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-zinc-500 mt-0.5 block">watch_devices (DB)</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-zinc-400 text-[11px] block">Sessioni di visione</span>
                        <span className="text-xl sm:text-2xl font-mono tabular-nums font-semibold text-white mt-1 block">
                            {report.telemetry.totalWatchSessions}
                        </span>
                        <span className="text-[10px] text-zinc-500 mt-0.5 block">
                            {report.telemetry.activeProfilesCount} profili attivi
                        </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-zinc-400 text-[11px] block">Completamento (≥90%)</span>
                        <span className="text-xl sm:text-2xl font-mono tabular-nums font-semibold text-emerald-400 mt-1 block">
                            {report.telemetry.completionRate}%
                        </span>
                        <span className="text-[10px] text-zinc-500 mt-0.5 block">
                            {report.telemetry.completedSessions} titoli completati
                        </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-zinc-400 text-[11px] block">Feedback espliciti</span>
                        <span className="text-xl sm:text-2xl font-mono tabular-nums font-semibold text-white mt-1 block">
                            {report.telemetry.totalFeedbacks}
                        </span>
                        <span className="text-[10px] text-emerald-400 mt-0.5 block">
                            {report.telemetry.satisfactionRate}% gradimento
                        </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-zinc-400 text-[11px] block">Abbandoni precoci</span>
                        <span className="text-xl sm:text-2xl font-mono tabular-nums font-semibold text-rose-400 mt-1 block">
                            {report.telemetry.totalWatchSessions > 0
                                ? ((report.telemetry.abandonedSessions / report.telemetry.totalWatchSessions) * 100).toFixed(1)
                                : 0}%
                        </span>
                        <span className="text-[10px] text-zinc-500 mt-0.5 block">
                            {report.telemetry.abandonedSessions} interrotti &lt;15%
                        </span>
                    </div>
                </div>
            )}

            {/* Top KPI Metrics Strip - Open, Breathing, Borderless (No enclosed boxes) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-5 pb-6 border-b border-white/[0.08]">
                <div className="space-y-1">
                    <span className="text-xs text-zinc-400 font-medium block">
                        NDCG@10
                    </span>
                    <span className="text-3xl font-mono tabular-nums font-bold text-emerald-400 block tracking-tight">
                        {report.summary.ndcg10}
                    </span>
                    <span className="text-[11px] text-zinc-500 block">
                        Accuratezza d&apos;ordine
                    </span>
                </div>

                <div className="space-y-1">
                    <span className="text-xs text-zinc-400 font-medium block">
                        Precision@5
                    </span>
                    <span className="text-3xl font-mono tabular-nums font-bold text-emerald-400 block tracking-tight">
                        {(report.summary.precisionAt5 * 100).toFixed(1)}%
                    </span>
                    <span className="text-[11px] text-zinc-500 block">
                        Hit rate prime 5
                    </span>
                </div>

                <div className="space-y-1">
                    <span className="text-xs text-zinc-400 font-medium block">
                        MRR
                    </span>
                    <span className="text-3xl font-mono tabular-nums font-bold text-white block tracking-tight">
                        {report.summary.mrr}
                    </span>
                    <span className="text-[11px] text-zinc-500 block">
                        Primo hit rilevante
                    </span>
                </div>

                <div className="space-y-1">
                    <span className="text-xs text-zinc-400 font-medium block">
                        Diversità ILD
                    </span>
                    <span className="text-3xl font-mono tabular-nums font-bold text-amber-400 block tracking-tight">
                        {report.summary.intraListDiversity}
                    </span>
                    <span className="text-[11px] text-zinc-500 block">
                        Varietà dei generi
                    </span>
                </div>

                <div className="space-y-1">
                    <span className="text-xs text-zinc-400 font-medium block">
                        Indice di Gini
                    </span>
                    <span className="text-3xl font-mono tabular-nums font-bold text-cyan-400 block tracking-tight">
                        {report.summary.catalogGini}
                    </span>
                    <span className="text-[11px] text-zinc-500 block">
                        Copertura catalogo
                    </span>
                </div>

                <div className="space-y-1">
                    <span className="text-xs text-zinc-400 font-medium block">
                        Falsi positivi
                    </span>
                    <span className="text-3xl font-mono tabular-nums font-bold text-rose-400 block tracking-tight">
                        {(report.summary.falsePositiveRate * 100).toFixed(1)}%
                    </span>
                    <span className="text-[11px] text-zinc-500 block">
                        Tasso di scarto
                    </span>
                </div>
            </div>

            {/* Seamless Underline Tab Navigation */}
            <div className="flex items-center gap-6 sm:gap-8 border-b border-white/[0.08] overflow-x-auto [scrollbar-width:none]">
                {tabs.map((t) => {
                    const Icon = t.icon
                    const isActive = activeTab === t.id

                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setActiveTab(t.id)}
                            className={`flex items-center gap-2 py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-[1px] ${
                                isActive
                                    ? 'border-white text-white font-semibold'
                                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{t.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* Tab Contents - Flat, Borderless, Content-First */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-8 pt-2"
                >
                    {activeTab === 'funnel' && (
                        <FunnelChart
                            stages={report.funnel.stages}
                            dropOffs={report.funnel.dropOffs}
                        />
                    )}

                    {activeTab === 'ranking' && (
                        <div className="space-y-10">
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
                        <div className="space-y-10">
                            <ConfusionMatrixCard data={report.confusionMatrix} />
                            <FailureCasesTable cases={report.failureCases} />
                        </div>
                    )}

                    {activeTab === 'attribution' && (
                        <FeatureAttributionWaterfall items={report.attributionSample} />
                    )}

                    {activeTab === 'tuning' && (
                        <div className="space-y-10">
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
