import { fetchCatalogSection, fetchPersonalRails, fetchServerWatchHistory } from '@/lib/server/catalog'
import { HOME_RAIL_SIZE } from '@/lib/catalog-types'
import { TVPageClient } from '@/components/pages/tv-page-client'
import { TVShow } from '@/types'
import { fetchUpcomingTVCatalog } from '@/lib/tv-upcoming'

export const dynamic = 'force-dynamic'

export default async function TVPage() {
    const serverHistory = await fetchServerWatchHistory()
    const followedTV = serverHistory
        .filter((entry) => entry.type === 'tv')
        .map((entry) => ({ id: entry.id }))

    const personal = await fetchPersonalRails([], serverHistory)

    const [popular, recent, topRated, upcoming] = await Promise.all([
        fetchCatalogSection('tv', 'popular', HOME_RAIL_SIZE),
        fetchCatalogSection('tv', 'recent', HOME_RAIL_SIZE),
        fetchCatalogSection('tv', 'top-rated', HOME_RAIL_SIZE),
        fetchUpcomingTVCatalog(followedTV, { topGenres: personal.topGenres }).catch(() => []),
    ])

    return (
        <TVPageClient
            popular={popular as TVShow[]}
            recent={recent as TVShow[]}
            topRated={topRated as TVShow[]}
            upcoming={upcoming}
        />
    )
}
