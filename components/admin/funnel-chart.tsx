'use client'

import { FunnelStage, DropOffReason } from '@/lib/admin-ml-metrics'
import { AlertTriangle, Filter, Layers, ArrowDown, Info } from 'lucide-react'

interface FunnelChartProps {
    stages: FunnelStage[]
    dropOffs: DropOffReason[]
}

export function FunnelChart({ stages, dropOffs }: FunnelChartProps) {
    const maxCount = stages[0]?.count || 1

    return (
        <div className="space-y-6">
            {/* Top overview card */}
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <Layers className="w-4 h-4 text-cyan-400" />
                            Multi-Stage Recommendation Funnel
                        </h3>
                        <p className="text-xs text-white/50 mt-0.5">
                            Visualizza il tasso di conservazione e caduta dei titoli attraverso i 5 stadi del motore di raccomandazione.
                        </p>
                    </div>
                    <span className="text-xs font-mono bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 px-2.5 py-1 rounded-full font-semibold">
                        Overall Conversion: {( (stages[stages.length - 1].count / stages[0].count) * 100 ).toFixed(2)}%
                    </span>
                </div>

                {/* Funnel Bars */}
                <div className="space-y-3 pt-2">
                    {stages.map((stage, idx) => {
                        const widthPct = Math.max(14, (stage.count / maxCount) * 100)
                        const dropFromPrev =
                            idx > 0
                                ? (( (stages[idx - 1].count - stage.count) / stages[idx - 1].count ) * 100).toFixed(1)
                                : null

                        return (
                            <div key={stage.name} className="group relative">
                                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                                    <div className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/80">
                                            {idx + 1}
                                        </span>
                                        <span className="text-white font-semibold">{stage.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {dropFromPrev && (
                                            <span className="text-[11px] text-red-400 font-mono">
                                                -{dropFromPrev}% drop
                                            </span>
                                        )}
                                        <span className="font-mono font-bold text-white">
                                            {stage.count.toLocaleString()} titoli
                                        </span>
                                    </div>
                                </div>

                                {/* Bar */}
                                <div className="h-8 w-full bg-white/5 rounded-xl overflow-hidden p-0.5 relative">
                                    <div
                                        style={{ width: `${widthPct}%` }}
                                        className={`h-full rounded-lg transition-all duration-500 relative flex items-center px-3 ${
                                            idx === 0
                                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                                                : idx === 1
                                                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600'
                                                : idx === 2
                                                ? 'bg-gradient-to-r from-cyan-600 to-emerald-600'
                                                : idx === 3
                                                ? 'bg-gradient-to-r from-emerald-600 to-amber-600'
                                                : 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                                        }`}
                                    >
                                        <span className="text-[11px] font-bold text-white drop-shadow font-mono">
                                            {stage.retainedPct}% pool
                                        </span>
                                    </div>
                                </div>

                                {/* Detail Tooltip/Caption on hover */}
                                <div className="mt-1 flex items-center justify-between text-[11px] text-white/40">
                                    <span>{stage.description}</span>
                                    <div className="flex items-center gap-1.5 text-amber-300/80">
                                        <AlertTriangle className="w-3 h-3" />
                                        <span>Rischio: {stage.errorRisks[0]}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Drop-off Root Causes Breakdown */}
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <Filter className="w-4 h-4 text-amber-400" />
                            Cause Principali di Scarto Candidati (Drop-off Taxonomy)
                        </h3>
                        <p className="text-xs text-white/50 mt-0.5">
                            Dove l&apos;algoritmo elimina i titoli prima che raggiungano lo schermo dell&apos;utente.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {dropOffs.map((drop) => (
                        <div
                            key={drop.reason}
                            className="p-3.5 rounded-xl bg-zinc-950/80 border border-white/5 hover:border-white/15 transition-all"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-semibold text-white/90 leading-snug">
                                    {drop.reason}
                                </span>
                                <span className="text-xs font-mono font-bold text-amber-400 shrink-0">
                                    {drop.percentage}%
                                </span>
                            </div>

                            <div className="mt-2.5 flex items-center justify-between text-[10px] text-white/40 pt-2 border-t border-white/5">
                                <span className="px-1.5 py-0.5 rounded bg-white/5 text-white/60">
                                    Stadio: {drop.stage}
                                </span>
                                <span className="text-emerald-400/90 font-medium">
                                    Mitigazione: {drop.mitigation}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
