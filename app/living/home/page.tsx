import { fetchCatalogSection, fetchEditorialRails, fetchPersonalRails, fetchPlatformTop10 } from '@/lib/server/catalog'
import { CINEMA_RAIL_SIZE, HOME_RAIL_SIZE, TOP10_SIZE } from '@/lib/catalog-types'
import { EDITORIAL_HOME_RAILS, EDITORIAL_RAIL_TITLES } from '@/lib/editorial-rails'
import { TvRailItem } from '@/tv/lib/types'
import { TvHome } from '@/tv/components/TvHome'
import { Top10Content } from '@/types'

export const dynamic = 'force-dynamic'

export default async function LivingHomePage() {
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
    const personal = await fetchPersonalRails(occupiedBase)
    const editorial = await fetchEditorialRails(occupiedBase)

    const rows = [
        { id: 'picks', title: 'Scelti per te oggi', items: personal.picks as TvRailItem[] },
        { id: 'top', title: 'Top 10', items: top10 as TvRailItem[] },
        ...(personal.affinity.length
            ? [{ title: 'Pensiamo ti appassioneranno', items: personal.affinity as TvRailItem[] }]
            : []),
        { title: 'Film popolari', items: popularMovies as TvRailItem[], type: 'movie' as const },
        { title: 'Serie recenti', items: recentTV as TvRailItem[], type: 'tv' as const },
        { title: 'Tesori per te', items: personal.treasures as TvRailItem[] },
        ...EDITORIAL_HOME_RAILS.map(({ id }) => ({
            title: EDITORIAL_RAIL_TITLES[id],
            items: editorial[id] as TvRailItem[],
        })),
        { title: 'Film recenti', items: recentMovies as TvRailItem[], type: 'movie' as const },
        { title: 'Serie popolari', items: popularTV as TvRailItem[], type: 'tv' as const },
        { id: 'coming-to-cinema', title: 'Presto al cinema', items: cinema as TvRailItem[] },
        { id: 'soon', title: 'In arrivo', items: comingSoon as TvRailItem[] },
    ].filter((row) => row.items.length > 0)

    return <TvHome rows={rows} personal={personal} occupied={occupiedBase} platformTop10={platformTop10} />
}
