'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Info, X } from 'lucide-react'
import Image from 'next/image'
import { springTransition } from '@/lib/motion'
import { ContentType } from '@/lib/content-navigation'

interface ContentActionSheetProps {
    open: boolean
    onClose: () => void
    title: string
    overview?: string
    posterUrl: string
    onPlay: () => void
    onDetails: () => void
    contentType: ContentType
}

export function ContentActionSheet({
    open,
    onClose,
    title,
    overview,
    posterUrl,
    onPlay,
    onDetails,
    contentType,
}: ContentActionSheetProps) {
    useEffect(() => {
        if (!open) return
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = prev
        }
    }, [open])

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.button
                        type="button"
                        aria-label="Chiudi"
                        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                    />
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label={title}
                        className="fixed inset-x-0 bottom-0 z-[61] rounded-t-2xl border border-white/10 bg-zinc-950/95 backdrop-blur-xl"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={springTransition}
                    >
                        <div className="mx-auto w-12 h-1 rounded-full bg-white/20 mt-3 mb-4" />
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                            aria-label="Chiudi pannello"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="px-5 pb-8 pt-2 flex gap-4">
                            <div className="relative w-24 h-36 flex-shrink-0">
                                <Image
                                    src={posterUrl}
                                    alt=""
                                    fill
                                    className="object-cover rounded-lg shadow-lg"
                                    sizes="96px"
                                />
                            </div>
                            <div className="flex-1 min-w-0 pt-1">
                                <p className="text-xs uppercase tracking-wider text-white/50 mb-1">
                                    {contentType === 'tv' ? 'Serie TV' : 'Film'}
                                </p>
                                <h3 className="text-lg font-semibold text-white leading-tight line-clamp-2 pr-8">
                                    {title}
                                </h3>
                                {overview && (
                                    <p className="text-sm text-white/60 mt-2 line-clamp-3 leading-relaxed">
                                        {overview}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="px-5 pb-8 flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    onPlay()
                                    onClose()
                                }}
                                className="flex-1 btn-play flex items-center justify-center gap-2"
                            >
                                <Play className="w-4 h-4 fill-current" />
                                Guarda
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    onDetails()
                                    onClose()
                                }}
                                className="flex-1 btn-ghost-outline flex items-center justify-center gap-2"
                            >
                                <Info className="w-4 h-4" />
                                Dettagli
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
