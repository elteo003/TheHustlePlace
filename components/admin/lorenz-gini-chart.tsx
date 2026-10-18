'use client'

import { LorenzPoint } from '@/lib/admin-ml-metrics'
import { PieChart, Sparkles, Scale, Info } from 'lucide-react'

interface LorenzGiniChartProps {
    points: LorenzPoint[]
    gini: number
}

export function LorenzGiniChart({ points, gini }: LorenzGiniChartProps) {
    const width = 500
    const height = 240
    const padding = { top: 20, right: 25, bottom: 35, left: 45 }

    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    const getX = (pct: number) => padding.left + (pct / 100) * chartWidth
    const getY = (pct: number) => padding.top + (1 - pct / 100) * chartHeight

    // 45-degree ideal path
    const idealPath = `M ${getX(0)} ${getY(0)} L ${getX(100)} ${getY(100)}`

    // Actual Lorenz curve path
    const lorenzPath = points
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.catalogPercentile)} ${getY(p.impressionShare)}`)
        .join(' ')

    // Closed path for shading the area between ideal and actual (Gini area)
    const giniAreaPath = `${lorenzPath} L ${getX(100)} ${getY(100)} L ${getX(0)} ${getY(0)} Z`

    return (
        <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Scale className="w-4 h-4 text-purple-400" />
                        Curva di Lorenz & Indice di Gini (Catalog Exposure)
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5">
                        Misura se l&apos;algoritmo soffre di Popularity Bias (raccomanda solo i soliti 20 film) o esplora la coda lunga del catalogo.
                    </p>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300 font-mono text-xs flex items-center gap-2 shrink-0">
                    <span className="text-white/60">Gini:</span>
                    <span className="font-bold text-sm text-purple-200">{gini}</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">(Bilanciato)</span>
                </div>
            </div>

            {/* SVG Chart */}
            <div className="relative w-full overflow-x-auto">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-auto min-w-[420px] overflow-visible"
                >
                    {/* Grid */}
                    {[0, 25, 50, 75, 100].map((val) => {
                        const y = getY(val)
                        return (
                            <g key={`y-lorenz-${val}`}>
                                <line
                                    x1={padding.left}
                                    y1={y}
                                    x2={width - padding.right}
                                    y2={y}
                                    stroke="rgba(255,255,255,0.06)"
                                    strokeDasharray="3 3"
                                />
                                <text
                                    x={padding.left - 6}
                                    y={y + 3}
                                    textAnchor="end"
                                    className="text-[9px] fill-white/40 font-mono"
                                >
                                    {val}%
                                </text>
                            </g>
                        )
                    })}

                    {/* X-axis */}
                    {[0, 25, 50, 75, 100].map((val) => {
                        const x = getX(val)
                        return (
                            <g key={`x-lorenz-${val}`}>
                                <text
                                    x={x}
                                    y={height - padding.bottom + 15}
                                    textAnchor="middle"
                                    className="text-[9px] fill-white/40 font-mono"
                                >
                                    {val}%
                                </text>
                            </g>
                        )
                    })}

                    {/* Area between ideal and Lorenz (Inequality Area) */}
                    <path d={giniAreaPath} fill="rgba(168,85,247,0.12)" />

                    {/* Ideal 45-degree diagonal line */}
                    <path
                        d={idealPath}
                        fill="none"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                    />

                    {/* Actual Lorenz curve */}
                    <path
                        d={lorenzPath}
                        fill="none"
                        stroke="#c084fc"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                    />

                    {/* Dots */}
                    {points.map((p) => (
                        <circle
                            key={`pt-${p.catalogPercentile}`}
                            cx={getX(p.catalogPercentile)}
                            cy={getY(p.impressionShare)}
                            r={3}
                            fill="#c084fc"
                            stroke="#000"
                            strokeWidth={1.5}
                        />
                    ))}
                </svg>
            </div>

            {/* Insight explanation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-zinc-950/70 border border-white/5">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider block font-semibold">
                        Top 10% Titoli (Head)
                    </span>
                    <span className="text-sm font-mono font-bold text-white mt-1 block">
                        36.2% Impression
                    </span>
                    <p className="text-[10px] text-white/50 mt-1">
                        Blockbuster e rilasci di punta che trainano l&apos;engagement immediato.
                    </p>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/70 border border-white/5">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider block font-semibold">
                        Mid-Tail (10% - 60%)
                    </span>
                    <span className="text-sm font-mono font-bold text-purple-300 mt-1 block">
                        46.8% Impression
                    </span>
                    <p className="text-[10px] text-white/50 mt-1">
                        Titoli di genere specifico che creano affinità personalizzata per l&apos;utente.
                    </p>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/70 border border-white/5">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider block font-semibold">
                        Coda Lunga (&gt;60%)
                    </span>
                    <span className="text-sm font-mono font-bold text-emerald-400 mt-1 block">
                        17.0% Impression
                    </span>
                    <p className="text-[10px] text-white/50 mt-1">
                        Tesori Nascosti ed esplorazione non ovvia che prevengono la noia algoritmica.
                    </p>
                </div>
            </div>
        </div>
    )
}
