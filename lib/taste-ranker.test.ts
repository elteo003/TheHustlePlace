import { describe, expect, it } from 'vitest'
import { Top10Content } from '@/types'
import {
    RANKER_WEIGHTS_V1,
    buildRankerContext,
    likingValue,
    promptForPlayback,
    promptForSeasonEpisode,
    rerankWithTaste,
    scoreWithRanker,
} from './taste-ranker'

function item(partial: Partial<Top10Content> & Pick<Top10Content, 'id' | 'title' | 'type'>): Top10Content {
    return {
        overview: '',
        poster_path: '/x.jpg',
        release_date: '2024-01-01',
        vote_average: 7,
        vote_count: 400,
        genre_ids: [18],
        adult: false,
        original_language: 'en',
        popularity: 40,
        tmdb_id: partial.id,
        ...partial,
    }
}

describe('taste-ranker', () => {
    it('chiede il giudizio a meta e a fine stagione, non a ogni puntata', () => {
        expect(promptForSeasonEpisode(4, 8)).toBe('mid_season')
        expect(promptForSeasonEpisode(8, 8)).toBe('end_season')
        expect(promptForSeasonEpisode(3, 8)).toBeNull()
        expect(promptForSeasonEpisode(1, 1)).toBe('end_season')
        expect(promptForSeasonEpisode(2, 3)).toBeNull()
        expect(promptForPlayback({ type: 'movie' })).toBe('end_movie')
        expect(promptForPlayback({ type: 'tv', episode: 4, episodeCount: 8 })).toBe('mid_season')
    })

    it('mette in testa il titolo votato entusiasta e abbassa, senza seppellirlo, quello che non riguarderebbe', () => {
        const loved = item({ id: 1, title: 'Amato', type: 'tv', popularity: 10, genre_ids: [18] })
        const rejected = item({ id: 2, title: 'No', type: 'tv', popularity: 90, genre_ids: [18] })
        const other = item({ id: 3, title: 'Altro', type: 'tv', popularity: 50, genre_ids: [35] })
        const context = buildRankerContext(
            [],
            [
                {
                    tmdbId: 1,
                    type: 'tv',
                    season: 1,
                    moment: 'mid_season',
                    liking: 'thrilled',
                    wouldContinue: null,
                    updatedAt: 1,
                },
                {
                    tmdbId: 2,
                    type: 'tv',
                    season: 1,
                    moment: 'end_season',
                    liking: 'yes',
                    wouldContinue: 'no',
                    updatedAt: 1,
                },
            ],
            [18]
        )
        const ranked = rerankWithTaste([rejected, other, loved], context)
        const onlyRewatchNo = buildRankerContext(
            [],
            [
                {
                    tmdbId: 2,
                    type: 'tv',
                    season: 1,
                    moment: 'end_movie',
                    liking: 'yes',
                    wouldContinue: 'no',
                    updatedAt: 1,
                },
            ],
            [18]
        )
        const withoutRewatchNo = buildRankerContext(
            [],
            [
                {
                    tmdbId: 2,
                    type: 'tv',
                    season: 1,
                    moment: 'end_movie',
                    liking: 'yes',
                    wouldContinue: null,
                    updatedAt: 1,
                },
            ],
            [18]
        )
        expect(ranked[0].id).toBe(1)
        expect(scoreWithRanker(rejected, onlyRewatchNo, 90)).toBeCloseTo(
            scoreWithRanker(rejected, withoutRewatchNo, 90) - RANKER_WEIGHTS_V1.continueNo
        )
        expect(scoreWithRanker(rejected, onlyRewatchNo, 90)).toBeGreaterThan(0)
    })

    it('tiene i pesi v1 sostituibili senza cambiare il contratto', () => {
        expect(RANKER_WEIGHTS_V1.version).toBe('v1')
        expect(likingValue('thrilled')).toBeGreaterThan(likingValue('yes'))
        expect(likingValue('skipped')).toBe(0)
    })
})
