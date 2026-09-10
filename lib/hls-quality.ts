export type HlsQualityLevel = {
    height?: number
    bitrate?: number
}

export function pickHighestHlsLevel(levels: HlsQualityLevel[]): number {
    if (levels.length === 0) return 0
    let best = 0
    for (let i = 1; i < levels.length; i++) {
        const height = levels[i].height || 0
        const bestHeight = levels[best].height || 0
        const bitrate = levels[i].bitrate || 0
        const bestBitrate = levels[best].bitrate || 0
        if (height > bestHeight || (height === bestHeight && bitrate > bestBitrate)) {
            best = i
        }
    }
    return best
}
