import { beforeEach, describe, expect, it, vi } from 'vitest'

const cookiesGet = vi.fn()
const headersGet = vi.fn()
const listWatchHistory = vi.fn()
const isDatabaseConfigured = vi.fn()

vi.mock('next/headers', () => ({
    cookies: async () => ({ get: cookiesGet }),
    headers: async () => ({ get: headersGet }),
}))

vi.mock('@/lib/db/watch-history', () => ({
    listWatchHistory: (...args: unknown[]) => listWatchHistory(...args),
    isDatabaseConfigured: () => isDatabaseConfigured(),
}))

vi.mock('@/services/catalog.service', () => ({
    CatalogService: class {
        getPersonalRails() {
            return { personalized: false, picks: [], affinity: [], treasures: [], seedTitle: '' }
        }
        getEditorialRails() {
            return {}
        }
        getTop10Mixed() {
            return []
        }
        getComingSoon() {
            return []
        }
    },
}))

import { fetchServerWatchHistory } from './catalog'
import { DEVICE_COOKIE, DEVICE_HEADER } from '@/lib/supabase/device'

const DEVICE = '11111111-1111-4111-8111-111111111111'
const OTHER = '22222222-2222-4222-8222-222222222222'

describe('fetchServerWatchHistory', () => {
    beforeEach(() => {
        cookiesGet.mockReset()
        headersGet.mockReset()
        listWatchHistory.mockReset()
        isDatabaseConfigured.mockReturnValue(true)
    })

    it('legge lo storico dal header TV se manca il cookie', async () => {
        cookiesGet.mockReturnValue(undefined)
        headersGet.mockImplementation((name: string) => (name === DEVICE_HEADER ? DEVICE : null))
        listWatchHistory.mockResolvedValue([{ id: 1, type: 'movie', progress: 40, watchedAt: 9 }])

        await expect(fetchServerWatchHistory()).resolves.toEqual([
            { id: 1, type: 'movie', progress: 40, watchedAt: 9 },
        ])
        expect(listWatchHistory).toHaveBeenCalledWith(DEVICE)
    })

    it('preferisce il cookie al header', async () => {
        cookiesGet.mockImplementation((name: string) =>
            name === DEVICE_COOKIE ? { value: OTHER } : undefined
        )
        headersGet.mockImplementation((name: string) => (name === DEVICE_HEADER ? DEVICE : null))
        listWatchHistory.mockResolvedValue([])

        await fetchServerWatchHistory()
        expect(listWatchHistory).toHaveBeenCalledWith(OTHER)
    })
})
