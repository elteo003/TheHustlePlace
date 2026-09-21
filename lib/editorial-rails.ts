import { Top10Content } from '@/types'
import { takeUnseen } from '@/lib/personal-rails'

export const EDITORIAL_RAIL_SIZE = 24
export const EDITORIAL_MIN_ITEMS = 6

export const TMDB_GENRE = {
    movieWar: 10752,
    movieHistory: 36,
    movieWestern: 37,
    movieFantasy: 14,
    movieScienceFiction: 878,
    movieAnimation: 16,
    movieThriller: 53,
    movieComedy: 35,
    tvWarPolitics: 10768,
    tvSciFiFantasy: 10765,
} as const

export const TMDB_KEYWORD = {
    war: 273967,
    military: 162365,
    worldWar: 258077,
    worldWarI: 2504,
    worldWarII: 1956,
    napoleonicWars: 33384,
    vietnamWar: 2957,
    koreanWar: 3264,
    gulfWar: 2952,
    iraqWar: 15087,
    afghanistanWar: 7158,
    warOnTerror: 1242,
    somalia: 4265,
    geopolitics: 214608,
    politics: 6078,
    politicalThriller: 209817,
    government: 6086,
    election: 15134,
    president: 8570,
    whiteHouse: 833,
    periodDrama: 15060,
    historical: 15126,
    historicalFiction: 12995,
    sixties: 208992,
    seventies: 1228,
    eighties: 208289,
    coldWar: 2106,
    superhero: 9715,
    ancientRome: 5049,
    romanEmpire: 1405,
    ancientWorld: 14704,
    gladiator: 1394,
} as const

export type EditorialRailId = 'warAndPolitics' | 'politicalIntrigue' | 'periodStories'

export type EditorialRails = Record<EditorialRailId, Top10Content[]>

export const EDITORIAL_RAIL_TITLES: Record<EditorialRailId, string> = {
    warAndPolitics: 'Guerra e politica',
    politicalIntrigue: 'Le guerre di oggi',
    periodStories: "Storie di un'epoca passata",
}

export const WAR_KEYWORDS = [
    TMDB_KEYWORD.war,
    TMDB_KEYWORD.military,
    TMDB_KEYWORD.worldWar,
    TMDB_KEYWORD.worldWarI,
    TMDB_KEYWORD.worldWarII,
]

export const HISTORICAL_WAR_KEYWORDS = [
    TMDB_KEYWORD.worldWarI,
    TMDB_KEYWORD.worldWarII,
    TMDB_KEYWORD.napoleonicWars,
]

export const WAR_STORY_KEYWORDS = HISTORICAL_WAR_KEYWORDS

export const MODERN_CONFLICT_KEYWORDS = [
    TMDB_KEYWORD.vietnamWar,
    TMDB_KEYWORD.koreanWar,
    TMDB_KEYWORD.gulfWar,
    TMDB_KEYWORD.iraqWar,
    TMDB_KEYWORD.afghanistanWar,
    TMDB_KEYWORD.somalia,
]

export const MODERN_GEO_KEYWORDS = [TMDB_KEYWORD.warOnTerror, TMDB_KEYWORD.geopolitics]

export const MODERN_WAR_KEYWORDS = [...MODERN_CONFLICT_KEYWORDS, ...MODERN_GEO_KEYWORDS]

export const POLITICS_KEYWORDS = [
    TMDB_KEYWORD.politics,
    TMDB_KEYWORD.politicalThriller,
    TMDB_KEYWORD.geopolitics,
    TMDB_KEYWORD.government,
    TMDB_KEYWORD.election,
    TMDB_KEYWORD.president,
    TMDB_KEYWORD.whiteHouse,
]

export const PERIOD_KEYWORDS = [TMDB_KEYWORD.periodDrama]

export const PERIOD_EXCLUDE_KEYWORDS = [
    TMDB_KEYWORD.sixties,
    TMDB_KEYWORD.seventies,
    TMDB_KEYWORD.eighties,
    TMDB_KEYWORD.coldWar,
    TMDB_KEYWORD.superhero,
    TMDB_KEYWORD.ancientRome,
    TMDB_KEYWORD.romanEmpire,
    TMDB_KEYWORD.ancientWorld,
    TMDB_KEYWORD.gladiator,
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
    const politicalIntrigue = takeUnseen(sortByPopularity(pools.politicalIntrigue), seen, size)

    return {
        warAndPolitics: warAndPolitics.length >= EDITORIAL_MIN_ITEMS ? warAndPolitics : [],
        politicalIntrigue: politicalIntrigue.length >= EDITORIAL_MIN_ITEMS ? politicalIntrigue : [],
        periodStories: periodStories.length >= EDITORIAL_MIN_ITEMS ? periodStories : [],
    }
}
