import { describe, expect, it } from 'vitest'
import { parseVixsrcPlayerMessage } from '@/lib/vixsrc-player-events'

const origin = 'https://vixsrc.to'

describe('parseVixsrcPlayerMessage', () => {
    it('legge il formato inoltrato da VixSrc (event)', () => {
        const parsed = parseVixsrcPlayerMessage(origin, {
            type: 'PLAYER_EVENT',
            event: { event: 'timeupdate', currentTime: 1847, duration: 3600, video_id: 550 },
        })
        expect(parsed).toEqual({
            event: 'timeupdate',
            currentTime: 1847,
            duration: 3600,
            video_id: 550,
        })
    })

    it('legge il formato della documentazione (data)', () => {
        const parsed = parseVixsrcPlayerMessage(origin, {
            type: 'PLAYER_EVENT',
            data: { event: 'pause', currentTime: 12, duration: 100 },
        })
        expect(parsed).toMatchObject({ event: 'pause', currentTime: 12, duration: 100 })
    })

    it('ignora origini e type non validi', () => {
        expect(
            parseVixsrcPlayerMessage('https://evil.example', {
                type: 'PLAYER_EVENT',
                event: { event: 'ended', currentTime: 1, duration: 1 },
            })
        ).toBeNull()
        expect(parseVixsrcPlayerMessage(origin, { type: 'ended' })).toBeNull()
    })
})
