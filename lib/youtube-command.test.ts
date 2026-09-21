import { describe, expect, it } from 'vitest'
import {
    curtainActionForState,
    isYouTubeEndedMessage,
    parseYouTubePlayerMessage,
    readYouTubePlayerState,
} from '@/lib/youtube-command'

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

describe('curtainActionForState', () => {
    it('arma il clock solo al primo PLAYING', () => {
        expect(curtainActionForState(1, false, true)).toBe('arm')
        expect(curtainActionForState(1, true, true)).toBe('ignore')
        expect(curtainActionForState(3, false, true)).toBe('ignore')
    })

    it('al termine fa loop oppure ended solo dopo PLAYING', () => {
        expect(curtainActionForState(0, false, true)).toBe('ignore')
        expect(curtainActionForState(0, true, true)).toBe('loop')
        expect(curtainActionForState(0, true, false)).toBe('ended')
    })
})
