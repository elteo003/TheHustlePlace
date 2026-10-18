'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AlgorithmicFailureCase } from '@/lib/admin-ml-metrics'
import { getContentPosterUrl } from '@/lib/content-display'

interface FailureCasesTableProps {
    cases: AlgorithmicFailureCase[]
}

export function FailureCasesTable({ cases }: FailureCasesTableProps) {
    const [filterStage, setFilterStage] = useState<string>('ALL')

    const stages = ['ALL', 'Retrieval', 'Scoring', 'Deduplication']
    const filtered = filterStage === 'ALL' ? cases : cases.filter((c) => c.failureStage === filterStage)

    return (
        <div className="space-y-6 pt-6 border-t border-white/[0.08]">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-3 border-b border-white/[0.08]">
                <div>
                    <h2 className="text-base font-semibold text-white tracking-tight">
                        Diagnostica degli errori per stadio della pipeline
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                        Individuazione dello stadio responsabile dello scarto o della raccomandazione fallita
                    </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
                    {stages.map((st) => (
                        <button
                            key={st}
                            type="button"
                            onClick={() => setFilterStage(st)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                                filterStage === st
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                            }`}
                        >
                            {st === 'ALL' ? 'Tutti gli stadi' : st}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cases List - Divided, Borderless */}
            <div className="divide-y divide-white/[0.06]">
                {filtered.map((item) => (
                    <div
                        key={item.id}
                        className="py-5 flex flex-col md:flex-row md:items-start justify-between gap-5"
                    >
                        {/* Poster + Info */}
                        <div className="flex items-start gap-4 min-w-0">
                            <div className="relative w-14 h-20 rounded-lg overflow-hidden bg-zinc-900 border border-white/10 shrink-0 shadow-md">
                                <Image
                                    src={getContentPosterUrl(item.posterPath, 'w500')}
                                    alt={item.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>

                            <div className="space-y-1.5 min-w-0">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <span className="text-base font-semibold text-white tracking-tight">
                                        {item.title}
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                        Stadio: {item.failureStage}
                                    </span>
                                    <span className="text-[11px] text-zinc-400">
                                        {item.failureCategory}
                                    </span>
                                </div>

                                <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-3">
                                    <span>
                                        Punteggio previsto: <strong className="text-amber-400 font-mono font-semibold">{item.predictedScore}</strong>
                                    </span>
                                    <span>•</span>
                                    <span>
                                        Esito reale: <strong className="text-rose-400 font-medium">{item.actualFeedback}</strong>
                                    </span>
                                </div>

                                <p className="text-xs text-zinc-300 leading-relaxed pt-1">
                                    <span className="text-zinc-400 font-medium">Diagnosi:</span> {item.explanation}
                                </p>
                            </div>
                        </div>

                        {/* Actionable ML Fix */}
                        <div className="md:w-80 shrink-0 p-3.5 rounded-xl bg-zinc-900/60 border border-white/10 text-xs space-y-1">
                            <span className="text-[11px] font-medium text-amber-400 block">
                                Azione correttiva consigliata
                            </span>
                            <p className="text-zinc-300 text-xs leading-relaxed">
                                {item.suggestedWeightFix}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
