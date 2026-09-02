import { describe, expect, it } from 'vitest'
import { buildTrailerEmbedUrl } from '@/hooks/useTrailerPreview'

describe('buildTrailerEmbedUrl', () => {
    it('mantiene autoplay e loop, e rispetta il mute', () => {
        const muted = new URL(buildTrailerEmbedUrl('abc123', true))
        const loud = new URL(buildTrailerEmbedUrl('abc123', false))

        expect(muted.pathname).toBe('/embed/abc123')
        expect(muted.searchParams.get('mute')).toBe('1')
        expect(muted.searchParams.get('playsinline')).toBe('1')
        expect(loud.searchParams.get('mute')).toBe('0')
    })
})
