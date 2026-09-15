import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Stili player',
    robots: { index: false, follow: false },
}

export default function PlayerSkinsLayout({ children }: { children: React.ReactNode }) {
    return children
}
