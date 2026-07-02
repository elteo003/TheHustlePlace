import { describe, expect, it } from 'vitest'
import { isNavLinkActive } from '@/components/ui/nav-indicator-link'

describe('isNavLinkActive', () => {
    it('evidenzia Film su /movie/[id]', () => {
        expect(isNavLinkActive('/movie/42', '/movies')).toBe(true)
        expect(isNavLinkActive('/movie/42', '/tv')).toBe(false)
    })

    it('evidenzia Serie TV su /series/[id]', () => {
        expect(isNavLinkActive('/series/99', '/tv')).toBe(true)
    })

    it('non confonde home con altre route', () => {
        expect(isNavLinkActive('/movies', '/home')).toBe(false)
        expect(isNavLinkActive('/home', '/home')).toBe(true)
    })
})
