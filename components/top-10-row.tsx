'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ContentType, getContentId } from '@/lib/content-navigation'
import { ContentItem, getContentTitle, resolveContentType } from '@/lib/content-display'
import { CustomScrollbar } from '@/components/custom-scrollbar'
import { ContentHoverCard } from '@/components/content-hover-card'
import { useIsCoarsePointer } from '@/hooks/useMediaQuery'

interface Top10RowProps {
    items: ContentItem[]
    type?: ContentType
    onPlay?: (id: number, type?: ContentType) => void
    onDetails?: (id: number, type?: ContentType) => void
}

export function Top10Row({ items, type = 'movie', onPlay, onDetails }: Top10RowProps) {
    const isTouch = useIsCoarsePointer()
    const [expandedId, setExpandedId] = useState<number | null>(null)

    return (
        <CustomScrollbar className="pb-6" containerClassName="items-end gap-1 sm:gap-2">
            {items.map((item, index) => {
                const rank = index + 1
                const itemType = resolveContentType(item, type)
                const itemId = getContentId(item)
                const title = getContentTitle(item, itemType)

                return (
                    <motion.div
                        key={itemId}
                        className={`relative flex-shrink-0 flex items-end ${
                            expandedId === itemId ? 'z-30' : 'z-0 hover:z-20'
                        }`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.35,
                            delay: index * 0.04,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                    >
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

                        <ContentHoverCard
                            item={item}
                            type={itemType}
                            variant="top10"
                            isExpanded={!isTouch && expandedId === itemId}
                            onExpand={() => setExpandedId(itemId)}
                            onCollapse={() => setExpandedId(null)}
                            onPlay={onPlay}
                            onDetails={onDetails}
                        />

                        <span className="sr-only">
                            {rank}. {title}
                        </span>
                    </motion.div>
                )
            })}
        </CustomScrollbar>
    )
}
