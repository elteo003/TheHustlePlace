'use client'

import { FunnelStage, DropOffReason } from '@/lib/admin-ml-metrics'

interface FunnelChartProps {
    stages: FunnelStage[]
    dropOffs: DropOffReason[]
}

const STAGE_BAR_COLORS = [
    'bg-zinc-700 text-zinc-100', // Stage 1: Pool Globale TMDB
    'bg-blue-600 text-white',     // Stage 2: Guardrails & Lingua
    'bg-cyan-500 text-zinc-950',   // Stage 3: Retrieval Multi-Sorgente
    'bg-amber-500 text-zinc-950',  // Stage 4: Deduplicazione & Scoring
    'bg-emerald-400 text-zinc-950',// Stage 5: Slate Finale Top 10
]

export function FunnelChart({ stages, dropOffs }: FunnelChartProps) {
    const maxCount = stages[0]?.count || 1

    return (
        <div className="space-y-10">
            {/* Funnel Pipeline Section - Borderless, Canvas Integrated */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-3 border-b border-white/[0.08]">
                    <div>
                        <h2 className="text-base font-semibold text-white tracking-tight">
                            Funnel di selezione dei candidati
                        </h2>
                        <p className="text-xs text-zinc-400 mt-0.5">
                            Tracciamento della sopravvivenza dei titoli attraverso i 5 stadi della pipeline RecSys
                        </p>
                    </div>
                    <div className="text-xs font-mono text-zinc-400">
                        Conversione complessiva:{' '}
                        <span className="font-semibold text-emerald-400 font-mono text-sm">
                            {((stages[stages.length - 1].count / stages[0].count) * 100).toFixed(2)}%
                        </span>
                    </div>
                </div>

                {/* Funnel Bars with Stage-by-Stage Progression Colors */}
                <div className="space-y-5 pt-1">
                    {stages.map((stage, idx) => {
                        const widthPct = Math.max(14, (stage.count / maxCount) * 100)
                        const dropFromPrev =
                            idx > 0
                                ? (((stages[idx - 1].count - stage.count) / stages[idx - 1].count) * 100).toFixed(1)
                                : null
                        const colorClass = STAGE_BAR_COLORS[idx] || 'bg-zinc-300 text-black'

                        return (
                            <div key={stage.name} className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2.5">
                                        <span className="font-mono text-zinc-500 text-[11px] font-semibold">
                                            0{idx + 1}
                                        </span>
                                        <span className="text-white font-medium text-sm">
                                            {stage.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 font-mono text-xs">
                                        {dropFromPrev && (
                                            <span className="text-rose-400 font-medium">
                                                -{dropFromPrev}%
                                            </span>
                                        )}
                                        <span className="text-white font-semibold tabular-nums text-sm">
                                            {stage.count.toLocaleString()} titoli
                                        </span>
                                    </div>
                                </div>

                                {/* Solid Clean Proportional Bar */}
                                <div className="h-7 w-full bg-white/[0.04] rounded-lg overflow-hidden flex items-center p-0.5">
                                    <div
                                        style={{ width: `${widthPct}%` }}
                                        className={`h-full rounded-md flex items-center px-3 transition-all duration-300 font-mono font-bold text-xs ${colorClass}`}
                                    >
                                        <span>{stage.retainedPct}% pool</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-0.5">
                                    <span>{stage.description}</span>
                                    <span className="text-amber-400/90 font-medium">
                                        Rischio: {stage.errorRisks[0]}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Drop-off Root Causes Section - Open List (No boxed cards) */}
            <div className="space-y-4 pt-4 border-t border-white/[0.08]">
                <div className="pb-2">
                    <h3 className="text-sm font-semibold text-white tracking-tight">
                        Cause di esclusione dei titoli per stadio
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                        Fattori principali responsabili della caduta dei candidati
                    </p>
                </div>

                <div className="divide-y divide-white/[0.05]">
                    {dropOffs.map((d) => (
                        <div
                            key={d.stage}
                            className="py-3.5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 text-xs"
                        >
                            <div className="space-y-1 max-w-2xl">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-white text-sm">{d.stage}</span>
                                    <span className="font-mono text-zinc-400 text-xs">
                                        ({d.count.toLocaleString()} titoli esclusi)
                                    </span>
                                </div>
                                <p className="text-zinc-400 leading-relaxed text-xs">
                                    {d.reason}
                                </p>
                            </div>

                            <div className="sm:text-right shrink-0">
                                <span className="font-mono text-base font-semibold text-rose-400 tabular-nums">
                                    {d.percentage}%
                                </span>
                                <span className="block text-[11px] text-zinc-500">
                                    perdita pool
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
