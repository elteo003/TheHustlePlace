export function nextWatchProgress(current?: number | null): number {
    if (current == null || current <= 0) {
        return 18
    }
    return Math.min(95, Number(current) + 12)
}
