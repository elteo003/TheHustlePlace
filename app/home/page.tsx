import { fetchCatalogSection, fetchEditorialRails, fetchPersonalRails, fetchPlatformTop10, fetchServerWatchHistory } from '@/lib/server/catalog'
import { CINEMA_RAIL_SIZE, HOME_RAIL_SIZE, TOP10_SIZE } from '@/lib/catalog-types'
import { HomePageClient } from '@/components/pages/home-page-client'
import { Movie, TVShow, Top10Content } from '@/types'
import { fetchUpcomingTVCatalog } from '@/lib/tv-upcoming'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
    const serverHistory = await fetchServerWatchHistory()
    const followedTV = serverHistory
        .filter((entry) => entry.type === 'tv')
        .filter((entry) => {
            if (entry.continueHidden) {
                return (entry.progress ?? 0) < 90
            }
            return true
        })
        .map((entry) => ({
            id: entry.id,
            season: entry.season,
            episode: entry.episode,
        }))

    const [top10, comingSoon, cinema, popularMovies, recentMovies, popularTV, recentTV, platformTop10] =
        await Promise.all([
            fetchCatalogSection('movie', 'trending', TOP10_SIZE),
            fetchCatalogSection('movie', 'upcoming', HOME_RAIL_SIZE),
            fetchCatalogSection('movie', 'coming-to-cinema', CINEMA_RAIL_SIZE),
            fetchCatalogSection('movie', 'popular', HOME_RAIL_SIZE),
            fetchCatalogSection('movie', 'recent', HOME_RAIL_SIZE),
            fetchCatalogSection('tv', 'popular', HOME_RAIL_SIZE),
            fetchCatalogSection('tv', 'recent', HOME_RAIL_SIZE),
            fetchPlatformTop10(),
        ])

    const occupiedBase = [
        ...(top10 as Top10Content[]),
        ...(cinema as Top10Content[]),
        ...(comingSoon as Top10Content[]),
    ]
    const personal = await fetchPersonalRails(occupiedBase, serverHistory)
    const [editorial, upcomingTV] = await Promise.all([
        fetchEditorialRails(occupiedBase, personal.topGenres),
        fetchUpcomingTVCatalog(followedTV, { topGenres: personal.topGenres }).catch(() => []),
    ])

    return (
        <HomePageClient
            top10={top10 as Top10Content[]}
            comingSoon={comingSoon as Top10Content[]}
            comingToCinema={cinema as Top10Content[]}
            personal={personal}
            editorial={editorial}
            popularMovies={popularMovies as Movie[]}
            recentMovies={recentMovies as Movie[]}
            popularTV={popularTV as TVShow[]}
            recentTV={recentTV as TVShow[]}
            platformTop10={platformTop10}
            initialUpcomingTV={upcomingTV}
        />
    )
}
