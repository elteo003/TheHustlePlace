export const NEAR_END_SECONDS = 20
/** Mostra «Prossima» negli ultimi 5 minuti della puntata. */
export const NEXT_EPISODE_SECONDS = 5 * 60
export const RESUME_MIN_SECONDS = 5
export const COMPLETE_RATIO = 0.95
export const PROGRESS_SAVE_MIN_SECONDS = 5
export const TIMEUPDATE_SAVE_MS = 10_000

/** @deprecated Solo fallback; il progresso reale arriva da currentTime/duration. */
export function nextWatchProgress(current?: number | null): number {
    if (current == null || current <= 0) {
        return 18
    }
    return Math.min(95, Number(current) + 12)
}

export function progressPercent(currentTime: number, duration: number): number {
    if (!Number.isFinite(currentTime) || !Number.isFinite(duration) || duration <= 0) {
        return 0
    }
    return Math.min(100, Math.max(0, Math.round((currentTime / duration) * 100)))
}

export function isNearEnd(
    currentTime: number,
    duration: number,
    thresholdSeconds = NEXT_EPISODE_SECONDS
): boolean {
    if (!Number.isFinite(currentTime) || !Number.isFinite(duration) || duration <= 0) {
        return false
    }
    return currentTime > 0 && duration - currentTime <= thresholdSeconds
}

export function resumeStartAt(input: {
    currentTime?: number | null
    duration?: number | null
    progress?: number | null
}): number | undefined {
    const time = input.currentTime
    if (time == null || !Number.isFinite(time) || time < RESUME_MIN_SECONDS) {
        return undefined
    }

    const duration = input.duration
    if (duration != null && duration > 0) {
        if (time / duration >= COMPLETE_RATIO) return undefined
        if (duration - time <= NEAR_END_SECONDS) return undefined
    } else if (input.progress != null && input.progress >= COMPLETE_RATIO * 100) {
        return undefined
    }

    return Math.floor(time)
}
