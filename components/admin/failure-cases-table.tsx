'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AlgorithmicFailureCase } from '@/lib/admin-ml-metrics'
import { getContentPosterUrl } from '@/lib/content-display'
import { AlertOctagon, Bug, Wrench, CheckCircle, ArrowRight, Filter } from 'lucide-react'

interface FailureCasesTableProps {
    cases: AlgorithmicFailureCase[]
}

export function FailureCasesTable({ cases }: FailureCasesTableProps) {
    const [filterStage, setFilterStage] = useState<string>('ALL')

    const stages = ['ALL', 'Retrieval', 'Scoring', 'Deduplication']
    const filtered = filterStage === 'ALL' ? cases : cases.filter((c) => c.failureStage === filterStage)

    return (
        <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <AlertOctagon className="w-4 h-4 text-rose-400" />
                        Diagnostica degli Errori per Fase (Algorithmic Failure Analysis)
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5">
                        Individua esattamente in quale fase (Retrieval, Deduplicazione, Scoring) l&apos;algoritmo ha generato una raccomandazione errata.
                    </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
                    {stages.map((st) => (
                        <button
                            key={st}
                            type="button"
                            onClick={() => setFilterStage(st)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                                filterStage === st
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                    : 'bg-white/5 text-white/60 hover:text-white border border-white/5'
                            }`}
                        >
                            {st === 'ALL' ? 'Tutte le fasi' : st}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cases Grid */}
            <div className="space-y-3">
                {filtered.map((item) => (
                    <div
                        key={item.id}
                        className="p-4 rounded-xl bg-zinc-950/80 border border-white/10 hover:border-white/20 transition-all flex flex-col md:flex-row md:items-start justify-between gap-4"
                    >
                        {/* Poster + Info */}
                        <div className="flex items-start gap-3 min-w-0">
                            <div className="relative w-14 h-20 rounded-lg overflow-hidden bg-zinc-900 border border-white/10 shrink-0">
                                <Image
                                    src={getContentPosterUrl(item.posterPath, 'w500')}
                                    alt={item.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>

                            <div className="space-y-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-bold text-white tracking-tight">
                                        {item.title}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-950/60 border border-rose-500/30 text-rose-300">
                                        Fase: {item.failureStage}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-white/5 text-white/60">
                                        {item.failureCategory}
                                    </span>
                                </div>

                                <div className="text-xs text-white/50 flex flex-wrap items-center gap-3 pt-0.5">
                                    <span>
                                        Punteggio Previsto:{' '}
                                        <b className="text-amber-400 font-mono">{item.predictedScore}</b>
                                    </span>
                                    <span>•</span>
                                    <span>
                                        Comportamento Reale:{' '}
                                        <b className="text-rose-400 font-medium">{item.actualFeedback}</b>
                                    </span>
                                </div>

                                <p className="text-xs text-white/70 pt-1 leading-relaxed">
                                    <b className="text-white/90">Diagnosi ML:</b> {item.explanation}
                                </p>
                            </div>
                        </div>

                        {/* Actionable ML Fix */}
                        <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs md:max-w-xs shrink-0 self-stretch flex flex-col justify-between">
                            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
                                <Wrench className="w-3.5 h-3.5" />
                                <span>Soluzione Suggerita:</span>
                            </div>
                            <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                                {item.suggestedWeightFix}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
