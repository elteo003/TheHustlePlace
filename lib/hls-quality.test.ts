import { describe, expect, it } from 'vitest'
import { pickHighestHlsLevel } from './hls-quality'

describe('pickHighestHlsLevel', () => {
    it('sceglie la risoluzione più alta, poi il bitrate', () => {
        expect(pickHighestHlsLevel([])).toBe(0)
        expect(
            pickHighestHlsLevel([
                { height: 480, bitrate: 1_080_000 },
                { height: 1080, bitrate: 4_500_000 },
                { height: 720, bitrate: 1_800_000 },
            ])
        ).toBe(1)
        expect(
            pickHighestHlsLevel([
                { height: 1080, bitrate: 3_000_000 },
                { height: 1080, bitrate: 4_500_000 },
            ])
        ).toBe(1)
    })
})
