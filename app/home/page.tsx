import { fetchCatalogSection } from '@/lib/server/catalog'
import { HomePageClient } from '@/components/pages/home-page-client'
import { Movie, TVShow, Top10Content } from '@/types'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
    const [top10, popularMovies, recentMovies, popularTV, recentTV] = await Promise.all([
        fetchCatalogSection('movie', 'trending', 10),
        fetchCatalogSection('movie', 'popular', 10),
        fetchCatalogSection('movie', 'recent', 10),
        fetchCatalogSection('tv', 'popular', 10),
        fetchCatalogSection('tv', 'recent', 10),
    ])

    return (
        <HomePageClient
            top10={top10 as Top10Content[]}
            popularMovies={popularMovies as Movie[]}
            recentMovies={recentMovies as Movie[]}
            popularTV={popularTV as TVShow[]}
            recentTV={recentTV as TVShow[]}
        />
    )
}
