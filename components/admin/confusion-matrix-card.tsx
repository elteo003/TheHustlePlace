'use client'

import { useState } from 'react'
import { ConfusionMatrixData } from '@/lib/admin-ml-metrics'
import { CheckCircle2, XCircle, AlertCircle, HelpCircle, ShieldCheck } from 'lucide-react'

interface ConfusionMatrixCardProps {
    data: ConfusionMatrixData
}

export function ConfusionMatrixCard({ data }: ConfusionMatrixCardProps) {
    const [selectedQuadrant, setSelectedQuadrant] = useState<'tp' | 'fp' | 'fn' | 'tn' | null>(null)

    const total = data.tp + data.fp + data.fn + data.tn

    return (
        <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-5">
            <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    RecSys Confusion Matrix & Classification Metrics
                </h3>
                <p className="text-xs text-white/50 mt-0.5">
                    Valuta quanti titoli raccomandati nei primi 10 posti hanno incontrato il gradimento reale dell&apos;utente e quanti sono stati rigettati.
                </p>
            </div>

            {/* Matrix 2x2 Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* 2x2 Matrix */}
                <div className="lg:col-span-7">
                    <div className="grid grid-cols-2 gap-3 text-center">
                        {/* Top-Left: True Positive (Hit) */}
                        <div
                            onClick={() => setSelectedQuadrant(selectedQuadrant === 'tp' ? null : 'tp')}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                selectedQuadrant === 'tp'
                                    ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400'
                                    : 'bg-emerald-950/30 border-emerald-500/30 hover:border-emerald-500/60'
                            }`}
                        >
                            <div className="flex items-center justify-between text-emerald-400 text-xs mb-1 font-semibold">
                                <span>True Positive (Hit)</span>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                            <div className="text-2xl sm:text-3xl font-mono font-black text-white">
                                {data.tp}
                            </div>
                            <div className="text-[11px] text-emerald-300/80 mt-1">
                                {((data.tp / total) * 100).toFixed(1)}% del campione
                            </div>
                            <p className="text-[10px] text-white/40 mt-1.5 leading-tight">
                                Raccomandato in Top 10 e l&apos;utente lo ha amato (Entusiasta / Molto)
                            </p>
                        </div>

                        {/* Top-Right: False Positive (Over-recommendation) */}
                        <div
                            onClick={() => setSelectedQuadrant(selectedQuadrant === 'fp' ? null : 'fp')}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                selectedQuadrant === 'fp'
                                    ? 'bg-red-500/20 border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)] ring-1 ring-red-400'
                                    : 'bg-red-950/30 border-red-500/30 hover:border-red-500/60'
                            }`}
                        >
                            <div className="flex items-center justify-between text-red-400 text-xs mb-1 font-semibold">
                                <span>False Positive (Errore)</span>
                                <XCircle className="w-3.5 h-3.5" />
                            </div>
                            <div className="text-2xl sm:text-3xl font-mono font-black text-white">
                                {data.fp}
                            </div>
                            <div className="text-[11px] text-red-300/80 mt-1">
                                {((data.fp / total) * 100).toFixed(1)}% del campione
                            </div>
                            <p className="text-[10px] text-white/40 mt-1.5 leading-tight">
                                Raccomandato in Top 10 ma l&apos;utente lo ha skippato o abbandonato
                            </p>
                        </div>

                        {/* Bottom-Left: False Negative (Missed opportunity) */}
                        <div
                            onClick={() => setSelectedQuadrant(selectedQuadrant === 'fn' ? null : 'fn')}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                selectedQuadrant === 'fn'
                                    ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)] ring-1 ring-amber-400'
                                    : 'bg-amber-950/30 border-amber-500/30 hover:border-amber-500/60'
                            }`}
                        >
                            <div className="flex items-center justify-between text-amber-400 text-xs mb-1 font-semibold">
                                <span>False Negative (Perso)</span>
                                <AlertCircle className="w-3.5 h-3.5" />
                            </div>
                            <div className="text-2xl sm:text-3xl font-mono font-black text-white">
                                {data.fn}
                            </div>
                            <div className="text-[11px] text-amber-300/80 mt-1">
                                {((data.fn / total) * 100).toFixed(1)}% del campione
                            </div>
                            <p className="text-[10px] text-white/40 mt-1.5 leading-tight">
                                Non raccomandato, ma l&apos;utente lo ha cercato e apprezzato
                            </p>
                        </div>

                        {/* Bottom-Right: True Negative (Correctly filtered) */}
                        <div
                            onClick={() => setSelectedQuadrant(selectedQuadrant === 'tn' ? null : 'tn')}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                selectedQuadrant === 'tn'
                                    ? 'bg-zinc-800 border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.15)] ring-1 ring-white/40'
                                    : 'bg-zinc-950/60 border-white/10 hover:border-white/20'
                            }`}
                        >
                            <div className="flex items-center justify-between text-white/60 text-xs mb-1 font-semibold">
                                <span>True Negative (Scartato)</span>
                                <CheckCircle2 className="w-3.5 h-3.5 text-white/40" />
                            </div>
                            <div className="text-2xl sm:text-3xl font-mono font-black text-white">
                                {data.tn}
                            </div>
                            <div className="text-[11px] text-white/50 mt-1">
                                {((data.tn / total) * 100).toFixed(1)}% del campione
                            </div>
                            <p className="text-[10px] text-white/40 mt-1.5 leading-tight">
                                Correttamente escluso perché non gradito o irrilevante
                            </p>
                        </div>
                    </div>
                </div>

                {/* Derived ML Rates */}
                <div className="lg:col-span-5 flex flex-col justify-between p-4 rounded-xl bg-zinc-950/70 border border-white/5 space-y-3">
                    <h4 className="text-xs font-bold text-white/80 uppercase tracking-wider">
                        Metriche Derivate di Valutazione
                    </h4>

                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-white/60">Precision (PPV)</span>
                            <span className="font-mono font-bold text-emerald-400">
                                {(data.precision * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                                style={{ width: `${data.precision * 100}%` }}
                                className="h-full bg-emerald-400 rounded-full"
                            />
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                            <span className="text-white/60">Recall (Sensitivity)</span>
                            <span className="font-mono font-bold text-cyan-400">
                                {(data.recall * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                                style={{ width: `${data.recall * 100}%` }}
                                className="h-full bg-cyan-400 rounded-full"
                            />
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                            <span className="text-white/60">False Positive Rate (FPR)</span>
                            <span className="font-mono font-bold text-red-400">
                                {(data.fpr * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                                style={{ width: `${data.fpr * 100}%` }}
                                className="h-full bg-red-400 rounded-full"
                            />
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                            <span className="text-white/60">F1-Score Combinato</span>
                            <span className="font-mono font-bold text-purple-400">
                                {data.f1}
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                                style={{ width: `${data.f1 * 100}%` }}
                                className="h-full bg-purple-400 rounded-full"
                            />
                        </div>
                    </div>

                    <div className="pt-2 border-t border-white/5 text-[11px] text-white/40">
                        {selectedQuadrant === 'fp' ? (
                            <p className="text-red-300">
                                💡 Focus FP: I falsi positivi causano frustrazione all&apos;utente. Riduci il peso della popolarità w_popularity.
                            </p>
                        ) : selectedQuadrant === 'fn' ? (
                            <p className="text-amber-300">
                                💡 Focus FN: I falsi negativi indicano che il candidate retrieval è troppo conservativo. Rilassa i filtri TMDB.
                            </p>
                        ) : (
                            <p>Clicca sui riquadri per analizzare i singoli segmenti del dataset.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
