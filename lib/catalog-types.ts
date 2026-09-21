export type CatalogSection =
    | 'popular'
    | 'recent'
    | 'top-rated'
    | 'trending'
    | 'now-playing'
    | 'upcoming'
    | 'coming-to-cinema'
    | 'picks'
    | 'affinity'
    | 'treasures'
    | 'war-politics'
    | 'medieval-passion'
    | 'puzzle-investigations'
    | 'mystery-masterpieces'
    | 'darkest-horror'
    | 'jukebox-pop-stars'
    | 'vintage-stories'
    | 'drug-empires'
    | 'crime-lords'
    | 'political-intrigue'
    | 'period-stories'
    | 'platform-top10-tv'
    | 'platform-top10-movie'

export const HOME_RAIL_SIZE = 24
export const CINEMA_RAIL_SIZE = 80
export const TOP10_SIZE = 10

export function isPreviewOnlySection(section: CatalogSection): boolean {
    return section === 'upcoming' || section === 'coming-to-cinema'
}
