import { fetchCatalogSection, fetchEditorialRails, fetchPersonalRails, fetchPlatformTop10 } from '@/lib/server/catalog'
import { HOME_RAIL_SIZE, TOP10_SIZE } from '@/lib/catalog-types'
import { HomePageClient } from '@/components/pages/home-page-client'
import { Movie, TVShow, Top10Content } from '@/types'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
    const [top10, comingSoon, popularMovies, recentMovies, popularTV, recentTV, platformTop10] = await Promise.all([
        fetchCatalogSection('movie', 'trending', TOP10_SIZE),
        fetchCatalogSection('movie', 'upcoming', HOME_RAIL_SIZE),
        fetchCatalogSection('movie', 'popular', HOME_RAIL_SIZE),
        fetchCatalogSection('movie', 'recent', HOME_RAIL_SIZE),
        fetchCatalogSection('tv', 'popular', HOME_RAIL_SIZE),
        fetchCatalogSection('tv', 'recent', HOME_RAIL_SIZE),
        fetchPlatformTop10(),
    ])

    const occupiedBase = [...(top10 as Top10Content[]), ...(comingSoon as Top10Content[])]
    const personal = await fetchPersonalRails(occupiedBase)
    const editorial = await fetchEditorialRails(occupiedBase)

    return (
        <HomePageClient
            top10={top10 as Top10Content[]}
            comingSoon={comingSoon as Top10Content[]}
            personal={personal}
            editorial={editorial}
            popularMovies={popularMovies as Movie[]}
            recentMovies={recentMovies as Movie[]}
            popularTV={popularTV as TVShow[]}
            recentTV={recentTV as TVShow[]}
            platformTop10={platformTop10}
        />
    )
}
