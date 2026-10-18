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
        <div className="bg-[#11131a] border border-white/[0.08] rounded-2xl p-5 sm:p-6 space-y-6">
            <div className="border-b border-white/[0.06] pb-4">
                <h2 className="text-base font-semibold text-white">
                    Matrice di confusione del motore di raccomandazione
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                    Verifica delle predizioni rispetto ai feedback reali (click, abbandoni o valutazioni positive)
                </p>
            </div>

            {/* Matrix 2x2 Grid + Details */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* 2x2 Matrix */}
                <div className="lg:col-span-7">
                    <div className="grid grid-cols-2 gap-3 text-left">
                        {/* Top-Left: True Positive (Hit) */}
                        <div
                            onClick={() => setSelectedQuadrant(selectedQuadrant === 'tp' ? null : 'tp')}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                selectedQuadrant === 'tp'
                                    ? 'bg-white/[0.08] border-white/40 ring-1 ring-white/20'
                                    : 'bg-white/[0.03] border-white/[0.06] hover:border-white/20'
                            }`}
                        >
                            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                                <span>Veri positivi (Hit)</span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-mono tabular-nums font-semibold text-white mt-1">
                                {data.tp}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-1">
                                {((data.tp / total) * 100).toFixed(1)}% del campione
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                                Raccomandato in Top 10 e gradito dall&apos;utente.
                            </p>
                        </div>

                        {/* Top-Right: False Positive (Over-recommendation) */}
                        <div
                            onClick={() => setSelectedQuadrant(selectedQuadrant === 'fp' ? null : 'fp')}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                selectedQuadrant === 'fp'
                                    ? 'bg-rose-500/[0.12] border-rose-400/40 ring-1 ring-rose-400/20'
                                    : 'bg-white/[0.03] border-white/[0.06] hover:border-white/20'
                            }`}
                        >
                            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                                <span>Falsi positivi (Scarti)</span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-mono tabular-nums font-semibold text-rose-300 mt-1">
                                {data.fp}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-1">
                                {((data.fp / total) * 100).toFixed(1)}% del campione
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                                Raccomandato ma ignorato o abbandonato.
                            </p>
                        </div>

                        {/* Bottom-Left: False Negative (Missed opportunity) */}
                        <div
                            onClick={() => setSelectedQuadrant(selectedQuadrant === 'fn' ? null : 'fn')}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                selectedQuadrant === 'fn'
                                    ? 'bg-white/[0.08] border-white/40 ring-1 ring-white/20'
                                    : 'bg-white/[0.03] border-white/[0.06] hover:border-white/20'
                            }`}
                        >
                            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                                <span>Falsi negativi (Persi)</span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-mono tabular-nums font-semibold text-zinc-300 mt-1">
                                {data.fn}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-1">
                                {((data.fn / total) * 100).toFixed(1)}% del campione
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                                Titolo amato ma escluso dalla Top 10.
                            </p>
                        </div>

                        {/* Bottom-Right: True Negative (Correctly filtered) */}
                        <div
                            onClick={() => setSelectedQuadrant(selectedQuadrant === 'tn' ? null : 'tn')}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                selectedQuadrant === 'tn'
                                    ? 'bg-white/[0.08] border-white/40 ring-1 ring-white/20'
                                    : 'bg-white/[0.03] border-white/[0.06] hover:border-white/20'
                            }`}
                        >
                            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                                <span>Veri negativi (Filtrati)</span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-mono tabular-nums font-semibold text-zinc-400 mt-1">
                                {data.tn}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-1">
                                {((data.tn / total) * 100).toFixed(1)}% del campione
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                                Titolo irrilevante correttamente escluso.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Derived Metrics Summary */}
                <div className="lg:col-span-5 p-4 sm:p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-4">
                    <h3 className="text-xs font-semibold text-zinc-300">
                        Metriche di classificazione derivate
                    </h3>

                    <div className="space-y-3 font-mono text-xs">
                        <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                            <span className="text-zinc-400">Precisione (TP / TP+FP)</span>
                            <span className="text-white font-semibold tabular-nums">
                                {(data.precision * 100).toFixed(1)}%
                            </span>
                        </div>

                        <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                            <span className="text-zinc-400">Richiamo / Recall (TP / TP+FN)</span>
                            <span className="text-white font-semibold tabular-nums">
                                {(data.recall * 100).toFixed(1)}%
                            </span>
                        </div>

                        <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                            <span className="text-zinc-400">Specificità (TN / TN+FP)</span>
                            <span className="text-white font-semibold tabular-nums">
                                {(data.specificity * 100).toFixed(1)}%
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-zinc-400">F1-Score bilanciato</span>
                            <span className="text-white font-semibold tabular-nums">
                                {data.f1}
                            </span>
                        </div>
                    </div>

                    <div className="pt-2 text-[11px] text-zinc-500 leading-relaxed">
                        Un tasso di falsi positivi inferiore al 20% garantisce un feed pulito senza rumore di titoli irrilevanti.
                    </div>
                </div>
            </div>
        </div>
    )
}
