'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ContentType, getContentId } from '@/lib/content-navigation'
import { ContentItem, getContentPosterUrl, getContentTitle, resolveContentType } from '@/lib/content-display'
import { CustomScrollbar } from '@/components/custom-scrollbar'
import { ContentActionSheet } from '@/components/ui/content-action-sheet'
import { PosterTransition } from '@/components/ui/poster-transition'
import { DetailLink } from '@/components/ui/detail-link'
import { useIsCoarsePointer } from '@/hooks/useMediaQuery'

interface Top10RowProps {
    items: ContentItem[]
    type?: ContentType
    onPlay?: (id: number, type?: ContentType) => void
    onDetails?: (id: number, type?: ContentType) => void
}

export function Top10Row({ items, type = 'movie', onPlay, onDetails }: Top10RowProps) {
    const isTouch = useIsCoarsePointer()
    const [sheetItem, setSheetItem] = useState<ContentItem | null>(null)

    const handleActivate = (item: ContentItem, itemType: ContentType) => {
        if (isTouch) {
            setSheetItem(item)
            return
        }
        onDetails?.(getContentId(item), itemType)
    }

    return (
        <>
            <CustomScrollbar className="pb-6" containerClassName="items-end gap-1 sm:gap-2">
                {items.map((item, index) => {
                    const rank = index + 1
                    const itemType = resolveContentType(item, type)
                    const itemId = getContentId(item)
                    const title = getContentTitle(item, itemType)

                    return (
                        <motion.div
                            key={item.id}
                            className="relative flex-shrink-0 flex items-end group"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.35,
                                delay: index * 0.04,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                            onClick={isTouch ? () => handleActivate(item, itemType) : undefined}
                            onKeyDown={
                                isTouch
                                    ? (e) => {
                                          if (e.key === 'Enter' || e.key === ' ') {
                                              e.preventDefault()
                                              handleActivate(item, itemType)
                                          }
                                      }
                                    : undefined
                            }
                            role={isTouch ? 'button' : undefined}
                            tabIndex={isTouch ? 0 : undefined}
                            aria-label={isTouch ? `${rank}. ${title}` : undefined}
                        >
                            {/* Netflix-style rank numeral */}
                            <span
                                className="select-none font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-zinc-500 to-zinc-800 -mr-3 sm:-mr-5 z-0 pointer-events-none"
                                style={{
                                    fontSize: 'clamp(4rem, 12vw, 7rem)',
                                    WebkitTextStroke: '2px rgba(255,255,255,0.12)',
                                }}
                                aria-hidden
                            >
                                {rank}
                            </span>

                            <DetailLink
                                id={itemId}
                                type={itemType}
                                className="relative w-[120px] sm:w-[140px] md:w-[160px] aspect-[2/3] rounded-md overflow-hidden shadow-xl transition-transform duration-300 ease-spring group-hover:scale-105 group-hover:z-10 focus-within:ring-2 focus-within:ring-white/40 block"
                                onClick={(e) => {
                                    if (isTouch) e.preventDefault()
                                }}
                            >
                                <PosterTransition
                                    type={itemType}
                                    id={itemId}
                                    className="absolute inset-0"
                                >
                                    <Image
                                        src={getContentPosterUrl(item.poster_path)}
                                        alt={title}
                                        fill
                                        className="object-cover"
                                        sizes="160px"
                                    />
                                </PosterTransition>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                                {!isTouch && onPlay && (
                                    <button
                                        type="button"
                                        className="absolute bottom-2 left-2 right-2 btn-play text-sm py-2 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200 z-10"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            onPlay(itemId, itemType)
                                        }}
                                        aria-label={`Guarda ${title}`}
                                    >
                                        Guarda
                                    </button>
                                )}
                            </DetailLink>
                        </motion.div>
                    )
                })}
            </CustomScrollbar>

            {sheetItem && (
                <ContentActionSheet
                    open={!!sheetItem}
                    onClose={() => setSheetItem(null)}
                    title={getContentTitle(sheetItem, resolveContentType(sheetItem, type))}
                    overview={sheetItem.overview}
                    posterUrl={getContentPosterUrl(sheetItem.poster_path)}
                    contentType={resolveContentType(sheetItem, type)}
                    onPlay={() =>
                        onPlay?.(getContentId(sheetItem), resolveContentType(sheetItem, type))
                    }
                    onDetails={() =>
                        onDetails?.(getContentId(sheetItem), resolveContentType(sheetItem, type))
                    }
                />
            )}
        </>
    )
}
