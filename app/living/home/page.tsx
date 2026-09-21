import { fetchCatalogSection, fetchEditorialRails, fetchPersonalRails } from '@/lib/server/catalog'
import { HOME_RAIL_SIZE, TOP10_SIZE } from '@/lib/catalog-types'
import { EDITORIAL_RAIL_TITLES } from '@/lib/editorial-rails'
import { TvRailItem } from '@/tv/lib/types'
import { TvHome } from '@/tv/components/TvHome'
import { Top10Content } from '@/types'

export const dynamic = 'force-dynamic'

export default async function LivingHomePage() {
    const [top10, comingSoon, popularMovies, recentMovies, popularTV, recentTV] = await Promise.all([
        fetchCatalogSection('movie', 'trending', TOP10_SIZE),
        fetchCatalogSection('movie', 'upcoming', HOME_RAIL_SIZE),
        fetchCatalogSection('movie', 'popular', HOME_RAIL_SIZE),
        fetchCatalogSection('movie', 'recent', HOME_RAIL_SIZE),
        fetchCatalogSection('tv', 'popular', HOME_RAIL_SIZE),
        fetchCatalogSection('tv', 'recent', HOME_RAIL_SIZE),
    ])

    const occupiedBase = [...(top10 as Top10Content[]), ...(comingSoon as Top10Content[])]
    const personal = await fetchPersonalRails(occupiedBase)
    const editorial = await fetchEditorialRails([
        ...occupiedBase,
        ...personal.picks,
        ...personal.affinity,
        ...personal.treasures,
    ])

    const rows = [
        { title: 'Scelti per te oggi', items: personal.picks as TvRailItem[] },
        { title: 'Top 10', items: top10 as TvRailItem[] },
        ...(personal.affinity.length
            ? [{ title: 'Pensiamo ti appassioneranno', items: personal.affinity as TvRailItem[] }]
            : []),
        { title: 'Tesori per te', items: personal.treasures as TvRailItem[] },
        { title: EDITORIAL_RAIL_TITLES.warAndPolitics, items: editorial.warAndPolitics as TvRailItem[] },
        {
            title: EDITORIAL_RAIL_TITLES.politicalIntrigue,
            items: editorial.politicalIntrigue as TvRailItem[],
            type: 'tv' as const,
        },
        { title: EDITORIAL_RAIL_TITLES.periodStories, items: editorial.periodStories as TvRailItem[] },
        { title: 'In arrivo', items: comingSoon as TvRailItem[] },
        { title: 'Film popolari', items: popularMovies as TvRailItem[], type: 'movie' as const },
        { title: 'Film recenti', items: recentMovies as TvRailItem[], type: 'movie' as const },
        { title: 'Serie popolari', items: popularTV as TvRailItem[], type: 'tv' as const },
        { title: 'Serie recenti', items: recentTV as TvRailItem[], type: 'tv' as const },
    ].filter((row) => row.items.length > 0)

    return <TvHome rows={rows} personal={personal} occupied={occupiedBase} />
}
