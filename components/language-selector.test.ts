import { describe, expect, it } from 'vitest'
import { SUPPORTED_LANGUAGES, matchesLanguage, findMatchingSubtitleIndex } from '@/contexts/LanguageContext'

describe('Language Selector & Subtitle Fallback Unit Tests', () => {
    it('supports exact language options: IT, ING, DE', () => {
        expect(SUPPORTED_LANGUAGES).toHaveLength(3)
        expect(SUPPORTED_LANGUAGES.map((l) => l.label)).toEqual(['IT', 'ING', 'DE'])
        expect(SUPPORTED_LANGUAGES.map((l) => l.code)).toEqual(['it', 'en', 'de'])
    })

    describe('Subtitle track matching across languages', () => {
        const streamTracks = [
            { id: 0, name: 'English', lang: 'eng' },
            { id: 1, name: 'Italian', lang: 'ita' },
            { id: 2, name: 'English [CC]', lang: 'eng' },
            { id: 3, name: 'French', lang: 'fre' },
        ]

        it('identifies Italian subtitle track correctly', () => {
            const idx = findMatchingSubtitleIndex(streamTracks, 'it')
            expect(idx).toBe(1)
            expect(streamTracks[idx].name).toBe('Italian')
        })

        it('identifies English subtitle track correctly', () => {
            const idx = findMatchingSubtitleIndex(streamTracks, 'en')
            expect(idx).toBe(0)
            expect(streamTracks[idx].name).toBe('English')
        })

        it('identifies missing German track and provides fallback condition', () => {
            const idx = findMatchingSubtitleIndex(streamTracks, 'de')
            expect(idx).toBe(-1)

            // When German is requested but missing, fallback logic checks English or Italian
            const fallbackIdx = streamTracks.findIndex((t) => matchesLanguage(t.lang || t.name, 'en')) !== -1
                ? streamTracks.findIndex((t) => matchesLanguage(t.lang || t.name, 'en'))
                : streamTracks.findIndex((t) => matchesLanguage(t.lang || t.name, 'it')) !== -1
                ? streamTracks.findIndex((t) => matchesLanguage(t.lang || t.name, 'it'))
                : 0

            expect(fallbackIdx).toBe(0)
            expect(streamTracks[fallbackIdx].name).toBe('English')
        })

        it('detects German when stream contains German or Deutsch', () => {
            const germanStreamTracks = [
                { id: 0, name: 'Deutsch', lang: 'deu' },
                { id: 1, name: 'English', lang: 'eng' },
            ]
            const idx = findMatchingSubtitleIndex(germanStreamTracks, 'de')
            expect(idx).toBe(0)
        })
    })
})
