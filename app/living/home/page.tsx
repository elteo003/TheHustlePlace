import { fetchCatalogSection } from '@/lib/server/catalog'
import { TvRailItem } from '@/tv/lib/types'
import { TvHome } from '@/tv/components/TvHome'

export const dynamic = 'force-dynamic'

export default async function LivingHomePage() {
    const [top10, popularMovies, recentMovies, popularTV, recentTV] = await Promise.all([
        fetchCatalogSection('movie', 'trending', 10),
        fetchCatalogSection('movie', 'popular', 10),
        fetchCatalogSection('movie', 'recent', 10),
        fetchCatalogSection('tv', 'popular', 10),
        fetchCatalogSection('tv', 'recent', 10),
    ])

    return (
        <TvHome
            rows={[
                { title: 'Top 10', items: top10 as TvRailItem[] },
                { title: 'Film popolari', items: popularMovies as TvRailItem[], type: 'movie' },
                { title: 'Film recenti', items: recentMovies as TvRailItem[], type: 'movie' },
                { title: 'Serie popolari', items: popularTV as TvRailItem[], type: 'tv' },
                { title: 'Serie recenti', items: recentTV as TvRailItem[], type: 'tv' },
            ]}
        />
    )
}
