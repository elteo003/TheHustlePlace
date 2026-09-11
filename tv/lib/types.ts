import { ContentType } from '@/lib/content-navigation'

export interface TvRailItem {
    id: number
    tmdb_id?: number
    title?: string
    name?: string
    overview?: string
    poster_path?: string | null
    backdrop_path?: string | null
    contentType?: ContentType
    type?: ContentType
}

export interface TvProfile {
    id: string
    name: string
    avatar: number
    pairCode: string | null
}

export interface TvHouseholdState {
    configured: boolean
    householdId: string | null
    activeProfileId: string
    profiles: TvProfile[]
}
