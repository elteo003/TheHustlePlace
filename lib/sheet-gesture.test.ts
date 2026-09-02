import { describe, expect, it } from 'vitest'
import { shouldDismissSheet } from '@/lib/sheet-gesture'

describe('shouldDismissSheet', () => {
    it('chiude oltre la soglia di distanza', () => {
        expect(shouldDismissSheet(81, 0)).toBe(true)
        expect(shouldDismissSheet(80, 0)).toBe(false)
    })

    it('chiude con un flick anche su poca distanza', () => {
        expect(shouldDismissSheet(20, 501)).toBe(true)
        expect(shouldDismissSheet(20, 500)).toBe(false)
    })
})
