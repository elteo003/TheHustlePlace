'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type LanguageCode = 'it' | 'en' | 'de'

export interface LanguageOption {
    code: LanguageCode
    label: string
    fullName: string
    subMatches: string[]
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
    {
        code: 'it',
        label: 'IT',
        fullName: 'Italiano',
        subMatches: ['it', 'ita', 'italian', 'italiano'],
    },
    {
        code: 'en',
        label: 'ING',
        fullName: 'Inglese',
        subMatches: ['en', 'eng', 'english', 'inglese'],
    },
    {
        code: 'de',
        label: 'DE',
        fullName: 'Tedesco',
        subMatches: ['de', 'deu', 'ger', 'german', 'deutsch', 'tedesco'],
    },
]

export const STORAGE_KEY_LANGUAGE = 'thehustleplace_preferred_lang'

export interface SubtitleTrackInfo {
    id: number
    name: string
    lang?: string
    isDefault?: boolean
}

export interface SubtitleFallbackNotice {
    requestedLanguage: string
    requestedLabel: string
    resolvedLanguage: string
    isFallback: boolean
}

interface LanguageContextType {
    language: LanguageCode
    setLanguage: (lang: LanguageCode) => void
    currentOption: LanguageOption
    options: LanguageOption[]
    matchesLanguage: (text: string | undefined, lang: LanguageCode) => boolean
    findMatchingSubtitleIndex: (
        tracks: Array<{ lang?: string; name?: string }>,
        lang: LanguageCode
    ) => number
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function matchesLanguage(text: string | undefined, lang: LanguageCode): boolean {
    if (!text) return false
    const normalized = text.toLowerCase().trim()
    const option = SUPPORTED_LANGUAGES.find((opt) => opt.code === lang)
    if (!option) return false
    return option.subMatches.some((match) => normalized.includes(match))
}

export function findMatchingSubtitleIndex(
    tracks: Array<{ lang?: string; name?: string }>,
    lang: LanguageCode
): number {
    if (!Array.isArray(tracks) || tracks.length === 0) return -1
    return tracks.findIndex((t) => {
        const text = `${t.lang || ''} ${t.name || ''}`.trim()
        return matchesLanguage(text, lang)
    })
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<LanguageCode>('it')

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY_LANGUAGE)
            if (stored === 'it' || stored === 'en' || stored === 'de') {
                setLanguageState(stored)
            }
        } catch {
            // ignore localStorage errors (e.g. iframe / private mode)
        }
    }, [])

    const setLanguage = (newLang: LanguageCode) => {
        setLanguageState(newLang)
        try {
            localStorage.setItem(STORAGE_KEY_LANGUAGE, newLang)
        } catch {
            // ignore
        }
    }

    const currentOption = useMemo(
        () => SUPPORTED_LANGUAGES.find((opt) => opt.code === language) ?? SUPPORTED_LANGUAGES[0],
        [language]
    )

    const value = useMemo(
        () => ({
            language,
            setLanguage,
            currentOption,
            options: SUPPORTED_LANGUAGES,
            matchesLanguage,
            findMatchingSubtitleIndex,
        }),
        [language, currentOption]
    )

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (!context) {
        // Fallback for isolated components or tests without provider
        return {
            language: 'it' as LanguageCode,
            setLanguage: () => undefined,
            currentOption: SUPPORTED_LANGUAGES[0],
            options: SUPPORTED_LANGUAGES,
            matchesLanguage,
            findMatchingSubtitleIndex,
        }
    }
    return context
}
