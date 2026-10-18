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
        <div className="bg-[#11131a] border border-white/[0.08] rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-white/[0.06] pb-4">
                <div>
                    <h2 className="text-base font-semibold text-white">
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
                                    ? 'bg-white text-zinc-950 font-semibold'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                            }`}
                        >
                            {st === 'ALL' ? 'Tutti gli stadi' : st}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cases List */}
            <div className="space-y-3">
                {filtered.map((item) => (
                    <div
                        key={item.id}
                        className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-all flex flex-col md:flex-row md:items-start justify-between gap-4"
                    >
                        {/* Poster + Info */}
                        <div className="flex items-start gap-3.5 min-w-0">
                            <div className="relative w-12 h-18 rounded-lg overflow-hidden bg-zinc-900 border border-white/[0.08] shrink-0">
                                <Image
                                    src={getContentPosterUrl(item.posterPath, 'w500')}
                                    alt={item.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>

                            <div className="space-y-1.5 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-semibold text-white tracking-tight">
                                        {item.title}
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-white/[0.06] text-zinc-300">
                                        Stadio: {item.failureStage}
                                    </span>
                                    <span className="text-[11px] text-zinc-400">
                                        {item.failureCategory}
                                    </span>
                                </div>

                                <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-3">
                                    <span>
                                        Punteggio previsto: <strong className="text-zinc-200 font-mono font-normal">{item.predictedScore}</strong>
                                    </span>
                                    <span>•</span>
                                    <span>
                                        Esito reale: <strong className="text-zinc-200 font-normal">{item.actualFeedback}</strong>
                                    </span>
                                </div>

                                <p className="text-xs text-zinc-400 leading-relaxed pt-0.5">
                                    <span className="text-zinc-300 font-medium">Diagnosi:</span> {item.explanation}
                                </p>
                            </div>
                        </div>

                        {/* Actionable ML Fix */}
                        <div className="md:w-72 shrink-0 p-3 rounded-lg bg-white/[0.03] border border-white/[0.05] text-xs space-y-1">
                            <span className="text-[11px] font-medium text-zinc-300 block">
                                Azione correttiva consigliata
                            </span>
                            <p className="text-zinc-400 text-[11px] leading-relaxed">
                                {item.suggestedWeightFix}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
