import { fetchCatalogSection } from '@/lib/server/catalog'
import { HOME_RAIL_SIZE } from '@/lib/catalog-types'
import { TvRailItem } from '@/tv/lib/types'
import { TvBrowse } from '@/tv/components/TvBrowse'

export const dynamic = 'force-dynamic'

export default async function LivingSeriesPage() {
    const [popular, recent, topRated] = await Promise.all([
        fetchCatalogSection('tv', 'popular', HOME_RAIL_SIZE),
        fetchCatalogSection('tv', 'recent', HOME_RAIL_SIZE),
        fetchCatalogSection('tv', 'top-rated', HOME_RAIL_SIZE),
    ])

    return (
        <TvBrowse
            rows={[
                { title: 'Popolari', items: popular as TvRailItem[], type: 'tv' },
                { title: 'Recenti', items: recent as TvRailItem[], type: 'tv' },
                { title: 'Più votate', items: topRated as TvRailItem[], type: 'tv' },
            ]}
        />
    )
}
