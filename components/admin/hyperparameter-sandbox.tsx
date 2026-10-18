'use client'

import { useState } from 'react'
import { RankerWeights, RANKER_WEIGHTS_V1 } from '@/lib/taste-ranker'
import { Sliders, RotateCcw, Play, CheckCircle2, Sparkles } from 'lucide-react'

interface HyperparameterSandboxProps {
    weights: RankerWeights
    onApplyWeights: (weights: RankerWeights) => void
}

export function HyperparameterSandbox({ weights, onApplyWeights }: HyperparameterSandboxProps) {
    const [local, setLocal] = useState<RankerWeights>(weights)
    const [isModified, setIsModified] = useState(false)

    const handleChange = (key: keyof RankerWeights, val: number) => {
        const next = { ...local, [key]: Number(val.toFixed(2)) }
        setLocal(next)
        setIsModified(true)
    }

    const handleReset = () => {
        setLocal(RANKER_WEIGHTS_V1)
        onApplyWeights(RANKER_WEIGHTS_V1)
        setIsModified(false)
    }

    const handleSimulate = () => {
        onApplyWeights(local)
        setIsModified(false)
    }

    const sliders = [
        {
            key: 'simTaste' as const,
            label: 'w_simTaste (Affinità Gusti Personale)',
            desc: 'Peso della similarità vettoriale tra i generi visti dall’utente e i candidati.',
            min: 0.05,
            max: 0.6,
            step: 0.01,
        },
        {
            key: 'explicit' as const,
            label: 'w_explicit (Feedback Esplicito)',
            desc: 'Boost per i titoli valutati "Entusiasta/Molto" e penalità per "Non mi interessa/Dislike".',
            min: 0.1,
            max: 0.6,
            step: 0.01,
        },
        {
            key: 'popularity' as const,
            label: 'w_popularity (Popolarità Globale TMDB)',
            desc: 'Rischio Popularity Bias: se troppo alto soffoca i titoli di nicchia d’autore.',
            min: 0.01,
            max: 0.3,
            step: 0.01,
        },
        {
            key: 'newness' as const,
            label: 'w_newness (Freschezza & Recency)',
            desc: 'Incentiva le uscite del mese corrente rispetto a titoli più datati.',
            min: 0.02,
            max: 0.3,
            step: 0.01,
        },
        {
            key: 'neighbor' as const,
            label: 'w_neighbor (Keyword Neighbor Graph)',
            desc: 'Propagazione della preferenza sui film con le stesse parole chiave/tematiche.',
            min: 0.02,
            max: 0.3,
            step: 0.01,
        },
        {
            key: 'abandon' as const,
            label: 'w_abandon (Penalità Abbandono Precoce)',
            desc: 'Penalità inflitta ai titoli iniziati ma interrotti dopo pochi minuti.',
            min: 0.01,
            max: 0.3,
            step: 0.01,
        },
    ]

    return (
        <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-cyan-400" />
                        Hyperparameter Sandbox & Ranker Tuning (Live Simulation)
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5">
                        Regola i pesi dei singoli obiettivi del Ranker V1 per ricalcolare istantaneamente le curve di NDCG e il tasso di errore.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="btn-ghost-outline h-8 px-3 text-xs flex items-center gap-1.5 rounded-lg border border-white/10 text-white/70 hover:text-white"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Ripristina Default
                    </button>

                    <button
                        type="button"
                        onClick={handleSimulate}
                        disabled={!isModified}
                        className="h-8 px-4 text-xs font-semibold rounded-lg bg-cyan-500 text-black hover:bg-cyan-400 active:scale-95 transition-all disabled:opacity-40 flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
                    >
                        <Play className="w-3 h-3 fill-current" />
                        Simula Impatto Grafici
                    </button>
                </div>
            </div>

            {/* Sliders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sliders.map((s) => {
                    const val = Number((local[s.key] as number) ?? 0)

                    return (
                        <div
                            key={s.key}
                            className="p-3.5 rounded-xl bg-zinc-950/70 border border-white/5 space-y-2"
                        >
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-white/90">{s.label}</span>
                                <span className="font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                                    {val.toFixed(2)}
                                </span>
                            </div>

                            <input
                                type="range"
                                min={s.min}
                                max={s.max}
                                step={s.step}
                                value={val}
                                onChange={(e) => handleChange(s.key, parseFloat(e.target.value))}
                                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                            />

                            <p className="text-[10px] text-white/40 leading-tight">{s.desc}</p>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
