import { Top10Content } from '@/types'
import { takeUnseen } from '@/lib/personal-rails'

export const EDITORIAL_RAIL_SIZE = 24
export const EDITORIAL_MIN_ITEMS = 6

export const TMDB_GENRE = {
    movieWar: 10752,
    movieHistory: 36,
    movieWestern: 37,
    tvWarPolitics: 10768,
} as const

export const TMDB_KEYWORD = {
    war: 273967,
    military: 162365,
    worldWar: 258077,
    worldWarI: 2504,
    worldWarII: 1956,
    politics: 6078,
    politicalThriller: 209817,
    geopolitics: 214608,
    government: 6086,
    election: 15134,
    president: 8570,
    whiteHouse: 833,
    periodDrama: 15060,
    historical: 15126,
    historicalFiction: 12995,
} as const

export type EditorialRailId = 'warAndPolitics' | 'politicalIntrigue' | 'periodStories'

export type EditorialRails = Record<EditorialRailId, Top10Content[]>

export const EDITORIAL_RAIL_TITLES: Record<EditorialRailId, string> = {
    warAndPolitics: 'Guerra e politica',
    politicalIntrigue: 'Intrighi politici',
    periodStories: "Storie di un'epoca passata",
}

export const WAR_KEYWORDS = [
    TMDB_KEYWORD.war,
    TMDB_KEYWORD.military,
    TMDB_KEYWORD.worldWar,
    TMDB_KEYWORD.worldWarI,
    TMDB_KEYWORD.worldWarII,
]

export const WAR_STORY_KEYWORDS = [
    TMDB_KEYWORD.war,
    TMDB_KEYWORD.worldWar,
    TMDB_KEYWORD.worldWarI,
    TMDB_KEYWORD.worldWarII,
]

export const POLITICS_KEYWORDS = [
    TMDB_KEYWORD.politics,
    TMDB_KEYWORD.politicalThriller,
    TMDB_KEYWORD.geopolitics,
    TMDB_KEYWORD.government,
    TMDB_KEYWORD.election,
    TMDB_KEYWORD.president,
    TMDB_KEYWORD.whiteHouse,
]

export const PERIOD_KEYWORDS = [
    TMDB_KEYWORD.periodDrama,
    TMDB_KEYWORD.historical,
    TMDB_KEYWORD.historicalFiction,
]

export function keywordPipe(ids: number[]): string {
    return ids.join('|')
}

export function andKeywordGroups(left: number[], right: number[]): string {
    return `${keywordPipe(left)},${keywordPipe(right)}`
}

export function sortByPopularity(items: Top10Content[]): Top10Content[] {
    return [...items].sort((left, right) => (right.popularity || 0) - (left.popularity || 0))
}

export function composeEditorialRails(
    pools: {
        warAndPolitics: Top10Content[]
        politicalIntrigue: Top10Content[]
        periodStories: Top10Content[]
    },
    occupied: Iterable<string>,
    size = EDITORIAL_RAIL_SIZE
): EditorialRails {
    const seen = new Set(occupied)

    const warAndPolitics = takeUnseen(sortByPopularity(pools.warAndPolitics), seen, size)
    const periodStories = takeUnseen(sortByPopularity(pools.periodStories), seen, size)
    const politicalIntrigue = takeUnseen(
        sortByPopularity(pools.politicalIntrigue.filter((item) => item.type === 'tv')),
        seen,
        size
    )

    return {
        warAndPolitics: warAndPolitics.length >= EDITORIAL_MIN_ITEMS ? warAndPolitics : [],
        politicalIntrigue: politicalIntrigue.length >= EDITORIAL_MIN_ITEMS ? politicalIntrigue : [],
        periodStories: periodStories.length >= EDITORIAL_MIN_ITEMS ? periodStories : [],
    }
}
