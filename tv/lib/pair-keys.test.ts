import { describe, expect, it } from 'vitest'
import { appendPairChar } from '@/tv/lib/pair-keys'

describe('pair pad', () => {
    it('accetta solo l’alfabeto del codice e ferma a 8', () => {
        expect(appendPairChar('AB3K', '2')).toBe('AB3K2')
        expect(appendPairChar('AB3K2QP9', 'X')).toBe('AB3K2QP9')
        expect(appendPairChar('AB', 'I')).toBe('AB')
    })
})
