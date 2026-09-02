import { describe, expect, it } from 'vitest'
import { formatPairCode, generatePairCode, isValidPairCode, normalizePairCode, splitPairCode } from '@/lib/pair-code'

describe('pair-code', () => {
    it('genera 8 caratteri senza 0 O 1 I', () => {
        const code = generatePairCode()
        expect(code).toHaveLength(8)
        expect(code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/)
    })

    it('formatta con trattino', () => {
        expect(formatPairCode('7K4M2QP9')).toBe('7K4M-2QP9')
    })

    it('spezza il codice in due gruppi da quattro', () => {
        expect(splitPairCode('7K4M2QP9')).toEqual({ left: '7K4M', right: '2QP9' })
        expect(splitPairCode('7K4M')).toEqual({ left: '7K4M', right: '' })
    })

    it('normalizza spazi e minuscole', () => {
        expect(normalizePairCode('7k4m 2qp9')).toBe('7K4M2QP9')
        expect(isValidPairCode('7k4m-2qp9')).toBe(true)
        expect(isValidPairCode('ABC')).toBe(false)
    })
})
