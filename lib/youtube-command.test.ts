import { describe, expect, it } from 'vitest'
import { isYouTubeEndedMessage, parseYouTubePlayerMessage, readYouTubePlayerState } from '@/lib/youtube-command'

describe('parseYouTubePlayerMessage', () => {
    it('legge onStateChange da stringa JSON', () => {
        expect(parseYouTubePlayerMessage('{"event":"onStateChange","info":0}')).toEqual({
            event: 'onStateChange',
            info: 0,
        })
    })

    it('ignora payload non validi', () => {
        expect(parseYouTubePlayerMessage('not-json')).toBeNull()
        expect(parseYouTubePlayerMessage({ foo: 1 })).toBeNull()
    })
})

describe('isYouTubeEndedMessage', () => {
    it('riconosce solo ended da youtube.com', () => {
        expect(isYouTubeEndedMessage('https://www.youtube.com', { event: 'onStateChange', info: 0 })).toBe(true)
        expect(isYouTubeEndedMessage('https://www.youtube.com', { event: 'onStateChange', info: 1 })).toBe(false)
        expect(isYouTubeEndedMessage('https://evil.example', { event: 'onStateChange', info: 0 })).toBe(false)
    })
})

describe('readYouTubePlayerState', () => {
    it('restituisce lo stato numerico di onStateChange', () => {
        expect(readYouTubePlayerState('https://www.youtube.com', { event: 'onStateChange', info: 1 })).toBe(1)
        expect(readYouTubePlayerState('https://www.youtube.com', { event: 'infoDelivery' })).toBeNull()
    })
})
