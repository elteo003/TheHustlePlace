'use client'

import Image from 'next/image'
import { ContentType, getContentId } from '@/lib/content-navigation'
import { getContentPosterUrl, resolveContentType } from '@/lib/content-display'
import { tvItemTitle } from '@/tv/lib/title'
import { TvRailItem } from '@/tv/lib/types'
import { TvFocus } from '@/tv/components/TvFocus'
import { cn } from '@/lib/utils'

interface TvPosterProps {
    item: TvRailItem
    type?: ContentType
    autoFocusItem?: boolean
    onSelect: (id: number, type: ContentType) => void
    onPeek?: (id: number, type: ContentType) => void
    progress?: number
}

export function TvPoster({ item, type, autoFocusItem, onSelect, onPeek, progress }: TvPosterProps) {
    const resolved = resolveContentType(item, type)
    const id = getContentId(item)
    const title = tvItemTitle(item, resolved)

    return (
        <TvFocus
            autoFocusItem={autoFocusItem}
            onClick={() => onSelect(id, resolved)}
            onFocus={() => onPeek?.(id, resolved)}
            className={cn('relative w-[11.5rem] shrink-0 overflow-hidden rounded-lg bg-zinc-900 text-left')}
        >
            <div className="relative aspect-[2/3]">
                <Image
                    src={getContentPosterUrl(item.poster_path)}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="184px"
                />
                {progress != null && progress > 0 && (
                    <span className="absolute inset-x-0 bottom-0 h-1.5 bg-white/20">
                        <span className="block h-full bg-red-600" style={{ width: `${Math.min(100, progress)}%` }} />
                    </span>
                )}
            </div>
            <p className="sr-only">{title}</p>
        </TvFocus>
    )
}
