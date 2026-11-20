import { describe, expect, it } from 'vitest'
import {
    matchesLanguage,
    findMatchingSubtitleIndex,
    SUPPORTED_LANGUAGES,
} from './LanguageContext'

describe('LanguageContext Helpers', () => {
    it('defines the three required languages: IT, ING, DE', () => {
        const labels = SUPPORTED_LANGUAGES.map((l) => l.label)
        expect(labels).toEqual(['IT', 'ING', 'DE'])
    })

    describe('matchesLanguage', () => {
        it('matches Italian formats', () => {
            expect(matchesLanguage('ita', 'it')).toBe(true)
            expect(matchesLanguage('Italian', 'it')).toBe(true)
            expect(matchesLanguage('Italiano [CC]', 'it')).toBe(true)
            expect(matchesLanguage('English', 'it')).toBe(false)
        })

        it('matches English formats', () => {
            expect(matchesLanguage('eng', 'en')).toBe(true)
            expect(matchesLanguage('English', 'en')).toBe(true)
            expect(matchesLanguage('Inglese', 'en')).toBe(true)
            expect(matchesLanguage('German', 'en')).toBe(false)
        })

        it('matches German formats', () => {
            expect(matchesLanguage('deu', 'de')).toBe(true)
            expect(matchesLanguage('ger', 'de')).toBe(true)
            expect(matchesLanguage('German', 'de')).toBe(true)
            expect(matchesLanguage('Deutsch', 'de')).toBe(true)
            expect(matchesLanguage('Tedesco', 'de')).toBe(true)
            expect(matchesLanguage('Italiano', 'de')).toBe(false)
        })

        it('returns false safely on empty/undefined strings', () => {
            expect(matchesLanguage(undefined, 'it')).toBe(false)
            expect(matchesLanguage('', 'it')).toBe(false)
        })
    })

    describe('findMatchingSubtitleIndex', () => {
        const sampleTracks = [
            { id: 0, name: 'English', lang: 'eng' },
            { id: 1, name: 'Italian', lang: 'ita' },
            { id: 2, name: 'French', lang: 'fre' },
        ]

        it('finds Italian at index 1', () => {
            expect(findMatchingSubtitleIndex(sampleTracks, 'it')).toBe(1)
        })

        it('finds English at index 0', () => {
            expect(findMatchingSubtitleIndex(sampleTracks, 'en')).toBe(0)
        })

        it('returns -1 when German is missing (fallback scenario)', () => {
            expect(findMatchingSubtitleIndex(sampleTracks, 'de')).toBe(-1)
        })

        it('handles empty tracks array', () => {
            expect(findMatchingSubtitleIndex([], 'it')).toBe(-1)
        })
    })
})
