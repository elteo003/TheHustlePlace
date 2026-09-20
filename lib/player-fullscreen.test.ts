import { describe, expect, it, vi } from 'vitest'
import { isPlayerFullscreen, togglePlayerFullscreen } from '@/lib/player-fullscreen'

describe('isPlayerFullscreen', () => {
    it('legge fullscreenElement, webkit e il video iOS', () => {
        const box = {} as Element
        expect(isPlayerFullscreen(null, { fullscreenElement: null } as Document)).toBe(false)
        expect(isPlayerFullscreen(null, { fullscreenElement: box } as Document)).toBe(true)
        expect(
            isPlayerFullscreen(null, {
                fullscreenElement: null,
                webkitFullscreenElement: box,
            } as Document)
        ).toBe(true)
        expect(
            isPlayerFullscreen({ webkitDisplayingFullscreen: true } as HTMLVideoElement, {
                fullscreenElement: null,
            } as Document)
        ).toBe(true)
    })
})

describe('togglePlayerFullscreen', () => {
    it('preferisce requestFullscreen sul stage quando c’è', async () => {
        const requestFullscreen = vi.fn().mockResolvedValue(undefined)
        const webkitEnterFullscreen = vi.fn()
        await togglePlayerFullscreen(
            { requestFullscreen } as unknown as HTMLElement,
            { webkitEnterFullscreen } as unknown as HTMLVideoElement,
            { fullscreenElement: null, fullscreenEnabled: true } as Document
        )
        expect(requestFullscreen).toHaveBeenCalled()
        expect(webkitEnterFullscreen).not.toHaveBeenCalled()
    })

    it('su iOS usa webkitEnterFullscreen se il div non può entrare', async () => {
        const webkitEnterFullscreen = vi.fn()
        await togglePlayerFullscreen(
            {} as HTMLElement,
            {
                webkitEnterFullscreen,
                webkitSupportsFullscreen: true,
            } as unknown as HTMLVideoElement,
            { fullscreenElement: null, fullscreenEnabled: false } as Document
        )
        expect(webkitEnterFullscreen).toHaveBeenCalled()
    })

    it('esce se è già in fullscreen', async () => {
        const exitFullscreen = vi.fn().mockResolvedValue(undefined)
        const stage = {} as HTMLElement
        await togglePlayerFullscreen(stage, null, {
            fullscreenElement: stage,
            exitFullscreen,
        } as unknown as Document)
        expect(exitFullscreen).toHaveBeenCalled()
    })
})
