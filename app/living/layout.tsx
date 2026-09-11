import type { ReactNode } from 'react'
import { TvApp } from '@/tv/components/TvApp'

export default function LivingLayout({ children }: { children: ReactNode }) {
    return <TvApp>{children}</TvApp>
}
