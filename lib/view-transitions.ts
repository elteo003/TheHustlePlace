import { ContentType } from '@/lib/content-navigation'

/** Nome univoco per morph poster → pagina dettaglio */
export function getPosterTransitionName(type: ContentType, id: number): string {
    return `poster-${type}-${id}`
}

export const NAV_VIEW_TRANSITION_NAME = 'site-nav'
