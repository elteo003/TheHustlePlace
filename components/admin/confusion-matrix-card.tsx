'use client'

import { useState } from 'react'
import { ConfusionMatrixData } from '@/lib/admin-ml-metrics'

interface ConfusionMatrixCardProps {
    data: ConfusionMatrixData
}

export function ConfusionMatrixCard({ data }: ConfusionMatrixCardProps) {
    const [selectedQuadrant, setSelectedQuadrant] = useState<'tp' | 'fp' | 'fn' | 'tn' | null>(null)

    const total = data.tp + data.fp + data.fn + data.tn

    return (
        <div className="space-y-6">
            <div className="border-b border-white/[0.08] pb-3">
                <h2 className="text-base font-semibold text-white tracking-tight">
                    Matrice di confusione delle raccomandazioni
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                    Verifica delle predizioni rispetto ai feedback reali (click, abbandoni o valutazioni positive)
                </p>
            </div>

            {/* Matrix 2x2 Grid + Derived Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* 2x2 Matrix */}
                <div className="lg:col-span-7">
                    <div className="grid grid-cols-2 gap-3 text-left">
                        {/* Top-Left: True Positive (Hit) - Emerald Accent */}
                        <div
                            onClick={() => setSelectedQuadrant(selectedQuadrant === 'tp' ? null : 'tp')}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                selectedQuadrant === 'tp'
                                    ? 'bg-emerald-500/20 border-emerald-400 ring-1 ring-emerald-400'
                                    : 'bg-emerald-500/10 border-emerald-500/25 hover:border-emerald-500/50'
                            }`}
                        >
                            <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
                                <span>Veri positivi (Hit)</span>
                            </div>
                            <div className="text-3xl font-mono tabular-nums font-bold text-emerald-300 mt-1">
                                {data.tp}
                            </div>
                            <div className="text-[11px] text-emerald-400/80 mt-1">
                                {((data.tp / total) * 100).toFixed(1)}% del campione
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                                Raccomandato in Top 10 e gradito dall&apos;utente.
                            </p>
                        </div>

                        {/* Top-Right: False Positive (Over-recommendation) - Cinema Rose/Red Accent */}
                        <div
                            onClick={() => setSelectedQuadrant(selectedQuadrant === 'fp' ? null : 'fp')}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                selectedQuadrant === 'fp'
                                    ? 'bg-rose-500/25 border-rose-400 ring-1 ring-rose-400'
                                    : 'bg-rose-500/10 border-rose-500/25 hover:border-rose-500/50'
                            }`}
                        >
                            <div className="flex items-center justify-between text-xs text-rose-400 font-medium">
                                <span>Falsi positivi (Scarti)</span>
                            </div>
                            <div className="text-3xl font-mono tabular-nums font-bold text-rose-300 mt-1">
                                {data.fp}
                            </div>
                            <div className="text-[11px] text-rose-400/80 mt-1">
                                {((data.fp / total) * 100).toFixed(1)}% del campione
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                                Raccomandato ma ignorato o abbandonato.
                            </p>
                        </div>

                        {/* Bottom-Left: False Negative (Missed opportunity) - Warm Amber Accent */}
                        <div
                            onClick={() => setSelectedQuadrant(selectedQuadrant === 'fn' ? null : 'fn')}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                selectedQuadrant === 'fn'
                                    ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400'
                                    : 'bg-amber-500/10 border-amber-500/25 hover:border-amber-500/50'
                            }`}
                        >
                            <div className="flex items-center justify-between text-xs text-amber-400 font-medium">
                                <span>Falsi negativi (Persi)</span>
                            </div>
                            <div className="text-3xl font-mono tabular-nums font-bold text-amber-300 mt-1">
                                {data.fn}
                            </div>
                            <div className="text-[11px] text-amber-400/80 mt-1">
                                {((data.fn / total) * 100).toFixed(1)}% del campione
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                                Titolo amato ma escluso dalla Top 10.
                            </p>
                        </div>

                        {/* Bottom-Right: True Negative (Correctly filtered) - Slate/Zinc */}
                        <div
                            onClick={() => setSelectedQuadrant(selectedQuadrant === 'tn' ? null : 'tn')}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                selectedQuadrant === 'tn'
                                    ? 'bg-white/10 border-white/40 ring-1 ring-white/20'
                                    : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                            }`}
                        >
                            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                                <span>Veri negativi (Filtrati)</span>
                            </div>
                            <div className="text-3xl font-mono tabular-nums font-bold text-zinc-300 mt-1">
                                {data.tn}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-1">
                                {((data.tn / total) * 100).toFixed(1)}% del campione
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                                Titolo irrilevante correttamente escluso.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Derived Metrics Summary */}
                <div className="lg:col-span-5 space-y-4">
                    <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                        Metriche di classificazione
                    </h3>

                    <div className="space-y-3 font-mono text-xs">
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                            <span className="text-zinc-400 font-sans">Precisione (TP / TP+FP)</span>
                            <span className="text-emerald-400 font-semibold tabular-nums text-sm">
                                {(data.precision * 100).toFixed(1)}%
                            </span>
                        </div>

                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                            <span className="text-zinc-400 font-sans">Richiamo / Recall (TP / TP+FN)</span>
                            <span className="text-cyan-400 font-semibold tabular-nums text-sm">
                                {(data.recall * 100).toFixed(1)}%
                            </span>
                        </div>

                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                            <span className="text-zinc-400 font-sans">Specificità (TN / TN+FP)</span>
                            <span className="text-white font-semibold tabular-nums text-sm">
                                {(data.specificity * 100).toFixed(1)}%
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-zinc-400 font-sans">F1-Score bilanciato</span>
                            <span className="text-amber-400 font-semibold tabular-nums text-sm">
                                {data.f1}
                            </span>
                        </div>
                    </div>

                    <div className="pt-1 text-[11px] text-zinc-500 leading-relaxed font-sans">
                        Un tasso di falsi positivi inferiore al 25% garantisce un feed pulito senza rumore di titoli irrilevanti.
                    </div>
                </div>
            </div>
        </div>
    )
}
