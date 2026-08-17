export function contentTmdbId(item: { id: number; tmdb_id?: number }): number {
    return item.tmdb_id ?? item.id
}

export function filterByVixsrcIds<T extends { id: number; tmdb_id?: number }>(
    items: T[],
    ids: Set<number>
): T[] {
    return items.filter((item) => ids.has(contentTmdbId(item)))
}
