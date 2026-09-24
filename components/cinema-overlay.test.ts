import { describe, expect, it } from 'vitest'
import {
    formatMediaTime,
    shouldHidePlayerCursor,
    shouldShowNextButton,
    shouldShowPlayerChrome,
} from '@/components/cinema-overlay'

describe('formatMediaTime', () => {
    it('formatta i secondi sotto l’ora', () => {
        expect(formatMediaTime(0)).toBe('0:00')
        expect(formatMediaTime(65)).toBe('1:05')
    })

    it('formatta le ore', () => {
        expect(formatMediaTime(3723)).toBe('1:02:03')
    })
})

describe('shouldHidePlayerCursor', () => {
    it('nasconde il cursore solo in play, chrome chiuso e mouse fermo', () => {
        expect(
            shouldHidePlayerCursor({ isTouch: false, playing: true, chromeOpen: false, idle: true })
        ).toBe(true)
    })

    it('lascia il cursore se i controlli sono aperti o il video è in pausa', () => {
        expect(
            shouldHidePlayerCursor({ isTouch: false, playing: true, chromeOpen: true, idle: true })
        ).toBe(false)
        expect(
            shouldHidePlayerCursor({ isTouch: false, playing: false, chromeOpen: false, idle: true })
        ).toBe(false)
    })
})

describe('shouldShowPlayerChrome', () => {
    const hidden = {
        chromePaused: false,
        intro: false,
        hoverTop: false,
        hoverBottom: false,
        tapped: false,
    }

    it('sul telefono resta nascosta finché non tocchi', () => {
        expect(shouldShowPlayerChrome(hidden)).toBe(false)
        expect(shouldShowPlayerChrome({ ...hidden, tapped: true })).toBe(true)
    })

    it('si nasconde se c’è l’overlay prossima puntata', () => {
        expect(shouldShowPlayerChrome({ ...hidden, tapped: true, chromePaused: true })).toBe(false)
    })
})

describe('shouldShowNextButton', () => {
    it('negli ultimi minuti resta solo Prossima, a chrome chiuso', () => {
        expect(
            shouldShowNextButton({
                chromePaused: false,
                pinNext: true,
                chromeOpen: false,
                hasNext: true,
            })
        ).toBe(true)
        expect(
            shouldShowPlayerChrome({
                chromePaused: false,
                intro: false,
                hoverTop: false,
                hoverBottom: false,
                tapped: false,
            })
        ).toBe(false)
    })

    it('segue il chrome quando non è ancorata', () => {
        expect(
            shouldShowNextButton({
                chromePaused: false,
                pinNext: false,
                chromeOpen: false,
                hasNext: true,
            })
        ).toBe(false)
        expect(
            shouldShowNextButton({
                chromePaused: false,
                pinNext: false,
                chromeOpen: true,
                hasNext: true,
            })
        ).toBe(true)
    })

    it('sparisce con l’overlay di fine puntata o senza episodio successivo', () => {
        expect(
            shouldShowNextButton({
                chromePaused: true,
                pinNext: true,
                chromeOpen: false,
                hasNext: true,
            })
        ).toBe(false)
        expect(
            shouldShowNextButton({
                chromePaused: false,
                pinNext: true,
                chromeOpen: false,
                hasNext: false,
            })
        ).toBe(false)
    })
})
