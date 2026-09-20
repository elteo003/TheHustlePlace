import { describe, expect, it } from 'vitest'
import {
    mediaTransportAction,
    shouldResumeUnexpectedPause,
    userPausedFromTransport,
} from '@/lib/playback-resume'

describe('shouldResumeUnexpectedPause', () => {
    it('riprende se la pausa non è dell’utente e non c’è un tasto recente', () => {
        expect(
            shouldResumeUnexpectedPause({
                ended: false,
                userPaused: false,
                lastUserInputAt: 0,
                now: 5000,
            })
        ).toBe(true)
    })

    it('non riprende se l’utente ha messo in pausa o la puntata è finita', () => {
        expect(
            shouldResumeUnexpectedPause({
                ended: false,
                userPaused: true,
                lastUserInputAt: 0,
                now: 5000,
            })
        ).toBe(false)
        expect(
            shouldResumeUnexpectedPause({
                ended: true,
                userPaused: false,
                lastUserInputAt: 0,
                now: 5000,
            })
        ).toBe(false)
    })

    it('non riprende se il tasto è appena stato premuto', () => {
        expect(
            shouldResumeUnexpectedPause({
                ended: false,
                userPaused: false,
                lastUserInputAt: 4800,
                now: 5000,
            })
        ).toBe(false)
    })
})

describe('mediaTransportAction', () => {
    it('riconosce play, pause e toggle webOS', () => {
        expect(mediaTransportAction('MediaPause', 0)).toBe('pause')
        expect(mediaTransportAction('', 19)).toBe('pause')
        expect(mediaTransportAction('MediaPlay', 0)).toBe('play')
        expect(mediaTransportAction('', 415)).toBe('play')
        expect(mediaTransportAction('MediaPlayPause', 0)).toBe('toggle')
        expect(mediaTransportAction('', 463)).toBe('toggle')
        expect(mediaTransportAction('ArrowRight', 39)).toBeNull()
    })

    it('imposta userPaused dal tasto trasporto', () => {
        expect(userPausedFromTransport('pause', false)).toBe(true)
        expect(userPausedFromTransport('play', true)).toBe(false)
        expect(userPausedFromTransport('toggle', false)).toBe(true)
        expect(userPausedFromTransport('toggle', true)).toBe(false)
    })
})
