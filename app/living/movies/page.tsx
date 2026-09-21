import { fetchCatalogSection } from '@/lib/server/catalog'
import { HOME_RAIL_SIZE } from '@/lib/catalog-types'
import { TvRailItem } from '@/tv/lib/types'
import { TvBrowse } from '@/tv/components/TvBrowse'

export const dynamic = 'force-dynamic'

export default async function LivingMoviesPage() {
    const [popular, recent, topRated] = await Promise.all([
        fetchCatalogSection('movie', 'popular', HOME_RAIL_SIZE),
        fetchCatalogSection('movie', 'recent', HOME_RAIL_SIZE),
        fetchCatalogSection('movie', 'top-rated', HOME_RAIL_SIZE),
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
