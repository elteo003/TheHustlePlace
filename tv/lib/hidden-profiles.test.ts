import { describe, expect, it } from 'vitest'
import { hideTvProfileId, readHiddenTvProfileIds, withoutHiddenTvProfiles } from '@/tv/lib/hidden-profiles'

describe('hidden tv profiles', () => {
    it('nasconde un profilo solo in lista locale', () => {
        expect(readHiddenTvProfileIds('["a","local"]')).toEqual(['a'])
        expect(hideTvProfileId(['a'], 'b')).toEqual(['a', 'b'])
        expect(
            withoutHiddenTvProfiles(
                [
                    { id: 'a', name: 'TEO' },
                    { id: 'b', name: 'Ospite' },
                ],
                ['b']
            ).map((item) => item.id)
        ).toEqual(['a'])
    })
})
