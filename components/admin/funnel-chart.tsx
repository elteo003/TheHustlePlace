'use client'

import { FunnelStage, DropOffReason } from '@/lib/admin-ml-metrics'

interface FunnelChartProps {
    stages: FunnelStage[]
    dropOffs: DropOffReason[]
}

export function FunnelChart({ stages, dropOffs }: FunnelChartProps) {
    const maxCount = stages[0]?.count || 1

    return (
        <div className="space-y-6">
            {/* Top overview card */}
            <div className="bg-[#11131a] border border-white/[0.08] rounded-2xl p-5 sm:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-white/[0.06] pb-4">
                    <div>
                        <h2 className="text-base font-semibold text-white">
                            Funnel di selezione dei candidati
                        </h2>
                        <p className="text-xs text-zinc-400 mt-0.5">
                            Tracciamento della sopravvivenza dei titoli attraverso i 5 stadi della pipeline
                        </p>
                    </div>
                    <div className="text-xs font-mono text-zinc-300">
                        Conversione totale: <span className="font-semibold text-white">{((stages[stages.length - 1].count / stages[0].count) * 100).toFixed(2)}%</span>
                    </div>
                </div>

                {/* Funnel Bars */}
                <div className="space-y-4">
                    {stages.map((stage, idx) => {
                        const widthPct = Math.max(14, (stage.count / maxCount) * 100)
                        const dropFromPrev =
                            idx > 0
                                ? (((stages[idx - 1].count - stage.count) / stages[idx - 1].count) * 100).toFixed(1)
                                : null

                        return (
                            <div key={stage.name} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-zinc-500 font-medium">
                                            0{idx + 1}
                                        </span>
                                        <span className="text-white font-medium">{stage.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3 font-mono text-xs">
                                        {dropFromPrev && (
                                            <span className="text-zinc-500">
                                                -{dropFromPrev}%
                                            </span>
                                        )}
                                        <span className="text-white font-semibold tabular-nums">
                                            {stage.count.toLocaleString()} titoli
                                        </span>
                                    </div>
                                </div>

                                {/* Clean Solid Bar with systematic tone */}
                                <div className="h-6 w-full bg-white/[0.04] rounded-lg overflow-hidden flex items-center p-0.5">
                                    <div
                                        style={{ width: `${widthPct}%` }}
                                        className="h-full rounded-md bg-zinc-200 text-zinc-950 flex items-center px-2.5 transition-all duration-300"
                                    >
                                        <span className="text-[11px] font-mono font-bold">
                                            {stage.retainedPct}%
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-0.5">
                                    <span>{stage.description}</span>
                                    <span className="text-zinc-500">
                                        Rischio: {stage.errorRisks[0]}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Drop-off Root Causes Breakdown */}
            <div className="bg-[#11131a] border border-white/[0.08] rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="border-b border-white/[0.06] pb-3">
                    <h3 className="text-sm font-semibold text-white">
                        Cause di esclusione dei titoli
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                        Distribuzione degli scarti e diagnosi algoritmica
                    </p>
                </div>

                <div className="space-y-3">
                    {dropOffs.map((d) => (
                        <div
                            key={d.stage}
                            className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-white">{d.stage}</span>
                                    <span className="font-mono text-zinc-500">
                                        ({d.count.toLocaleString()} esclusi)
                                    </span>
                                </div>
                                <p className="text-zinc-400 leading-relaxed">
                                    {d.reason}
                                </p>
                            </div>

                            <div className="text-right shrink-0">
                                <span className="font-mono text-sm font-semibold text-zinc-200">
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
