import { fetchCatalogSection } from '@/lib/server/catalog'
import { TvRailItem } from '@/tv/lib/types'
import { TvBrowse } from '@/tv/components/TvBrowse'

export const dynamic = 'force-dynamic'

export default async function LivingSeriesPage() {
    const [popular, recent, topRated] = await Promise.all([
        fetchCatalogSection('tv', 'popular', 12),
        fetchCatalogSection('tv', 'recent', 12),
        fetchCatalogSection('tv', 'top-rated', 12),
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
