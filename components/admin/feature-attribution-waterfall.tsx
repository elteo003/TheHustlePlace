'use client'

import { useState } from 'react'
import { FeatureAttributionItem } from '@/lib/admin-ml-metrics'

interface FeatureAttributionWaterfallProps {
    items: FeatureAttributionItem[]
}

export function FeatureAttributionWaterfall({ items }: FeatureAttributionWaterfallProps) {
    const [selectedIdx, setSelectedIdx] = useState(0)
    const current = items[selectedIdx] || items[0]

    const features = [
        { name: 'Affinità di genere (SimTaste)', value: current.breakdown.tasteSim, type: 'positive' as const },
        { name: 'Feedback esplicito (Gradito)', value: current.breakdown.explicit, type: current.breakdown.explicit >= 0 ? 'positive' as const : 'negative' as const },
        { name: 'Freschezza temporale (Newness)', value: current.breakdown.newness, type: 'positive' as const },
        { name: 'Popolarità globale', value: current.breakdown.popularity, type: 'positive' as const },
        { name: 'Grafo delle parole chiave', value: current.breakdown.neighbor, type: 'positive' as const },
        { name: 'Penalità abbandono precoce', value: -current.breakdown.abandonPenalty, type: 'negative' as const },
        { name: 'Penalità titolo già visto (≥90%)', value: -current.breakdown.alreadySeenPenalty, type: 'negative' as const },
        { name: 'Penalità rimozione continua a guardare', value: -current.breakdown.continueNoPenalty, type: 'negative' as const },
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-3 border-b border-white/[0.08]">
                <div>
                    <h2 className="text-base font-semibold text-white tracking-tight">
                        Scomposizione dei pesi per titolo (SHAP Waterfall)
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                        Impatto dei singoli fattori additivi e delle penalità sul punteggio finale del ranker
                    </p>
                </div>

                {/* Title selector pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                    {items.map((it, i) => (
                        <button
                            key={it.id}
                            type="button"
                            onClick={() => setSelectedIdx(i)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                                selectedIdx === i
                                    ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                            }`}
                        >
                            {it.title}
                        </button>
                    ))}
                </div>
            </div>

            {/* Total score row */}
            <div className="py-4 border-b border-white/[0.08] flex items-center justify-between">
                <div>
                    <span className="text-xs text-zinc-400 block">
                        Punteggio finale calcolato per
                    </span>
                    <span className="text-xl font-bold text-white mt-0.5 block tracking-tight">
                        {current.title}
                    </span>
                </div>
                <div className="text-right">
                    <span className="text-xs text-zinc-400 block">Score aggregato</span>
                    <span className={`text-3xl font-mono tabular-nums font-bold ${current.totalScore >= 0.5 ? 'text-emerald-400' : current.totalScore >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {current.totalScore > 0 ? `+${current.totalScore.toFixed(3)}` : current.totalScore.toFixed(3)}
                    </span>
                </div>
            </div>

            {/* Waterfall bars */}
            <div className="space-y-3.5 pt-2">
                {features.map((feat) => {
                    const isZero = feat.value === 0
                    const isPos = feat.value > 0
                    const absVal = Math.abs(feat.value)
                    const widthPct = Math.min(100, (absVal / 0.3) * 100)

                    return (
                        <div key={feat.name} className="flex items-center gap-4 text-xs">
                            <span className="w-64 shrink-0 text-zinc-300 font-medium truncate">
                                {feat.name}
                            </span>

                            <div className="flex-1 h-6 bg-white/[0.04] rounded-md overflow-hidden flex items-center p-0.5">
                                {!isZero && (
                                    <div
                                        style={{ width: `${Math.max(6, widthPct)}%` }}
                                        className={`h-full rounded transition-all duration-300 ${
                                            isPos
                                                ? 'bg-emerald-500'
                                                : 'bg-rose-500'
                                        }`}
                                    />
                                )}
                            </div>

                            <div className="w-20 text-right font-mono font-medium text-xs tabular-nums shrink-0">
                                {isZero ? (
                                    <span className="text-zinc-600">0.000</span>
                                ) : isPos ? (
                                    <span className="text-emerald-400 font-semibold">+{feat.value.toFixed(3)}</span>
                                ) : (
                                    <span className="text-rose-400 font-semibold">{feat.value.toFixed(3)}</span>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
