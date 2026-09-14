import { describe, expect, it, vi } from 'vitest'
import {
    PLAYER_RESOLVE_ATTEMPTS,
    fetchResolvedPlayback,
    isMissingVixsrcStreamError,
    isRetryablePlayerResolveStatus,
} from './player-resolve'

describe('player-resolve', () => {
    it('riconosce i 502 transitori e gli errori di titolo assente', () => {
        expect(isRetryablePlayerResolveStatus(502)).toBe(true)
        expect(isRetryablePlayerResolveStatus(400)).toBe(false)
        expect(isMissingVixsrcStreamError('Risposta API VixSrc senza embed')).toBe(true)
        expect(isMissingVixsrcStreamError('Impossibile risolvere lo stream')).toBe(false)
    })

    it('riprova un 502 e usa lo stream al tentativo successivo', async () => {
        const fetchImpl = vi
            .fn<typeof fetch>()
            .mockResolvedValueOnce(
                new Response(JSON.stringify({ success: false, error: 'Risposta API VixSrc senza embed' }), {
                    status: 502,
                })
            )
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        success: true,
                        data: { master: '#EXTM3U', parts: { p0: '#EXTM3U' }, videoId: 629782 },
                    }),
                    { status: 200 }
                )
            )

        const result = await fetchResolvedPlayback(
            new URLSearchParams({ tmdbId: '1399', type: 'tv', season: '5', episode: '7' }),
            { fetch: fetchImpl, wait: async () => undefined }
        )

        expect(fetchImpl).toHaveBeenCalledTimes(2)
        expect(result.data?.videoId).toBe(629782)
        expect(result.missing).toBe(false)
        expect(result.error).toBe('')
    })

    it('non ritenta un 400', async () => {
        const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
            new Response(JSON.stringify({ success: false, error: 'Stagione o episodio mancanti' }), {
                status: 400,
            })
        )

        const result = await fetchResolvedPlayback(new URLSearchParams({ tmdbId: '1399', type: 'tv' }), {
            fetch: fetchImpl,
            wait: async () => undefined,
        })

        expect(fetchImpl).toHaveBeenCalledTimes(1)
        expect(result.data).toBeUndefined()
        expect(result.missing).toBe(true)
        expect(result.error).toBe('Stagione o episodio mancanti')
    })

    it('esauriti i tentativi tiene l’ultimo errore', async () => {
        const fetchImpl = vi.fn(async () => {
            return new Response(JSON.stringify({ success: false, error: 'API VixSrc non disponibile (403)' }), {
                status: 502,
            })
        })

        const result = await fetchResolvedPlayback(new URLSearchParams({ tmdbId: '1', type: 'movie' }), {
            fetch: fetchImpl,
            wait: async () => undefined,
        })

        expect(fetchImpl).toHaveBeenCalledTimes(PLAYER_RESOLVE_ATTEMPTS)
        expect(result.data).toBeUndefined()
        expect(result.missing).toBe(false)
        expect(result.error).toBe('API VixSrc non disponibile (403)')
    })
})
