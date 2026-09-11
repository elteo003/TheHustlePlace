'use client'

import { ContentType, getContentId } from '@/lib/content-navigation'
import { resolveContentType } from '@/lib/content-display'
import { tvItemTitle } from '@/tv/lib/title'
import { TvRailItem } from '@/tv/lib/types'
import { getTMDBImageUrl } from '@/lib/tmdb'
import { TvFocus } from '@/tv/components/TvFocus'

interface TvHeroProps {
    item: TvRailItem | null
    type?: ContentType
    onPlay: (id: number, type: ContentType) => void
    onDetails: (id: number, type: ContentType) => void
}

export function TvHero({ item, type, onPlay, onDetails }: TvHeroProps) {
    if (!item) {
        return <div className="h-[22rem] rounded-2xl bg-zinc-950" />
    }

    const resolved = resolveContentType(item, type)
    const id = getContentId(item)
    const title = tvItemTitle(item, resolved)
    const backdrop = item.backdrop_path
        ? getTMDBImageUrl(item.backdrop_path, 'original')
        : getTMDBImageUrl(item.poster_path ?? null, 'original')

    return (
        <section className="relative isolate h-[22rem] overflow-hidden rounded-2xl bg-zinc-950">
            {backdrop && (
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-45"
                    style={{ backgroundImage: `url(${backdrop})` }}
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
            <div className="relative z-10 flex h-full max-w-3xl flex-col justify-end p-10">
                <h1 className="text-5xl font-semibold text-white">{title}</h1>
                {item.overview && (
                    <p className="mt-3 line-clamp-3 text-lg leading-relaxed text-white/65">{item.overview}</p>
                )}
                <div className="mt-6 flex gap-3">
                    <TvFocus
                        autoFocusItem
                        onClick={() => onPlay(id, resolved)}
                        className="h-14 rounded-lg bg-white px-8 text-lg font-semibold text-black"
                    >
                        Riproduci
                    </TvFocus>
                    <TvFocus
                        onClick={() => onDetails(id, resolved)}
                        className="h-14 rounded-lg bg-white/15 px-8 text-lg text-white"
                    >
                        Scheda
                    </TvFocus>
                </div>
            </div>
        </section>
    )
}
