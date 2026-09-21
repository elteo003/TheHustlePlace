'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ContentType, getContentId } from '@/lib/content-navigation'
import { ContentItem, getContentTitle, resolveContentType } from '@/lib/content-display'
import { CustomScrollbar } from '@/components/custom-scrollbar'
import { ContentHoverCard } from '@/components/content-hover-card'
import { TrailerDock } from '@/components/trailer-dock'
import { useRowPeek } from '@/contexts/trailer-peek-context'
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
    const { peekId, isPosterHidden, onPeek, onClose, onExited } = useRowPeek()
    const peekItem = items.find((item) => getContentId(item) === peekId) ?? null

    return (
        <div>
            <CustomScrollbar className="pb-6" containerClassName="items-end gap-1 sm:gap-2 pl-4 sm:pl-5">
                {items.map((item, index) => {
                const rank = index + 1
                const itemType = resolveContentType(item, type)
                const itemId = getContentId(item)
                const title = getContentTitle(item, itemType)
                const isOne = rank === 1

                return (
                    <motion.div
                        key={itemId}
                        className={`relative flex-shrink-0 flex items-end ${
                            expandedId === itemId || peekId === itemId ? 'z-30' : 'z-0 hover:z-20'
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
                            className={`relative z-0 inline-block select-none shrink-0 overflow-hidden font-black leading-none pointer-events-none ${
                                isOne ? 'mr-0' : '-mr-3 sm:-mr-5'
                            }`}
                            style={{
                                fontSize: 'clamp(4rem, 12vw, 7rem)',
                                color: '#a1a1aa',
                                minWidth: isOne ? '0.58em' : undefined,
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
                            onPeek={() => onPeek(itemId)}
                            isPeeking={isPosterHidden(itemId)}
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
            <TrailerDock
                item={isTouch ? peekItem : null}
                type={peekItem ? resolveContentType(peekItem, type) : type}
                onClose={onClose}
                onExited={onExited}
                onPlay={onPlay}
                onDetails={onDetails}
            />
        </div>
    )
}
