import { Top10Content } from '@/types'
import { takeUnseen } from '@/lib/personal-rails'
import { CatalogSection } from '@/lib/catalog-types'

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
    movieMystery: 9648,
    movieCrime: 80,
    movieHorror: 27,
    movieMusic: 10402,
    movieDrama: 18,
    tvWarPolitics: 10768,
    tvSciFiFantasy: 10765,
    tvMystery: 9648,
    tvReality: 10764,
    tvTalk: 10767,
    tvNews: 10763,
    tvKids: 10762,
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
    medieval: 161257,
    knight: 10466,
    crusade: 2868,
    vikings: 5895,
    samurai: 1462,
    jidaigeki: 186753,
    edoPeriod: 190446,
    whodunit: 12570,
    twistEnding: 326438,
    neoNoir: 207268,
    nonlinearTimeline: 157171,
    amnesia: 1453,
    psychologicalHorror: 295907,
    bodyHorror: 283085,
    folkHorror: 209568,
    gore: 10292,
    musical: 4344,
    singer: 10229,
    rockAndRoll: 578,
    rockAndRollAlt: 292114,
    jukeboxMusical: 286529,
    fashion: 15479,
    advertising: 15086,
    hollywood: 12396,
} as const

export type EditorialRailId =
    | 'warAndPolitics'
    | 'medievalPassion'
    | 'puzzleInvestigations'
    | 'mysteryMasterpieces'
    | 'darkestHorror'
    | 'jukeboxPopStars'
    | 'vintageStories'
    | 'politicalIntrigue'
    | 'periodStories'

export type EditorialRails = Record<EditorialRailId, Top10Content[]>

export const EDITORIAL_RAIL_TITLES: Record<EditorialRailId, string> = {
    warAndPolitics: 'Guerra e politica',
    medievalPassion: 'Il medio evo che ti appassiona',
    puzzleInvestigations: 'Indagini rompicapo',
    mysteryMasterpieces: 'I capolavori del mistero',
    darkestHorror: 'Quelli più cupi',
    jukeboxPopStars: 'Viaggio nel tempo: tra jukebox, lustrini e pop star',
    vintageStories: 'Storie vintage: eleganza, vizi e cambiamenti sociali',
    politicalIntrigue: 'Le guerre di oggi',
    periodStories: "Storie di un'epoca passata",
}

export const EDITORIAL_HOME_RAILS: Array<{ id: EditorialRailId; section: CatalogSection }> = [
    { id: 'warAndPolitics', section: 'war-politics' },
    { id: 'medievalPassion', section: 'medieval-passion' },
    { id: 'puzzleInvestigations', section: 'puzzle-investigations' },
    { id: 'mysteryMasterpieces', section: 'mystery-masterpieces' },
    { id: 'darkestHorror', section: 'darkest-horror' },
    { id: 'jukeboxPopStars', section: 'jukebox-pop-stars' },
    { id: 'vintageStories', section: 'vintage-stories' },
    { id: 'periodStories', section: 'period-stories' },
    { id: 'politicalIntrigue', section: 'political-intrigue' },
]

const OCCUPY_ORDER: EditorialRailId[] = [
    'warAndPolitics',
    'medievalPassion',
    'periodStories',
    'puzzleInvestigations',
    'jukeboxPopStars',
    'vintageStories',
    'mysteryMasterpieces',
    'darkestHorror',
    'politicalIntrigue',
]

export const EDITORIAL_SEEDS: Partial<Record<EditorialRailId, Array<{ query: string; type: 'movie' | 'tv' }>>> = {
    puzzleInvestigations: [
        { query: 'The Usual Suspects', type: 'movie' },
        { query: 'Memento', type: 'movie' },
        { query: 'Knives Out', type: 'movie' },
        { query: 'Shutter Island', type: 'movie' },
        { query: 'The Game Nessuna regola', type: 'movie' },
    ],
    jukeboxPopStars: [
        { query: 'Bohemian Rhapsody', type: 'movie' },
        { query: 'Rocketman', type: 'movie' },
        { query: 'Elvis', type: 'movie' },
        { query: 'Hairspray', type: 'movie' },
        { query: 'Stranger Things', type: 'tv' },
    ],
    vintageStories: [
        { query: 'The French Dispatch', type: 'movie' },
        { query: "The Queen's Gambit", type: 'tv' },
        { query: 'American Hustle', type: 'movie' },
        { query: 'Licorice Pizza', type: 'movie' },
        { query: 'Catch Me If You Can', type: 'movie' },
        { query: 'The Man from U.N.C.L.E.', type: 'movie' },
    ],
}

export function boostEditorialSeeds(seeds: Top10Content[], pool: Top10Content[]): Top10Content[] {
    const boosted = seeds.map((item, index) => ({
        ...item,
        popularity: 100000 - index,
    }))
    const seen = new Set(boosted.map((item) => `${item.type}:${item.id}`))
    return [...boosted, ...pool.filter((item) => !seen.has(`${item.type}:${item.id}`))]
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

export const MEDIEVAL_PASSION_KEYWORDS = [
    TMDB_KEYWORD.medieval,
    TMDB_KEYWORD.knight,
    TMDB_KEYWORD.crusade,
    TMDB_KEYWORD.vikings,
    TMDB_KEYWORD.samurai,
    TMDB_KEYWORD.jidaigeki,
    TMDB_KEYWORD.edoPeriod,
]

export const PUZZLE_KEYWORDS = [
    TMDB_KEYWORD.whodunit,
    TMDB_KEYWORD.twistEnding,
    TMDB_KEYWORD.neoNoir,
    TMDB_KEYWORD.nonlinearTimeline,
    TMDB_KEYWORD.amnesia,
]

export const DARKEST_HORROR_KEYWORDS = [
    TMDB_KEYWORD.psychologicalHorror,
    TMDB_KEYWORD.bodyHorror,
    TMDB_KEYWORD.folkHorror,
    TMDB_KEYWORD.gore,
]

export const JUKEBOX_KEYWORDS = [
    TMDB_KEYWORD.musical,
    TMDB_KEYWORD.singer,
    TMDB_KEYWORD.rockAndRoll,
    TMDB_KEYWORD.rockAndRollAlt,
    TMDB_KEYWORD.jukeboxMusical,
]

export const VINTAGE_DECADE_KEYWORDS = [TMDB_KEYWORD.sixties, TMDB_KEYWORD.seventies]

export const VINTAGE_INDUSTRY_KEYWORDS = [
    TMDB_KEYWORD.fashion,
    TMDB_KEYWORD.advertising,
    TMDB_KEYWORD.hollywood,
]

export const VINTAGE_EXCLUDE_KEYWORDS = [TMDB_KEYWORD.eighties, TMDB_KEYWORD.coldWar, TMDB_KEYWORD.superhero]

export function emptyEditorialRails(): EditorialRails {
    return {
        warAndPolitics: [],
        medievalPassion: [],
        puzzleInvestigations: [],
        mysteryMasterpieces: [],
        darkestHorror: [],
        jukeboxPopStars: [],
        vintageStories: [],
        politicalIntrigue: [],
        periodStories: [],
    }
}

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
    pools: EditorialRails,
    occupied: Iterable<string>,
    size = EDITORIAL_RAIL_SIZE
): EditorialRails {
    const seen = new Set(occupied)
    const rails = emptyEditorialRails()

    for (const id of OCCUPY_ORDER) {
        const taken = takeUnseen(sortByPopularity(pools[id] || []), seen, size)
        rails[id] = taken.length >= EDITORIAL_MIN_ITEMS ? taken : []
    }

    return rails
}
