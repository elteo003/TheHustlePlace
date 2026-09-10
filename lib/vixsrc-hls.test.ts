import { describe, expect, it } from 'vitest'
import {
    buildVixsrcPlaylistUrl,
    isAllowedHlsUrl,
    isM3u8Playlist,
    parseVixsrcEmbedHtml,
    rewriteM3u8,
} from './vixsrc-hls'

const embedHtml = `
        window.video = {
            id: '170060',
            filename: '',
        };
        window.masterPlaylist = {
            params: {
                'token': 'abc123',
                'expires': '1794259445',
                'asn': '',
            },
            url: 'https://vixsrc.to/playlist/170060?b=1',
        }
        window.canPlayFHD = true
        <script>(function(s){s.dataset.zone='10874703',s.src='https://spbgc.com/tag.min.js'})</script>
`

describe('parseVixsrcEmbedHtml', () => {
    it('legge token, playlist e id senza eseguire lo script ads', () => {
        expect(parseVixsrcEmbedHtml(embedHtml)).toEqual({
            url: 'https://vixsrc.to/playlist/170060?b=1',
            token: 'abc123',
            expires: '1794259445',
            canPlayFHD: true,
            videoId: 170060,
        })
    })

    it('torna null se manca la playlist', () => {
        expect(parseVixsrcEmbedHtml('<script>window.canPlayFHD = true</script>')).toBeNull()
    })
})

describe('buildVixsrcPlaylistUrl', () => {
    it('firma la playlist come fa lo skin VixSrc', () => {
        const url = buildVixsrcPlaylistUrl({
            url: 'https://vixsrc.to/playlist/170060?b=1',
            token: 'abc123',
            expires: '1794259445',
            canPlayFHD: true,
        })
        const parsed = new URL(url)
        expect(parsed.origin + parsed.pathname).toBe('https://vixsrc.to/playlist/170060')
        expect(parsed.searchParams.get('b')).toBe('1')
        expect(parsed.searchParams.get('token')).toBe('abc123')
        expect(parsed.searchParams.get('expires')).toBe('1794259445')
        expect(parsed.searchParams.get('h')).toBe('1')
        expect(parsed.searchParams.get('lang')).toBe('it')
    })
})

describe('isAllowedHlsUrl', () => {
    it('accetta solo host VixSrc / CDN film', () => {
        expect(isAllowedHlsUrl('https://vixsrc.to/playlist/1')).toBe(true)
        expect(isAllowedHlsUrl('https://sc-u11-01.vix-content.net/hls/a.ts')).toBe(true)
        expect(isAllowedHlsUrl('https://spbgc.com/tag.min.js')).toBe(false)
        expect(isAllowedHlsUrl('https://evil.example/playlist')).toBe(false)
        expect(isAllowedHlsUrl('http://vixsrc.to/playlist/1')).toBe(false)
    })
})

describe('rewriteM3u8', () => {
    it('riscrive URI e varianti verso il proxy, scarta host esterni', () => {
        const source = 'https://vixsrc.to/playlist/170060?b=1'
        const body = [
            '#EXTM3U',
            '#EXT-X-MEDIA:TYPE=AUDIO,URI="https://vixsrc.to/playlist/170060?type=audio"',
            '#EXT-X-STREAM-INF:BANDWIDTH=1000',
            'https://vixsrc.to/playlist/170060?type=video&rendition=720p',
            'https://spbgc.com/ad.ts',
        ].join('\n')

        const rewritten = rewriteM3u8(body, source, '/api/player/hls?u=')
        expect(rewritten).toContain(
            `URI="/api/player/hls?u=${encodeURIComponent('https://vixsrc.to/playlist/170060?type=audio')}"`
        )
        expect(rewritten).toContain(
            `/api/player/hls?u=${encodeURIComponent('https://vixsrc.to/playlist/170060?type=video&rendition=720p')}`
        )
        expect(rewritten).not.toContain('spbgc.com')
    })
})

describe('isM3u8Playlist', () => {
    it('riconosce il manifest dal content-type o dal body', () => {
        expect(isM3u8Playlist('application/vnd.apple.mpegurl', 'nope')).toBe(true)
        expect(isM3u8Playlist('application/octet-stream', '#EXTM3U\n#EXT-X-VERSION:3')).toBe(true)
        expect(isM3u8Playlist('video/MP2T', 'binary')).toBe(false)
    })
})
