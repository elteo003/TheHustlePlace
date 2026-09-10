import { describe, expect, it } from 'vitest'
import {
    VIXSRC_PART_PREFIX,
    buildVixsrcPlaylistUrl,
    classifyHlsRef,
    isAllowedHlsUrl,
    isM3u8Playlist,
    parseVixsrcApiSrc,
    parseVixsrcEmbedHtml,
    rewriteM3u8,
    rewriteM3u8Browser,
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

describe('parseVixsrcApiSrc', () => {
    it('legge src da JSON, Jina e AllOrigins', () => {
        expect(parseVixsrcApiSrc('{"src":"\\/embed\\/1?token=a"}')).toBe('/embed/1?token=a')
        expect(parseVixsrcApiSrc('Title:\n\nMarkdown Content:\n{"src":"\\/embed\\/2"}')).toBe('/embed/2')
        expect(parseVixsrcApiSrc('{"contents":"{\\"src\\":\\"/embed/3\\"}"}')).toBe('/embed/3')
    })
})

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

describe('classifyHlsRef', () => {
    it('separa CDN, playlist, chiave e host esterni', () => {
        expect(classifyHlsRef('https://sc-u10-01.vix-content.net/hls/a.ts')).toBe('cdn')
        expect(classifyHlsRef('https://vixsrc.to/playlist/1?type=video')).toBe('playlist')
        expect(classifyHlsRef('https://vixsrc.to/storage/enc.key')).toBe('key')
        expect(classifyHlsRef('https://spbgc.com/ad.ts')).toBe('drop')
    })
})

describe('rewriteM3u8Browser', () => {
    it('lascia i segmenti sul CDN, inlinea la chiave e marca le playlist figlie', () => {
        const source = 'https://vixsrc.to/playlist/170060?type=video'
        const body = [
            '#EXTM3U',
            '#EXT-X-KEY:METHOD=AES-128,URI="https://vixsrc.to/storage/enc.key"',
            '#EXTINF:8,',
            'https://sc-u10-01.vix-content.net/hls/0000.ts?token=abc',
            'https://spbgc.com/ad.ts',
        ].join('\n')

        const rewritten = rewriteM3u8Browser(body, source, (absolute, kind) => {
            if (kind === 'cdn') return absolute
            if (kind === 'key') return 'data:application/octet-stream;base64,QQ=='
            return `${VIXSRC_PART_PREFIX}p0`
        })

        expect(rewritten).toContain('URI="data:application/octet-stream;base64,QQ=="')
        expect(rewritten).toContain('https://sc-u10-01.vix-content.net/hls/0000.ts?token=abc')
        expect(rewritten).not.toContain('spbgc.com')
        expect(rewritten).not.toContain('/api/player/hls')
    })
})

describe('isM3u8Playlist', () => {
    it('riconosce il manifest dal content-type o dal body', () => {
        expect(isM3u8Playlist('application/vnd.apple.mpegurl', 'nope')).toBe(true)
        expect(isM3u8Playlist('application/octet-stream', '#EXTM3U\n#EXT-X-VERSION:3')).toBe(true)
        expect(isM3u8Playlist('video/MP2T', 'binary')).toBe(false)
    })
})
