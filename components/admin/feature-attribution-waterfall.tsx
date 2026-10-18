'use client'

import { useState } from 'react'
import { FeatureAttributionItem } from '@/lib/admin-ml-metrics'
import { Layers, Sparkles, TrendingDown, TrendingUp, Info } from 'lucide-react'

interface FeatureAttributionWaterfallProps {
    items: FeatureAttributionItem[]
}

export function FeatureAttributionWaterfall({ items }: FeatureAttributionWaterfallProps) {
    const [selectedIdx, setSelectedIdx] = useState(0)
    const current = items[selectedIdx] || items[0]

    const features = [
        { name: 'Affinità Gusto (SimTaste)', value: current.breakdown.tasteSim, type: 'positive' as const },
        { name: 'Feedback Esplicito (Loved)', value: current.breakdown.explicit, type: current.breakdown.explicit >= 0 ? 'positive' as const : 'negative' as const },
        { name: 'Freschezza Temporale (Newness)', value: current.breakdown.newness, type: 'positive' as const },
        { name: 'Popolarità Normalizzata', value: current.breakdown.popularity, type: 'positive' as const },
        { name: 'Keyword Neighbor Boost', value: current.breakdown.neighbor, type: 'positive' as const },
        { name: 'Penalità Abbandono Recente', value: -current.breakdown.abandonPenalty, type: 'negative' as const },
        { name: 'Penalità Già Visto (≥90%)', value: -current.breakdown.alreadySeenPenalty, type: 'negative' as const },
        { name: 'Penalità Continua = No', value: -current.breakdown.continueNoPenalty, type: 'negative' as const },
    ]

    return (
        <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        Feature Attribution & Scomposizione Punteggio (SHAP Waterfall)
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5">
                        Mostra esattamente quale percentuale del punteggio finale di ogni raccomandazione proviene da ciascun fattore ML.
                    </p>
                </div>

                {/* Title selector dropdown / pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
                    {items.map((it, i) => (
                        <button
                            key={it.id}
                            type="button"
                            onClick={() => setSelectedIdx(i)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                                selectedIdx === i
                                    ? 'bg-white text-black shadow-md shadow-white/10'
                                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            {it.title}
                        </button>
                    ))}
                </div>
            </div>

            {/* Total score banner */}
            <div className="p-4 rounded-xl bg-zinc-950/80 border border-white/5 flex items-center justify-between">
                <div>
                    <span className="text-xs text-white/50 uppercase tracking-wider block font-semibold">
                        Punteggio Finale Calcolato (Ranker V1)
                    </span>
                    <span className="text-lg font-bold text-white mt-0.5 block">
                        {current.title}
                    </span>
                </div>
                <div className="text-right">
                    <span className="text-xs text-white/40 block">Total Score</span>
                    <span className={`text-2xl font-mono font-black ${current.totalScore >= 0.5 ? 'text-emerald-400' : current.totalScore >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                        {current.totalScore > 0 ? `+${current.totalScore.toFixed(3)}` : current.totalScore.toFixed(3)}
                    </span>
                </div>
            </div>

            {/* Waterfall bars */}
            <div className="space-y-3">
                {features.map((feat) => {
                    const isZero = feat.value === 0
                    const isPos = feat.value > 0
                    const absVal = Math.abs(feat.value)
                    const widthPct = Math.min(100, (absVal / 0.3) * 100)

                    return (
                        <div key={feat.name} className="flex items-center gap-3 text-xs">
                            <span className="w-56 shrink-0 text-white/70 font-medium truncate">
                                {feat.name}
                            </span>

                            <div className="flex-1 h-6 bg-white/5 rounded-lg overflow-hidden flex items-center relative px-2">
                                {!isZero && (
                                    <div
                                        style={{ width: `${Math.max(8, widthPct)}%` }}
                                        className={`h-4 rounded-md transition-all duration-300 flex items-center px-1.5 ${
                                            isPos
                                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                                                : 'bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                                        }`}
                                    />
                                )}
                            </div>

                            <span className={`w-16 text-right font-mono font-bold shrink-0 ${
                                isZero ? 'text-white/30' : isPos ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                                {isPos ? `+${feat.value.toFixed(3)}` : feat.value.toFixed(3)}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
