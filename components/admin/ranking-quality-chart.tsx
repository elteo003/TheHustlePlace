'use client'

import { useState } from 'react'
import { MetricAtK } from '@/lib/admin-ml-metrics'
import { TrendingUp, HelpCircle, Target } from 'lucide-react'

interface RankingQualityChartProps {
    metricsAtK: MetricAtK[]
    mrr: number
    map: number
    ild: number
}

export function RankingQualityChart({ metricsAtK, mrr, map, ild }: RankingQualityChartProps) {
    const [hoveredK, setHoveredK] = useState<number | null>(null)

    // Chart dimensions
    const width = 640
    const height = 260
    const padding = { top: 20, right: 30, bottom: 40, left: 45 }

    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    // Points calculation (K on X-axis from 1 to 20, Value on Y-axis from 0 to 1)
    const getX = (k: number) => padding.left + ((k - 1) / (20 - 1)) * chartWidth
    const getY = (val: number) => padding.top + (1 - val) * chartHeight

    // SVG path builders
    const ndcgPath = metricsAtK
        .map((m, i) => `${i === 0 ? 'M' : 'L'} ${getX(m.k)} ${getY(m.ndcg)}`)
        .join(' ')

    const precisionPath = metricsAtK
        .map((m, i) => `${i === 0 ? 'M' : 'L'} ${getX(m.k)} ${getY(m.precision)}`)
        .join(' ')

    const recallPath = metricsAtK
        .map((m, i) => `${i === 0 ? 'M' : 'L'} ${getX(m.k)} ${getY(m.recall)}`)
        .join(' ')

    const activeMetric = hoveredK ? metricsAtK.find((m) => m.k === hoveredK) : metricsAtK[2] // default to K=5

    return (
        <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-5">
            {/* Header with KPI cards */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        Curva di Ranking Quality: NDCG@K, Precision@K & Recall@K
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5">
                        Misura l&apos;accuratezza posizionale delle raccomandazioni e il bilanciamento tra precisione e copertura.
                    </p>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 font-mono text-xs">
                    <div className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                        <span className="text-white/40 text-[10px] block">MRR</span>
                        <span className="font-bold">{mrr}</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                        <span className="text-white/40 text-[10px] block">MAP</span>
                        <span className="font-bold">{map}</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-300">
                        <span className="text-white/40 text-[10px] block">Diversità ILD</span>
                        <span className="font-bold">{ild}</span>
                    </div>
                </div>
            </div>

            {/* Interactive Legend & Current Values */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bg-zinc-950/60 border border-white/5 text-xs">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                        <span className="text-white/80 font-medium">NDCG@K</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                        <span className="text-white/80 font-medium">Precision@K</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                        <span className="text-white/80 font-medium">Recall@K</span>
                    </div>
                </div>

                {activeMetric && (
                    <div className="flex items-center gap-3 font-mono font-bold text-[11px] text-white">
                        <span className="text-white/50 font-normal">A K = {activeMetric.k}:</span>
                        <span className="text-emerald-400">NDCG: {activeMetric.ndcg}</span>
                        <span className="text-cyan-400">P@{activeMetric.k}: {activeMetric.precision}</span>
                        <span className="text-amber-400">R@{activeMetric.k}: {activeMetric.recall}</span>
                    </div>
                )}
            </div>

            {/* SVG Chart */}
            <div className="relative w-full overflow-x-auto">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-auto min-w-[500px] overflow-visible"
                >
                    {/* Y-axis grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1.0].map((val) => {
                        const y = getY(val)
                        return (
                            <g key={`y-grid-${val}`}>
                                <line
                                    x1={padding.left}
                                    y1={y}
                                    x2={width - padding.right}
                                    y2={y}
                                    stroke="rgba(255,255,255,0.08)"
                                    strokeDasharray="4 4"
                                />
                                <text
                                    x={padding.left - 8}
                                    y={y + 4}
                                    textAnchor="end"
                                    className="text-[10px] fill-white/40 font-mono"
                                >
                                    {val.toFixed(2)}
                                </text>
                            </g>
                        )
                    })}

                    {/* X-axis labels */}
                    {metricsAtK.map((m) => {
                        const x = getX(m.k)
                        return (
                            <g key={`x-axis-${m.k}`}>
                                <line
                                    x1={x}
                                    y1={height - padding.bottom}
                                    x2={x}
                                    y2={height - padding.bottom + 5}
                                    stroke="rgba(255,255,255,0.2)"
                                />
                                <text
                                    x={x}
                                    y={height - padding.bottom + 18}
                                    textAnchor="middle"
                                    className="text-[10px] fill-white/40 font-mono"
                                >
                                    K={m.k}
                                </text>
                            </g>
                        )
                    })}

                    {/* Metric Paths */}
                    <path
                        d={ndcgPath}
                        fill="none"
                        stroke="#34d399"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                    />
                    <path
                        d={precisionPath}
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                    />
                    <path
                        d={recallPath}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                    />

                    {/* Interactive points & vertical ruler */}
                    {metricsAtK.map((m) => {
                        const x = getX(m.k)
                        const isHovered = hoveredK === m.k

                        return (
                            <g
                                key={`points-${m.k}`}
                                onMouseEnter={() => setHoveredK(m.k)}
                                onMouseLeave={() => setHoveredK(null)}
                                className="cursor-pointer"
                            >
                                {isHovered && (
                                    <line
                                        x1={x}
                                        y1={padding.top}
                                        x2={x}
                                        y2={height - padding.bottom}
                                        stroke="rgba(255,255,255,0.3)"
                                        strokeWidth={1}
                                        strokeDasharray="2 2"
                                    />
                                )}

                                {/* NDCG Dot */}
                                <circle
                                    cx={x}
                                    cy={getY(m.ndcg)}
                                    r={isHovered ? 6 : 4}
                                    fill="#34d399"
                                    stroke="#000"
                                    strokeWidth={2}
                                />

                                {/* Precision Dot */}
                                <circle
                                    cx={x}
                                    cy={getY(m.precision)}
                                    r={isHovered ? 6 : 4}
                                    fill="#22d3ee"
                                    stroke="#000"
                                    strokeWidth={2}
                                />

                                {/* Recall Dot */}
                                <circle
                                    cx={x}
                                    cy={getY(m.recall)}
                                    r={isHovered ? 6 : 4}
                                    fill="#fbbf24"
                                    stroke="#000"
                                    strokeWidth={2}
                                />

                                {/* Hit zone */}
                                <rect
                                    x={x - 12}
                                    y={padding.top}
                                    width={24}
                                    height={chartHeight}
                                    fill="transparent"
                                />
                            </g>
                        )
                    })}
                </svg>
            </div>
        </div>
    )
}
