import { describe, expect, it } from 'vitest'
import { readPageScrollMetrics } from '@/lib/page-scroll'

describe('readPageScrollMetrics', () => {
    it('usa window.scrollY e l\'altezza massima, come su iOS', () => {
        const metrics = readPageScrollMetrics(
            { innerHeight: 800, scrollY: 240 },
            {
                documentElement: { scrollHeight: 800, offsetHeight: 800, scrollTop: 0 },
                body: { scrollHeight: 2400, offsetHeight: 2400, scrollTop: 240 },
            }
        )

        expect(metrics.canScroll).toBe(true)
        expect(metrics.scrollTop).toBe(240)
        expect(metrics.scrollHeight).toBe(2400)
    })

    it('non mostra la barra se la pagina non scorre', () => {
        const metrics = readPageScrollMetrics(
            { innerHeight: 800, scrollY: 0 },
            {
                documentElement: { scrollHeight: 800, offsetHeight: 800, scrollTop: 0 },
                body: { scrollHeight: 800, offsetHeight: 800, scrollTop: 0 },
            }
        )

        expect(metrics.canScroll).toBe(false)
    })
})
