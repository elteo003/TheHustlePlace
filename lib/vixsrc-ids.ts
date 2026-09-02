export function contentTmdbId(item: { id: number; tmdb_id?: number }): number {
    return item.tmdb_id ?? item.id
}

export function isValidTmdbId(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0
}

export function collectVixsrcTmdbIds(data: unknown, limit: number): number[] {
    if (!Array.isArray(data) || limit <= 0) return []

    const ids: number[] = []
    const seen = new Set<number>()

    for (const item of data) {
        const raw =
            typeof item === 'number'
                ? item
                : item && typeof item === 'object'
                  ? (item as { tmdb_id?: unknown }).tmdb_id
                  : null
        const id = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : raw
        if (!isValidTmdbId(id) || seen.has(id)) continue
        seen.add(id)
        ids.push(id)
        if (ids.length >= limit) break
    }

    return ids
}

export function filterByVixsrcIds<T extends { id: number; tmdb_id?: number }>(
    items: T[],
    ids: Set<number>
): T[] {
    return items.filter((item) => ids.has(contentTmdbId(item)))
}
