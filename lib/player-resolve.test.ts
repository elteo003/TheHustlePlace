import { describe, expect, it, vi } from 'vitest'
import {
    PLAYER_RESOLVE_ATTEMPTS,
    RELAY_CONFIG_PATH,
    directRelayResolveUrl,
    fetchResolvedPlayback,
    isMissingVixsrcStreamError,
    isRetryablePlayerResolveStatus,
} from './player-resolve'

const RELAY = 'https://casa.trycloudflare.com'
const STREAM = {
    success: true,
    data: { master: '#EXTM3U', parts: { p0: '#EXTM3U\nhttps://sc-u15-01.example.xyz/a.m4s' }, videoId: 629782 },
}

function requestUrl(input: RequestInfo | URL): string {
    if (typeof input === 'string') return input
    if (input instanceof URL) return input.toString()
    return input.url
}

function mockFetch(handlers: { relay?: string | null; resolve: (url: string) => Response | Promise<Response> }) {
    return vi.fn<typeof fetch>(async (input) => {
        const url = requestUrl(input)
        if (url === RELAY_CONFIG_PATH) {
            return new Response(JSON.stringify({ success: true, url: handlers.relay ?? null }), { status: 200 })
        }
        return handlers.resolve(url)
    })
}

describe('player-resolve', () => {
    it('riconosce i 502 transitori e gli errori di titolo assente', () => {
        expect(isRetryablePlayerResolveStatus(502)).toBe(true)
        expect(isRetryablePlayerResolveStatus(400)).toBe(false)
        expect(isMissingVixsrcStreamError('Risposta API VixSrc senza embed')).toBe(true)
        expect(isMissingVixsrcStreamError('playlist non trovata')).toBe(true)
        expect(isMissingVixsrcStreamError('Impossibile risolvere lo stream')).toBe(false)
        expect(directRelayResolveUrl('https://evil.example', new URLSearchParams())).toBeNull()
        expect(directRelayResolveUrl(RELAY, new URLSearchParams({ tmdbId: '1', type: 'movie' }))).toBe(
            `${RELAY}/resolve?tmdbId=1&type=movie`
        )
    })

    it('riprova un 502 e usa lo stream al tentativo successivo', async () => {
        const fetchImpl = mockFetch({
            resolve: vi
                .fn()
                .mockReturnValueOnce(
                    new Response(JSON.stringify({ success: false, error: 'Risposta API VixSrc senza embed' }), {
                        status: 502,
                    })
                )
                .mockReturnValueOnce(new Response(JSON.stringify(STREAM), { status: 200 })),
        })

        const result = await fetchResolvedPlayback(
            new URLSearchParams({ tmdbId: '1399', type: 'tv', season: '5', episode: '7' }),
            { fetch: fetchImpl, wait: async () => undefined }
        )

        expect(fetchImpl).toHaveBeenCalledTimes(3)
        expect(result.data?.videoId).toBe(629782)
        expect(result.missing).toBe(false)
        expect(result.error).toBe('')
    })

    it('non ritenta un 400', async () => {
        const fetchImpl = mockFetch({
            resolve: () =>
                new Response(JSON.stringify({ success: false, error: 'Stagione o episodio mancanti' }), {
                    status: 400,
                }),
        })

        const result = await fetchResolvedPlayback(new URLSearchParams({ tmdbId: '1399', type: 'tv' }), {
            fetch: fetchImpl,
            wait: async () => undefined,
        })

        expect(fetchImpl).toHaveBeenCalledTimes(2)
        expect(result.data).toBeUndefined()
        expect(result.missing).toBe(true)
        expect(result.error).toBe('Stagione o episodio mancanti')
    })

    it('esauriti i tentativi tiene l’ultimo errore', async () => {
        const fetchImpl = mockFetch({
            resolve: async () =>
                new Response(JSON.stringify({ success: false, error: 'API VixSrc non disponibile (403)' }), {
                    status: 502,
                }),
        })

        const result = await fetchResolvedPlayback(new URLSearchParams({ tmdbId: '1', type: 'movie' }), {
            fetch: fetchImpl,
            wait: async () => undefined,
        })

        expect(fetchImpl).toHaveBeenCalledTimes(1 + PLAYER_RESOLVE_ATTEMPTS)
        expect(result.data).toBeUndefined()
        expect(result.missing).toBe(false)
        expect(result.error).toBe('API VixSrc non disponibile (403)')
    })

    it('prende lo stream dal relay di casa e non chiama Vercel', async () => {
        const fetchImpl = mockFetch({
            relay: RELAY,
            resolve: (url) => {
                expect(url.startsWith(`${RELAY}/resolve?`)).toBe(true)
                return new Response(JSON.stringify(STREAM), { status: 200 })
            },
        })

        const result = await fetchResolvedPlayback(new URLSearchParams({ tmdbId: '1', type: 'movie' }), {
            fetch: fetchImpl,
            wait: async () => undefined,
        })

        expect(result.data?.videoId).toBe(629782)
        const urls = fetchImpl.mock.calls.map((call) => requestUrl(call[0]))
        expect(urls).toEqual([RELAY_CONFIG_PATH, `${RELAY}/resolve?tmdbId=1&type=movie`])
    })

    it('se il relay non risponde ripiega su Vercel', async () => {
        const fetchImpl = mockFetch({
            relay: RELAY,
            resolve: (url) => {
                if (url.startsWith(RELAY)) throw new Error('tunnel giù')
                return new Response(JSON.stringify(STREAM), { status: 200 })
            },
        })

        const result = await fetchResolvedPlayback(new URLSearchParams({ tmdbId: '1', type: 'movie' }), {
            fetch: fetchImpl,
            wait: async () => undefined,
        })

        expect(result.data?.videoId).toBe(629782)
        const urls = fetchImpl.mock.calls.map((call) => requestUrl(call[0]))
        expect(urls).toContain('/api/player/resolve?tmdbId=1&type=movie')
    })

    it('un 401 del relay ripiega su Vercel', async () => {
        const fetchImpl = mockFetch({
            relay: RELAY,
            resolve: (url) => {
                if (url.startsWith(RELAY)) {
                    return new Response(JSON.stringify({ success: false, error: 'unauthorized' }), { status: 401 })
                }
                return new Response(JSON.stringify(STREAM), { status: 200 })
            },
        })

        const result = await fetchResolvedPlayback(new URLSearchParams({ tmdbId: '1', type: 'movie' }), {
            fetch: fetchImpl,
            wait: async () => undefined,
        })

        expect(result.data?.videoId).toBe(629782)
        const urls = fetchImpl.mock.calls.map((call) => requestUrl(call[0]))
        expect(urls).toContain('/api/player/resolve?tmdbId=1&type=movie')
    })

    it('un titolo assente sul relay non passa da Vercel', async () => {
        const fetchImpl = mockFetch({
            relay: RELAY,
            resolve: () =>
                new Response(JSON.stringify({ success: false, error: 'playlist non trovata' }), { status: 502 }),
        })

        const result = await fetchResolvedPlayback(new URLSearchParams({ tmdbId: '1', type: 'movie' }), {
            fetch: fetchImpl,
            wait: async () => undefined,
        })

        expect(result.missing).toBe(true)
        const urls = fetchImpl.mock.calls.map((call) => requestUrl(call[0]))
        expect(urls.some((url) => url.includes('/api/player/resolve'))).toBe(false)
    })
})
