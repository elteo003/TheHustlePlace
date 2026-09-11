import { fetchCatalogSection } from '@/lib/server/catalog'
import { TvRailItem } from '@/tv/lib/types'
import { TvBrowse } from '@/tv/components/TvBrowse'

export const dynamic = 'force-dynamic'

export default async function LivingMoviesPage() {
    const [popular, recent, topRated] = await Promise.all([
        fetchCatalogSection('movie', 'popular', 12),
        fetchCatalogSection('movie', 'recent', 12),
        fetchCatalogSection('movie', 'top-rated', 12),
    ])

    return (
        <TvBrowse
            rows={[
                { title: 'Popolari', items: popular as TvRailItem[], type: 'movie' },
                { title: 'Recenti', items: recent as TvRailItem[], type: 'movie' },
                { title: 'Più votati', items: topRated as TvRailItem[], type: 'movie' },
            ]}
        />
    )
}
