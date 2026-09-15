import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
    VIXSRC_EDGE_CDN_HOST_PATTERN,
    VIXSRC_ORIGIN_HOST_PATTERN,
} from '@/lib/vixsrc-cdn-allowlist'
import { collectDroppedHlsHosts } from '@/lib/vixsrc-hls'

describe('allowlist CDN VixSrc allineata al relay di casa', () => {
    it('usa gli stessi pattern in TypeScript e in relay.py', () => {
        const relay = readFileSync('zima/vixsrc-relay/relay.py', 'utf8')
        expect(relay).toContain(VIXSRC_ORIGIN_HOST_PATTERN)
        expect(relay).toContain(VIXSRC_EDGE_CDN_HOST_PATTERN)
    })
})

describe('collectDroppedHlsHosts', () => {
    it('elenca solo gli host scartati, non gli edge VixSrc', () => {
        const body = [
            '#EXTM3U',
            '#EXTINF:4,',
            'https://sc-u15-01.frozenfox90.fun/hls/a.m4s',
            'https://spbgc.com/ad.ts',
        ].join('\n')
        expect(collectDroppedHlsHosts(body, 'https://vixsrc.to/playlist/1')).toEqual(['spbgc.com'])
    })
})
